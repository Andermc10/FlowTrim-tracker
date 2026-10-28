# HU-49: Complete FlowTrim 2.0 Release Readiness Review

- **Status:** In review _(2026-10-28: every criterion met locally except the deployed demo health check, blocked by HU-40)_
- **Priority:** P0
- **Epic:** EP-08
- **Dependencies:** EP-04, EP-05, EP-06, HU-47, HU-48

## Goal

Release FlowTrim 2.0 only when implementation, tests, deployment and documentation agree.

## Acceptance criteria

- Every P0 criterion is checked against code and environment.
- Backend, frontend and tracker docs describe the same routes and limitations.
- No secrets, personal data or misleading claims remain.
- CI is green and demo health is healthy.
- Release notes list implemented and deferred work.

## Data/API changes

None.

## Tests

Run the release checklist, all backend/frontend tests, production builds, integration tests and browser smoke flow.

## Tasks

- [ ] tracker: review P0 evidence and reconcile documentation.
- [ ] tracker: prepare release notes and deferred roadmap.

## Implementation notes

- Checklist and release notes: `docs/RELEASE-NOTES-3.0.md` (tests, lint, build, e2e, secrets scan, dependency audit,
  docs consistency, implemented and deferred work).
- Open: "demo health is healthy" needs a deployed environment (HU-40). No tag or GitHub Release created without the
  owner's OK.
