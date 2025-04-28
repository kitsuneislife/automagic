import fs from "fs";
import path from "path";
import { Writer } from "./services/writer.mjs";
import { Synthesis } from "./services/synthesis.mjs";
import { Caption } from "./services/caption.mjs";
import { Convert } from "./services/convert.mjs";
import { Scenario } from "./services/scenario.mjs";
import { Composer } from "./services/composer.mjs";

const USE_CACHE = false;
//const prompt = "Os povos originários do Brasil";

const TEMP_FOLDER = path.join(process.cwd(), "services", "video", "temp");
const ROTEIRO_PATH = `${TEMP_FOLDER}/roteiro.txt`;
const AUDIO_PATH = `${TEMP_FOLDER}/audio.mp3`;
const AUDIO_WAV_PATH = `${TEMP_FOLDER}/audio.wav`;
const CAPTIONS_PATH = `${TEMP_FOLDER}/captions.json`;
const SCENES_PATH = `${TEMP_FOLDER}/video/scenes.json`;
const VIDEO_PATH = `${TEMP_FOLDER}/video/`;

const useCache = (path) => USE_CACHE && fs.existsSync(path);

export default async function generateVideo(prompt) {
  let roteiro;

  if (useCache(ROTEIRO_PATH)) {
    console.log("🟢 Usando cache de roteiro...");
    roteiro = fs.readFileSync(ROTEIRO_PATH, "utf8");
  } else {
    console.log("🟡 Gerando novo roteiro...");
    roteiro = await Writer(prompt);
    fs.writeFileSync(ROTEIRO_PATH, roteiro);
  }


  if (useCache(AUDIO_PATH)) {
    console.log("🟢 Usando cache de áudio...");
  } else {
    console.log("🟡 Gerando novo áudio...");
    await Synthesis(roteiro, AUDIO_PATH);
  }
  
  Convert(AUDIO_PATH, AUDIO_WAV_PATH);
  
  if (useCache(CAPTIONS_PATH)) {
    console.log("🟢 Usando cache de legendas...");
  } else {
    console.log("🟡 Gerando legendas...");
    await Caption(AUDIO_WAV_PATH); 
  }

  if (useCache(SCENES_PATH)) {
    console.log("🟢 Usando cache de cenas...");
  } else {
    console.log("🟡 Gerando cenas...");
    await Scenario(roteiro, AUDIO_PATH, VIDEO_PATH);
  }

  if (useCache(VIDEO_PATH)) {
    console.log("🟢 Usando cache de vídeo final...");
  } else {
    console.log("🟡 Gerando vídeo final...");
    await Composer(SCENES_PATH, VIDEO_PATH, TEMP_FOLDER);
  }
}
