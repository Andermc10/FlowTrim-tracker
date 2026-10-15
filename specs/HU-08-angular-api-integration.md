# HU-08: Angular ↔ API integration (CORS, environments, real data)

- **Status:** Implemented _(2026-10-14; all proposals accepted — dev apiUrl http://localhost:5214, CORS from Cors:AllowedOrigins, disable HTTPS redirect in Development, env fileReplacements)_
- **Story / Issue:** FlowTrim-tracker#9 · tasks: backend#16 (CORS), frontend#9 (Angular base), frontend#10 (HTTP + environments + states)
- **Priority:** P0
- **Author / Date:** Ander (with Claude) · 2026-10-14

## 1. Context and goal
The user manages everything from the web UI, with no manual API calls. The Angular app already reads
and writes through typed HTTP services, with loading/empty/success/error states, across list, create,
edit, delete, summary and upcoming. What is **missing to make it work in a real browser** is: the
backend allowing the Angular dev origin (**CORS**), and a per-environment API URL. HU-08 closes that
gap and verifies the integration end to end.

## 2. Scope
**In scope:**
- Backend: a configurable **CORS** policy allowing the Angular dev origin (`http://localhost:4200`),
  read from configuration — never `AllowAnyOrigin`.
- Backend (dev): make HTTPS redirection not interfere with the HTTP dev flow so CORS/preflight are clean.
- Frontend: formal **environments** (`environment.ts` dev / `environment.production.ts` prod) wired via
  `angular.json` `fileReplacements`; `apiUrl` per environment pointing at the real API.
- Verify end to end: the SPA loads/saves real data in the browser against the running API.
- Confirm (and fill any gap in) the Angular base already built: layout, navigation, SCSS, typed models,
  HTTP service layer, and loading/empty/success/error states.

**Out of scope (later stories):**
- Centralized error contract / RFC 7807 middleware → HU-09.
- Simulator → HU-07. Auth, production hosting and real deploy origins → post-MVP (HU-12+).
- Production CORS origins beyond a configurable placeholder (set at deploy time).

## 3. Functional requirements
- **FR-1:** The browser SPA performs all main operations (list/create/edit/delete, summary, upcoming)
  against the API; no hardcoded data is the final source.
- **FR-2:** The backend permits cross-origin requests from the configured Angular dev origin for the
  methods the API uses (`GET`, `POST`, `PUT`, `DELETE`) and the `Content-Type` header; preflight
  (`OPTIONS`) succeeds.
- **FR-3:** CORS allowed origins come from configuration (`Cors:AllowedOrigins`), default
  `http://localhost:4200`; the policy never opens all origins.
- **FR-4:** The API base URL is environment-based (dev vs prod) and changeable without code edits.
- **FR-5:** Every data-driven view shows loading, empty, success and error states (already implemented —
  verified here against the real API).

## 4. Business rules
No new business rules. Configuration/integration story. The backend remains the authority for
validation; the client mirrors rules for UX only.

## 5. Acceptance criteria
- **AC-1:** With the API and `ng serve` running, the list, summary and upcoming views load real data in the browser.
- **AC-2:** Creating/editing/deleting from the UI persists through the API and the list reflects it.
- **AC-3:** A cross-origin request from `http://localhost:4200` succeeds; preflight `OPTIONS` returns the
  CORS headers (`Access-Control-Allow-Origin: http://localhost:4200`).
- **AC-4:** An origin **not** in the allowed list does not receive permissive CORS headers.
- **AC-5:** Changing `apiUrl` in the environment file changes where the SPA calls, with no code change.
- **AC-6:** All data-driven views still handle loading/empty/success/error.

## 6. API contract
No new endpoints. Adds a CORS policy applied to the existing endpoints:
- Policy name e.g. `AllowAngularDev`; origins from `Cors:AllowedOrigins`; methods `GET,POST,PUT,DELETE`;
  headers `Content-Type`; applied via `app.UseCors(...)` before endpoint mapping.
- `appsettings.json` gains a non-secret `Cors:AllowedOrigins: ["http://localhost:4200"]`.

## 7. Data model changes
None.

## 8. Validation and error cases
| Case | Expected result |
|---|---|
| Preflight `OPTIONS` from `http://localhost:4200` | `204`/`200` with `Access-Control-Allow-Origin: http://localhost:4200` |
| Request from a disallowed origin | no `Access-Control-Allow-Origin` for that origin (browser blocks) |
| API unreachable from the SPA | the view shows its error state + retry |
| `Cors:AllowedOrigins` missing | fall back to the default dev origin; never allow-all |

## 9. Edge cases
- Dev runs HTTP only (`http` launch profile, `http://localhost:5214`); HTTPS redirection must not turn
  API calls into cross-scheme redirects that break CORS (see Q3).
- Trailing slash / scheme mismatches in the origin are exact-match sensitive — the configured origin
  must match the browser origin exactly.

## 10. UI states (frontend)
Already implemented across views; this story verifies them against the live API. The empty states link
to creating a subscription; errors offer retry. No new screens.

## 11. Test plan
- Backend: a small test asserting the CORS policy is configured for the dev origin (or a documented
  manual preflight check), plus the existing 61 tests stay green.
- Manual/live (recorded in the PR): run the API (`http` profile) + `ng serve`; load list/summary/upcoming
  in the browser; create/edit/delete; confirm via a preflight `OPTIONS` curl that the CORS headers are present.
- Frontend unit tests stay green.

## 12. Assumptions and open questions
- **Q1 — Dev API URL:** Angular `apiUrl` (dev) = `http://localhost:5214` (the API `http` launch profile);
  run the API with the `http` profile in dev *(proposed)*.
- **Q2 — CORS config:** origins from `Cors:AllowedOrigins` (default `http://localhost:4200`), methods
  `GET/POST/PUT/DELETE`, header `Content-Type`, no credentials *(proposed)*.
- **Q3 — HTTPS redirection in dev:** disable `UseHttpsRedirection` in the Development environment so the
  HTTP dev flow and CORS preflight are clean *(proposed)*; keep it in non-Development.
- **Q4 — Environments:** `environment.ts` (dev) + `environment.production.ts` (prod) via `angular.json`
  `fileReplacements` *(proposed)*.
- **Q5 — Verification:** preflight `OPTIONS` curl for the CORS headers plus a real `ng serve` browser
  check *(proposed)*; a headless browser check if available.

## 13. Task breakdown
- [ ] backend#16 — CORS policy from config (dev origin), applied in `Program.cs`; dev HTTPS-redirect guard; `appsettings` entry.
- [ ] frontend#9 — Confirm/round out the Angular base (layout, nav, SCSS, typed models) — mostly done in HU-01…04.
- [ ] frontend#10 — Formal environments (`apiUrl` per env + `fileReplacements`); point at the real API; verify states against the live API.

## 14. Implementation notes (filled after delivery)
Delivered on 2026-10-14. Backend PR `FlowTrim-backend#35` (closes #16); frontend PR
`FlowTrim-frontend#18` (closes #9/#10). No deviations from this spec.

- CORS policy `AllowAngularDev` reads `Cors:AllowedOrigins` (default `http://localhost:4200`); HTTPS
  redirection disabled in Development. Verified live: preflight from the allowed origin returns the CORS
  headers; a disallowed origin gets none; a real GET carries `Access-Control-Allow-Origin`.
- Angular environments via `fileReplacements` (`environment.ts` dev `:5214`, `environment.production.ts`
  same-origin). The Angular base/services/states existed from HU-01..04.
- **Real headless-browser E2E** (API `:5214` + `ng serve` `:4200`): list = 7 real rows, summary = 2
  currency cards (COP/USD), upcoming = 7 rows, **0 console errors / 0 failed requests**. This closes the
  browser-E2E that earlier stories deferred to HU-08.
