# HU-37: Verify Insights Evidence and Limits

- **Status:** Draft
- **Priority:** P1
- **Epic:** EP-05
- **Dependencies:** HU-35, HU-36

## Goal

Make the AI capability demonstrably controlled rather than a generic chatbot.

## Acceptance criteria

- Four representative questions have documented expected tool evidence.
- Deterministic values remain authoritative over generated prose.
- Timeout, provider failure and rate limit are demonstrated.
- Privacy boundaries and sent fields are documented.
- A successful and failed scenario exist in the demo checklist.

## Data and API changes

No additional persistence.

## Tests

Contract tests for response shape, limits, fake provider behavior and tool provenance.

## Tasks

- [ ] backend: verification matrix and contract tests.
- [ ] tracker: privacy and demo documentation.
