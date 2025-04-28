import { createCanvas, loadImage, registerFont } from 'canvas';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import Database from 'better-sqlite3';
import { OpenAI } from 'openai';
import { customAlphabet } from 'nanoid';
import dotenv from 'dotenv';

dotenv.config();

// Configuração do OpenAI com ZukiJourney
const openai = new OpenAI({
    baseURL: "https://api.zukijourney.com/v1",
    apiKey: process.env.ZUKI_API_KEY,
});

// Configuração do banco de dados SQLite
const db = new Database(path.join(process.cwd(), 'public', 'sqlite', 'system.db'));

// Registrar fonte
registerFont(path.join(process.cwd(), 'public', 'fonts', 'work-sans-bold.ttf'), { 
    family: 'Work Sans',
    weight: 'bold',
    style: 'normal',
});

// Gerador de IDs globais únicos
const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
const nanoid = customAlphabet(alphabet, 16);

// Inicializar tabela de imagens
const initializeImageTable = () => {
    //db.prepare('drop table if exists images').run();
    db.prepare(`
        CREATE TABLE IF NOT EXISTS images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            globalId TEXT NOT NULL UNIQUE,
            path TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            content TEXT,
            url TEXT NOT NULL,
            source TEXT,
            publishedAt TEXT,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        );
    `).run();
};
initializeImageTable();

// Sistema de prompt para categorização
const SYSTEM_PROMPT_CATEGORY = `
Você é um assistente de categorização. Classifique a seguinte manchete em uma das seguintes categorias: Política, Economia, Educação, Tecnologia, Esportes, Entretenimento, Saúde, Meio Ambiente.
`;

// Sistema de prompt para gerar descrição visual
const SYSTEM_PROMPT_IMAGE_QUERY = `
Você é um assistente para gerar descrições visuais. Receberá uma manchete e deve criar uma descrição curta e visual em inglês que seja adequada para buscar imagens representativas em um banco de dados de imagens (como o Pexels). A descrição deve ser clara, genérica e otimizada para encontrar imagens relevantes. Não inclua palavras desnecessárias.

Exemplo:
Manchete: "Eleições presidenciais estão marcadas para setembro."
Descrição visual: "Presidential elections, voting booths, democracy."
`;

// Função para gerar a categoria da manchete usando OpenAI
const generateCategory = async (headline) => {
    try {
        console.log("🟡 Gerando categoria...");
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini:online",
            messages: [
                { role: "system", content: SYSTEM_PROMPT_CATEGORY },
                { role: "user", content: `Manchete: "${headline}"` }
            ],
            response_format: { type: "text" }
        });

        const category = response.choices[0].message.content.trim();
        console.log("🟢 Categoria gerada:", category);
        return category;
    } catch (error) {
        console.error("🔴 Erro ao gerar categoria:", error.message);
        throw error;
    }
};

// Função para gerar uma descrição visual para o Pexels
const generateImageQuery = async (headline) => {
    try {
        console.log("🟡 Gerando descrição visual para o Pexels...");
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini:online",
            messages: [
                { role: "system", content: SYSTEM_PROMPT_IMAGE_QUERY },
                { role: "user", content: `Manchete: "${headline}"` }
            ],
            response_format: { type: "text" }
        });

        const query = response.choices[0].message.content.trim();
        console.log("🟢 Descrição visual gerada:", query);
        return query;
    } catch (error) {
        console.error("🔴 Erro ao gerar descrição visual:", error.message);
        throw error;
    }
};

// Função para buscar uma imagem no Pexels
const fetchPexelsImage = async (query) => {
    const apiKey = process.env.PEXELS_API_KEY;
    
    try {
        console.log("🟡 Buscando imagem representativa no Pexels...");
        const response = await axios.get("https://api.pexels.com/v1/search", {
            headers: {
                Authorization: apiKey,
            },
            params: {
                query,
                orientation: "square",
                per_page: 1,
            },
        });

        if (response.data.photos && response.data.photos.length > 0) {
            const imageUrl = response.data.photos[0].src.large;
            console.log("🟢 Imagem encontrada no Pexels:", imageUrl);
            return imageUrl;
        } else {
            throw new Error("Nenhuma imagem encontrada.");
        }
    } catch (error) {
        console.error("🔴 Erro ao buscar imagem no Pexels:", error.message);
        throw error;
    }
};

// Função para salvar a imagem e inserir no banco de dados
const saveImageToDatabase = async (canvas, globalId, rewrittenNews) => {
    try {
        console.log("🟡 Salvando imagem e inserindo dados no banco de dados...");

        // Gerar o caminho para salvar a imagem
        const imagePath = path.join(process.cwd(), 'public', 'images', `${globalId}.png`);
        const publicPath = `/public/images/${globalId}.png`;

        // Salvar a imagem no disco
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(imagePath, buffer);
        console.log(`🟢 Imagem salva com sucesso no caminho: ${imagePath}`);

        // Inserir os dados no banco de dados
        const insertImage = db.prepare(`
            INSERT INTO images (
                globalId, path, title, description, content, url, source, publishedAt
            ) VALUES (
                @globalId, @path, @title, @description, @content, @url, @source, @publishedAt
            )
        `);

        insertImage.run({
            globalId,
            path: publicPath,
            title: rewrittenNews.title,
            description: rewrittenNews.description,
            content: rewrittenNews.content,
            url: rewrittenNews.url,
            source: rewrittenNews.source,
            publishedAt: rewrittenNews.publishedAt,
        });

        console.log(`🟢 Dados da imagem e da notícia foram inseridos no banco de dados para globalId: ${globalId}`);

        return { imagePath, globalId };
    } catch (error) {
        console.error("🔴 Erro ao salvar imagem e inserir no banco de dados:", error.message);
        throw error;
    }
};

// Função principal para gerar imagem
export const generateImage = async (headline, rewrittenNews) => {
    try {
        console.log("🟡 Gerando imagem...");

        // Criar o canvas e obter o contexto
        const canvas = createCanvas(512, 512);
        const ctx = canvas.getContext('2d');

        // Gerar ID global para a imagem
        const globalId = nanoid();

        // Gerar descrição visual e buscar imagem no Pexels
        const query = await generateImageQuery(headline);
        const imageUrl = await fetchPexelsImage(query);
        const shadowPath = path.join(process.cwd(), 'public', 'cache', 'shadow.png');

        // Carregar a imagem do Pexels e a sombra
        const image = await loadImage(imageUrl);
        const shadow = await loadImage(shadowPath);

        // Redimensionar a imagem para o tamanho do canvas
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        // Adicionar a sombra
        ctx.drawImage(shadow, 0, 0, canvas.width, canvas.height);

        // Renderizar título
        ctx.save();
        ctx.font = '16px "Work Sans"';
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillText(rewrittenNews.title.toUpperCase(), 20, 385);
        ctx.restore();

        // Renderizar manchete
        ctx.font = '24px "Work Sans"';
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        const wrapText = (context, text, x, y, maxWidth, lineHeight) => {
            const words = text.split(' ');
            let line = '';

            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = context.measureText(testLine);
                const testWidth = metrics.width;
                if (testWidth > maxWidth && n > 0) {
                    context.fillText(line, x, y);
                    line = words[n] + ' ';
                    y += lineHeight;
                } else {
                    line = testLine;
                }
            }
            context.fillText(line, x, y);
        };

        wrapText(ctx, headline, 20, 420, canvas.width - 20, 30);

        // Salvar a imagem no banco de dados
        const result = await saveImageToDatabase(canvas, globalId, rewrittenNews);

        return result;
    } catch (error) {
        console.error("🔴 Erro ao gerar imagem:", error.message);
        throw error;
    }
};