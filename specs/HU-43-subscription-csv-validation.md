# HU-43: Define and Validate Subscription CSV Input

- **Status:** Implemented _(approved 2026-10-19 by Ander, with EP-07 decisions D1–D6; delivered 2026-10-19)_
- **Story / Issue:** FlowTrim-tracker#71 · tasks: backend#57 (bounded CSV parser and validation contract),
  tracker#72 (CSV format documentation)
- **Priority:** P1
- **Epic:** EP-07
- **Dependencies:** HU-12 (owner), HU-52 (export format)
- **Author / Date:** Ander (with Claude) · 2026-10-19

## 1. Context and goal
Users who already track subscriptions in a spreadsheet should be able to bring them into FlowTrim. This story defines
the CSV format and validates a file **row by row before anything is persisted**, so the user can fix the file first.
Duplicates (HU-44), confirmation (HU-45) and the Angular screen (HU-46) come next.

## 2. Scope
**In scope**
- `POST /api/subscription-imports/preview`: multipart upload, file checks, CSV parsing, per-row validation, typed
  preview. Nothing is persisted.
- A hand-written RFC 4180 reader and a row validator in `Application/Imports`.
- Format documentation and a sample file in the tracker.

**Out of scope**
- Duplicate classification (HU-44), confirmation and persistence (HU-45), UI (HU-46).
- Bank statements, transactions, other delimiters or date formats, spreadsheets (`.xlsx`).

## 3. Functional requirements
- **FR-1 Endpoint:** `POST /api/subscription-imports/preview`, authenticated, `multipart/form-data` with one file in
  the field `file`. Antiforgery is disabled on this endpoint because the API authenticates with bearer tokens and never
  with cookies.
- **FR-2 File checks:** extension `.csv` (case-insensitive); not empty; at most 256 KB; valid UTF-8 (BOM optional).
- **FR-3 Header (D1):** first record; names trimmed and case-insensitive; any order. Missing required columns or a
  column repeated → file error. `monthly_equivalent` and unknown columns are ignored and listed in `ignoredColumns`.
- **FR-4 Records (D2):** comma delimiter, RFC 4180 quotes (doubled quotes, delimiters and line breaks inside quotes),
  CRLF or LF, optional final newline. Completely empty lines are skipped. A record with a different number of cells
  than the header is a row error. An unterminated quote is a file error with the line where it started. At most 500
  data rows.
- **FR-5 Field rules:**

  | Column | Rule | Error code |
  |---|---|---|
  | `name` | required, trimmed, at most 120 characters | `required`, `too_long` |
  | `category` | optional, trimmed, at most 60 characters | `too_long` |
  | `amount` | `^\d+(\.\d{1,2})?$`, greater than zero | `invalid_amount`, `amount_not_positive` |
  | `currency` | 3 letters, stored upper case | `invalid_currency` |
  | `billing_cycle` | `Monthly` or `Yearly`, case-insensitive | `invalid_billing_cycle` |
  | `next_billing_date` | `yyyy-MM-dd`, a real date (past dates allowed: they are overdue) | `invalid_date` |
  | `status` | optional, `Active` or `Inactive`, case-insensitive; default `Active` | `invalid_status` |

  All fields of a row are checked (every error is reported, not only the first). Text cells that start with an
  apostrophe followed by `= + - @` lose the apostrophe (undoes the exporter's formula guard). Domain invariants are
  enforced by the `Subscription` rules so the preview never accepts what creation would reject.
- **FR-6 Response 200:**
  ```json
  {
    "rows": [
      { "rowNumber": 2, "status": "valid", "values": { "name": "Netflix", "category": "Streaming", "amount": 38900,
        "currency": "COP", "billingCycle": "Monthly", "nextBillingDate": "2026-10-22", "status": "Active" }, "errors": [] },
      { "rowNumber": 3, "status": "invalid", "values": null,
        "errors": [{ "field": "amount", "code": "invalid_amount", "message": "Use a dot for decimals and no thousands separators." }] }
    ],
    "summary": { "total": 2, "valid": 1, "invalid": 1 },
    "ignoredColumns": ["monthly_equivalent"]
  }
  ```
  `rowNumber` is the spreadsheet row (the header is row 1). `values` is present only for valid rows.
- **FR-7 File errors:** `400` ProblemDetails with `code` (`file_required`, `unsupported_file_type`, `empty_file`,
  `invalid_encoding`, `missing_columns`, `duplicate_columns`, `malformed_csv`) and a safe `detail` (column names or the
  line number, never file content beyond that). `413` with `file_too_large` or `too_many_rows`.
- **FR-8 No persistence and no logging of content:** the preview never writes to the database; logs record only the
  row counts, never names or amounts.

## 4. Business rules
- Imported rows are **expected subscriptions**, not confirmed bank transactions.
- The rules are the same as creating a subscription by hand; the import adds format rules only.

## 5. Acceptance criteria
- **AC-1:** Given a valid CSV (including one exported by FlowTrim), when previewed, then every row is `valid` with
  normalized values and the database is unchanged.
- **AC-2:** Given rows with an invalid amount, currency, cycle, date or status, then each row reports every invalid
  field with its code and the spreadsheet row number.
- **AC-3:** Given a file that is not `.csv`, empty, over 256 KB or over 500 rows, then `400`/`413` with the documented
  code.
- **AC-4:** Given a header without `amount`, then `400 missing_columns` naming `amount`.
- **AC-5:** Given quoted cells with commas, doubled quotes and line breaks, a BOM, LF line endings and no final
  newline, then they are parsed correctly.
- **AC-6:** Given no token, then `401`.

## 6. API contract
`POST /api/subscription-imports/preview` → `200` preview (FR-6) · `400` / `413` ProblemDetails with `code` and
`correlationId` · `401`.

## 7. Data model changes
None (D4: stateless preview).

## 8. Validation and error cases
See FR-2 to FR-7. Over-limit bodies are cut by a request size limit on the endpoint and return `413`.

## 9. Edge cases
UTF-8 BOM; CRLF/LF; missing final newline; blank lines; trailing spaces in headers; a decimal comma inside a quoted
amount (`"38,9"` → `invalid_amount`); a past `next_billing_date` (valid, overdue); a name with an exporter apostrophe;
two rows with the same name (both valid here; HU-44 classifies duplicates).

## 10. UI states
None in this story (HU-46).

## 11. Test plan (xUnit)
- Reader: `Read_QuotedCellsWithCommasQuotesAndNewLines_ParsesThem`, `Read_BomLfAndNoFinalNewline_ParsesThem`,
  `Read_UnterminatedQuote_ReportsLine`.
- Validator: `Validate_ValidRow_NormalizesValues`, `Validate_InvalidFields_ReportsEveryError` (theory per rule),
  `Validate_ExportedFile_IsValid` (round trip with `SubscriptionCsvExporter`).
- API: `Preview_ValidCsv_ReturnsRowsWithoutPersistence`, `Preview_InvalidRows_ReturnsRowAndFieldErrors`,
  `Preview_WrongTypeOrEmpty_Returns400`, `Preview_TooLargeOrTooManyRows_Returns413`,
  `Preview_MissingColumn_ReturnsMissingColumns`, `Preview_WithoutToken_Returns401`.

## 12. Assumptions and open questions
- Depends on approving EP-07 decisions D1–D6 (especially D4, stateless preview).

## 13. Task breakdown
- [x] backend#57: reader, validator, endpoint, limits, tests (backend PR #84).
- [x] tracker#72: `docs/SUBSCRIPTION-CSV-FORMAT.md` and `docs/samples/subscriptions-sample.csv`.

## 14. Implementation notes
- `Application/Imports`: `CsvReader` (RFC 4180, spreadsheet row numbers, blank lines skipped but counted),
  `SubscriptionCsvImport` (header, per-field rules, limits), `PreviewSubscriptionImportHandler` (extension, 256 KB read
  with early stop, strict UTF-8, BOM). Endpoint in `Api/Imports/SubscriptionImportEndpoints.cs`, request body capped at
  1 MB (`RequestSizeLimitAttribute`), antiforgery disabled (bearer-only API).
- Codes beyond the FR-5 table: `required` (empty required cell) and `wrong_cell_count` (row cell count differs from the
  header, reported on field `row`).
- Shared instead of duplicated: `SubscriptionCsvFormat` (columns and formula guard, used by the exporter too),
  `Subscription.IsValidCurrencyFormat` (now public), domain length constants, `ProblemResults.WithCode` (also used by
  Insights).
- 44 new backend tests (372 fast); the sample file in `docs/samples` was checked against the real parser (4/4 valid).
