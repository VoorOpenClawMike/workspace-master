const { execFileSync } = require("node:child_process");
const { existsSync, mkdirSync, statSync } = require("node:fs");
const path = require("node:path");

const EDGE_TTS = "C:\\Users\\MikeDonker\\AppData\\Local\\Python\\pythoncore-3.14-64\\Scripts\\edge-tts.exe";
const WS_DEFAULT = "C:\\Users\\MikeDonker\\.openclaw\\workspace";

function extractText(e) {
  const c = [e?.text,e?.message,e?.payload?.text,e?.payload?.message,e?.data?.text,e?.raw,e?.context?.content];
  for (const s of c) if (typeof s==="string"&&s.trim()) return s.trim();
  return null;
}
function parseInvocation(text) {
  if (!text) return null;
  const tryParse = (s) => { try { const o=JSON.parse(s); if(o?.tool==="generate_tts"&&o?.params) return o.params; } catch{} return null; };
  const d=tryParse(text); if(d) return d;
  const s=text.indexOf("{"),e=text.lastIndexOf("}");
  if(s>=0&&e>s) return tryParse(text.slice(s,e+1));
  return null;
}

async function handler(event) {
  try {
    if (!(event?.type==="message"&&event?.action==="received")) return;
    const params = parseInvocation(extractText(event));
    if (!params) return;

    const vo_text = params.vo_text || params.text;
    const output_file = params.output_file;
    const voice = params.voice || "nl-NL-MaartenNeural";

    if (!vo_text || !output_file) throw new Error("Vereist: vo_text (of text), output_file");

    const ws = event?.context?.workspaceDir || WS_DEFAULT;
    const outPath = path.isAbsolute(output_file) ? output_file : path.resolve(ws, output_file);
    mkdirSync(path.dirname(outPath), { recursive: true });

    console.log(`[generate_tts] stem=${voice} output=${outPath}`);
    execFileSync(EDGE_TTS, ["--voice", voice, "--text", vo_text, "--write-media", outPath]);

    if (!existsSync(outPath)) throw new Error(`TTS output ontbreekt: ${outPath}`);
    const kb = (statSync(outPath).size/1024).toFixed(0);
    console.log(`[generate_tts] OK ${kb} KB`);
    if (Array.isArray(event?.messages)) event.messages.push(`OK generate_tts: ${output_file} (${kb} KB)`);
  } catch(err) {
    console.error(`[generate_tts] ERR ${err.message}`);
    if (Array.isArray(event?.messages)) event.messages.push(`ERR generate_tts: ${err.message}`);
  }
}
module.exports = handler;
module.exports.default = handler;
