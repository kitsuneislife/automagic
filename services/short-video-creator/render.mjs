import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import path from 'path';
import fs from 'fs/promises';
import {fileURLToPath} from 'url';

// Suporte a __dirname em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function renderVideo() {
  const outDir = path.join(__dirname, 'output');
  await fs.mkdir(outDir, {recursive: true});
  const entry = path.join(__dirname, 'Remotion.tsx');
  const bundleUrl = await bundle({entryPoint: entry});
  const composition = await selectComposition({serveUrl: bundleUrl, id: 'CaptionedVideo'});
  await renderMedia({
    serveUrl: bundleUrl,
    composition,
    codec: 'h264',
    outputLocation: path.join(outDir, 'output.mp4'),
  });
  console.log('Vídeo renderizado com sucesso em:', path.join(outDir, 'output.mp4'));
}

renderVideo().catch((err) => {
  console.error('Erro ao renderizar vídeo:', err);
});