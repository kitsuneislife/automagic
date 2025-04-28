import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

class NewsImporter {
    /**
     * Faz uma solicitação à API NewsAPI para buscar notícias
     * @param {string} country - Código do país (ex: 'us')
     * @returns {Promise<Object>} - Dados das notícias
     */
    static async fetchNewsAPI(country = 'us') {
        try {
            const res = await axios.get('https://newsapi.org/v2/top-headlines', {
                params: { country, apiKey: process.env.NEWS_API_KEY }
            });
            return res.data;
        } catch (error) {
            console.error('Erro ao buscar dados da NewsAPI:', error.message);
            throw error;
        }
    }

    /**
     * Faz uma solicitação à API GNews para buscar notícias
     * @param {string} country - Código do país (ex: 'br')
     * @returns {Promise<Object>} - Dados das notícias
     */
    static async fetchGNews(country = 'br') {
        try {
            const res = await axios.get('https://gnews.io/api/v4/top-headlines', {
                params: { country, apikey: process.env.GNEWS_API_KEY }
            });
            return res.data;
        } catch (error) {
            console.error('Erro ao buscar dados da GNews:', error.message);
            throw error;
        }
    }

    /**
     * Faz uma solicitação à API MediaStack para buscar notícias
     * @param {string} country - Código do país (ex: 'br')
     * @returns {Promise<Object>} - Dados das notícias
     */
    static async fetchMediaStack(country = 'br') {
        try {
            const res = await axios.get('https://api.mediastack.com/v1/news', {
                params: { country, access_key: process.env.MEDIASTACK_API_KEY }
            });
            return res.data;
        } catch (error) {
            console.error('Erro ao buscar dados da MediaStack:', error.message);
            throw error;
        }
    }
}

export default NewsImporter;