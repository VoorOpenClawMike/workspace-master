## TOOLS – Main OpenClaw Workspace

Deze lijst beschrijft de belangrijkste tools, skills en scripts die relevant zijn voor de hoofd‑workspace.

### Gateway & agents

- **Gateway / openclaw**  
  - Draait lokaal met `openai-codex` als primary model.  
  - `agentToAgent.enabled = true` zodat gespecialiseerde agents met elkaar kunnen samenwerken.
- **Agents** (zie ook `AGENTS.md` en `openclaw.json`)  
  - `main`, `coding`, `alerts`, `trend-research`, `content-planner`, `script-writer`,  
    `compliance-quality`, `visual-asset`, `video-production`, `publishing-analytics`, `manager-orchestrator`.

### Skills (conceptueel, via `skills/`)

- **`broll-fetcher`**
  - Haalt stock/b‑roll video binnen (bijv. via Pixabay API).
  - Output: video‑bestanden onder `assets/video/`.
- **`tiktok-publisher`**
  - Publiceert gerenderde video’s naar TikTok via een externe API (Late).
  - Gebruikt een pipeline‑spec om te bepalen welke video’s gepubliceerd worden.
- **`social-posting`**
  - Maakt en plant social posts (bijv. captions, hooks, beschrijvingen) op basis van scripts en analytics.
- **`video-pipeline`**
  - Orkestreert de stappen van script → assets → render → publish.

### Scripts (Node ESM, in `scripts/`)

- **`fetch_broll.mjs`**
  - Leest `PIXABAY_API_KEY` uit `.env`.
  - Downloadt b‑roll video’s en slaat ze op in `assets/video/`.
- **`publish_tiktok.mjs`**
  - Leest `LATE_API_KEY` uit `.env`.
  - Leest `scripts/pipeline/pipeline_spec.json` in.
  - Uploadt gerenderde video’s (meestal uit `workspace/output/`) naar TikTok via de Late‑API.
- **`render_all.mjs`**
  - (Wordt in deze repo gebruikt als orchestrator voor het renderen van alle video’s volgens `pipeline_spec.json`.)

### Overige tooling

- **Git**: gebruikt als veiligheidsnet; wijzigingen worden eerst lokaal gemaakt en pas later door Mike gecommit/pusht.
- **Cron / scheduler**: via `openclaw`‑cron (zie `MEMORY.md` en `HEARTBEAT.md` voor geplande taken).

# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.
