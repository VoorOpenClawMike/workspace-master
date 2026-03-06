## HEARTBEAT – Monitoring & Health

Deze file beschrijft hoe de “hartslag” van de OpenClaw‑setup van Mike Donker bewaakt wordt.

### Doel

- Zicht houden op:
  - Of de gateway draait.
  - Of belangrijke cron‑taken succesvol lopen.
  - Of de content/video pipeline nog klopt met de werkelijkheid.

### Dagelijkse checks (handmatig of via agent)

- **Gateway status**
  - Controleer of de OpenClaw gateway lokaal draait en bereikbaar is.
  - Bevestig dat het primary model (`openai-codex/gpt-5.3-codex`) nog goed reageert.
- **Logs & errors**
  - Scan recente logs (zonder gevoelige data te loggen).
  - Noteer opvallende fouten of timeouts in een aparte notitie of ticket.

### Wekelijkse checks

- **Workspaces & MEMORY**
  - Loop kort door de belangrijkste workspaces (`workspace-*`) en check of `MEMORY.md` nog actueel is.
  - Check of er nieuwe processen/projecten zijn die een aparte workspace verdienen.
- **Skills & scripts**
  - Test de belangrijkste scripts:
    - `node scripts/fetch_broll.mjs test`
    - `node scripts/render_all.mjs --dry-run`
    - `node scripts/publish_tiktok.mjs --dry-run` (indien ondersteund / veilig).
  - Controleer of `pipeline_spec.json` nog klopt met de actuele content‑planning.

### Maandelijkse checks

- Review `.env.example` en documentatie (`INSTALL_TOOLS.md`, `GMAIL_CALENDAR_SETUP.md`) zodat nieuwe omgevingen snel opgezet kunnen worden.
- Check of externe API‑sleutels (Pixabay, Late, Google, etc.) nog geldig zijn (zonder ze in deze repo op te nemen).

### Alerts agent

- De **Alerts** agent (`workspace-alerts`) mag notificaties geven als:
  - Belangrijke cron‑taken falen.
  - Scripts structureel mislukken.
  - Externe API’s structureel fouten teruggeven.

# HEARTBEAT.md

# Keep this file empty (or with only comments) to skip heartbeat API calls.

# Add tasks below when you want the agent to check something periodically.
