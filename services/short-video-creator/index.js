import fs from "fs";
import path from "path";
import { Writer } from "./services/writer.mjs";
import { Synthesis } from "./services/synthesis.mjs";
import { Caption } from "./services/caption.mjs";
import { Convert } from "./services/convert.mjs";
import { Scenario } from "./services/scenario.mjs";
import { Composer } from "./services/composer.mjs";
import { customAlphabet } from "nanoid";
import Database from "better-sqlite3";

// Configurações gerais
const USE_CACHE = false; // Trocar para `true` para usar cache
const TEMP_FOLDER = path.join(process.cwd(), "public", "cache");
const ROTEIRO_PATH = path.join(TEMP_FOLDER, "roteiro.txt");
const AUDIO_PATH = path.join(TEMP_FOLDER, "audio.mp3");
const AUDIO_WAV_PATH = path.join(TEMP_FOLDER, "audio.wav");
const CAPTIONS_PATH = path.join(TEMP_FOLDER, "captions.json");
const SCENES_PATH = path.join(TEMP_FOLDER, "video", "scenes.json");
const FINAL_VIDEO_PATH = path.join(TEMP_FOLDER, "video", "final.mp4");

// Configuração do banco de dados SQLite
const db = new Database(path.join(process.cwd(), "public", "sqlite", "system.db"));

// Gerador de IDs globais únicos
const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
const nanoid = customAlphabet(alphabet, 16);

/**
 * Verifica se o cache está habilitado e se o arquivo existe.
 * @param {string} filePath - Caminho do arquivo.
 * @returns {boolean} - Retorna `true` se o cache for usado e o arquivo existir.
 */
const useCache = (filePath) => USE_CACHE && fs.existsSync(filePath);

/**
 * Salva o vídeo final em "public/videos" e registra seus metadados no banco de dados.
 * @param {string} globalId - ID global do vídeo.
 * @param {Object} news - Objeto contendo informações da notícia.
 */
const saveFinalVideo = async (globalId, news) => {
  try {
    console.log("🟡 Salvando vídeo final e registrando no banco de dados...");

    // Caminho do vídeo final no diretório público
    const publicVideoPath = path.join(process.cwd(), "public", "videos", `${globalId}.mp4`);
    const publicUrlPath = `/public/videos/${globalId}.mp4`;

    // Mover o vídeo final para o diretório público
    fs.renameSync(FINAL_VIDEO_PATH, publicVideoPath);
    console.log(`🟢 Vídeo final salvo com sucesso em: ${publicVideoPath}`);

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
      path: publicUrlPath,
      title: news.title,
      description: news.description,
      content: news.content,
      url: news.url,
      source: news.source,
      publishedAt: news.publishedAt,
    });

    console.log(`🟢 Metadados do vídeo registrados no banco de dados para globalId: ${globalId}`);
  } catch (error) {
    console.error("🔴 Erro ao salvar vídeo final e registrar no banco de dados:", error.message);
    throw error;
  }
};

/**
 * Gera um vídeo completo com base em um prompt e em informações da notícia.
 * @param {string} prompt - Texto que será usado para criar o vídeo.
 * @param {Object} news - Objeto contendo informações da notícia.
 */
export default async function generateVideo(prompt, news) {
  try {
    console.log("🚀 Iniciando geração do vídeo...");

    // Garantir que a pasta temporária exista
    if (!fs.existsSync(TEMP_FOLDER)) {
      fs.mkdirSync(TEMP_FOLDER, { recursive: true });
    }

    let roteiro;

    // Etapa 1: Gerar ou usar cache do roteiro
    if (useCache(ROTEIRO_PATH)) {
      console.log("🟢 Usando cache de roteiro...");
      roteiro = fs.readFileSync(ROTEIRO_PATH, "utf8");
    } else {
      console.log("🟡 Gerando novo roteiro...");
      roteiro = await Writer(prompt);
      fs.writeFileSync(ROTEIRO_PATH, roteiro);
    }

    // Etapa 2: Gerar ou usar cache do áudio
    if (useCache(AUDIO_PATH)) {
      console.log("🟢 Usando cache de áudio...");
    } else {
      console.log("🟡 Gerando novo áudio...");
      await Synthesis(roteiro, AUDIO_PATH);
    }

    // Etapa 3: Converter áudio para WAV
    console.log("🎵 Convertendo áudio para WAV...");
    await Convert(AUDIO_PATH, AUDIO_WAV_PATH);

    // Etapa 4: Gerar ou usar cache das legendas
    if (useCache(CAPTIONS_PATH)) {
      console.log("🟢 Usando cache de legendas...");
    } else {
      console.log("🟡 Gerando legendas...");
      await Caption(AUDIO_WAV_PATH);
    }

    // Etapa 5: Gerar ou usar cache do vídeo de fundo (cenas)
    if (useCache(SCENES_PATH)) {
      console.log("🟢 Usando cache de cenas...");
    } else {
      console.log("🟡 Gerando cenas...");
      await Scenario(roteiro, AUDIO_PATH, path.dirname(SCENES_PATH));
    }

    // Etapa 6: Compor vídeo final com fundo e legendas
    if (useCache(FINAL_VIDEO_PATH)) {
      console.log("🟢 Usando cache de vídeo final...");
    } else {
      console.log("🟡 Compondo vídeo final...");
      await Composer(SCENES_PATH, FINAL_VIDEO_PATH, TEMP_FOLDER);
    }

    // Etapa 7: Salvar vídeo final e registrar no banco de dados
    const globalId = nanoid();
    await saveFinalVideo(globalId, news);

    console.log("✅ Vídeo gerado e salvo com sucesso.");
  } catch (error) {
    console.error("🔴 Erro durante a geração do vídeo:", error.message);
    throw error;
  }
}