import { execSync } from "node:child_process";
import path from "path";

export const Convert = (inputPath, outputPath) => {
  try {
    console.log(`🎶 Convertendo áudio para WAV 16kHz: ${outputPath}`);
    const fullInput = path.resolve(inputPath);
    const fullOutput = path.resolve(outputPath);

    execSync(`ffmpeg -i "${fullInput}" -ar 16000 "${fullOutput}" -y`, { stdio: "inherit" });

    console.log("✅ Conversão concluída!");
    return fullOutput;
  } catch (error) {
    console.error("❌ Erro na conversão para WAV:", error);
    throw error;
  }
};
