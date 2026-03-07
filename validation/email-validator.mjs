#!/usr/bin/env node

const payloadArg = process.argv[2];

function sanitizeInput(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function hasInjectionRisk(text) {
  const patterns = [
    /<\s*script\b/i,
    /<[^>]+>/,
    /javascript\s*:/i,
    /on\w+\s*=/i,
  ];
  return patterns.some((pattern) => pattern.test(text));
}

let payload = {};
if (payloadArg) {
  try {
    payload = JSON.parse(payloadArg);
  } catch {
    payload = {};
  }
}

const to = sanitizeInput(payload.to);
const subject = sanitizeInput(payload.subject);
const body = typeof payload.body === 'string' ? payload.body.trim() : '';

const errors = [];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(to)) {
  errors.push('Invalid TO field: expected valid email address.');
}

if (!subject) {
  errors.push('Subject must not be empty.');
}

if (body.length < 10) {
  errors.push('Body must contain at least 10 characters.');
}

if (hasInjectionRisk(subject) || hasInjectionRisk(body) || hasInjectionRisk(to)) {
  errors.push('Potential script/HTML injection detected.');
}

console.log(
  JSON.stringify({
    valid: errors.length === 0,
    errors,
  })
);
