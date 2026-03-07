## Email-team

Dit team beheert e-mailcommunicatie met verplichte approval-gate vóór verzending.

### Agents en rollen
- **manager-email**: orchestrator voor intake, statusbeheer, approval en handoff.
- **composer-email**: schrijft e-maildrafts op basis van input en templates.
- **sender-email**: verzendt uitsluitend goedgekeurde drafts met rate limiting en logging.

### Handoff flow
`manager → composer → manager → (approval) → sender`
