import fs from "fs";
import path from "path";
import { Writer } from "./services/writer.mjs";
import { Synthesis } from "./services/synthesis.mjs";
import { Caption } from "./services/caption.mjs";
import { Convert } from "./services/convert.mjs";
import { Scenario } from "./services/scenario.mjs";
import { Composer } from "./services/composer.mjs";

// Configurações gerais
const USE_CACHE = false; // Trocar para `true` para usar cache
const TEMP_FOLDER = path.join(process.cwd(), "public", "cache");
const ROTEIRO_PATH = path.join(TEMP_FOLDER, "roteiro.txt");
const AUDIO_PATH = path.join(TEMP_FOLDER, "audio.mp3");
const AUDIO_WAV_PATH = path.join(TEMP_FOLDER, "audio.wav");
const CAPTIONS_PATH = path.join(TEMP_FOLDER, "captions.json");
const SCENES_PATH = path.join(TEMP_FOLDER, "video", "scenes.json");
const VIDEO_PATH = path.join(TEMP_FOLDER, "video", "final.mp4");

/**
 * Verifica se o cache está habilitado e se o arquivo existe.
 * @param {string} filePath - Caminho do arquivo.
 * @returns {boolean} - Retorna `true` se o cache for usado e o arquivo existir.
 */
const useCache = (filePath) => USE_CACHE && fs.existsSync(filePath);

/**
 * Gera um vídeo completo com base em um prompt.
 * @param {string} prompt - Texto que será usado para criar o vídeo.
 */
export default async function generateVideo(prompt) {
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

    // Etapa 5: Gerar ou usar cache das cenas
    if (useCache(SCENES_PATH)) {
      console.log("🟢 Usando cache de cenas...");
    } else {
      console.log("🟡 Gerando cenas...");
      await Scenario(roteiro, AUDIO_PATH, path.dirname(SCENES_PATH));
    }

    // Etapa 6: Gerar ou usar cache do vídeo final
    if (useCache(VIDEO_PATH)) {
      console.log("🟢 Usando cache de vídeo final...");
    } else {
      console.log("🟡 Gerando vídeo final...");
      await Composer(SCENES_PATH, VIDEO_PATH, TEMP_FOLDER);
    }

    console.log("✅ Vídeo gerado com sucesso:", VIDEO_PATH);
  } catch (error) {
    console.error("🔴 Erro durante a geração do vídeo:", error.message);
    throw error;
  }
}