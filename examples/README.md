# Gate smoke test

```bash
# should print "ok": true and exit 0
node tools/gate-submit.mjs --report examples/report.sample.md --repro examples/repro.sample.log
```

A static-only log (no HTTP status / no `RESULT: Q2 PASS`) must exit 2.
