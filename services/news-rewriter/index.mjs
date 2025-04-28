import { processAndStoreRewrittenNews, closeDatabase } from './modules/rewriter.mjs';

const rewriteNews = async (originalNews) => {
    try {
        const result = await processAndStoreRewrittenNews(originalNews);
        return result;
    } catch (error) {
        console.error('Erro:', error.message);
    } finally {
        closeDatabase();
    }
};

rewriteNews({
    id: 38,
    globalId: 'wqbwbnc7ahlz5i2w',
    title: 'Faccionado foragido do Acre por tráfico de drogas é preso em MT',
    description: 'BR-070',
    url: 'https://www.odocumento.com.br/faccionado-foragido-do-acre-por-trafico-de-drogas-e-preso-em-mt/',
    image: 'https://www.odocumento.com.br/content/images/2025/04/a-a-867.jpg',
    source: 'odocumento',
    publishedAt: '2025-04-28T15:04:34+00:00',
    createdAt: '2025-04-28 15:34:21'
  })

export {
    processAndStoreRewrittenNews,
    closeDatabase,
    rewriteNews
};