# EP-15: Budgets and Savings Goals (FlowTrim 3.0 — Phase 3)

- **Status:** Approved _(2026-10-27, under Ander's standing approval of 2026-10-26 to advance the pending roadmap)_
- **Story / Issue:** epic #177 · HU-76 #178 · HU-77 #179
- **Priority:** P1 (roadmap step 4 of FlowTrim 3.0)
- **Dependencies:** EP-12 (accounts, categories, transactions, Today), EP-14 (recurring payments), HU-41 (correlation
  ids), EP-11 (`core/forms`), `docs/FLOWTRIM-3-ROADMAP.md`
- **Author / Date:** Ander (with Claude) · 2026-10-27

## 1. Context and goal
FlowTrim already shows where the money is (accounts), what came in and went out (transactions), what is still due
(recurring payments, calendar) and how much can be spent today. It does not yet help the user **plan**: there is no
spending limit per category and no way to save towards something.

Goal: add **monthly budgets per expense category** with visual alerts at 80 % and 100 %, and **savings goals** with
declared contributions, progress and a transparent projection — both deterministic, per currency, and honest about
being estimates.

## 2. Decisions

| # | Topic | Decision | Why |
|---|---|---|---|
| D1 | Budget shape | A budget is a **monthly limit for one expense category in one currency** that repeats every month (no per-month overrides in this phase). Unique per owner + category + currency. | The simplest model that answers "how much can I still spend on food this month?". |
| D2 | Budget spending | **Spent = Σ recorded `Expense` transactions** of that category whose account has the budget's currency, in the selected month (product calendar). Expected recurring charges are **not** counted (they are not payments). Transfers never count. | Same honesty rule as EP-12: only confirmed facts. |
| D3 | Budget states | `percent = spent / limit × 100` (1 decimal, `AwayFromZero`); state **`OnTrack`** < 80 %, **`Warning`** ≥ 80 %, **`Exceeded`** ≥ 100 %. `remaining = max(0, limit − spent)`, `over = max(0, spent − limit)`. | The roadmap thresholds; deterministic and testable. |
| D4 | Budget alerts | **In-app only:** state badges on `/app/budgets` and a "Budgets to watch" card on **Today** listing the current month's `Warning`/`Exceeded` budgets. No e-mail/push (phase 4). | Alerts are visual and never claim a message was sent. |
| D5 | Category lifecycle | Budgets are configuration, not history: deleting a category deletes its budgets (`ON DELETE CASCADE` on the composite FK); an **archived** category keeps its budget but cannot get a new one. | No orphan rows; history (transactions) is untouched. |
| D6 | Goal shape | A savings goal has a name, a **target amount and currency**, an optional **target date** (today or later when set or changed) and **declared contributions** (amount ≠ 0 — negative = withdrawal — date ≤ today, optional note). | Users save in many ways (savings account, cash, CDT); FlowTrim records what they declare without moving money between accounts in this phase. |
| D7 | Goal figures | `saved = Σ contributions` (may not go below 0: a withdrawal larger than the saved amount is a 400), `remaining = max(0, target − saved)`, `percent` (1 decimal, capped display at 100 but stored real), **`completed`** when `saved ≥ target`. With a target date: **`requiredPerMonth = remaining / monthsLeft`**, `monthsLeft` = whole months from the current month to the target month **inclusive** (≥ 1), 2 decimals `AwayFromZero`; overdue target date → `monthsLeft = 1` and the goal is flagged `isOverdue`. | Transparent formulas; never divide by zero. |
| D8 | Goal projection | `averagePerMonth = Σ contributions of the last 3 full months / 3` (2 decimals). If > 0 and not completed: **`estimatedCompletion`** = first day of the month `ceil(remaining / averagePerMonth)` months after the current month; otherwise `null` ("not enough data"). Shown as an estimate. | A simple, explainable trend; no regression/ML (out of scope by design). |
| D9 | Goals and accounts | Contributions are **declared**, not linked to accounts or transactions in this phase (a later phase may record them as transfers to a savings account). | Avoids double counting with transfers; keeps the slice small. |

## 3. Scope
**In scope:** HU-76 (budgets: API, `/app/budgets`, Today card) and HU-77 (goals: API, `/app/goals`), migrations
`AddBudgets` and `AddSavingsGoals`, README/CLAUDE.md updates, e2e steps.

**Out of scope:** per-month budget overrides, budgets for income, rollover of unused budget, e-mail/push alerts
(phase 4), linking contributions to accounts, AI Assistant tools for budgets/goals (phase 5), multi-currency goals.

## 4. Stories

| Story | Title | Repos |
|---|---|---|
| HU-76 | Monthly budgets per category with 80 %/100 % alerts | backend, frontend |
| HU-77 | Savings goals with contributions and projection | backend, frontend |

### HU-76 — Monthly budgets
- **FR-1 API:** `GET /api/budgets?month=yyyy-MM` (default this month) → `{ month, items: [ { id, categoryId,
  categoryName, categoryColor, categoryIcon, categoryArchived, currency, limit, spent, remaining, over, percent, state }
  ] }` ordered by state (Exceeded, Warning, OnTrack) then category name; `POST /api/budgets` `{ categoryId, currency,
  limit }` → 201; `PUT /api/budgets/{id}` `{ limit }` → 200; `DELETE /api/budgets/{id}` → 204.
- **FR-2 Rules:** category of the owner, kind `Expense`, not archived on create; currency 3 letters; `limit` > 0, ≤ 2
  decimals, within `numeric(18,2)`; a second budget for the same category + currency → `409 budget_exists`.
- **FR-3 Today:** `GET /api/dashboard/today` gains `budgetsToWatch` (this month's `Warning`/`Exceeded` items, same shape).
- **FR-4 UI:** `/app/budgets` (rail: Daily group): month selector, one card per budget with category chip, progress bar
  (colour by state, never colour alone: state text too), spent / limit, remaining or over; create/edit/delete in modals
  (category chips of active expense categories, currency from the user's account currencies, limit); empty state with
  "Create your first budget". Today shows the "Budgets to watch" card when the list is not empty.
- **AC-1:** Food COP 400,000; expenses in Food this month 250,000 (COP) + 50 USD → spent 250,000, remaining 150,000,
  percent 62.5, `OnTrack`; another 80,000 → 82.5 % `Warning` and it appears on Today; another 100,000 → 107.5 %
  `Exceeded`, over 30,000.
- **AC-2:** Expenses of other months, other categories, other currencies, transfers and other owners never count.
- **AC-3:** Deleting the category (no transactions) deletes its budget; a duplicate budget → 409.

### HU-77 — Savings goals
- **FR-1 API:** `GET /api/goals` → items `{ id, name, currency, target, targetDate, saved, remaining, percent,
  completed, isOverdue, monthsLeft, requiredPerMonth, averagePerMonth, estimatedCompletion, contributionsCount }`
  (active first by target date, completed last); `GET /api/goals/{id}` adds the last 50 contributions; `POST/PUT/DELETE
  /api/goals[/{id}]` (`{ name, currency, target, targetDate }`; currency locked once there are contributions → `409
  goal_currency_locked`); `POST /api/goals/{id}/contributions` `{ amount, date, note }` → 201;
  `DELETE /api/goals/{id}/contributions/{contributionId}` → 204 (deleting a goal deletes its contributions).
- **FR-2 Rules (D6/D7):** name ≤ 60 required; target > 0; target date ≥ today when set or changed; contribution
  amount ≠ 0, ≤ 2 decimals, date ≤ today, note ≤ 200; a withdrawal cannot make `saved` negative (`400 amount`).
- **FR-3 UI:** `/app/goals` (rail: Daily group): goal cards with progress ring/bar, saved / target, "Completed" badge,
  required per month (with the target date) and estimated completion (labelled as an estimate, or "Not enough data
  yet"); add contribution / withdrawal from the card; detail modal with the contribution history and delete; create,
  edit and delete goals in modals.
- **AC-1:** Goal "Trip" COP 3,000,000 by 2027-03-31, today 2026-10-20, saved 600,000 → remaining 2,400,000, monthsLeft 6
  (Oct–Mar), requiredPerMonth 400,000.
- **AC-2:** Contributions of 300,000 in each of Jul, Aug, Sep 2026 → averagePerMonth 300,000 → with remaining
  2,400,000 → estimatedCompletion 2027-06-01 (8 months after October).
- **AC-3:** A withdrawal larger than `saved` → 400; reaching the target marks `completed` and clears the projection.

## 5. Business rules

| Indicator | Rule | Caveat |
|---|---|---|
| Budget spent | Σ `Expense` amounts with the budget's category, account currency = budget currency, date in the month | Recorded facts only; expected charges excluded |
| Budget percent / state | `spent / limit × 100` (1 decimal); `< 80` OnTrack, `≥ 80` Warning, `≥ 100` Exceeded | In-app alert only |
| Goal saved / remaining | `Σ contributions`; `max(0, target − saved)` | Declared, not verified |
| Required per month | `remaining / monthsLeft`, `monthsLeft = max(1, months from current month to target month inclusive)` | Assumes equal monthly contributions |
| Average per month | `Σ contributions of the last 3 full months / 3` | Trend, not a promise |
| Estimated completion | current month + `ceil(remaining / averagePerMonth)` months (first day); `null` if average ≤ 0 or completed | Estimate |

## 6. API contract (summary)

| Method | Route | Result |
|---|---|---|
| GET | `/api/budgets?month=yyyy-MM` | 200 / 400 `month` |
| POST | `/api/budgets` | 201 / 400 / 409 `budget_exists` |
| PUT / DELETE | `/api/budgets/{id}` | 200 / 204 / 400 / 404 |
| GET | `/api/dashboard/today` | + `budgetsToWatch` |
| GET / POST | `/api/goals` | 200 / 201 / 400 |
| GET / PUT / DELETE | `/api/goals/{id}` | 200 / 204 / 400 / 404 / 409 `goal_currency_locked` |
| POST | `/api/goals/{id}/contributions` | 201 / 400 / 404 |
| DELETE | `/api/goals/{id}/contributions/{contributionId}` | 204 / 404 |

## 7. Data model changes
- **`AddBudgets`** — `budgets`: `id uuid pk`, `owner_id varchar(200)`, `category_id uuid`, `currency char(3)`,
  `limit_amount numeric(18,2)` (`ck_budgets_limit_positive`), timestamps; unique `ux_budgets_owner_id_category_id_currency`;
  composite FK `(owner_id, category_id)` → `categories(owner_id, id)` `ON DELETE CASCADE`.
- **`AddSavingsGoals`** — `savings_goals`: `id`, `owner_id`, `name varchar(60)`, `currency char(3)`,
  `target_amount numeric(18,2)` (> 0), `target_date date null`, timestamps; unique `(owner_id, id)`.
  `goal_contributions`: `id`, `owner_id`, `goal_id`, `amount numeric(18,2)` (`<> 0`), `date date`, `note varchar(200)
  null`, `created_at`; composite FK `(owner_id, goal_id)` → `savings_goals(owner_id, id)` `ON DELETE CASCADE`; index
  `(owner_id, goal_id, date)`.

## 8. Validation and error cases
Field `400`s as listed in FR-2 of each story; foreign or missing ids → `404` (never reveal other owners' data);
`409` with `code` for `budget_exists` and `goal_currency_locked`.

## 9. Edge cases
Month with no expenses (0 %); limit reached exactly (100 % → Exceeded); archived category with a budget (still listed,
flagged); goal without target date (no required-per-month); target date in the past (overdue, monthsLeft 1); goal
already completed then a withdrawal (back to in progress); contributions only in the current month (average uses the
last 3 *full* months → "not enough data").

## 10. UI states
Loading, empty, success and error (with retry and correlation reference) on both pages; field errors in modals;
progress shown with text and value, not colour alone; works at 360 px in both themes.

## 11. Test plan
- **Domain:** budget percent/state thresholds and rounding; goal figures (remaining, monthsLeft, requiredPerMonth,
  average, estimated completion, overdue, completed, withdrawals).
- **API:** CRUD, validation, 409 codes, owner isolation, month filter, Today `budgetsToWatch`.
- **Integration (PostgreSQL):** spent summed in SQL with currency/category/month filters; cascades; constraints.
- **Frontend:** pages, modals, states, EN/ES parity; **e2e:** budget reaching Warning after a quick-add expense and
  shown on Today; goal with a contribution.

## 12. Assumptions and open questions
Months follow the product calendar (America/Bogota). No open questions (standing approval).

## 13. Task breakdown and delivery order
1. HU-76 backend → frontend → e2e. 2. HU-77 backend → frontend → e2e. 3. Docs, close the epic.

## 14. Implementation notes (filled after delivery)
—
