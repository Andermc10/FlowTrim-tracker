# HU-41: Add Structured Logs and Correlation Evidence

- **Status:** Draft _(refined 2026-10-18, pending approval)_
- **Story / Issue:** FlowTrim-tracker#66 · tasks: backend#56 (correlation and structured logging),
  tracker#67 (operational evidence notes), frontend task to be created on approval (show the error reference)
- **Priority:** P1
- **Epic:** EP-06
- **Dependencies:** HU-39 (production log levels). No longer depends on HU-40 (revised order, 2026-10-18).
- **Author / Date:** Ander (with Claude) · 2026-10-18

## 1. Context and goal
Today a failure is hard to trace: the global exception handler logs `Unhandled exception while processing
{Method} {Path}`, but nothing links that log line to the request the user made, the response has no
identifier, and the Angular app only shows "Something went wrong". Logs are plain text, so they cannot be
filtered by field.

Goal: every request carries a **correlation id** that appears in every log line it produces, in the
response headers and in error bodies; logs are **structured** (JSON in production); and nothing private
(tokens, connection strings, request/response bodies, financial data) is written to them.

## 2. Scope
**In scope:**
- Correlation id middleware (accept a safe incoming `X-Correlation-ID`, otherwise generate one).
- One structured request log line per request: method, route template, status, duration, correlation id.
- JSON console logs outside Development (built-in `AddJsonConsole`, no new dependency); scopes included.
- `correlationId` in every `ProblemDetails` error body; header exposed to the browser through CORS.
- Angular: error messages for unexpected failures (`5xx`, network) show "Reference: <id>" when available.
- Runbook `docs/OPERATIONS.md` in the tracker: how to find all logs for a reference.

**Out of scope:**
- Log storage/shipping (Seq, Elastic, Application Insights), dashboards, alerting, distributed tracing
  exporters (OpenTelemetry) — no budget and no deployment yet.
- Serilog or any logging library (built-in `Microsoft.Extensions.Logging` is enough).
- Logging the user's identity (`sub`) — treated as personal data and not logged.

## 3. Functional requirements
- **FR-1:** Each request gets a correlation id: the incoming `X-Correlation-ID` header if it is 1–64
  characters of `[A-Za-z0-9._-]`, otherwise a new 32-character hex id. Unsafe incoming values are ignored,
  never echoed.
- **FR-2:** The id is returned in the `X-Correlation-ID` response header on every response (including
  `401`, `404`, `500`) and exposed to browsers via CORS `Access-Control-Expose-Headers`.
- **FR-3:** All log lines written while handling the request include `CorrelationId` (logging scope).
- **FR-4:** After each request one log line at `Information`:
  `HTTP {Method} {Route} responded {StatusCode} in {ElapsedMs} ms` — `Route` is the endpoint template
  (e.g. `/api/subscriptions/{id:guid}`), not the raw path, and never includes the query string.
  `/api/health` is logged at `Debug` to avoid noise.
- **FR-5:** Every `ProblemDetails` response (`400`, `401`/`403` bodies when present, `404`, `500`, `503`)
  contains `correlationId` equal to the header.
- **FR-6:** Outside Development the console output is JSON (one object per line, scopes included,
  UTC timestamps); Development keeps the readable console format.
- **FR-7:** Never logged: `Authorization` header or tokens, cookies, request/response bodies, query strings,
  connection strings, the `sub` claim, subscription names or amounts.
- **FR-8:** Angular `toUserMessage` appends `Reference: <id>` for `5xx` and status `0` (network) errors
  when the response carries `X-Correlation-ID`; validation (`400`) and `404` messages stay unchanged.

## 4. Business rules
No financial rule changes. Privacy rule: logs are operational data, not user data.

## 5. Acceptance criteria
- **AC-1:** Given any request, when it completes, then the response has an `X-Correlation-ID` header.
- **AC-2:** Given a request with a valid `X-Correlation-ID`, when it completes, then the same value is
  returned and used in the logs; given an unsafe value (too long, spaces, `<script>`), then a new id is used.
- **AC-3:** Given an unhandled exception, when the `500` is returned, then the body's `correlationId`
  equals the header and the error log line carries the same `CorrelationId`.
- **AC-4:** Given a request with a bearer token and a query string, when logs are captured, then neither
  the token nor the query string appears in any log line.
- **AC-5:** Given Production, when the API logs, then each line is valid JSON with `CorrelationId` in
  its scopes.
- **AC-6:** Given the database is down, when `/api/health` is called, then `503` with the existing safe
  payload (API healthy, database unhealthy) and a correlation id.
- **AC-7:** Given a `500` in the browser, when the error is shown, then the message includes the reference.

## 6. API contract
- New response header on all routes: `X-Correlation-ID: <id>` (also accepted on requests, FR-1).
- `ProblemDetails` gains `correlationId` (string). Example:
  ```json
  { "type": "...", "title": "An unexpected error occurred.", "status": 500, "correlationId": "4bf92f3577b34da6a3ce929d0e0e4736" }
  ```
- No route changes.

## 7. Data model changes
None.

## 8. Validation and error cases
| Case | Expected result |
|---|---|
| Incoming `X-Correlation-ID: abc-123` | Reused |
| Incoming id longer than 64 chars / with spaces / with `<>` | Ignored; new id generated |
| No incoming header | New 32-char hex id |
| Exception before the endpoint runs | `500` still has header and `correlationId` |

## 9. Edge cases
- CORS preflight (`OPTIONS`) responses also get the header (harmless).
- Several log lines from one request (e.g. handler + EF warning) share the same `CorrelationId`.
- Tests capture logs with an in-memory logger provider; no file or external sink.

## 10. UI states
Error state for unexpected failures shows `Something went wrong. Please try again. Reference: <id>`
(English UI; Spanish translation through the existing i18n service).

## 11. Test plan
Backend (xUnit, `WebApplicationFactory` + in-memory log capture):
- `Request_ReturnsCorrelationIdentifier` — AC-1
- `Request_WithValidIncomingId_ReusesIt`, `Request_WithUnsafeIncomingId_GeneratesNewOne` (theory) — AC-2
- `UnhandledException_ProblemDetailsAndLogShareCorrelationId` — AC-3
- `Request_WithTokenAndQuery_DoesNotLogThem` — AC-4
- `RequestLog_UsesRouteTemplateStatusAndDuration` — FR-4
- `Health_DatabaseFailureReturnsSafePayloadWithCorrelationId` — AC-6
- `Cors_ExposesCorrelationHeader` — FR-2
Manual: run the API as Production and confirm JSON lines with `CorrelationId` (AC-5).
Frontend (Vitest): `toUserMessage` appends the reference for `500`/`0` and not for `400`/`404` — AC-7.

## 12. Assumptions and open questions
- Header name `X-Correlation-ID` (widely used; W3C `traceparent` support is out of scope).
- No new dependencies (built-in logging, JSON console formatter and middleware).
- No open questions.

## 13. Task breakdown
- [ ] backend#56: correlation middleware, request log, JSON console outside Development, `ProblemDetails`
  `correlationId`, CORS expose header, tests.
- [ ] frontend (new issue): reference in error messages + tests.
- [ ] tracker#67: `docs/OPERATIONS.md` runbook (correlation lookup, what is never logged).

## 14. Implementation notes
To be completed after delivery.
