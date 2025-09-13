# -*- coding: utf-8 -*-

import os
import json
import re
from datetime import datetime

def generate_filename(selector_type, extract_type, language):
    """Генерация имени файла на основе текущей даты и параметров парсинга"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    base_name = f"parsed_data_{timestamp}"
    
    # Добавляем информацию о языке
    if language != "unknown":
        base_name += f"_{language}"
    
    # Добавляем информацию о типе селектора и извлечения
    base_name += f"_{selector_type}_{extract_type}"
    
    # Ограничиваем длину имени файла
    if len(base_name) > 100:
        base_name = base_name[:100]
    
    # Заменяем недопустимые символы
    base_name = re.sub(r'[\\/*?:"<>|]', "_", base_name)
    
    return base_name