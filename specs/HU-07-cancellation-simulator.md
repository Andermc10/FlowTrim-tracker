# HU-07: Cancellation simulator (potential savings)

- **Status:** Implemented _(2026-10-14; all proposals accepted — Q1..Q6 as proposed)_
- **Story / Issue:** FlowTrim-tracker#8 · tasks: backend#15 (simulation service + endpoint, no persist), frontend#8 (simulator UI)
- **Priority:** P0
- **Author / Date:** Ander (with Claude) · 2026-10-14

## 1. Context and goal
The "scissors" simulator: the user selects subscriptions to cancel and compares current spend against
the projected spend and the potential savings over one or more horizons (1, 12, 24 months). It
**never persists** a cancellation and always shows its assumptions. Savings are grouped per currency
(currencies are never mixed) and never presented as guaranteed.

## 2. Scope
**In scope:**
- Domain: a pure `SimulationCalculator` that, given active subscriptions, the selected ids and the
  horizons, returns per-currency current/selected/projected monthly equivalents and savings per horizon.
- `POST /api/simulations` → `200` (nothing persisted) with the simulation result; `400` on invalid horizons.
- Angular `/simulator`: pick subscriptions, choose horizons, see base vs scenario and savings, with the
  assumptions shown beside the result; empty selection → zero savings.
- xUnit tests for the savings math, per-currency grouping, empty selection and inactive handling.

**Out of scope (later stories):**
- Persisting scenarios, applying real cancellations, taxes/penalty modelling (shown only as caveats).
- Centralized error contract → HU-09. Auth → post-MVP.

## 3. Functional requirements
- **FR-1:** `POST /api/simulations` accepts a set of subscription ids to cancel and optional horizons
  (default `[1, 12, 24]`), computes the result, and **persists nothing**.
- **FR-2:** Savings per currency per horizon = `Σ monthlyEquivalent(selected active in that currency) × months`.
- **FR-3:** Per currency it returns `currentMonthly` (all active), `selectedMonthly` (selected active),
  and `projectedMonthly = currentMonthly − selectedMonthly`.
- **FR-4:** Only `Active` subscriptions count; ids that are inactive or unknown contribute nothing.
- **FR-5:** Currencies are never summed together; the result is per currency.
- **FR-6:** An empty selection returns zero savings (and `projectedMonthly == currentMonthly`).
- **FR-7:** The response includes the assumptions (constant prices, no penalties/taxes, not guaranteed).
- **FR-8:** The UI lets the user select subscriptions and horizons, shows base vs scenario and the
  savings, and displays the assumptions next to the result.

## 4. Business rules
Reference CLAUDE.md §5 (Potential savings).
- `monthlyEquivalent` reuses HU-03 (`Monthly → amount`; `Yearly → amount/12` rounded to 2).
- `savings(currency, months) = selectedMonthly(currency) × months`.
- Grouping key is the currency code; each currency independent; no conversion.
- Not guaranteed: the result always carries the assumptions; copy never states a guarantee.
- Pure calculation; no clock, no persistence.

## 5. Acceptance criteria
- **AC-1:** Selecting services recomputes the scenario and **persists nothing** (a later `GET` list is unchanged).
- **AC-2:** Savings use the selected items' monthly equivalent × the chosen horizon.
- **AC-3:** The response lets the user compare base (`currentMonthly`) and scenario (`projectedMonthly`).
- **AC-4:** Assumptions (constant prices, no penalties) are returned and shown with the result.
- **AC-5:** An empty selection returns zero savings for every currency.
- **AC-6:** Selecting subscriptions of different currencies yields separate per-currency entries; nothing is summed across currencies.
- **AC-7:** An inactive or unknown id in the selection contributes nothing.
- **AC-8:** Invalid horizons (≤ 0) → `400`; omitted horizons default to `[1, 12, 24]`.

## 6. API contract
| Method | Route | Request | Success | Errors |
|---|---|---|---|---|
| POST | `/api/simulations` | `SimulationRequest` | `200` `SimulationResponse` (not persisted) | `400` |

`SimulationRequest`:
```json
{ "subscriptionIds": ["4f6c…", "9a1b…"], "horizons": [1, 12, 24] }
```
`SimulationResponse`:
```json
{
  "horizons": [1, 12, 24],
  "currencies": [
    {
      "currency": "COP",
      "currentMonthly": 48900.00,
      "selectedMonthly": 38900.00,
      "projectedMonthly": 10000.00,
      "savings": [
        { "months": 1, "amount": 38900.00 },
        { "months": 12, "amount": 466800.00 },
        { "months": 24, "amount": 933600.00 }
      ]
    }
  ],
  "assumptions": [
    "Assumes constant prices.",
    "Excludes taxes, penalties and price changes.",
    "Not guaranteed."
  ]
}
```
Empty selection → each currency has `selectedMonthly: 0` and zero `savings`. `200` always on valid input.

## 7. Data model changes
None. Nothing is persisted.

## 8. Validation and error cases
| Case | Expected result |
|---|---|
| `horizons` omitted | default `[1, 12, 24]` |
| `horizons` contains a value ≤ 0 | `400` on `horizons` |
| `subscriptionIds` empty/omitted | `200`, zero savings |
| id unknown or inactive | ignored (contributes 0) |
| mixed currencies in selection | separate per-currency entries |

## 9. Edge cases
- No active subscriptions at all → `currencies: []`, `200`.
- Duplicate ids in the selection are counted once.
- A selected currency with 0 selected amount still shows `currentMonthly` for comparison.

## 10. UI states (frontend)
- **Loading:** while fetching the subscriptions to choose from.
- **Empty:** if there are no subscriptions, prompt to add one.
- **Success:** a list of active subscriptions with checkboxes, a horizon selector (1/12/24), and a result
  panel per currency showing current vs projected monthly and savings per horizon.
- **Error:** message + retry on the simulate call.
- **Assumptions:** always visible beside the result; the UI states nothing is cancelled or guaranteed.
- **Accessibility:** checkboxes labelled; results readable; COP formatting.

## 11. Test plan
Domain (`SimulationCalculator`): `Savings_IsSelectedMonthlyTimesHorizon`,
`EmptySelection_ReturnsZeroSavings`, `GroupsByCurrency_NoCrossCurrencySum`,
`InactiveOrUnknownId_Ignored`, `ProjectedMonthly_IsCurrentMinusSelected`, `NoActive_ReturnsEmpty`.
Application: `Simulate_BuildsPerCurrencyResultAndDefaultsHorizons`, `Simulate_InvalidHorizon_Returns400`.
API: `POST /api/simulations` returns `200` and persists nothing (list unchanged).
Manual (PR): select a mix, verify base vs scenario and savings at 1/12/24; empty selection → zero.

## 12. Assumptions and open questions
- **Q1 — Response shape:** per-currency `currentMonthly`/`selectedMonthly`/`projectedMonthly` + `savings[]`
  per horizon *(proposed)*.
- **Q2 — Horizons:** default `[1, 12, 24]`, client may override; each must be `> 0` *(proposed)*.
- **Q3 — Unknown/inactive ids:** ignored (contribute 0) *(proposed)* vs `400`.
- **Q4 — Domain shape:** a pure `SimulationCalculator` in Domain *(proposed)*.
- **Q5 — Frontend:** a new `/simulator` route + header nav link *(proposed)*.
- **Q6 — No cross-currency total:** per-currency only, never an aggregate across currencies *(proposed)*.

## 13. Task breakdown
- [ ] backend#15 — Domain `SimulationCalculator`; `POST /api/simulations` handler + DTOs; no persistence; tests.
- [ ] frontend#8 — `/simulator`: selection + horizons, base vs scenario, savings, assumptions; service method; states.

## 14. Implementation notes (filled after delivery)
Delivered on 2026-10-14. Backend PR `FlowTrim-backend#36` (closes #15); frontend PR
`FlowTrim-frontend#19` (closes #8). No deviations from this spec.

- Domain `SimulationCalculator` is pure; the handler defaults horizons to `[1,12,24]`, validates `> 0`,
  and ignores inactive/unknown ids. 68 backend xUnit tests (7 new). `POST /api/simulations` persists nothing.
- Verified live: empty selection → zero savings and `projected == current`; cancelling one → savings
  `selectedMonthly × months`; invalid horizon → `400`; `totalCount` unchanged (no persistence).
- Frontend `/simulator`: checkbox selection recomputes per-currency base vs scenario and savings with
  assumptions shown. Real browser E2E: 7 services, savings `0 → 37000` on selecting one, 3 assumptions,
  0 console/CORS errors. 8 Vitest tests.
