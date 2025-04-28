import fs from 'fs';
import path from 'path';

import ffmpeg from 'fluent-ffmpeg';

async function cropVideo(videoPath, outputPath, diff) {
    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
        .videoFilter('scale=720:1280')
        .fps(30)
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
    const command = ffmpeg();
    videoPaths.forEach(videoPath => {
        command.input(videoPath)
    });
    command
      .on('end', () => console.log('🟢 Concatenação concluída'))
      .on('error', (err) => console.error('🔴 Erro ao concatenar os vídeos: ' + err.message))
      .mergeToFile(path.join(outputPath, 'scenario.mp4'), './Temp');
}

export const Composer = async (scenesJsonPath, videoPathe, tempFolder) => {
    const scenes = JSON.parse(fs.readFileSync(scenesJsonPath, 'utf8'));
    console.log(scenesJsonPath, videoPathe, tempFolder)
    
    for (const [index, scene] of scenes.entries()) {
        let diff = scene.endMs - scene.startMs
        console.log(`🟡 Cortando vídeo ${index+1}/${scenes.length}... ${scene.originalDuration/1000}s -> ${diff/1000}s`)
        await cropVideo(scene.path, path.join(videoPathe, "crop", `video_${index+1}.mp4`), diff);
    }
  
    console.log(`🟡 Concatenando vídeos...`)
    const videoPaths = scenes.map((scene, index) => path.join(videoPathe, "crop", `video_${index + 1}.mp4`));
    console.log(videoPaths)
    mergeVideos(videoPaths, tempFolder);

  };  