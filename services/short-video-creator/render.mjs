import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { customAlphabet } from "nanoid";
import Database from "better-sqlite3";

// Configuração do banco de dados SQLite
const db = new Database(path.join(process.cwd(), "public", "sqlite", "system.db"));
const initializeVideoTable = () => {
  db.prepare(`
      CREATE TABLE IF NOT EXISTS videos (
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
initializeVideoTable();

// Gerador de IDs globais únicos
const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
const nanoid = customAlphabet(alphabet, 16);

// Suporte a __dirname em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Salva o vídeo no diretório público e insere os dados no banco de dados.
 * @param {string} globalId - ID global do vídeo.
 * @param {string} outputPath - Caminho do arquivo gerado.
 * @param {Object} news - Objeto contendo informações da notícia.
 */
const saveVideoToDatabase = async (globalId, outputPath, news) => {
  try {
    console.log("🟡 Salvando vídeo e registrando no banco de dados...");

    // Caminho público
    const publicPath = `/public/videos/${globalId}.mp4`;

    // Mover o vídeo gerado para o diretório público
    const finalPath = path.join(process.cwd(), "public", "videos", `${globalId}.mp4`);
    await fs.rename(outputPath, finalPath);
    console.log(`🟢 Vídeo salvo com sucesso no caminho: ${finalPath}`);

    // Inserir os dados no banco de dados
    const insertVideo = db.prepare(`
      INSERT INTO videos (
        globalId, path, title, description, content, url, source, publishedAt, createdAt
      ) VALUES (
        @globalId, @path, @title, @description, @content, @url, @source, @publishedAt, CURRENT_TIMESTAMP
      )
    `);

    insertVideo.run({
      globalId,
      path: publicPath,
      title: news.title,
      description: news.description,
      content: news.content,
      url: news.url,
      source: news.source,
      publishedAt: news.publishedAt,
    });

    console.log(`🟢 Dados do vídeo foram inseridos no banco de dados para globalId: ${globalId}`);
  } catch (error) {
    console.error("🔴 Erro ao salvar vídeo e registrar no banco de dados:", error.message);
    throw error;
  }
};

/**
 * Renderiza um vídeo final com base em uma composição do Remotion.
 * @param {string} entryFile - Caminho do arquivo de entrada Remotion (ex.: "Remotion.tsx").
 * @param {string} compositionId - ID da composição a ser renderizada (ex.: "CaptionedVideo").
 * @param {Object} news - Objeto contendo informações da notícia.
 */
export const renderVideo = async (entryFile, compositionId, news) => {
  try {
    console.log("📦 Criando bundle para o Remotion...");
    const bundleUrl = await bundle({ entryPoint: entryFile });

    console.log("🎬 Selecionando composição...");
    const composition = await selectComposition({
      serveUrl: bundleUrl,
      id: compositionId,
    });

    console.log("🎥 Renderizando vídeo...");
    const globalId = nanoid(); // Gerar ID global para o vídeo
    const tempOutputPath = path.join(__dirname, `${globalId}.mp4`);

    await renderMedia({
      serveUrl: bundleUrl,
      composition,
      codec: "h264", // Codec padrão para vídeos MP4
      outputLocation: tempOutputPath,
    });

    console.log("✅ Vídeo renderizado com sucesso em:", tempOutputPath);

    // Salvar o vídeo no banco de dados
    await saveVideoToDatabase(globalId, tempOutputPath, news);
  } catch (error) {
    console.error("🔴 Erro ao renderizar vídeo:", error.message);
    throw error;
  }
};