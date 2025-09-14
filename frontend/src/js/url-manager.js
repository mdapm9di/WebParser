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
        // Убрали добавление лишнего поля
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
        removeBtn.textContent = '-';
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