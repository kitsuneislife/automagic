import ffmpeg from "fluent-ffmpeg";

/**
 * Obtém a duração de um arquivo de áudio em milissegundos.
 * @param {string} filePath - Caminho do arquivo de áudio.
 * @returns {Promise<number>} - Duração do áudio em milissegundos.
 */
export const getAudioDurationInMs = async (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.error(`🔴 Erro ao obter duração do áudio: ${err.message}`);
        reject(err);
      } else {
        const duration = metadata.format.duration * 1000; // Convertendo para milissegundos
        console.log(`🟢 Duração do áudio: ${duration}ms`);
        resolve(duration);
      }
    });
  });
};

/**
 * Converte um arquivo de áudio para um formato específico.
 * @param {string} inputPath - Caminho do arquivo de entrada.
 * @param {string} outputPath - Caminho para salvar o arquivo convertido.
 * @param {string} format - Formato de áudio desejado (ex.: "wav", "mp3").
 * @returns {Promise<void>}
 */
export const convertAudioFormat = async (inputPath, outputPath, format) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat(format)
      .output(outputPath)
      .on("end", () => {
        console.log(`🟢 Arquivo convertido com sucesso: ${outputPath}`);
        resolve();
      })
      .on("error", (err) => {
        console.error(`🔴 Erro ao converter áudio: ${err.message}`);
        reject(err);
      })
      .run();
  });
};

/**
 * Ajusta o volume de um arquivo de áudio.
 * @param {string} inputPath - Caminho do arquivo de entrada.
 * @param {string} outputPath - Caminho para salvar o arquivo com volume ajustado.
 * @param {number} volume - Fator de ajuste de volume (ex.: 1.5 para aumentar em 50%, 0.5 para reduzir pela metade).
 * @returns {Promise<void>}
 */
export const adjustAudioVolume = async (inputPath, outputPath, volume) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters(`volume=${volume}`)
      .output(outputPath)
      .on("end", () => {
        console.log(`🟢 Volume ajustado com sucesso: ${outputPath}`);
        resolve();
      })
      .on("error", (err) => {
        console.error(`🔴 Erro ao ajustar volume do áudio: ${err.message}`);
        reject(err);
      })
      .run();
  });
};