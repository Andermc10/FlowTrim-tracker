# Operations runbook

How to diagnose FlowTrim API problems safely (HU-41). FlowTrim has no hosted log platform: logs go to
the API's console (stdout). Locally that is the terminal running `dotnet run`; in a future deployment
(HU-40, free tier) it is the provider's log viewer.

## Correlation ids

Every API response carries `X-Correlation-ID`. The same value is:

- in the JSON body of every error (`"correlationId": "…"`);
- shown to the user in unexpected-error messages: `Something went wrong. Please try again. Reference: <id>`;
- attached as the `CorrelationId` scope to **every** log line written while handling that request.

Clients may send their own `X-Correlation-ID` (1–64 characters of `A-Z a-z 0-9 . _ -`); unsafe values are
ignored and replaced.

## Finding the logs for a reference

1. Get the reference from the user's message, the browser DevTools (Network → response headers) or the
   error body.
2. Search the API output for it.

   - **Development** (readable console, scopes on the first line of each entry):
     ```powershell
     dotnet run --launch-profile http *> api.log     # run the API capturing its output
     Select-String -Path api.log -Pattern "<reference>" -Context 0,3
     ```
   - **Production / JSON logs** (one JSON object per line):
     ```bash
     grep '"CorrelationId":"<reference>"' api.log
     ```
3. Read the lines in order: the request line `HTTP {Method} {Route} responded {StatusCode} in {ElapsedMs} ms`,
   plus any `Warning`/`Error` entries with the same `CorrelationId` (an unhandled exception is logged by
   `FlowTrim.Api.GlobalExceptionHandler` with its stack trace).

Example request line (JSON, abbreviated):

```json
{"Timestamp":"2026-10-18T22:57:12.985Z","LogLevel":"Information",
 "Category":"FlowTrim.Api.Observability.CorrelationIdMiddleware",
 "Message":"HTTP GET /api/subscriptions responded 401 in 13.8 ms",
 "State":{"Method":"GET","Route":"/api/subscriptions","StatusCode":401,"ElapsedMs":13.8},
 "Scopes":[…,{"Message":"CorrelationId:manual-check-01","CorrelationId":"manual-check-01"}]}
```

## What is never logged

`Authorization` header and bearer tokens, cookies, request and response bodies, query strings, connection
strings, the user's `sub` claim, subscription names and amounts. The request line uses the **route template**
(`/api/subscriptions/{id:guid}`). ASP.NET adds its own `RequestPath` scope with the raw path (it may contain
resource GUIDs, never a query string or personal data).

Production log levels (`appsettings.json`): `Microsoft.AspNetCore`, `Microsoft.EntityFrameworkCore` and
`Npgsql` at `Warning`, so no SQL text is written. `/api/health` requests log at `Debug`.

## Health

`GET /api/health` → `200` `{ "status": "Healthy", "api": "Healthy", "database": "Healthy" }` or `503` with
`"database": "Unhealthy"` when PostgreSQL does not answer. The cause is logged server-side as a `Warning`
(`Database health check failed`) with the same correlation id; the response never includes internals.

## Common situations

| Symptom | Where to look |
|---|---|
| User sees "Something went wrong… Reference: X" | Search logs for X; the `Error` entry has the exception |
| `401` on every request | Token audience/issuer vs. `Authentication:*` settings; token expiry |
| API does not start | Startup message names the missing/invalid setting (`Authentication:*`, `Cors:AllowedOrigins`, connection string) — values are never printed |
| Browser shows a CORS error | `Cors:AllowedOrigins` must contain the exact frontend origin (`https://…`, no trailing slash) |
| `/api/health` returns `503` | PostgreSQL down or unreachable; check the `Database health check failed` warning |
