#!/usr/bin/env node
import http from 'node:http';
import { URL } from 'node:url';
import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { approve, reject, listPending } from '../orchestration/approval-handler.mjs';

dotenv.config();

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const dashboardScriptPath = path.resolve(repoRoot, 'orchestration/dashboard.mjs');

const PORT = Number(process.env.PORT || 3000);
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_ALLOWED_USER_ID = process.env.TELEGRAM_ALLOWED_USER_ID;
const TELEGRAM_WEBHOOK_URL = process.env.TELEGRAM_WEBHOOK_URL;
const GATEWAY_CONFIG_PATH = process.env.TELEGRAM_GATEWAY_CONFIG_PATH || 'telegram/gateway-config.json';
const SPAWN_MAX_RETRIES = Number(process.env.TELEGRAM_SPAWN_MAX_RETRIES || 3);
const SEND_MAX_RETRIES = Number(process.env.TELEGRAM_SEND_MAX_RETRIES || 3);
const RETRY_DELAY_MS = Number(process.env.TELEGRAM_RETRY_DELAY_MS || 800);

const activeTasks = new Map();
let gatewayConfig;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureEnv() {
  const missing = [];
  if (!TELEGRAM_BOT_TOKEN) missing.push('TELEGRAM_BOT_TOKEN');
  if (!TELEGRAM_ALLOWED_USER_ID) missing.push('TELEGRAM_ALLOWED_USER_ID');

  if (missing.length > 0) {
    throw new Error(`Missing required env var(s): ${missing.join(', ')}`);
  }
}

async function loadGatewayConfig() {
  const configRaw = await readFile(GATEWAY_CONFIG_PATH, 'utf8');
  const parsed = JSON.parse(configRaw);

  if (!Array.isArray(parsed.teams)) {
    throw new Error('Invalid gateway config: teams array ontbreekt.');
  }

  const teamsById = new Map();
  for (const team of parsed.teams) {
    if (!team.id || !team.manager || !Array.isArray(team.commands)) {
      throw new Error(`Invalid team entry in config: ${JSON.stringify(team)}`);
    }
    teamsById.set(team.id, team);
  }

  return { ...parsed, teamsById };
}

async function retry(taskFn, maxRetries, label) {
  let attempt = 0;
  let lastErr;

  while (attempt < maxRetries) {
    attempt += 1;
    try {
      return await taskFn(attempt);
    } catch (err) {
      lastErr = err;
      if (attempt >= maxRetries) break;
      console.warn(`[retry:${label}] attempt ${attempt} failed: ${err.message}`);
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  throw new Error(`[${label}] failed after ${maxRetries} attempts: ${lastErr?.message || 'unknown error'}`);
}

function normalizeText(text) {
  return (text || '').trim();
}

function splitArgs(input) {
  const args = [];
  const regex = /"([^"]*)"|(\S+)/g;
  let match;

  while ((match = regex.exec(input)) !== null) {
    args.push(match[1] ?? match[2]);
  }

  return args;
}

function parseCommand(text) {
  const normalized = normalizeText(text);
  if (!normalized.startsWith('/')) return null;

  const tokens = splitArgs(normalized);
  const [rawTeam, ...rest] = tokens;
  const teamId = rawTeam.replace(/^\//, '').toLowerCase();

  if (['status', 'approve', 'reject', 'pending', 'dashboard'].includes(teamId)) {
    return { teamId, action: teamId, args: rest };
  }

  const [action, ...args] = rest;
  return { teamId, action: action?.toLowerCase(), args };
}

async function sendTelegramMessage(chatId, text) {
  const endpoint = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  return retry(async () => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.ok === false) {
      throw new Error(`Telegram API error (${response.status}): ${payload?.description || 'unknown'}`);
    }

    return payload;
  }, SEND_MAX_RETRIES, 'telegram-send');
}

function validateAccess(update) {
  const message = update?.message;
  const fromId = message?.from?.id;
  const chatId = message?.chat?.id;

  if (!message || !chatId) {
    return { ok: false, reason: 'Geen geldig Telegram message object ontvangen.', chatId: null };
  }

  if (String(fromId) !== String(TELEGRAM_ALLOWED_USER_ID)) {
    return { ok: false, reason: 'Niet geautoriseerd. Deze bot is RBAC-protected.', chatId };
  }

  return { ok: true, chatId };
}

function getUsageForTeam(team) {
  return `Gebruik: /${team.id} <${team.commands.join('|')}> ...`;
}

function getStatusMessage() {
  const teamLines = gatewayConfig.teams.map((team) => {
    const task = activeTasks.get(team.id);
    const taskSummary = task ? `${task.action} (${task.status})` : 'idle';
    return `- ${team.id}: manager=${team.manager}, task=${taskSummary}`;
  });

  return [
    'Gateway status:',
    ...teamLines,
    '',
    'Beschikbaar: /video, /school, /email, /discovery, /status, /dashboard, /pending, /approve <id>, /reject <id> [reason]',
  ].join('\n');
}

async function runDashboard() {
  const { stdout, stderr } = await execFileAsync('node', [dashboardScriptPath], {
    cwd: repoRoot,
    timeout: 30_000,
  });

  if (stderr && stderr.trim()) {
    console.warn(`[dashboard] stderr: ${stderr.trim()}`);
  }

  return stdout?.trim() || '(dashboard gaf geen output)';
}

function buildManagerPrompt(teamId, action, args) {
  const argText = args.length > 0 ? args.map((x) => `"${x}"`).join(' ') : '(geen args)';
  return [
    `Team: ${teamId}`,
    `Actie: ${action}`,
    `Args: ${argText}`,
    'Voer de taak uit en rapporteer compact status/resultaat + eventuele vervolgstap.',
  ].join('\n');
}

function getPendingPreview(items) {
  if (items.length === 0) {
    return 'Geen pending approvals.';
  }

  const lines = items.slice(0, 20).map((item) => (`- ${item.id} | team=${item.team} | type=${item.type} | ref=${item.reference}`));
  const remainder = items.length > 20 ? `
... en ${items.length - 20} extra` : '';
  return `Pending approvals (${items.length}):
${lines.join('\n')}${remainder}`;
}

async function notifyTeamManagerForApproval(item) {
  const team = gatewayConfig.teamsById.get(item.team);
  if (!team) {
    return `Geen managerconfig gevonden voor team ${item.team}.`;
  }

  const args = [item.id, item.type, item.reference];
  await invokeManagerAgent(team, 'approve', args);
  return `Manager ${team.manager} geïnformeerd voor approval ${item.id}.`;
}

async function invokeManagerAgent(team, action, args) {
  const prompt = buildManagerPrompt(team.id, action, args);
  const configuredCommand = process.env.TELEGRAM_SESSIONS_SPAWN_CMD;

  const command = configuredCommand || 'sessions_spawn';
  let cmd = command;
  let cmdArgs = ['--agent', team.manager, '--message', prompt];

  if (configuredCommand?.includes(' ')) {
    const parts = configuredCommand.split(' ').filter(Boolean);
    cmd = parts[0];
    cmdArgs = [...parts.slice(1), ...cmdArgs];
  }

  const result = await retry(async () => {
    const { stdout, stderr } = await execFileAsync(cmd, cmdArgs, { timeout: 90_000 });
    if (stderr && stderr.trim()) {
      console.warn(`[sessions_spawn:${team.id}] stderr: ${stderr.trim()}`);
    }
    return stdout?.trim() || '(geen output van manager agent)';
  }, SPAWN_MAX_RETRIES, `sessions-spawn-${team.id}`);

  return result;
}

async function handleCommand(update) {
  const { chatId } = validateAccess(update);
  const text = update.message.text || '';
  const parsed = parseCommand(text);

  if (!parsed) {
    await sendTelegramMessage(chatId, 'Onbekend berichttype. Gebruik een slash-command.');
    return;
  }

  if (parsed.teamId === 'status') {
    await sendTelegramMessage(chatId, getStatusMessage());
    return;
  }

  if (parsed.teamId === 'pending') {
    const pendingItems = await listPending();
    await sendTelegramMessage(chatId, getPendingPreview(pendingItems));
    return;
  }

  if (parsed.teamId === 'dashboard') {
    const dashboard = await runDashboard();
    await sendTelegramMessage(chatId, `📊 Health dashboard\n\n${dashboard}`);
    return;
  }

  if (parsed.teamId === 'approve') {
    const [id] = parsed.args;
    if (!id) {
      await sendTelegramMessage(chatId, 'Gebruik: /approve <id>');
      return;
    }

    const approvedItem = await approve(id);
    const notification = await notifyTeamManagerForApproval(approvedItem);
    await sendTelegramMessage(chatId, `✅ Approval verwerkt: ${approvedItem.id}
${notification}`);
    return;
  }

  if (parsed.teamId === 'reject') {
    const [id, ...reasonParts] = parsed.args;
    if (!id) {
      await sendTelegramMessage(chatId, 'Gebruik: /reject <id> [reason]');
      return;
    }
    const reason = reasonParts.length > 0 ? reasonParts.join(' ') : 'Geen reden opgegeven';
    const rejectedItem = await reject(id, reason);
    await sendTelegramMessage(chatId, `🛑 Rejected: ${rejectedItem.id} (reason: ${reason})`);
    return;
  }

  const team = gatewayConfig.teamsById.get(parsed.teamId);
  if (!team) {
    await sendTelegramMessage(chatId, `Onbekend team: /${parsed.teamId}. Gebruik /status voor overzicht.`);
    return;
  }

  if (!parsed.action || !team.commands.includes(parsed.action)) {
    await sendTelegramMessage(chatId, `Onbekende actie voor ${team.id}. ${getUsageForTeam(team)}`);
    return;
  }

  const taskRef = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  activeTasks.set(team.id, { action: parsed.action, status: 'running', taskRef, startedAt: new Date().toISOString() });

  await sendTelegramMessage(chatId, `⏳ ${team.id}/${parsed.action} gestart (task ${taskRef}).`);

  try {
    const result = await invokeManagerAgent(team, parsed.action, parsed.args);
    activeTasks.set(team.id, { action: parsed.action, status: 'done', taskRef, finishedAt: new Date().toISOString() });
    await sendTelegramMessage(chatId, `✅ ${team.id}/${parsed.action} gereed.\n\n${result.slice(0, 3500)}`);
  } catch (err) {
    activeTasks.set(team.id, { action: parsed.action, status: 'error', taskRef, finishedAt: new Date().toISOString() });
    await sendTelegramMessage(chatId, `❌ ${team.id}/${parsed.action} fout: ${err.message}`);
  }
}

function getWebhookPath() {
  if (!TELEGRAM_WEBHOOK_URL) return '/webhook';
  try {
    const parsed = new URL(TELEGRAM_WEBHOOK_URL);
    return parsed.pathname || '/webhook';
  } catch {
    return '/webhook';
  }
}

async function processUpdate(update) {
  const access = validateAccess(update);
  if (!access.ok) {
    if (access.chatId) {
      await sendTelegramMessage(access.chatId, access.reason);
    }
    return;
  }

  const isCommand = typeof update?.message?.text === 'string' && update.message.text.startsWith('/');
  if (!isCommand) {
    await sendTelegramMessage(access.chatId, 'Alleen slash-commands zijn ondersteund. Gebruik /status voor overzicht.');
    return;
  }

  await handleCommand(update);
}

async function main() {
  ensureEnv();
  gatewayConfig = await loadGatewayConfig();

  const webhookPath = getWebhookPath();

  const server = http.createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, service: 'telegram-gateway-bot' }));
      return;
    }

    if (req.method !== 'POST' || req.url !== webhookPath) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }

    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        const update = JSON.parse(raw || '{}');
        await processUpdate(update);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        console.error('Webhook verwerking mislukt:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Telegram gateway bot luistert op 0.0.0.0:${PORT}${webhookPath}`);
  });
}

main().catch((err) => {
  console.error('Gateway bot crash:', err);
  process.exit(1);
});
