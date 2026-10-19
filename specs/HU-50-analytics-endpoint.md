# HU-50: Owner-Scoped Analytics Endpoint

- **Status:** Implemented _(2026-10-19; approved 2026-10-18 by Ander)_
- **Story / Issue:** FlowTrim-tracker#98 · task: backend#70
- **Priority:** P1
- **Epic:** EP-09
- **Dependencies:** HU-03 (monthly equivalent), HU-12 (ownership)
- **Author / Date:** Ander (with Claude) · 2026-10-18

## 1. Context and goal
The charts in HU-51 need aggregated, deterministic numbers. They must be computed in C# with the existing
rules (monthly equivalent, active only, per currency, owner-scoped) — never in the browser and never by AI.

## 2. Scope
**In scope:** `GET /api/analytics`, a pure `AnalyticsCalculator` in the domain, unit + HTTP + PostgreSQL tests.
**Out of scope:** history, filters by date range, caching.

## 3. Functional requirements
- **FR-1:** `GET /api/analytics?months=12` (`months` 1–24, default 12) returns, per currency of the owner's
  **active** subscriptions:
  - `monthlyTotal` — Σ monthly equivalent (same value as the summary);
  - `byCategory` — `{ category, monthlyEquivalent, share, count }`, sorted by amount desc; a missing category
    is grouped as `"Uncategorized"`; `share` is a percentage with 1 decimal;
  - `topSubscriptions` — up to 5 `{ id, name, monthlyEquivalent }`, sorted by amount desc then name;
  - `expectedCharges` — one entry per calendar month starting with the reference month:
    `{ month: "2026-10", amount, count }`.
- **FR-2:** Expected charges: a **monthly** subscription is charged once in every month from the month of its
  `NextBillingDate` onwards; a **yearly** one is charged in the month of its `NextBillingDate` and every 12
  months after. Months before the reference month are not shown (overdue charges are reported by HU-04).
- **FR-3:** Reference month = current month in America/Bogota (same server reference date as HU-04).
- **FR-4:** Amounts rounded to 2 decimals (`AwayFromZero`), currencies never mixed, inactive excluded.
- **FR-5:** Requires authentication; uses only the current owner's rows.

## 4. Business rules
Reuses `Subscription.GetMonthlyEquivalent()` and the per-currency/active rules of HU-03. `expectedCharges` uses
the real `amount` charged in that month (a yearly 120,000 COP plan shows 120,000 in its month, 0 elsewhere),
which is exactly what a monthly-equivalent total hides.

## 5. Acceptance criteria
- **AC-1:** Given COP monthly 38,900 + COP yearly 120,000 (next 2027-02-15) + USD monthly 9.99, when
  `/api/analytics?months=12` is called in October 2026, then COP `monthlyTotal` = 48,900.00, USD = 9.99,
  COP `expectedCharges` shows 38,900 every month and 158,900 in 2027-02.
- **AC-2:** Given a subscription without category, then it appears under `"Uncategorized"`.
- **AC-3:** Given 7 active subscriptions, then `topSubscriptions` has 5, ordered by amount then name.
- **AC-4:** Given owners A and B, then each response only reflects their own subscriptions; anonymous → `401`.
- **AC-5:** Given `months=0` or `months=25`, then `400` `ValidationProblemDetails`.
- **AC-6:** Given no active subscriptions, then `200` with `currencies: []`.

## 6. API contract
| Method | Route | Request | Success | Errors |
|---|---|---|---|---|
| GET | `/api/analytics?months=12` | bearer token | `200` `AnalyticsResponse` | `400`, `401` |

```json
{
  "referenceMonth": "2026-10",
  "currencies": [{
    "currency": "COP", "monthlyTotal": 48900.00,
    "byCategory": [{ "category": "Streaming", "monthlyEquivalent": 38900.00, "share": 79.6, "count": 1 }],
    "topSubscriptions": [{ "id": "…", "name": "Netflix", "monthlyEquivalent": 38900.00 }],
    "expectedCharges": [{ "month": "2026-10", "amount": 38900.00, "count": 1 }]
  }]
}
```

## 7. Data model changes
None.

## 8. Validation and error cases
| Case | Result |
|---|---|
| `months` outside 1–24 or not a number | `400` field error `months` |
| No token | `401` |

## 9. Edge cases
- `NextBillingDate` in the past (overdue) → counted from the reference month onwards for monthly plans; a
  yearly plan whose date is past is shown at its next yearly occurrence within the window.
- Shares that do not add up to exactly 100.0 because of rounding are acceptable and documented.

## 10. UI states
None (API). Consumed by HU-51 and HU-52.

## 11. Test plan
Domain (`AnalyticsCalculatorTests`): `ByCategory_GroupsAndSortsAndComputesShare`,
`MissingCategory_IsUncategorized`, `Top_LimitsToFiveOrderedByAmountThenName`,
`ExpectedCharges_MonthlyEveryMonthYearlyOnItsMonth`, `ExpectedCharges_OverdueStartsAtReferenceMonth`,
`Currencies_NeverMixed_InactiveExcluded`. HTTP: `Analytics_TwoOwners_AreIsolated`,
`Analytics_InvalidMonths_ReturnsBadRequest`, `Analytics_WithoutToken_ReturnsUnauthorized`.
PostgreSQL integration: `Analytics_RealDatabase_MatchesSummaryMonthlyTotal`.

## 12. Assumptions and open questions
No open questions.

## 13. Task breakdown
- [x] backend: calculator, handler, endpoint, tests.

## 14. Implementation notes
- Delivered in backend PR #72: `Domain/Analytics/AnalyticsCalculator`, `Application/Analytics/GetAnalyticsHandler`,
  `GET /api/analytics`. `ProductCalendar.Today` was extracted from the upcoming-charges handler so HU-04 and HU-50
  share the reference date (no behavior change; HU-04 tests unchanged and green).
- A bug was caught while writing the calculator, before any commit: yearly plans with a *future* billing date
  were also charged 12 months earlier. Test `ExpectedCharges_FutureYearlyIsNotChargedBeforeItsFirstDate` covers it
  (mutation check: reintroducing the bug fails it).
- `months` that is not a number is rejected by ASP.NET Core model binding with `400` before the handler runs.
- Verification: 199/199 backend tests (+17, including PostgreSQL: analytics total equals the summary), CI green
  on the PR and `main`.
