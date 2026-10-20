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

### Proposed decisions (2026-10-19, pending approval with HU-43)
- **D1 Format = the HU-52 export format**, so an exported file can be imported again: header row required, column
  names case-insensitive and in any order. Required: `name`, `amount`, `currency`, `billing_cycle`,
  `next_billing_date`. Optional: `category`, `status` (default `Active`). `monthly_equivalent` is accepted and ignored
  (it is computed, never trusted). Other columns are ignored and reported. This replaces the camelCase column names
  of section 4.
- **D2 Parsing:** comma delimiter, RFC 4180 quoting, UTF-8 with or without BOM, CRLF or LF, optional final newline.
  Amount uses a dot as decimal separator, at most 2 decimals, no thousands separators or currency symbols. Dates
  `yyyy-MM-dd`. Currency 3 letters (stored upper case). `billing_cycle` `Monthly`/`Yearly` and `status`
  `Active`/`Inactive`, case-insensitive. Text is trimmed; the apostrophe that the exporter adds before a formula
  character is removed. Field rules are the domain rules (`Subscription`), not a copy.
- **D3 Limits:** `.csv` only, at most 256 KB and 500 data rows (`413` above them).
- **D4 Stateless preview (recommended):** preview persists nothing and returns no id. Confirmation (HU-45) sends the
  same file again; the server re-validates and creates only valid, non-duplicate rows in one transaction. Repeating
  the confirmation creates nothing because the rows are now duplicates, so it is idempotent without a previews table,
  works on free hosting that sleeps or restarts, and removes the "expired preview" states. Alternative: an expiring
  `subscription_import_previews` table (migration, clean-up, expiry UI).
- **D5 Duplicate policy:** a row is a duplicate when the owner already has a subscription (active or inactive) with
  the same name (trimmed, case-insensitive) and currency, or an earlier row of the same file has them. Duplicates are
  never created; updating existing subscriptions is out of scope.
- **D6 Parser:** hand-written in `Application/Imports`, like the exporter; no new dependency.
- HU-44 to HU-46 specs are refined with these decisions when each story starts.

## 13. Task breakdown

- [ ] backend: parser, preview and confirmation contracts.
- [ ] backend: owner scope, limits and transaction tests.
- [ ] frontend: file, table and confirmation flow.
- [ ] tracker: sample file and user documentation.

## 14. Implementation notes

To be completed after delivery.
