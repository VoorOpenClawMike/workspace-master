import fs from "node:fs";
import path from "node:path";

const contextPath = path.resolve("memory/email-context.json");

function toValidDate(value) {
  if (typeof value !== "string") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getEffectiveLimit(context) {
  const envLimit = Number.parseInt(process.env.EMAIL_RATE_LIMIT_PER_HOUR || "", 10);
  if (Number.isInteger(envLimit) && envLimit > 0) return envLimit;
  const ctxLimit = Number.parseInt(String(context.rate_limit_hour ?? ""), 10);
  return Number.isInteger(ctxLimit) && ctxLimit > 0 ? ctxLimit : 5;
}

let context;
try {
  context = JSON.parse(fs.readFileSync(contextPath, "utf8"));
} catch (error) {
  console.error(`Failed to read ${contextPath}: ${error.message}`);
  process.exit(1);
}

const limit = getEffectiveLimit(context);
const cutoff = Date.now() - 60 * 60 * 1000;
const sentHistory = Array.isArray(context.sent_history) ? context.sent_history : [];

const sentLastHour = sentHistory.filter((item) => {
  if (typeof item === "string") {
    const d = toValidDate(item);
    return d ? d.getTime() >= cutoff : false;
  }

  if (item && typeof item === "object") {
    const d = toValidDate(item.sent_at ?? item.timestamp ?? item.created_at);
    return d ? d.getTime() >= cutoff : false;
  }

  return false;
}).length;

const remaining = Math.max(0, limit - sentLastHour);
const allowed = remaining > 0;

console.log(JSON.stringify({ allowed, remaining }));

if (!allowed) {
  process.exit(1);
}
