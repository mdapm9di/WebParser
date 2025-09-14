# -*- coding: utf-8 -*-

from flask import Flask, request, jsonify
from flask_cors import CORS
from src.core.parser import AdvancedWebParser
from src.utils.file_utils import generate_filename
from collections import OrderedDict
import json
import os
import traceback



app = Flask(__name__)
CORS(app)



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
        
        if not urls:
            return jsonify({'error': 'Введите хотя бы один URL'}), 400
        
        if not selector_values:
            return jsonify({'error': 'Введите значения для селектора'}), 400
        
        if isinstance(extract_types, str):
            extract_types = [extract_types]
        
        results = parse_urls_thread(urls, selector_type, selector_values, extract_types)
        
        response = app.response_class(
            response=json.dumps({
                'results': results,
                'filename': generate_filename(selector_type, "_".join(extract_types), "multi"),
                'status': 'success'
            }, ensure_ascii=False, sort_keys=False),
            status=200,
            mimetype='application/json'
        )
        return response
        
    except Exception as e:
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500



def parse_urls_thread(urls, selector_type, selector_values, extract_types):
    all_results = []
    
    for url in urls:
        try:
            html, encoding = parser.get_page_content(parser.session, url)
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
            page_text = soup.get_text()
            language = parser.detect_language(page_text)
            
            if language == 'ru':
                from src.utils.language_utils import ensure_russian_language
                html = ensure_russian_language(html, encoding or 'utf-8')
            
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



if __name__ == '__main__':
    debug = os.environ.get('FLASK_ENV') != 'production'
    app.run(debug=debug, host='0.0.0.0', port=5000, use_reloader=debug)