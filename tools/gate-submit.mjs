#!/usr/bin/env node
/**
 * Submit gate. Exit 0 only when a report is allowed to go out.
 *
 *   node tools/gate-submit.mjs --report path.md --repro path.log [--out GATE.json]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';

function arg(name, fallback = '') {
  const i = process.argv.indexOf(name);
  return i >= 0 ? (process.argv[i + 1] || '') : fallback;
}

const reportPath = arg('--report');
const reproPath = arg('--repro');
const outPath = arg('--out', '');

const fail = [];
const warn = [];

if (!reportPath) fail.push('missing --report');
if (!reproPath) fail.push('missing --repro');

let report = '';
let repro = '';
try {
  if (reportPath) report = readFileSync(reportPath, 'utf8');
} catch {
  fail.push(`cannot read report: ${reportPath}`);
}
try {
  if (reproPath) repro = readFileSync(reproPath, 'utf8');
} catch {
  fail.push(`cannot read repro: ${reproPath}`);
}

const banned = [
  'huntr-submit',
  'Channel routing',
  'Evidence index',
  'agent-findings',
  'vulnhunt',
  '[HOLD]',
  '<!-- HOLD',
];
for (const b of banned) {
  if (report.includes(b)) fail.push(`banned marker in report: ${b}`);
}

for (const q of ['Q1', 'Q2', 'Q3', 'Q4']) {
  if (!new RegExp(`(?:^|\\n)#{1,6}\\s*${q}\\b|${q}\\s*[:：]`).test(report)) {
    fail.push(`report missing ${q} answer heading`);
  }
}

if (/^#\s*\[HOLD]/m.test(report) || /Report status.*HOLD/i.test(report)) {
  fail.push('report still marked HOLD');
}

const q2ok =
  /RESULT:\s*Q2 PASS/i.test(repro) ||
  /HTTP\/1\.[01]\s+(200|201|204|302|401|403|500)/.test(repro) ||
  /\bcurl\b[\s\S]{0,200}\b(HTTP|status)/i.test(repro);
if (repro && !q2ok) {
  fail.push('repro log has no Q2 PASS / HTTP status — static or mock only');
}

const denyName = ['fixaudit'];
const base = `${basename(reportPath)} ${report.slice(0, 400)}`.toLowerCase();
for (const d of denyName) {
  if (base.includes(d)) fail.push(`target/filename hits deny list: ${d}`);
}

if (/CVE-\d{4}-\d+/.test(report) && !/incomplete-fix|bypass of|new vector|distinct from/i.test(report)) {
  warn.push('mentions a CVE but no incomplete-fix/new-vector language — check Q4');
}

const result = {
  ok: fail.length === 0,
  report: reportPath,
  repro: reproPath,
  fail,
  warn,
  ts: new Date().toISOString(),
};

const text = JSON.stringify(result, null, 2);
if (outPath) writeFileSync(outPath, text);
console.log(text);
process.exit(fail.length ? 2 : 0);
