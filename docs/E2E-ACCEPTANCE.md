# FlowTrim — Manual E2E acceptance checklist

Repeatable manual end-to-end checks for the MVP main flows. Run with the API on the `http` profile
(`http://localhost:5214`), the Angular dev server (`http://localhost:4200`) and the PostgreSQL
container up (`docker compose up -d`).

**Last run:** 2026-10-14 · all listed checks **PASS** (verified live during HU-01..HU-09, backend
via `curl`/`psql`, frontend via a headless browser against the running API).

| # | Flow | Steps | Expected | Result |
|---|---|---|---|---|
| 1 | Health | `GET /api/health` with DB up / DB down | `200` healthy / `503` unhealthy, no internals | PASS |
| 2 | Create | `POST /api/subscriptions` valid (`currency "cop"`) | `201`, stored as `COP`, `status Active` | PASS |
| 3 | Create invalid | `POST` empty name / amount 0 / bad cycle | `400` `ValidationProblemDetails`, nothing persisted | PASS |
| 4 | List | `GET /api/subscriptions?page=&pageSize=` | `200`, ordered by next billing date then name, paging metadata | PASS |
| 5 | Detail | `GET /api/subscriptions/{id}` existing / unknown | `200` / `404` ProblemDetails | PASS |
| 6 | Edit | `PUT /api/subscriptions/{id}` valid / invalid / unknown | `200` (updatedAt refreshed, createdAt kept) / `400` / `404` | PASS |
| 7 | Delete | `DELETE /api/subscriptions/{id}` then `GET {id}` | `204` then `404` | PASS |
| 8 | Summary | `GET /api/summary` | `200`, per-currency monthly/annual/active, currencies never summed | PASS |
| 9 | Upcoming | `GET /api/subscriptions/upcoming` | `200`, ordered, `daysUntilCharge` + `alertWindow` + server `referenceDate`; overdue tagged | PASS |
| 10 | Simulator | `POST /api/simulations` empty / with selection / bad horizon | zero savings / per-currency savings / `400`; persists nothing | PASS |
| 11 | Errors | force an unexpected error (DB down mid-request) | `500` generic ProblemDetails, no stack trace / secrets | PASS |
| 12 | CORS | preflight `OPTIONS` from `:4200` vs a disallowed origin | allowed gets CORS headers, disallowed does not | PASS |
| 13 | Frontend | load `/`, `/upcoming`, `/summary`, `/simulator` in the browser | real data renders, 0 console errors, 0 failed requests | PASS |
| 14 | Cost per use | (HU-06) declared cost-per-use with zero uses / no records | `200` not calculable with reason; no division | PASS (2026-10-15, HU-06) |
| 15 | Auth rejection | (HU-12) private route with no token / wrong audience / wrong issuer / expired / foreign signing key; token without `sub`; `GET /api/health` | `401` ×5 / `403` / `200` | PASS (2026-10-18) |
| 16 | Owner isolation | (HU-12) A creates 2, B creates 1; B reads/updates/deletes A's id; B usage + cost-per-use on A's id; summary, upcoming, simulation per user; `ownerId` in body | own rows only; cross-owner `404`; A's row unchanged; B summary 25000 vs A 55800; B simulation ignores A's id; body `ownerId` ignored | PASS (2026-10-18, 23/23) |
| 17 | Auth0 sign-in | (HU-12) real tenant: `/app` → login → Auth0 → callback → workspace; sign-out | PKCE exchange OK, owner-scoped reads, provider session ended | PASS (2026-10-18, manual) |
| 18 | Insights evidence | (HU-37) Q1–Q4 of `docs/INSIGHTS-VERIFICATION.md` with Groq | `200 answered`, figures equal summary / upcoming / simulation / cost-per-use | PASS (2026-10-19) |
| 19 | Insights rate limit | (HU-37) questions over 5 per 60 s; UI with limit 1 | `429` `insights_rate_limited` + `Retry-After`; UI countdown, submit disabled | PASS (2026-10-19) |
| 20 | Insights timeout | (HU-37) unroutable provider, 5 s budget | `504` `insights_timeout` after ~5 s | PASS (2026-10-19) |
| 21 | Insights provider outage | (HU-37) invalid provider key | `502` `insights_unavailable`; error log with correlation id, no key | PASS (2026-10-19) |
| 22 | Critical browser flow | (HU-48) `npm run e2e` in `FlowTrim-frontend` (test issuer + real API + e2e build, Chromium) | sign-in → empty overview → create → Insights figure = overview → unsupported / not-found → sign-out → account B sees nothing of A → A deletes; 0 unexpected console errors or failed requests | PASS (2026-10-19, automated) |
| 23 | CSV import in the browser | (HU-46) same `npm run e2e` flow, new step | Import CSV from the list → 3-row file previewed (1 duplicate of an existing subscription) → "Create subscriptions (2)" → result counts → list shows the 2 new rows (one inactive) and Netflix once → A deletes all; 0 unexpected console errors or failed requests | PASS (2026-10-20, automated) |
| 24 | UX polish in the browser | (EP-11) same `npm run e2e` flow, new steps | Live amount and past-date errors appear on blur and clear when fixed; the downloaded template previews 4 valid rows; "Mark as paid" on Upcoming shows the toast and moves the charge out of the alert window; `/app/report` opens the Report tab of Analytics & reports | PASS (2026-10-22) |
| 25 | Daily finance loop | (EP-12) same `npm run e2e` flow, new steps | Signed in, `/app` shows the Today first-use guide (subscription overview at `/app/summary`); create an account → on Today press N, type the amount, Tab, Enter → "Spent today" and the formula update without a reload → the transaction is listed on Transactions → delete it and the account; 0 unexpected console errors or failed requests | PASS (2026-10-22) |
| 26 | Landing quality matrix | (EP-13) temporary Playwright matrix: 360/768/1280 px × light/dark × EN/ES × reduced motion on/off (24 runs) | No horizontal overflow; one `h1`, no skipped heading levels; skip link is the first Tab stop; visible focus; WCAG AA contrast for every visible text; "Open workspace" reaches sign-in; with reduced motion GSAP is never requested and nothing pins; with motion the daily story pins ≥ 760 px and steps 1→4 in order, leaving and returning 3 times keeps one pin; 0 long tasks > 200 ms while scrolling; 0 console errors | PASS (2026-10-23) |
| 27 | Recurring payments | (EP-14) same `npm run e2e` flow, new steps | Mark as paid with no COP account only moves the date and says why; with a Bank account it records the expense (edited amount, chosen category): toast, *Recent payments* in the edit form, expense listed in Transactions; a weekly bill with an `https://` link shows its type badge, cycle, link and type filter; a 2-instalment plan with 1 paid is completed by the last payment (Completed badge); the calendar shows the bill on its day with its link; 0 unexpected console errors or failed requests | PASS (2026-10-27) |
| 28 | Budgets and goals | (EP-15) same `npm run e2e` flow, new steps | A Food budget of 40,000 starts On track; a 35,000 quick-add expense in Food turns it to 87.5 % · Close to the limit and it appears in Today's *Budgets to watch*; a savings goal Trip of 1,000,000 reaches 25 % after a 250,000 contribution and is deleted; 0 unexpected console errors or failed requests | PASS (2026-10-27) |
| 29 | Statement, bank import and AI tools | (EP-16) same `npm run e2e` flow, new steps | The Statement tab shows the 35,000 Food expense in the month and Food in the top categories; a bank CSV with an expense and an income imports both into Bank and a re-import marks both as duplicates; asking the AI Assistant "How are my budgets?" shows the Spent figure 35,000 and a link to Budgets; 0 unexpected console errors or failed requests | PASS (2026-10-27) |

## Notes
- No test or check uses real credentials or personal data; the local DB holds sample rows only.
- Cost-per-use (row 14) and its automated tests (backend#21) landed with HU-06.
- Rows 15–16 run against the real API and PostgreSQL with RS256 tokens from a local test issuer: a
  second API instance trusts it only through `Authentication__Authority` / `RequireHttpsMetadata`
  environment variables (nothing committed). Test rows use owners `test|user-a` / `test|user-b` and are
  deleted afterwards.
- Rows 18–21 (HU-37) use the same local test issuer, synthetic demo data for `test|hu37-demo` (deleted afterwards)
  and per-scenario environment variables; details in `docs/INSIGHTS-VERIFICATION.md`.
- Row 22 (HU-48) is automated and committed: `FlowTrim-frontend/e2e/` (setup in `e2e/README.md`). It replaces the
  one-off headless checks of earlier stories; real Auth0 sign-in stays manual (row 17).
