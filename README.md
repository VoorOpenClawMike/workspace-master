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
git clone https://github.com/VoorOpenClawMike/workspace.git
cd workspace
```

### 2. Install dependencies
```
npm install
```

### 3. Setup .env
```
cp .env.example .env
# Vul API keys in
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

## Support

Issues → Open GitHub Issue. Vragen → Zie docs/

## License

MIT (zie LICENSE)