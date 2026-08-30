# TARGET-POLICY — run this table before the first grep

Fill the “current queue” yourself. The hunter must not append to it.

## Allow (need one)

1. **In-scope cash program**: the asset is on the current official scope page (Google OSS VRP list, Meta BB *Bounty:Eligible*, ZDI product list, vendor SRC, …).
2. **Default-exposed management/data plane**: default bind is not loopback, **or** official quickstart publishes the port, **and** default auth is missing or a default low-priv role reaches a dangerous primitive.
3. **Incomplete-fix with a new vector**: old CVE fixed A; HEAD still reaches equivalent impact via a **different entry / gadget / moved guard**. You must point at the code the old advisory did not describe.

## Deny (one hit → STOP)

| Class | Pattern |
|---|---|
| Docs already say no auth / do not expose | Tunnel consoles, debug UIs with vendor warnings |
| Policy equals intentional RCE | “this permission is a shell” |
| Existing CVE, same sink, no new vector | Re-filing ledger-gap as 0-day |
| Source already patched, advisory incomplete | Fixaudit of merged gates |
| Default ClusterIP / internal RPC as internet 9.8 | Coordinator gRPC, east-west providers |
| Default-off flag / non-default source | `--enable-dangerous`, admin-only tools |
| No PVR, no SECURITY.md, no SRC, dead repo | Last push years ago |
| Challenge boards as bounty factories | Retired disclose programs |
| Gadget not on the default classpath | “RCE if commons-collections happens to be there” |

## Hunter opening moves (scriptable)

For each candidate `owner/repo`:

1. Read SECURITY.md and docs that mention auth / security / warnings
2. Query OSV by **published package name**; same CWE + same file → `known`
3. Check default bind, default auth, official compose ports
4. Not in allow → `SKIP <repo> <reason>`, zero files

## Current queue (human-owned)

Replace this list. Hunters copy it; they do not extend it.

```
# example
# - google/cdap   (OSS VRP, only if still in scope this week)
```
