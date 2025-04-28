import { createClient } from "pexels";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { OpenAI } from "openai";
import axios from "axios";
import path from "path";
import dotenv from "dotenv";
import ffmpeg from "fluent-ffmpeg";
import { getAudioDurationInMs } from "./audioutils.mjs";

dotenv.config();

// Configuração do cliente Pexels
const client = createClient(process.env.PEXELS_API_KEY);

// Configuração do cliente OpenAI
const openai = new OpenAI({
  baseURL: "https://api.zukijourney.com/v1",
  apiKey: process.env.ZUKI_API_KEY,
});

/**
 * Busca a duração de um vídeo.
 * @param {string} url - O caminho do vídeo.
 * @returns {Promise<number>} - A duração do vídeo em milissegundos.
 */
const getVideoDuration = (url) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(url, (err, metadata) => {
      if (err) reject(err);
      else resolve(Math.round(metadata.format.duration * 1000)); // em ms
    });
  });
};

/**
 * Faz o download de um vídeo.
 * @param {string} url - A URL do vídeo.
 * @param {string} filePath - Caminho para salvar o vídeo baixado.
 */
const downloadVideo = async (url, filePath) => {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  writeFileSync(filePath, res.data);
};

/**
 * Busca vídeos no Pexels com base em uma query.
 * @param {string} query - A descrição da cena.
 * @param {number} minDuration - Duração mínima do vídeo em milissegundos.
 * @returns {Promise<object|null>} - O vídeo mais relevante encontrado ou null.
 */
const searchVideo = async (query, minDuration) => {
  try {
    const res = await client.videos.search({
      query,
      per_page: 5,
      orientation: "portrait",
      min_duration: Math.ceil(minDuration / 1000), // Pexels usa segundos
      max_duration: Math.ceil((minDuration / 1000) * 2), // Limite máximo de 2x a duração desejada
    });

    if (!res.videos?.length) return null;

    // Ordena vídeos por duração mais próxima da desejada
    const videos = res.videos.sort((a, b) => {
      const aDiff = Math.abs(a.duration - minDuration / 1000);
      const bDiff = Math.abs(b.duration - minDuration / 1000);
      return aDiff - bDiff;
    });

    return videos[0];
  } catch (err) {
    console.warn(`Erro na busca: ${err.message}`);
    return null;
  }
};

/**
 * Solicita ao OpenAI uma lista de cenas para o vídeo.
 * @param {string} scriptText - O roteiro do vídeo.
 * @returns {Promise<object[]>} - Lista de cenas geradas.
 */
const askOpenAIForScenes = async (scriptText) => {
  const SYSTEM_PROMPT = `
Você é um assistente de criação de vídeos. 
Sua tarefa é, a partir do roteiro, gerar uma lista de cenas para serem buscadas no Pexels.
Retorne APENAS uma lista JSON com objetos contendo:
- text: descrição da cena em inglês
- priority: prioridade da cena (1-5, sendo 5 a mais importante)
- weight: peso da cena na narrativa (1-5, sendo 5 para cenas que merecem mais tempo)

Exemplo:
[
  { "text": "Indigenous people in traditional clothing", "priority": 5, "weight": 4 },
  { "text": "Amazon rainforest aerial view", "priority": 4, "weight": 3 },
  { "text": "Traditional indigenous dance", "priority": 5, "weight": 5 }
]

Mantenha o número de cenas entre 6 e 10, priorizando qualidade e relevância.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: scriptText },
    ],
  });

  const content = response.choices[0].message.content;
  try {
    // Remove markdown code blocks se existirem
    const cleanContent = content.replace(/```json\n|\n```/g, "").trim();
    return JSON.parse(cleanContent);
  } catch (error) {
    console.error("Erro ao parsear JSON:", content);
    throw new Error("Resposta inválida da OpenAI");
  }
};

/**
 * Gera cenas para o vídeo com base no roteiro.
 * @param {string} scriptText - O roteiro do vídeo.
 * @param {string} audioFilePath - Caminho do arquivo de áudio.
 * @param {string} outputFolder - Pasta para salvar as cenas.
 * @returns {Promise<object[]>} - Lista de cenas geradas.
 */
export const Scenario = async (
  scriptText,
  audioFilePath,
  outputFolder = "./public/Temp/Videos"
) => {
  try {
    console.log("🎬 Gerando cenas...");
    const scenes = await askOpenAIForScenes(scriptText);
    if (!scenes?.length) throw new Error("Nenhuma cena identificada.");

    const audioDurationMs = await getAudioDurationInMs(audioFilePath);
    const savedScenes = [];

    // Calcula a duração base por peso
    const totalWeight = scenes.reduce(
      (sum, scene) => sum + (scene.weight || 1),
      0
    );
    const msPerWeight = audioDurationMs / totalWeight;

    let currentTimeMs = 0;
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const weight = scene.weight || 1;
      const targetDurationMs = Math.round(msPerWeight * weight);

      console.log(`🎬 Cena ${i + 1}: "${scene.text}"`);
      console.log(
        `   Peso: ${weight}, Duração alvo: ${targetDurationMs / 1000}s`
      );

      let video = null;
      let attempt = 0;
      const MAX_ATTEMPTS = 3;

      while (!video && attempt < MAX_ATTEMPTS) {
        video = await searchVideo(scene.text, targetDurationMs);
        attempt++;
        if (!video && attempt < MAX_ATTEMPTS) {
          console.log(`   Tentativa ${attempt + 1}...`);
          await new Promise((r) => setTimeout(r, 1000));
        }
      }

      if (video) {
        const filename = path.join(
          outputFolder,
          `video_${String(i + 1).padStart(2, "0")}.mp4`
        );
        await downloadVideo(video.video_files[0].link, filename);

        const videoDurationMs = await getVideoDuration(filename);
        console.log(`   Duração do vídeo: ${videoDurationMs / 1000}s`);

        // Ajusta o tempo final baseado na duração real do vídeo
        const endMs =
          currentTimeMs + Math.min(targetDurationMs, videoDurationMs);

        savedScenes.push({
          path: filename,
          startMs: currentTimeMs,
          endMs,
          timestampMs: Math.floor((currentTimeMs + endMs) / 2),
          text: scene.text,
          priority: scene.priority,
          weight: scene.weight,
          originalDuration: videoDurationMs,
        });

        currentTimeMs = endMs;
        console.log(
          `✅ Vídeo salvo (${(endMs - savedScenes[savedScenes.length - 1].startMs) / 1000
          }s)`
        );
      } else {
        console.warn(`⚠️ Nenhum vídeo encontrado para: "${scene.text}"`);
      }
    }

    if (!savedScenes.length) throw new Error("Nenhum vídeo encontrado.");

    // Salva metadados das cenas
    writeFileSync(
      path.join(outputFolder, "scenes.json"),
      JSON.stringify(savedScenes, null, 2)
    );

    return savedScenes;
  } catch (error) {
    console.error("Erro no Scenario:", error);
    throw error;
  }
};