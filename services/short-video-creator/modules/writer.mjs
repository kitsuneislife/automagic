import { OpenAI } from "openai";
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

// Constante para o prompt do sistema
const SYSTEM_PROMPT = `
Fale em português brasileiro. Você é um apresentador especializado em vídeos virais curtos para TikTok.
Você receberá um tema e deve escrever o roteiro de um vídeo. Seja direto, sem emojis, negrito, etc.
Seja natural, como se estivesse falando com o público.
`;

/**
 * Gera o roteiro para um vídeo.
 * @param {string} prompt - Texto do tema para o roteiro.
 * @returns {Promise<string>} - Roteiro gerado.
 */
export const Writer = async (prompt) => {
  try {
    console.log("🟡 Gerando roteiro...");

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini:online",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" }
    });

    console.log("🟢 Roteiro gerado com sucesso!");
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Erro ao gerar roteiro:", error);
    throw error;
  }
};