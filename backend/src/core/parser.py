# -*- coding: utf-8 -*-

import re

from bs4 import BeautifulSoup, NavigableString, Comment
from urllib.parse import urljoin, urlparse
from collections import OrderedDict

from src.utils.network_utils import get_page_content, create_session
from src.utils.language_utils import detect_language, ensure_russian_language


class AdvancedWebParser:
    def __init__(self):
        self.session = create_session()
        self.results = []
        self.language = "unknown"
        self.encoding = "utf-8"
        
    def parse_elements(self, html, selector_type, selector_values, extract_type, attribute=None):
        """Парсинг элементов по выбранным селекторам с улучшенным форматированием"""
        try:
            soup = BeautifulSoup(html, 'html.parser')
            all_elements = []
            
            for selector_value in selector_values:
                elements = []
                
                if selector_type == 'tag':
                    elements = soup.find_all(selector_value)
                elif selector_type == 'class':
                    if selector_value and selector_value.startswith('.'):
                        selector_value = selector_value[1:]
                    elements = soup.find_all(class_=selector_value)
                elif selector_type == 'id':
                    if selector_value and selector_value.startswith('#'):
                        selector_value = selector_value[1:]
                    element = soup.find(id=selector_value)
                    if element:
                        elements = [element]
                
                for elem in elements:
                    elem_info = OrderedDict([
                        ('element', elem),
                        ('selector_type', selector_type),
                        ('selector_value', selector_value)
                    ])
                    all_elements.append(elem_info)
            
            seen_elements = set()
            unique_elements = []
            for elem_info in all_elements:
                elem_str = str(elem_info['element'])
                if elem_str not in seen_elements:
                    seen_elements.add(elem_str)
                    unique_elements.append(elem_info)
            
            extracted_data = []
            for elem_info in unique_elements:
                elem = elem_info['element']
                selector_type = elem_info['selector_type']
                selector_value = elem_info['selector_value']
                
                element_classes = elem.get('class', [])
                element_id = elem.get('id', '')
                
                result_data = OrderedDict([
                    ('type', extract_type),
                    ('tag', elem.name),
                    ('class', ' '.join(element_classes) if element_classes else None),
                    ('id', element_id if element_id else None),
                    ('warning', None)
                ])
                
                if selector_type in ['class', 'id']:
                    if extract_type == 'image' and elem.name != 'img':
                        result_data['warning'] = f"Элемент с {selector_type} '{selector_value}' не является тегом img, а является {elem.name}. Изображение не будет извлечено."
                    elif extract_type == 'video' and elem.name != 'video':
                        result_data['warning'] = f"Элемент с {selector_type} '{selector_value}' не является тегом video, а является {elem.name}. Видео не будет извлечено."
                
                if extract_type == 'text':
                    structure = self.get_children_structure(elem)
                    if structure:
                        result_data['structure'] = structure
                elif extract_type == 'image':
                    if result_data['warning'] is None:
                        img_data = self.extract_image_data(elem)
                        if img_data:
                            result_data['structure'] = img_data
                elif extract_type == 'video':
                    if result_data['warning'] is None:
                        video_data = self.extract_video_data(elem)
                        if video_data:
                            result_data['structure'] = video_data
                
                extracted_data.append(result_data)
            
            return extracted_data
        except Exception as e:
            print(f"Ошибка при парсинге элементов: {e}")
            return []
    
    def get_children_structure(self, element):
        """Рекурсивное извлечение структуры всех вложенных элементов"""
        structure = []
        
        def process_node(node, depth=0):
            """Рекурсивная обработка узла и его потомков"""
            if isinstance(node, Comment):
                return
                
            if isinstance(node, NavigableString):
                text = node.strip()
                if text:
                    parent = node.parent
                    if parent and parent.name:
                        classes = parent.get('class', [])
                        class_str = ' '.join(classes) if classes else None
                        id_str = parent.get('id', None)
                        
                        structure.append(OrderedDict([
                            ('tag', parent.name),
                            ('class', class_str),
                            ('id', id_str),
                            ('txt', text),
                            ('depth', depth)
                        ]))
                return
            
            if node.name in ['script', 'style', 'noscript']:
                return
                
            if node.name and node.find_all(recursive=False):
                for child in node.children:
                    process_node(child, depth + 1)
            else:
                text = node.get_text(separator=' ', strip=True)
                if text:
                    classes = node.get('class', [])
                    class_str = ' '.join(classes) if classes else None
                    id_str = node.get('id', None)
                    
                    structure.append(OrderedDict([
                        ('tag', node.name),
                        ('class', class_str),
                        ('id', id_str),
                        ('txt', text),
                        ('depth', depth)
                    ]))
        
        for child in element.children:
            process_node(child)
            
        return structure
    
    def extract_image_data(self, element):
        """Извлечение данных об изображении - возвращает структуру с src"""
        try:
            structure = []
            
            if element.name == 'img':
                src = element.get('src', '')
                srcset = element.get('srcset', '')
                classes = element.get('class', [])
                class_str = ' '.join(classes) if classes else None
                id_str = element.get('id', '')
                
                if src:
                    structure.append(OrderedDict([
                        ('tag', 'img'),
                        ('class', class_str),
                        ('id', id_str),
                        ('src', src)
                    ]))
                
                if srcset:
                    srcset_urls = [url.strip().split(' ')[0] for url in srcset.split(',') if url.strip()]
                    for url in srcset_urls:
                        structure.append(OrderedDict([
                            ('tag', 'img'),
                            ('class', class_str),
                            ('id', id_str),
                            ('src', url)
                        ]))
            else:
                images = element.find_all('img')
                for img in images:
                    src = img.get('src', '')
                    srcset = img.get('srcset', '')
                    classes = img.get('class', [])
                    class_str = ' '.join(classes) if classes else None
                    id_str = img.get('id', '')
                    
                    if src:
                        structure.append(OrderedDict([
                            ('tag', 'img'),
                            ('class', class_str),
                            ('id', id_str),
                            ('src', src)
                        ]))
                        
                    if srcset:
                        srcset_urls = [url.strip().split(' ')[0] for url in srcset.split(',') if url.strip()]
                        for url in srcset_urls:
                            structure.append(OrderedDict([
                                ('tag', 'img'),
                                ('class', class_str),
                                ('id', id_str),
                                ('src', url)
                            ]))
                
            return structure
        except Exception as e:
            print(f"Ошибка при извлечении данных изображения: {e}")
            return []
    
    def extract_video_data(self, element):
        """Извлечение данных о видео - возвращает структуру с src"""
        try:
            structure = []
            
            if element.name == 'video':
                src = element.get('src', '')
                poster = element.get('poster', '')
                classes = element.get('class', [])
                class_str = ' '.join(classes) if classes else None
                id_str = element.get('id', '')
                
                if src:
                    structure.append(OrderedDict([
                        ('tag', 'video'),
                        ('class', class_str),
                        ('id', id_str),
                        ('src', src)
                    ]))
                
                if poster:
                    structure.append(OrderedDict([
                        ('tag', 'video'),
                        ('class', class_str),
                        ('id', id_str),
                        ('src', poster)
                    ]))
                
                sources = element.find_all('source')
                for source in sources:
                    source_src = source.get('src', '')
                    source_classes = source.get('class', [])
                    source_class_str = ' '.join(source_classes) if source_classes else None
                    source_id = source.get('id', '')
                    
                    if source_src:
                        structure.append(OrderedDict([
                            ('tag', 'source'),
                            ('class', source_class_str),
                            ('id', source_id),
                            ('src', source_src)
                        ]))
            else:
                videos = element.find_all('video')
                for video in videos:
                    src = video.get('src', '')
                    poster = video.get('poster', '')
                    classes = video.get('class', [])
                    class_str = ' '.join(classes) if classes else None
                    id_str = video.get('id', '')
                    
                    if src:
                        structure.append(OrderedDict([
                            ('tag', 'video'),
                            ('class', class_str),
                            ('id', id_str),
                            ('src', src)
                        ]))
                    
                    if poster:
                        structure.append(OrderedDict([
                            ('tag', 'video'),
                            ('class', class_str),
                            ('id', id_str),
                            ('src', poster)
                        ]))
                    
                    sources = video.find_all('source')
                    for source in sources:
                        source_src = source.get('src', '')
                        source_classes = source.get('class', [])
                        source_class_str = ' '.join(source_classes) if source_classes else None
                        source_id = source.get('id', '')
                        
                        if source_src:
                            structure.append(OrderedDict([
                                ('tag', 'source'),
                                ('class', source_class_str),
                                ('id', source_id),
                                ('src', source_src)
                            ]))
                
            return structure
        except Exception as e:
            print(f"Ошибка при извлечении данных видео: {e}")
            return []
    
    def detect_language(self, text):
        """Определение языка текста"""
        try:
            if not text:
                return "unknown"
                
            sample_text = text[:500] if len(text) > 500 else text
            if sample_text.strip():
                from langdetect import detect
                return detect(sample_text)
            return "unknown"
        except:
            return "unknown"
    
    def get_page_content(self, session, url):
        """Загрузка содержимого страницы с определением кодировки"""
        from src.utils.network_utils import get_page_content as get_content
        return get_content(session, url)