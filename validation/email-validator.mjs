const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SCRIPT_INJECTION_REGEX = /<\s*script\b|<\s*\/\s*script\s*>|javascript:|on\w+\s*=|<[^>]+>/i;

function validateEmailPayload(payload) {
  const errors = [];
  const to = typeof payload?.to === "string" ? payload.to.trim() : "";
  const subject = typeof payload?.subject === "string" ? payload.subject.trim() : "";
  const body = typeof payload?.body === "string" ? payload.body.trim() : "";

  if (!EMAIL_REGEX.test(to)) {
    errors.push("Invalid TO field: expected a valid email address.");
  }

  if (!subject) {
    errors.push("Subject must not be empty.");
  }

  if (body.length < 10) {
    errors.push("Body must contain at least 10 characters.");
  }

  if (SCRIPT_INJECTION_REGEX.test(subject) || SCRIPT_INJECTION_REGEX.test(body)) {
    errors.push("Detected potential scripts/HTML injection in subject or body.");
  }

  return { valid: errors.length === 0, errors };
}

async function readInput() {
  if (process.argv[2]) {
    return JSON.parse(process.argv[2]);
  }

  if (!process.stdin.isTTY) {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString("utf8").trim();
    if (raw) return JSON.parse(raw);
  }

  return { to: "", subject: "", body: "" };
}

try {
  const payload = await readInput();
  const result = validateEmailPayload(payload);
  console.log(JSON.stringify(result));
  process.exit(result.valid ? 0 : 1);
} catch (error) {
  console.log(JSON.stringify({ valid: false, errors: [`Invalid JSON input: ${error.message}`] }));
  process.exit(1);
}
