const fs = require('fs');
const path = require('path');
const os = require('os');
const { ipcRenderer } = require('electron');

class FileSaver {
    constructor() {
        this.getExtensionFromUrl = this.getExtensionFromUrl.bind(this);
        this.getImageExtension = this.getImageExtension.bind(this);
        this.getVideoExtension = this.getVideoExtension.bind(this);
    }

    convertToCSV(results) {
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

    cleanTextData(data) {
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

    getExtensionFromUrl(url) {
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

    getImageExtension(contentType) {
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

    getVideoExtension(contentType) {
        const extensions = {
            'video/mp4': 'mp4',
            'video/webm': 'webp',
            'video/ogg': 'ogv',
            'video/quicktime': 'mov'
        };
        
        return extensions[contentType] || 'mp4';
    }

    async saveTextData(results, textSavePath, selectorType, extension) {
        const timestamp = this.getTimestamp();
        const filename = `parsed_data_${timestamp}_${selectorType}_text.${extension}`;
        const filePath = path.join(textSavePath, filename);
        
        const dataToSave = results.length === 1 ? results[0] : results;
        
        try {
            if (extension === 'json') {
                const cleanedData = this.cleanTextData(dataToSave);
                fs.writeFileSync(filePath, JSON.stringify(cleanedData, null, 2));
            } else if (extension === 'csv') {
                const csvData = this.convertToCSV(results);
                fs.writeFileSync(filePath, csvData);
            }
            
            return { success: true, path: filePath };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async downloadMediaFiles(results, directory, mediaType, apiClient) {
        try {
            let downloadedCount = 0;
            const downloadPromises = [];
            
            for (const result of results) {
                for (const item of result.result) {
                    if (item.type !== mediaType) continue;
                    
                    if (item.warning) continue;
                    
                    if (item.structure && item.structure.length > 0) {
                        for (const entry of item.structure) {
                            if (!entry.src) continue;
                            
                            try {
                                const absoluteUrl = new URL(entry.src, result.url).href;
                                
                                downloadPromises.push(
                                    this.downloadMediaFile(absoluteUrl, directory, mediaType, apiClient)
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
            
            // Ограничиваем количество одновременных запросов
            const batchSize = 5;
            for (let i = 0; i < downloadPromises.length; i += batchSize) {
                const batch = downloadPromises.slice(i, i + batchSize);
                await Promise.all(batch);
                // Небольшая задержка между батчами
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            return { success: true, count: downloadedCount };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async downloadMediaFile(url, directory, mediaType, apiClient) {
        try {
            const response = await apiClient.downloadMediaFile(url, directory, mediaType);
            
            let extension = this.getExtensionFromUrl(url);
            if (!extension) {
                extension = mediaType === 'image' 
                    ? this.getImageExtension(response.headers['content-type']) 
                    : this.getVideoExtension(response.headers['content-type']);
            }
            
            const fileName = `${mediaType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${extension}`;
            const filePath = path.join(directory, fileName);
            
            fs.writeFileSync(filePath, Buffer.from(response.data));
            
            console.log(`Downloaded: ${url} to ${filePath}`);
            return true;
        } catch (error) {
            console.error(`Ошибка при скачивании ${url}:`, error);
            return false;
        }
    }

    getTimestamp() {
        const now = new Date();
        return `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;
    }
}

module.exports = { FileSaver };