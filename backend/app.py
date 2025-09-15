# -*- coding: utf-8 -*-

import os
import sys
import io
import locale
import json
import traceback
import subprocess
from collections import OrderedDict

from flask import Flask, request, jsonify
from flask_cors import CORS

# Принудительно устанавливаем кодировку UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Пытаемся установить локаль
try:
    if sys.platform.startswith('win'):
        locale.setlocale(locale.LC_ALL, 'rus_rus')
    else:
        locale.setlocale(locale.LC_ALL, 'ru_RU.UTF-8')
except:
    # Если не удалось установить локаль, продолжаем без нее
    pass

app = Flask(__name__)
CORS(app)

# Middleware для установки UTF-8 кодировки
@app.after_request
def after_request(response):
    response.headers['Content-Type'] = 'application/json; charset=utf-8'
    return response

try:
    from src.core.parser import AdvancedWebParser
    from src.utils.file_utils import generate_filename
    parser = AdvancedWebParser()
except ImportError as e:
    print(f"Import error: {e}")
    # Создаем заглушки для случаев, когда модули не найдены
    class AdvancedWebParser:
        def get_page_content_playwright(self, url):
            return "<html></html>", "utf-8"
        def get_page_content(self, session, url):
            return "<html></html>", "utf-8"
        def detect_language(self, text):
            return "en"
        def parse_elements(self, html, selector_type, selector_values, extract_type):
            return []
    
    def generate_filename(*args):
        return "output.json"
    
    parser = AdvancedWebParser()

@app.route('/')
def index():
    return jsonify({'status': 'ok', 'message': 'Web Parser API is running'})

@app.route('/parse', methods=['POST'])
def parse_urls():
    try:
        data = request.get_json()
        
        urls = data.get('urls', [])
        selector_type = data.get('selector_type', 'tag')
        selector_values = data.get('selector_values', [])
        extract_types = data.get('extract_types', ['text'])
        parse_mode = data.get('parse_mode', 'playwright')
        
        if not urls:
            return jsonify({'error': 'Введите хотя бы один URL'}), 400
        
        if not selector_values:
            return jsonify({'error': 'Введите значения для селектора'}), 400
        
        if isinstance(extract_types, str):
            extract_types = [extract_types]
        
        results = parse_urls_thread(urls, selector_type, selector_values, extract_types, parse_mode)
        
        response = app.response_class(
            response=json.dumps({
                'results': results,
                'filename': generate_filename(selector_type, "_".join(extract_types), "multi"),
                'status': 'success'
            }, ensure_ascii=False, sort_keys=False),
            status=200,
            mimetype='application/json; charset=utf-8'
        )
        return response
        
    except Exception as e:
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500

def parse_urls_thread(urls, selector_type, selector_values, extract_types, parse_mode):
    all_results = []
    
    for url in urls:
        try:
            if parse_mode == 'playwright':
                html, encoding = parser.get_page_content_playwright(url)
            else:
                html, encoding = parser.get_page_content(getattr(parser, 'session', None), url)
                
            if not html:
                all_results.append(OrderedDict([
                    ("url", url),
                    ("error", "Не удалось загрузить страницу"),
                    ("items_found", 0),
                    ("result", [])
                ]))
                continue
            
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html, 'html.parser')
            
            if not soup.find_all(selector_values[0] if selector_values else []):
                if parse_mode == 'playwright':
                    html, encoding = parser.get_page_content_playwright(url)
                else:
                    html, encoding = parser.get_page_content(getattr(parser, 'session', None), url)
                soup = BeautifulSoup(html, 'html.parser')
            
            page_text = soup.get_text()
            language = parser.detect_language(page_text)
            
            if language == 'ru':
                try:
                    from src.utils.language_utils import ensure_russian_language
                    html = ensure_russian_language(html, encoding or 'utf-8')
                except ImportError:
                    pass  # Пропускаем, если модуль не найден
            
            all_formatted_results = []
            for extract_type in extract_types:
                results = parser.parse_elements(html, selector_type, selector_values, extract_type)
                
                for result in results:
                    content = result.get('structure', [])
                    warning = result.get('warning', '')
                    
                    if not content:
                        continue
                    
                    formatted_result = OrderedDict([
                        ("type", extract_type),
                        ("tag", result.get('tag')),
                        ("class", result.get('class')),
                        ("id", result.get('id')),
                    ])
                    
                    formatted_result["structure"] = content
                    
                    if warning:
                        formatted_result["warning"] = warning
                    
                    all_formatted_results.append(formatted_result)
            
            all_results.append(OrderedDict([
                ("url", url),
                ("items_found", len(all_formatted_results)),
                ("result", all_formatted_results)
            ]))
                
        except Exception as e:
            print(f"Ошибка при парсинге {url}: {str(e)}")
            traceback.print_exc()
            all_results.append(OrderedDict([
                ("url", url),
                ("error", str(e)),
                ("items_found", 0),
                ("result", [])
            ]))
    
    return all_results

def install_playwright_browsers():
    """Установка браузеров Playwright с правильной кодировкой"""
    try:
        # Пытаемся использовать Python для установки
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            browser.close()
        print("Playwright браузеры уже установлены")
        return True
    except Exception as e:
        print("Установка браузеров Playwright...")
        
        # Устанавливаем переменные окружения для правильной кодировки
        env = os.environ.copy()
        env['PYTHONIOENCODING'] = 'utf-8'
        
        if sys.platform.startswith('win'):
            env['CHCP'] = '65001'  # Устанавливаем кодовую страницу UTF-8 для Windows
        
        # Запускаем установку браузеров
        result = subprocess.run(
            [sys.executable, '-m', 'playwright', 'install', '--with-deps'], 
            capture_output=True, 
            text=True, 
            encoding='utf-8',
            env=env
        )
        
        if result.returncode == 0:
            print("Браузеры Playwright успешно установлены")
            return True
        else:
            error_msg = result.stderr if result.stderr else "Неизвестная ошибка"
            print(f"Ошибка установки браузеров: {error_msg}")
            return False

if __name__ == '__main__':
    # Устанавливаем браузеры Playwright
    install_playwright_browsers()
    
    # Запускаем Flask приложение
    debug = os.environ.get('FLASK_ENV') != 'production'
    app.run(debug=debug, host='0.0.0.0', port=5000, use_reloader=debug)