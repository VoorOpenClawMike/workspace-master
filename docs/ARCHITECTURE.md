# Architecture Overview

Hoe de OpenClaw Orchestrator workspace werkt: van Telegram-bericht tot gepubliceerde video.

## High-Level Diagram

```
USER (Mike via Telegram/Web) 
  ↓
MANAGER-ORCHESTRATOR (gpt-4o/gpt-4.5)
  - Ontvangt opdrachten
  - Maakt plannen (STEP-01, STEP-02, etc.)
  - Delegeert naar specialist-agents
  - Bewaakt voortgang + consolideert resultaten
  ↓
┌────────────┬──────────────┬─────────────┐
│ TREND-     │ CONTENT-     │ SCRIPT-     │
│ RESEARCH   │ PLANNER      │ WRITER      │
│ (mini)     │ (mini)       │ (mini)      │
└────────────┴──────────────┴─────────────┘
  ↓            ↓              ↓
┌────────────┬──────────────┬─────────────┐
│ COMPLIANCE-│ VISUAL-      │ VIDEO-      │
│ QUALITY    │ ASSET        │ PRODUCTION  │
│ (gpt-4.5)  │ (mini)       │ (nano)      │
└────────────┴──────────────┴─────────────┘
  ↓
PUBLISHING-ANALYTICS (mini)
  ↓
ARTIFACTS + OUTPUTS (scripts, videos, plans → output/)
```

## Data Flow: /video D07 Command

1. User → Telegram: "/video D07 Hypotheek tips"
2. Telegram Bot → Manager-Orchestrator: {command: "video", video_id: "D07", topic: "Hypotheek tips"}
3. Manager besluit: Check pipeline_spec.json → D07 niet aanwezig → volledige cyclus (script → TTS → render)
4. Script-Writer → OpenAI gpt-4o-mini → script_D07.json
5. Compliance-Quality → OpenAI gpt-4.5 → {status: "approved"}
6. Video-Production roept skill aan: video-ffmpeg-pipeline → TTS (vo_D07_nl.wav) → FFmpeg render → output/D07.mp4
7. Manager → Telegram Bot: "✅ Video klaar! [D07.mp4]"
8. Telegram Bot → User: video + metadata

## Skills vs Agents

**Agents** (personas met domeinkennis): Hebben SYSTEM_PROMPT.md, zijn specialisten, communiceren via sessions. Voorbeelden: trend-research, script-writer, compliance-quality.

**Skills** (tools/gedragsmodules): Hebben SKILL.md, zijn herbruikbare functies, geen eigen persona. Voorbeelden: video-ffmpeg-pipeline, promo-content-writer, telemetry-logger.

Relatie: Video-Production agent roept video-ffmpeg-pipeline skill aan. Manager-Orchestrator agent roept agent-team-orchestration skill aan.

## File System Layout

workspace/
├── [CONFIG FILES] → Root: AGENTS.md, SOUL.md, IDENTITY.md (gelezen door alle agents)
├── agents/ → Agent-configuraties (prompts + schemas), elke agent = submap met SYSTEM_PROMPT.md
├── skills/ → Herbruikbare skills (SKILL.md), agents roepen deze aan als tools
├── pipeline/ → Video-rendering scripts (Node.js + FFmpeg), productie-klaar
├── output/ → Gegenereerde artifacts (runs/, videos/)
├── logs/ → Session logs + self-improvement tracking
├── telegram/ → Bot-configuratie + command-handlers
├── openai/ → Model-routing regels + Sora 2 templates
└── docs/ → Architectuur, flows, roadmap

## External Integrations

**OpenAI API:** gpt-4.1-nano (routing), gpt-4o-mini (content), gpt-4o (orchestratie), gpt-4.5 (compliance), sora-2 (video). API Key: .env → OPENAI_API_KEY.

**Telegram Bot:** Bot Token: .env → TELEGRAM_BOT_TOKEN. Webhook of Polling configureerbaar. Commands: zie telegram/commands.md.

**Edge-TTS:** Lokaal geïnstalleerd, voice nl-NL-FennaNeural, output WAV-bestanden.

**FFmpeg:** Lokaal geïnstalleerd, gebruikt voor combining voiceover + B-roll + muziek, text overlays, format conversie (9:16).

## Security & Secrets

Nooit committen: .env, node_modules/, output/*.mp4, logs/SESSION-*.md. Wel committen: .env.example, alle config-bestanden, skills/agent-prompts, pipeline-scripts. .gitignore: .env, node_modules/, output/*.mp4, output/*.wav, logs/SESSION-*.md, .DS_Store.

## Model Routing Strategy

Orchestratie: gpt-4o (multi-step planning). Scripts: gpt-4o-mini (content-generatie). Compliance: gpt-4.5 (precisie). Video prompts (Sora 2): gpt-4o (prompt-engineering). Promo copy: gpt-4o-mini. Logging: gpt-4.1-nano.
