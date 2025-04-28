import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

// Suporte a __dirname em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Renderiza um vídeo final com base em uma composição do Remotion.
 * @param {string} entryFile - Caminho do arquivo de entrada Remotion (ex.: "Remotion.tsx").
 * @param {string} compositionId - ID da composição a ser renderizada (ex.: "CaptionedVideo").
 * @param {string} outputPath - Caminho para salvar o vídeo renderizado.
 * @returns {Promise<void>}
 */
export const renderVideo = async (entryFile, compositionId, outputPath) => {
  try {
    console.log("📦 Criando bundle para o Remotion...");
    const bundleUrl = await bundle({ entryPoint: entryFile });

    console.log("🎬 Selecionando composição...");
    const composition = await selectComposition({
      serveUrl: bundleUrl,
      id: compositionId,
    });

    console.log("🎥 Renderizando vídeo...");
    await renderMedia({
      serveUrl: bundleUrl,
      composition,
      codec: "h264", // Codec padrão para vídeos MP4
      outputLocation: outputPath,
    });

    console.log("✅ Vídeo renderizado com sucesso em:", outputPath);
  } catch (error) {
    console.error("🔴 Erro ao renderizar vídeo:", error.message);
    throw error;
  }
};

/**
 * Função principal para renderizar o vídeo final.
 * Este exemplo usa uma composição chamada "CaptionedVideo".
 */
async function main() {
  const outDir = path.join(__dirname, "output");
  const entry = path.join(__dirname, "Remotion.tsx");
  const outputFilePath = path.join(outDir, "output.mp4");

  // Garantir que a pasta de saída exista
  await fs.mkdir(outDir, { recursive: true });

  // Renderizar o vídeo
  await renderVideo(entry, "CaptionedVideo", outputFilePath);
}

// Executa o processo principal e captura erros
main().catch((err) => {
  console.error("Erro ao renderizar vídeo:", err);
});