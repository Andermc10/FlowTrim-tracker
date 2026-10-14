# HU-03: Financial summary (monthly equivalent + annual projection)

- **Status:** Implemented _(2026-10-14; Q1/Q3/Q5 as proposed, Q2 = round per-item then sum, Q4 = separate /summary route)_
- **Story / Issue:** FlowTrim-tracker#4 · tasks: backend#8 (financial service), backend#9 (GET /api/summary), frontend#4 (dashboard cards)
- **Priority:** P0
- **Author / Date:** Ander (with Claude) · 2026-10-14

## 1. Context and goal
The user wants to understand what their subscriptions really cost: a monthly-equivalent spend and
an annual projection. HU-03 introduces the deterministic financial engine (CLAUDE.md §5) and exposes
it through `GET /api/summary`, plus a dashboard of summary cards. Totals are grouped **per currency**
(the MVP never converts or mixes currencies) and exclude inactive subscriptions.

## 2. Scope
**In scope:**
- Domain: `Subscription.GetMonthlyEquivalent()` and a pure `SummaryCalculator` that groups **active**
  subscriptions by currency and totals monthly-equivalent and annual projection.
- `GET /api/summary` returning per-currency totals.
- Angular dashboard: one summary card per currency (monthly equivalent, annual projection, active count) with an empty state.
- xUnit tests for the formulas, rounding, inactive exclusion, mixed currencies and the empty case.

**Out of scope (later stories):**
- Upcoming charges / countdown / alerts → HU-04.
- Cost per use → HU-06. Simulator → HU-07.
- Multi-currency conversion (never in the MVP).
- Live Angular ↔ API browser E2E (CORS) → HU-08.

## 3. Functional requirements
- **FR-1:** Monthly-cycle subscription → monthly equivalent = `amount`.
- **FR-2:** Yearly-cycle subscription → monthly equivalent = `amount / 12`.
- **FR-3:** Annual projection (per currency) = `Σ monthlyEquivalent × 12` over active subscriptions.
- **FR-4:** Only `Active` subscriptions count; `Inactive` are excluded.
- **FR-5:** Totals are grouped per currency; amounts of different currencies are never summed together.
- **FR-6:** With zero (active) subscriptions, the summary is empty and totals are zero.
- **FR-7:** The dashboard renders a card per currency and an empty state when there is nothing to show.

## 4. Business rules
Reference CLAUDE.md §5.
- Monthly equivalent: `Monthly → amount`; `Yearly → amount / 12`.
- **Rounding (explicit):** each subscription's monthly equivalent is rounded to **2 decimals**
  (`MidpointRounding.AwayFromZero`); per-currency `monthlyEquivalent` = Σ of those rounded values;
  `annualProjection` = `monthlyEquivalent × 12`. (Round-per-item, then sum — see Q2.)
- Grouping key is the ISO currency code; each currency is independent.
- Inactive subscriptions are excluded entirely. Assumes constant prices and active services (a caveat,
  never presented as a guarantee).
- The calculation is pure and uses no clock (dates are HU-04's concern).

## 5. Acceptance criteria
- **AC-1:** A monthly subscription contributes its `amount` to the monthly equivalent of its currency.
- **AC-2:** A yearly subscription contributes `amount / 12` (rounded to 2) to the monthly equivalent.
- **AC-3:** Per-currency `annualProjection` equals `monthlyEquivalent × 12`.
- **AC-4:** An inactive subscription contributes nothing.
- **AC-5:** Subscriptions in different currencies produce separate per-currency entries; nothing is summed across currencies.
- **AC-6:** With no active subscriptions, `GET /api/summary` returns an empty `currencies` list (totals zero) and the dashboard shows an empty state.
- **AC-7:** The dashboard shows, per currency, the monthly equivalent, the annual projection and the active count.

## 6. API contract
| Method | Route | Request | Success | Errors |
|---|---|---|---|---|
| GET | `/api/summary` | — | `200` `SummaryResponse` | — |

`SummaryResponse`:
```json
{
  "currencies": [
    { "currency": "COP", "monthlyEquivalent": 48900.00, "annualProjection": 586800.00, "activeCount": 2 },
    { "currency": "USD", "monthlyEquivalent": 9.99,     "annualProjection": 119.88,    "activeCount": 1 }
  ]
}
```
Empty: `{ "currencies": [] }`. Order: currency code ascending. Always `200`.

## 7. Data model changes
None. Reads the existing `subscriptions` table.

## 8. Validation and error cases
| Case | Expected result |
|---|---|
| No active subscriptions | `200`, `currencies: []` |
| Only inactive subscriptions | `200`, `currencies: []` |
| Mixed currencies | one entry per currency, never summed across |
| Yearly amount not divisible by 12 | monthly equivalent rounded to 2 decimals |

## 9. Edge cases
- A currency present only on inactive subscriptions does not appear.
- Rounding: `100000 / 12 = 8333.333…` → `8333.33`; its annual projection is `8333.33 × 12 = 99999.96`
  (a documented, deterministic consequence of round-per-item — see Q2).
- Large numbers stay within `numeric(18,2)`.

## 10. UI states (frontend)
- **Loading:** skeleton/spinner while fetching the summary.
- **Empty:** "No active subscriptions yet" with a link to add one (when `currencies` is empty).
- **Success:** one card per currency showing monthly equivalent, annual projection and active count; a visible caveat ("assumes constant prices; excludes inactive; no currency conversion").
- **Error:** message + retry.
- **Accessibility:** cards are readable, amounts formatted for the currency; dashboard reachable from the header nav.

## 11. Test plan
Domain (`SummaryCalculator`, `Subscription.GetMonthlyEquivalent`):
`MonthlyCycle_ReturnsAmount`, `YearlyCycle_ReturnsAmountDividedBy12`,
`YearlyCycle_RoundsMonthlyEquivalentToTwoDecimals`, `AnnualProjection_IsMonthlyTimesTwelve`,
`Inactive_AreExcluded`, `MixedCurrencies_AreGroupedNotSummed`, `NoActive_ReturnsEmpty`.
Application: `GetSummary_GroupsActiveByCurrency` with a fake repository.
API: `GET /api/summary` returns `200` with the expected shape (handler-level where a host is impractical).
Manual (PR): create monthly + yearly + inactive + a second currency; verify the summary numbers.

## 12. Assumptions and open questions
- **Q1 — Response shape:** a per-currency list (proposed), consistent with "never mix currencies".
- **Q2 — Rounding:** round each subscription's monthly equivalent to 2 then sum, and `annual = monthly × 12`
  (proposed). Alternative: keep full precision and round only the final totals (annual then independent of monthly×12).
- **Q3 — Where the logic lives:** `Subscription.GetMonthlyEquivalent()` + a pure `SummaryCalculator` in
  Domain (proposed), kept clock-free and unit-tested.
- **Q4 — Frontend placement:** a separate `/summary` dashboard route + a header nav link (proposed), or
  summary cards on top of the existing list?
- **Q5 — Fields per currency:** include `activeCount` alongside the two amounts (proposed)?

## 13. Task breakdown
- [ ] backend#8 — Domain: `GetMonthlyEquivalent`, `SummaryCalculator`; unit tests.
- [ ] backend#9 — API: `GetSummaryHandler`, repository `ListActiveAsync`, `GET /api/summary`, `SummaryResponse` DTO.
- [ ] frontend#4 — Dashboard cards, summary service method, states, header nav link.

## 14. Implementation notes (filled after delivery)
Delivered on 2026-10-14. Backend PR `FlowTrim-backend#33` (closes #8/#9); frontend PR
`FlowTrim-frontend#16` (closes #4). No deviations from this spec.

- Domain `SummaryCalculator` is pure and clock-free; `Subscription.GetMonthlyEquivalent()` rounds the
  yearly case to 2 decimals. 48 backend xUnit tests total (8 new).
- Verified live: COP monthly 38900 + COP yearly 120000 + USD monthly 9.99 (plus an inactive COP) →
  `COP {48900.00, 586800.00, 2}`, `USD {9.99, 119.88, 1}`, grouped and ordered, `200`.
- Frontend: `/summary` dashboard with per-currency cards, empty/error states and a visible caveat;
  header nav between list and summary. 6 Vitest tests.
