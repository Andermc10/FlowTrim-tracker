# EP-08: Integration and Portfolio Evidence

- **Status:** Draft
- **Story / Issue:** FlowTrim-tracker#EP-08 · stories: HU-47 to HU-49
- **Priority:** P0
- **Author / Date:** FlowTrim team / October 2026

## 1. Context and goal

Provide reproducible evidence that FlowTrim 2.0 works across PostgreSQL, the API, Angular and the deployed browser experience.

## 2. Scope

**In scope:** database-backed integration tests, cross-user security scenarios, browser smoke flow and release readiness review.

**Out of scope:** arbitrary load testing, formal penetration testing and claims unsupported by measurements.

## 3. Functional requirements

- FR-1: Tests use real migrations and an isolated PostgreSQL boundary.
- FR-2: Critical security scenarios are automated.
- FR-3: Browser checks verify the public demo journey.
- FR-4: Release documentation matches actual implementation.

## 4. Business rules

Tests use synthetic users and data only. Test cleanup must not touch a developer’s persistent database.

## 5. Acceptance criteria

- AC-1: Given CI, when integration tests run, then migrations and owner filters are verified.
- AC-2: Given two synthetic users, when one accesses the other’s resource, then access is rejected.
- AC-3: Given the demo environment, when the smoke flow runs, then login, workspace and Insights are usable.
- AC-4: Given a release candidate, when the checklist is reviewed, then all P0 evidence is present.

## 6. API contract

No new public API. Tests exercise existing contracts, including authentication, Insights, health and import routes.

## 7. Data model changes

None beyond feature migrations.

## 8. Validation and error cases

Fail the release when a P0 test, build, migration, health check or documentation consistency check fails.

## 9. Edge cases

CI database startup delay, stale migrations, expired demo session, provider quota exhaustion and browser route fallback.

## 10. UI states

Browser evidence must include protected route, empty/loaded workspace, Insights success and one controlled error.

## 11. Test plan

- PostgreSQL API integration suite.
- Browser smoke suite.
- Manual release checklist reviewed against code and environment.

## 12. Assumptions and open questions

- Confirm the browser automation tool and hosting test-account strategy.

## 13. Task breakdown

- [ ] backend: PostgreSQL integration harness.
- [ ] frontend: authenticated browser smoke flow.
- [ ] tracker: release evidence and notes.

## 14. Implementation notes

To be completed after delivery.
