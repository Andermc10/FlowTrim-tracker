# HU-39: Harden Environment Configuration and CORS

- **Status:** Implemented _(2026-10-18; approved the same day by Ander)_
- **Story / Issue:** FlowTrim-tracker#63 · tasks: backend#54 (production settings and CORS),
  frontend#65 (frontend API and identity environments)
- **Priority:** P0
- **Epic:** EP-06
- **Dependencies:** HU-12 (Auth0), HU-38 (CI)
- **Author / Date:** Ander (with Claude) · 2026-10-18

## 1. Context and goal
FlowTrim must be deployable (HU-40) without leaking credentials or opening the API to any website. Today:

- `appsettings.json` — the base file, also loaded in Production — allows CORS from `http://localhost:4200`,
  and `Program.cs` falls back to that origin when `Cors:AllowedOrigins` is missing. A production API would
  silently trust a developer origin.
- Production log levels are not set: EF Core logs every SQL command at `Information`.
- The Angular production environment has empty Auth0 values, so a production build cannot sign in.
- There is no single place documenting every setting the API needs.

Goal: every environment-specific value comes from configuration, production refuses to start with missing
or unsafe values, and CORS allows exactly the deployed frontend with the `Authorization` header.

## 2. Scope
**In scope:**
- Backend: validated `Cors` options; no hard-coded origin fallback; production origin rules; HSTS in
  production; production log levels; a configuration reference in the README.
- Frontend: production environment with the public Auth0 values; documented `apiUrl` strategy.
- Automated tests for CORS and startup validation.

**Out of scope:**
- Choosing the hosting provider and setting real production values (HU-40).
- Reverse-proxy / forwarded-headers setup (depends on the provider → HU-40).
- Structured logging and correlation ids (HU-41); AI provider keys (HU-33).
- Runtime-loaded frontend configuration (`config.json`); the existing build-time `environment` pattern stays.

## 3. Functional requirements
- **FR-1:** `Cors:AllowedOrigins` is bound to validated options. The code has **no** default origin.
- **FR-2:** `appsettings.json` contains no origins; `appsettings.Development.json` sets
  `http://localhost:4200`. Production sets them through `Cors__AllowedOrigins__0`, `__1`, ….
- **FR-3:** Outside Development the API refuses to start unless every origin is an absolute `https://`
  origin (scheme + host [+ port], no path, no trailing slash, no wildcard `*`) and at least one exists.
  In Development `http://localhost:<port>` is also accepted.
- **FR-4:** The CORS policy allows only the configured origins, methods `GET, POST, PUT, DELETE`, headers
  `Accept, Content-Type, Authorization`; no credentials (cookies) — bearer tokens travel in a header.
- **FR-5:** Startup validation messages name the missing/invalid setting but never print its value.
- **FR-6:** Production log levels: `Default=Information`, `Microsoft.AspNetCore=Warning`,
  `Microsoft.EntityFrameworkCore=Warning`, `Npgsql=Warning` (no SQL text in production logs); EF
  sensitive-data logging stays off. Development keeps SQL command logs at `Information`.
- **FR-7:** HSTS is enabled outside Development (HTTPS redirection already is).
- **FR-8:** The backend README lists every setting: name, environment-variable form, required where,
  example placeholder, secret yes/no.
- **FR-9:** `environment.production.ts` holds the public Auth0 values (same tenant as development; the
  production callback/logout/origin URLs are registered in Auth0 during HU-40). `apiUrl` stays `''`
  (same origin) until HU-40 decides the hosting topology.

## 4. Business rules
- Secrets (connection string, future AI keys) only come from User Secrets (dev) or environment variables /
  the host's secret store (deploy). Never in `appsettings*.json`, never in Git.
- Public identifiers (Auth0 domain, SPA client id, audience, frontend origin) are not secrets.
- Tokens, connection strings and keys are never written to logs or error responses.

## 5. Acceptance criteria
- **AC-1:** Given Production with no `Cors:AllowedOrigins`, when the API starts, then it fails with a message
  naming `Cors:AllowedOrigins` and no value.
- **AC-2:** Given Production with `*`, an `http://` origin or an origin with a path, when the API starts,
  then it fails.
- **AC-3:** Given an allowed origin, when a browser preflights `GET /api/subscriptions` with
  `Authorization`, then the response allows that origin and the `Authorization` header.
- **AC-4:** Given an unknown origin, when it preflights or calls the API, then no
  `Access-Control-Allow-Origin` header is returned.
- **AC-5:** Given Production, when a request runs a query, then no SQL text appears in the logs.
- **AC-6:** Given the README, when a deployer reads it, then every required setting is listed with
  placeholders only.
- **AC-7:** Given `npm run build` (production), when the app loads, then the Auth0 values are present and
  `/app` can start the sign-in flow.

## 6. API contract
No route changes. CORS behavior per FR-4.

## 7. Data model changes
None.

## 8. Validation and error cases
| Case | Expected result |
|---|---|
| Production, `Cors:AllowedOrigins` missing or empty | Startup fails: `Cors:AllowedOrigins must contain at least one origin` |
| Production, origin `*` / `http://…` / `https://x.com/app` / `https://x.com/` | Startup fails naming `Cors:AllowedOrigins` |
| Development, `http://localhost:4200` | Allowed |
| Missing `ConnectionStrings:FlowTrimDb` / `Authentication:*` | Existing fail-fast, unchanged |
| Preflight from unknown origin | `204` without CORS allow headers (browser blocks) |

## 9. Edge cases
- Several frontend origins (e.g. preview + production) → multiple `Cors__AllowedOrigins__N` entries.
- Same-origin deployment (API and SPA behind one host) → CORS not needed by the browser, but the
  validation still requires the deployed origin to be configured (explicit is safer than empty).
- Integration tests run in the `Testing` environment → production rules apply; the test factory sets a
  valid `https://` origin.

## 10. UI states
None.

## 11. Test plan
Backend (xUnit, `WebApplicationFactory`):
- `Cors_AllowedOrigin_BearerPreflight_IsAllowed` — AC-3
- `Cors_UnknownOrigin_IsRejected` — AC-4
- `Startup_ProductionWithoutAllowedOrigins_Fails`, `Startup_ProductionWithUnsafeOrigin_Fails` (theory) —
  AC-1/AC-2: the host refuses to start
- `ConfigurationValidationTests` — AC-1/AC-2 messages: the setting is named and the value never printed
- `CorsOrigins_DevelopmentLocalhost_IsValid` (unit test of the validator)
Manual: run the API with `ASPNETCORE_ENVIRONMENT=Production` and valid variables, execute a query, check
no SQL text is logged — AC-5. Frontend: `npm run build` and inspect that the production bundle contains
the Auth0 domain — AC-7.

## 12. Assumptions and open questions
- Same Auth0 tenant for development and production (portfolio scale); a separate tenant can be added later.
- Hosting provider and final URLs are decided in HU-40.
- No open questions.

## 13. Task breakdown
- [x] backend#54: CORS options + validation, remove fallback, settings files, HSTS, production log levels,
  README configuration reference, tests.
- [x] frontend#65: production environment Auth0 values, README environment section.

## 14. Implementation notes
- Delivered in backend PR #67 (`Cors/AllowedOriginsOptions`, `Cors/AllowedOriginsValidator`, settings
  files, HSTS, log levels, README configuration reference) and frontend PR #76 (production Auth0 values).
- Deviations (spec updated above): (1) the manual production run showed an `Npgsql.Command` log line with
  SQL text, so `Npgsql` is also set to `Warning`; (2) the first CI run failed on Linux because
  `WebApplicationFactory` surfaced `ObjectDisposedException` instead of the validation error when the host
  failed to start — integration tests now only assert that startup fails, and messages are tested
  deterministically at the options level.
- Verification: backend tests 152/152 (CI green twice in a row); mutation check — removing the validator
  registration fails the startup tests; API run as Production from its output folder with environment
  variables only → health/list/summary `200`, CORS denies `http://localhost:4200` and allows the configured
  origin, logs contain no SQL, connection string or token (AC-3/4/5); Development still starts and allows
  `http://localhost:4200`; production frontend bundle contains the Auth0 domain (AC-7).
- Not verified in a browser: the production build's sign-in redirect (same code path as development,
  which was verified with the real tenant in HU-12).
- Note for HU-40: over plain HTTP the API logs "Failed to determine the https port for redirect"; behind the
  hosting provider's TLS proxy, forwarded headers must be enabled.
