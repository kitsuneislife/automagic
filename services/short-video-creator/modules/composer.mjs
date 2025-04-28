import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";

/**
 * Recorta um vídeo com base na duração.
 * @param {string} videoPath - Caminho do vídeo original.
 * @param {string} outputPath - Caminho para salvar o vídeo recortado.
 * @param {number} durationMs - Duração do vídeo recortado em milissegundos.
 * @returns {Promise<void>}
 */
const cropVideo = async (videoPath, outputPath, durationMs) => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .videoFilter("scale=720:1280") // Ajusta para resolução vertical
      .fps(30) // Define o FPS
      .setStartTime(0) // Começa no início do vídeo
      .setDuration(durationMs / 1000) // Define a duração (em segundos)
      .output(outputPath)
      .on("end", () => {
        console.log("🟢 Corte concluído:", outputPath);
        resolve();
      })
      .on("error", (err) => {
        console.error("🔴 Erro ao cortar o vídeo:", err.message);
        reject(err);
      })
      .run();
  });
};

/**
 * Mescla vários vídeos em um único arquivo.
 * @param {string[]} videoPaths - Lista de caminhos para os vídeos a serem mesclados.
 * @param {string} outputPath - Caminho para salvar o vídeo final.
 * @returns {Promise<void>}
 */
const mergeVideos = async (videoPaths, outputPath) => {
  return new Promise((resolve, reject) => {
    const command = ffmpeg();
    videoPaths.forEach((videoPath) => {
      command.input(videoPath);
    });
    command
      .on("end", () => {
        console.log("🟢 Concatenação concluída:", outputPath);
        resolve();
      })
      .on("error", (err) => {
        console.error("🔴 Erro ao concatenar os vídeos:", err.message);
        reject(err);
      })
      .mergeToFile(outputPath, "./Temp"); // Pasta temporária durante o processo
  });
};

/**
 * Processa os vídeos com base no JSON de cenas, recortando e mesclando.
 * @param {string} scenesJsonPath - Caminho para o arquivo JSON contendo informações das cenas.
 * @param {string} videoOutputPath - Caminho para salvar o vídeo final.
 * @param {string} tempFolder - Pasta temporária para os vídeos processados.
 * @returns {Promise<void>}
 */
export const Composer = async (scenesJsonPath, videoOutputPath, tempFolder) => {
  try {
    console.log("🎬 Iniciando processamento dos vídeos...");
    const scenes = JSON.parse(fs.readFileSync(scenesJsonPath, "utf8"));

    // Cria pasta temporária para vídeos recortados
    const croppedFolder = path.join(tempFolder, "crop");
    if (!fs.existsSync(croppedFolder)) {
      fs.mkdirSync(croppedFolder, { recursive: true });
    }

    // Processa cada cena
    const croppedVideos = [];
    for (const [index, scene] of scenes.entries()) {
      const croppedVideoPath = path.join(
        croppedFolder,
        `video_${index + 1}.mp4`
      );
      console.log(
        `🟡 Cortando vídeo ${index + 1}/${scenes.length}: "${scene.path}" -> ${scene.endMs -
          scene.startMs}ms`
      );
      await cropVideo(scene.path, croppedVideoPath, scene.endMs - scene.startMs);
      croppedVideos.push(croppedVideoPath);
    }

    // Mescla os vídeos recortados
    console.log("🟡 Mesclando vídeos recortados...");
    await mergeVideos(croppedVideos, videoOutputPath);
    console.log("✅ Vídeo final gerado:", videoOutputPath);
  } catch (error) {
    console.error("Erro no Composer:", error);
    throw error;
  }
};