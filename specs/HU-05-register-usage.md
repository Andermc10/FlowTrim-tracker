# HU-05: Register declared usage of a subscription

- **Status:** Implemented _(2026-10-15; all proposals accepted — CASCADE, any valid date, 201+Location, /:id/usage route, notes ≤ 500)_
- **Story / Issue:** FlowTrim-tracker#6 · tasks: backend#12 (UsageRecord domain + persistence + migration), backend#13 (usage API), frontend#6 (register-usage UI)
- **Priority:** P1
- **Author / Date:** Ander (with Claude) · 2026-10-15

## 1. Context and goal
The user wants to record how often they use a subscription, to keep a usage history (and later audit
cost-per-use, HU-06). Usage is **declared by the user, not verified**. This adds the `UsageRecord`
entity (the first foreign key), the endpoints to create and query usage per subscription and period,
and a small UI to register it.

## 2. Scope
**In scope:**
- Domain: `UsageRecord` (`Id`, `SubscriptionId`, `UsageDate`, `UsageCount ≥ 0`, optional `Notes`) with
  invariants via a factory.
- Persistence: `usage_records` table with a FK to `subscriptions` (indexed), a `CHECK` on `usage_count`,
  and the migration `AddUsageRecordsTable`.
- API: `POST /api/subscriptions/{id}/usage-records` (`201` / `400` / `404`) and
  `GET /api/subscriptions/{id}/usage-records?from=&to=` (`200` / `404`).
- Angular: a route to register usage for a subscription and see its recent records, with success/error.
- xUnit tests for the invariants and the register/list handlers.

**Out of scope (later):**
- Cost per use → HU-06 (consumes these records). Editing/deleting individual usage records.

## 3. Functional requirements
- **FR-1:** A usage record can only be created for an **existing** subscription (`404` otherwise).
- **FR-2:** `UsageDate` is a valid date; `UsageCount` is an integer `≥ 0` (zero allowed).
- **FR-3:** Records are persisted and queryable by subscription and optional `from`/`to` date range.
- **FR-4:** `POST` returns `201` with the created record; invalid input → `400`, nothing persisted.
- **FR-5:** The UI shows a success or error message based on the API result.

## 4. Business rules
- `UsageCount ≥ 0`; usage is **declared**, not verified (the UI states this).
- `Notes` optional, max length **500**.
- `UsageDate` accepted as any valid calendar date (declared usage may be backdated) — see Q2.
- FK `usage_records.subscription_id → subscriptions.id`, `ON DELETE CASCADE` (deleting a subscription
  removes its usage records) — see Q1.
- An expected renewal is not a usage; usage records are independent, user-entered data.

## 5. Acceptance criteria
- **AC-1:** `POST` to an existing subscription with valid data → `201`, persisted.
- **AC-2:** `POST` to an unknown subscription id → `404`, nothing persisted.
- **AC-3:** `POST` with negative `UsageCount` → `400`, nothing persisted.
- **AC-4:** `GET .../usage-records` returns the records for that subscription; `from`/`to` filter by `UsageDate`.
- **AC-5:** `GET` for an unknown subscription id → `404`.
- **AC-6:** The register-usage UI shows success on `201` and the field/error message on failure.

## 6. API contract
| Method | Route | Request | Success | Errors |
|---|---|---|---|---|
| POST | `/api/subscriptions/{id}/usage-records` | `RegisterUsageRequest` | `201` `UsageRecordResponse` (`Location`) | `400`, `404` |
| GET | `/api/subscriptions/{id}/usage-records?from=&to=` | — | `200` `UsageRecordResponse[]` | `404` |

`RegisterUsageRequest`:
```json
{ "usageDate": "2026-10-10", "usageCount": 3, "notes": "watched 3 movies" }
```
`UsageRecordResponse`:
```json
{ "id": "…", "subscriptionId": "…", "usageDate": "2026-10-10", "usageCount": 3, "notes": "watched 3 movies" }
```
List is ordered by `usageDate` descending. `from`/`to` are inclusive `DateOnly` bounds (both optional).

## 7. Data model changes
New table `usage_records` (snake_case):

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK `pk_usage_records` |
| `subscription_id` | `uuid` | `NOT NULL`, FK `fk_usage_records_subscriptions_subscription_id` → `subscriptions(id)` `ON DELETE CASCADE`, index `ix_usage_records_subscription_id` |
| `usage_date` | `date` | `NOT NULL` |
| `usage_count` | `integer` | `NOT NULL`, `ck_usage_records_usage_count_non_negative` (`usage_count >= 0`) |
| `notes` | `varchar(500)` | nullable |

Migration name: **`AddUsageRecordsTable`** — generated and committed, applied manually (`dotnet ef database update`).

## 8. Validation and error cases
| Case | Expected result |
|---|---|
| Unknown subscription id (POST/GET) | `404` ProblemDetails |
| `usageCount` < 0 | `400` on `usageCount`, not persisted |
| `usageDate` missing/unparseable | `400` on `usageDate` |
| `notes` > 500 chars | `400` on `notes` |
| Valid | `201`, persisted |

## 9. Edge cases
- `usageCount = 0` is valid (a recorded "no use").
- Multiple records on the same date are allowed (each is a separate declaration).
- `from`/`to` omitted → all records for the subscription.

## 10. UI states (frontend)
- **Loading:** while loading the subscription and its recent usage.
- **Empty:** "No usage recorded yet" for a subscription with none.
- **Success:** the new record appears in the recent list; a success message.
- **Error:** field errors from `400`; a general message otherwise; `404` → "subscription not found".
- **Accessibility:** labelled inputs; the UI states usage is declared, not verified.

## 11. Test plan
Domain: `Create_WithValidData_Succeeds`, `Create_WithNegativeCount_Throws`, `Create_WithZeroCount_Succeeds`,
`Create_WithTooLongNotes_Throws`, `Create_TrimsBlankNotesToNull`.
Application: `Register_UnknownSubscription_ReturnsNotFound`, `Register_Valid_Persists`,
`Register_NegativeCount_ReturnsInvalid`, `List_FiltersByPeriod`, `List_UnknownSubscription_ReturnsNotFound`.
API: status-code mapping `201/400/404/200`.
Manual/live (PR): register usage, query by period, 404 on unknown id.

## 12. Assumptions and open questions
- **Q1 — FK delete behavior:** `ON DELETE CASCADE` *(proposed)* so a subscription's usage goes with it.
- **Q2 — UsageDate range:** accept any valid date *(proposed)*, or reject future dates (usage can't be
  declared in the future)?
- **Q3 — POST result:** `201` with the created record + `Location` *(proposed)*.
- **Q4 — Frontend placement:** a `/:id/usage` route (form + recent list), linked from the list/edit
  *(proposed)*.
- **Q5 — Notes max length:** 500 *(proposed)*.

## 13. Task breakdown
- [ ] backend#12 — `UsageRecord` domain + EF mapping + migration `AddUsageRecordsTable`; `IUsageRecordRepository`.
- [ ] backend#13 — Register/list handlers + DTOs + `POST`/`GET` endpoints (404 when the subscription is missing).
- [ ] frontend#6 — `/:id/usage` UI: form + recent list + success/error; typed service; states.

## 14. Implementation notes (filled after delivery)
Delivered on 2026-10-15. Backend PR `FlowTrim-backend#40` (closes #12/#13); frontend PR
`FlowTrim-frontend#22` (closes #6). No deviations.

- `UsageRecord` + `usage_records` table (FK CASCADE, `usage_count >= 0` check, index), migration
  `AddUsageRecordsTable`. 82 backend tests (12 new).
- Verified live: POST valid → `201`; unknown subscription → `404`; negative count → `400`; GET list →
  `200`; GET unknown → `404`.
- Frontend `/:id/usage` form + recent list; 12 Vitest tests.
