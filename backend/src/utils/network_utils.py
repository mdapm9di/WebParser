# -*- coding: utf-8 -*-

import requests
from .language_utils import detect_encoding

def create_session():
    """Создание HTTP сессии с настройками"""
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
    })
    return session

def get_page_content(session, url):
    """Загрузка содержимого страницы с определением кодировки"""
    try:
        print("Загрузка страницы...")
        response = session.get(url, timeout=15)
        response.raise_for_status()
        
        encoding = detect_encoding(response.content)
        if not encoding:
            encoding = 'utf-8'
            
        html = response.content.decode(encoding, errors='replace')
        
        print(f"Страница загружена, кодировка: {encoding}")
        return html, encoding
    except Exception as e:
        print(f"Ошибка при загрузке страницы: {e}")
        return None, 'utf-8'