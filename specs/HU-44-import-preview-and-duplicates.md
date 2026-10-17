# HU-44: Preview Duplicates and Import Results

- **Status:** Draft
- **Priority:** P1
- **Epic:** EP-07
- **Dependencies:** HU-43

## Goal

Let the user understand valid, invalid and possible duplicate rows before confirmation.

## Acceptance criteria

- Preview returns a bounded identifier and does not persist accepted records.
- Rows are classified as valid, invalid or possible duplicate.
- Duplicate detection is scoped to the authenticated owner.
- Summary reports accepted, rejected and duplicate counts.
- Unconfirmed previews expire or are safely discarded.

## API contract

Uses `POST /api/subscription-imports/preview`; response includes `previewId`, `rows`, `summary` and `expiresAt` when applicable.

## Tests

`Preview_ExistingOwnerMatch_ClassifiesDuplicate`, `Preview_OtherOwnerRow_IsNotUsedForDuplicateDetection`, `Preview_ExpiredId_CannotBeConfirmed`.

## Tasks

- [ ] backend: preview state and duplicate classification.
- [ ] frontend: typed preview models.
