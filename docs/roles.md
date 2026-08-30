# Roles

| Role | Writes | Must not |
|---|---|---|
| Human | Run `gate-target` / `gate-submit`, actual submit, kick scout | Let hunter pick repos |
| Scout agent | `queue/proposed.json` only | Read vulns, write findings, submit |
| `gate-target.mjs` | `queue/admitted.json` | Trust scout “why” without OSV |
| Hunter agent | `findings/*.json` for **admitted** repos | Scout, PVR, email, Huntr forms |
| `gate-submit.mjs` | `GATE.json` | Interpret “probably fine” |
| Submit script | GitHub PVR/issue | Run without `GATE.json` ok |

Do not collapse hunter and submitter into one prompt. That is how static HOLD factories start.
