#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const MEMORY_BY_TEAM = {
  video: 'memory/context.json',
  school: 'memory/school-context.json',
  email: 'memory/email-context.json',
  discovery: 'memory/discovery-context.json',
};

const ONE_HOUR_MS = 60 * 60 * 1000;

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

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function queuePathFromSchema(taskQueue) {
  const fullPath = path.resolve(repoRoot, taskQueue);
  return fullPath.endsWith('.schema.json')
    ? fullPath.replace('.schema.json', '.queue.json')
    : fullPath;
}

function parseJsonlLines(content) {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

async function readJsonl(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return parseJsonlLines(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

function pickTeamLogCandidates(teamId) {
  return [
    path.resolve(repoRoot, 'logs/events.jsonl'),
    path.resolve(repoRoot, `logs/${teamId}-events.jsonl`),
  ];
}

function eventBelongsToTeam(event, teamId) {
  return [
    event?.team,
    event?.teamId,
    event?.data?.team,
    event?.data?.teamId,
  ].some((value) => value === teamId);
}

function isErrorEvent(event) {
  const status = String(event?.status ?? event?.data?.status ?? '').toLowerCase();
  const eventName = String(event?.event ?? '').toLowerCase();
  const level = String(event?.level ?? '').toLowerCase();
  return status === 'error' || level === 'error' || eventName.includes('error') || eventName.includes('failed');
}

function parseTimestamp(event) {
  const tsValue = event?.timestamp ?? event?.time ?? event?.created_at;
  if (!tsValue) return null;
  const parsed = Date.parse(tsValue);
  return Number.isNaN(parsed) ? null : parsed;
}

function formatRelativeTime(timestampMs) {
  if (!timestampMs) return 'never';
  const delta = Date.now() - timestampMs;
  if (delta < 0) return 'just now';
  const minutes = Math.floor(delta / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

async function getTeamEvents(teamId) {
  const candidates = pickTeamLogCandidates(teamId);
  const eventsByKey = new Map();

  for (const candidate of candidates) {
    const events = await readJsonl(candidate);
    for (const event of events) {
      const raw = JSON.stringify(event);
      const key = `${candidate}:${raw}`;
      if (!eventsByKey.has(key)) {
        eventsByKey.set(key, event);
      }
    }
  }

  const allEvents = [...eventsByKey.values()];
  return allEvents.filter((event) => {
    if (eventBelongsToTeam(event, teamId)) {
      return true;
    }

    const fallbackName = String(event?.event ?? '').toLowerCase();
    return fallbackName.includes(teamId);
  });
}

export async function runHealthCheck() {
  const registryPath = path.resolve(repoRoot, 'orchestration/team-registry.json');
  const skillRegistryPath = path.resolve(repoRoot, 'skills/registry.json');

  const registry = await readJSON(registryPath);
  const skillRegistry = await readJSON(skillRegistryPath, { skills: [] });

  if (!registry || !Array.isArray(registry.teams)) {
    throw new Error(`Invalid team registry at ${registryPath}`);
  }

  const skillNames = new Set((skillRegistry.skills || []).map((skill) => skill.name));

  const results = [];

  for (const team of registry.teams) {
    const issues = [];
    const memoryPath = path.resolve(repoRoot, MEMORY_BY_TEAM[team.id] || '');
    const memoryExists = MEMORY_BY_TEAM[team.id] ? await fileExists(memoryPath) : false;
    if (!memoryExists) {
      issues.push(`missing memory file (${MEMORY_BY_TEAM[team.id] || 'unknown'})`);
    }

    const queuePath = queuePathFromSchema(team.task_queue);
    const queueData = await readJSON(queuePath, []);
    const queueItems = Array.isArray(queueData) ? queueData : [];
    if (!Array.isArray(queueData)) {
      issues.push(`invalid queue format (${path.relative(repoRoot, queuePath)})`);
    }

    const teamEvents = await getTeamEvents(team.id);
    const threshold = Date.now() - ONE_HOUR_MS;
    const errorsLastHour = teamEvents.filter((event) => {
      const ts = parseTimestamp(event);
      return ts && ts >= threshold && isErrorEvent(event);
    }).length;

    if (errorsLastHour > 0) {
      issues.push(`${errorsLastHour} error event(s) in the last hour`);
    }

    const managerAvailable = skillNames.has(team.manager);
    if (!managerAvailable) {
      issues.push(`manager not found in skills/registry.json (${team.manager})`);
    }

    const lastActiveTimestamp = teamEvents
      .map((event) => parseTimestamp(event))
      .filter(Boolean)
      .sort((a, b) => b - a)[0] || null;

    const criticalIssues = [!memoryExists, !managerAvailable, !Array.isArray(queueData)].filter(Boolean).length;
    let status = 'healthy';
    if (criticalIssues >= 2) {
      status = 'down';
    } else if (criticalIssues >= 1 || errorsLastHour > 0) {
      status = 'degraded';
    }

    results.push({
      team: team.id,
      status,
      tasks: queueItems.length,
      errors: errorsLastHour,
      lastActive: formatRelativeTime(lastActiveTimestamp),
      issues,
    });
  }

  return results;
}

async function runCLI() {
  const args = new Set(process.argv.slice(2));
  const results = await runHealthCheck();

  if (args.has('--json')) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    for (const result of results) {
      console.log(`${result.team}: ${result.status}${result.issues.length ? ` (${result.issues.join('; ')})` : ''}`);
    }
  }

  if (args.has('--alert-on-error')) {
    const problematic = results.filter((result) => result.status !== 'healthy');
    if (problematic.length > 0) {
      console.error(`[health-alert] ${problematic.length} team(s) non-healthy: ${problematic.map((item) => `${item.team}=${item.status}`).join(', ')}`);
      process.exitCode = 1;
    }
  }
}

const isDirectExecution = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isDirectExecution) {
  runCLI().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
