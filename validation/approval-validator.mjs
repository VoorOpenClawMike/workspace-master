import { access } from 'node:fs/promises';

const VALID_TEAMS = new Set(['email', 'discovery']);
const VALID_TYPES = new Set(['email_draft', 'discovery_report']);

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function validateApprovalItem(item) {
  const errors = [];

  if (!item || typeof item !== 'object') {
    return { valid: false, errors: ['Approval item ontbreekt of is ongeldig.'] };
  }

  if (!item.team || !VALID_TEAMS.has(item.team)) {
    errors.push(`Invalid team: ${item.team ?? '(missing)'}`);
  }

  if (!item.type || !VALID_TYPES.has(item.type)) {
    errors.push(`Invalid type: ${item.type ?? '(missing)'}`);
  }

  if (!item.reference) {
    errors.push('Reference ontbreekt.');
  } else {
    const exists = await fileExists(item.reference);
    if (!exists) {
      errors.push(`Referenced file bestaat niet: ${item.reference}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function getApprovalValidationConfig() {
  return {
    validTeams: [...VALID_TEAMS],
    validTypes: [...VALID_TYPES],
  };
}
