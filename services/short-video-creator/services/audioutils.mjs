import ffmpeg from 'fluent-ffmpeg';

export const getAudioDurationInMs = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata.format.duration * 1000);
    });
  });
};
