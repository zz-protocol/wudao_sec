# Submission standard v2 — hunter must answer before a human submits

Background: maintainers have called auto-generated writeups **Potemkin reports** (rigorous form, empty substance) and listed rule violations. Repeat → ban.

**Hunter agents do not submit.** A human runs `node tools/gate-submit.mjs` (exit 0) first.

---

## Four questions (any blank = do not submit)

### Q1: Did the project already document this as a design decision?

Read SECURITY.md and security-related docs.  
“This is intentional”, “by design”, or a large warning about the config → not a vuln.

### Q2: Does it reproduce on **default config**?

Send a real request (or equivalent RPC) to a **default-started running instance**. Record request and response.

Not a PoC:

- importlib / loading a function and printing
- AST-extracted original function
- mocked upstream with the real route never running

If an admin must flip a flag, the title must not say “default deployments”.  
Log shape: `METHOD path → expected status vs actual status`.

### Q3: What did the operator lose?

This is how maintainers score the report.

- “Nothing — the caller is already trusted” → not a vuln
- “Anonymous caller runs code on the server” → vuln
- Authenticated low-priv cases must state whether that priv is **default-granted**

### Q4: Is the same issue already public?

OSV by package name, GitHub issues, CHANGELOG, SECURITY.md.  
Same issue already filed → do not duplicate. Incomplete-fix needs the **new vector**.

---

## Report hygiene

### Strip

| Banned | Why |
|---|---|
| Local absolute paths | Maintainer cannot open your disk |
| Internal pipeline dirs / `huntr-submit` / `agent-findings` | Reveals a factory |
| `Channel routing:` / `Evidence index:` / `HOLD` | Pipeline stamps |
| Mixed-language dump of an English report | Looks machine-translated |

### Required

| Required | Notes |
|---|---|
| AI-assisted disclosure | Increasingly mandatory |
| Live PoC | Full request/response on a running instance |
| Quantified impact | Data / money / availability — not “security impact” |
| One issue per report | Split related findings and cross-link |
| Numbered repro | curl or UI steps someone else can run |

## Verification levels

| Level | Bar | Submit alone? |
|---|---|---|
| E2E | Full chain on default instance | Yes |
| Function + live instance | Real request, incomplete chain | Only with extra notes |
| Function (importlib/mock) | Drives real code in isolation | No |
| Static only | Read source | No |

---

## Channel checks

1. Follow SECURITY.md if present
2. `GET /repos/{o}/{r}/private-vulnerability-reporting`
3. Policy exemption → do not file
4. OSV/GHSA overlap → skip or state the diff
