# EP-14: Recurring Payments (FlowTrim 3.0 — Phase 2)

- **Status:** Approved _(2026-10-24)_
- **Story / Issue:** epic #167 · HU-72 #168 · HU-73 #169 · HU-74 #170 · HU-75 #171
- **Priority:** P1 (roadmap step 3 of FlowTrim 3.0)
- **Dependencies:** EP-12 (accounts, categories, transactions, Today), HU-57 (mark as paid), HU-04/HU-54 (upcoming
  charges and alerts), HU-50/HU-52 (analytics, CSV), HU-34 (Insights tools), `docs/FLOWTRIM-3-ROADMAP.md`
- **Author / Date:** Ander (with Claude) · 2026-10-23

## 1. Context and goal
Subscriptions are only one kind of recurring payment. People also pay rent, utilities, insurance and instalments
("cuotas") every month, and today FlowTrim cannot model them well: only monthly and yearly cycles exist, "Mark as paid"
only moves the date (HU-57) and the money never reaches the user's accounts, and there is no view of the month's
payments by day.

Goal: generalize subscriptions into **recurring payments**, let "Mark as paid" **record the real expense** in an
account, support **instalment plans**, add a **financial calendar**, and keep an optional **payment link** to the
provider's own page — while keeping every existing number (monthly burn, simulator, analytics, Today) consistent.

## 2. Decisions (approved by Ander on 2026-10-24)

| # | Topic | Decision | Why |
|---|---|---|---|
| D1 | Naming | The UI calls them **Recurring payments / Pagos recurrentes**. The code, API routes (`/api/subscriptions`) and the `subscriptions` table **keep their names**; a renaming is not worth the churn now (documented in the README). | No breaking change for the API, CSV, e2e or Insights tools. |
| D2 | Kinds | `Kind`: `Subscription` (default for existing rows), `Bill` (rent, utilities, insurance, phone…) and `Instalment` (a plan with a fixed number of payments). | Covers the roadmap cases without a type explosion. |
| D3 | Cycles | Add **`Weekly`, `Biweekly` (every 14 days), `Quarterly`** to `Monthly` and `Yearly`. Monthly equivalent: weekly × 52 ÷ 12, biweekly × 26 ÷ 12, quarterly ÷ 3, yearly ÷ 12 (2 decimals, `AwayFromZero`). | Common Colombian bills; one formula per cycle, tested. |
| D4 | Occurrences | One pure domain helper **`RecurrenceSchedule`** projects the expected occurrences of a payment between two dates (from its next date, stepping by its cycle; month steps keep the end-of-month rule of HU-57). Today's committed charges, analytics' expected charges per month and the calendar all use it. | A weekly payment can fall 4–5 times in a month; every screen must count it the same way. |
| D5 | Mark as paid | `POST /api/subscriptions/{id}/mark-paid` takes an optional body `{ accountId, amount, date, categoryId }`. With `accountId` it **records an `Expense` transaction** (amount editable — bills vary —, date ≤ today, category from the body or the payment's default) linked to the payment, then advances the next date. Without a body it keeps HU-57's behaviour (only advances; "paid outside FlowTrim"). The UI asks in a small dialog. | The money finally moves in the accounts; the old path stays for payments the user does not track in an account. |
| D6 | Link transaction ↔ payment | New nullable `transactions.recurring_payment_id` (composite FK with `owner_id`; deleting the payment keeps the transaction and clears the link). The payment screen lists its last payments. | History survives deletes; honest audit of what was really paid. |
| D7 | Defaults on the payment | Optional `defaultAccountId` and `categoryId` (an **expense** category of the owner) to prefill the dialog. Deleting that account/category only clears the default (`ON DELETE SET NULL` on the reference column; PostgreSQL ≥ 15). The free-text `category` of subscriptions stays for analytics until a later migration. | Fast one-tap payment; no orphan rows. |
| D8 | Instalments | `Instalment` requires `totalInstalments` (1–600); `paidInstalments` counts each mark-as-paid (with or without a transaction). When it reaches the total the payment becomes **Inactive** ("completed") and leaves every expected-charge figure. | "3 of 12 paid" is the information people want for cuotas. |
| D9 | Payment link | Optional `paymentUrl`: absolute **`https://`** URL, ≤ 500 chars, no credentials in it. The UI shows "Pay at provider ↗" (`target="_blank" rel="noopener noreferrer"`). FlowTrim never pays on the user's behalf and never asks for card data. | Roadmap decision: links only, no payment intermediation. |
| D10 | Calendar | `GET /api/calendar?month=yyyy-MM` returns, per day of the month, the **expected** occurrences (projected, D4) and the **recorded** transactions' totals per currency; `/app/calendar` shows a month grid (desktop) and a day list (mobile). Past days show what was recorded, never invented payments. | One view of "what is due when" plus "what I actually spent". |

## 3. Scope
**In scope:** stories HU-72 to HU-75 (backend, frontend, docs), migration `AddRecurringPaymentFields`, keeping summary,
simulator, analytics, Today, upcoming alerts, CSV and Insights consistent with the new cycles and kinds.

**Out of scope:** recurring **income** (salary) — a later phase; automatic payments or bank debits; reminders by e-mail
or push (phase 4); variable-amount forecasting (the expected amount is the user's estimate); partial payments; budgets
(phase 3); renaming the `subscriptions` table/API (D1).

## 4. Stories

| Story | Title | Repos |
|---|---|---|
| HU-72 | Recurring payment kinds, cycles, defaults and payment link | backend, frontend |
| HU-73 | Mark as paid records a transaction | backend, frontend |
| HU-74 | Instalment plans | backend, frontend |
| HU-75 | Financial calendar | backend, frontend, docs |

### HU-72 — Kinds, cycles, defaults and payment link
- **FR-1 Model:** `Subscription` gains `Kind`, the new `BillingCycle` values, `PaymentUrl`, `DefaultAccountId`,
  `CategoryId` (D2, D3, D7, D9). Existing rows become `Kind = Subscription`.
- **FR-2 Rules:** `RecurrenceSchedule` (D4) and the new monthly equivalents (D3) are pure domain code; summary,
  simulator, analytics (expected charges per month), Today (`committedUntilMonthEnd`), upcoming alerts and the
  Insights tools use them. `AdvanceBillingDate` steps one cycle for every cycle.
- **FR-3 API:** create/update accept and return the new fields (plus the computed `monthlyEquivalent`);
  `GET /api/subscriptions?kind=` filters (unknown kind → 400 on `kind`). Default account/category must belong to the
  owner, be active (an archived default is kept only when it does not change on update), and the category must be of
  kind `Expense` (400 on the field). On update a missing `kind` keeps the current kind; a missing link or default
  clears it (full replacement). The `Instalment` kind is added by HU-74 together with its counts.
- **FR-4 CSV (HU-43/HU-52):** import accepts the new cycle values; export writes them. New optional columns `kind` and
  `payment_url`; defaults and instalment counts are not part of the CSV (documented).
- **FR-5 UI:** navigation and screens say "Recurring payments"; the list shows a kind badge and a kind filter; the form
  adds kind, the new cycles, payment link, default account and category (chips like quick add); rows with a link show
  "Pay at provider ↗".
- **AC-1:** A weekly payment of 10,000 COP has a monthly equivalent of 43,333.33 and, with its next date on the 6th of a
  31-day month and today the 1st, counts 4 occurrences (6, 13, 20, 27) → 40,000 committed until month end on Today.
- **AC-2:** `paymentUrl` `javascript:alert(1)`, `http://…` or `https://user:pass@…` → 400 on `paymentUrl`.
- **AC-3:** Existing subscriptions keep every figure they had (summary, simulator, analytics) after the migration.

### HU-73 — Mark as paid records a transaction
- **FR-1 API (D5):** body optional; with `accountId`: `amount` (default the payment amount; > 0, ≤ 2 decimals), `date`
  (default today; ≤ today, product calendar), `categoryId` (default the payment's; must be an active expense category;
  required if the payment has none). Account active and in the **same currency** as the payment, else 400 on the field.
  Creates the transaction (`description` = payment name) and advances the date **in one database transaction**.
  Response: `{ subscription, transaction }` (transaction null without a body).
- **FR-2:** inactive payments cannot be marked as paid (unchanged); marking twice moves two cycles (unchanged).
- **FR-3 UI:** "Mark as paid" opens a dialog: "Record the payment in an account" (on by default when the payment has a
  default account), account, amount, date, category; or "Only move the next date". Toast says what happened. The
  payment detail lists its last 10 linked transactions.
- **AC-1:** Marking Netflix (38,900, default Bank) as paid with the defaults lowers Bank by 38,900, adds a Food/
  Subscriptions expense dated today linked to Netflix, and moves its next date one month.
- **AC-2:** A failure while saving the transaction leaves the next date unchanged (atomic).
- **AC-3:** Deleting the payment keeps its transactions (link cleared).

### HU-74 — Instalment plans
- **FR-1:** `Kind = Instalment` requires `totalInstalments` (1–600); `paidInstalments` starts at 0 (or a value given
  on create for plans already in progress, < total).
- **FR-2:** each mark-as-paid adds 1; reaching the total sets `Status = Inactive` and the response says
  `completed: true`; `RecurrenceSchedule` never projects beyond the remaining instalments.
- **FR-3 UI:** "3 of 12 paid" with a progress bar; completed plans show a "Completed" badge and leave the active list
  (still visible with the status filter).
- **AC-1:** A 3-instalment plan with 2 paid shows 1 remaining occurrence in the calendar and in Today; marking it paid
  completes it and its expected charges drop to 0.

### HU-75 — Financial calendar
- **FR-1 API (D10):** `GET /api/calendar?month=yyyy-MM` → `{ month, today, days: [ { date, expected: [ { subscriptionId,
  name, kind, amount, currency, isOverdue } ], recorded: [ { currency, income, expense } ] } ], totals: [ { currency,
  expected, recordedIncome, recordedExpense } ] }`. Overdue occurrences of unpaid payments appear on their original
  date and are flagged.
- **FR-2 UI** `/app/calendar` (rail: Daily group): month grid with dots/amounts per day, today highlighted, a day panel
  with the day's expected payments (with "Mark as paid" and "Pay at provider") and recorded totals; on mobile a list of
  days. Month navigation like Transactions.
- **FR-3 Docs:** `CLAUDE.md` §4/§5 (recurring payments, cycles, occurrences, mark-paid transaction), READMEs, CSV doc.
- **AC-1:** A month with a weekly and a monthly payment shows 4–5 + 1 expected entries on the right days and totals that
  equal the sum of the day entries.
- **AC-2:** Days before today never show an expected entry for a payment already marked as paid for that occurrence.

## 5. Business rules

| Indicator | Rule | Caveat |
|---|---|---|
| Monthly equivalent | weekly `amount × 52 / 12`, biweekly `× 26 / 12`, monthly `amount`, quarterly `/ 3`, yearly `/ 12`; 2 decimals `AwayFromZero` | Estimate of a regular month |
| Next date after paying | `+7 days`, `+14 days`, `+1 month`, `+3 months`, `+1 year` from the current next date (month steps clamp to the month end like HU-57) | Never from "today": skipped cycles stay overdue |
| Occurrences in [a, b] | `next, next + step, …` while `≤ b`, from `max(next, a)`; for instalments at most `total − paid` | Overdue ones (before today) are included once each |
| Committed until month end | Σ occurrence amounts of **active** payments from today's perspective until the last day of the month, overdue included (replaces EP-12's "one charge per payment") | Expected, not paid |
| Instalments remaining | `total − paid`; at 0 the payment is completed (inactive) | |

- The mark-as-paid transaction is an ordinary `Expense`: it counts in Today, Transactions, balances and totals.
- Nothing is converted; the account used to pay must have the payment's currency.

## 6. API contract (changes)

| Method | Route | Change |
|---|---|---|
| GET | `/api/subscriptions?kind=&page=&pageSize=` | `kind` filter; new fields in each item |
| POST/PUT | `/api/subscriptions[/{id}]` | new fields `kind`, `paymentUrl`, `defaultAccountId`, `categoryId`, `totalInstalments`, `paidInstalments` (create only) |
| POST | `/api/subscriptions/{id}/mark-paid` | optional body (D5); response `{ subscription, transaction, completed }` |
| GET | `/api/subscriptions/{id}/payments` | last 10 linked transactions (HU-73) |
| GET | `/api/calendar?month=` | new (HU-75) |

## 7. Data model changes
One migration per story (reconciled during HU-72, 2026-10-24: each story ships its own schema change):
- **HU-72 `AddRecurringPaymentFields`** _(implemented)_ — `subscriptions`: `kind text not null default 'Subscription'`
  (`ck_subscriptions_kind`: `Subscription`, `Bill`), `ck_subscriptions_billing_cycle` extended to the five cycles,
  `payment_url varchar(500) null`, `default_account_id uuid null`, `category_id uuid null`, indexes
  `ix_subscriptions_owner_id_default_account_id` / `ix_subscriptions_owner_id_category_id`; composite FKs
  `fk_subscriptions_accounts_owner_id_default_account_id` and `fk_subscriptions_categories_owner_id_category_id` with
  `ON DELETE SET NULL (column)` (written as SQL; EF does not model them).
- **HU-73** — `subscriptions` unique `(owner_id, id)`; `transactions.recurring_payment_id uuid null`, composite FK →
  `subscriptions(owner_id, id)` `ON DELETE SET NULL (recurring_payment_id)`, index
  `ix_transactions_owner_id_recurring_payment_id`.
- **HU-74** — `kind` check adds `Instalment`; `total_instalments int null`, `paid_instalments int not null default 0`;
  check `ck_subscriptions_instalments` (instalment ⇔ total not null; `0 ≤ paid ≤ total`).

## 8. Validation and error cases
| Case | Result |
|---|---|
| Unknown kind/cycle; instalment without total or total out of 1–600; paid ≥ total on create | 400 on the field |
| Bad payment URL (not https, credentials, > 500) | 400 `paymentUrl` |
| Default account/category foreign, archived, or category not `Expense` | 400 on the field |
| Mark-paid account in another currency / archived / foreign; date in the future; amount invalid; no category available | 400 on the field |
| Mark-paid on an inactive or completed payment | 400 `status` (unchanged rule) |

## 9. Edge cases
- Monthly payments on the 29th–31st (end-of-month clamp), leap years, biweekly crossing month and year boundaries.
- Changing the cycle of a payment with linked transactions (allowed; history is untouched).
- A weekly payment overdue for several weeks: each missed occurrence is listed once (calendar) and counted (Today).
- Payment currency without any account in that currency: the dialog explains and offers "Only move the next date".

## 10. UI states
Every new/changed screen keeps loading, empty, success and error states; the mark-paid dialog shows field errors;
calendar days without entries are quiet; amounts carry sign and text; works at 360 px and in both themes.

## 11. Test plan
- **Domain:** `RecurrenceSchedule` (all cycles, end-of-month, leap years, instalment limit, overdue), monthly
  equivalents, `AdvanceBillingDate` for each cycle, instalment completion, payment URL validation.
- **Application/API:** mark-paid with/without body (atomicity, currency mismatch, defaults), kind filter, calendar
  totals, Today committed with weekly payments, analytics/simulator/summary unchanged for monthly/yearly data, CSV new
  cycles, owner isolation for every new route.
- **Integration (PostgreSQL):** migration checks and `ON DELETE SET NULL (column)` behaviour, atomic mark-paid.
- **Frontend:** form fields and validation, kind badge/filter, mark-paid dialog, instalment progress, calendar grid and
  day panel, EN/ES parity.
- **Browser:** create a weekly bill with a default account → mark as paid → transaction listed and balance lowered →
  calendar shows the next occurrences.

## 12. Assumptions and open questions
- The expected amount is the user's estimate; the paid amount may differ (bills vary).
- Resolved on approval (2026-10-24): `Weekly`/`Biweekly` are included now (D3); the nav item "Subscriptions" becomes
  "Recurring payments" (D1); recurring income stays out of this phase.

## 13. Task breakdown and delivery order
1. HU-72 backend (migration, model, `RecurrenceSchedule`, consumers) → frontend.
2. HU-73 backend → frontend.
3. HU-74 backend → frontend.
4. HU-75 backend → frontend → docs → e2e step.

## 14. Implementation notes (filled after delivery)
- **HU-72 backend** (backend PR #96): `Domain/Subscriptions/RecurrenceSchedule` (`Next`, `Occurrences`,
  `MonthlyEquivalent`) is the only cycle rule; `Subscription.GetOccurrences`, `AdvanceBillingDate`, Today
  (`DailyAllowanceCalculator.ChargesUntil`: every occurrence until month end, overdue ones once each; one
  `chargesUntilMonthEnd` item per occurrence, its `nextBillingDate` being that occurrence's date) and analytics use it.
  `RecurringPaymentDetails` carries kind, link and defaults. CSV appends `kind` and `payment_url` to the export columns.
