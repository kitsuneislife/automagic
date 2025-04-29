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

export {
    processAndStoreRewrittenNews,
    closeDatabase,
    rewriteNews
};