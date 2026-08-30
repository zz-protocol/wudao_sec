# Lessons that forced Gate + script

These are **process** failures. Copy the rule, not a target list.

1. **Documented design is not a vuln.** If the vendor wrote “no auth, do not expose”, filing it wastes a slot and burns trust.
2. **Function-level mock is not a PoC.** Triagers reject “nothing was executed against a running instance”.
3. **“Default” must be default.** If the dangerous flag is off out of the box, the title cannot say default deployments.
4. **One sink per report.** Bundling two findings can block CVE assignment even when both are real.
5. **Internal paths expose the factory.** `Evidence index` pointing at your hunt directory is an instant reject signal.
6. **“Verified negatives” do not belong in a vuln report.**
7. **Same CVE, same sink, no new vector → skip.** Ledger-gap (missing `patched`) is a metadata ticket, not a 0-day.
8. **Incomplete-fix reports must diff the old advisory.** Guards often move files; grep-miss is not a regression.
9. **Internal IPC / ClusterIP is not internet RCE 9.8** unless the default actually publishes that port.
10. **Hunter prompt saying “never execute” fights Q2.** Agents will choose volume. Split roles; block submit in code.
11. **Do not auto-resume a HOLD pile.** Static drafts are inventory debt.
12. **Inbox empty ≠ not accepted.** Private GHSA status may never hit notifications.
13. **OSV empty on this package name ≠ unknown.** Query sibling names. `tf-keras` had `{}` while `keras` already had GHSA-hqp4 / CVE-2026-11816 on the same tar-extract filter. That is `SKIP known` at step 2, not a four-page ledger-gap essay.

## Constraint upgrade

When a written rule is broken ≥3 times:

`soft prompt` → `skill` → `gate checklist` → **script that fails closed**

This repo starts at the last step for submissions.
