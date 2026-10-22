# EP-12: Daily Finance Base (FlowTrim 3.0 — Phase 1)

- **Status:** Draft _(2026-10-22)_
- **Story / Issue:** to be created on approval · stories HU-64 to HU-68
- **Priority:** P1 (first module of FlowTrim 3.0)
- **Dependencies:** HU-12 (owner isolation), HU-38 (CI), HU-47 (integration tests), EP-11 (`core/forms`, product
  calendar, toasts), `docs/FLOWTRIM-3-ROADMAP.md`
- **Author / Date:** Ander (with Claude) · 2026-10-22

## 1. Context and goal
FlowTrim 2.0 tracks recurring subscriptions only. Ander wants to use FlowTrim every day for all personal money:
where the money is (accounts), what came in and went out (transactions), grouped the way he thinks about it
(categories), and one screen that answers **"how much can I spend today without breaking the month?"**.

Goal: add the smallest complete daily loop — create accounts, record income/expenses/transfers in a few seconds, see
balances and a transparent daily allowance — reusing the existing architecture (layered monolith, owner isolation,
`HandlerResult<T>`, product calendar, `core/forms`, toasts, modals, money pipe, chart component).

## 2. Decisions (recommended options, to be confirmed with the spec approval)

| # | Topic | Decision | Why |
|---|---|---|---|
| D1 | Source of transactions | **User-recorded only.** A transaction is a fact the user confirms; FlowTrim never infers one. Subscriptions keep being *expected* charges in this phase (phase 2 links "Mark as paid" to a transaction). | Keeps the honesty principle; replaces the MVP's "no transaction history" rule in a controlled way. |
| D2 | Balances | **Computed, never stored:** `balance = openingBalance + Σ incoming − Σ outgoing`. | One source of truth, no drift, trivially testable; volumes per user are small (indexed sums). |
| D3 | Transfers | **One row** with `accountId` (from) and `toAccountId` (to); **same currency only** in this phase. | No orphan half-transfers; no conversion rules (still out of scope). |
| D4 | Categories | **Per-user**, kind `Expense` or `Income`, color and icon from **fixed allow-lists**; a default set is created **once per user** on first use. Subscriptions keep their free-text category until phase 2. | Users own their categories; allow-lists keep the UI consistent in both themes and avoid user-supplied SVG/CSS. |
| D5 | Deleting used data | An account or category with transactions **cannot be deleted** → `409` with a `code`; it can be **archived** (hidden from pickers, kept in history and totals). | Never rewrites history; `409 Conflict` is the correct HTTP meaning (new status for the API, documented). |
| D6 | Transaction dates | `date` is required and **today or earlier** (product calendar, America/Bogota). Future-dated/scheduled items belong to phase 2. | Same rule family as EP-11 D2 (usage ≤ today). |
| D7 | "Safe to spend today" | Deterministic per-currency formula (§5), with every input shown on screen and a "not financial advice" note. Credit cards are excluded from available money. | Transparency principle; the AI is not involved. |
| D8 | Cross-owner integrity | Composite foreign keys `(owner_id, account_id)` → `accounts(owner_id, id)` (same for categories), so the database itself refuses a transaction that points to another user's account. | Defence in depth on top of handler checks. |
| D9 | Workspace home | `/app` becomes the **Today** dashboard; the subscription overview stays at `/app/summary`. The rail is grouped: *Daily* (Today, Transactions, Accounts, Categories) and *Subscriptions* (Overview, Subscriptions, Upcoming, Simulator), then Analytics & reports and AI Assistant. | Daily use starts on the daily screen; nothing existing is removed. |

## 3. Scope
**In scope:** stories HU-64 to HU-68 (backend, frontend, docs), the migration `AddDailyFinanceTables`, and updating
`CLAUDE.md` §1/§4/§5 with the new model and rules.

**Out of scope:** budgets and goals (phase 3), recurring payments and linking subscriptions to transactions
(phase 2), bank CSV import and statements (phase 5), currency conversion, split transactions, attachments/receipts,
AI Assistant tools for transactions (phase 5), notifications (phase 4), the landing redesign.

## 4. Stories

| Story | Title | Repos |
|---|---|---|
| HU-64 | Accounts with computed balances | backend, frontend |
| HU-65 | Personal categories with color and icon | backend, frontend |
| HU-66 | Record and browse transactions | backend, frontend |
| HU-67 | Quick add | frontend |
| HU-68 | Today dashboard with "safe to spend today" | backend, frontend, docs |

### HU-64 — Accounts with computed balances
- **FR-1 Model:** `Account` with name (required, ≤ 60, unique per owner ignoring case, archived included),
  type `Cash` | `Bank` | `CreditCard` | `Savings`, currency (ISO 4217, upper case), opening balance (`decimal`,
  2 decimals, may be negative — e.g. a card that already owes money), `isArchived`, audit timestamps.
- **FR-2 Balance (D2):** every account response includes `balance` computed from the opening balance and its
  transactions (incoming: income to it, transfers to it; outgoing: expenses from it, transfers from it).
  - For a `CreditCard`, a negative balance means debt; the UI labels it "Owed".
- **FR-3 API:** list (non-archived by default, `?includeArchived=true`), get, create, update (name, type, opening
  balance, `isArchived`; **currency is immutable once the account has transactions** → `409 account_currency_locked`),
  delete (only without transactions, else `409 account_has_transactions`).
- **FR-4 UI** `/app/accounts`: cards per account (name, type icon, balance with the money pipe), totals per currency
  (archived and credit cards shown apart), create/edit modal with placeholders and live validation (EP-11 pieces),
  archive/restore and delete with confirmation; the `409` message suggests archiving.
- **AC-1:** Given a Bank account in COP opened with 500,000, when I record a 38,900 expense from it, then its balance
  is 461,100.
- **AC-2:** Given an account with transactions, when I delete it, then I get `409 account_has_transactions` and it
  still exists.
- **AC-3:** Another owner's account id answers `404` on every route.

### HU-65 — Personal categories with color and icon
- **FR-1 Model:** `Category` with name (required, ≤ 40, unique per owner + kind ignoring case), kind `Expense` |
  `Income`, `color` (allow-list key, D4), `icon` (allow-list key), `isArchived`.
  - Colors: `slate, red, orange, amber, green, teal, blue, indigo, violet, pink` — each maps to a theme token that
    passes contrast in light and dark.
  - Icons: `food, groceries, transport, home, utilities, health, education, entertainment, shopping, travel, gifts,
    subscriptions, salary, freelance, investments, other` — inline SVG in `core/ui/icon`, no dependency.
- **FR-2 Defaults (D4):** the first time a user lists categories and has none, FlowTrim creates: *Expense* — Food,
  Groceries, Transport, Home, Utilities, Health, Education, Entertainment, Shopping, Subscriptions, Other; *Income* —
  Salary, Freelance, Other income. Creation is idempotent (unique index + insert-if-missing), so two concurrent first
  requests never duplicate them. Default names are created in the language of the request
  (`Accept-Language` `es` → Spanish names) and are then ordinary, editable categories.
- **FR-3 API:** list (`?kind=`, `?includeArchived=`), create, update (name, color, icon, `isArchived`; kind is
  immutable once used → `409 category_kind_locked`), delete (only unused, else `409 category_in_use`).
- **FR-4 UI** `/app/categories`: two groups (Expenses, Income) of chips with color and icon; create/edit modal with a
  color swatch picker and an icon grid (radio groups, keyboard accessible); archive/restore; delete with confirmation.
- **AC-1:** A new user opening Categories sees the default set once; reloading does not duplicate it.
- **AC-2:** A color or icon outside the allow-list → `400` field error.
- **AC-3:** A category used by a transaction cannot be deleted (`409 category_in_use`) but can be archived; archived
  categories still show on old transactions.

### HU-66 — Record and browse transactions
- **FR-1 Model:** `Transaction` with type `Income` | `Expense` | `Transfer`, `accountId`, `toAccountId` (transfer
  only), `categoryId` (income/expense only, kind must match the type), amount (> 0, ≤ 2 decimals), date (D6),
  description (optional, ≤ 140), note (optional, ≤ 500), audit timestamps. Currency is **the account's** (not sent by
  the client).
- **FR-2 Rules:**
  - transfer: `toAccountId` required, different from `accountId`, same currency (else `400 transfer_currency_mismatch`),
    no category;
  - accounts and categories must belong to the owner and not be archived for **new** transactions (editing an old
    transaction may keep an archived one);
  - an archived account cannot receive new transactions.
- **FR-3 API:** create, get, update, delete (hard delete; it is the user's own record), and list with filters
  `from`, `to` (inclusive dates), `accountId`, `categoryId`, `type`, `search` (description, case-insensitive),
  `page`/`pageSize` (default 50, max 200), ordered by date desc then `createdAt` desc. The list response includes
  per-currency `totals` (income, expense, net) for the **whole filter**, not just the page.
- **FR-4 UI** `/app/transactions`: month selector (default current month), filters (account, category, type, text),
  rows grouped by day with the day's net, amounts colored by type (with sign and text, not color alone), totals per
  currency, edit/delete via the existing modal patterns, empty state that points to Quick add.
- **AC-1:** An expense with an `Income` category → `400` on `categoryId`.
- **AC-2:** A transfer of 100,000 COP from Bank to Cash lowers Bank and raises Cash by 100,000; totals do not count it
  as income or expense.
- **AC-3:** A transaction dated tomorrow → `400` "Transaction date cannot be in the future."
- **AC-4:** Filtering October shows only October rows and October totals.

### HU-67 — Quick add
- **FR-1:** a primary "+ Add" button in the workspace header (and a floating button on mobile above the bottom nav),
  plus the keyboard shortcut `N` when no field has focus, opens a compact modal.
- **FR-2:** the modal starts on the amount field; type toggle (Expense default / Income / Transfer); category chips
  of the chosen kind (most used first, from the user's last 90 days); account defaults to the last used one
  (remembered per browser); date defaults to today; description optional.
- **FR-3:** "Save" closes with a toast ("Expense recorded · Food · 38,900 COP"); "Save and add another" keeps the
  modal open with the same type and account. The open screen (Today, Transactions, Accounts) refreshes its data.
- **FR-4:** with no accounts yet, the modal explains it and offers to create the first account.
- **AC-1:** From Today, recording an expense with the keyboard only (N, amount, Tab to a category, Enter) takes one
  modal and updates the Today numbers without a page reload.

### HU-68 — Today dashboard with "safe to spend today"
- **FR-1 API** `GET /api/dashboard/today`: product-calendar `referenceDate` and, **per currency**:
  available money, month income, month expenses, month net, today's expenses, committed upcoming charges until month
  end, days left, safe to spend today, plus the last 5 transactions and the account list with balances.
- **FR-2 UI** `/app` (D9): a hero card per currency with **Safe to spend today** and a "How is this calculated?"
  disclosure that shows each input and the formula; tiles for month income/expenses/net; today's spending;
  accounts strip; recent transactions; upcoming subscription charges until month end (link to Upcoming). Empty state
  guides: create an account → record a transaction.
- **FR-3:** the rail regrouping of D9; the old `/app` overview moves to `/app/summary` (already a route).
- **FR-4 Docs:** `CLAUDE.md` §1 (product now includes user-recorded transactions), §4 (new entities), §5 (new
  formulas); README of both repos.
- **AC-1:** Given Cash 200,000 + Bank 1,000,000 COP, a card owing 300,000, an active monthly subscription of 38,900
  due on the 28th and today the 20th of a 31-day month, then available = 1,200,000, committed = 38,900, days left =
  12 and safe to spend today = 96,758.33.
- **AC-2:** When committed charges exceed available money, safe to spend shows 0 and a warning with the shortfall.
- **AC-3:** A currency with accounts but no transactions still shows its card; currencies are never summed.

## 5. Business rules

| Indicator | Rule | Caveat |
|---|---|---|
| Account balance | `openingBalance + Σ income(to it) + Σ transfers(to it) − Σ expenses(from it) − Σ transfers(from it)` | Archived accounts keep their balance |
| Available money (currency c) | Σ balance of **non-archived** accounts in c with type `Cash`, `Bank` or `Savings` | Credit cards excluded (borrowed money); savings included and labelled |
| Month income / expenses | Σ `Income` / `Expense` amounts dated in the current product-calendar month | Transfers never count as income or expense |
| Today's expenses | Σ `Expense` amounts dated today | |
| Committed until month end | Σ `amount` of **active** subscriptions in c whose next billing date is ≤ the last day of the month (includes overdue and today) | Expected charges, not payments; marking a charge as paid (HU-57) moves it out |
| Days left | `lastDayOfMonth − today + 1` (today included) | Always ≥ 1 |
| Safe to spend today | `max(0, (available − committed) / daysLeft)`, rounded to 2 decimals `AwayFromZero` | An estimate: assumes no other income or expense this month; not financial advice |
| Shortfall | `max(0, committed − available)` | Shown only when > 0 |

- Money is `decimal`; all sums are per currency; nothing is converted.
- Reference date and month come from `ProductCalendar.Today(TimeProvider)` (America/Bogota).
- All calculations live in pure domain classes (`AccountBalanceCalculator`, `DailyAllowanceCalculator`) with no I/O.

## 6. API contract
All routes require authentication and are owner-scoped; foreign or missing ids answer `404`. Errors are
`ProblemDetails`; business conflicts carry a `code`.

| Method | Route | Success | Errors |
|---|---|---|---|
| GET | `/api/accounts?includeArchived=` | 200 `AccountResponse[]` | — |
| GET | `/api/accounts/{id}` | 200 | 404 |
| POST | `/api/accounts` | 201 + `Location` | 400 |
| PUT | `/api/accounts/{id}` | 200 | 400, 404, 409 `account_currency_locked` |
| DELETE | `/api/accounts/{id}` | 204 | 404, 409 `account_has_transactions` |
| GET | `/api/categories?kind=&includeArchived=` | 200 `CategoryResponse[]` | 400 (bad kind) |
| POST | `/api/categories` | 201 | 400 |
| PUT | `/api/categories/{id}` | 200 | 400, 404, 409 `category_kind_locked` |
| DELETE | `/api/categories/{id}` | 204 | 404, 409 `category_in_use` |
| GET | `/api/transactions?from=&to=&accountId=&categoryId=&type=&search=&page=&pageSize=` | 200 paged + `totals` | 400 |
| GET | `/api/transactions/{id}` | 200 | 404 |
| POST | `/api/transactions` | 201 | 400 |
| PUT | `/api/transactions/{id}` | 200 | 400, 404 |
| DELETE | `/api/transactions/{id}` | 204 | 404 |
| GET | `/api/dashboard/today` | 200 | — |

```json
// POST /api/transactions
{ "type": "Expense", "accountId": "…", "categoryId": "…", "amount": 38900, "date": "2026-10-22",
  "description": "Lunch", "note": null }

// TransactionResponse
{ "id": "…", "type": "Expense", "accountId": "…", "accountName": "Bank", "toAccountId": null, "toAccountName": null,
  "categoryId": "…", "categoryName": "Food", "categoryColor": "orange", "categoryIcon": "food",
  "amount": 38900.00, "currency": "COP", "date": "2026-10-22", "description": "Lunch", "note": null,
  "createdAt": "…", "updatedAt": "…" }

// AccountResponse
{ "id": "…", "name": "Bank", "type": "Bank", "currency": "COP", "openingBalance": 500000.00,
  "balance": 461100.00, "isArchived": false, "hasTransactions": true, "createdAt": "…", "updatedAt": "…" }

// GET /api/dashboard/today
{ "referenceDate": "2026-10-20",
  "currencies": [ { "currency": "COP", "available": 1200000.00, "monthIncome": 0.00, "monthExpenses": 0.00,
    "monthNet": 0.00, "todayExpenses": 0.00, "committedUntilMonthEnd": 38900.00, "daysLeft": 12,
    "safeToSpendToday": 96758.33, "shortfall": 0.00 } ],
  "accounts": [ … ], "recentTransactions": [ … ] }
```

## 7. Data model changes
Migration **`AddDailyFinanceTables`** (snake_case, explicit names, reviewed SQL):

- `accounts`: `id uuid pk`, `owner_id text not null`, `name varchar(60)`, `type text` (`ck_accounts_type`),
  `currency char(3)`, `opening_balance numeric(18,2)`, `is_archived boolean default false`, `created_at`/`updated_at
  timestamptz`; unique `ux_accounts_owner_id_name` on `(owner_id, lower(name))`; unique `ux_accounts_owner_id_id` on
  `(owner_id, id)` (target of the composite FKs).
- `categories`: `id`, `owner_id`, `name varchar(40)`, `kind text` (`ck_categories_kind`), `color text`, `icon text`
  (allow-lists checked in the domain; no DB check so the lists can grow without a migration), `is_archived`, audit
  columns; unique `ux_categories_owner_id_kind_name` on `(owner_id, kind, lower(name))`; unique `(owner_id, id)`.
- `transactions`: `id`, `owner_id`, `type text` (`ck_transactions_type`), `account_id uuid`, `to_account_id uuid null`,
  `category_id uuid null`, `amount numeric(18,2)` (`ck_transactions_amount_positive`), `date date`,
  `description varchar(140) null`, `note varchar(500) null`, audit columns.
  - `ck_transactions_shape`: transfer ⇔ (`to_account_id` not null and `category_id` null); otherwise `to_account_id`
    null and `category_id` not null; `ck_transactions_distinct_accounts`: `to_account_id <> account_id`.
  - FKs (D8, `ON DELETE RESTRICT`): `(owner_id, account_id)` and `(owner_id, to_account_id)` → `accounts(owner_id, id)`;
    `(owner_id, category_id)` → `categories(owner_id, id)`.
  - Indexes: `ix_transactions_owner_id_date` (`owner_id, date desc`), `ix_transactions_account_id`,
    `ix_transactions_to_account_id`, `ix_transactions_category_id`.
- No change to `subscriptions` or `usage_records`.

## 8. Validation and error cases

| Case | Result |
|---|---|
| Name empty / too long; currency not 3 letters; bad enum; amount ≤ 0 or > 2 decimals | 400 field errors |
| Transaction date after today (Bogota) | 400 `date`: "Transaction date cannot be in the future." |
| Category kind does not match transaction type; category on a transfer; missing category on income/expense | 400 `categoryId` |
| Transfer to the same account / different currency | 400 `toAccountId` (`transfer_currency_mismatch` code on the field) |
| Account or category archived (new transaction), foreign or missing | 400 on the field (never reveals other owners' data) |
| Delete used account/category; change currency of used account; change kind of used category | 409 with `code` |
| Duplicate account/category name | 400 on `name` (also guarded by the unique index → mapped, never 500) |

## 9. Edge cases
- Month boundaries and the 19:00–24:00 Bogota window (UTC day already changed) for "today" and "this month".
- Editing a transaction's account or type recomputes both affected balances (computed, so automatic).
- An account with a negative opening balance (card) and no transactions.
- A user with subscriptions in USD but accounts only in COP: the USD card shows committed charges with available 0
  and a shortfall, clearly labelled.
- Leap years and months with 28/29/30/31 days for `daysLeft`.
- Large lists: list endpoint is paged; totals are computed in SQL with grouping, not in memory.

## 10. UI states
Every new screen handles loading, empty, success and error (inline load errors with correlation reference; toasts
for actions). Forms reuse EP-11 placeholders, live validation and counters. Amounts use the money pipe and are
never conveyed by color alone. Swatch and icon pickers are radio groups with labels. Layout works at 360 px; the
quick-add button never covers the back-to-top button.

## 11. Test plan
- **Domain (xUnit, fixed clock):** account invariants; category allow-lists; transaction shape rules;
  `AccountBalanceCalculator` (income, expense, transfers both ways, archived); `DailyAllowanceCalculator` (AC-1 numbers,
  shortfall, credit cards excluded, per currency, last day of month, Bogota boundary).
- **Application:** handlers for each route, defaults seeding idempotency, 409 cases, filters and totals.
- **Integration (Testcontainers):** migration constraints (shape, composite FKs reject a foreign owner's account,
  unique names), concurrent default seeding, list totals in SQL.
- **API:** auth required, owner isolation for every new route (added to `AuthorizationApiTests`), status codes.
- **Frontend (Vitest):** services, account/category/transaction pages, pickers, quick add (shortcut, defaults,
  "save and add another"), dashboard formula disclosure, EN/ES parity.
- **Browser (`npm run e2e`):** create account → quick-add expense → Today numbers change → transaction list → delete.

## 12. Assumptions and open questions
- Assumes one person per account (no shared household accounts).
- Opening balance is "the balance on the day the account is added"; no historical reconciliation.
- Open: none if D1–D9 are approved.

## 13. Task breakdown and delivery order
1. HU-64 backend (migration for all three tables, accounts, balances) → frontend.
2. HU-65 backend → frontend (icons and color tokens).
3. HU-66 backend → frontend.
4. HU-67 frontend.
5. HU-68 backend → frontend → docs (`CLAUDE.md`, READMEs) → e2e step.

## 14. Implementation notes (filled after delivery)
—
