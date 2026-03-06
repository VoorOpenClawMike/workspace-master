---
name: telemetry-logger
version: 0.1.0
description: >
  Logt alle workflow-events, agent-interacties en outputs voor monitoring,
  debugging en self-improvement. Onderhoudt IMPROVEMENTS.md voor optimalisatie-ideeën.
permissions:
  - fs:write
  - fs:read
tags:
  - logging
  - monitoring
  - telemetry
---

# Telemetry Logger

## Purpose

Gebruik deze skill voor: Session-logging (volledige trace van elke run), performance monitoring (render-tijden, token-gebruik, costs), error tracking, self-improvement tracking (optimalisatie-ideeën).

Niet voor user-facing responses (backend-only) of real-time dashboards (toekomstige feature).

## Inputs

- **Event type:** session_start, session_end, agent_call, error, improvement_idea
- **Data:** JSON-object met event-specifieke velden

## Outputs

### Session Logs
logs/SESSION-[timestamp]-[run_id].md met timeline van alle events, summary (success/failure, steps, tokens, costs, performance).

### Improvements Log
logs/IMPROVEMENTS.md met ideeën voor optimalisatie verzameld uit session-logs en errors.

## Behaviour

### 1. Session Start
Maak nieuwe log-file logs/SESSION-[timestamp]-[run_id].md, log user, goal, timestamp.

### 2. Event Logging
Elk event: timestamp, step ID, agent/skill naam, model gebruikt, tokens in/out, duration, cost, output (pad of summary).

### 3. Error Logging
Bij errors: timestamp, ERROR, step ID, agent/skill, error message, stack trace, retry status.

### 4. Session End
Consolideer summary (success/failure, steps, costs, performance), sluit log-file.

### 5. Improvement Detection
Periodiek (elke 24u): scan alle session-logs, detecteer patronen (frequent errors → fix-suggestie, slow steps → performance-tip, high costs → cost-reduction), append naar logs/IMPROVEMENTS.md.

## Metrics Tracked

Per Session: duration (totaal + per step), token usage (in/out, per model), cost (USD, breakdown), success rate (% steps completed), errors (count + types).

Aggregated (wekelijks): sessions count, success rate, total duration/tokens/cost, top errors, slowest steps, cost breakdown.

## Privacy & Security

Niet loggen: API keys/secrets, user PII (tenzij toegestaan), volledige video-content (alleen metadata). Wel loggen: user-commands (context), agent-beslissingen (debugging), performance-data (optimalisatie).
 
# SKILL

_Content volgt - zie Perplexity output voor volledige content._
