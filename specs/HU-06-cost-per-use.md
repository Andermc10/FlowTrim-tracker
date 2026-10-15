# HU-06: Cost per use (no division by zero)

- **Status:** Implemented _(2026-10-15; approved decisions delivered and verified with automated tests,
live API checks and browser E2E)_
- **Story / Issue:** FlowTrim-tracker#7 · tasks: backend#14 (cost-per-use service + endpoint), frontend#7 (cost-per-use UI); also `FlowTrim-backend#21` (HU-10 cost-per-use tests, unblocked here)
- **Priority:** P1
- **Author / Date:** Ander (with Claude) · 2026-10-15

## 1. Context and goal
Reveal under-used services: for a period, show the **declared** cost per use = period cost ÷ total uses.
With no records or zero uses it must be **not calculable** — never divide by zero or return infinity.
The UI states usage is declared by the user, not verified.

## 2. Scope
**In scope:**
- Domain: a pure `CostPerUseCalculator` (period cost, total uses → calculable? + cost per use).
- `GET /api/subscriptions/{id}/cost-per-use?from=&to=` → `200` with a result that is either calculable
  (value) or **not calculable** (null + reason); `404` if the subscription is missing.
- Angular: a cost-per-use panel on the usage page, with the "not calculable" and "declared" wording.
- xUnit tests for the calculator (valid, zero uses, no records, multiple months) — closes `backend#21`.

**Out of scope:** changing how usage is recorded (HU-05); multi-currency conversion.

## 3. Functional requirements
- **FR-1:** Period cost = `monthlyEquivalent × monthsInPeriod` in the subscription's currency.
- **FR-2:** Cost per use = `periodCost ÷ totalUses`, rounded to 2 decimals, **only when `totalUses > 0`**.
- **FR-3:** No usage records in the period **or** `totalUses == 0` → **not calculable** (no division).
- **FR-4:** The period is `[from, to]`; if omitted, it is derived from the records' min/max usage date.
- **FR-5:** `404` if the subscription does not exist.
- **FR-6:** The UI shows the cost per use or a "not enough data" message, and that usage is declared.

## 4. Business rules
Reference CLAUDE.md §5 (Cost per use).
- `monthsInPeriod` = number of distinct calendar months spanned by the period (inclusive), minimum 1.
- `periodCost = monthlyEquivalent × monthsInPeriod`; `monthlyEquivalent` reuses HU-03.
- `totalUses` = Σ `usageCount` of the records in the period.
- `totalUses == 0` or no records → **not calculable** (`costPerUse = null`, a reason string). Never ∞, never a divide error.
- Rounding: cost per use to 2 decimals (`AwayFromZero`).
- Single currency per subscription; no conversion.

## 5. Acceptance criteria
- **AC-1:** Given records with uses in a period, cost per use = period cost ÷ total uses (rounded).
- **AC-2:** Given no records (or all with `usageCount` summing to 0), the result is **not calculable** with a reason; no error.
- **AC-3:** The period cost uses the subscription cost for the same period (monthly equivalent × months).
- **AC-4:** `404` for an unknown subscription id.
- **AC-5:** The UI indicates usage is declared by the user, not verified, and shows "not enough data" when applicable.

## 6. API contract
| Method | Route | Request | Success | Errors |
|---|---|---|---|---|
| GET | `/api/subscriptions/{id}/cost-per-use?from=&to=` | — | `200` `CostPerUseResponse` | `404` |

`CostPerUseResponse`:
```json
{
  "subscriptionId": "…", "currency": "COP",
  "from": "2026-10-01", "to": "2026-10-31",
  "monthsInPeriod": 1, "totalPaid": 38900.00, "totalUses": 10,
  "calculable": true, "costPerUse": 3890.00, "reason": null
}
```
Not calculable: `"calculable": false, "costPerUse": null, "reason": "No usage in the selected period."`.

## 7. Data model changes
None. Reads `subscriptions` and `usage_records`.

## 8. Validation and error cases
| Case | Expected result |
|---|---|
| Unknown subscription id | `404` ProblemDetails |
| No records / totalUses == 0 | `200`, `calculable: false`, `costPerUse: null`, reason |
| Valid uses | `200`, `calculable: true`, rounded cost per use |
| `from`/`to` omitted | period derived from records' min/max usage date |

## 9. Edge cases
- Period spanning 2 calendar months → `monthsInPeriod = 2`, period cost doubles.
- A single record with `usageCount = 0` → not calculable.
- `from`/`to` with no records in range → not calculable.

## 10. UI states (frontend)
- On the usage page: a cost-per-use panel showing period cost, total uses and the result, or
  "Not enough data to compute cost per use." Always notes usage is declared, not verified.
- Loading/error handled with the page's existing states.

## 11. Test plan
Domain (`CostPerUseCalculator`): `Calculate_WithUses_DividesPeriodCostByUses`,
`Calculate_ZeroUses_NotCalculable`, `Calculate_NoRecords_NotCalculable`,
`Calculate_MultipleMonths_ScalesPeriodCost`, `Calculate_RoundsToTwoDecimals`.
Application: `GetCostPerUse_UnknownSubscription_ReturnsNull(404)`, `GetCostPerUse_ComputesForPeriod`.
This set satisfies `FlowTrim-backend#21` (HU-10 cost-per-use tests).
Manual/live (PR): record uses, query cost per use; zero/no-records → not calculable; unknown id → `404`.

## 12. Assumptions and open questions
- **Q1 — Period cost:** `monthlyEquivalent × distinct-calendar-months-spanned (min 1)` *(proposed)*, vs
  a single month's cost regardless of range.
- **Q2 — Omitted period:** derive `[from,to]` from the records' min/max usage date; none → not calculable *(proposed)*.
- **Q3 — Not-calculable shape:** `calculable: false`, `costPerUse: null`, `reason` string *(proposed)*.
- **Q4 — Rounding:** cost per use to 2 decimals *(proposed)*.
- **Q5 — Frontend:** cost-per-use panel on the existing `/:id/usage` page *(proposed)*, not a new route.

## 13. Task breakdown
- [x] backend#14 — `CostPerUseCalculator` (domain) + `GetCostPerUseHandler` + `GET .../cost-per-use` endpoint + DTO; tests (closes backend#21).
- [x] frontend#7 — cost-per-use panel on the usage page; service method; "not calculable"/"declared" wording.

## 14. Implementation notes (filled after delivery)
_(to be completed; the spec must be updated before the code deviates)_

Delivered on 2026-10-15. Backend PR `FlowTrim-backend#41` and frontend PR
`FlowTrim-frontend#23` were merged; backend#14, backend#21, frontend#7 and tracker#7 are closed.
No data model changes or new dependencies were required.

- Backend: pure calculator, application handler, DTO, endpoint and 8 focused tests; backend suite now
  has 90 passing tests.
- Frontend: typed service method and cost-per-use panel on `/:id/usage`; frontend suite now has 13
  passing tests.
- Verified live against PostgreSQL: `200` with a calculable result and `404` for an unknown subscription.
- Verified in a headless browser: panel rendered period, period cost, total uses and cost per use with
  zero console errors and zero failed requests.
