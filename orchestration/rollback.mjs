import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { execSync } from 'node:child_process';

const HISTORY_PATH = 'memory/rollback-history.json';
const MAX_HISTORY = 5;

function run(command) {
  return execSync(command, { encoding: 'utf8' }).trim();
}

function getArgValue(flag) {
  const args = process.argv.slice(2);
  const index = args.indexOf(flag);
  if (index === -1 || index === args.length - 1) {
    return null;
  }
  return args[index + 1];
}

function loadHistory() {
  if (!existsSync(HISTORY_PATH)) {
    return [];
  }

  try {
    const parsed = JSON.parse(readFileSync(HISTORY_PATH, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(entries) {
  mkdirSync(dirname(HISTORY_PATH), { recursive: true });
  writeFileSync(HISTORY_PATH, `${JSON.stringify(entries.slice(0, MAX_HISTORY), null, 2)}\n`, 'utf8');
}

function createBackupBranch() {
  const currentBranch = run('git branch --show-current');
  const currentSha = run('git rev-parse --short HEAD');
  const timestamp = new Date().toISOString().replace(/[.:]/g, '-');
  const backupBranch = `backup/${currentBranch || 'detached'}-${timestamp}`;

  run(`git branch ${backupBranch}`);
  return { backupBranch, currentBranch, currentSha };
}

function recordState({ action, targetSha = null, backupBranch, currentBranch, currentSha }) {
  const history = loadHistory();
  history.unshift({
    timestamp: new Date().toISOString(),
    action,
    currentBranch,
    currentSha,
    targetSha,
    backupBranch,
  });
  saveHistory(history);
}

function rollbackTo(sha) {
  try {
    run(`git rev-parse --verify ${sha}^{commit}`);
  } catch {
    throw new Error(`Ongeldige commit SHA: ${sha}`);
  }

  run(`git reset --hard ${sha}`);
}

const targetSha = getArgValue('--to');
const backup = createBackupBranch();

if (targetSha) {
  rollbackTo(targetSha);
  recordState({ action: 'rollback', targetSha, ...backup });
  process.stdout.write(`Rollback uitgevoerd naar ${targetSha}. Backup branch: ${backup.backupBranch}\n`);
} else {
  recordState({ action: 'snapshot', ...backup });
  process.stdout.write(`Backup branch aangemaakt: ${backup.backupBranch}\n`);
}
