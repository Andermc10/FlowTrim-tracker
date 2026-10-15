# HU-04: Upcoming charges and countdown with visual alerts

- **Status:** Implemented _(2026-10-14; all proposals accepted — Q1 = America/Bogota (fixed UTC−5, no DST), Q3 = include overdue tagged, Q2/Q4/Q5/Q6 as proposed)_
- **Story / Issue:** FlowTrim-tracker#5 · tasks: backend#10 (days-until calc), backend#11 (upcoming API + alert windows), frontend#5 (countdown panel)
- **Priority:** P0
- **Author / Date:** Ander (with Claude) · 2026-10-14

## 1. Context and goal
The user wants to anticipate renewals: see upcoming charges ordered by date, how many days remain,
and clear visual alerts for what is overdue or imminent. The countdown is computed **server-side**
from a defined reference date and time zone — never from inconsistent browser math. Alerts are
in-app and visual only; FlowTrim never claims to have sent an email or push.

## 2. Scope
**In scope:**
- Domain: `Subscription.GetDaysUntilCharge(referenceDate)` and `GetAlertWindow(referenceDate)` — pure,
  clock-free, take the reference date as a parameter. `AlertWindow` enum.
- `GET /api/subscriptions/upcoming`: active subscriptions ordered by next billing date ascending, each
  tagged with days-until-charge and alert window, plus the server reference date used.
- Angular `/upcoming` panel: countdown + visual alert styling, distinguishing overdue / today / upcoming.
- xUnit tests for the day math, window boundaries and ordering.

**Out of scope (later stories):**
- Usage / cost per use → HU-05/06. Simulator → HU-07.
- Real notifications (email/push) — never in the MVP; alerts are visual only.
- Live Angular ↔ API browser E2E (CORS) → HU-08.

## 3. Functional requirements
- **FR-1:** Days until charge = `NextBillingDate − referenceDate` (whole days); past dates are negative.
- **FR-2:** The reference "today" is computed on the server from an injectable `TimeProvider` in a
  defined time zone (see Q1) — not from the client.
- **FR-3:** `GET /api/subscriptions/upcoming` returns **active** subscriptions ordered by next billing
  date ascending, each with `daysUntilCharge` and `alertWindow`, plus the top-level `referenceDate`.
- **FR-4:** A past date is reported as `Overdue` (never as a future charge).
- **FR-5:** Alert windows: `Overdue`, `Today`, `DueWithin3Days`, `DueWithin7Days`, `Later`.
- **FR-6:** The panel renders the list with the countdown and visual alert styling; it uses the
  server-provided `daysUntilCharge` and `referenceDate`.

## 4. Business rules
Reference CLAUDE.md §5.
- `daysUntilCharge = nextBillingDate.DayNumber − referenceDate.DayNumber`.
- Alert window from `daysUntilCharge d`:
  - `d < 0` → `Overdue`
  - `d == 0` → `Today`
  - `1 ≤ d ≤ 3` → `DueWithin3Days`
  - `4 ≤ d ≤ 7` → `DueWithin7Days`
  - `d > 7` → `Later`
- Only `Active` subscriptions are considered (inactive are not charged).
- An expected renewal is **not** a confirmed transaction (wording in the UI reflects this).
- Logic is pure: the reference date is passed in; the domain never reads a clock.

## 5. Acceptance criteria
- **AC-1:** Upcoming charges are ordered by next billing date ascending.
- **AC-2:** The countdown uses the server `referenceDate`; the response carries it so the client does not recompute "today".
- **AC-3:** A subscription due yesterday is `Overdue` with a negative `daysUntilCharge`; one due today is `Today` (0).
- **AC-4:** Boundaries: `d = 3` → `DueWithin3Days`; `d = 4` → `DueWithin7Days`; `d = 7` → `DueWithin7Days`; `d = 8` → `Later`.
- **AC-5:** Inactive subscriptions are not listed.
- **AC-6:** The UI visually distinguishes overdue, today and upcoming, and never labels a past date as a future charge.
- **AC-7:** With no active subscriptions, the endpoint returns an empty list and the panel shows an empty state.

## 6. API contract
| Method | Route | Request | Success | Errors |
|---|---|---|---|---|
| GET | `/api/subscriptions/upcoming` | — | `200` `UpcomingChargesResponse` | — |

`UpcomingChargesResponse`:
```json
{
  "referenceDate": "2026-10-14",
  "items": [
    {
      "id": "…", "name": "Netflix", "amount": 38900.00, "currency": "COP",
      "billingCycle": "Monthly", "nextBillingDate": "2026-11-01",
      "daysUntilCharge": 18, "alertWindow": "Later"
    }
  ]
}
```
Empty: `{ "referenceDate": "2026-10-14", "items": [] }`. Always `200`. `alertWindow` serialized as its name.

## 7. Data model changes
None. Reads the existing `subscriptions` table.

## 8. Validation and error cases
| Case | Expected result |
|---|---|
| No active subscriptions | `200`, `items: []` |
| Only inactive | `200`, `items: []` |
| Past `nextBillingDate` | item present, `daysUntilCharge < 0`, `alertWindow = Overdue` |
| Mixed currencies | listed together (ordering is by date; no amounts are summed here) |

## 9. Edge cases
- Two subscriptions on the same date: both listed; secondary order by name (stable, see Q6).
- Day counting ignores time-of-day (dates are `DateOnly`); the reference date is a calendar date in the chosen zone.
- A charge exactly 7 days away is `DueWithin7Days`; 8 days is `Later`.

## 10. UI states (frontend)
- **Loading:** spinner while fetching.
- **Empty:** "No upcoming charges" with a link to add a subscription.
- **Success:** rows/cards ordered by date, each showing the countdown ("in N days", "today", "N days overdue")
  and a colored badge per alert window; a note that an expected renewal is not a confirmed charge.
- **Error:** message + retry.
- **Accessibility:** alert state conveyed by text + color (not color alone); reachable from the header nav.

## 11. Test plan
Domain: `GetDaysUntilCharge_ComputesWholeDays` (future, today, past),
`GetAlertWindow_Boundaries` (−1, 0, 1, 3, 4, 7, 8), ordering.
Application: `GetUpcoming_OrdersByDateAndTagsWindows`, `GetUpcoming_ExcludesInactive`,
`GetUpcoming_UsesReferenceDateFromClock` (fixed `TimeProvider`), empty case.
API: `GET /api/subscriptions/upcoming` returns `200` with the shape (handler-level where a host is impractical).
Manual (PR): seed past/today/≤3/≤7/later + an inactive; verify order, counts and windows.

## 12. Assumptions and open questions
- **Q1 — Reference time zone:** compute "today" as the current date in **America/Bogota** (UTC−5, the
  product's locale, COP default) from the injectable `TimeProvider` *(proposed)*. Alternative: UTC date
  (simpler, but can be off by up to 5 hours near midnight for the target user).
- **Q2 — Window boundaries:** as in §4 (`Overdue <0`, `Today 0`, `≤3`, `≤7`, `Later >7`) *(proposed)*.
- **Q3 — Overdue items:** include them in the list, tagged `Overdue` *(proposed)*, so the user sees what
  they missed? Or exclude past dates entirely?
- **Q4 — Domain shape:** methods on `Subscription` taking the reference date (pure) *(proposed)*, vs a
  separate domain service.
- **Q5 — Frontend placement:** a separate `/upcoming` route + header nav link *(proposed)*, consistent with the summary.
- **Q6 — Secondary order:** tie-break same-date charges by `name` ascending *(proposed)*.

## 13. Task breakdown
- [ ] backend#10 — Domain: `AlertWindow`, `GetDaysUntilCharge`, `GetAlertWindow`; unit tests.
- [ ] backend#11 — API: `GetUpcomingChargesHandler` (reference date from clock/zone), `GET /api/subscriptions/upcoming`, DTOs.
- [ ] frontend#5 — `/upcoming` panel: countdown, alert badges, states; service method; header nav link.

## 14. Implementation notes (filled after delivery)
Delivered on 2026-10-14. Backend PR `FlowTrim-backend#34` (closes #10/#11); frontend PR
`FlowTrim-frontend#17` (closes #5). No deviations from this spec.

- Reference date is computed with a **fixed UTC−5 offset** (`GetUtcNow().ToOffset(-5)`), since
  America/Bogota has no DST — exact and free of any time-zone-database dependency.
- Domain methods are pure (reference date passed in). 61 backend xUnit tests (13 new).
- Verified live (today 2026-10-14): seeded −2/0/+3/+7/+18/+37/+110 day charges → ordered ascending with
  `referenceDate 2026-10-14` and windows `Overdue/Today/DueWithin3Days/DueWithin7Days/Later`, `200`.
- Frontend `/upcoming`: server-driven countdown and colored badges; 7 Vitest tests.
