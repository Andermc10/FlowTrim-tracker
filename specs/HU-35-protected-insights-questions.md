# HU-35: Answer Protected Financial Questions

- **Status:** Draft
- **Priority:** P1
- **Epic:** EP-05
- **Dependencies:** HU-33, HU-34

## Goal

Provide one protected endpoint that answers bounded questions using only allow-listed financial tools.

## Acceptance criteria

- Non-empty questions within the maximum length are accepted.
- Only allow-listed tools can be selected.
- Responses contain answer, figures, assumptions and sources.
- Unsupported, empty-data, provider-failure and rate-limit states are safe.
- Conversations are not persisted in the MVP.

## API contract

`POST /api/insights/questions` with `{ "question": "..." }`; success 200; errors 400, 401, 429, 502 or 504.

## Data changes

None.

## Tests

`Question_WithSummary_ReturnsEvidence`, `Question_TooLong_ReturnsValidationProblem`, `ProviderFailure_ReturnsSafeGatewayError`, `Question_CannotAccessOtherOwner`.

## Tasks

- [ ] backend: DTOs, orchestration endpoint, limits and timeout mapping.
- [ ] backend: safe behavior tests.
