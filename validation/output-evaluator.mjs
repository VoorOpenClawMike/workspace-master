import { existsSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);

function getArgValue(flag) {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx === args.length - 1) {
    return null;
  }
  return args[idx + 1];
}

const filePath = getArgValue('--file');
const expectedDurationRaw = getArgValue('--expected-duration');

const result = {
  valid: true,
  errors: [],
  warnings: [],
};

if (!filePath) {
  result.valid = false;
  result.errors.push('Missing required argument: --file <path>');
}

const expectedDuration = expectedDurationRaw === null ? null : Number(expectedDurationRaw);
if (expectedDurationRaw !== null && Number.isNaN(expectedDuration)) {
  result.valid = false;
  result.errors.push('Invalid --expected-duration value. Must be a number in seconds.');
}

if (filePath && !existsSync(filePath)) {
  result.valid = false;
  result.errors.push(`Video output does not exist: ${filePath}`);
}

if (filePath && existsSync(filePath)) {
  const size = statSync(filePath).size;
  if (size <= 100 * 1024) {
    result.valid = false;
    result.errors.push(`File size too small (${size} bytes). Minimum is 102400 bytes.`);
  }

  if (expectedDuration !== null && !Number.isNaN(expectedDuration)) {
    const probe = spawnSync(
      'ffprobe',
      [
        '-v',
        'error',
        '-show_entries',
        'format=duration',
        '-of',
        'default=noprint_wrappers=1:nokey=1',
        filePath,
      ],
      { encoding: 'utf8' },
    );

    if (probe.status !== 0) {
      result.valid = false;
      result.errors.push('Unable to read video duration with ffprobe.');
      if (probe.stderr?.trim()) {
        result.warnings.push(probe.stderr.trim());
      }
    } else {
      const actualDuration = Number(probe.stdout.trim());
      if (Number.isNaN(actualDuration)) {
        result.valid = false;
        result.errors.push('Duration returned by ffprobe is invalid.');
      } else {
        const delta = Math.abs(actualDuration - expectedDuration);
        if (delta > 5) {
          result.valid = false;
          result.errors.push(
            `Duration mismatch: expected ${expectedDuration}s, got ${actualDuration.toFixed(2)}s (delta ${delta.toFixed(2)}s).`,
          );
        }
      }
    }
  }
}

process.stdout.write(`${JSON.stringify(result)}\n`);
process.exit(result.valid ? 0 : 1);
