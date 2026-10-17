# HU-43: Define and Validate Subscription CSV Input

- **Status:** Draft
- **Priority:** P1
- **Epic:** EP-07
- **Dependencies:** HU-12

## Goal

Validate a bounded CSV representing expected subscriptions before anything is persisted.

## Acceptance criteria

- Required columns are `name`, `amount`, `currency`, `billingCycle`, `nextBillingDate`.
- Unsupported type, size and row count are rejected.
- Parsing rules for amounts, dates, currency and cycle are explicit.
- Errors contain row number, field and safe message/code.
- Preview never persists invalid rows.

## API contract

`POST /api/subscription-imports/preview` accepts multipart CSV and returns a typed preview.

## Data changes

None for a purely bounded preview; choose persisted expiring preview only if deployment requires it.

## Tests

`Preview_ValidCsv_ReturnsNoPersistence`, `Preview_InvalidAmount_ReturnsRowFieldError`, `Preview_TooManyRows_ReturnsPayloadTooLarge`.

## Tasks

- [ ] backend: parser and validation contract.
- [ ] tracker: sample CSV and format documentation.
