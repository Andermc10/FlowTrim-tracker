# HU-45: Confirm Owner-Scoped Subscription Import

- **Status:** Draft
- **Priority:** P1
- **Epic:** EP-07
- **Dependencies:** HU-44

## Goal

Persist accepted CSV rows atomically and idempotently for the authenticated owner.

## Acceptance criteria

- Only an unexpired preview owned by the current user can be confirmed.
- Accepted rows commit in one transaction or none commit.
- Duplicate behavior follows the documented user choice.
- Response reports created, skipped and failed counts.
- Repeated confirmation cannot duplicate rows.

## API contract

`POST /api/subscription-imports/{id}/confirm` returns an import summary; errors include 400, 401, 404 and 409.

## Data changes

If preview persistence is selected, use `subscription_import_previews` and `AddSubscriptionImportPreviews`.

## Tests

`ConfirmPreview_CommitsAcceptedRowsAtomically`, `ConfirmPreview_OtherOwner_ReturnsNotFound`, `ConfirmPreview_RepeatedRequest_IsIdempotent`, `ConfirmPreview_Failure_RollsBack`.

## Tasks

- [ ] backend: transaction, owner scope and idempotency.
- [ ] backend: rollback and authorization tests.
