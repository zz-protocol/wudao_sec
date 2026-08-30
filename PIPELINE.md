# Pipeline

Data plane prefers REST. Browsers are only for forms with no API.

```
1 hunt → 2 triage → 3 Q2 live repro → 4 gate-submit → 5 human submit → 6 track
```

## Stage 1 — Hunt

Hunter reads `AGENTS.md` + `TARGET-POLICY.md`.  
Output: `findings/<id>.json` with status `unverified` | `blocked` | `candidate`.  
No submission markdown.

## Stage 2 — Triage

Human (or a separate reviewer role) checks:

1. Metadata: severity, type, `file:line`, repo snapshot SHA
2. Static: does the claimed sink/call chain exist on that SHA?
3. Q1 / Q4 against SECURITY.md and OSV

## Stage 3 — Dynamic repro (mandatory)

Stand up the **official default** (compose / quickstart).  
Record HTTP/RPC. Static-only stays in `findings/` and never enters the submit queue.

## Stage 4 — Gate

```bash
node tools/gate-submit.mjs --report report.md --repro repro.log --out GATE.json
```

Exit 0 required. See `.harness/gate-submit.md`.

## Stage 5 — Submit

```bash
node tools/gh-submit.mjs pvr-status owner/repo
node tools/gh-submit.mjs pvr owner/repo --summary "..." --body-file report.md --severity high --cwe CWE-306
```

Non-`--dry` calls die without `GATE.json` `ok: true`.

Prefer:

| Channel | Prefer | Fallback |
|---|---|---|
| GitHub issue | REST | — |
| GitHub PVR | `POST /repos/{o}/{r}/security-advisories/reports` | UI if PVR off |
| HackerOne / vendor forms | program API if you have it | browser |

Do not use the path `/private-vulnerability-reports` — it is not the GitHub API.

## Stage 6 — Track

One ledger row per submission. Revisit 1–2 weeks later. Do not re-file while Triage/New.
