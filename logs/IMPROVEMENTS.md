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

## Phase 2 (codex-fase2)
- Toegevoegd: `orchestration/heartbeat.mjs` voor 60s heartbeat-check met JSONL event logging en exit-codes voor monitoring.
- Toegevoegd: `validation/output-evaluator.mjs` voor output-validatie (bestaan, minimum filesize, duration-tolerantie ±5s).
- Toegevoegd: `validation/validators.json` met validator-profielen voor `video-pipeline` en `tts-generation`.
- Toegevoegd: `memory/context.json` als geheugenlaag voor render-status, error history en optimalisatie-notities.
- `skills/registry.json`: automatisch gevuld op basis van alle `SKILL.md` bestanden (naam, beschrijving, tools).


## Phase 3 (codex-fase3)
- Toegevoegd: `orchestration/auto-fix.mjs` voor analyse van `logs/events.jsonl` met top 3 terugkerende fouten en fix-suggesties naar `logs/auto-fix-suggestions.json` (zonder auto-apply).
- Toegevoegd: `orchestration/rollback.mjs` met backup-branch creatie, rollback via `--to <sha>`, en historiebeheer in `memory/rollback-history.json` (laatste 5 states).
- `package.json`: scripts toegevoegd voor `render`, `validate`, `heartbeat` en `check`.
- `README.md`: nieuwe secties toegevoegd voor scripts, heartbeat/validator/auto-fix usage en troubleshooting.
