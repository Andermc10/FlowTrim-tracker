# HU-02: View, edit and delete subscriptions

- **Status:** Implemented _(2026-10-14; Q1/Q3/Q5 as proposed, Q2 = 404 on unknown id, Q4 = nextBillingDate asc then name)_
- **Story / Issue:** FlowTrim-tracker#3 · tasks: backend#7 (API list/detail/update/delete), frontend#3 (list + edit + delete UI)
- **Priority:** P0
- **Author / Date:** Ander (with Claude) · 2026-10-14

## 1. Context and goal
HU-01 created subscriptions. HU-02 lets the user keep them up to date: list them, view one,
edit it, and delete it. This completes the CRUD on the `Subscription` aggregate and backs the
dashboard and summary stories that follow.

## 2. Scope
**In scope:**
- `GET /api/subscriptions` — paged list.
- `GET /api/subscriptions/{id}` — detail (`200` / `404`).
- `PUT /api/subscriptions/{id}` — full update of editable fields (`200` / `400` / `404`).
- `DELETE /api/subscriptions/{id}` — delete (`204` / `404`).
- Domain: an `Update` method on `Subscription` enforcing the same invariants and refreshing `UpdatedAt`.
- Repository: get-by-id, paged list + count, update, delete.
- Angular: list view with simple (client-side) search, edit (reusing the form, prefilled), and
  delete with a confirmation step; loading / empty / success / error states.
- xUnit tests for the update invariants and the list/get/update/delete handlers.

**Out of scope (later stories):**
- Financial summary and projections → HU-03. Upcoming-charge ordering/alerts → HU-04.
- Server-side search/filtering: HU-02 search is client-side over the current page only.
- Centralized exception middleware / full RFC 7807 field-error contract → HU-09.
- Live Angular ↔ API browser E2E (needs CORS) → HU-08; here the frontend is covered by build + unit tests.

## 3. Functional requirements
- **FR-1:** `GET /api/subscriptions?page=&pageSize=` returns a page of subscriptions plus paging metadata.
- **FR-2:** `GET /api/subscriptions/{id}` returns the subscription (`200`) or `404` if it does not exist.
- **FR-3:** `PUT /api/subscriptions/{id}` updates all editable fields of an existing subscription and
  returns the updated resource (`200`); `404` if missing; `400` if invalid (nothing persisted).
- **FR-4:** `PUT` can change `status` (Active/Inactive) — this is how the user deactivates a subscription.
- **FR-5:** `DELETE /api/subscriptions/{id}` removes an existing subscription (`204`); `404` if missing.
- **FR-6:** `UpdatedAt` is refreshed from the injected `TimeProvider` on update; `Id` and `CreatedAt` never change.
- **FR-7:** The Angular list shows existing subscriptions, supports simple name search, and offers edit
  and delete (with confirmation) with loading/empty/success/error states.

## 4. Business rules
- Editable fields: `name`, `category`, `amount`, `currency`, `billingCycle`, `nextBillingDate`, `status`.
  All obey the HU-01 invariants (name ≤120 non-empty, amount > 0 rounded to 2, currency `^[A-Z]{3}$`,
  category ≤60, billing cycle in {Monthly, Yearly}, status in {Active, Inactive}).
- `Id` and `CreatedAt` are immutable. `UpdatedAt` changes on every successful update.
- Default list order: `nextBillingDate` ascending, then `name` ascending (soonest charge first).
- Paging: `page` ≥ 1 (default 1), `pageSize` 1–100 (default 20). Out-of-range values are clamped.

## 5. Acceptance criteria
- **AC-1:** Given subscriptions exist, when I `GET /api/subscriptions`, then I get a page of them with
  `page`, `pageSize`, `totalCount` and the default order.
- **AC-2:** Given an existing id, when I `GET /api/subscriptions/{id}`, then `200` with the resource;
  given an unknown id, then `404`.
- **AC-3:** Given an existing subscription and a valid body, when I `PUT`, then `200` with the updated
  values and a refreshed `updatedAt`; the change persists.
- **AC-4:** Given an invalid body, when I `PUT`, then `400` with field errors and nothing changes.
- **AC-5:** Given an unknown id, when I `PUT` or `DELETE`, then `404`.
- **AC-6:** Given an existing subscription, when I `DELETE`, then `204` and a later `GET /{id}` returns `404`.
- **AC-7:** The list view renders existing subscriptions, filters by name as I type, lets me edit one
  (prefilled form → save) and delete one after an explicit confirmation, handling all four UI states.

## 6. API contract
| Method | Route | Request | Success | Errors |
|---|---|---|---|---|
| GET | `/api/subscriptions?page=1&pageSize=20` | — | `200` `PagedResponse<SubscriptionResponse>` | — |
| GET | `/api/subscriptions/{id}` | — | `200` `SubscriptionResponse` | `404` |
| PUT | `/api/subscriptions/{id}` | `UpdateSubscriptionRequest` | `200` `SubscriptionResponse` | `400`, `404` |
| DELETE | `/api/subscriptions/{id}` | — | `204` | `404` |

`PagedResponse<T>`:
```json
{ "items": [ /* SubscriptionResponse */ ], "page": 1, "pageSize": 20, "totalCount": 42 }
```
`UpdateSubscriptionRequest` (same shape as create plus `status`):
```json
{
  "name": "Netflix",
  "category": "Streaming",
  "amount": 44900.00,
  "currency": "COP",
  "billingCycle": "Monthly",
  "nextBillingDate": "2026-12-01",
  "status": "Active"
}
```
`404` body is a `ProblemDetails` with `status: 404` and a generic title (no internal details).

## 7. Data model changes
None. Reuses the `subscriptions` table from HU-01. No migration.

## 8. Validation and error cases
| Case | Expected result |
|---|---|
| `GET` list with `pageSize` > 100 or `page` < 1 | values clamped; `200` |
| `GET`/`PUT`/`DELETE` unknown id | `404` ProblemDetails |
| `PUT` invalid field (same rules as create) | `400`, not persisted |
| `PUT` invalid `status` value | `400` on `status` |
| `DELETE` existing | `204`, removed |

## 9. Edge cases
- Empty database: list returns `items: []`, `totalCount: 0`, `200`.
- `page` beyond the last page: empty `items`, correct `totalCount`.
- Deleting an already-deleted id: `404` (not idempotent `204`) — see open questions.
- Editing only `status` to `Inactive`: allowed; the row stays, excluded from active spending later (HU-03).

## 10. UI states (frontend)
- **List — loading:** skeleton/spinner while fetching.
- **List — empty:** a friendly "no subscriptions yet" with a link to the create form.
- **List — success:** table/cards with name, amount+currency, cycle, next date, status, and edit/delete actions; a search box filters the current page by name.
- **List — error:** message + retry.
- **Edit:** the HU-01 form prefilled; save → `PUT`; success returns to the list; field errors shown.
- **Delete:** explicit confirmation (dialog/inline) before calling `DELETE`; success removes the row; error message on failure.
- **Accessibility:** actions reachable by keyboard; confirmation focus-trapped; COP currency formatting.

## 11. Test plan
Domain (xUnit): `Update_WithValidData_UpdatesFieldsAndRefreshesUpdatedAt`,
`Update_KeepsIdAndCreatedAt`, `Update_WithInvalidAmount_Throws`, `Update_CanChangeStatusToInactive`.
Application: list (paging/order), get (found/not-found → null), update (valid/invalid/not-found),
delete (found → true / missing → false), with a fake repository and fixed `TimeProvider`.
API: status-code mapping `200/400/404/204` (handler-level where a full host is impractical).
Manual (recorded in PR): list, get 200/404, put 200/400/404, delete 204 then get 404.

## 12. Assumptions and open questions
- **Q1 — Application shape:** add one handler per use case (List/Get/Update/Delete), consistent with
  HU-01's `CreateSubscriptionHandler`? *(proposed: yes)* Or consolidate into a single
  `SubscriptionService` to reduce boilerplate?
- **Q2 — Delete unknown id:** return `404` (proposed, explicit) or idempotent `204`?
- **Q3 — Paging shape:** `page`/`pageSize` offset paging with `totalCount` (proposed) is enough for the MVP?
- **Q4 — Default order:** `nextBillingDate` asc then `name` asc (proposed)? Or `createdAt` desc (newest first)?
- **Q5 — Search:** client-side over the current page for HU-02 (proposed); server-side search deferred. OK?
- **A1:** `PUT` is a full replace of editable fields (not PATCH); omitted/invalid fields are validation errors.

## 13. Task breakdown
- [ ] backend#7 — API: `GET` list (paged), `GET {id}`, `PUT {id}`, `DELETE {id}`; domain `Update`; repository methods; handlers; tests.
- [ ] frontend#3 — UI: list with search, edit (reuse form), delete with confirmation; typed service methods; states; tests.

## 14. Implementation notes (filled after delivery)
Delivered on 2026-10-14. Backend PR `FlowTrim-backend#32` (closes #7); frontend PR
`FlowTrim-frontend#15` (closes #3). No deviations from this spec.

- Backend: 40 xUnit tests total (14 new for `Update` invariants and the four handlers, on a shared
  in-memory repository). Verified live: list `200` (ordered/paged), get `200`/`404`, put `200`/`400`/`404`
  (fields updated, `updatedAt` refreshed, `createdAt` kept), delete `204` then get `404`.
- Frontend: the create form from HU-01 was generalized to also edit (route-driven, prefilled, with a
  `status` field); the list uses client-side search and an inline delete confirmation. `npm run build`
  passes; 5 Vitest tests (app shell + service create/list/delete).
- `404` bodies use `Results.Problem(statusCode: 404)` (ProblemDetails); the full RFC 7807 field-error
  contract and centralized middleware remain HU-09.
