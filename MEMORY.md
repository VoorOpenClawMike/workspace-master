## MEMORY – Main Workspace

Deze MEMORY beschrijft de vaste context voor Mike Donker en hoe deze OpenClaw‑setup wordt gebruikt.

### 1. Profiel & context

- **Naam**: Mike Donker  
- **Locatie**: Nederland (CET/CEST)  
- **Domeinen**:
  - Vastgoed (onderhoud, huur, facturen, rapportages, compliance).
  - Winkel‑domein (service, voorraad, klantcommunicatie, inbox).
  - Content‑ en videoproduktie (social, TikTok, b‑roll, scripts, analytics).

### 2. Hoofdprojecten

- **Vastgoed workspaces** (`workspaces/vastgoed_*`)
  - Onderhoud (meldingen, MJOP, leveranciers).
  - Huur (huurcontracten, herinneringen).
  - Facturen (kosten, registraties).
  - Rapportage (KPI’s, 1‑pagers, kwartaaloverzichten).
  - Compliance (VvE, regelgeving, alerts).
- **Winkel workspaces** (`workspaces/winkel_*`)
  - Service (afspraken, werkbonnen, nazorg).
  - Voorraad (bestelconcepten, prijsupdates).
  - Klant (offertes, opvolging, communicatie).
  - Inbox (mailbox/kanalen bundelen, SLA).
- **Content & video**
  - Campagnes en series met een vaste pipeline: trend‑research → content‑planning → script‑writing → visual assets → video‑productie → publishing & analytics.

### 3. Voorkeuren & werkwijze

- Duidelijke scheiding tussen:
  - **Configuratie** (`openclaw.json`, workspaces).
  - **Secrets** (`.env` – nooit in Git).
  - **Documentatie** (markdown in workspaces/skills).
- Voorkeur voor:
  - Node ESM scripts (`.mjs`) met kleine, gerichte taken.
  - Per‑agent MEMORY‑bestanden met concrete voorbeelden en randvoorwaarden.
  - Git als veiligheidsnet: wijzigingen eerst lokaal testen, daarna pas committen/pushen.

### 4. Cron‑overzicht (conceptueel)

> Exacte implementatie hangt af van de OpenClaw‑cronconfig. Dit is het inhoudelijke ontwerp.

- **Dagelijks (ochtend)**
  - Trend‑research agent verzamelt relevante trends/nieuws voor content.
  - Alerts agent checkt kritieke fouten in logs en belangrijke pipelines.
  - Vastgoed‑rapportage agent maakt korte dagelijkse update (indien geactiveerd).
- **Wekelijks**
  - Content‑planner agent werkt een contentkalender bij op basis van trend‑research en analytics.
  - Script‑writer agent genereert scripts voor geplande video’s/posts.
  - Compliance‑quality agent doet steekproefsgewijze kwaliteits‑/compliance‑checks.
- **Campagne‑gebonden / ad‑hoc**
  - Video‑pipeline runt om nieuwe video’s te renderen en klaar te zetten.
  - Publishing‑analytics agent monitort prestaties en schrijft mini‑rapportjes.

### 5. Belangrijke paden

- Repo‑root: `C:\Users\MikeDonker\.openclaw`
- Hoofd‑workspace: `workspace`
- Sub‑workspaces: `workspace-*`
- Vastgoed/winkel‑workspaces: `workspaces/`
- Scripts: `scripts/`
- Skills: `skills/`

Deze MEMORY mag door gespecialiseerde agents worden gelezen, maar alleen door de **Manager‑Orchestrator** of Mike zelf aangepast worden als de werkelijkheid structureel verandert.