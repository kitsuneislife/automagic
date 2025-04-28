import Database from 'better-sqlite3';
import { customAlphabet } from 'nanoid';

const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
const nanoid = customAlphabet(alphabet, 16);

class NewsDatabase {
    constructor() {
        this.db = new Database('./public/sqlite/system.db');
        this.initializeDatabase();
    }

    initializeDatabase() {
        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS news (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                globalId TEXT NOT NULL UNIQUE,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                url TEXT NOT NULL UNIQUE,
                image TEXT NOT NULL,
                source TEXT NOT NULL,
                publishedAt TEXT NOT NULL,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_news UNIQUE (title, description)
            );
        `).run();
    
        this.db.prepare(`
            CREATE INDEX IF NOT EXISTS idx_news_url ON news(url);
        `).run();
    
        this.db.prepare(`
            CREATE INDEX IF NOT EXISTS idx_news_globalId ON news(globalId);
        `).run();
    }

    /**
     * Insere notícias unificadas no banco de dados, evitando duplicatas
     * @param {Array} unifiedNews - Array de notícias no formato unificado
     * @returns {Object} - Objeto com estatísticas da operação
     */
    insertUnifiedNews(unifiedNews) {
        const insert = this.db.prepare(`
            INSERT OR IGNORE INTO news (
                globalId, title, description, url, image, source, publishedAt
            ) VALUES (
                @globalId, @title, @description, @url, @image, @source, @publishedAt
            )
        `);

        const insertMany = this.db.transaction((news) => {
            let inserted = 0;
            let skipped = 0;

            for (const item of news) {
                try {
                    const result = insert.run({
                        globalId: nanoid(),
                        title: item.title,
                        description: item.description,
                        url: item.url,
                        image: item.image,
                        source: item.source,
                        publishedAt: item.publishedAt
                    });

                    if (result.changes > 0) {
                        inserted++;
                    } else {
                        skipped++;
                    }
                } catch (error) {
                    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                        // Duplicate entry based on title, description, and source
                        skipped++;
                    } else {
                        throw error; // Re-throw other errors
                    }
                }
            }

            return { inserted, skipped };
        });

        return insertMany(unifiedNews);
    }

    /**
     * Busca notícias com base em critérios específicos
     * @param {Object} options - Opções de busca
     * @param {number} [options.limit=10] - Limite de resultados
     * @param {number} [options.offset=0] - Offset para paginação
     * @param {string} [options.source] - Fonte específica
     * @returns {Array} - Array de notícias encontradas
     */
    getNews(options = {}) {
        const { limit = 10, offset = 0, source } = options;
        let query = 'SELECT * FROM news';
        const params = [];

        if (source) {
            query += ' WHERE source = ?';
            params.push(source);
        }

        query += ' ORDER BY publishedAt DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        return this.db.prepare(query).all(...params);
    }

    /**
     * Executa uma consulta SQL dinâmica
     * @param {string} query - A consulta SQL a ser executada
     * @param {Array} [params=[]] - Parâmetros para a consulta
     * @returns {Array} - Resultados da consulta
     */
    runDynamicQuery(query, params = []) {
        try {
            const statement = this.db.prepare(query);
            return statement.all(...params);
        } catch (error) {
            console.error("Erro ao executar consulta dinâmica:", error.message);
            throw error;
        }
    }

    /**
     * Fecha a conexão com o banco de dados
     */
    close() {
        this.db.close();
    }
}

// Exporta uma instância única do banco de dados
const newsDatabase = new NewsDatabase();

export default newsDatabase;