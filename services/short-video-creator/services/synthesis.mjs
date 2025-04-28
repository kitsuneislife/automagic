import { OpenAI } from "openai";
import { promises as fs } from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const VOICE = "alloy"; // alloy, echo, nova, shimmer
const MODEL = "gpt-4o-mini-tts"; // tts-1, gpt-4o-mini-tts

const openai = new OpenAI({
    baseURL: "https://api.zukijourney.com/v1",
    apiKey: process.env.ZUKI_API_KEY,
});

export const Synthesis = async (text, outputPath = "services/video/temp/audio.mp3") => {
    try {
        console.log("🎙️ Gerando áudio de síntese...");
        
        const response = await openai.audio.speech.create({
            model: MODEL,
            voice: VOICE,
            input: text
        });

        const fullPath = path.resolve(outputPath);
        const buffer = Buffer.from(await response.arrayBuffer());
        
        console.log(`💾 Salvando áudio em: ${fullPath}`);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, buffer);

        if (!await fs.access(fullPath).then(() => true).catch(() => false)) {
            throw new Error("Falha ao salvar arquivo de áudio");
        }

        console.log("✅ Áudio gerado com sucesso");
        return fullPath;
    } catch (error) {
        console.error("Erro ao gerar áudio:", error);
        throw error;
    }
};
