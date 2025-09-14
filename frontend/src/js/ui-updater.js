class UiUpdater {
    constructor(statusBarId, outputId) {
        this.statusBar = document.getElementById(statusBarId);
        this.output = document.getElementById(outputId);
    }

    setStatus(message) {
        this.statusBar.textContent = message;
    }

    showError(message) {
        this.setStatus(`Ошибка: ${message}`);
        this.output.textContent = message;
    }

    displayResults(results) {
        if (results.length > 0) {
            let outputText = '';
            
            for (const result of results) {
                outputText += `URL: ${result.url}\n`;
                outputText += `Найдено элементов: ${result.items_found}\n`;
                outputText += "Результаты:\n";
                
                for (let i = 0; i < result.result.length; i++) {
                    const item = result.result[i];
                    
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
                    
                    const preview = content && typeof content === 'string' 
                        ? content.substring(0, 100) 
                        : JSON.stringify(content || '').substring(0, 100);
                        
                    outputText += `${i+1}. ${preview}...\n`;
                }
                outputText += '\n';
            }
            
            this.output.textContent = outputText;
            return true;
        } else {
            this.output.textContent = 'Элементы не найдены на указанных URL';
            return false;
        }
    }

    showNoResults() {
        this.output.textContent = 'Элементы не найдены на указанных URL';
        this.setStatus('Готово. Элементы не найдены');
    }
}

module.exports = { UiUpdater };