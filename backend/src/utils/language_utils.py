# -*- coding: utf-8 -*-

import re
from langdetect import detect, LangDetectException
import chardet

def detect_language(text):
    """Определение языка текста"""
    try:
        # Берем достаточно большой образец текста для точного определения
        sample_text = text[:500] if len(text) > 500 else text
        if sample_text.strip():
            return detect(sample_text)
        return "unknown"
    except LangDetectException:
        return "unknown"

def ensure_russian_language(html, encoding='utf-8'):
    """Дополнительная проверка и обеспечение правильного отображения русского текста"""
    try:
        if not html:
            return html
            
        # Проверяем наличие кириллических символов в HTML
        cyrillic_pattern = re.compile(r'[А-Яа-яЁё]')
        has_cyrillic = bool(cyrillic_pattern.search(html))
        
        if has_cyrillic:
            # Если есть кириллические символы, пытаемся исправить кодировку
            try:
                # Пробуем декодировать и перекодировать для исправления возможных проблем
                decoded_html = html.encode('latin-1').decode('windows-1251')
                return decoded_html
            except:
                try:
                    decoded_html = html.encode('latin-1').decode('cp866')
                    return decoded_html
                except:
                    # Если не получилось, возвращаем исходный HTML
                    return html
        return html
    except Exception as e:
        print(f"Ошибка при проверке русского языка: {e}")
        return html

def detect_encoding(content):
    """Определение кодировки контента"""
    try:
        result = chardet.detect(content)
        return result['encoding'] or 'utf-8'
    except:
        return 'utf-8'