#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runHealthCheck } from './health-check.mjs';

const __filename = fileURLToPath(import.meta.url);

function pad(value, width) {
  return String(value).padEnd(width, ' ');
}

function buildTable(rows) {
  const headers = ['Team', 'Status', 'Tasks', 'Errors', 'Last Active'];
  const widths = headers.map((header, idx) => {
    const rowMax = Math.max(...rows.map((row) => String(row[idx]).length));
    return Math.max(header.length, rowMax);
  });

  const headerRow = `| ${headers.map((header, idx) => pad(header, widths[idx])).join(' | ')} |`;
  const separatorRow = `|-${widths.map((width) => '-'.repeat(width)).join('-|-')}-|`;
  const bodyRows = rows.map((row) => `| ${row.map((cell, idx) => pad(cell, widths[idx])).join(' | ')} |`);

  return [headerRow, separatorRow, ...bodyRows].join('\n');
}

export async function renderDashboard() {
  const healthResults = await runHealthCheck();
  const rows = healthResults.map((item) => [
    item.team,
    item.status,
    String(item.tasks),
    String(item.errors),
    item.lastActive,
  ]);

  return buildTable(rows);
}

async function runCLI() {
  const output = await renderDashboard();
  console.log(output);
}

const isDirectExecution = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isDirectExecution) {
  runCLI().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
