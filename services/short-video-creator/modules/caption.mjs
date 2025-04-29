import path from "path";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import {
  WHISPER_LANG,
  WHISPER_MODEL,
  WHISPER_PATH,
  WHISPER_VERSION,
} from "./whisper-config.mjs";
import {
  transcribe,
  toCaptions,
} from "@remotion/install-whisper-cpp";
import dotenv from "dotenv";

dotenv.config();

/**
 * Função para gerar e salvar legendas em formato JSON.
 * @param {string} filePath - Caminho do arquivo de áudio.
 * @returns {Promise<Object>} - Retorna as legendas geradas.
 */
const subFile = async (filePath) => {
  // Analisar o caminho do arquivo
  const parsedPath = path.parse(filePath);
  const originalFolder = path.relative(path.join(process.cwd(), "public"), parsedPath.dir);
  const outputFolder = originalFolder.replace("webcam", "subs"); // Substituir "webcam" por "subs"
  const outputFileName = parsedPath.name + ".json"; // Trocar a extensão para .json
  const outPath = path.join(process.cwd(), "public", outputFolder, outputFileName);

  try {
    // Criar a pasta de saída, se não existir
    if (!existsSync(path.join(process.cwd(), "public", outputFolder))) {
      mkdirSync(path.join(process.cwd(), "public", outputFolder), { recursive: true });
    }

    // Executar a transcrição utilizando o Whisper
    const whisperCppOutput = await transcribe({
      inputPath: filePath,
      model: WHISPER_MODEL,
      tokenLevelTimestamps: true,
      whisperPath: WHISPER_PATH,
      whisperCppVersion: WHISPER_VERSION,
      printOutput: false,
      translateToEnglish: false,
      language: WHISPER_LANG,
      splitOnWord: true,
    });

    // Converter a saída do Whisper para legendas
    const { captions } = toCaptions({
      whisperCppOutput,
    });

    // Salvar as legendas geradas em um arquivo JSON
    writeFileSync(
      outPath,
      JSON.stringify(captions, null, 2),
    );
    console.log("💾 Legendas salvas com sucesso");

    return captions;
  } catch (error) {
    console.error("Erro na transcrição:", error);
    throw error;
  }
};

/**
 * Gera legendas a partir de um arquivo de áudio.
 * @param {string} filePath - Caminho do arquivo de áudio.
 * @returns {Promise<Object>} - Retorna as legendas geradas.
 */
export const Caption = async (filePath) => {
  try {
    console.log("🚀 Iniciando geração de legendas...");
    return await subFile(filePath);
  } catch (error) {
    console.error("🔴 Erro ao gerar legendas:", error);
    throw error;
  }
};