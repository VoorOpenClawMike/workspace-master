# OpenClaw Orchestrator Workspace

Multi-agent content-productie systeem voor vastgoed-video's (TikTok, Reels, Shorts).

## Features

- 🤖 8 specialist-agents: Manager, Trend-Research, Content-Planner, Script-Writer, Compliance, Visual-Asset, Video-Production, Publishing-Analytics
- 🎬 Video-pipeline: Script → TTS → FFmpeg → MP4 (verticaal 9:16)
- 🎨 Sora 2 integratie: AI-gegenereerde B-roll en hero shots (optioneel)
- 📱 Telegram bot: Commando's via chat (/orchestrate, /video, /sora, /promo)
- 💰 Token-optimalisatie: Slimme model-routing (nano/mini/standard/premium)
- 📊 Analytics-ready: Publishing-planning + performance-tracking (toekomstig)

## Quick Start

### 1. Clone repo
```
git clone https://github.com/VoorOpenClawMike/workspace-master.git
cd workspace
```

### 2. Install dependencies
```
npm install
```

### 3. Setup .env
```
cp .env.example .env
# Vul API keys + lokale binary paths in
# FFMPEG_PATH=ffmpeg
# EDGE_TTS_PATH=edge-tts
# WORKSPACE_PATH=.
```

### 4. Test pipeline
```
node pipeline/make_render_D01.mjs
```

### 5. Start Telegram bot (optioneel)
Zie telegram/README.md

## Documentatie

- [📐 Architectuur](docs/ARCHITECTURE.md) - Hoe alles samenwerkt
- [🔄 Workflows](docs/FLOWS.md) - Concrete gebruiksvoorbeelden
- [🗺️ Roadmap](docs/ROADMAP.md) - Toekomstige features
- [📡 Telegram Commands](telegram/commands.md) - Bot-gebruik
- [🤖 OpenAI Models](openai/models-routing.md) - Model-keuze strategie

## Mappenstructuur

```
workspace/
├── agents/          # Agent-configuraties (prompts + schemas)
├── skills/          # Herbruikbare skills (tools)
├── pipeline/        # Video-rendering scripts
├── telegram/        # Bot-integratie
├── openai/          # Model-routing + Sora 2 templates
├── docs/            # Architectuur + flows
├── logs/            # Session-logs + improvements
└── output/          # Gegenereerde video's + artifacts
```

## Gebruik

Via Telegram: /video D07 Hypotheek tips

Direct (command-line): node pipeline/render_all.mjs

Via OpenClaw CLI (als je OpenClaw hebt): openclaw agent --call manager-orchestrator "Maak video D07"


## Scripts

Beschikbare npm scripts:

- `npm run render` → voert de volledige render-pipeline uit via `pipeline/render_all.mjs`.
- `npm run validate -- --file <path> [--expected-duration <sec>]` → valideert output op bestaan, grootte en (optioneel) duur.
- `npm run heartbeat` → voert een heartbeat-check uit en logt resultaat in `logs/events.jsonl`.
- `npm run check` → syntaxischeck op alle pipeline- en orchestration-scripts.

### Heartbeat usage

```bash
npm run heartbeat
```

De heartbeat controleert of `pipeline/render_all.mjs` actief is en schrijft een success/error event naar `logs/events.jsonl`.

### Validator usage

```bash
npm run validate -- --file output/D01_vertical_final.mp4 --expected-duration 30
```

De validator geeft JSON terug met `valid`, `errors` en `warnings`.

### Auto-fix usage

```bash
node orchestration/auto-fix.mjs
```

Dit script analyseert `logs/events.jsonl`, pakt de top 3 terugkerende errors en schrijft alleen suggesties (geen automatische fixes) naar `logs/auto-fix-suggestions.json`.

### Rollback usage

Maak eerst een backup state:

```bash
node orchestration/rollback.mjs
```

Rollback naar een specifieke commit:

```bash
node orchestration/rollback.mjs --to <sha>
```

De rollback history wordt bijgehouden in `memory/rollback-history.json` (laatste 5 states).

## Troubleshooting

- **`npm run heartbeat` geeft error**: start eerst `npm run render` in een aparte terminal zodat het pipelineproces detecteerbaar is.
- **Validator faalt op duur**: controleer `--expected-duration` en vergelijk met `ffprobe` output.
- **`ffprobe`/`ffmpeg` ontbreekt**: installeer FFmpeg en zet binaries in `PATH` of configureer `FFMPEG_PATH`.
- **Geen auto-fix resultaten**: controleer of `logs/events.jsonl` bestaat en error-events bevat.

## Support

Issues → Open GitHub Issue. Vragen → Zie docs/

## License

MIT (zie LICENSE)