# EP-07: Subscription Catalog Import

- **Status:** Draft
- **Story / Issue:** FlowTrim-tracker#EP-07 · stories: HU-43 to HU-46
- **Priority:** P1
- **Author / Date:** FlowTrim team / October 2026

## 1. Context and goal

Allow users to onboard recurring subscription records through a bounded, preview-first CSV flow without pretending to import confirmed bank transactions.

## 2. Scope

**In scope:** documented subscription CSV, row validation, preview, duplicate classification, confirmation and responsive UI.

**Out of scope:** bank statements, transaction history, payment reconciliation, automatic merchant detection and currency conversion.

## 3. Functional requirements

- FR-1: The input format is explicit and limited to the current subscription model.
- FR-2: Preview performs all parsing and domain validation before persistence.
- FR-3: Confirmation is owner-scoped, transactional and idempotent.
- FR-4: The UI makes expected renewals distinct from confirmed transactions.

## 4. Business rules

- Required columns: `name`, `amount`, `currency`, `billingCycle`, `nextBillingDate`.
- Amount must be greater than zero; billing cycle and currency must be supported.
- A duplicate is classified using documented owner-scoped matching fields.

## 5. Acceptance criteria

- AC-1: Given a valid CSV, when preview is requested, then valid rows and a summary are returned without persistence.
- AC-2: Given invalid rows, when preview is requested, then each error identifies row and field.
- AC-3: Given a valid preview, when confirmation occurs, then accepted rows are committed atomically for the current owner.
- AC-4: Given repeated confirmation, when the same preview is submitted, then no duplicate records are created.

## 6. API contract

| Method | Route | Request | Success | Errors |
|---|---|---|---|---|
| POST | `/api/subscription-imports/preview` | Multipart CSV | 200 preview | 400 / 401 / 413 |
| POST | `/api/subscription-imports/{id}/confirm` | Confirmation options | 200 import summary | 400 / 401 / 404 / 409 |

## 7. Data model changes

Prefer a bounded preview representation appropriate to the selected hosting environment. If persisted, use an expiring `subscription_import_previews` table with owner, hash, expiration and confirmation status. Migration: `AddSubscriptionImportPreviews`.

## 8. Validation and error cases

Reject unsupported extension, empty file, malformed headers, excess size/rows, invalid amount/date/cycle, expired preview and unauthorized confirmation.

## 9. Edge cases

Duplicate rows within one file, duplicate against existing owner data, culture-specific decimals, UTF-8 BOM, missing final newline and a database failure during confirmation.

## 10. UI states

File selection, preview loading, valid rows, invalid rows, duplicate rows, replacement, confirmation, success, expired preview and server error. The table must remain usable on mobile.

## 11. Test plan

- `Preview_ValidCsv_ReturnsRowsWithoutPersistence`.
- `Preview_InvalidRows_ReturnsRowAndFieldErrors`.
- `ConfirmPreview_CommitsAcceptedRowsAtomically`.
- `ConfirmPreview_RepeatedSubmission_IsIdempotent`.
- `ImportView_RendersResponsiveValidationStates`.

## 12. Assumptions and open questions

- Define delimiter, date format, decimal culture and duplicate policy before implementation.
- Choose in-memory or persisted preview based on deployment constraints.

## 13. Task breakdown

- [ ] backend: parser, preview and confirmation contracts.
- [ ] backend: owner scope, limits and transaction tests.
- [ ] frontend: file, table and confirmation flow.
- [ ] tracker: sample file and user documentation.

## 14. Implementation notes

To be completed after delivery.
