import { execSync } from "node:child_process";
import path from "path";

/**
 * Converte um arquivo de áudio para o formato WAV com taxa de amostragem de 16kHz.
 * @param {string} inputPath - Caminho do arquivo de entrada (áudio original).
 * @param {string} outputPath - Caminho do arquivo de saída (áudio convertido).
 * @returns {string} - Caminho completo do arquivo convertido.
 */
export const Convert = (inputPath, outputPath) => {
  try {
    console.log(`🎶 Convertendo áudio para WAV 16kHz: ${outputPath}`);
    const fullInput = path.resolve(inputPath);   // Resolve caminho absoluto de entrada
    const fullOutput = path.resolve(outputPath); // Resolve caminho absoluto de saída

    // Executa o comando ffmpeg para realizar a conversão
    execSync(`ffmpeg -i "${fullInput}" -ar 16000 "${fullOutput}" -y`, { stdio: "inherit" });

    console.log("✅ Conversão concluída!");
    return fullOutput;
  } catch (error) {
    console.error("❌ Erro na conversão para WAV:", error);
    throw error;
  }
};