import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchBroll } from "../fetch_broll.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const FFMPEG = "C:\\Users\\MikeDonker\\ffmpeg\\bin\\ffmpeg.exe";
const EDGE_TTS = "C:\\Users\\MikeDonker\\AppData\\Local\\Python\\pythoncore-3.14-64\\Scripts\\edge-tts.exe";
const WS    = "C:\\Users\\MikeDonker\\.openclaw\\workspace";
const SPEC  = resolve(__dirname, "pipeline_spec.json");

function abs(p) { return resolve(WS, p); }

function fileIsReal(p, minBytes = 10_000) {
  try { return statSync(p).size > minBytes; } catch { return false; }
}

function buildVoScript(video) {
  if (video.vo_text) return video.vo_text;
  return video.timeline?.segments
    ?.map(s => s.on_screen_text)
    .filter(Boolean)
    .join(". ") || video.id;
}

function generateTTS(text, voice, outPath) {
  console.log(`  [TTS] Genereer VO -> ${outPath}`);
  execFileSync(EDGE_TTS, ["--voice", voice, "--text", text, "--write-media", outPath]);
  if (!existsSync(outPath)) throw new Error(`TTS output ontbreekt: ${outPath}`);
  console.log(`  [TTS] OK (${(statSync(outPath).size/1024).toFixed(0)} KB)`);
}

function findMusicFallback(assets, shortId) {
  const musicFile = assets?.audio?.music;
  if (musicFile) {
    const p = abs(`assets/audio/${musicFile}`);
    if (existsSync(p)) return p;
  }
  const day = shortId.match(/D0?(\d+)/)?.[1]?.padStart(2,"0");
  for (const candidate of [
    `music_D${day}_bg.wav`, `music_d${day}_bg.wav`,
    "music_d01_bg.wav", "music_D01_bg.wav", "music_D02_bg.wav"
  ]) {
    const p = abs(`assets/audio/${candidate}`);
    if (existsSync(p)) { console.log(`  [MUSIC] Gebruik: ${candidate}`); return p; }
  }
  throw new Error("Geen muziekbestand gevonden");
}

function renderVideo({ videoPath, voPath, musicPath, outputPath, musicVolume }) {
  if (!existsSync(videoPath)) throw new Error(`Video niet gevonden: ${videoPath}`);
  if (!existsSync(voPath))    throw new Error(`VO niet gevonden: ${voPath}`);
  if (!existsSync(musicPath)) throw new Error(`Muziek niet gevonden: ${musicPath}`);
  mkdirSync(dirname(outputPath), { recursive: true });
  const filter = `[1:a]volume=1.0[vo];[2:a]volume=${musicVolume}[music];[vo][music]amix=inputs=2:duration=first[aout]`;
  console.log(`  [FFMPEG] Renderen -> ${outputPath}`);
  execFileSync(FFMPEG, [
    "-y","-i",videoPath,"-i",voPath,"-i",musicPath,
    "-filter_complex",filter,
    "-map","0:v","-map","[aout]",
    "-c:v","libx264","-preset","fast","-crf","20",
    "-c:a","aac","-b:a","192k",
    "-shortest", outputPath
  ], { stdio: "pipe" });
  if (!existsSync(outputPath)) throw new Error("Output ontbreekt na render");
  console.log(`  [FFMPEG] OK (${(statSync(outputPath).size/1024).toFixed(0)} KB)`);
}

// ── main ──────────────────────────────────────────────────────────────────────

const spec    = JSON.parse(readFileSync(SPEC, "utf8"));
const videos  = spec.videos || [];
const filter  = process.argv.slice(2).map(a => a.toUpperCase());

let ok = 0, fail = 0;

for (const v of videos) {
  const shortId = v.id.split("_")[0].toUpperCase();
  if (filter.length > 0 && !filter.includes(shortId)) {
    console.log(`\n⏭  ${v.id} overgeslagen`);
    continue;
  }

  console.log(`\n${"─".repeat(52)}`);
  console.log(`▶ ${v.id}`);

  try {
    // 1. VO
    const voFilename = v.assets?.audio?.voiceover || `vo_${shortId.toLowerCase()}_nl.wav`;
    const voPath = abs(`assets/audio/${voFilename}`);
    if (!fileIsReal(voPath)) {
      generateTTS(buildVoScript(v), "nl-NL-MaartenNeural", voPath);
    } else {
      console.log(`  [TTS] VO al aanwezig, skip.`);
    }

    // 2. B-roll via Pixabay (automatisch)
    let videoPath = null;
    if (v.broll_query) {
      try {
        console.log(`  [BROLL] Zoek Pixabay: "${v.broll_query}"`);
        videoPath = await fetchBroll(v.broll_query);
        console.log(`  [BROLL] Gebruik: ${videoPath}`);
      } catch (e) {
        console.warn(`  [BROLL] Pixabay mislukt (${e.message}), val terug op lokale clips`);
      }
    }

    // 3. Fallback naar lokale clips als Pixabay mislukt of geen query
    if (!videoPath || !existsSync(videoPath)) {
      for (const clip of (v.assets?.video_clips || [])) {
        const p = abs(`assets/video/${clip}`);
        if (existsSync(p)) { videoPath = p; break; }
      }
    }
    if (!videoPath || !existsSync(videoPath)) {
      const fallback = abs("assets/video/skyline_generic_vertical.mp4");
      if (existsSync(fallback)) { videoPath = fallback; console.log("  [VIDEO] Gebruik skyline fallback"); }
      else throw new Error("Geen video gevonden");
    }

    // 4. Muziek
    const musicPath = findMusicFallback(v.assets, shortId);

    // 5. Render
    const outputPath = abs(`output/${v.render?.filename || `${v.id}_final.mp4`}`);
    renderVideo({ videoPath, voPath, musicPath, outputPath, musicVolume: 0.2 });

    console.log(`  ✅ ${shortId} klaar.`);
    ok++;
  } catch (err) {
    console.error(`  ❌ ${v.id} FOUT: ${err.message}`);
    fail++;
  }
}

console.log(`\n${"─".repeat(52)}`);
console.log(`🎬 Klaar: ${ok} gerenderd, ${fail} mislukt.`);
if (fail > 0) process.exit(1);
