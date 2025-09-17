const { ipcRenderer } = require('electron');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

const API_BASE = 'http://localhost:5000';

document.addEventListener('DOMContentLoaded', () => {
    const { UrlManager } = require('./src/js/url-manager.js');
    const { ApiClient } = require('./src/js/api-client');
    const { FileSaver } = require('./src/js/file-saver');
    const { UiUpdater } = require('./src/js/ui-updater');

    const urlManager = new UrlManager('urls-container', 'add-url-btn');
    const apiClient = new ApiClient(API_BASE);
    const fileSaver = new FileSaver();
    const uiUpdater = new UiUpdater('status-bar', 'output');
    
    const parseBtn = document.getElementById('parse-btn');
    const saveBtn = document.getElementById('save-btn');
    const selectorTypeSelect = document.getElementById('selector-type');
    const selectorValuesInput = document.getElementById('selector-values');
    const autoModeRadio = document.getElementById('auto-mode');
    const manualModeRadio = document.getElementById('manual-mode');
    const autoExtractTypesInput = document.getElementById('auto-extract-types');
    const extractTypesInput = document.getElementById('extract-types');
    const saveAutoRadio = document.getElementById('save-auto');
    const saveManualRadio = document.getElementById('save-manual');
    const saveFormatSelect = document.getElementById('save-format');
    const saveFormatContainer = document.querySelector('.save-options select');
    const themeToggle = document.getElementById('theme-toggle');
    
    const dragRegion = document.createElement('div');
    dragRegion.style.position = 'fixed';
    dragRegion.style.top = '0';
    dragRegion.style.left = '0';
    dragRegion.style.width = '100%';
    dragRegion.style.height = '30px';
    dragRegion.style.webkitAppRegion = 'drag';
    dragRegion.style.zIndex = '1000';
    dragRegion.style.display = 'flex';
    dragRegion.style.justifyContent = 'space-between';
    dragRegion.style.alignItems = 'center';
    dragRegion.style.padding = '0 0 0 15px';
    document.body.appendChild(dragRegion);

    const titleText = document.createElement('span');
    titleText.textContent = 'WebParser';
    titleText.style.fontSize = '12px';
    titleText.style.fontWeight = 'normal';
    titleText.style.pointerEvents = 'none';
    dragRegion.appendChild(titleText);

    const windowControls = document.createElement('div');
    windowControls.style.display = 'flex';
    windowControls.style.webkitAppRegion = 'no-drag';
    windowControls.style.height = '30px';
    dragRegion.appendChild(windowControls);

    const minimizeBtn = document.createElement('button');
    minimizeBtn.innerHTML = '&#x2013;';
    minimizeBtn.style.width = '46px';
    minimizeBtn.style.height = '30px';
    minimizeBtn.style.border = 'none';
    minimizeBtn.style.background = 'none';
    minimizeBtn.style.fontSize = '12px';
    minimizeBtn.style.cursor = 'pointer';
    minimizeBtn.style.display = 'flex';
    minimizeBtn.style.alignItems = 'center';
    minimizeBtn.style.justifyContent = 'center';
    minimizeBtn.style.transition = 'background-color 0.2s ease';
    minimizeBtn.style.borderRadius = '0';
    minimizeBtn.style.boxSizing = 'border-box';
    minimizeBtn.style.margin = '0';
    minimizeBtn.style.padding = '0';
    minimizeBtn.style.lineHeight = '30px';
    minimizeBtn.addEventListener('click', () => {
        ipcRenderer.invoke('minimize-window');
    });
    windowControls.appendChild(minimizeBtn);

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&#x2715;';
    closeBtn.style.width = '46px';
    closeBtn.style.height = '30px';
    closeBtn.style.border = 'none';
    closeBtn.style.background = 'none';
    closeBtn.style.fontSize = '12px';
    closeBtn.style.fontWeight = 'normal';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.display = 'flex';
    closeBtn.style.alignItems = 'center';
    closeBtn.style.justifyContent = 'center';
    closeBtn.style.transition = 'background-color 0.2s ease';
    closeBtn.style.borderRadius = '0';
    closeBtn.style.boxSizing = 'border-box';
    closeBtn.style.margin = '0';
    closeBtn.style.padding = '0';
    closeBtn.style.lineHeight = '30px';
    closeBtn.addEventListener('click', () => {
        ipcRenderer.invoke('close-window');
    });
    windowControls.appendChild(closeBtn);
    
    let results = [];
    let currentExtractTypes = ['text'];

    const mainContent = document.querySelector('.container') || document.body;
    mainContent.style.marginTop = '30px';
    mainContent.style.height = 'calc(100% - 30px)';

    function updateWindowControlsColors() {
        const isLightTheme = document.body.classList.contains('light-theme');
        
        dragRegion.style.backgroundColor = isLightTheme ? '#f5f5f5' : '#111111';
        
        titleText.style.color = isLightTheme ? '#888888' : '#888888';
        
        minimizeBtn.style.color = isLightTheme ? '#888888' : '#ffffffff';
        closeBtn.style.color = isLightTheme ? '#888888' : '#ffffffff';
        
        minimizeBtn.onmouseover = () => {
            minimizeBtn.style.backgroundColor = isLightTheme ? '#e5e5e5' : '#3d3d3d3b';
            minimizeBtn.style.transform = 'translateY(0)';
        };
        minimizeBtn.onmouseout = () => {
            minimizeBtn.style.backgroundColor = 'transparent';
            minimizeBtn.style.transform = 'translateY(0)';
        };
        
        closeBtn.onmouseover = () => {
            closeBtn.style.backgroundColor = '#ff0000ff';
            closeBtn.style.color = '#f5f5f5';
            closeBtn.style.transform = 'translateY(0)';
        };
        closeBtn.onmouseout = () => {
            closeBtn.style.backgroundColor = 'transparent';
            closeBtn.style.color = isLightTheme ? '#111111' : '#f5f5f5';
            closeBtn.style.transform = 'translateY(0)';
        };
    }

    themeToggle.addEventListener('click', () => {
        const body = document.body;
        body.classList.toggle('light-theme');
        
        const isLightTheme = body.classList.contains('light-theme');
        localStorage.setItem('theme', isLightTheme ? 'light' : 'dark');
        
        updateWindowControlsColors();
    });

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
    }

    setTimeout(updateWindowControlsColors, 100);

    const interactiveElements = document.querySelectorAll('button, input, select, textarea');
    interactiveElements.forEach(el => {
        if (el.offsetTop < 30) {
            el.style.webkitAppRegion = 'no-drag';
        }
    });
    
    parseBtn.addEventListener('click', async () => {
        const urls = urlManager.getUrls();
        
        if (urls.length === 0) {
            uiUpdater.showError('Введите хотя бы один URL');
            return;
        }
        
        const selectorType = selectorTypeSelect.value;
        const selectorValues = selectorValuesInput.value
            .split(',')
            .map(v => v.trim())
            .filter(v => v);
            
        if (selectorValues.length === 0) {
            uiUpdater.showError('Введите значения для селектора');
            return;
        }
        
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
                uiUpdater.showError('Введите корректные типы извлечения (txt, img, video)');
                return;
            }
        }

        const parseMode = document.querySelector('input[name="parse-mode"]:checked').value;

        uiUpdater.setStatus('Парсинг...');
        parseBtn.disabled = true;
        
        try {
            const requestData = {
                urls,
                selector_type: selectorType,
                selector_values: selectorValues,
                extract_types: extractTypes,
                parse_mode: parseMode
            };
            
            const response = await apiClient.parseUrls(requestData);
            
            if (response.data.status === 'success') {
                results = response.data.results;
                
                if (results.length > 0) {
                    uiUpdater.displayResults(results);
                    uiUpdater.setStatus(`Готово. Обработано ${results.length} URL`, 'ready');
                    saveBtn.disabled = false;
                } else {
                    uiUpdater.showNoResults();
                    saveBtn.disabled = true;
                }
            } else {
                uiUpdater.showError(response.data.error || 'Неизвестная ошибка');
            }
        } catch (error) {
            uiUpdater.showError(`Ошибка при парсинге: ${error.message}`);
            console.error(error);
        } finally {
            parseBtn.disabled = false;
        }
    });
    
    saveBtn.addEventListener('click', async () => {
        if (results.length === 0) {
            uiUpdater.showError('Нет данных для сохранения');
            return;
        }
        
        try {
            const hasImages = currentExtractTypes.includes('image');
            const hasVideos = currentExtractTypes.includes('video');
            const hasText = currentExtractTypes.includes('text');
            
            const textFolderName = saveFormatSelect.value === 'csv' ? 'csv' : 'json';
            
            let totalDownloaded = 0;
            let savePath = '';
            
            const isAutoSave = saveAutoRadio.checked;
            
            if (isAutoSave) {
                const desktopPath = path.join(os.homedir(), 'Desktop');
                savePath = path.join(desktopPath, 'outFiles');
                
                if (!fs.existsSync(savePath)) {
                    fs.mkdirSync(savePath, { recursive: true });
                }
                
                if (hasImages) {
                    const imgPath = path.join(savePath, 'img', fileSaver.getTimestamp());
                    if (!fs.existsSync(imgPath)) {
                        fs.mkdirSync(imgPath, { recursive: true });
                    }
                }
                if (hasVideos) {
                    const videoPath = path.join(savePath, 'video', fileSaver.getTimestamp());
                    if (!fs.existsSync(videoPath)) {
                        fs.mkdirSync(videoPath, { recursive: true });
                    }
                }
                if (hasText) {
                    const textPath = path.join(savePath, textFolderName, fileSaver.getTimestamp());
                    if (!fs.existsSync(textPath)) {
                        fs.mkdirSync(textPath, { recursive: true });
                    }
                }
                
                uiUpdater.setStatus('Автоматическое сохранение...');
            } else {
                const { canceled, filePaths } = await ipcRenderer.invoke('select-directory');
                
                if (canceled) {
                    uiUpdater.setStatus('Сохранение отменено', 'not-ready');
                    return;
                }
                
                savePath = filePaths[0];
                
                if (hasImages) {
                    const imgPath = path.join(savePath, 'img', fileSaver.getTimestamp());
                    if (!fs.existsSync(imgPath)) {
                        fs.mkdirSync(imgPath, { recursive: true });
                    }
                }
                if (hasVideos) {
                    const videoPath = path.join(savePath, 'video', fileSaver.getTimestamp());
                    if (!fs.existsSync(videoPath)) {
                        fs.mkdirSync(videoPath, { recursive: true });
                    }
                }
                if (hasText) {
                    const textPath = path.join(savePath, textFolderName, fileSaver.getTimestamp());
                    if (!fs.existsSync(textPath)) {
                        fs.mkdirSync(textPath, { recursive: true });
                    }
                }
                
                uiUpdater.setStatus('Сохранение...');
            }
            
            if (hasImages || hasVideos) {
                uiUpdater.setStatus('Скачивание медиафайлов...');
                
                let imageSavePath = path.join(savePath, 'img', fileSaver.getTimestamp());
                let videoSavePath = path.join(savePath, 'video', fileSaver.getTimestamp());
                
                if (hasImages) {
                    const imageResult = await fileSaver.downloadMediaFiles(results, imageSavePath, 'image', apiClient);
                    if (imageResult.success) {
                        totalDownloaded += imageResult.count;
                    } else {
                        uiUpdater.showError(`Ошибка при скачивании изображений: ${imageResult.error}`);
                        return;
                    }
                }
                
                if (hasVideos) {
                    const videoResult = await fileSaver.downloadMediaFiles(results, videoSavePath, 'video', apiClient);
                    if (videoResult.success) {
                        totalDownloaded += videoResult.count;
                    } else {
                        uiUpdater.showError(`Ошибка при скачивании видео: ${videoResult.error}`);
                        return;
                    }
                }
            }
            
            if (hasText) {
                let textSavePath = path.join(savePath, textFolderName, fileSaver.getTimestamp());
                
                const selectorType = selectorTypeSelect.value;
                const extension = saveFormatSelect.value;
                const saveResult = await fileSaver.saveTextData(results, textSavePath, selectorType, extension);
                
                if (!saveResult.success) {
                    uiUpdater.showError(`Ошибка сохранения текста: ${saveResult.error}`);
                    return;
                }
                
                if (totalDownloaded > 0) {
                    uiUpdater.setStatus(`Сохранено ${totalDownloaded} медиафайлов и текст в: ${isAutoSave ? 'папку outFiles на рабочем столе' : savePath}`, 'ready');
                } else {
                    uiUpdater.setStatus(`Текст сохранен в: ${isAutoSave ? `папку outFiles/${textFolderName} на рабочем столе` : savePath}`, 'ready');
                }
            } else if (totalDownloaded > 0) {
                uiUpdater.setStatus(`Сохранено ${totalDownloaded} медиафайлов в: ${isAutoSave ? 'папку outFiles на рабочем столе' : savePath}`, 'ready');
            }
        } catch (error) {
            uiUpdater.showError(`Ошибка при сохранении: ${error.message}`);
        }
    });
    
    function updateFormatSelectorVisibility() {
        const hasText = currentExtractTypes.includes('text');
        
        if (hasText) {
            saveFormatContainer.classList.remove('format-selector-hidden');
        } else {
            saveFormatContainer.classList.add('format-selector-hidden');
        }
    }
    
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
            updateFormatSelectorVisibility();
            
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
    
    updateSaveButtonText();
    
    autoModeRadio.addEventListener('change', updateSaveButtonText);
    manualModeRadio.addEventListener('change', updateSaveButtonText);
    extractTypesInput.addEventListener('input', updateSaveButtonText);
    saveFormatSelect.addEventListener('change', updateSaveButtonText);
    
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
            updateFormatSelectorVisibility();
            updateSaveButtonText();
        }
    });
});