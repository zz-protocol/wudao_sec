# Roles

| Role | Writes | Must not |
|---|---|---|
| Human | Target queue, GATE.json review, actual submit | Let the hunter expand the queue |
| Hunter agent | `findings/*.json` | PVR, email, Huntr forms, `--dry` dropped |
| Gate script | pass/fail JSON | Interpret “probably fine” |
| Submit script | GitHub PVR/issue | Run without `GATE.json` ok |

Do not collapse hunter and submitter into one prompt. That is how static HOLD factories start.
