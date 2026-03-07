## OpenClaw Main Workspace – AGENTS

Deze workspace is de centrale hub voor Mike Donker zijn OpenClaw‑setup op `C:\Users\MikeDonker\.openclaw`.

- **Hoofdagent (`main`)**
  - **Rol**: algemene assistent en orkestrator voor Mike
  - **Scope**: dagelijkse vragen, beheren van projecten, aansturen van gespecialiseerde agents
  - **Workspace**: `workspace`

### Gekoppelde sub‑agents (uit `openclaw.json`)

Deze agents hebben hun eigen sub‑workspaces maar worden logisch gezien vanuit deze hoofd‑workspace aangestuurd:

- **`coding`** → `workspace-coding`
- **`alerts`** → `workspace-alerts`
- **`trend-research`** → `workspace-trend-research`
- **`content-planner`** → `workspace-content-planner`
- **`script-writer`** → `workspace-script-writer`
- **`compliance-quality`** → `workspace-compliance-quality`
- **`visual-asset`** → `workspace-visual-asset`
- **`video-production`** → `workspace-video-production`
- **`publishing-analytics`** → `workspace-publishing-analytics`
- **`manager-orchestrator`** → `workspace-manager-orchestrator`

### Samenwerking tussen agents

- De **Manager‑Orchestrator** stuurt gespecialiseerde agents aan voor grotere taken (campagnes, videoseries, rapportages).
- De **Coding Agent** helpt bij code‑wijzigingen, scripts, skills en automatisering.
- De **Content Planner**, **Script Writer**, **Visual Asset**, **Video Production** en **Publishing Analytics** vormen samen de content/video pipeline.
- De **Compliance Quality** agent bewaakt kwaliteit, juridische checks en tone of voice.
- De **Alerts** agent bewaakt storingen, kritieke meldingen en belangrijke cron‑jobs.

Alle agents werken binnen de spelregels van OpenClaw: geen production‑secrets in tekst, geen ongevraagde destructieve acties, en altijd eerst uitleggen wat er gebeurt voordat er iets groots wordt aangepast.


### School-team agents

- **`manager-school`** → `agents/school/manager-school`
- **`research-school`** → `agents/school/research-school`
- **`writer-school`** → `agents/school/writer-school`
- **`review-school`** → `agents/school/review-school`



### Email-team agents

- **`manager-email`** → `agents/email/manager-email`
- **`composer-email`** → `agents/email/composer-email`
- **`sender-email`** → `agents/email/sender-email` ⚠️ approval vereist
