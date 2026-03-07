import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateApprovalItem } from '../validation/approval-validator.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const APPROVAL_QUEUE_PATH = resolve(__dirname, 'approval-queue.json');

function nowIso() {
  return new Date().toISOString();
}

async function readQueue() {
  const raw = await readFile(APPROVAL_QUEUE_PATH, 'utf8');
  const parsed = JSON.parse(raw);

  return {
    pending: Array.isArray(parsed.pending) ? parsed.pending : [],
    approved: Array.isArray(parsed.approved) ? parsed.approved : [],
    rejected: Array.isArray(parsed.rejected) ? parsed.rejected : [],
  };
}

async function writeQueue(queue) {
  await writeFile(APPROVAL_QUEUE_PATH, `${JSON.stringify(queue, null, 2)}\n`, 'utf8');
}

function buildApprovalId(type) {
  const normalizedType = String(type || 'approval').toLowerCase();
  const random = Math.random().toString(16).slice(2, 8);
  return `${normalizedType}-${Date.now()}-${random}`;
}

export async function listPending() {
  const queue = await readQueue();
  return queue.pending;
}

export async function addToQueue(team, type, reference) {
  const queue = await readQueue();
  const item = {
    id: buildApprovalId(type),
    team,
    type,
    reference,
    created_at: nowIso(),
  };

  const validation = await validateApprovalItem(item);
  if (!validation.valid) {
    throw new Error(`Approval item validatie mislukt: ${validation.errors.join('; ')}`);
  }

  queue.pending.push(item);
  await writeQueue(queue);
  return item;
}

export async function approve(id, options = {}) {
  const queue = await readQueue();
  const index = queue.pending.findIndex((item) => item.id === id);

  if (index === -1) {
    throw new Error(`Approval id niet gevonden in pending: ${id}`);
  }

  const [item] = queue.pending.splice(index, 1);
  const approvedItem = { ...item, approved_at: nowIso() };
  queue.approved.push(approvedItem);

  await writeQueue(queue);

  if (typeof options.onApproved === 'function') {
    await options.onApproved(approvedItem);
  }

  return approvedItem;
}

export async function reject(id, reason = 'Geen reden opgegeven') {
  const queue = await readQueue();
  const index = queue.pending.findIndex((item) => item.id === id);

  if (index === -1) {
    throw new Error(`Approval id niet gevonden in pending: ${id}`);
  }

  const [item] = queue.pending.splice(index, 1);
  const rejectedItem = {
    ...item,
    reason,
    rejected_at: nowIso(),
  };
  queue.rejected.push(rejectedItem);

  await writeQueue(queue);
  console.log(`[approval-reject] id=${id} reason=${reason}`);

  return rejectedItem;
}
