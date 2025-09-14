<<<<<<< HEAD
# -*- coding: utf-8 -*-

import os
import json
import re
from datetime import datetime

def generate_filename(selector_type, extract_type, language):
    """Генерация имени файла на основе текущей даты и параметров парсинга"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    base_name = f"parsed_data_{timestamp}"
    
    if language != "unknown":
        base_name += f"_{language}"
    
    base_name += f"_{selector_type}_{extract_type}"
    
    if len(base_name) > 100:
        base_name = base_name[:100]
    
    base_name = re.sub(r'[\\/*?:"<>|]', "_", base_name)
    
=======
# -*- coding: utf-8 -*-

import os
import json
import re
from datetime import datetime

def generate_filename(selector_type, extract_type, language):
    """Генерация имени файла на основе текущей даты и параметров парсинга"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    base_name = f"parsed_data_{timestamp}"
    
    if language != "unknown":
        base_name += f"_{language}"
    
    base_name += f"_{selector_type}_{extract_type}"
    
    if len(base_name) > 100:
        base_name = base_name[:100]
    
    base_name = re.sub(r'[\\/*?:"<>|]', "_", base_name)
    
>>>>>>> db3846bf44b3226c4095a015d7a96d1f900c7abe
    return base_name