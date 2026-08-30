#!/usr/bin/env node
/**
 * Admit scout proposals. Hunter may only read --out.
 *
 *   node tools/gate-target.mjs --in queue/proposed.json --out queue/admitted.json
 *
 * Uses GitHub + OSV when reachable. Missing token → skip live PVR check, still apply local denies.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

function arg(name, fallback = '') {
  const i = process.argv.indexOf(name);
  return i >= 0 ? (process.argv[i + 1] || '') : fallback;
}

const inPath = arg('--in');
const outPath = arg('--out', 'queue/admitted.json');
if (!inPath) {
  console.error('usage: node tools/gate-target.mjs --in queue/proposed.json [--out queue/admitted.json]');
  process.exit(1);
}

const DENY_REPOS = [
  'keras-team/tf-keras',
  'keras-team/keras',
  'alibaba/arthas',
  'baidu/brcc',
  'open-webui/open-webui',
];
const DENY_CHANNELS = ['huntr', 'huntr-challenges'];
const SIBLINGS = {
  'tf-keras': ['keras'],
  keras: ['tf-keras'],
  fschat: ['fastchat'],
  fastchat: ['fschat'],
};

function loadToken() {
  const envPath = join(dirname(fileURLToPath(import.meta.url)), '..', '.env');
  try {
    for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*GITHUB_TOKEN\s*=\s*(.+?)\s*$/);
      if (m && !line.trim().startsWith('#')) return m[1].replace(/^['"]|['"]$/g, '');
    }
  } catch { /* none */ }
  return process.env.GITHUB_TOKEN || '';
}

async function osvQuery(ecosystem, name) {
  const r = await fetch('https://api.osv.dev/v1/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ package: { ecosystem, name } }),
  });
  if (!r.ok) return { vulns: [], error: `osv HTTP ${r.status}` };
  const j = await r.json();
  return { vulns: j.vulns || [] };
}

async function ghJson(path, token) {
  const r = await fetch('https://api.github.com' + path, {
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'wudao-sec-gate-target',
    },
  });
  const t = await r.text();
  let j = null;
  try { j = JSON.parse(t); } catch { /* */ }
  return { ok: r.ok, status: r.status, json: j };
}

const raw = JSON.parse(readFileSync(inPath, 'utf8'));
const items = Array.isArray(raw) ? raw : [raw];
const token = loadToken();
const admitted = [];
const rejected = [];

if (items.length > 8) {
  console.error('too many proposals (max 8). Scout is overflowing.');
  process.exit(2);
}

for (const it of items) {
  const fail = [];
  const repo = String(it.repo || '');
  const [owner, name] = repo.split('/');
  if (!owner || !name) fail.push('repo must be owner/name');
  const channel = String(it.channel || '').toLowerCase();
  if (!channel) fail.push('missing channel');
  if (DENY_CHANNELS.some((c) => channel.includes(c))) fail.push(`deny channel ${channel}`);
  const ac = Number(it.allow_class);
  if (![1, 2, 3].includes(ac)) fail.push('allow_class must be 1, 2, or 3');
  if (!it.why || String(it.why).length < 20) fail.push('why too short — cite scope page or default bind');
  if (ac === 3 && !it.new_vector) fail.push('class 3 requires new_vector vs old advisory');
  if (DENY_REPOS.includes(repo.toLowerCase())) fail.push(`deny-listed repo ${repo}`);
  if (channel.includes('meta') && !/eligible/i.test(channel + String(it.why))) {
    fail.push('Meta: must be Bounty:Eligible, not Ineligible PyTorch-class');
  }

  const pkgName = it.package?.name;
  const eco = it.package?.ecosystem || 'PyPI';
  const siblingList = [
    ...(it.siblings || []),
    ...(SIBLINGS[pkgName] || []),
  ].filter((s, i, a) => s && a.indexOf(s) === i);

  let osvHits = [];
  if (pkgName) {
    try {
      const names = [pkgName, ...siblingList];
      for (const n of names) {
        const { vulns, error } = await osvQuery(eco, n);
        if (error) fail.push(error);
        for (const v of vulns) {
          osvHits.push({ package: n, id: v.id, summary: v.summary || '' });
        }
      }
    } catch (e) {
      fail.push(`osv ${e.message}`);
    }
  }

  const nv = String(it.new_vector || '').toLowerCase();
  const same = /same (sink|gadget|file|vector)|no new vector|identical/.test(nv);
  const distinct = /different (entry|gadget|guard|sink)|moved guard|new vector/.test(nv);
  const siblingHits = osvHits.filter((h) => h.package && h.package !== pkgName);
  if (siblingHits.length && (ac !== 3 || same || !distinct)) {
    fail.push(`sibling-package OSV (${siblingHits.slice(0, 4).map((h) => h.id).join(', ')}) — tf-keras/keras pattern; need class 3 + distinct new_vector`);
  }
  // Same-package CVEs are expected on OT0/OT1 cash targets. Do not reject class 1.
  // Class 2 (no cash program) + existing OSV → skip unless class 3 new vector.
  if (osvHits.length && ac === 2 && (same || !distinct)) {
    fail.push(`class 2 with existing OSV and no distinct new_vector: ${osvHits.slice(0, 4).map((h) => h.id).join(', ')}`);
  }
  if (osvHits.length && ac === 3 && (same || !distinct)) {
    fail.push('class 3 but new_vector is not distinct from sibling/existing OSV (tf-keras/keras pattern)');
  }

  if (owner && name && token) {
    const pvr = await ghJson(`/repos/${owner}/${name}/private-vulnerability-reporting`, token);
    if (pvr.ok) it.pvr_live = !!pvr.json?.enabled;
  }

  const row = { ...it, osv_hits: osvHits, gate_fail: fail };
  if (fail.length) rejected.push(row);
  else admitted.push({ ...it, osv_hits: osvHits });
}

const out = { admitted, rejected, ts: new Date().toISOString() };
writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(JSON.stringify({ admitted: admitted.length, rejected: rejected.length, out: outPath }, null, 2));
if (rejected.length) {
  for (const r of rejected) console.error(`REJECT ${r.repo}: ${r.gate_fail.join('; ')}`);
}
process.exit(admitted.length ? 0 : 2);
