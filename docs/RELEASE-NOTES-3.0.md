# FlowTrim 3.0 — Release Notes and Readiness Review

- **Review date:** 2026-10-28
- **Scope:** everything merged to `main` since `v0.1.0` (FlowTrim 2.0 and 3.0 epics).
- **Result:** ready as a **local** release. Not published as a tag or GitHub Release yet (owner's decision). The
  "demo health is healthy" criterion of HU-49 cannot be met until a public environment exists (HU-40, deferred).

## Implemented

### FlowTrim 2.0 — secure, observable, explained
- **EP-04** Authentication (OIDC Authorization Code + PKCE, Auth0) and per-user isolation by token `sub` (HU-12).
- **EP-06** GitHub Actions CI with protected `main` (HU-38), environment and CORS hardening (HU-39), correlation ids and
  structured logs (HU-41).
- **EP-05** FlowTrim Insights: provider boundary with an offline fake and Groq (HU-33), allow-listed deterministic tools
  (HU-34), protected question endpoint with rate limit and budget (HU-35), AI Assistant screen (HU-36), evidence and
  limits verified (HU-37).
- **EP-07** Recurring payment CSV import with preview, duplicates and atomic confirmation (HU-43..HU-46).
- **EP-08** PostgreSQL integration tests with Testcontainers (HU-47) and the committed browser flow `npm run e2e` (HU-48).
- **EP-09 / EP-10** Analytics charts, printable report and CSV export; animated toasts and one upcoming-charge heads-up
  per session.
- **EP-01..EP-03, EP-11** Carbon Signal design system, light/dark themes, English/Spanish, modals, live validation and
  UX polish; Angular 22 with ESLint.

### FlowTrim 3.0 — daily personal finance
- **EP-12** Accounts with computed balances, categories, transactions, quick add (**N**) and the **Today** home with
  "safe to spend today" (HU-64..HU-68).
- **EP-13** Landing redesign with GSAP loaded only on the landing and a quality matrix (HU-69..HU-71); brand logo.
- **EP-14** Recurring payments: bills and instalment plans, weekly/biweekly/quarterly cycles, payment links, mark as
  paid into an account, financial calendar (HU-72..HU-75).
- **EP-15** Monthly budgets per category with 80 %/100 % alerts and savings goals with declared contributions
  (HU-76, HU-77).
- **EP-16** Monthly statement, bank CSV import with duplicate detection and three new AI tools (month spending, budgets,
  goals) (HU-78..HU-80).

## Deferred (not implemented)

| Item | Why |
|---|---|
| **HU-40** public demonstration environment | No budget; deferred by the owner. Everything runs locally. |
| **Phase 4** e-mail digest (Resend) and Web Push | Needs a public deployment (HU-40) and an e-mail provider account. |
| Wompi sandbox payments | Optional in the roadmap; not started. |
| Bank connections, charge detection, currency conversion | Out of scope by product rule (manual data, per-currency totals). |
| Tag / GitHub Release for 3.0 | Waiting for the owner's OK. |

## Readiness checklist (HU-49)

| Criterion | Result | Evidence |
|---|---|---|
| P0 acceptance criteria checked against code | PASS (local) | Specs marked Implemented with notes; `E2E-ACCEPTANCE.md` rows 1–29 |
| Backend tests | PASS | 766 tests (699 fast + 67 PostgreSQL), CI green on `main` after backend #105 |
| Frontend tests, lint, build | PASS | 249 unit tests, ESLint clean, production build (initial bundle ≈ 457 kB of 500 kB) |
| Browser critical flow | PASS | `npm run e2e` on the real API + PostgreSQL (2026-10-27) |
| Docs describe the same routes and limitations | PASS | Backend/frontend READMEs updated for 3.0 (backend #106, frontend #124); [`PORTFOLIO.md`](PORTFOLIO.md) |
| No real credentials or private data in the repos | PASS | Pattern scan of tracked files in the three repos found no keys or passwords; secrets live in User Secrets |
| Dependencies | PASS | `dotnet list package --vulnerable --include-transitive`: none; `npm audit --omit=dev`: 0 vulnerabilities |
| No misleading financial claims | PASS | Expected vs recorded vs declared kept apart in API, UI and docs; estimates show assumptions |
| CI green for the release commit | PASS | Both repos require the CI check on `main` |
| Demo health check healthy | **NOT MET** | No public environment (HU-40 deferred); local `GET /api/health` is healthy |

## Known issues

- A test that cancels an Insights request was timing-dependent and failed once on `main` after #104; fixed in backend
  #105 (the test now cancels only when the server is waiting for the model).
- On machines with very little free memory the first Vitest run can time out; a rerun passes.
