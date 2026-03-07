#!/usr/bin/env node
import fs from 'node:fs';

const contextPath = new URL('../memory/email-context.json', import.meta.url);

function parseDateSafe(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const raw = fs.readFileSync(contextPath, 'utf-8');
const context = JSON.parse(raw);

const limit = Number(context.rate_limit_hour ?? process.env.EMAIL_RATE_LIMIT_PER_HOUR ?? 5);
const now = new Date();
const windowMs = 60 * 60 * 1000;
const history = Array.isArray(context.sent_history) ? context.sent_history : [];

const sentLastHour = history.filter((entry) => {
  const ts = typeof entry === 'string' ? entry : entry?.sent_at;
  if (!ts) return false;
  const d = parseDateSafe(ts);
  return d && now.getTime() - d.getTime() <= windowMs;
}).length;

const allowed = sentLastHour < limit;
const remaining = Math.max(limit - sentLastHour, 0);
const result = { allowed, remaining };

console.log(JSON.stringify(result));

if (!allowed) {
  process.exit(1);
}
