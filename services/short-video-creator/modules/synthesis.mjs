import { OpenAI } from "openai";
import { promises as fs } from "fs";
import path from "path";
import dotenv from "dotenv";

// Carregar variáveis de ambiente
dotenv.config();

// Validação de variáveis de ambiente
if (!process.env.ZUKI_API_KEY) {
  throw new Error("A variável de ambiente ZUKI_API_KEY não foi definida!");
}

// Configuração do cliente OpenAI
const openai = new OpenAI({
  baseURL: "https://api.zukijourney.com/v1",
  apiKey: process.env.ZUKI_API_KEY,
});

// Constantes para o modelo e voz
const VOICE = "alloy"; // Opções: alloy, echo, nova, shimmer
const MODEL = "gpt-4o-mini-tts"; // Opções: tts-1, gpt-4o-mini-tts

/**
 * Função para gerar a síntese de áudio.
 * @param {string} text - Texto de entrada para a síntese.
 * @param {string} [outputPath="services/video/temp/audio.mp3"] - Caminho para salvar o arquivo de áudio.
 * @returns {Promise<string>} - Caminho do arquivo gerado.
 */
export const Synthesis = async (text, outputPath = "services/video/temp/audio.mp3") => {
  try {
    console.log("🎙️ Iniciando síntese de áudio...");

    // Gerar áudio usando a API OpenAI
    const response = await openai.audio.speech.create({
      model: MODEL,
      voice: VOICE,
      input: text,
    });

    // Salvar arquivo no sistema
    const fullPath = path.resolve(outputPath);
    const buffer = Buffer.from(await response.arrayBuffer());

    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, buffer);

    // Verificar se o arquivo foi salvo corretamente
    const fileExists = await fs.access(fullPath).then(() => true).catch(() => false);
    if (!fileExists) {
      throw new Error("Falha ao salvar o arquivo de áudio.");
    }

    console.log(`✅ Áudio salvo com sucesso: ${fullPath}`);
    return fullPath;
  } catch (error) {
    console.error("Erro ao gerar áudio:", error);
    throw error;
  }
};