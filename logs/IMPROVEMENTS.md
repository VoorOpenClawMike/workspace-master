# Improvements Log

## Phase 1 (codex-fase1)
- `pipeline/render_all.mjs`: import-blocker voor `fetch_broll` opgelost met lokale stub-functie en fallback.
- `pipeline/render_all.mjs`: hardcoded Windows-paden vervangen door `.env` variabelen (`FFMPEG_PATH`, `EDGE_TTS_PATH`, `WORKSPACE_PATH`).
- `pipeline/build_jobs.mjs`: `video.timeline.duration_sec` optioneel gemaakt met fallback-berekening.
- Toegevoegd: `skills/registry.json` (basis skill registry).
- Toegevoegd: `logs/events.schema.json` (event logging schema).
- Toegevoegd: `openai/models-routing.json` (model-routing basisconfig).
- Toegevoegd: `orchestration/task-queue.schema.json` (task queue schema).
- Toegevoegd: `.env.example` met pipeline-path variabelen.
- `README.md`: clone URL gefixt naar `workspace-master` en `.env` variabelen gedocumenteerd.
