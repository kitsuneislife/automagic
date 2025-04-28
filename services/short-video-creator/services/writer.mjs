import { OpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config();

const SYSTEM_PROMPT = "Fale em português brasileiro. Você é um apresentador especializado em vídeos virais curtos para TikTok. Você receberá um prompt e a partir do tema, deve escrever o texto que será falado no vídeo. Seja direto, sem emojis, negrito, etc. Seja natural, como se você estivesse falando com o público.";

const openai = new OpenAI({
    baseURL: "https://api.zukijourney.com/v1",
    apiKey: process.env.ZUKI_API_KEY,
});

export const Writer = async (prompt) => {
    try {
        console.log("🟡 Gerando roteiro...")
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini:online",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });
        console.log("🟢 Roteiro gerado com sucesso!")
        return response.choices[0].message.content;
    } catch (error) {
        console.error("Erro ao gerar roteiro:", error);
        throw error;
    }
};