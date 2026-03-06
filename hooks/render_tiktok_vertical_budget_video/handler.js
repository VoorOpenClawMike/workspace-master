const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const DEFAULTS = {
  music_volume: 0.25, enable_music_fade: true, fade_in_duration: 1.5,
  fade_out_duration: 2.0, target_width: 1080, target_height: 1920,
  video_crf: 20, video_preset: "veryfast", audio_bitrate_kbps: 192, normalize_mix: true,
};

const WS_DEFAULT = "C:\\Users\\MikeDonker\\.openclaw\\workspace";

function resolveBinary(name) {
  const user = process.env.USERPROFILE || "";
  const candidates = {
    ffmpeg: ["ffmpeg",
      path.join(user,"AppData","Local","Microsoft","WinGet","Links","ffmpeg.exe"),
      path.join(user,"AppData","Local","Microsoft","WinGet","Packages","Gyan.FFmpeg.Essentials_Microsoft.Winget.Source_8wekyb3d8bbwe","ffmpeg-8.0.1-essentials_build","bin","ffmpeg.exe"),
      "C:\\Users\\MikeDonker\\ffmpeg\\bin\\ffmpeg.exe"],
    ffprobe: ["ffprobe",
      path.join(user,"AppData","Local","Microsoft","WinGet","Links","ffprobe.exe"),
      path.join(user,"AppData","Local","Microsoft","WinGet","Packages","Gyan.FFmpeg.Essentials_Microsoft.Winget.Source_8wekyb3d8bbwe","ffmpeg-8.0.1-essentials_build","bin","ffprobe.exe"),
      "C:\\Users\\MikeDonker\\ffmpeg\\bin\\ffprobe.exe"],
  };
  for (const c of candidates[name]||[]) { if(c===name) return c; if(fs.existsSync(c)) return c; }
  return name;
}

function toAbs(ws, p) { if(!p) return p; return path.isAbsolute(p)?p:path.resolve(ws,p); }

function resolveVideoFallback(videoFile, ws) {
  if (fs.existsSync(videoFile)) return videoFile;
  const fallback = path.resolve(ws, "assets/video/skyline_generic_vertical.mp4");
  if (fs.existsSync(fallback)) { console.log(`[hook] video fallback: skyline_generic_vertical.mp4`); return fallback; }
  throw new Error(`Video niet gevonden: ${videoFile}`);
}

function resolveMusicFallback(musicFile, ws) {
  if (fs.existsSync(musicFile)) return musicFile;
  const candidates = ["assets/audio/music_d01_bg.wav","assets/audio/music_D01_bg.wav","assets/audio/music_D02_bg.wav","assets/audio/music_d02_bg.wav"];
  for (const c of candidates) {
    const p = path.resolve(ws, c);
    if (fs.existsSync(p)) { console.log(`[hook] muziek fallback: ${c}`); return p; }
  }
  throw new Error(`Muziek niet gevonden: ${musicFile}`);
}

function getDurationSeconds(f) {
  const r = spawnSync(resolveBinary("ffprobe"),["-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",f],{encoding:"utf8"});
  const n=Number((r.stdout||"").trim()); return Number.isFinite(n)?n:null;
}

function extractText(e) {
  const c=[e?.text,e?.message,e?.payload?.text,e?.payload?.message,e?.data?.text,e?.raw,e?.context?.content];
  for(const s of c) if(typeof s==="string"&&s.trim()) return s.trim();
  return null;
}

function parseInvocation(text) {
  if(!text) return null;
  const tryParse=(s)=>{try{const o=JSON.parse(s);if(o?.tool==="render_tiktok_vertical_budget_video"&&o?.params)return o.params;}catch{}return null;};
  const d=tryParse(text); if(d) return d;
  const s=text.indexOf("{"),e=text.lastIndexOf("}");
  if(s>=0&&e>s) return tryParse(text.slice(s,e+1));
  return null;
}

function buildFilter(params, dur) {
  const norm=params.normalize_mix?1:0;
  let mc="";
  if(params.enable_music_fade&&Number.isFinite(dur)&&dur>0){
    const fi=Math.max(0,Number(params.fade_in_duration||0));
    const fo=Math.max(0,Number(params.fade_out_duration||0));
    mc=`afade=t=in:st=0:d=${fi},afade=t=out:st=${Math.max(0,dur-fo)}:d=${fo},`;
  }
  return `[1:a]volume=1.0[vo];[2:a]${mc}volume=${params.music_volume}[mus];[vo][mus]amix=inputs=2:normalize=${norm}[aout]`;
}

async function handler(event) {
  try {
    if(!(event?.type==="message"&&event?.action==="received")) return;
    const params={...DEFAULTS,...parseInvocation(extractText(event))};
    if(!params.video_file||!params.voiceover_file||!params.music_file||!params.output_file) return;

    const ws = event?.context?.workspaceDir || WS_DEFAULT;

    let videoFile = resolveVideoFallback(toAbs(ws, params.video_file), ws);
    const voiceFile = toAbs(ws, params.voiceover_file);
    let musicFile = resolveMusicFallback(toAbs(ws, params.music_file), ws);
    const outputFile = toAbs(ws, params.output_file);

    console.log("[hook] video :", videoFile);
    console.log("[hook] voice :", voiceFile);
    console.log("[hook] music :", musicFile);
    console.log("[hook] output:", outputFile);

    if(!fs.existsSync(voiceFile)) throw new Error(`VO niet gevonden: ${voiceFile}`);
    fs.mkdirSync(path.dirname(outputFile),{recursive:true});

    const dur = getDurationSeconds(videoFile);
    const filter = buildFilter(params, dur);

    const args=["-y","-i",videoFile,"-i",voiceFile,"-i",musicFile,
      "-filter_complex",filter,"-map","0:v","-map","[aout]",
      "-c:v","libx264","-preset",String(params.video_preset),"-crf",String(params.video_crf),
      "-vf",`scale=${params.target_width}:${params.target_height}:force_original_aspect_ratio=decrease`,
      "-c:a","aac","-b:a",`${params.audio_bitrate_kbps}k`,"-shortest",outputFile];

    const run=spawnSync(resolveBinary("ffmpeg"),args,{encoding:"utf8"});
    if(run.status!==0) throw new Error((run.stderr||run.stdout||"ffmpeg failed").slice(0,300));

    console.log("[hook] render OK:", outputFile);
    if(Array.isArray(event?.messages)) event.messages.push(`OK render: ${params.output_file}`);
  } catch(err) {
    console.error("[hook] ERR:", err.message);
    if(Array.isArray(event?.messages)) event.messages.push(`ERR render: ${err.message}`);
  }
}
module.exports = handler;
module.exports.default = handler;
