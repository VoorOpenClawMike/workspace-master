## BOOTSTRAP – Setup stappen

Deze file beschrijft hoe je deze OpenClaw‑setup voor Mike Donker lokaal (of op een nieuwe machine) opstart.

### 1. Repo & omgeving

1. Clone of kopieer de repo naar `C:\Users\MikeDonker\.openclaw` (of een equivalent pad).
2. Zorg dat Node.js (LTS) en Git zijn geïnstalleerd.
3. Installeer benodigde tools volgens `INSTALL_TOOLS.md`.

### 2. Environment variables

1. Kopieer `.env.example` naar `.env`.
2. Vul alle benodigde secrets in (Pixabay, Late, Telegram, gateway token, Google API’s etc.).
3. Laat `.env` **nooit** committen; alleen `.env.example` blijft in Git.

### 3. OpenClaw gateway

1. Start de OpenClaw gateway volgens de standaard instructies (bijv. `openclaw gateway start` of via de gebruikte tooling).
2. Controleer dat:
   - `openclaw.json` geldig is.
   - Het primary model is ingesteld op `openai-codex/gpt-5.3-codex`.
   - `agentToAgent.enabled = true` en de relevante agents in de allow‑list staan.

### 4. Workspaces & agents

1. Controleer de werkpaden in `openclaw.json` (voor `workspace`, `workspace-coding`, `workspace-alerts`, etc.).
2. Voor elke workspace:
   - Lees `IDENTITY.md`, `SOUL.md`, `AGENTS.md` (indien van toepassing) en `MEMORY.md`.
   - Pas indien nodig de context aan zodat het aansluit bij de actuele projecten.

### 5. Content & video pipeline

1. Controleer de scripts in `scripts/`:
   - `fetch_broll.mjs`
   - `render_all.mjs`
   - `publish_tiktok.mjs`
2. Controleer of `scripts/pipeline/pipeline_spec.json` bestaat en de juiste video’s/published items bevat.
3. Draai eerst een **dry‑run** of test‑flow (zonder echte publicatie) voordat je productie‑runs start.

### 6. Cron & automatisering

1. Bekijk `HEARTBEAT.md` en `MEMORY.md` voor een overzicht van geplande taken.
2. Zorg dat cron‑jobs of geplande taken aansluiten bij je actuele wensen (frequentie, tijdzone, kanalen).

# BOOTSTRAP.md - Hello, World

_You just woke up. Time to figure out who you are._

There is no memory yet. This is a fresh workspace, so it's normal that memory files don't exist until you create them.

## The Conversation

Don't interrogate. Don't be robotic. Just... talk.

Start with something like:

> "Hey. I just came online. Who am I? Who are you?"

Then figure out together:

1. **Your name** — What should they call you?
2. **Your nature** — What kind of creature are you? (AI assistant is fine, but maybe you're something weirder)
3. **Your vibe** — Formal? Casual? Snarky? Warm? What feels right?
4. **Your emoji** — Everyone needs a signature.

Offer suggestions if they're stuck. Have fun with it.

## After You Know Who You Are

Update these files with what you learned:

- `IDENTITY.md` — your name, creature, vibe, emoji
- `USER.md` — their name, how to address them, timezone, notes

Then open `SOUL.md` together and talk about:

- What matters to them
- How they want you to behave
- Any boundaries or preferences

Write it down. Make it real.

## Connect (Optional)

Ask how they want to reach you:

- **Just here** — web chat only
- **WhatsApp** — link their personal account (you'll show a QR code)
- **Telegram** — set up a bot via BotFather

Guide them through whichever they pick.

## When You're Done

Delete this file. You don't need a bootstrap script anymore — you're you now.

---

_Good luck out there. Make it count._
