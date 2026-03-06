import fs from "fs";
import path from "path";

// 1) Pad naar de spec
const workspaceDir = process.cwd(); // verwacht dat je dit script draait vanuit workspace
const specPath = path.join(workspaceDir, "pipeline", "pipeline_spec.json");

// 2) JSON inlezen
const raw = fs.readFileSync(specPath, "utf8");
const spec = JSON.parse(raw);

// 3) D01 video pakken
const videoId = "D01_budgetbreakdown_350k_haarlem";
const video = spec.videos.find(v => v.id === videoId);

if (!video) {
  console.error("Video met id", videoId, "niet gevonden in pipeline_spec.json");
  process.exit(1);
}

// 4) Eenvoudige FFmpeg-command opbouwen
// LET OP: pas deze paths aan naar waar je je echte assets neerzet.
const firstClip = video.assets.video_clips[0] || "input_placeholder.mp4";
const inputPath = `assets/video/${firstClip}`;   // bijv. C:\...\workspace\assets\video\...
const outputPath = path.join(
  "output",
  video.render.filename || "output_D01.mp4"
);

// Zorg dat output-map bestaat
const jobsDir = path.join(workspaceDir, "jobs");
const outputDir = path.join(workspaceDir, "output");
if (!fs.existsSync(jobsDir)) fs.mkdirSync(jobsDir, { recursive: true });
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// bitrate uit render normaliseren naar iets als 12M
let bitrate = "12M";
if (video.render.bitrate_video) {
  // pak het eerste getal voor 'M'
  const match = String(video.render.bitrate_video).match(/(\d+)\s*M/);
  if (match) bitrate = `${match[1]}M`;
}

// Simpele ffmpeg command (zonder filters, alleen eerste clip -> verticaal export)
const ffmpegCmd = [
  "ffmpeg",
  "-y",
  `-i "${inputPath}"`,
  "-r 30",
  "-s 1080x1920",
  "-c:v libx264",
  `-b:v ${bitrate}`,
  "-c:a aac",
  "-ar 48000",
  "-b:a 256k",
  `"${outputPath}"`
].join(" ");

// 5) BAT-bestand schrijven
const batPath = path.join(jobsDir, "render_D01.bat");
const batContent = `@echo off
REM Auto-generated render script for ${videoId}
cd /d "%~dp0.."
${ffmpegCmd}
echo.
echo Klaar: ${outputPath}
pause
`;

fs.writeFileSync(batPath, batContent, "utf8");

console.log("Jobbestand aangemaakt:", batPath);
console.log("Zorg dat je clip bestaat op:", inputPath);
