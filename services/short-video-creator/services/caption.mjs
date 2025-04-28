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

const subFile = async (filePath) => {
  const parsedPath = path.parse(filePath); // <<<< parse automático
  const originalFolder = path.relative(path.join(process.cwd(), "public"), parsedPath.dir);
  const outputFolder = originalFolder.replace("webcam", "subs");
  const outputFileName = parsedPath.name + ".json"; // troca extensão pra .json
  const outPath = path.join(process.cwd(), "public", outputFolder, outputFileName);

  try {
    if (!existsSync(path.join(process.cwd(), "public", outputFolder))) {
      mkdirSync(path.join(process.cwd(), "public", outputFolder), { recursive: true });
    }

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

    const { captions } = toCaptions({
      whisperCppOutput,
    });

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

export const Caption = async (filePath) => {
  try {
    console.log("✅ Conversão concluída!");
    return await subFile(filePath);
  } catch (error) {
    console.error("Erro ao gerar legendas:", error);
    throw error;
  }
};
