# HU-37: Verify Insights Evidence and Limits

- **Status:** Approved _(approved 2026-10-19 by Ander)_
- **Story / Issue:** FlowTrim-tracker#59 · tasks: backend#52 (verification matrix and contract tests),
  tracker#60 (privacy and demo boundaries)
- **Priority:** P1
- **Epic:** EP-05
- **Dependencies:** HU-33 (provider boundary), HU-34 (tools), HU-35 (endpoint), HU-36 (UI)
- **Author / Date:** Ander (with Claude) · 2026-10-19

## 1. Context and goal
HU-33 to HU-36 built FlowTrim Insights and already have broad unit and API tests (orchestration limits, provider
errors, rate limit, timeout, log privacy, owner isolation). What is still missing is **evidence a reviewer can read**:
a matrix that ties representative questions to the deterministic numbers they must reproduce, tests that prove the
model's prose cannot change those numbers or leak identifiers, a documented privacy boundary, and demo steps for a
success and a controlled failure. This story adds that evidence without adding features.

## 2. Scope
**In scope**
- Backend: an API-level **verification matrix test** (one row per representative question) and three contract tests
  (section 11). No production code change is expected; if a test exposes a defect, the fix is part of this story.
- Backend README: a "Privacy and data sent to the AI provider" section.
- Tracker: `docs/INSIGHTS-VERIFICATION.md` (matrix, automated evidence, manual Groq run, failure demos), new rows in
  `docs/E2E-ACCEPTANCE.md`, and a corrected Insights section in `docs/FLOWTRIM-2-DEMO-CHECKLIST.md`.

**Out of scope**
- New tools, new endpoints or UI changes.
- Validating or rewriting the model's prose against the figures (the figures are the authority; see section 4).
- A smarter fake provider that extracts names or horizons from the question.

## 3. Functional requirements
- **FR-1 Representative questions.** Four questions, each mapped to the tool, the arguments and the deterministic
  endpoint whose numbers the `figures` must equal:

  | # | Question | Tool and arguments | Must equal |
  |---|---|---|---|
  | Q1 | "How much do I spend per month?" | `get_spending_summary` `{}` | `GET /api/summary` `monthlyEquivalent`, `annualProjection` per currency |
  | Q2 | "Which charges are due in the next 7 days?" | `get_upcoming_charges` `{"withinDays":7}` | `GET /api/subscriptions/upcoming` items with `daysUntilCharge <= 7`: amount, currency, date |
  | Q3 | "How much would I save in 12 months if I cancel Netflix?" | `simulate_cancellation` `{"subscriptionNames":["Netflix"],"horizons":[12]}` | `POST /api/simulations` with Netflix's id: `selectedMonthly` and 12-month savings |
  | Q4 | "What does each use of Netflix cost this month?" | `get_cost_per_use` `{"subscriptionName":"Netflix","from":…,"to":…}` | `GET /api/subscriptions/{id}/cost-per-use?from=&to=`: `totalPaid`, `totalUses`, `costPerUse` |

  The demo checklist question "Which subscription has the highest declared cost per use?" is **replaced** by Q4: no
  tool compares cost per use across subscriptions, so the honest answer would be partial.
- **FR-2 Matrix test.** For each row, the test seeds owner A (two currencies, usage records for Q4), drives the
  endpoint with a scripted model that requests exactly that tool call, then calls the deterministic endpoint as the same
  owner and asserts that every figure equals it. The scripted model's final text deliberately states a **wrong**
  number; the test asserts the figures are unaffected.
- **FR-3 Manual run with the real provider (Groq).** The four questions are asked once through the API with the real
  provider and demo data. `docs/INSIGHTS-VERIFICATION.md` records, per question: status, tools used, whether the
  figures equal the deterministic endpoint, whether the prose matched the figures, and latency. Prose mismatches are
  recorded as findings, not hidden.
- **FR-4 Failure demonstrations (manual, real API).** Recorded with the exact configuration used:
  - Rate limit: six questions within 60 s → the sixth is `429` with `Retry-After`; the UI shows the countdown.
  - Timeout: `Insights__RequestTimeoutSeconds=5` with a provider call that cannot finish in time (real provider with
    `Insights__Provider__TimeoutSeconds` above the budget, or an unroutable `BaseUrl`) → `504 insights_timeout`.
  - Provider outage: invalid key → `502 insights_unavailable` and an `Error` log line without the key.
- **FR-5 Privacy boundary (backend README).** States exactly what is sent to the provider (system prompt, the question,
  tool definitions, tool results: subscription names, categories, amounts, currencies, dates, declared usage counts,
  assumptions), what is never sent (ids, owner `sub`, email, token, connection strings), what FlowTrim stores (nothing
  from Insights), what is logged (metrics only), and that free tiers may retain prompts, so only demo data is used.
- **FR-6 Demo checklist.** The Insights step lists Q1–Q4, one successful question with expanded evidence, and one
  controlled failure (unsupported question and rate limit), plus the privacy notice shown on the page.

## 4. Business rules
- `figures` are the authoritative numbers: built by the backend from tool results, never parsed from the model text.
- The model's prose is **not** verified or corrected. It is shown as an explanation under the label "Figures
  calculated by FlowTrim"; the documentation says this plainly.
- No real credentials or personal data in tests, docs or the manual run.

## 5. Acceptance criteria
- **AC-1:** Given the matrix test, then Q1–Q4 pass with figures equal to the deterministic endpoints for the same owner.
- **AC-2:** Given a scripted model whose final text contains a wrong amount, then the response figures still equal the
  deterministic endpoint (the wrong amount appears only in `answer`).
- **AC-3:** Given any Insights question, then no message sent to the model contains a subscription id (GUID), the
  owner `sub` or the bearer token.
- **AC-4:** Given an `answered` response, then its JSON has exactly `status`, `answer`, `figures`, `assumptions`,
  `sources`, `toolsUsed`; figures and assumptions have only their documented fields; there is no `id` anywhere.
- **AC-5:** `docs/INSIGHTS-VERIFICATION.md` records the Groq run of Q1–Q4 and the three failure demos with dates and
  results.
- **AC-6:** The backend README has the privacy section of FR-5 and the demo checklist reflects FR-6.

## 6. API contract
None changed. Tests use `POST /api/insights/questions`, `GET /api/summary`, `GET /api/subscriptions/upcoming`,
`POST /api/simulations` and `GET /api/subscriptions/{id}/cost-per-use`.

## 7. Data model changes
None.

## 8. Validation and error cases
Covered by HU-35 tests; this story only demonstrates them manually (FR-4).

## 9. Edge cases
- Mixed currencies in Q1: one pair of figures per currency, compared per currency.
- Q2 includes an overdue charge (negative days) and excludes one due in 8 days.
- Q4 uses a period with declared uses (calculable); the not-calculable case stays covered by HU-34/HU-35 tests.
- Groq may answer Q3/Q4 with different argument spelling (for example the name casing): the tools already match names
  case-insensitively; any mismatch is recorded as a finding.

## 10. UI states
None new. The manual run of FR-4 captures the HU-36 rate-limit state as evidence.

## 11. Test plan (xUnit, backend)
- `InsightsVerificationMatrixTests` (API level, in-memory repositories, scripted model): theory over Q1–Q4 →
  `Question_FiguresEqualDeterministicEndpoint`.
- `Question_ModelTextContradictsFigures_FiguresStayDeterministic` (AC-2).
- `Question_ModelRequests_ContainNoIdsOwnerOrToken` (AC-3): captures every `ChatRequest` and checks all message
  contents and tool arguments against a GUID pattern, the owner `sub` and the token.
- `Question_Answered_ResponseShapeMatchesContract` (AC-4).

## 12. Assumptions and open questions
- The manual Groq run uses at most about 15 requests (well inside the free tier).
- No open questions.

## 13. Task breakdown
- [ ] backend#52: matrix and contract tests (section 11), README privacy section.
- [ ] tracker#60: `docs/INSIGHTS-VERIFICATION.md`, E2E rows, demo checklist update.
