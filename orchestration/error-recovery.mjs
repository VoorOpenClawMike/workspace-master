#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const REGISTRY_PATH = path.resolve(repoRoot, 'orchestration/team-registry.json');
const CONFIG_PATH = path.resolve(repoRoot, 'orchestration/task-timeout-config.json');
const RECOVERY_LOG_PATH = path.resolve(repoRoot, 'logs/error-recovery.jsonl');
const EVENTS_PATH = path.resolve(repoRoot, 'logs/events.jsonl');

const DEFAULT_TIMEOUT_MINUTES = 60;
const DEFAULT_MAX_RETRIES = 3;

async function readJSON(filePath, fallback = null) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return fallback;
    }
    throw error;
  }
}

async function writeJSON(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function appendJsonl(filePath, entry) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.appendFile(filePath, `${JSON.stringify(entry)}\n`, 'utf8');
}

function resolveQueuePath(taskQueuePath) {
  const schemaPath = path.resolve(repoRoot, taskQueuePath);
  return schemaPath.endsWith('.schema.json')
    ? schemaPath.replace('.schema.json', '.queue.json')
    : schemaPath;
}

function parseTaskTimestamp(task) {
  const timestampCandidate = task?.started_at
    ?? task?.updated_at
    ?? task?.queued_at
    ?? task?.created_at
    ?? task?.timestamp
    ?? null;

  if (!timestampCandidate) {
    return null;
  }

  const parsed = Date.parse(timestampCandidate);
  return Number.isNaN(parsed) ? null : parsed;
}

function getRetryCount(task) {
  for (const key of ['retries', 'retry_count', 'attempts']) {
    const value = Number(task?.[key]);
    if (Number.isFinite(value) && value >= 0) {
      return Math.trunc(value);
    }
  }
  return 0;
}

function setRetryCount(task, retries) {
  return {
    ...task,
    retries,
    retry_count: retries,
    attempts: retries + 1,
  };
}

function isTaskStuck(task, timeoutMinutes, nowMs) {
  if (task?.status !== 'in_progress') {
    return false;
  }

  const taskTs = parseTaskTimestamp(task);
  if (!taskTs) {
    return false;
  }

  return nowMs - taskTs > timeoutMinutes * 60 * 1000;
}

async function notifyTeamManager({ teamId, manager, taskId, action, retries }) {
  const notification = {
    timestamp: new Date().toISOString(),
    event: 'error_recovery_manager_notification',
    team: teamId,
    manager,
    taskId,
    action,
    retries,
    message: `Task ${taskId} on team ${teamId} was marked as ${action} by error-recovery`,
  };

  await appendJsonl(EVENTS_PATH, notification);
}

export async function runErrorRecovery() {
  const registry = await readJSON(REGISTRY_PATH);
  const timeoutConfig = await readJSON(CONFIG_PATH, {});

  if (!registry || !Array.isArray(registry.teams)) {
    throw new Error(`Invalid team registry: ${REGISTRY_PATH}`);
  }

  const result = {
    recovered: [],
    failed: [],
  };

  const nowMs = Date.now();

  for (const team of registry.teams) {
    const queuePath = resolveQueuePath(team.task_queue);
    const queue = await readJSON(queuePath, []);

    if (!Array.isArray(queue)) {
      continue;
    }

    const teamConfig = timeoutConfig?.[team.id] ?? {};
    const timeoutMinutes = Number(teamConfig.timeout_minutes) || DEFAULT_TIMEOUT_MINUTES;
    const maxRetries = Number(teamConfig.max_retries) || DEFAULT_MAX_RETRIES;

    let queueChanged = false;

    for (let index = 0; index < queue.length; index += 1) {
      const task = queue[index];
      if (!isTaskStuck(task, timeoutMinutes, nowMs)) {
        continue;
      }

      const retries = getRetryCount(task);
      const shouldFail = retries >= maxRetries;
      const nextStatus = shouldFail ? 'failed' : 'retry';
      const nextRetries = shouldFail ? retries : retries + 1;

      const updatedTask = {
        ...setRetryCount(task, nextRetries),
        status: nextStatus,
        recovered_at: new Date().toISOString(),
        recovery_reason: `stuck_in_progress_timeout_${timeoutMinutes}m`,
      };

      queue[index] = updatedTask;
      queueChanged = true;

      const recoveryEvent = {
        timestamp: new Date().toISOString(),
        team: team.id,
        manager: team.manager,
        taskId: task.id ?? `index-${index}`,
        queue: path.relative(repoRoot, queuePath),
        previousStatus: task.status,
        nextStatus,
        retriesBefore: retries,
        retriesAfter: nextRetries,
        timeoutMinutes,
      };

      await appendJsonl(RECOVERY_LOG_PATH, recoveryEvent);
      await notifyTeamManager({
        teamId: team.id,
        manager: team.manager,
        taskId: task.id ?? `index-${index}`,
        action: nextStatus,
        retries: nextRetries,
      });

      const collection = shouldFail ? result.failed : result.recovered;
      collection.push({
        team: team.id,
        taskId: task.id ?? `index-${index}`,
        status: nextStatus,
        retries: nextRetries,
      });
    }

    if (queueChanged) {
      await writeJSON(queuePath, queue);
    }
  }

  return result;
}

const isDirectExecution = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isDirectExecution) {
  runErrorRecovery()
    .then((result) => {
      process.stdout.write(`${JSON.stringify(result)}\n`);
    })
    .catch((error) => {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
    });
}
