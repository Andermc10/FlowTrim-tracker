# HU-40: Deploy the Public Demonstration Environment

- **Status:** Draft — waiting for Ander's approval
- **Priority:** P0
- **Epic:** EP-06
- **Story / Issues:** tracker #64 (story), #65 (runbook)
- **Dependencies:** HU-12 (Auth0, owner isolation), HU-38 (CI), HU-39 (CORS/HSTS hardening), HU-41 (logs, correlation id)
- **Unblocks:** HU-49 (deployed health check), HU-91 (mobile release APK needs an `https://` API), phase 4 notifications
- **Author / Date:** Ander (with Claude) · 2026-11-13

## 1. Context and goal
FlowTrim only runs locally. A recruiter (and the mobile release build) needs a public HTTPS environment that does not
require reproducing the stack. The project has **no budget** (2026-10-18 decision): every piece must run on a free plan
without a credit card where possible.

## 2. Decisions (approved by Ander on 2026-11-13)

| # | Topic | Decision | Why |
|---|---|---|---|
| D1 | Web | **Cloudflare Pages** builds the Angular production bundle from `FlowTrim-frontend` `main` (`<project>.pages.dev`). | Static assets are free and unlimited; builds on every merge. |
| D2 | API | **Render free web service** from a `Dockerfile` in `FlowTrim-backend` (`<service>.onrender.com`), auto-deploy on `main`. | Free Docker hosting with HTTPS. Trade-off accepted: it sleeps after 15 min without traffic and the first request takes about a minute; 750 free instance hours per month. |
| D3 | Database | **Neon free Postgres** (1 GB, 100 CU-hours per month, scale to zero after 5 min). | Does not expire (Render's free Postgres expires after 30 days). |
| D4 | Migrations | Applied **explicitly** by the operator with `dotnet ef database update` against Neon (connection string in a local environment variable), never at API start-up. | Matches the project rule "review the SQL before applying"; no migration runs by surprise. |
| D5 | AI Assistant | **Groq real** (`Insights:Provider:Kind = OpenAiCompatible`, key only as a Render secret environment variable). The existing per-owner rate limit (5 questions / 60 s) and 45 s budget stay. | Ander's choice: the demo shows real answers. Risk accepted: the free daily quota can run out; the API then answers `429` with a clear message. |
| D6 | Data | **Empty and safe**: no seed data. Each Auth0 user starts with only their default categories (HU-65); owner isolation from HU-12. | No fake records presented as real; nothing to clean up. |
| D7 | Secrets | Connection string, Groq key and any other secret only in Render environment variables (and the operator's local environment for migrations). Nothing secret in Git; public values (Auth0 domain, client id, audience, URLs) may be committed. | Same rule as development (User Secrets). |

## 3. Scope
**In scope:** `Dockerfile` + `.dockerignore`, forwarded-headers support behind Render's proxy, production environment
values of the web app, Cloudflare `_headers` and SPA fallback, Auth0 production URLs, runbook, smoke test.

**Out of scope:** custom domains, paid plans, uptime pings to keep the API awake (they would burn the free hours),
staging environments, automated migrations in CI, backups beyond Neon's free history.

## 4. Functional requirements
- **FR-1 API container:** multi-stage `Dockerfile` (`mcr.microsoft.com/dotnet/sdk:10.0` build →
  `mcr.microsoft.com/dotnet/aspnet:10.0` runtime), runs as the image's non-root user, listens on the port Render gives
  (`ASPNETCORE_HTTP_PORTS` = `PORT`, default 10000). `ASPNETCORE_ENVIRONMENT=Production`.
- **FR-2 Behind a proxy:** the API honours `X-Forwarded-Proto`/`X-Forwarded-For` from Render's proxy (forwarded headers
  enabled by configuration in Production), so HTTPS redirection and HSTS work without a redirect loop and logs show the
  real scheme.
- **FR-3 Configuration:** Render environment variables — `ConnectionStrings__FlowTrimDb` (Neon, `SSL Mode=Require`),
  `Authentication__Authority`, `Authentication__Audience`, `Cors__AllowedOrigins__0` (the exact `https://` Pages
  origin), `Insights__Provider__*` (D5). The API keeps failing fast when any is missing (HU-39).
- **FR-4 Web build:** `environment.production.ts` points `apiUrl` at the Render URL; Cloudflare Pages runs
  `npm ci && npx ng build` and publishes `dist/flowtrim-frontend/browser`. Deep links (`/app/...`) fall back to
  `index.html`. A `_headers` file sets `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: DENY` and a
  Content-Security-Policy that allows only the app, the Render API and the Auth0 tenant.
- **FR-5 Auth0:** add the Pages origin to the web application's Allowed Callback URLs, Logout URLs and Web Origins. The
  API audience does not change.
- **FR-6 Health:** Render's health check uses `GET /api/health` (already reports API + database without internals).
- **FR-7 Runbook:** `docs/DEPLOYMENT.md` in the tracker: accounts to create, every environment variable (names only),
  first deploy, applying a migration, rotating the Groq key, reading logs by correlation id, known limits (sleep, quotas).

## 5. Acceptance criteria
- **AC-1** Given the deployed environment, when a visitor opens the Pages URL, then the landing loads over HTTPS and
  "Sign in" completes with Auth0 and lands on Today with an empty account (default categories only).
- **AC-2** Given the API slept, when the first request arrives, then it answers within Render's wake-up time and the
  web shows a loading state, not an error.
- **AC-3** `GET https://<api>/api/health` returns `200` with API and database healthy; with the database unreachable it
  returns `503` without internal details.
- **AC-4** A request without a token to a protected endpoint returns `401`; a request from an origin other than the
  Pages origin gets no CORS headers.
- **AC-5** Opening `https://<web>/app/transactions` directly (deep link) loads the app, not a 404.
- **AC-6** After a manual redeploy (restart), data created before is still there (Neon persistence).
- **AC-7** An AI question returns real figures from the tools; when the provider quota is exhausted the UI shows the
  `429`/`502` message with a reference.
- **AC-8** No secret appears in the repositories, the web bundle or the logs (gitleaks clean; bundle grep for the Groq key
  prefix finds nothing).

## 6. API contract
No new endpoint. Existing `GET /api/health` is the platform health check.

## 7. Data model changes
None. Existing migrations are applied to Neon explicitly (D4).

## 8. Validation and error cases
| Case | Expected result |
|---|---|
| Missing environment variable on Render | API refuses to start; Render shows the failed deploy and the variable name (never its value) |
| Neon suspended | First query wakes it (seconds); health may report degraded briefly, then healthy |
| Groq quota exhausted / key invalid | `429` / `502` with `code` and correlation id (HU-35); figures elsewhere unaffected |
| Request over HTTP | Redirected to HTTPS (FR-2) |
| Unknown origin | No `Access-Control-Allow-Origin` header |

## 9. Edge cases
- Render free hours run out (750 per month, shared by the workspace): free services are suspended until the next month;
  documented in the runbook.
- Neon storage reaches 1 GB: writes fail; runbook explains how to check usage. Demo data is small.
- Anyone with an Auth0 account can sign up: data is isolated per owner (HU-12); the AI is rate-limited per owner.

## 10. UI states
Unchanged. The existing loading states cover the API wake-up; errors keep their reference.

## 11. Test plan
- Backend unit/integration tests for the forwarded-headers configuration (HTTPS scheme seen from `X-Forwarded-Proto`,
  no redirect loop).
- `scripts/smoke-demo.sh <api-url> <web-url>` (tracker): health `200`, protected endpoint `401`, deep link `200`, CORS
  header only for the web origin. Run after every deploy; result recorded in `docs/E2E-ACCEPTANCE.md`.
- Manual AC-1, AC-6 and AC-7 in a browser; gitleaks + bundle grep for AC-8.

## 12. Assumptions and open questions
- Free-plan limits were checked on 2026-11-13 from third-party summaries; confirm on each provider's page while creating
  the accounts.
- **Ander creates the Render, Neon and Cloudflare accounts** (and enters the secrets); Claude prepares code, runbook and
  verification.

## 13. Task breakdown
| Repo | Task |
|---|---|
| backend | `Dockerfile`, `.dockerignore`, forwarded headers in Production + tests, README deploy section |
| frontend | production `apiUrl`, `public/_headers`, README deploy section |
| tracker | `docs/DEPLOYMENT.md` runbook (#65), `scripts/smoke-demo.sh`, E2E row, spec Implemented |
