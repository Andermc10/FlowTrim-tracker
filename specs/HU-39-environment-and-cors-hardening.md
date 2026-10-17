# HU-39: Harden Environment Configuration and CORS

- **Status:** Draft
- **Priority:** P0
- **Epic:** EP-06
- **Dependencies:** HU-12, HU-38

## Goal

Separate local and production configuration without exposing credentials or opening the API broadly.

## Acceptance criteria

- Database, identity, AI and origins are environment-backed.
- Missing required production configuration fails safely.
- Production CORS allows only the deployed frontend and `Authorization`.
- `.env.example` and User Secrets instructions contain placeholders only.
- Tokens, connection strings, prompts and keys are not logged.

## Data/API changes

No database changes. CORS applies to existing API routes.

## Tests

`ProductionConfiguration_MissingSecret_FailsSafely`, `Cors_UnknownOrigin_IsRejected`, `Cors_BearerPreflight_IsAllowed`.

## Tasks

- [ ] backend: options validation, CORS and redaction review.
- [ ] frontend: environment API URL and public identity configuration.
