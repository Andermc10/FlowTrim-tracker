# HU-48: Verify the Critical Browser Flow

- **Status:** Approved _(approved 2026-10-19 by Ander, including the @playwright/test dev dependency)_
- **Story / Issue:** FlowTrim-tracker#78 · tasks: frontend#70 (authenticated browser smoke flow), tracker#79 (browser
  acceptance evidence)
- **Priority:** P0
- **Epic:** EP-08
- **Dependencies:** HU-12 (authentication, owner isolation), HU-36 (Insights page). HU-40 (public deploy) is **not**
  done and is optional/free-tier only, so this story targets a **reproducible local stack**; the same flow can point at
  a deployed URL later.
- **Author / Date:** Ander (with Claude) · 2026-10-19

## 1. Context and goal
Unit, API and integration tests prove each piece, and stories so far were checked with one-off headless scripts kept
outside the repositories. Nothing in version control replays the real user journey in a browser. This story adds a
**committed, repeatable browser smoke flow** that goes from signing in to an evidence-backed Insights answer and proves
that a second account cannot see the first account's data.

## 2. Scope
**In scope**
- `FlowTrim-frontend/e2e/`: one Playwright spec covering the critical flow (section 3), its configuration and a
  **local OIDC test issuer** so the real Angular PKCE sign-in code runs without a real identity provider.
- An Angular build configuration `e2e` (its own `environment.e2e.ts`) pointing at the local issuer.
- `npm run e2e`, which starts the issuer, the API and the built SPA, then runs the flow.
- Tracker: setup instructions and evidence in `docs/E2E-ACCEPTANCE.md` and the demo checklist.

**Out of scope**
- Running the flow in GitHub Actions (it needs the backend repository, .NET and PostgreSQL next to the frontend; a
  cross-repository pipeline is a later decision, see section 12).
- Visual regression, cross-browser matrix (Chromium only), load testing.
- Automating the real Auth0 tenant (it needs stored credentials and shows a consent screen on `localhost`; it stays a
  manual check, E2E row 17).

## 3. Functional requirements
- **FR-1 Test identity provider:** `e2e/support/test-issuer.mjs` (Node, no dependencies) serves OIDC discovery, JWKS,
  an `/authorize` page with "Sign in as Account A" / "Sign in as Account B" buttons, a `/oauth/token` endpoint that
  **verifies the PKCE S256 challenge** and returns an RS256 access token (`sub` = `e2e|account-a-<runId>` or
  `e2e|account-b-<runId>`, audience = the API audience), and an `end_session_endpoint` that redirects back. It only
  listens on `localhost` and is never part of the production build.
- **FR-2 Stack startup:** Playwright `webServer` entries start (1) the test issuer, (2) the API from the sibling
  backend folder (`FLOWTRIM_BACKEND_DIR`, default `../FlowTrim-backend`) with `Authentication__Authority` pointing at
  the issuer, `Authentication__RequireHttpsMetadata=false` and the **fake** Insights provider (deterministic, no
  quota), and (3) the SPA built with the `e2e` configuration, served on `http://localhost:4200`. PostgreSQL comes from
  the existing `docker compose` setup with migrations applied. Nothing secret is needed.
- **FR-3 Critical flow (one spec, ordered steps):**
  1. Open `/app` signed out: the guard redirects to the sign-in page.
  2. Sign in as Account A through the issuer page: back on the workspace overview, which shows its **empty state**.
  3. Create a subscription through the form (Netflix, 38,900 COP, monthly, due in 3 days): it appears in the list,
     the overview shows 38,900 COP per month and the upcoming-charge toast appears.
  4. Open Insights, use the "monthly spending" suggestion: **loading** state, then `answered` with the figure
     38,900 COP; follow the "Overview" source link and see the same amount.
  5. **Controlled error / bounded states:** ask an unsupported question and see the fixed message; open the edit page
     of a non-existent subscription id and see the not-found message.
  6. Sign out: `/app` requires signing in again.
  7. Sign in as Account B: the subscription list is **empty**; opening Account A's subscription edit URL shows
     not-found (no data of A is rendered).
  8. Sign out, sign in as A again and delete the subscription through the confirmation modal: the list is empty again
     (clean-up through the UI).
- **FR-4 Browser health:** during the whole flow, any `console.error`, uncaught page error or failed request fails the
  test, except an explicit allow-list of the responses the flow provokes on purpose (the two `404`s of steps 5 and 7).
- **FR-5 Evidence:** on success the run writes screenshots of key checkpoints (overview, Insights answer, Account B
  empty list) under `e2e/results/` (ignored by Git) and Playwright's HTML report; on failure, trace and screenshot.
- **FR-6 Reproducibility:** a short `e2e/README.md` lists prerequisites (Docker Desktop, .NET 10 SDK, Node 22,
  backend cloned next to the frontend, `dotnet ef database update` once) and the single command `npm run e2e`.

## 4. Business rules
- Synthetic data only; every run uses fresh subjects (`<runId>`), so runs never collide and no reset is needed. The
  flow deletes what it creates.
- The test issuer and the `e2e` configuration must not change production behavior: production keeps Auth0 values and
  the production build never includes the issuer.

## 5. Acceptance criteria
- **AC-1:** Given the documented prerequisites, when `npm run e2e` runs, then the stack starts and the flow of FR-3
  passes in Chromium.
- **AC-2:** Given Account A's data, when Account B signs in, then B's list is empty and A's subscription URL shows
  not-found.
- **AC-3:** Given the flow, then loading, empty, success, unsupported and not-found states are each asserted.
- **AC-4:** Given any unexpected console error, page error or failed request, then the run fails.
- **AC-5:** Given the token endpoint receives a wrong `code_verifier`, then it rejects the exchange (issuer unit check
  in the same run), proving the PKCE path is really exercised.
- **AC-6:** `npm run build` (production) is unchanged: same environment values and no e2e code in the bundle.

## 6. API contract
None changed.

## 7. Data model changes
None.

## 8. Validation and error cases
Covered by existing stories; this flow observes them in the browser (not-found, unsupported question).

## 9. Edge cases
- The API takes several seconds to start on a cold machine: `webServer` waits for `GET /api/health` = 200.
- Low RAM on the dev machine: the SPA is served from a production-like build instead of `ng serve`, and only one
  browser worker runs.
- Port already in use (5214, 5999, 4200): Playwright reuses an already running server only when
  `E2E_REUSE_SERVERS=1`; otherwise it fails with a clear message.

## 10. UI states
Observed, not changed: empty overview, loading Insights, answered evidence, unsupported message, not-found,
signed-out redirect.

## 11. Test plan
- `e2e/critical-flow.spec.ts` — `CriticalFlow_SignInToInsights_AndIsolation` (FR-3 steps as `test.step`s).
- `e2e/support/test-issuer.spec.ts` — `TokenEndpoint_WrongVerifier_IsRejected` (AC-5).
- Existing unit tests keep running with `ng test`; `npm run build` must pass unchanged.

## 12. Assumptions and open questions
- **Decision needed — new dev dependency:** `@playwright/test` (Chromium only, dev dependency, not shipped). It is the
  standard Angular-agnostic E2E runner, gives traces and reports, and starts the three servers itself. Alternative:
  plain Node scripts with a browser driver, which would re-implement waiting, reports and server startup. The version
  is chosen at implementation time among releases compatible with Node 22.15.
- **Later decision (not this story):** run the flow in CI through a workflow that checks out both repositories, or
  against the HU-40 deployment.

## 13. Task breakdown
- [ ] frontend#70: test issuer, `e2e` Angular configuration, Playwright config and critical-flow spec,
  `npm run e2e`, `e2e/README.md`.
- [ ] tracker#79: E2E acceptance rows, demo checklist link, evidence of the first run.
