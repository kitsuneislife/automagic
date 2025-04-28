/**
 * Modelo unificado de notícia
 * @typedef {Object} UnifiedNews
 * @property {string} title - Título da notícia
 * @property {string} description - Descrição/Resumo da notícia
 * @property {string} url - URL da notícia
 * @property {string} image - URL da imagem principal
 * @property {string} source - Nome da fonte
 * @property {string} publishedAt - Data de publicação em ISO string
 */

/**
 * Verifica se uma notícia já existe na lista baseada em título, descrição e URL
 * @param {UnifiedNews} news - Notícia a ser verificada
 * @param {UnifiedNews[]} existingNews - Lista de notícias existentes
 * @returns {boolean}
 */
function isDuplicate(news, existingNews) {
    return existingNews.some(existing => 
        existing.title === news.title && 
        existing.description === news.description && 
        existing.url === news.url
    );
}

/**
 * Converte notícias do formato GNews para o formato unificado
 * @param {Object} gnewsData - Dados no formato GNews
 * @returns {UnifiedNews[]}
 */
function convertGNews(gnewsData) {
    if (!gnewsData?.articles) return [];
    
    const unifiedNews = [];
    gnewsData.articles.forEach(article => {
        const news = {
            title: article.title,
            description: article.description,
            url: article.url,
            image: article.image,
            source: article.source?.name || 'Unknown',
            publishedAt: article.publishedAt
        };
        
        if (!isDuplicate(news, unifiedNews)) {
            unifiedNews.push(news);
        }
    });
    
    return unifiedNews;
}

/**
 * Converte notícias do formato NewsAPI para o formato unificado
 * @param {Object} newsData - Dados no formato NewsAPI
 * @returns {UnifiedNews[]}
 */
function convertNewsAPI(newsData) {
    if (!newsData?.articles) return [];
    
    const unifiedNews = [];
    newsData.articles.forEach(article => {
        const news = {
            title: article.title,
            description: article.description,
            url: article.url,
            image: article.urlToImage,
            source: article.source?.name || 'Unknown',
            publishedAt: article.publishedAt
        };
        
        if (!isDuplicate(news, unifiedNews)) {
            unifiedNews.push(news);
        }
    });
    
    return unifiedNews;
}

/**
 * Converte notícias do formato MediaStack para o formato unificado
 * @param {Object} mediastackData - Dados no formato MediaStack
 * @returns {UnifiedNews[]}
 */
function convertMediaStack(mediastackData) {
    if (!mediastackData?.data) return [];
    
    const unifiedNews = [];
    mediastackData.data.forEach(article => {
        const news = {
            title: article.title,
            description: article.description,
            url: article.url,
            image: article.image,
            source: article.source,
            publishedAt: article.published_at
        };
        
        if (!isDuplicate(news, unifiedNews)) {
            unifiedNews.push(news);
        }
    });
    
    return unifiedNews;
}

/**
 * Unifica notícias de diferentes fontes em um formato padronizado
 * @param {Object} data - Dados brutos da notícia
 * @param {string} source - Fonte dos dados ('gnews', 'newsapi', 'mediastack')
 * @returns {UnifiedNews[]}
 */
function unifyNews(data, source) {
    switch (source.toLowerCase()) {
        case 'gnews':
            return convertGNews(data);
        case 'newsapi':
            return convertNewsAPI(data);
        case 'mediastack':
            return convertMediaStack(data);
        default:
            throw new Error('Fonte de notícias não suportada');
    }
}

export {
    unifyNews,
    convertGNews,
    convertNewsAPI,
    convertMediaStack
}; 