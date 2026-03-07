import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const EVENTS_PATH = 'logs/events.jsonl';
const OUTPUT_PATH = 'logs/auto-fix-suggestions.json';
const MAX_ERRORS = 3;

function safeParseJson(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

function extractErrorMessage(event) {
  if (!event || typeof event !== 'object') {
    return null;
  }

  const candidates = [
    event.error,
    event.message,
    event.data?.error,
    event.data?.message,
    event.details?.error,
    event.details?.message,
  ];

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function isErrorEvent(event) {
  if (!event || typeof event !== 'object') {
    return false;
  }

  const markers = [
    event.level,
    event.status,
    event.severity,
    event.data?.status,
    event.data?.level,
    event.event,
    event.type,
  ];

  return markers
    .filter((value) => typeof value === 'string')
    .map((value) => value.toLowerCase())
    .some((value) => value.includes('error') || value.includes('failed') || value.includes('failure'));
}

function suggestFix(message) {
  const lower = message.toLowerCase();

  if (lower.includes('ffprobe') || lower.includes('ffmpeg')) {
    return [
      'Controleer of ffmpeg/ffprobe geïnstalleerd is en in PATH staat.',
      'Valideer FFMPEG_PATH in .env en voer opnieuw `npm run validate` uit.',
    ];
  }

  if (lower.includes('pipeline process not running')) {
    return [
      'Start de pipeline met `npm run render` voordat heartbeat wordt uitgevoerd.',
      'Verlaag of verhoog INTERVAL_MS in orchestration/heartbeat.mjs afhankelijk van starttijd.',
    ];
  }

  if (lower.includes('not found') || lower.includes('does not exist') || lower.includes('ontbreekt')) {
    return [
      'Controleer padnamen in pipeline_spec.json en assets map.',
      'Voeg een preflight check toe met `npm run check` en `npm run validate`.',
    ];
  }

  if (lower.includes('duration mismatch')) {
    return [
      'Stem expected duration af op daadwerkelijke output uit ffprobe.',
      'Controleer of input assets verschillende lengtes hebben en normaliseer met ffmpeg.',
    ];
  }

  if (lower.includes('task d01 stuck') || (lower.includes('stuck') && lower.includes('30m'))) {
    return [
      'Task D01 stuck >30m → run error-recovery.mjs',
      'Bekijk details in logs/error-recovery.jsonl voor de laatste recovery-acties.',
    ];
  }

  return [
    'Controleer recente commits rondom deze fout en vergelijk met laatste werkende state.',
    'Reproduceer fout lokaal met exact hetzelfde commando en verhoog logging detailniveau.',
  ];
}

function buildSuggestions() {
  const report = {
    generatedAt: new Date().toISOString(),
    source: EVENTS_PATH,
    totalErrorEvents: 0,
    topRecurringErrors: [],
    note: 'Dit script geeft alleen suggesties en voert geen fixes automatisch uit.',
  };

  if (!existsSync(EVENTS_PATH)) {
    report.note = 'Geen event-log gevonden. Voeg eerst events toe aan logs/events.jsonl.';
    return report;
  }

  const lines = readFileSync(EVENTS_PATH, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const counters = new Map();

  for (const line of lines) {
    const event = safeParseJson(line);
    if (!event || !isErrorEvent(event)) {
      continue;
    }

    const message = extractErrorMessage(event) || 'Unknown error';
    const entry = counters.get(message) || { count: 0, latestTimestamp: null };

    entry.count += 1;
    entry.latestTimestamp = event.timestamp || entry.latestTimestamp;

    counters.set(message, entry);
    report.totalErrorEvents += 1;
  }

  const ranked = [...counters.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, MAX_ERRORS)
    .map(([message, data], index) => ({
      rank: index + 1,
      error: message,
      occurrences: data.count,
      latestTimestamp: data.latestTimestamp,
      suggestions: suggestFix(message),
    }));

  report.topRecurringErrors = ranked;

  if (ranked.length === 0) {
    report.note = 'Geen error-events gevonden in logs/events.jsonl.';
  }

  return report;
}

const suggestions = buildSuggestions();
mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, `${JSON.stringify(suggestions, null, 2)}\n`, 'utf8');

process.stdout.write(`Auto-fix suggesties geschreven naar ${OUTPUT_PATH}\n`);
