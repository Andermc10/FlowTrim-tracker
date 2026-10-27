# EP-16: Monthly Statement, Bank CSV Import and AI Tools (FlowTrim 3.0 — Phase 5)

- **Status:** Approved _(2026-10-27, under Ander's standing approval of 2026-10-26; "sí, continúa con la fase 5")_
- **Story / Issue:** epic #182 · HU-78 #183 · HU-79 #184 · HU-80 #185
- **Priority:** P1 (roadmap step 6 of FlowTrim 3.0; covers the old HU-14 "import transactions from CSV")
- **Dependencies:** EP-12 (accounts, categories, transactions), EP-15 (budgets, goals), EP-07 (CSV reader and dialect),
  EP-05 (Insights tools), `docs/FLOWTRIM-3-ROADMAP.md`
- **Author / Date:** Ander (with Claude) · 2026-10-27

## 1. Context and goal
FlowTrim records the user's money but does not yet summarize a month, makes the user type every bank movement by hand,
and its AI Assistant only knows about subscriptions. Phase 5 closes those gaps without changing the honesty rules: only
recorded facts count, every figure comes from deterministic C#, and the AI only explains tool results.

## 2. Decisions

| # | Topic | Decision | Why |
|---|---|---|---|
| D1 | Statement scope | A **monthly statement per currency**: income, expenses, net, **savings rate** (`net / income`, 1 decimal; `null` when income is 0), the same figures for the **previous month** and the change of expenses (`%`, `null` when the previous month had none), and **top 5 expense categories** with amount, share of the month's expenses and the previous month's amount. Transfers never count. | The roadmap's "income vs spending, month-over-month" in one transparent screen. |
| D2 | Statement placement | A third tab **Statement** in *Analytics & reports* (`/app/analytics/statement`), with its own month selector; printable with the existing print styles. | Reports already live there; no new menu entry. |
| D3 | Bank CSV format | Columns (case-insensitive, any order): required **`date`** and **`amount`** (signed: negative = expense, positive = income); optional **`description`** (≤ 140) and **`category`** (name of one of the user's categories of the matching kind). Same dialects as EP-11 HU-58 (`,` with dot decimals and `yyyy-MM-dd`; `;` with decimal comma and `dd/MM/yyyy`; `sep=` line; UTF-8 ± BOM), `.csv`, ≤ 256 KB, ≤ 500 rows. | Most banks export date/description/amount; reusing the dialect keeps Excel files working. |
| D4 | Target account and categories | The user picks **one account** (active) and a **default expense category** and **default income category** (active, matching kind). A `category` cell that matches an active category of the right kind (case-insensitive) wins; otherwise the default is used and the row shows that it fell back. | Every income/expense needs a category (EP-12); defaults make big files importable. |
| D5 | Preview and confirm | **Stateless**, as EP-07 D4: preview validates and classifies; confirm re-sends the same file and choices, re-checks everything and creates the valid rows **in one database transaction** (all or nothing). | Proven pattern; no temporary tables. |
| D6 | Duplicates | A valid row is a **duplicate** when the account already has a transaction with the same date, type, amount and description (case-insensitive, trimmed) or an earlier valid row of the file matches; duplicates are never created. | Re-importing the same bank file is safe. |
| D7 | Row rules | `date` real date and **≤ today** (product calendar); `amount` ≠ 0, ≤ 2 decimals, within `numeric(18,2)`; description ≤ 140. Each error has a stable code (`required`, `invalid_date`, `date_in_future`, `invalid_amount`, `amount_zero`, `too_long`, `wrong_cell_count`). | Same rules as a hand-made transaction. |
| D8 | AI tools | Three new read-only tools: **`get_month_spending`** (the statement of a month, default current), **`get_budgets`** (this month's budgets: limit, spent, remaining, state) and **`get_goals`** (saved, remaining, required per month, estimated completion). They wrap the existing handlers; figures go to the evidence list as typed `kind`s. The assistant's scope grows to "your FlowTrim money" and the fixed messages are updated. | The AI explains; it never calculates (EP-05). |

## 3. Scope
**In scope:** HU-78, HU-79, HU-80 (backend, frontend, docs, e2e). **Out of scope:** automatic bank connections, OFX/PDF
statements, categorisation rules or AI categorisation, transfers in the import, multi-account files, editing rows in
the preview, charts in the statement (the Charts tab already exists), AI writing data.

## 4. Stories

| Story | Title | Repos |
|---|---|---|
| HU-78 | Monthly statement | backend, frontend |
| HU-79 | Bank CSV import of transactions | backend, frontend |
| HU-80 | AI Assistant tools for month spending, budgets and goals | backend, frontend |

### HU-78 — Monthly statement
- **FR-1 API:** `GET /api/statements?month=yyyy-MM` (default this month; `400 month` otherwise) → `{ month, previousMonth,
  currencies: [ { currency, income, expense, net, savingsRate, previousIncome, previousExpense, previousNet,
  expenseChange, topCategories: [ { categoryId, name, color, icon, amount, share, previousAmount } ],
  transactionsCount } ] }`, currencies ordered by code.
- **FR-2 UI:** tab *Statement*: month selector, one block per currency with income / expenses / net / savings rate and the
  comparison with the previous month (arrows plus text, not colour alone), top categories table with share and
  previous amount; empty state "Nothing recorded this month".
- **AC-1:** October: income 3,000,000, expenses 1,800,000 (Food 600,000, Rent 1,200,000); September expenses 1,500,000 →
  net 1,200,000, savings rate 40.0, expense change +20.0, Rent first with share 66.7.
- **AC-2:** Transfers, other currencies (separate block) and other owners never mix in.

### HU-79 — Bank CSV import
- **FR-1 API:** `POST /api/transaction-imports/preview` and `/confirm` (multipart: `file`, `accountId`,
  `expenseCategoryId`, `incomeCategoryId`). Preview → `{ rows: [ { rowNumber, status, values: { date, type, amount,
  description, categoryId, categoryName, categoryFallback }, errors: [ { field, code, message } ], duplicateOf,
  duplicateOfRow } ], summary: { total, valid, invalid, duplicate }, ignoredColumns }`; confirm → `{ total, created,
  invalid, duplicate }`. File errors `400`/`413` with `code` as EP-07; choices invalid → `400` on the field.
- **FR-2 UI:** `/app/transactions/import` (lazy, "Import CSV" on Transactions): account and default categories, file
  picker with the same client checks as the subscription import, preview table (status, date, type, amount, description,
  category with "default" marker, errors), confirm button with the count, result counts, link back to Transactions.
- **AC-1:** A Bancolombia-style `;` file with `dd/MM/yyyy` and decimal comma, rows `-45.000,50` "Éxito" and `2.500.000`
  "Nómina"… amounts with thousands separators are **invalid** (`invalid_amount`): only digits and one decimal separator
  are accepted (documented).
- **AC-2:** Importing the same file twice creates nothing the second time (all duplicates).
- **AC-3:** A row with `category` = an existing expense category uses it; an unknown one falls back to the default and is
  marked.

### HU-80 — AI tools
- **FR-1:** tools `get_month_spending` (`{ month?: "yyyy-MM" }`), `get_budgets` (`{}`), `get_goals` (`{}`); allow-listed;
  `not_calculable`/`invalid_arguments` as the existing tools.
- **FR-2:** figure kinds `month_income`, `month_expense`, `month_net`, `budget_remaining`, `budget_spent`, `goal_saved`,
  `goal_remaining`, `goal_required_per_month`; assumptions `recorded_only` ("Amounts are transactions the user recorded;
  expected charges are not included.") and `declared_contributions` ("Goal contributions are declared by the user and
  projections are estimates.").
- **FR-3:** system prompt and `UnsupportedAnswer` cover subscriptions, transactions, budgets and goals; the fake provider
  routes "budget/presupuesto", "goal/meta/ahorro para", "income/ingreso", "this month/este mes/gasté" to the new tools.
- **FR-4 UI:** new suggestions ("How much did I spend this month?", "How are my budgets?", "How are my savings goals?"),
  translated figure kinds and assumption keys, source links to Statement, Budgets and Goals.
- **AC-1:** Asking "How are my budgets?" returns evidence figures equal to `/api/budgets` for the current month.

## 5. Business rules

| Indicator | Rule |
|---|---|
| Net | `income − expense` (per currency, transfers excluded) |
| Savings rate | `net / income × 100`, 1 decimal `AwayFromZero`; `null` if income = 0 |
| Expense change | `(expense − previousExpense) / previousExpense × 100`, 1 decimal; `null` if previousExpense = 0 |
| Category share | `amount / expense × 100`, 1 decimal |
| Import amount | negative → `Expense` of `|amount|`; positive → `Income` |

## 6. API contract (summary)
`GET /api/statements?month=` · `POST /api/transaction-imports/preview` · `POST /api/transaction-imports/confirm` ·
`POST /api/insights/questions` (unchanged contract, new tools/kinds/keys).

## 7. Data model changes
None (statement and AI read existing data; the import creates ordinary transactions).

## 8. Validation and error cases
As D3/D7 and FR-1 of each story; foreign or archived account/categories → `400` on the field (never reveal other owners'
data).

## 9. Edge cases
Month without data; only income; only transfers; file with only a header; repeated headers; blank lines; a row
duplicating an earlier row; account archived between preview and confirm (confirm re-validates → 400).

## 10. UI states
Loading, empty, success and error (with retry and correlation reference) everywhere; import shows per-row errors; works
at 360 px in both themes.

## 11. Test plan
Pure statement calculator (AC-1/AC-2), API and PostgreSQL totals; CSV row parsing, dialects, duplicates, atomic confirm;
tools (figures equal the handlers, invalid arguments), fake routing; frontend pages and EN/ES parity; e2e: statement
after a recorded expense, a two-row bank import, an Insights question about budgets.

## 12. Assumptions and open questions
Months follow the product calendar (America/Bogota). No open questions (standing approval).

## 13. Task breakdown and delivery order
1. HU-78 backend → frontend. 2. HU-79 backend → frontend. 3. HU-80 backend → frontend. 4. Docs, close the epic.

## 14. Implementation notes (filled after delivery)
—
