const axios = require('axios');

class ApiClient {
    constructor(apiBase) {
        this.API_BASE = apiBase;
    }

    async parseUrls(requestData) {
        try {
            const response = await axios.post(`${this.API_BASE}/parse`, requestData);
            return response;
        } catch (error) {
            throw new Error(`Ошибка при парсинге: ${error.message}`);
        }
    }

    async downloadMediaFile(url, directory, mediaType) {
        try {
            const response = await axios({
                method: 'GET',
                url: url,
                responseType: 'arraybuffer',
                timeout: 30000
            });
            
            return response;
        } catch (error) {
            throw new Error(`Ошибка при скачивании ${url}: ${error.message}`);
        }
    }
}

module.exports = { ApiClient };