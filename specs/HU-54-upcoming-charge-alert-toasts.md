# HU-54: Upcoming-Charge Alert Toasts

- **Status:** Implemented _(2026-10-19; approved 2026-10-18 by Ander)_
- **Story / Issue:** FlowTrim-tracker#102 · task: frontend#82
- **Priority:** P1
- **Epic:** EP-10
- **Dependencies:** HU-04 (alert windows), HU-53 (toasts)
- **Author / Date:** Ander (with Claude) · 2026-10-18

## 1. Context and goal
FlowTrim's purpose is to prevent surprise charges, but alerts only live on `/app/upcoming`. When the user
enters the workspace, FlowTrim should proactively warn about charges that need attention — in-app only.

## 2. Scope
**In scope:** on entering `/app`, read `GET /api/subscriptions/upcoming` (existing, server-computed windows) and
show at most one grouped alert toast per session.
**Out of scope:** new backend logic, email/push/OS notifications, snoozing per subscription.

## 3. Functional requirements
- **FR-1:** After sign-in, the first time the workspace loads in a browser session, fetch upcoming charges.
- **FR-2:** Group items by the existing `alertWindow`: `Overdue`, `Today`, `DueWithin3Days`. `DueWithin7Days`
  and `Later` do not trigger a toast.
- **FR-3:** One toast per session: **error** variant if anything is overdue, **warning** if due today or within
  3 days. Title e.g. "2 charges need attention"; body lists up to 3 names with "today" / "in 2 days" /
  "overdue by 1 day", plus "+N more"; action "View upcoming charges" → `/app/upcoming`.
- **FR-4:** Uses the warning/error toast lifetime but stays until dismissed if anything is overdue.
- **FR-5:** Shown once per browser session (flag in `sessionStorage`, keyed by owner-agnostic session); signing
  out clears it.
- **FR-6:** If the request fails, nothing is shown (the upcoming page keeps its own error state) — no error toast.

## 4. Business rules
Day counts and windows come from the server (HU-04, America/Bogota reference date); the client never
recalculates them. Copy says "expected charge", never "you were charged", and never claims an email was sent.

## 5. Acceptance criteria
- **AC-1:** Given a charge due today and one in 2 days, when the workspace opens, then one warning toast lists both.
- **AC-2:** Given an overdue charge, then the toast uses the error variant and stays until dismissed.
- **AC-3:** Given only charges in 7+ days, then no toast appears.
- **AC-4:** Given the toast was shown, when the user navigates or reloads in the same tab session, then it does
  not appear again; after sign-out and sign-in it can appear again.
- **AC-5:** Given the action button, when clicked, then the app navigates to `/app/upcoming`.

## 6. API contract
Consumes existing `GET /api/subscriptions/upcoming`.

## 7. Data model changes
None.

## 8. Validation and error cases
Request failure → silent (logged by the HTTP interceptor), no toast.

## 9. Edge cases
More than 3 items → "+N more"; mixed currencies irrelevant (no amounts summed in the toast); session restored
after token expiry re-auth does not re-show it.

## 10. UI states
Warning and error variants from HU-53, both themes, mobile.

## 11. Test plan
Vitest: grouping and variant selection, max 3 names + "+N more", once-per-session flag, sign-out reset, silent
failure, navigation action. Manual: seed data with overdue/today/3-day charges and verify in the browser.

## 12. Assumptions and open questions
No open questions.

## 13. Task breakdown
- [x] frontend: alert-check service on workspace entry, copy (EN/ES), tests.

## 14. Implementation notes
- Delivered in frontend PR #86: `features/subscriptions/services/UpcomingAlertService`, called from
  `AppShell.ngOnInit`; the shell resets the once-per-session flag on sign-out (so `AuthService` does not depend on
  alerts). Items are ordered by `daysUntilCharge` (overdue first). Copy prefixes the list with "Expected charges:".
- Verification: 75/75 frontend tests (+6), production build, CI green on the PR and `main`; real browser run against
  the real API and PostgreSQL with overdue/today/2-day/40-day charges relative to the server reference date: one sticky
  error toast listing the three charges with the action link, the 40-day charge excluded, not shown again after a
  reload in the same session, zero console errors.
- Observed (out of scope): the overview page shows amounts without currency formatting (HU-03); the shared
  `moneyFormatter` could be reused there.
