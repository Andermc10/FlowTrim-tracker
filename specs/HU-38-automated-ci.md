# HU-38: Run Automated CI for Backend and Frontend

- **Status:** Implemented _(2026-10-18; approved the same day by Ander)_
- **Story / Issue:** FlowTrim-tracker#62 · tasks: backend#53 (backend workflow), frontend#64 (frontend workflow)
- **Priority:** P0
- **Epic:** EP-06
- **Author / Date:** Ander (with Claude) · 2026-10-18

## 1. Context and goal
Today nothing runs automatically: builds and tests only run on the developer's machine, and pull requests
can be merged without any check (both `main` branches are unprotected). HU-12 showed why this matters:
two PRs were merged without verification. This story adds GitHub Actions CI to the backend and frontend
repositories so every pull request proves it builds and passes its tests before it can be merged.

## 2. Scope
**In scope:**
- `FlowTrim-backend/.github/workflows/ci.yml`: restore, Release build, xUnit tests.
- `FlowTrim-frontend/.github/workflows/ci.yml`: `npm ci` from the lockfile, unit tests, production build.
- Branch protection on `main` (backend and frontend) requiring the CI check to pass before merging.
- CI status badge in both READMEs; `docs/CI.md` in the tracker documenting workflows and required checks.

**Out of scope:**
- Deployment (HU-40), environment/CORS hardening (HU-39), logs (HU-41).
- PostgreSQL integration tests (HU-47) and browser E2E in CI (HU-48).
- Dependency/vulnerability scanning, Dependabot, code coverage gates, Sonar.
- CI for the tracker repository (documentation only).
- Fixing the pre-existing `NU1903` warning (transitive `Microsoft.OpenApi` 2.0.0) — recorded as tech debt.

## 3. Functional requirements
- **FR-1:** Each workflow runs on `pull_request` targeting `main`, on `push` to `main`, and manually
  (`workflow_dispatch`).
- **FR-2:** Backend job: `actions/setup-dotnet` with .NET `10.0.x`; `dotnet restore`;
  `dotnet build -c Release --no-restore`; `dotnet test -c Release --no-build`.
- **FR-3:** Frontend job: `actions/setup-node` with Node `22` and npm cache; `npm ci`;
  `npm test -- --watch=false`; `npm run build` (production configuration, the Angular default).
- **FR-4:** Any failing step fails the job (default shell behavior; no `continue-on-error`).
- **FR-5:** Least privilege: `permissions: contents: read`; no repository secrets are used or required.
- **FR-6:** A newer push to the same branch cancels the in-progress run (`concurrency` per ref);
  each job has a 15-minute timeout.
- **FR-7:** Branch protection on `main` in both repositories requires the CI job to pass. Reviews are not
  required (single maintainer); admins are not exempt so the rule also applies to the owner.

## 4. Business rules
- CI never needs Auth0, database credentials or any secret: backend HTTP tests use a fake authentication
  scheme and in-memory repositories; frontend tests use jsdom. If a future test needs a secret, it does
  not belong in this workflow.
- Logs must not print secrets, tokens, connection strings or personal data (none exist in CI).

## 5. Acceptance criteria
- **AC-1:** Given a pull request to `main` in the backend, when CI runs, then restore, Release build and
  all xUnit tests execute and the check reports success.
- **AC-2:** Given a pull request to `main` in the frontend, when CI runs, then `npm ci`, unit tests and the
  production build execute and the check reports success.
- **AC-3:** Given a commit with a failing test or a compile error, when CI runs, then the workflow fails and
  the pull request cannot be merged while the check is red.
- **AC-4:** Given the workflow logs, when they are inspected, then no secret, token, connection string or
  personal data appears.
- **AC-5:** Given the READMEs, when they are opened on GitHub, then a CI status badge is visible.

## 6. API contract
None.

## 7. Data model changes
None.

## 8. Validation and error cases
| Case | Expected result |
|---|---|
| A test fails | Job fails at the test step; PR merge blocked |
| Compile error / TypeScript error | Job fails at build (backend) or test/build (frontend); merge blocked |
| `package-lock.json` out of sync with `package.json` | `npm ci` fails; merge blocked |
| Workflow file has a syntax error | GitHub reports the workflow as invalid; the required check never passes |
| A newer commit is pushed while CI runs | Previous run is cancelled; the new run decides the check |

## 9. Edge cases
- `.npmrc` sets `legacy-peer-deps=true` (TD-001); `npm ci` honors it, so CI installs the same tree as local.
- Runner Node `22.x` differs from the local Node patch version; Angular 21 supports Node 22.12+.
- The `NU1903` warning appears in the backend log; warnings do not fail the build.
- Pull requests from forks get a read-only token; no secrets are exposed because none are used.

## 10. UI states
None (CI badge only).

## 11. Test plan
- Open each workflow in its own PR: the PR itself triggers the workflow → AC-1 / AC-2 green.
- Failure proof (AC-3): on a throwaway branch, push a commit with a deliberately failing test, confirm the
  run fails and the PR shows the merge blocked, then close the PR and delete the branch.
- Inspect the run logs for secrets (AC-4).
- Confirm branch protection with `gh api repos/<owner>/<repo>/branches/main/protection`.

## 12. Assumptions and open questions
- GitHub-hosted `ubuntu-latest` runners; public repositories, so Actions minutes are free.
- Actions are pinned to major versions (`@v4`), the common practice for a portfolio; SHA pinning and
  Dependabot updates are out of scope.
- No open questions.

## 13. Task breakdown
- [x] backend#53: `ci.yml`, README badge, branch protection on `main`.
- [x] frontend#64: `ci.yml`, README badge, branch protection on `main`.
- [x] tracker: `docs/CI.md` (workflows, required checks, how to read a failed run); `TECH-DEBT` note for `NU1903`.

## 14. Implementation notes
- Delivered in backend PR #65 and frontend PR #74; documentation in `docs/CI.md`. No deviation from the
  spec. Job names (`build-and-test`, `test-and-build`) are the required status checks.
- AC-1/AC-2: first runs green (120/120 backend tests; 38/38 frontend tests + production build); push runs
  on `main` green after merging.
- AC-3: failure-proof PRs backend #66 and frontend #75 (deliberately failing test) → check failed, merge
  state `BLOCKED`, `gh pr merge` rejected; closed without merging and branches deleted.
- AC-4: CI logs searched for connection strings, passwords, bearer tokens and client secrets — none.
- AC-5: badges added to both READMEs.
- Branch protection on `main` (both repos): required check, administrators included, no required reviews.
- The administrator bypass (`gh pr merge --admin`) was intentionally not attempted; `enforce_admins` is
  enabled and verified through the API.
