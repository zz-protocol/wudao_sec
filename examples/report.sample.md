# Example: missing default-auth on an admin route

*Disclosure: AI-assisted analysis and drafting; line references verified against the repository.*

## Q1
SECURITY.md does not describe this admin route as intentionally public.

## Q2
Started with the project's documented default:

```
docker compose up
```

```
GET /admin/health → expected 401 vs actual 200
HTTP/1.1 200 OK
```

Repro log path: `examples/repro.sample.log`

## Q3
An unauthenticated caller can read process health and config dump on the default bind.

## Q4
OSV query for the published package name on 2026-01-01 returned no advisory on this route. No open GitHub issue matched the handler name.

## Description
Placeholder — replace with file:line from a real target.

## Impact
Network reachability to the default port. No credentials.

## Fix
Authenticate the admin mux; default bind loopback.
