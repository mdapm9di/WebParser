class UrlManager {
    constructor(containerId, addButtonId) {
        this.urlsContainer = document.getElementById(containerId);
        this.addUrlBtn = document.getElementById(addButtonId);
        
        if (!this.urlsContainer) {
            console.error('Контейнер URL не найден');
            return;
        }
        
        if (!this.addUrlBtn) {
            console.error('Кнопка добавления URL не найдена');
            return;
        }
        
        this.init();
    }

    init() {
        this.addUrlBtn.addEventListener('click', () => this.addUrlInput());
    }

    addUrlInput() {
        const urlRow = document.createElement('div');
        urlRow.className = 'url-row';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'url-input';
        input.placeholder = 'https://example.com';

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-url-btn';
        removeBtn.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `;
        removeBtn.style.display = 'block';

        removeBtn.addEventListener('click', () => {
            urlRow.remove();
        });

        urlRow.appendChild(input);
        urlRow.appendChild(removeBtn);
        this.urlsContainer.appendChild(urlRow);
    }

    getUrls() {
        const urlInputs = this.urlsContainer.querySelectorAll('.url-input');
        return Array.from(urlInputs)
            .map(input => input.value.trim())
            .filter(url => url)
            .map(url => url.startsWith('http') ? url : 'https://' + url);
    }
}

module.exports = { UrlManager };