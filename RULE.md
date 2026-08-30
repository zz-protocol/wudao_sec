# RULE — hunt pipeline red lines

Prompt failure ≥3 times → upgrade to Gate + script. Breaking any rule means the task is not done.

## R01 Hunter must not submit

Hunter role may only write `findings/*.json` (sink, call chain, version, unverified preconditions).  
No Huntr/PVR/ZDI drafts, no `gh-submit` without a human, no browser forms.

## R02 Targets must pass the whitelist

Read `TARGET-POLICY.md` before scanning. Deny class → skip, no report.  
Stars / vendor org / “has pickle” is not a ticket in.

## R03 No default live instance → not a vuln

Default-config process + real request/call log = Q2.  
Static line numbers, importlib, AST, mocks, function-level PoCs may be archived. They must not be submitted.

## R04 Same sink as an existing CVE is not new

OSV/GHSA covering the same entry and primitive → at most a “please patch metadata” note.  
Incomplete-fix requires a **new vector** (diff vs the old advisory). Otherwise do not open the finding.

## R05 Documented no-auth / by-design is not in scope

SECURITY.md and official “do not expose / add your own auth / this is intentional” = known limitation.

## R06 Submit only through the gate script

`node tools/gh-submit.mjs` without `--dry` requires `node tools/gate-submit.mjs` exit 0 and `GATE.json` with `"ok": true`.

## R07 One gated finding at a time

No parallel static Critical batches. Gate one, submit one, ledger one.
