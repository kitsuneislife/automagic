import NewsImporter from './modules/importer.mjs';
import newsDatabase from './modules/database.mjs';
import { unifyNews } from './modules/unifier.mjs';

class NewsHandler {
    /**
     * Baixa notícias de uma API específica e insere no banco de dados
     * @param {string} source - Fonte da API ('newsapi', 'gnews', 'mediastack')
     * @param {string} country - Código do país (ex: 'us', 'br')
     * @returns {Object} - Estatísticas da operação (notícias inseridas e ignoradas)
     */
    static async fetchAndStoreNews(source, country = 'us') {
        let rawData;
        switch (source.toLowerCase()) {
            case 'newsapi':
                rawData = await NewsImporter.fetchNewsAPI(country);
                break;
            case 'gnews':
                rawData = await NewsImporter.fetchGNews(country);
                break;
            case 'mediastack':
                rawData = await NewsImporter.fetchMediaStack(country);
                break;
            default:
                throw new Error('Fonte de notícias não suportada');
        }

        const unifiedNews = unifyNews(rawData, source);
        return newsDatabase.insertUnifiedNews(unifiedNews);
    }

    /**
     * Busca notícias com base em critérios específicos
     * @param {Object} options - Opções de busca
     * @param {number} [options.limit=10] - Limite de resultados
     * @param {number} [options.offset=0] - Offset para paginação
     * @param {string} [options.source] - Fonte específica
     * @returns {Array} - Array de notícias encontradas
     */
    static getNews(options = {}) {
        return newsDatabase.getNews(options);
    }

    /**
     * Executa uma consulta SQL dinâmica
     * @param {string} query - A consulta SQL a ser executada
     * @param {Array} [params=[]] - Parâmetros para a consulta
     * @returns {Array} - Resultados da consulta
     */
    static runDynamicQuery(query, params = []) {
        return newsDatabase.runDynamicQuery(query, params);
    }

    /**
     * Fecha a conexão com o banco de dados
     */
    static closeDatabase() {
        newsDatabase.close();
    }
}

export default NewsHandler;