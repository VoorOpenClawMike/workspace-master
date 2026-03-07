# Telegram Gateway

Deze gateway ontvangt Telegram webhooks en routeert commands naar de juiste manager-agent.

## 1) Bot token aanmaken (BotFather)
1. Open Telegram en start chat met **@BotFather**.
2. Stuur `/newbot` en volg de stappen.
3. Kopieer de token en zet die in `.env` als `TELEGRAM_BOT_TOKEN`.

## 2) Toegang afschermen (RBAC)
1. Open **@userinfobot**.
2. Stuur een bericht en kopieer je numeric `user_id`.
3. Zet dit in `.env` als `TELEGRAM_ALLOWED_USER_ID`.

Alleen deze user kan commands uitvoeren via de gateway.

## 3) Webhook instellen
1. Start de gateway:
   ```bash
   node telegram/gateway-bot.mjs
   ```
2. Zorg dat je endpoint publiek bereikbaar is op HTTPS.
3. Stel Telegram webhook in:
   ```bash
   curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url":"https://your-server.com/webhook"}'
   ```
4. Controleer webhook status:
   ```bash
   curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo"
   ```

## Commands
- `/video render D01`
- `/school rapport "AI in de zorg"`
- `/email draft "jan@example.com" "Offerteaanvraag"`
- `/discovery zoek "SaaS tools vastgoed"`
- `/status`

## Notities
- Per team gebruikt de bot `sessions_spawn` met de manager uit `telegram/gateway-config.json`.
- Zet optioneel `TELEGRAM_SESSIONS_SPAWN_CMD` als jouw OpenClaw CLI een andere commandnaam gebruikt.
