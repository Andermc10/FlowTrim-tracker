# HU-51: Analytics Workspace with Chart.js

- **Status:** Implemented _(2026-10-19; approved 2026-10-18 by Ander)_
- **Story / Issue:** FlowTrim-tracker#99 · task: frontend#79
- **Priority:** P1
- **Epic:** EP-09
- **Dependencies:** HU-50
- **Author / Date:** Ander (with Claude) · 2026-10-18

## 1. Context and goal
Turn the HU-50 numbers into charts that answer three questions at a glance: *where does my money go?*
(categories), *what costs the most?* (top subscriptions) and *when will money leave?* (expected charges
for the next 12 months).

## 2. Scope
**In scope:** route `/app/analytics` + navigation entry; reusable `FlowTrimChart` standalone component
wrapping Chart.js; three charts; data tables; currency switcher; light/dark themes; i18n (EN/ES).
**Out of scope:** drill-down, custom date ranges, chart export as image.

## 3. Functional requirements
- **FR-1:** Add `chart.js@4.5.1` (MIT). Register only the needed pieces (doughnut, bar, category/linear
  scales, tooltip, legend) to keep the bundle small. No `ng2-charts` (requires Angular 22).
- **FR-2:** `FlowTrimChart` (`shared/ui/chart`): inputs `type`, `labels`, `datasets`, `ariaLabel`; creates the
  chart on init, updates on input change, destroys on destroy; reads colors from the Carbon Signal CSS
  custom properties so charts follow the active theme and re-render when the theme changes.
- **FR-3:** Charts: **doughnut** — monthly equivalent by category (legend + percentages); **horizontal bar** —
  top 5 subscriptions; **vertical bar** — expected charges per month (12 bars; months with a yearly charge
  stand out; caption "Expected charges, not confirmed payments").
- **FR-4:** A currency switcher appears when the owner has more than one currency; one currency at a time.
- **FR-5:** Each chart has a visually-hidden-by-default "Show data" table with the same numbers (accessibility
  and honesty), COP/USD formatted with `Intl.NumberFormat`.
- **FR-6:** States: loading skeleton, empty (link to add a subscription), error (retry), success.
- **FR-7:** Respect `prefers-reduced-motion` (Chart.js animations off).

## 4. Business rules
No calculations in the browser: the component only renders HU-50 values.

## 5. Acceptance criteria
- **AC-1:** Given analytics data, when `/app/analytics` loads, then the three charts render with the API values.
- **AC-2:** Given two currencies, when the user switches, then all charts and tables update to that currency.
- **AC-3:** Given dark/light theme toggling, then chart colors follow the theme without a reload.
- **AC-4:** Given a screen reader, then each chart has an accessible name and a data table equivalent.
- **AC-5:** Given no subscriptions / an API error, then the empty / error state is shown.
- **AC-6:** Given the production build, then the bundle budget still passes.

## 6. API contract
Consumes `GET /api/analytics?months=12` (HU-50).

## 7. Data model changes
None.

## 8. Validation and error cases
API errors use the existing interceptor and the toast system (HU-53) when available.

## 9. Edge cases
One category only (single-slice doughnut); all charges in one month; very long subscription names (truncated
labels, full name in tooltip and table); mobile width (charts stack, keep aspect ratio).

## 10. UI states
Loading · Empty · Error (retry) · Success · Reduced motion · Dark/Light.

## 11. Test plan
Vitest: `FlowTrimChart` creates/updates/destroys the Chart.js instance (Chart.js mocked); analytics page maps
API data to datasets, switches currency, renders tables, shows empty/error states. Manual browser check in
both themes, desktop and mobile widths, zero console errors.

## 12. Assumptions and open questions
- New frontend dependency: `chart.js` 4.5.1 (approved in principle by Ander on 2026-10-18).

## 13. Task breakdown
- [x] frontend: chart component, analytics page, navigation, i18n, tests.

## 14. Implementation notes
- Delivered in frontend PR #84: `chart.js` 4.5.1, `core/ui/chart/FlowTrimChart`, `features/analytics`
  (`/app/analytics`, lazy-loaded), navigation entry, EN/ES copy.
- Deviations: the chart component lives in `core/ui/chart` (existing location of shared UI: icon, modal, toast)
  instead of `shared/ui/chart`; the analytics route is **lazy-loaded** because Chart.js pushed the initial bundle
  to 649 kB (budget 500 kB) — now 466.7 kB initial + 183.8 kB lazy chunk. "Months with a yearly charge stand out"
  is implemented as *peak months above the median* (the API returns amounts and counts, not plan types).
- `ThemeService` now tolerates environments without `window.matchMedia` (jsdom), needed once a test instantiates it.
- Verification: 61/61 frontend tests (+10), production build within budget, CI green on the PR and `main`; real
  browser run against the real API and PostgreSQL with seeded data: values match a hand calculation, peak months
  highlighted, both themes, Spanish, COP/USD switch, zero console errors.
