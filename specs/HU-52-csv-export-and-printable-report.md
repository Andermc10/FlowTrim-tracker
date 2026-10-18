# HU-52: CSV Export and Printable PDF Report

- **Status:** Approved _(2026-10-18, by Ander)_
- **Story / Issue:** FlowTrim-tracker#100 · tasks: backend#71 (CSV), frontend#80 (report page)
- **Priority:** P1
- **Epic:** EP-09
- **Dependencies:** HU-50, HU-51
- **Author / Date:** Ander (with Claude) · 2026-10-18

## 1. Context and goal
Let the user take their data out of FlowTrim: a CSV of their subscriptions for spreadsheets, and a clean
one-document report (summary + charts + tables + assumptions) saved as PDF from the browser.

## 2. Scope
**In scope:** `GET /api/reports/subscriptions.csv`; route `/app/report` with a print stylesheet; buttons
"Export CSV" and "Print / Save as PDF".
**Out of scope:** server-side PDF, scheduled/emailed reports, Excel format, importing the CSV back (EP-07).

## 3. Functional requirements
- **FR-1:** CSV endpoint returns all the owner's subscriptions (active and inactive), `text/csv; charset=utf-8`
  with BOM (opens correctly in Excel), `Content-Disposition: attachment; filename="flowtrim-subscriptions-YYYY-MM-DD.csv"`.
- **FR-2:** Columns: `name, category, amount, currency, billing_cycle, monthly_equivalent, next_billing_date,
  status`; dates ISO `YYYY-MM-DD`; decimals with `.`; RFC 4180 quoting.
- **FR-3:** **CSV injection protection:** a text cell starting with `=`, `+`, `-`, `@`, tab or carriage return is
  prefixed with `'`.
- **FR-4:** `/app/report` shows: generation date, per-currency summary (monthly, annual projection), the three
  HU-51 charts, the subscription table, upcoming charges, and the assumptions/disclaimer.
- **FR-5:** `@media print`: hides navigation, buttons and theme chrome; forces a light palette; A4 margins;
  avoids breaking tables/charts across pages; repeats table headers; prints the FlowTrim name and date.
- **FR-6:** "Print / Save as PDF" calls `window.print()`; the user picks "Save as PDF" in the browser dialog.

## 4. Business rules
The report states that amounts are expected charges based on user-entered data, not bank transactions, and
that projections assume constant prices (CLAUDE.md §1 Honesty).

## 5. Acceptance criteria
- **AC-1:** Given owners A and B, when A exports, then the CSV contains only A's subscriptions; anonymous → `401`.
- **AC-2:** Given a subscription named `=HYPERLINK("x")`, when exported, then the cell starts with `'`.
- **AC-3:** Given names with commas, quotes or accents, when opened in a spreadsheet, then columns and accents
  are correct.
- **AC-4:** Given `/app/report`, when printed to PDF, then navigation and buttons are hidden, colors are light,
  and charts/tables are not cut in half.
- **AC-5:** Given no subscriptions, then the CSV has only the header and the report shows the empty state.

## 6. API contract
| Method | Route | Success | Errors |
|---|---|---|---|
| GET | `/api/reports/subscriptions.csv` | `200` `text/csv` attachment | `401` |

## 7. Data model changes
None.

## 8. Validation and error cases
Export failure → error toast (HU-53) with reference; the page remains usable.

## 9. Edge cases
Large lists (no paging in the export); inactive subscriptions included and labelled; mixed currencies.

## 10. UI states
Report page: loading · empty · error · ready. Print preview verified in Chromium.

## 11. Test plan
Backend: `CsvExport_TwoOwners_OnlyCurrentOwnerRows`, `CsvExport_EscapesFormulaInjection`,
`CsvExport_QuotesCommasAndQuotes`, `CsvExport_WithoutToken_ReturnsUnauthorized`,
`CsvExport_Headers_AreAttachmentUtf8`. Frontend: report page renders sections and calls `window.print()`;
download triggers a blob save. Manual: print to PDF in Chromium, check pagination and both themes.

## 12. Assumptions and open questions
No new dependencies. No open questions.

## 13. Task breakdown
- [ ] backend: CSV endpoint + tests.
- [ ] frontend: report page, print stylesheet, export button, tests.

## 14. Implementation notes
To be completed after delivery.
