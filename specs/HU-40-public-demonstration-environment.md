# HU-40: Deploy the Public Demonstration Environment

- **Status:** Draft
- **Priority:** P0
- **Epic:** EP-06
- **Dependencies:** HU-12, HU-38, HU-39

## Goal

Provide a working public environment that a recruiter can open without reproducing the local stack.

## Acceptance criteria

- Frontend, API and PostgreSQL run in a documented hosting arrangement.
- Migrations are applied explicitly.
- Demo data is synthetic or onboarding is empty and safe.
- Health checks and logs diagnose startup/database failures safely.
- Deployment is repeatable from documented repository steps or CI.

## Data/API changes

Uses existing deployment and migration contracts; no new public endpoint beyond health.

## Tests

Deployment smoke test, migration check, restart check and frontend route fallback check.

## Tasks

- [ ] backend: deploy API/database and verify persistence.
- [ ] frontend: deploy Angular production build.
- [ ] tracker: operational runbook.
