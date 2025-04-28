
import fs from 'fs';
import path from 'path';

import ffmpeg from 'fluent-ffmpeg';

async function cropVideo(videoPath, outputPath, diff) {
    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
        .setStartTime(0)
        .setDuration(diff/1000)
        .output(outputPath)
        .on('end', () => {
            console.log('🟢 Corte concluído');
            resolve();
        })
        .on('error', (err) => {
            console.error('🔴 Erro ao cortar o vídeo: ' + err.message);
            reject(err);
        })
        .run();
    });
}

function mergeVideos(videoPaths, outputPath) {
  ffmpeg(videoPaths)
    .output(outputPath)
    .on('end', () => console.log('🟢 Concatenação concluída'))
    .on('error', (err) => console.error('🔴 Erro ao concatenar os vídeos: ' + err.message))
    .run();
}

export const Composer = async (scenesJsonPath, outputVideoPath) => {
    const scenes = JSON.parse(fs.readFileSync(scenesJsonPath, 'utf8'));
    
    scenes.forEach(async (scene, index) => {
      let diff = scene.endMs - scene.startMs
      console.log(`🟡 Cortando vídeo ${index+1}/${scenes.length}... ${scene.originalDuration/1000}s -> ${diff/1000}s`)
      await cropVideo(scene.path, path.join(process.cwd(), "public", "Temp", "Videos", "Crop", `video_${index+1}.mp4`), diff);
    });
  
    console.log(`🟢 Concatenando vídeos...`)
  };  