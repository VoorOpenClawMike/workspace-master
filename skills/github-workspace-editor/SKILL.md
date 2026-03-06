---
name: github-workspace-editor
version: 0.1.0
description: >
  Leest en wijzigt bestanden in deze GitHub-workspace. Kan prompts, configs en
  scripts aanpassen. Genereert commit-voorstellen voor review door gebruiker.
permissions:
  - fs:read
  - fs:write
  - process:spawn
tags:
  - code
  - repo
  - automation
---

# GitHub Workspace Editor

## Purpose

Gebruik deze skill voor: aanpassen van agent-prompts (SYSTEM_PROMPT.md), updaten van configs (pipeline_spec.json, .env.example), refactoring van scripts (pipeline/*.mjs), documentatie-updates (docs/*.md).

Niet voor: destructieve acties zonder backup (altijd eerst branch maken), wijzigen van .env (bevat secrets).

## Inputs

- **Action:** read, write, patch, commit_proposal
- **File path:** Relatief pad vanaf workspace-root
- **Content (voor write/patch):** Nieuwe content of diff

## Outputs

Read: path, content, sha. Write: path, success, backup_path. Commit Proposal: markdown met files changed, diff, reason, ready to commit (yes/no).

## Behaviour

### 1. Read File
Valideer pad (binnen workspace), lees file-content, retourneer content + metadata (SHA, size, last-modified).

### 2. Write File
Safety check: maak backup eerst (.bak suffix), schrijf nieuwe content, valideer (file-size > 0, readable), log wijziging in logs/CHANGES.md.

### 3. Patch (diff-based)
Leest huidige content, past patch toe (unified diff), valideert resultaat (geen syntax-errors), schrijft terug.

### 4. Commit Proposal
Genereert human-readable diff, voegt reasoning toe, vraagt user-bevestiging, als approved → commit + push (optioneel).

## Safety Rules

Nooit zonder backup (elke write maakt .bak). Git-first workflow (branch → wijzigingen → commit → PR). Forbidden paths: .env, .git/, node_modules/. Validation checks voor code-bestanden (syntax check, rollback bij invalid).

## Use Cases

Prompt optimization (self-improvement), config update, documentation sync. Integration met self-improvement: telemetry-logger detecteert patroon → Manager analyseert → roept github-workspace-editor aan → commit-proposal → user review → approve/reject.