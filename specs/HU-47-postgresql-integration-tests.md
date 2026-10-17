# HU-47: Add Database-Backed Integration Tests

- **Status:** Draft
- **Priority:** P0
- **Epic:** EP-08
- **Dependencies:** HU-12

## Goal

Verify migrations, PostgreSQL constraints, API behavior and owner isolation beyond in-memory unit tests.

## Acceptance criteria

- Tests use an isolated disposable PostgreSQL boundary or CI service.
- Real migrations and constraints are applied.
- API boundary covers CRUD, summary, upcoming, usage and simulation.
- Two-user isolation and anonymous rejection are automated.
- Tests use synthetic data and no real provider credentials.

## Data/API changes

No production changes. Test configuration must use a separate database.

## Tests

The story is complete when the integration suite runs locally and in CI repeatably.

## Tasks

- [ ] backend: PostgreSQL test harness and migration setup.
- [ ] backend: owner and regression cases.
