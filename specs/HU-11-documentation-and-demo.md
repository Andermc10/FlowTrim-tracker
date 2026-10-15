# HU-11: Documentation and reproducible demo

- **Status:** Implemented _(2026-10-15; #27 public deploy deferred and left open)_
- **Story / Issue:** FlowTrim-tracker#12 · tasks: backend#24 (quality/security review), backend#25 (backend README), backend#26 (release tag + future work), backend#27 (optional public deploy), frontend#12 (frontend README + screenshots)
- **Priority:** P0
- **Author / Date:** Ander (with Claude) · 2026-10-14

## 1. Context and goal
A recruiter or developer should be able to understand, run and evaluate FlowTrim from the READMEs:
the problem, the features, the real architecture and stack, how to run it locally, how secrets are
configured (without exposing values), the main endpoints, screenshots, and honest known limitations.
Pending features must never be presented as finished.

## 2. Scope
**In scope:**
- **Backend README** (`#25`): problem + features + architecture (layers, dependency rule) + real stack,
  local run (DB, secrets, migrations), the main endpoints (already partly documented), and known
  limitations. Consolidate what HU-01..10 added.
- **Frontend README** (`#12`): install, run, the per-environment `apiUrl` config, the routes/features,
  and **screenshots** captured from the running app.
- **Quality/security self-review** (`#24`): a `docs/RELEASE-REVIEW.md` checklist (secrets out of Git,
  CORS not open, no error leakage, input validation, auth as a documented limitation) with results.
- **Initial release** (`#26`): an annotated tag (proposed `v0.1.0`) on backend and frontend, plus a
  "future work / known limitations" section.
- Honest status: P1/post-MVP items (usage/cost-per-use, auth, deploy) are listed as pending, not done.

**Out of scope / deferred:**
- **Public deploy (`#27`)** — optional; no hosting provider decided (CLAUDE.md §13). Deliver a
  reproducible local guide and keep `#27` open as a future task.
- A deeper external security audit — the repo has a dedicated `security-review` agent the user can run
  (`/security-review`); this story does a documented self-review, not that agent (not auto-spawned).

## 3. Functional requirements
- **FR-1:** The backend README covers problem, features, architecture and the real stack.
- **FR-2:** Both READMEs include local install/run instructions.
- **FR-3:** Secret configuration is documented without publishing sensitive values.
- **FR-4:** Main endpoints, screenshots and known limitations are included.
- **FR-5:** Pending/P1/post-MVP features are clearly marked as not done.
- **FR-6:** An initial release tag exists; future work is recorded.

## 4. Business rules
None (documentation story). Honesty principle (CLAUDE.md §1) governs the wording.

## 5. Acceptance criteria
- **AC-1:** Backend README describes the problem, features, architecture and real stack.
- **AC-2:** Both READMEs give working local install/run steps (API `http` profile, `ng serve`, Docker DB).
- **AC-3:** Secret setup (User Secrets / env vars, `.env.example`) is documented with no real values.
- **AC-4:** The main endpoints are listed; the frontend README embeds screenshots; known limitations are listed.
- **AC-5:** Pending features (usage, cost per use, auth, public deploy) are shown as pending, not finished.
- **AC-6:** An annotated `v0.1.0` tag exists on backend and frontend; `docs/RELEASE-REVIEW.md` records the review.

## 6. API contract
None. The backend README consolidates the existing endpoint documentation.

## 7. Data model changes
None.

## 8. Validation and error cases
N/A (docs). The release review verifies no secrets/stack traces are exposed (already enforced in HU-09).

## 9. Edge cases
- Screenshots must contain only sample data (no personal data) — the local DB holds sample rows only.
- The READMEs must not drift from reality; they describe what is actually implemented today.

## 10. UI states (frontend)
N/A. Screenshots capture the existing states (list, summary, upcoming, simulator).

## 11. Test plan
No automated tests. Verification is: both READMEs are accurate and runnable; screenshots render; the
release-review checklist is complete; the tag exists; `dotnet test`/`npm test`/`npm run build` still pass.

## 12. Assumptions and open questions
- **Q1 — Screenshots:** capture `list`, `summary`, `upcoming`, `simulator` from the running app
  (headless browser) and commit PNGs under `FlowTrim-frontend/docs/screenshots/`, embedded in the README
  *(proposed)*.
- **Q2 — Quality/security review (#24):** a documented `docs/RELEASE-REVIEW.md` self-review checklist
  *(proposed)*; the dedicated `/security-review` agent is offered separately (not auto-run).
- **Q3 — Release tag (#26):** annotated `v0.1.0` on backend and frontend + a "future work" section
  *(proposed; confirm the version)*. GitHub Release optional.
- **Q4 — Public deploy (#27):** defer (no provider decided); keep `#27` open as a future task *(proposed)*.

## 13. Task breakdown
- [ ] backend#25 — Round out the backend README (problem/features/architecture/stack/limitations).
- [ ] frontend#12 — Frontend README (install, API config, routes) + screenshots.
- [ ] backend#24 — `docs/RELEASE-REVIEW.md` quality/security self-review.
- [ ] backend#26 — Annotated `v0.1.0` tag (backend + frontend) + future-work notes.
- [ ] backend#27 — **(deferred)** public deploy — stays open as a future task.

## 14. Implementation notes (filled after delivery)
Delivered on 2026-10-15. Backend PR `FlowTrim-backend#39` (closes #24/#25); frontend PR
`FlowTrim-frontend#21` (closes #12); `#26` closed directly (tag + releases). `#27` (public deploy)
stays **open**, deferred.

- Backend README rounded out (features, architecture, limitations); `docs/RELEASE-REVIEW.md` self-review.
- Frontend README rewritten with per-environment API config, routes and **4 screenshots** captured live.
- Annotated tag `v0.1.0` + GitHub Releases on backend and frontend, with future-work notes.
- All MVP **P0** stories are now complete. Remaining: P1 HU-05/HU-06 (and backend#21 cost-per-use tests),
  plus deferred public deploy (#27) and post-MVP HU-12+.
