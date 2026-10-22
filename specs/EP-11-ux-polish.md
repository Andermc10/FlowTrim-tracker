# EP-11: UX Polish and Everyday Reliability

- **Status:** Draft _(pending approval)_
- **Story / Issue:** to be created on approval · stories HU-55 to HU-63
- **Priority:** P1 (comes before the FlowTrim 3.0 modules)
- **Dependencies:** HU-01/02 (forms), HU-05 (usage), HU-12 (sign-in), HU-43–46 (CSV), HU-51/52 (analytics, report),
  HU-53/54 (toasts), Angular 22 + ESLint (frontend PR #93)
- **Author / Date:** Ander (with Claude) · 2026-10-22

## 1. Context and goal
After using the app, Ander reported friction that makes it feel unfinished:

1. Forms have no example placeholders.
2. Errors appear only after pressing Save.
3. Dates are not validated (a "next charge" in the past is accepted).
4. The CSV template looks broken when opened in Excel.
5. Toast alerts have no sound.
6. The printable report ignores the light/dark theme.
7. The AI module is called "Insights" in both languages.
8. Analytics and Report are two modules that feel like one.
9. Sign-out is sometimes slow or seems not to work.
10. There is no way back to the top of long pages.

Goal: fix all of these with the smallest consistent changes, reusing the existing building blocks (forms, toasts,
i18n, CSV reader, chart component), so the app feels finished before the FlowTrim 3.0 modules start.

## 2. Decisions (taken 2026-10-22 — Ander asked Claude to pick the recommended option)

| # | Topic | Decision | Why |
|---|---|---|---|
| D1 | Next billing date | Must be **today or later** (America/Bogota) on create, on import, and on edit **when the date changes**. An unchanged past date on edit is accepted, so an overdue subscription can still be renamed. | Stops typos without hiding real overdue charges; "Mark as paid" (HU-57) is the normal way to move the date forward. |
| D2 | Usage date | Must be **today or earlier**. | Declared usage cannot happen in the future. |
| D3 | CSV in spreadsheets | Stay on CSV, no dependency. Write a `sep=,` first line in the export and the template; the importer skips it and also reads `;`-separated files with decimal commas and `dd/MM/yyyy` dates (what Excel saves with Colombian regional settings). | Excel with a Spanish locale splits columns on `;`, so a comma CSV showed everything in one column. CSV stays universal and dependency-free; `.xlsx` would add a library to both repos for a template. |
| D4 | Alert sound | Opt-in switch in the workspace rail, **off by default**, persisted per browser; a short synthesized chime (Web Audio API, no audio files) only for upcoming-charge alerts. | Sound without consent is intrusive; browsers also block audio before a user gesture. |
| D5 | Analytics + Report | One module, **"Analytics & reports"**, with two tabs: **Charts** and **Report**. The report follows the theme on screen and switches to light only when printing. | Same data, two presentations; one navigation entry. |
| D6 | AI module name | **"AI Assistant" / "Asistente IA"** (route stays `/app/insights`). | Clear in both languages; "Insights" was not translated. |
| D7 | Sign-out | Clear the session and leave the workspace **immediately**; the provider's end-session URL is read once at sign-in and kept for the session; never wait on the network before leaving. | The current code fetches the provider discovery on every sign-out before redirecting. |

## 3. Scope
**In scope:** stories HU-55 to HU-63 below (frontend, backend and docs).
**Out of scope:** external notifications (FlowTrim 3.0 phase 4), new modules (phases 1–3, 5), the landing redesign
(its own epic after phase 1), `.xlsx` files, recording payments as transactions (phase 2; HU-57 only moves the date).

## 4. Stories

| Story | Title | Repos |
|---|---|---|
| HU-55 | Form guidance: placeholders and real-time validation | frontend |
| HU-56 | Date rules for charges and usage | backend, frontend |
| HU-57 | Mark a charge as paid | backend, frontend |
| HU-58 | Spreadsheet-friendly CSV (template, export, import) | backend, frontend, tracker docs |
| HU-59 | Analytics & reports module with tabs and themed report | frontend |
| HU-60 | AI Assistant naming in both languages | frontend |
| HU-61 | Fast and reliable sign-out | frontend, docs |
| HU-62 | Optional alert sound | frontend |
| HU-63 | Back-to-top button | frontend |

### HU-55 — Form guidance: placeholders and real-time validation
**Goal:** the user knows what to type and sees each problem as soon as it exists.

- **FR-1 Placeholders** (translated, examples only, never real data):
  - Subscription form: name "e.g. Netflix", category "e.g. Streaming", amount "e.g. 38900", currency "COP".
  - Usage form: count "e.g. 3", notes "e.g. Watched two films".
- **FR-2 Live validation:**
  - A field shows its error once it is **dirty or touched**, updates while typing and clears when it becomes valid.
  - Save still marks every field as touched.
- **FR-3 Rules mirror the backend:**
  - name required, ≤ 120;
  - category ≤ 60;
  - amount required, > 0, at most 2 decimals;
  - currency exactly 3 letters (upper-cased on input);
  - billing cycle required;
  - next billing date required and HU-56 D1;
  - usage date required and HU-56 D2;
  - count required, integer ≥ 0;
  - notes ≤ 500.
- **FR-4 One shared piece:**
  - `core/forms` with the custom validators (`maxDecimals`, `currencyCode`, `notBefore(today)`, `notAfter(today)`);
  - a `FieldErrors` component that renders the translated message for the first failing rule of a control and links
    it with `aria-describedby` / `aria-invalid`.
  - Server `400` field errors keep showing under the same field.
- **FR-5:** the name and notes fields show a character counter near the limit.
- **AC-1:** Given the create modal, when I type "-5" in amount and leave the field, then "Amount must be greater than
  zero" appears without pressing Save.
- **AC-2:** Given an invalid field, when I correct it, then the message disappears while typing.
- **AC-3:** Errors are announced to screen readers and the field is marked `aria-invalid="true"`.

### HU-56 — Date rules for charges and usage
- **FR-1 (D1):** the backend rejects a next billing date earlier than today (product calendar, America/Bogota):
  - on create;
  - on update when the value differs from the stored one;
  - on import (row error `date_in_past`).
  - Field error message: "Next billing date cannot be in the past."
- **FR-2 (D2):** the backend rejects a usage date later than today: "Usage date cannot be in the future."
- **FR-3:** the frontend applies the same rules live:
  - `min` / `max` on the date inputs and the HU-55 validators;
  - the reference "today" is computed in America/Bogota, like the API.
- **FR-4:** existing overdue subscriptions stay as they are (still shown as overdue) until edited or marked as paid.
- **AC-1:** Creating with yesterday's date → `400` with the `nextBillingDate` error; with today → `201`.
- **AC-2:** Editing an overdue subscription's name without touching the date → `200`; changing the date to another
  past day → `400`.
- **AC-3:** Importing a row dated yesterday → the row is `invalid` with `date_in_past`.
- **AC-4:** Registering usage for tomorrow → `400`.
- **Tests:** domain/handler unit tests for each rule with a fixed clock (including the 19:00–24:00 Bogota window where
  the UTC day has already changed), import tests, API tests, frontend validator tests.

### HU-57 — Mark a charge as paid
**Goal:** move the next billing date forward in one click instead of editing it by hand.
- **FR-1:** `POST /api/subscriptions/{id}/mark-paid` (owner-scoped, `200` with the updated subscription, `404` like any
  other foreign or missing id).
  - It advances `NextBillingDate` by exactly **one cycle** from the current date: monthly +1 month, yearly +1 year.
  - Month-end is clamped by `DateOnly.AddMonths`: Jan 31 → Feb 28, and the following months keep the 28th; this is
    documented.
  - Inactive subscriptions answer `400`.
- **FR-2:** domain method `Subscription.AdvanceBillingDate(TimeProvider)` updates `UpdatedAt`.
  - It creates **no transaction or payment record**: FlowTrim still does not confirm payments; phase 2 will add that.
- **FR-3 UI:**
  - a "Mark as paid" action in the subscription list (icon button with label) and on overdue/today/≤3-day items in
    Upcoming;
  - a success toast names the new date;
  - an overdue item that is still overdue after one click stays visible with its new date.
- **AC-1:** A monthly subscription due 2026-10-20 marked as paid now shows 2026-11-20.
- **AC-2:** Another owner's id → `404`, nothing changes.
- **Tests:** domain (monthly, yearly, Jan 31, Feb 29 → Feb 28 next year), handler, API, list/upcoming UI tests.

### HU-58 — Spreadsheet-friendly CSV (D3)
- **FR-1 Export and template:**
  - both start with the line `sep=,`, so Excel splits columns in any regional setting;
  - the template contains the header plus four example rows: monthly, yearly, inactive, and one without category.
- **FR-2 Import:**
  - a first line `sep=<c>` (`,` or `;`) sets the delimiter and is skipped;
  - without it, the delimiter is detected from the header (`;` when the header has `;` and no `,`).
- **FR-3:** in `;` files the importer also accepts a decimal comma (`16,99`) and `dd/MM/yyyy` dates, which is what
  Excel writes with Colombian settings. In `,` files the current rules stay (dot decimals, `yyyy-MM-dd`).
- **FR-4:** an exported file still re-imports (round-trip test), and the docs (`SUBSCRIPTION-CSV-FORMAT.md`, the import
  page's format help) describe both styles.
- **AC-1:** The template opened in Excel with Spanish (Colombia) settings shows one value per column.
- **AC-2:** A file saved by that Excel (`;`, `38900`, `16,99`, `05/11/2026`) previews as valid.
- **AC-3:** An exported file previews as valid.

### HU-59 — Analytics & reports module (D5)
- **FR-1 One navigation entry:** "Analytics & reports" / "Analítica y reportes".
  - Tabs **Charts** (`/app/analytics`) and **Report** (`/app/analytics/report`), as an accessible tablist with router
    links.
  - `/app/report` redirects to the Report tab.
- **FR-2 Theme:**
  - the report sheet uses the active theme on screen;
  - `@media print` forces the light sheet (current print styles);
  - charts redraw on theme change, as today.
- **FR-3:** the CSV export and print buttons stay in the Report tab; the Charts tab keeps the currency switcher.
- **AC-1:** Switching tabs keeps the chosen currency.
- **AC-2:** In dark mode the report on screen is dark, and print preview is light.
- **AC-3:** The old `/app/report` link still works.

### HU-60 — AI Assistant naming (D6)
- **FR-1:** the nav item, page kicker, title and document title read "AI Assistant" / "Asistente IA".
  - Every other Insights text is checked to exist in both languages (the key-parity test already guards keys).
- **AC-1:** With Spanish selected, no visible "Insights" remains in the module.

### HU-61 — Fast and reliable sign-out (D7)
- **FR-1:** at sign-in completion, keep `end_session_endpoint` (when published) in `sessionStorage` with the token.
- **FR-2:** sign-out:
  - disables the button and shows a busy state;
  - clears the session and the alert flag synchronously;
  - redirects to the provider logout URL if known, otherwise navigates to `/` — no network request first;
  - if the provider redirect fails, the local session is already gone.
- **FR-3:** the frontend README lists the Auth0 settings that make provider logout work (Allowed Logout URLs) and
  explains the consent screen on `localhost` (Auth0 always asks there; with "Allow Skipping User Consent" on a real
  domain it asks only once).
- **AC-1:** Sign-out leaves the workspace without waiting for any request (unit test with a pending HTTP mock).
- **AC-2:** After sign-out, Back does not show private data (guard redirects to login).

### HU-62 — Optional alert sound (D4)
- **FR-1:** a switch "Alert sound" in the workspace rail.
  - Off by default, saved in `localStorage` (`flowtrim-sound`).
  - Turning it on plays a preview chime (this click also unlocks audio in the browser).
- **FR-2:** when enabled, the HU-54 alert toast plays a short chime:
  - two soft tones for "due soon", a lower one for "overdue";
  - ≤ 400 ms, low volume.
  - If the browser blocks audio, nothing fails and the toast still shows.
- **FR-3:** a small `core/ui/sound` service on the Web Audio API with no audio files and no dependency, replaceable
  in tests.
- **AC-1:** With the switch off, no audio context is ever created.
- **AC-2:** With it on, entering the workspace with an overdue charge plays the overdue chime once.

### HU-63 — Back-to-top button
- **FR-1:** a shared `core/ui/back-to-top` button.
  - It appears after scrolling 600 px on the landing and in the workspace, at the bottom-right above the mobile nav.
  - It scrolls to the top smoothly (instantly with reduced motion) and moves focus to the page's main heading.
- **FR-2:** it is accessible: labelled "Back to top" / "Volver arriba", reachable by keyboard and hidden from screen
  readers while invisible.
- **AC-1:** On a long subscriptions list, the button appears after scrolling and returns to the top.

## 5. Business rules
- Dates use the product calendar (America/Bogota) on both sides. The backend is always the authority; frontend
  validation only gives earlier feedback.
- "Mark as paid" never records money and never claims a bank transaction happened.
- No feature in this epic sends anything outside the app.

## 6. Data model changes
None. `mark-paid` changes existing columns only.

## 7. Test plan (summary)
- **Backend (xUnit):** date rules (create/update/import/usage, Bogota day boundary), `AdvanceBillingDate` cases,
  `mark-paid` handler and API (owner isolation, inactive), CSV delimiter/decimal/date variants and round-trip.
- **Frontend (Vitest):** validators and `FieldErrors`, forms show errors live, placeholders translated, mark-paid
  actions, tabs and redirect, assistant labels, sign-out without waiting, sound service (off by default, plays once),
  back-to-top visibility and focus.
- **Browser (`npm run e2e`):** extend the critical flow with a live validation error, "Mark as paid" and the Report
  tab; visual check in both themes and at 360 px.

## 8. Open questions
None — decisions D1–D7 above.

## 9. Delivery order
HU-60 and HU-63 (small) → HU-55 + HU-56 (forms and dates together) → HU-57 → HU-58 → HU-59 → HU-61 → HU-62.
