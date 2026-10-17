# EP-06: CI/CD, Public Delivery and Observability

- **Status:** Draft
- **Story / Issue:** FlowTrim-tracker#EP-06 · stories: HU-38 to HU-42
- **Priority:** P0
- **Author / Date:** FlowTrim team / October 2026

## 1. Context and goal

Make FlowTrim reproducible, testable and accessible through a safe public demonstration environment.

## 2. Scope

**In scope:** GitHub Actions, builds and tests, environment validation, CORS, deployment, health checks, structured logs and demo documentation.

**Out of scope:** Kubernetes, distributed tracing platform, service mesh and multi-region deployment.

## 3. Functional requirements

- FR-1: Pull requests verify backend and frontend.
- FR-2: Production configuration uses managed secrets.
- FR-3: The deployed service exposes safe API/database health.
- FR-4: A recruiter can follow a documented demo path.

## 4. Business rules

- Never log secrets, bearer tokens, connection strings, full private prompts or private response bodies.
- Production CORS must be explicit and must allow `Authorization` where required.

## 5. Acceptance criteria

- AC-1: Given a pull request, when CI runs, then backend tests, frontend tests and production builds execute.
- AC-2: Given missing production configuration, when the API starts, then it fails clearly without printing secret values.
- AC-3: Given a healthy deployment, when `/api/health` is requested, then API and database status are reported safely.
- AC-4: Given the demo URL, when a recruiter follows the README, then the main flow is reproducible.

## 6. API contract

| Method | Route | Request | Success | Errors |
|---|---|---|---|---|
| GET | `/api/health` | None | 200 healthy payload | 503 database unavailable |

## 7. Data model changes

None required beyond migrations already owned by feature stories.

## 8. Validation and error cases

Workflow failures must fail the job. Runtime failures must expose a safe category, correlation identifier and health state, not infrastructure internals.

## 9. Edge cases

Database restart, invalid CORS origin, expired provider configuration, cold start and missing environment variable.

## 10. UI states

Frontend must show API unavailable, unauthorized, retry and deployment configuration errors without exposing secrets.

## 11. Test plan

- CI workflow validation.
- `Health_WhenDatabaseUnavailable_ReturnsServiceUnavailable`.
- Production configuration smoke test.
- Browser smoke test against deployed or reproducible local environment.

## 12. Assumptions and open questions

- Select hosting provider before deployment work.
- Decide whether the demo requires a seeded account or self-service registration.

## 13. Task breakdown

- [ ] backend: CI, runtime config, health and logs.
- [ ] frontend: CI and production deployment configuration.
- [ ] tracker: demo and operational documentation.

## 14. Implementation notes

To be completed after delivery.
