## Email-team

Dit team verzorgt e-mailcommunicatie met verplichte approval-gate.

### Agents en rollen
- **manager-email**: orchestrator van intake, draft lifecycle, approval en handoff.
- **composer-email**: schrijft e-maildrafts op basis van context en templates.
- **sender-email**: verzendt uitsluitend goedgekeurde drafts met rate-limiting en logging.

### Handoff flow
`manager → composer → manager → (approval) → sender`
