#!/usr/bin/env node
/**
 * GitHub submit helper (PVR + public issues).
 * Token: GITHUB_TOKEN env, or .env GITHUB_TOKEN=...
 * Node 18+ (built-in fetch). No npm deps.
 *
 *   node tools/gh-submit.mjs whoami
 *   node tools/gh-submit.mjs pvr-status owner/repo
 *   node tools/gh-submit.mjs issue owner/repo --title "..." --body-file report.md [--dry]
 *   node tools/gh-submit.mjs pvr owner/repo --summary "..." --body-file report.md
 *        [--severity high] [--cvss "CVSS:3.1/..."] [--cwe CWE-306]
 *        [--package name] [--range "..."] [--patched "..."] [--fork] [--dry]
 *
 * Non-dry issue/pvr require GATE.json from gate-submit.mjs (ok: true).
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API = 'https://api.github.com';
const scriptDir = dirname(fileURLToPath(import.meta.url));

function loadEnvToken() {
  const envPath = join(scriptDir, '..', '.env');
  try {
    for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*GITHUB_TOKEN\s*=\s*(.+?)\s*$/);
      if (m && !line.trim().startsWith('#')) return m[1].replace(/^['"]|['"]$/g, '');
    }
  } catch { /* fall through */ }
  return process.env.GITHUB_TOKEN || '';
}

function parseArgs(argv) {
  const pos = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      if (key === 'dry') { flags.dry = true; continue; }
      flags[key] = argv[++i] ?? '';
    } else pos.push(a);
  }
  return { pos, flags };
}

function die(msg, code = 1) {
  console.error('ERROR:', msg);
  process.exit(code);
}

async function gh(method, path, token, body) {
  const r = await fetch(API + path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      'User-Agent': 'wudao-sec',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* non-JSON */ }
  if (!r.ok) {
    const detail = json?.message || text.slice(0, 300);
    let hint = '';
    if (r.status === 404) hint = '\nHINT: repo missing, no access, or PVR disabled. Run pvr-status.';
    if (r.status === 403) hint = '\nHINT: token needs repo scope, or abuse rate limit.';
    if (r.status === 422) hint = '\nHINT: validation failed — fix fields from the API message.';
    die(`GitHub ${method} ${path} -> HTTP ${r.status}: ${detail}${hint}`);
  }
  return json;
}

function readBody(flags) {
  if (flags['body-file']) return readFileSync(flags['body-file'], 'utf8');
  if (flags.body) return flags.body;
  die('need --body-file <file> or --body "text"');
}

function splitRepo(repo) {
  const [owner, name] = (repo || '').split('/');
  if (!owner || !name) die('repo must be owner/repo');
  return { owner, repo: name };
}

function requireSubmitGate(flags) {
  if (flags.dry) return;
  if (flags['skip-gate'] === 'i-know-this-is-wrong') {
    console.error('WARN: skip-gate used — do not make this a habit');
    return;
  }
  const gatePath = flags.gate || join(scriptDir, '..', 'GATE.json');
  if (!existsSync(gatePath)) {
    die(`blocked: no ${gatePath}. Run node tools/gate-submit.mjs --report <md> --repro <log> --out GATE.json`);
  }
  let gate;
  try { gate = JSON.parse(readFileSync(gatePath, 'utf8')); }
  catch { die(`cannot parse GATE.json: ${gatePath}`); }
  if (!gate.ok) die(`GATE.json ok=false: ${(gate.fail || []).join('; ')}`);
}

const T = loadEnvToken();
if (!T) die('no GITHUB_TOKEN in .env or environment');

const [cmd, repo] = process.argv.slice(2);
const { flags } = parseArgs(process.argv.slice(4));

if (cmd === 'whoami') {
  const u = await gh('GET', '/user', T);
  console.log(`login     : ${u.login}`);
  console.log(`name      : ${u.name ?? '-'}`);
  const rl = await gh('GET', '/rate_limit', T);
  console.log(`rate left : ${rl.resources.core.remaining}/${rl.resources.core.limit}`);
  process.exit(0);
}

if (cmd === 'pvr-status') {
  const { owner, repo: r } = splitRepo(repo);
  const res = await gh('GET', `/repos/${owner}/${r}/private-vulnerability-reporting`, T);
  console.log(`private vulnerability reporting enabled: ${res.enabled}`);
  process.exit(res.enabled ? 0 : 4);
}

if (cmd === 'issue') {
  requireSubmitGate(flags);
  const { owner, repo: r } = splitRepo(repo);
  const title = flags.title;
  if (!title) die('need --title');
  const body = readBody(flags);
  const payload = { title, body };
  if (flags.labels) payload.labels = flags.labels.split(',').map(s => s.trim()).filter(Boolean);
  if (flags.dry) {
    console.log(`POST ${API}/repos/${owner}/${r}/issues`);
    console.log(JSON.stringify({ ...payload, body: `<${body.length} chars>` }, null, 2));
    process.exit(0);
  }
  const res = await gh('POST', `/repos/${owner}/${r}/issues`, T, payload);
  console.log(`issue created: #${res.number}`);
  console.log(`url: ${res.html_url}`);
  process.exit(0);
}

if (cmd === 'pvr') {
  requireSubmitGate(flags);
  const { owner, repo: r } = splitRepo(repo);
  const summary = flags.summary;
  if (!summary) die('need --summary');
  const description = readBody(flags);
  if (!flags.severity && !flags.cvss) die('need --severity or --cvss');
  const payload = { summary, description };
  if (flags.cvss) payload.cvss_vector_string = flags.cvss;
  else payload.severity = flags.severity;
  if (flags.cwe) payload.cwe_ids = flags.cwe.split(',').map(s => s.trim()).filter(Boolean);
  if (flags.range || flags.package || flags.patched || flags.functions) {
    const vuln = {};
    if (flags.package) vuln.package = { ecosystem: (flags.ecosystem || 'pip').toLowerCase(), name: flags.package };
    if (flags.range) vuln.vulnerable_version_range = flags.range;
    if (flags.patched) vuln.patched_versions = flags.patched;
    if (flags.functions) vuln.vulnerable_functions = flags.functions.split(',').map(s => s.trim()).filter(Boolean);
    payload.vulnerabilities = [vuln];
  }
  if (flags.fork) payload.start_private_fork = true;
  if (flags.dry) {
    console.log(`POST ${API}/repos/${owner}/${r}/security-advisories/reports`);
    console.log(JSON.stringify({ ...payload, description: `<${description.length} chars>` }, null, 2));
    process.exit(0);
  }
  const res = await gh('POST', `/repos/${owner}/${r}/security-advisories/reports`, T, payload);
  console.log('private vulnerability report submitted:');
  console.log(JSON.stringify(res, null, 2).slice(0, 1200));
  process.exit(0);
}

console.error(`unknown command: ${cmd ?? '(empty)'}`);
console.error('commands: whoami | issue <owner/repo> | pvr <owner/repo> | pvr-status <owner/repo>');
process.exit(1);
