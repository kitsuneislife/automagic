import { OpenAI } from "openai";
import dotenv from "dotenv";
import { customAlphabet } from "nanoid";
import Database from "better-sqlite3";

// Configuração do dotenv para carregar variáveis de ambiente
dotenv.config();

// Gerador de `globalId` único
const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
const nanoid = customAlphabet(alphabet, 16);

// Instância OpenAI configurada para a API ZukiJourney
const SYSTEM_PROMPT = `
Fale em português brasileiro. Você é um jornalista profissional, comprometido com a verdade, com o respeito e a democracia. 

Você receberá um objeto JSON com informações de uma notícia e, a partir dele, deverá reescrever as notícias em português brasileiro. Deve conferir as fontes e as informações. 
Certifique-se de incluir contexto adicional, explicações detalhadas, possíveis impactos, e conexões relevantes. 
Estruture a notícia de forma que ela seja clara, informativa e interessante para o público. 

Use um tom jornalístico e investigativo. Divida o conteúdo em parágrafos bem desenvolvidos e inclua respostas implícitas às seguintes perguntas: 
"Quem está envolvido?", "O que aconteceu?", "Quando aconteceu?", "Onde aconteceu?", "Por que é importante?" e "Como isso afeta o público?"

Retorne APENAS o JSON com as seguintes informações:
{
    "title": "string",
    "description": "string",
    "content": "string"
}`;

const openai = new OpenAI({
    baseURL: "https://api.zukijourney.com/v1",
    apiKey: process.env.ZUKI_API_KEY,
});

// Função para reescrever a notícia usando a API OpenAI
const rewriteNews = async (originalNews) => {
    try {
        console.log("🟡 Reescrevendo notícia...");
        const prompt = JSON.stringify({
            title: originalNews.title,
            description: originalNews.description,
            content: originalNews.description, // Usando a descrição como conteúdo inicial
        });

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini:online",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        const rewrittenContent = JSON.parse(response.choices[0].message.content);

        // Adicionar informações originais à notícia reescrita
        return {
            globalId: nanoid(), // Gerar um novo globalId
            title: rewrittenContent.title,
            description: rewrittenContent.description,
            content: rewrittenContent.content,
            url: originalNews.url,
            source: originalNews.source,
            publishedAt: originalNews.publishedAt,
        };
    } catch (error) {
        console.error("🔴 Erro ao reescrever notícia:", error.message);
        throw error;
    }
};

// Configuração do banco de dados SQLite
class NewsDatabase {
    constructor() {
        this.db = new Database('./public/sqlite/system.db');
        this.initializeDatabase();
    }

    initializeDatabase() {
        // Criar tabela para notícias reescritas
        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS news_rewritten (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                globalId TEXT NOT NULL UNIQUE,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                content TEXT NOT NULL,
                url TEXT NOT NULL,
                source TEXT NOT NULL,
                publishedAt TEXT NOT NULL,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP
            );
        `).run();
    }

    // Insere uma notícia reescrita no banco de dados
    insertRewrittenNews(rewrittenNews) {
        const insert = this.db.prepare(`
            INSERT INTO rewritten_news (
                globalId, title, description, content, url, source, publishedAt
            ) VALUES (
                @globalId, @title, @description, @content, @url, @source, @publishedAt
            )
        `);

        return insert.run(rewrittenNews);
    }

    // Fecha a conexão com o banco de dados
    close() {
        this.db.close();
    }
}

// Instância única do banco de dados
const newsDatabase = new NewsDatabase();

// Função para processar, reescrever e armazenar a notícia
const processAndStoreRewrittenNews = async (originalNews) => {
    try {
        // Reescrever notícia
        const rewrittenNews = await rewriteNews(originalNews);

        // Inserir notícia reescrita no banco de dados
        const insertResult = newsDatabase.insertRewrittenNews(rewrittenNews);
        console.log("🟢 Notícia reescrita armazenada com sucesso!");

        return { rewritten: rewrittenNews, result: insertResult };
    } catch (error) {
        console.error("🔴 Erro ao processar e armazenar notícia reescrita:", error.message);
        throw error;
    }
};

// Encerramento da conexão com o banco de dados
const closeDatabase = () => {
    newsDatabase.close();
};

// Exporta as funções principais para uso
export {
    processAndStoreRewrittenNews,
    closeDatabase
};