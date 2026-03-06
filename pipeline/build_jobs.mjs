import fs from "fs";
import path from "path";

// 1) JSON inlezen
const specPath = path.join(
  process.cwd(),
  "pipeline",
  "pipeline_spec.json"
);
const raw = fs.readFileSync(specPath, "utf8");
const spec = JSON.parse(raw);

const { global_defaults, videos } = spec;

// 2) Door alle video's lopen
for (const video of videos) {
  console.log("=== JOB VOOR VIDEO:", video.id, "===");
  console.log("Bestand:", video.render.filename);
  const durationSec = video.timeline?.duration_sec ?? estimateDurationSec(video, global_defaults);
  console.log("Duur:", durationSec, "sec");
  console.log("Clips:", video.assets.video_clips.join(", "));
  console.log("Voice-over:", video.assets.audio.voiceover);
  console.log("Music:", video.assets.audio.music);

  // 3) (voorbeeld) bouw een FFmpeg command als tekst
  const ffmpegCmd = buildFakeFfmpegCommand(video, global_defaults);
  console.log("FFmpeg (concept):");
  console.log(ffmpegCmd);
  console.log("\n");
}

// heel simpele placeholder: in het echt plak je hier filters, overlays, enz.
function buildFakeFfmpegCommand(video, global) {
  const out = video.render.filename;
  return [
    "ffmpeg",
    "-y",
    "-i", `"${video.assets.video_clips[0] || "input_placeholder.mp4"}"`,
    "-r", global.fps,
    "-s", global.resolution,
    "-c:v", "libx264",
    "-b:v", `"${video.render.bitrate_video || "12M"}"`,
    "-c:a", "aac",
    "-ar", "48000",
    "-b:a", "256k",
    `"${out}"`
  ].join(" ");
}


function estimateDurationSec(video, globalDefaults = {}) {
  const target = globalDefaults.duration_target_sec;
  if (Array.isArray(target) && target.length === 2) {
    const [minSec, maxSec] = target;
    return Math.round((Number(minSec) + Number(maxSec)) / 2);
  }

  const clipCount = Array.isArray(video.assets?.video_clips) ? video.assets.video_clips.length : 0;
  return Math.max(20, clipCount * 8);
}
