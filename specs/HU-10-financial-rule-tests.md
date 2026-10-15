# HU-10: Automated tests for financial rules

- **Status:** Implemented _(2026-10-14; #21 deferred to HU-06, checklist in tracker docs, DB-integration harness deferred)_
- **Story / Issue:** FlowTrim-tracker#11 · tasks: backend#19 (monthly/annual), backend#20 (dates/windows), backend#21 (cost per use — blocked by HU-06), backend#22 (simulator), backend#23 (manual E2E acceptance)
- **Priority:** P0
- **Author / Date:** Ander (with Claude) · 2026-10-14

## 1. Context and goal
Guard the business rules against regressions with automated tests, and record a manual end-to-end
acceptance pass. Per the project's SDD, tests were written **alongside** each rule (HU-01..HU-09), so
this story consolidates and audits that coverage, fills any genuine gaps, and produces a repeatable
E2E acceptance checklist.

## 2. Scope
**In scope:**
- Audit the existing xUnit coverage of the financial/domain rules and add any missing edge cases:
  monthly/yearly normalization, annual projection, days-until-charge and alert windows, simulator
  savings, invalid amounts, empty lists, inactive services, mixed currencies, rounding.
- Author a **manual E2E acceptance checklist** (`FlowTrim-tracker/docs/E2E-ACCEPTANCE.md`) covering the
  main flows (create/list/edit/delete, summary, upcoming, simulator, error handling, CORS) and record a run.
- Keep `dotnet test` green; tests use no personal data or real credentials.

**Out of scope / blocked:**
- **Cost-per-use tests (backend#21)** depend on **HU-06**, which is not implemented — this task stays
  **open** and is delivered with HU-06. (HU-10 depends on HU-06 in the backlog.)
- A full DB-integration test harness (WebApplicationFactory / Testcontainers) — optional; see Q3.

## 3. Functional requirements
- **FR-1:** Automated tests exist for monthly/annual normalization and annual projection (HU-03).
- **FR-2:** Automated tests exist for days-until-charge and the alert windows (HU-04).
- **FR-3:** Automated tests exist for the simulator savings (HU-07).
- **FR-4:** Edge cases are covered: invalid amounts, empty lists, inactive services, mixed currencies, rounding.
- **FR-5:** `dotnet test` runs all of them; no test needs personal data or real credentials.
- **FR-6:** A manual E2E acceptance checklist exists and has a recorded run.
- **FR-7 (deferred):** Cost-per-use edge cases (zero uses, no records, multiple periods) — with HU-06.

## 4. Business rules
No new rules. This verifies the rules defined in CLAUDE.md §5 and implemented in HU-03/04/07
(and HU-06 later).

## 5. Acceptance criteria
- **AC-1:** Tests cover monthly/yearly normalization, annual projection, dates/alert windows and simulator savings.
- **AC-2:** Edge cases covered: invalid amounts, empty lists, inactive services, mixed currencies, rounding.
- **AC-3:** `dotnet test` passes locally and the count is reported.
- **AC-4:** No test uses real credentials or personal data.
- **AC-5:** `docs/E2E-ACCEPTANCE.md` lists the main-flow manual checks with a recorded pass.
- **AC-6 (deferred):** Cost-per-use tests land with HU-06 (backend#21 stays open until then).

## 6. API contract
None (testing story).

## 7. Data model changes
None.

## 8. Validation and error cases
Covered by the audited tests (domain invariants → `400`, unknown → `404`, unexpected → `500` already
verified in HU-09) and recorded in the E2E checklist.

## 9. Edge cases
The audit confirms (or adds) tests for: yearly rounding to 2 decimals; projection with no active items;
summary/simulator with empty input; inactive exclusion; mixed-currency grouping with no cross-sum;
alert-window boundaries (−1/0/1/3/4/7/8).

## 10. UI states (frontend)
N/A (backend/testing story). The E2E checklist exercises the UI states manually.

## 11. Test plan
- **Audit** the current suite (currently 68 backend xUnit tests) against the §5/§9 list; add any missing
  edge case as a focused test.
- **Author & run** `docs/E2E-ACCEPTANCE.md`: create → appears in list; edit → persists; delete → gone;
  summary totals per currency; upcoming windows/order; simulator savings + empty selection; invalid
  input → `400`; unknown id → `404`; forced error → `500` without detail; CORS from `:4200`.
- **Defer** cost-per-use tests to HU-06.

## 12. Assumptions and open questions
- **Q1 — Cost per use (backend#21):** keep it **open**, delivered with HU-06 (HU-10 depends on HU-06).
  Close `#19/#20/#22/#23` now; `#21` later. OK? *(proposed: yes)*
- **Q2 — E2E checklist location:** `FlowTrim-tracker/docs/E2E-ACCEPTANCE.md` *(proposed)* vs the backend README.
- **Q3 — DB-integration tests:** add a WebApplicationFactory/Testcontainers harness now, or defer to
  HU-11/post-MVP? *(proposed: defer; the rules are pure-domain and already unit-tested, and live E2E runs
  were recorded per story.)*
- **A1:** Most coverage already exists (written per story); this story mostly audits + adds gaps + the checklist.

## 13. Task breakdown
- [ ] backend#19 — Audit/confirm monthly-annual + projection tests; add gaps.
- [ ] backend#20 — Audit/confirm dates + alert-window tests; add gaps.
- [ ] backend#22 — Audit/confirm simulator-savings tests; add gaps.
- [ ] backend#23 — Author + run `docs/E2E-ACCEPTANCE.md`.
- [ ] backend#21 — **(blocked by HU-06)** cost-per-use tests — stays open.

## 14. Implementation notes (filled after delivery)
Delivered on 2026-10-14. Backend PR `FlowTrim-backend#38` (closes #19/#20/#22); E2E checklist in this
repo (`docs/E2E-ACCEPTANCE.md`, closes `FlowTrim-backend#23`). `#21` (cost per use) stays **open**,
blocked by HU-06.

- Audit confirmed the rules were already covered per story; added two gaps in `SummaryCalculator`
  (round-per-item annual `99999.96`; currency with only inactive not listed). **70** backend tests green.
- `docs/E2E-ACCEPTANCE.md` records a full main-flow pass (health, CRUD, summary, upcoming, simulator,
  error handling, CORS, frontend) dated 2026-10-14; cost-per-use row marked pending HU-06.
- DB-integration harness deferred (rules are pure-domain, already unit-tested; live E2E runs recorded).
