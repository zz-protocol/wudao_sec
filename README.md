# wudao_sec

A copyable **agent hunting architecture**: roles, target policy, Q1–Q4, and a **script gate** that blocks Potemkin reports.

提示词拦不住挖掘 agent。本仓库把约束升级成 **Gate + 脚本**：没有默认活实例日志，提交命令直接失败。

## Why this exists

Prompt-only red lines failed in production:

| Failure | What the agent did |
|---|---|
| Potemkin report | Formal markdown, no live instance |
| Documented limitation | Filed “no auth” the vendor already warned about |
| Known CVE as “new” | Same sink, no new vector |
| Static HOLD factory | Hundreds of Critical drafts, zero E2E |

Two rules were fighting each other: the hunter was told **never execute**, the submitter was told **must reproduce on a default instance**. The hunter optimized for volume.

## Architecture

```
┌───────────────────┐
│  Scout agent      │  queue/proposed.json only
│  (SCOUT.md)       │  no source audit
└─────────┬─────────┘
          ▼
┌───────────────────┐
│  gate-target.mjs  │  OSV + sibling + deny list
└─────────┬─────────┘
          │ queue/admitted.json
          ▼
┌───────────────────┐
│  Hunter agent     │  findings/*.json only
│  (researcher)     │  no PVR / no email / no forms
└─────────┬─────────┘
          │ unverified | blocked | candidate
          ▼
┌───────────────────┐
│  Human + Q1–Q4    │  default-config live repro
└─────────┬─────────┘
          │ GATE.json ok=true
          ▼
┌───────────────────┐
│  gh-submit        │  refuses without gate
└───────────────────┘
```

**Scout is not the hunter. Hunter is not the submitter.** One admitted repo, one claim.

## Copy this in 10 minutes

1. Clone this repo into your hunt workspace (or copy `AGENTS.md` + `RULE.md` + `TARGET-POLICY.md`).
2. Point your coding agent (DSH / Claude Code / OpenCode / Codex) at that workspace so it loads `AGENTS.md`.
3. Put `GITHUB_TOKEN` in the environment (never commit it).
4. Hunter output must be `findings/<id>.json`, status `unverified` until Q2.
5. Before any real submit:

```bash
node tools/gate-submit.mjs --report report.md --repro repro.log --out GATE.json
node tools/gh-submit.mjs pvr owner/repo --summary "..." --body-file report.md --severity high --dry
# drop --dry only if GATE.json has "ok": true
```

## Layout

| Path | Role |
|---|---|
| `SCOUT.md` | Target-picker agent (writes proposed.json only) |
| `tools/gate-target.mjs` | Admits scout rows after OSV/sibling/deny |
| `AGENTS.md` | Injected into every **hunter** session |
| `RULE.md` | Seven red lines |
| `TARGET-POLICY.md` | Allow / deny before the first grep |
| `SUBMISSION-STANDARDS.md` | Q1–Q4 + report hygiene |
| `PIPELINE.md` | Stages; dynamic repro is **mandatory** |
| `docs/lessons.md` | Failures that forced the upgrade |
| `templates/` | Finding JSON + report skeleton |
| `tools/gate-submit.mjs` | Exit 2 unless Q1–Q4 + live repro markers |
| `tools/gh-submit.mjs` | GitHub PVR / issue; **blocked without GATE.json** |
| `.harness/gate-submit.md` | Human checklist |

## What a finding is allowed to be

| Status | Meaning | Submit? |
|---|---|---|
| `unverified` | Line-level sink only | No |
| `blocked` | Cannot stand up a default instance | No |
| `candidate` | Default process + real request/call log | Human may gate |
| HOLD markdown factory | Banned | No |

Q2 means: **default config, running process, recorded request/response** (or `RESULT: Q2 PASS`). `importlib`, AST-extracted functions, and mocked upstreams are not PoCs.

## What this repo is not

- Not a vulnerability dump
- Not a scanner
- Not permission to test other people’s production
- Not a Huntr / SRC spam kit

Stay in scope, use private reporting, and do not publish exploit payloads for unpatched systems.

## License

MIT. Use the pattern; own your disclosures.
