# EP-09: Analytics and Reports

- **Status:** Approved _(2026-10-18, by Ander)_
- **Story / Issue:** FlowTrim-tracker#96 · stories: HU-50 (#98), HU-51 (#99), HU-52 (#100)
- **Priority:** P1
- **Author / Date:** Ander (with Claude) · 2026-10-18

## 1. Context and goal
FlowTrim shows totals and lists, but nothing visual to compare where the money goes or when it leaves.
This epic adds an analytics view with charts and a printable/exportable report, built on the same
deterministic C# rules as the summary. It is also the most visible part of the portfolio and its aggregated
endpoints become tools for FlowTrim Insights (EP-05).

## 2. Scope
**In scope:** owner-scoped analytics endpoint (HU-50), Angular analytics workspace with Chart.js (HU-51),
CSV export and a print-optimized report saved as PDF by the browser (HU-52).

**Out of scope:** historical spending (FlowTrim stores no charge history — see §4), forecasting/ML, server-side
PDF generation (QuestPDF), scheduled or emailed reports, multi-currency conversion.

## 3. Functional requirements
- FR-1: Analytics are computed server-side, per currency, for the authenticated owner's active subscriptions.
- FR-2: Charts: spending by category, top subscriptions, expected charges per month for the next 12 months.
- FR-3: Every chart has an accessible data-table equivalent and handles loading/empty/error states.
- FR-4: The user can export subscriptions to CSV and print/save a summary report as PDF.

## 4. Business rules
- Honesty: charts show the **current composition and expected future charges** derived from today's data.
  FlowTrim has no transaction history, so there is no "spent last year" chart; expected charges are labelled
  as expected, never as confirmed payments.
- Totals are never summed across currencies; inactive subscriptions are excluded (CLAUDE.md §5).

## 5. Acceptance criteria
- AC-1: Given two owners, when each opens analytics or exports, then only their own data is used.
- AC-2: Given subscriptions in two currencies, when analytics load, then each currency is shown separately.
- AC-3: Given no active subscriptions, when analytics load, then an empty state explains what to add.
- AC-4: Given the report page, when the user prints, then the output is a clean, paginated document.

## 6. Dependencies and decisions
- **Chart.js 4.5.1 (MIT) used directly** through a small standalone FlowTrim chart component. `ng2-charts`
  11 requires Angular 22 and `@angular/cdk`; FlowTrim stays on Angular 21 (Node constraint, CLAUDE.md §12).
- PDF through CSS `@media print` + the browser's "Save as PDF" (approved by Ander, 2026-10-18): no backend
  dependency, no licensing issue.

## 7. Stories
| Story | Title | Priority |
|---|---|---|
| HU-50 | Owner-scoped analytics endpoint | P1 |
| HU-51 | Analytics workspace with Chart.js | P1 |
| HU-52 | CSV export and printable PDF report | P1 |

## 8. Implementation notes
To be completed after delivery.
