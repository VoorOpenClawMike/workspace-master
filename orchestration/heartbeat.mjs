import { appendFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const INTERVAL_MS = 60_000;
const LOG_PATH = 'logs/events.jsonl';

function checkPipelineRunning() {
  try {
    const output = execSync('ps -eo args', { encoding: 'utf8' });
    return output
      .split('\n')
      .some((line) => line.includes('pipeline/render_all.mjs') && !line.includes('heartbeat.mjs'));
  } catch {
    return false;
  }
}

function logEvent(status, details = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    event: 'heartbeat',
    data: {
      status,
      ...details,
    },
  };

  appendFileSync(LOG_PATH, `${JSON.stringify(entry)}\n`, 'utf8');
}

const timer = setInterval(() => {
  const running = checkPipelineRunning();

  if (running) {
    logEvent('success', { message: 'Pipeline process detected.' });
    clearInterval(timer);
    process.exit(0);
  }

  logEvent('error', { message: 'Pipeline process not running.' });
  clearInterval(timer);
  process.exit(1);
}, INTERVAL_MS);
