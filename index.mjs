
//import NewsHandler from './services/news-database/index.mjs';
// (async () => {
//     try {
//         // Buscar e armazenar notícias da NewsAPI
//         const statsNewsAPI = await NewsHandler.fetchAndStoreNews('newsapi', 'us');
//         console.log('Estatísticas NewsAPI:', statsNewsAPI);

//         // Buscar e armazenar notícias da GNews
//         const statsGNews = await NewsHandler.fetchAndStoreNews('gnews', 'br');
//         console.log('Estatísticas GNews:', statsGNews);

//         // Buscar e armazenar notícias da MediaStack
//         const statsMediaStack = await NewsHandler.fetchAndStoreNews('mediastack', 'br');
//         console.log('Estatísticas MediaStack:', statsMediaStack);

//         // Buscar notícias do banco de dados
//         const news = NewsHandler.getNews({ limit: 5 });
//         console.log('Notícias Encontradas:', news);

//     } catch (error) {
//         console.error('Erro no processo principal:', error.message);
//     } finally {
//         // Encerrar a conexão com o banco de dados
//         NewsHandler.closeDatabase();
//     }
// })();

import NewsHandler from './services/news-database/index.mjs';
import generateVideo from './services/short-video-creator/index.js';


async function main() {
    try {
        const news = NewsHandler.runDynamicQuery('SELECT * FROM news WHERE id = 1');
        const prompt = news.description
        console.log('Notícias Encontradas:', news);
        const video = await generateVideo(prompt, news);

    } catch (error) {
        console.error('Erro no processo principal:', error.message);
    }
}
main()