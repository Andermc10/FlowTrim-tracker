# HU-38: Run Automated CI for Backend and Frontend

- **Status:** Draft
- **Priority:** P0
- **Epic:** EP-06
- **Dependencies:** MVP v1.0

## Goal

Prevent regressions before merge or deployment.

## Acceptance criteria

- Backend workflow runs restore, build and xUnit tests.
- Frontend workflow installs from the lockfile, tests and builds production output.
- Failed tests or builds fail the workflow.
- Logs do not expose secrets or personal data.

## Data/API changes

None.

## Tests

Validate workflow syntax and execute both workflows against the current branches.

## Tasks

- [ ] backend: `.github/workflows/ci.yml`.
- [ ] frontend: `.github/workflows/ci.yml`.
- [ ] tracker: document required checks.
