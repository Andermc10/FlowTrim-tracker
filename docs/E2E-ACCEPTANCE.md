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

## Notes
- No test or check uses real credentials or personal data; the local DB holds sample rows only.
- Cost-per-use (row 14) and its automated tests (backend#21) landed with HU-06.
- Rows 15–16 run against the real API and PostgreSQL with RS256 tokens from a local test issuer: a
  second API instance trusts it only through `Authentication__Authority` / `RequireHttpsMetadata`
  environment variables (nothing committed). Test rows use owners `test|user-a` / `test|user-b` and are
  deleted afterwards.
