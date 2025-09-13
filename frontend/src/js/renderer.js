const { ipcRenderer } = require('electron');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Базовый URL для API
const API_BASE = 'http://localhost:5000';

document.addEventListener('DOMContentLoaded', () => {
    const urlsContainer = document.getElementById('urls-container');
    const addUrlBtn = document.getElementById('add-url-btn');
    const parseBtn = document.getElementById('parse-btn');
    const saveBtn = document.getElementById('save-btn');
    const output = document.getElementById('output');
    const statusBar = document.getElementById('status-bar');
    const selectorTypeSelect = document.getElementById('selector-type');
    const selectorValuesInput = document.getElementById('selector-values');
    const autoModeRadio = document.getElementById('auto-mode');
    const manualModeRadio = document.getElementById('manual-mode');
    const autoExtractTypesInput = document.getElementById('auto-extract-types');
    const extractTypesInput = document.getElementById('extract-types');
    const saveAutoRadio = document.getElementById('save-auto');
    const saveManualRadio = document.getElementById('save-manual');
    const saveFormatSelect = document.getElementById('save-format');
    
    let results = [];
    let currentExtractTypes = ['text'];
    
    function determineExtractTypes(selectorValues) {
        const types = new Set();
        const values = selectorValues.split(',').map(v => v.trim().toLowerCase());
        
        for (const value of values) {
            if (value === 'img' || value.includes('img')) {
                types.add('image');
            } else if (value === 'video' || value.includes('video')) {
                types.add('video');
            } else {
                types.add('text');
            }
        }
        
        return Array.from(types);
    }
    
    // Обновление текста кнопки сохранения
    function updateSaveButtonText() {
        const saveFormat = saveFormatSelect.value;
        
        let formatText = '';
        switch(saveFormat) {
            case 'json':
                formatText = '.json';
                break;
            case 'csv':
                formatText = '.csv';
                break;
        }
        
        if (autoModeRadio.checked) {
            if (currentExtractTypes.length === 1) {
                if (currentExtractTypes[0] === 'text') saveBtn.textContent = 'Сохранить в ' + formatText;
                else if (currentExtractTypes[0] === 'image') saveBtn.textContent = 'Сохранить img';
                else if (currentExtractTypes[0] === 'video') saveBtn.textContent = 'Сохранить video';
            } else if (currentExtractTypes.length > 1) {
                const hasText = currentExtractTypes.includes('text');
                const hasImage = currentExtractTypes.includes('image');
                const hasVideo = currentExtractTypes.includes('video');
                
                if (hasText && hasImage && hasVideo) {
                    saveBtn.textContent = 'Сохранить всё';
                } else if (hasText && hasImage) {
                    saveBtn.textContent = 'Сохранить ' + formatText + ' и img';
                } else if (hasText && hasVideo) {
                    saveBtn.textContent = 'Сохранить ' + formatText + ' и video';
                } else if (hasImage && hasVideo) {
                    saveBtn.textContent = 'Сохранить img и video';
                }
            }
        } else {
            const types = extractTypesInput.value.split(',').map(t => t.trim().toLowerCase());
            const englishTypes = types.map(t => {
                if (t === 'txt') return 'text';
                if (t === 'img') return 'image';
                if (t === 'video') return 'video';
                return t;
            }).filter(t => ['text', 'image', 'video'].includes(t));
            
            if (englishTypes.length === 0) englishTypes.push('text');
            
            currentExtractTypes = englishTypes;
            
            if (englishTypes.length === 1) {
                if (englishTypes[0] === 'text') saveBtn.textContent = 'Сохранить в ' + formatText;
                else if (englishTypes[0] === 'image') saveBtn.textContent = 'Сохранить img';
                else if (englishTypes[0] === 'video') saveBtn.textContent = 'Сохранить video';
            } else if (englishTypes.length > 1) {
                const hasText = englishTypes.includes('text');
                const hasImage = englishTypes.includes('image');
                const hasVideo = englishTypes.includes('video');
                
                if (hasText && hasImage && hasVideo) {
                    saveBtn.textContent = 'Сохранить всё';
                } else if (hasText && hasImage) {
                    saveBtn.textContent = 'Сохранить ' + formatText + ' и img';
                } else if (hasText && hasVideo) {
                    saveBtn.textContent = 'Сохранить ' + formatText + ' и video';
                } else if (hasImage && hasVideo) {
                    saveBtn.textContent = 'Сохранить img и video';
                }
            }
        }
    }
    
    // Функция для преобразования результатов в CSV
    function convertToCSV(results) {
        let csvContent = "URL,Type,Tag,Class,ID,Structure_Tag,Structure_Class,Structure_ID,Structure_Txt,Structure_Src\n";
        
        for (const result of results) {
            for (const item of result.result) {
                if (!item.structure || !Array.isArray(item.structure)) {
                    continue;
                }
                
                for (const entry of item.structure) {
                    let row = [
                        `"${result.url.replace(/"/g, '""')}"`,
                        `"${item.type.replace(/"/g, '""')}"`,
                        `"${(item.tag || '').replace(/"/g, '""')}"`,
                        `"${(item.class || '').replace(/"/g, '""')}"`,
                        `"${(item.id || '').replace(/"/g, '""')}"`,
                        `"${(entry.tag || '').replace(/"/g, '""')}"`,
                        `"${(entry.class || '').replace(/"/g, '""')}"`,
                        `"${(entry.id || '').replace(/"/g, '""')}"`,
                        `"${(entry.txt || '').replace(/"/g, '""')}"`,
                        `"${(entry.src || '').replace(/"/g, '""')}"`
                    ].join(',');
                    
                    csvContent += row + '\n';
                }
            }
        }
        
        return csvContent;
    }
    
    // Добавление нового поля URL
    addUrlBtn.addEventListener('click', () => {
        const urlRow = document.createElement('div');
        urlRow.className = 'url-row';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'url-input';
        input.placeholder = 'https://example.com';
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-url-btn';
        removeBtn.textContent = '-';
        removeBtn.style.display = 'block';
        
        removeBtn.addEventListener('click', () => {
            urlRow.remove();
        });
        
        urlRow.appendChild(input);
        urlRow.appendChild(removeBtn);
        urlsContainer.appendChild(urlRow);
    });
    
    // Запуск парсинга
    parseBtn.addEventListener('click', async () => {
        // Получаем URL из полей ввода
        const urlInputs = document.querySelectorAll('.url-input');
        const urls = Array.from(urlInputs)
            .map(input => input.value.trim())
            .filter(url => url)
            .map(url => url.startsWith('http') ? url : 'https://' + url);
        
        if (urls.length === 0) {
            showError('Введите хотя бы один URL');
            return;
        }
        
        // Получаем параметры парсинга
        const selectorType = selectorTypeSelect.value;
        const selectorValues = selectorValuesInput.value
            .split(',')
            .map(v => v.trim())
            .filter(v => v);
            
        if (selectorValues.length === 0) {
            showError('Введите значения для селектора');
            return;
        }
        
        // Определяем типы извлечения
        let extractTypes;
        if (autoModeRadio.checked) {
            extractTypes = currentExtractTypes;
        } else {
            const types = extractTypesInput.value.split(',').map(t => t.trim().toLowerCase());
            extractTypes = types.map(t => {
                if (t === 'txt') return 'text';
                if (t === 'img') return 'image';
                if (t === 'video') return 'video';
                return t;
            }).filter(t => ['text', 'image', 'video'].includes(t));
            
            if (extractTypes.length === 0) {
                showError('Введите корректные типы извлечения (txt, img, video)');
                return;
            }
        }
        
        // Показываем статус
        setStatus('Парсинг...');
        output.textContent = '';
        parseBtn.disabled = true;
        
        try {
            // Формируем данные для запроса
            const requestData = {
                urls,
                selector_type: selectorType,
                selector_values: selectorValues,
                extract_types: extractTypes
            };
            
            // Отправляем запрос на бэкенд
            const response = await axios.post(`${API_BASE}/parse`, requestData);
            
            if (response.data.status === 'success') {
                results = response.data.results;
                
                // Отображаем результаты
                if (results.length > 0) {
                    let outputText = '';
                    
                    for (const result of results) {
                        outputText += `URL: ${result.url}\n`;
                        outputText += `Найдено элементов: ${result.items_found}\n`;
                        outputText += "Результаты:\n";
                        
                        for (let i = 0; i < result.result.length; i++) {
                            const item = result.result[i];
                            
                            // Добавляем предупреждения, если они есть
                            if (item.warning) {
                                outputText += `⚠️ ${item.warning}\n`;
                            }
                            
                            let content = '';
                            if (item.structure && Array.isArray(item.structure)) {
                                if (item.type === 'text') {
                                    content = item.structure.map(entry => entry.txt || '').join(' | ');
                                } else if (item.type === 'image' || item.type === 'video') {
                                    content = item.structure.map(entry => entry.src || '').join(' | ');
                                }
                            }
                            
                            // Добавляем проверку на null/undefined
                            const preview = content && typeof content === 'string' 
                                ? content.substring(0, 100) 
                                : JSON.stringify(content || '').substring(0, 100);
                                
                            outputText += `${i+1}. ${preview}...\n`;
                        }
                        outputText += '\n';
                    }
                    
                    output.textContent = outputText;
                    setStatus(`Готово. Обработано ${results.length} URL`);
                    saveBtn.disabled = false;
                } else {
                    output.textContent = 'Элементы не найдены на указанных URL';
                    setStatus('Готово. Элементы не найдены');
                    saveBtn.disabled = true;
                }
            } else {
                showError(response.data.error || 'Неизвестная ошибка');
            }
        } catch (error) {
            showError(`Ошибка при парсинге: ${error.message}`);
            console.error(error);
        } finally {
            parseBtn.disabled = false;
        }
    });
    
    // Сохранение результатов
    saveBtn.addEventListener('click', async () => {
        if (results.length === 0) {
            showError('Нет данных для сохранения');
            return;
        }
        
        try {
            const hasImages = currentExtractTypes.includes('image');
            const hasVideos = currentExtractTypes.includes('video');
            const hasText = currentExtractTypes.includes('text');
            
            // Определяем папку для текстовых данных в зависимости от формата
            const textFolderName = saveFormatSelect.value === 'csv' ? 'csv' : 'json';
            
            let totalDownloaded = 0;
            let savePath = '';
            
            // Создаем временную метку для папки
            const now = new Date();
            const timestamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;
            
            // Определяем режим сохранения
            const isAutoSave = saveAutoRadio.checked;
            
            if (isAutoSave) {
                // Автоматическое сохранение - создаем папку outFiles на рабочем столе
                const desktopPath = path.join(os.homedir(), 'Desktop');
                savePath = path.join(desktopPath, 'outFiles');
                
                // Создаем папку outFiles, если не существует
                if (!fs.existsSync(savePath)) {
                    fs.mkdirSync(savePath, { recursive: true });
                }
                
                // Создаем подпапки для разных типов контента с временной меткой
                if (hasImages) {
                    const imgPath = path.join(savePath, 'img', timestamp);
                    if (!fs.existsSync(imgPath)) {
                        fs.mkdirSync(imgPath, { recursive: true });
                    }
                }
                if (hasVideos) {
                    const videoPath = path.join(savePath, 'video', timestamp);
                    if (!fs.existsSync(videoPath)) {
                        fs.mkdirSync(videoPath, { recursive: true });
                    }
                }
                if (hasText) {
                    const textPath = path.join(savePath, textFolderName, timestamp);
                    if (!fs.existsSync(textPath)) {
                        fs.mkdirSync(textPath, { recursive: true });
                    }
                }
                
                setStatus('Автоматическое сохранение...');
            } else {
                // Самостоятельное сохранение - показываем диалог выбора папки
                const { canceled, filePaths } = await ipcRenderer.invoke('select-directory');
                
                if (canceled) {
                    setStatus('Сохранение отменено');
                    return;
                }
                
                savePath = filePaths[0];
                
                // Создаем подпапки для разных типов контента с временной меткой
                if (hasImages) {
                    const imgPath = path.join(savePath, 'img', timestamp);
                    if (!fs.existsSync(imgPath)) {
                        fs.mkdirSync(imgPath, { recursive: true });
                    }
                }
                if (hasVideos) {
                    const videoPath = path.join(savePath, 'video', timestamp);
                    if (!fs.existsSync(videoPath)) {
                        fs.mkdirSync(videoPath, { recursive: true });
                    }
                }
                if (hasText) {
                    const textPath = path.join(savePath, textFolderName, timestamp);
                    if (!fs.existsSync(textPath)) {
                        fs.mkdirSync(textPath, { recursive: true });
                    }
                }
                
                setStatus('Сохранение...');
            }
            
            // Сохранение медиафайлов
            if (hasImages || hasVideos) {
                setStatus('Скачивание медиафайлов...');
                
                // Для автоматического режима используем соответствующие подпапки с временной меткой
                let imageSavePath = isAutoSave ? path.join(savePath, 'img', timestamp) : path.join(savePath, 'img', timestamp);
                let videoSavePath = isAutoSave ? path.join(savePath, 'video', timestamp) : path.join(savePath, 'video', timestamp);
                
                if (hasImages) {
                    const imageResult = await downloadMediaFiles(results, imageSavePath, 'image');
                    if (imageResult.success) {
                        totalDownloaded += imageResult.count;
                    } else {
                        showError(`Ошибка при скачивании изображений: ${imageResult.error}`);
                        return;
                    }
                }
                
                if (hasVideos) {
                    const videoResult = await downloadMediaFiles(results, videoSavePath, 'video');
                    if (videoResult.success) {
                        totalDownloaded += videoResult.count;
                    } else {
                        showError(`Ошибка при скачивании видео: ${videoResult.error}`);
                        return;
                    }
                }
            }
            
            // Сохранение текста
            if (hasText) {
                let textSavePath = isAutoSave ? 
                    path.join(savePath, textFolderName, timestamp) : 
                    path.join(savePath, textFolderName, timestamp);
                
                const selectorType = selectorTypeSelect.value;
                const extension = saveFormatSelect.value;
                const filename = `parsed_data_${timestamp}_${selectorType}_text.${extension}`;
                const filePath = path.join(textSavePath, filename);
                
                const dataToSave = results.length === 1 ? results[0] : results;
                
                try {
                    if (saveFormatSelect.value === 'json') {
                        // Очистка текста от лишних пробелов
                        const cleanedData = cleanTextData(dataToSave);
                        fs.writeFileSync(filePath, JSON.stringify(cleanedData, null, 2));
                    } else if (saveFormatSelect.value === 'csv') {
                        const csvData = convertToCSV(results);
                        fs.writeFileSync(filePath, csvData);
                    }
                    
                    if (totalDownloaded > 0) {
                        setStatus(`Сохранено ${totalDownloaded} медиафайлов и текст в: ${isAutoSave ? 'папку outFiles на рабочем столе' : savePath}`);
                    } else {
                        setStatus(`Текст сохранен в: ${isAutoSave ? `папку outFiles/${textFolderName} на рабочем столе` : filePath}`);
                    }
                } catch (error) {
                    showError(`Ошибка сохранения текста: ${error.message}`);
                }
            } else if (totalDownloaded > 0) {
                setStatus(`Сохранено ${totalDownloaded} медиафайлов в: ${isAutoSave ? 'папку outFiles на рабочем столе' : savePath}`);
            }
        } catch (error) {
            showError(`Ошибка при сохранении: ${error.message}`);
        }
    });
    
    // Функция для скачивания медиафайлов
    async function downloadMediaFiles(results, directory, mediaType) {
        try {
            let downloadedCount = 0;
            const downloadPromises = [];
            
            for (const result of results) {
                for (const item of result.result) {
                    if (item.type !== mediaType) continue;
                    
                    // Пропускаем элементы с предупреждениями
                    if (item.warning) continue;
                    
                    if (item.structure && item.structure.length > 0) {
                        for (const entry of item.structure) {
                            if (!entry.src) continue;
                            
                            try {
                                const absoluteUrl = new URL(entry.src, result.url).href;
                                
                                // Добавляем промис скачивания в массив
                                downloadPromises.push(
                                    downloadMediaFile(absoluteUrl, directory, mediaType)
                                        .then(success => {
                                            if (success) downloadedCount++;
                                        })
                                        .catch(error => {
                                            console.error(`Ошибка при скачивании ${entry.src}:`, error);
                                        })
                                );
                            } catch (error) {
                                console.error(`Ошибка при обработке URL ${entry.src}:`, error);
                            }
                        }
                    }
                }
            }
            
            // Ждем завершения всех загрузок
            await Promise.all(downloadPromises);
            
            return { success: true, count: downloadedCount };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    // Функция для скачивания одного медиафайла
    async function downloadMediaFile(url, directory, mediaType) {
        try {
            // Скачиваем файл
            const response = await axios({
                method: 'GET',
                url: url,
                responseType: 'arraybuffer',
                timeout: 30000
            });
            
            // Определяем расширение файла из URL или content-type
            let extension = getExtensionFromUrl(url);
            if (!extension) {
                extension = mediaType === 'image' 
                    ? getImageExtension(response.headers['content-type']) 
                    : getVideoExtension(response.headers['content-type']);
            }
            
            // Генерируем имя файла
            const fileName = `${mediaType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${extension}`;
            const filePath = path.join(directory, fileName);
            
            // Сохраняем файл
            fs.writeFileSync(filePath, Buffer.from(response.data));
            
            console.log(`Downloaded: ${url} to ${filePath}`);
            return true;
        } catch (error) {
            console.error(`Ошибка при скачивании ${url}:`, error);
            return false;
        }
    }
    
    // Функция для определения расширения из URL
    function getExtensionFromUrl(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const lastDotIndex = pathname.lastIndexOf('.');
            
            if (lastDotIndex !== -1) {
                return pathname.substring(lastDotIndex + 1).toLowerCase();
            }
        } catch (error) {
            console.error('Ошибка при анализе URL:', error);
        }
        
        return null;
    }
    
    // Вспомогательные функции для определения расширений
    function getImageExtension(contentType) {
        const extensions = {
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp',
            'image/svg+xml': 'svg'
        };
        
        return extensions[contentType] || 'jpg';
    }
    
    function getVideoExtension(contentType) {
        const extensions = {
            'video/mp4': 'mp4',
            'video/webm': 'webp',
            'video/ogg': 'ogv',
            'video/quicktime': 'mov'
        };
        
        return extensions[contentType] || 'mp4';
    }
    
    // Функция для очистки текстовых данных от лишних пробелов
    function cleanTextData(data) {
        const cleanText = (text) => {
            if (typeof text !== 'string' || !text) return '';
            return text
                .split('\n')
                .map(line => line.replace(/\s+/g, ' ').trim())
                .join('\n');
        };

        const processItem = (item) => {
            if (item.type === 'text' && Array.isArray(item.structure)) {
                item.structure = item.structure.map(entry => {
                    if (entry && entry.txt) {
                        entry.txt = cleanText(entry.txt);
                    }
                    return entry;
                });
            }
            return item;
        };

        if (Array.isArray(data)) {
            return data.map(result => ({
                ...result,
                result: result.result.map(processItem)
            }));
        } else {
            return {
                ...data,
                result: data.result.map(processItem)
            };
        }
    }
    
    // Вспомогательные функции
    function setStatus(message) {
        statusBar.textContent = message;
    }
    
    function showError(message) {
        setStatus(`Ошибка: ${message}`);
        output.textContent = message;
    }
    
    // Инициализация
    updateSaveButtonText();
    
    // Слушаем изменения режима извлечения
    autoModeRadio.addEventListener('change', updateSaveButtonText);
    manualModeRadio.addEventListener('change', updateSaveButtonText);
    extractTypesInput.addEventListener('input', updateSaveButtonText);
    saveFormatSelect.addEventListener('change', updateSaveButtonText);
    
    // Слушаем изменения в селекторах для автоматического определения типов
    selectorValuesInput.addEventListener('input', function() {
        if (autoModeRadio.checked) {
            const types = determineExtractTypes(selectorValuesInput.value);
            const displayTypes = types.map(type => {
                if (type === 'text') return 'txt';
                if (type === 'image') return 'img';
                if (type === 'video') return 'video';
                return type;
            }).join(', ');
            
            autoExtractTypesInput.value = displayTypes;
            currentExtractTypes = types;
            updateSaveButtonText();
        }
    });
});