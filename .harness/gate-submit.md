# G-SUBMIT

Fail any row → no `gh-submit`, no browser form, no disclosure email.

| # | Check | Pass | Who |
|---|---|---|---|
| 1 | Role | Submitter is not the hunter agent | human |
| 2 | Target | Allow class, not deny class | script + human |
| 3 | Q1 | Answered; not “docs already said so” | report text |
| 4 | Q2 | Repro log with default-instance request/call | artifact |
| 5 | Q3 | Operator loss on default config | report text |
| 6 | Q4 | OSV/GHSA date + why not the same bug | report text |
| 7 | Clean | No local home paths, `huntr-submit`, `Channel routing`, `Evidence index`, `HOLD` | script |
| 8 | One sink | Title is one claim | human |

```bash
node tools/gate-submit.mjs --report report.md --repro repro.log --out GATE.json
```
