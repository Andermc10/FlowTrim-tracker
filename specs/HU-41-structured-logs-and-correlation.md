# HU-41: Add Structured Logs and Correlation Evidence

- **Status:** Draft
- **Priority:** P1
- **Epic:** EP-06
- **Dependencies:** HU-40

## Goal

Make production failures diagnosable without logging private financial or authentication data.

## Acceptance criteria

- Requests have a traceable correlation identifier.
- Logs include route, status, duration and safe failure category.
- Authorization headers, keys, prompts and response bodies are redacted.
- Health distinguishes API and database state.
- The runbook explains safe correlation lookup.

## Data/API changes

No database changes. A correlation header may be returned to clients.

## Tests

`Request_ReturnsCorrelationIdentifier`, `Exception_DoesNotLogBearerToken`, `Health_DatabaseFailureReturnsSafePayload`.

## Tasks

- [ ] backend: correlation and structured logging pipeline.
- [ ] tracker: operational evidence notes.
