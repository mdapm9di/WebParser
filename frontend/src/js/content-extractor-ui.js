<<<<<<< HEAD
document.addEventListener('DOMContentLoaded', function() {
    const selectorTypeSelect = document.getElementById('selector-type');
    const selectorValuesInput = document.getElementById('selector-values');
    const autoModeRadio = document.getElementById('auto-mode');
    const manualModeRadio = document.getElementById('manual-mode');
    const autoExtractGroup = document.getElementById('auto-extract-group');
    const manualExtractGroup = document.getElementById('manual-extract-group');
    const autoExtractTypesInput = document.getElementById('auto-extract-types');
    const extractTypesInput = document.getElementById('extract-types');
    const saveAutoRadio = document.getElementById('save-auto');
    const saveManualRadio = document.getElementById('save-manual');
    const saveFormatSelect = document.getElementById('save-format');
    
    let currentExtractTypes = ['text'];
    
    function updateSelectorPlaceholder() {
        const selectorType = selectorTypeSelect.value;
        switch(selectorType) {
            case 'tag':
                selectorValuesInput.placeholder = 'div, p, a, h1, img';
                break;
            case 'class':
                selectorValuesInput.placeholder = '.header, .menu-item, .content';
                break;
            case 'id':
                selectorValuesInput.placeholder = '#main, #header, #footer';
                break;
        }
        
        if (selectorType === 'class' || selectorType === 'id') {
            manualModeRadio.checked = true;
            autoExtractGroup.style.display = 'none';
            manualExtractGroup.style.display = 'block';
            updateSaveButtonText();
        } else {
            autoModeRadio.checked = true;
            autoExtractGroup.style.display = 'block';
            manualExtractGroup.style.display = 'none';
            updateExtractType();
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
    
    function getDisplayTypes(types) {
        const typeMap = {
            'text': 'txt',
            'image': 'img',
            'video': 'video'
        };
        return types.map(type => typeMap[type]).join(', ');
    }
    
    updateSelectorPlaceholder();
    selectorTypeSelect.addEventListener('change', updateSelectorPlaceholder);
    
    autoModeRadio.addEventListener('change', function() {
        if (selectorTypeSelect.value === 'class' || selectorTypeSelect.value === 'id') {
            manualModeRadio.checked = true;
            return;
        }
        
        autoExtractGroup.style.display = 'block';
        manualExtractGroup.style.display = 'none';
        updateExtractType();
        updateSaveButtonText();
    });
    
    manualModeRadio.addEventListener('change', function() {
        autoExtractGroup.style.display = 'none';
        manualExtractGroup.style.display = 'block';
        updateSaveButtonText();
    });
    
    function updateExtractType() {
        if (!autoModeRadio.checked) return;
        
        const selectorValues = selectorValuesInput.value;
        const types = determineExtractTypes(selectorValues);
        const displayTypes = getDisplayTypes(types);
        autoExtractTypesInput.value = displayTypes;
        
        currentExtractTypes = types;
        
        updateSaveButtonText();
    }
    
    function updateSaveButtonText() {
        const saveBtn = document.getElementById('save-btn');
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
    
    selectorTypeSelect.addEventListener('change', updateSelectorPlaceholder);
    selectorValuesInput.addEventListener('input', updateExtractType);
    extractTypesInput.addEventListener('input', updateSaveButtonText);
    saveFormatSelect.addEventListener('change', updateSaveButtonText);
    
    updateExtractType();
    updateSaveButtonText();
=======
document.addEventListener('DOMContentLoaded', function() {
    const selectorTypeSelect = document.getElementById('selector-type');
    const selectorValuesInput = document.getElementById('selector-values');
    const autoModeRadio = document.getElementById('auto-mode');
    const manualModeRadio = document.getElementById('manual-mode');
    const autoExtractGroup = document.getElementById('auto-extract-group');
    const manualExtractGroup = document.getElementById('manual-extract-group');
    const autoExtractTypesInput = document.getElementById('auto-extract-types');
    const extractTypesInput = document.getElementById('extract-types');
    const saveAutoRadio = document.getElementById('save-auto');
    const saveManualRadio = document.getElementById('save-manual');
    const saveFormatSelect = document.getElementById('save-format');
    
    let currentExtractTypes = ['text'];
    
    function updateSelectorPlaceholder() {
        const selectorType = selectorTypeSelect.value;
        switch(selectorType) {
            case 'tag':
                selectorValuesInput.placeholder = 'div, p, a, h1, img';
                break;
            case 'class':
                selectorValuesInput.placeholder = '.header, .menu-item, .content';
                break;
            case 'id':
                selectorValuesInput.placeholder = '#main, #header, #footer';
                break;
        }
        
        if (selectorType === 'class' || selectorType === 'id') {
            manualModeRadio.checked = true;
            autoExtractGroup.style.display = 'none';
            manualExtractGroup.style.display = 'block';
            updateSaveButtonText();
        } else {
            autoModeRadio.checked = true;
            autoExtractGroup.style.display = 'block';
            manualExtractGroup.style.display = 'none';
            updateExtractType();
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
    
    function getDisplayTypes(types) {
        const typeMap = {
            'text': 'txt',
            'image': 'img',
            'video': 'video'
        };
        return types.map(type => typeMap[type]).join(', ');
    }
    
    updateSelectorPlaceholder();
    selectorTypeSelect.addEventListener('change', updateSelectorPlaceholder);
    
    autoModeRadio.addEventListener('change', function() {
        if (selectorTypeSelect.value === 'class' || selectorTypeSelect.value === 'id') {
            manualModeRadio.checked = true;
            return;
        }
        
        autoExtractGroup.style.display = 'block';
        manualExtractGroup.style.display = 'none';
        updateExtractType();
        updateSaveButtonText();
    });
    
    manualModeRadio.addEventListener('change', function() {
        autoExtractGroup.style.display = 'none';
        manualExtractGroup.style.display = 'block';
        updateSaveButtonText();
    });
    
    function updateExtractType() {
        if (!autoModeRadio.checked) return;
        
        const selectorValues = selectorValuesInput.value;
        const types = determineExtractTypes(selectorValues);
        const displayTypes = getDisplayTypes(types);
        autoExtractTypesInput.value = displayTypes;
        
        currentExtractTypes = types;
        
        updateSaveButtonText();
    }
    
    function updateSaveButtonText() {
        const saveBtn = document.getElementById('save-btn');
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
    
    selectorTypeSelect.addEventListener('change', updateSelectorPlaceholder);
    selectorValuesInput.addEventListener('input', updateExtractType);
    extractTypesInput.addEventListener('input', updateSaveButtonText);
    saveFormatSelect.addEventListener('change', updateSaveButtonText);
    
    updateExtractType();
    updateSaveButtonText();
>>>>>>> db3846bf44b3226c4095a015d7a96d1f900c7abe
});