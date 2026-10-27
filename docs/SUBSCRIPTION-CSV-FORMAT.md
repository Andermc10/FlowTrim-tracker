# Subscription CSV Format (EP-07 / HU-43, HU-44; EP-11 / HU-56, HU-58)

FlowTrim imports **expected subscriptions** from a CSV file. It does not import bank statements or confirmed
payments. The format is the same one FlowTrim exports (`GET /api/reports/subscriptions.csv`), so an exported file can
be imported again. Sample: [`samples/subscriptions-sample.csv`](samples/subscriptions-sample.csv).

## File

| Rule | Value |
|---|---|
| Extension | `.csv` |
| Size | at most 256 KB |
| Rows | at most 500 data rows (the header does not count) |
| Encoding | UTF-8, with or without BOM (Excel's "CSV UTF-8" works) |
| Delimiter | comma `,` or semicolon `;` (see [Spreadsheet files](#spreadsheet-files)) |
| Separator line | optional first line `sep=,` or `sep=;`; it sets the delimiter and is not a row (the header is still row 1) |
| Quotes | RFC 4180: wrap a cell in `"` to include commas, line breaks or quotes; write a quote as `""` |
| Line endings | CRLF or LF; the final line break is optional; blank lines are skipped |

## Columns

The first row is the header. Names ignore case and surrounding spaces, and columns can be in any order.

| Column | Required | Rule | Example |
|---|---|---|---|
| `name` | Yes | text, at most 120 characters | `Netflix` |
| `amount` | Yes | greater than zero; dot for decimals (at most 2; comma also accepted in `;` files); no thousands separators or currency symbols | `38900`, `16.99` |
| `currency` | Yes | 3-letter ISO 4217 code (any case, stored upper case) | `COP` |
| `billing_cycle` | Yes | `Weekly`, `Biweekly` (every 14 days), `Monthly`, `Quarterly` or `Yearly` (any case) | `Monthly` |
| `next_billing_date` | Yes | `yyyy-MM-dd` (also `dd/MM/yyyy` in `;` files); today or later in the product calendar (America/Bogota) | `2026-11-05` |
| `category` | No | text, at most 60 characters | `Streaming` |
| `status` | No | `Active` or `Inactive` (any case); default `Active` | `Active` |
| `kind` | No | `Subscription` or `Bill` (any case); default `Subscription` | `Bill` |
| `payment_url` | No | absolute `https://` address, at most 500 characters, no user name or password | `https://pay.example.com` |

`monthly_equivalent` (written by the export) is accepted and **ignored**: FlowTrim always recalculates it. The export
writes `kind` and `payment_url` after `status`; the default account and category of a recurring payment are not part of
the file. Any other
column is ignored and listed in the preview as `ignoredColumns`. Cells that the export protected against spreadsheet
formulas (a leading `'` before `=`, `+`, `-` or `@`) are restored to their original text.

## Spreadsheet files

Excel with Spanish (Colombia) regional settings saves CSV files with `;` between columns, a decimal comma and
`dd/MM/yyyy` dates. FlowTrim accepts those files as they are:

- The delimiter comes from the `sep=` line when present; otherwise a header with `;` and no `,` means `;`.
- In `;` files the amount may use a comma for decimals (`16,99`) and the date may be `dd/MM/yyyy` (`05/11/2026`).
  `yyyy-MM-dd` and dot decimals keep working.
- In `,` files the strict rules above apply (dot decimals, `yyyy-MM-dd`).

The export and the template in the app start with `sep=,`, so Excel splits the columns in any regional setting.

## Preview

`POST /api/subscription-imports/preview` (multipart, field `file`) validates the file and **saves nothing**. Each
row comes back with its spreadsheet row number (the header is row 1), a status, the normalized values of valid and
duplicate rows and every error of invalid rows:

| Status | Meaning |
|---|---|
| `valid` | will be created on confirmation |
| `invalid` | has at least one error (below) |
| `duplicate` | same name (ignoring case and surrounding spaces, not accents) and currency as a subscription you already have, active or inactive (`duplicateOf: "existing"`), or as an earlier valid row of the file (`duplicateOf: "file"`, `duplicateOfRow`); never created |

The same name in another currency is not a duplicate. `summary` has `total`, `valid`, `invalid` and `duplicate`, and
`total = valid + invalid + duplicate`.

Row error codes:

| Code | Field | Meaning |
|---|---|---|
| `required` | any required column | the cell is empty |
| `too_long` | `name`, `category` | longer than 120 / 60 characters |
| `invalid_amount` | `amount` | not digits with an optional dot and up to 2 decimals (`38.900`, `38,9`, `$100` are rejected) |
| `amount_not_positive` | `amount` | zero |
| `invalid_currency` | `currency` | not 3 letters |
| `invalid_billing_cycle` | `billing_cycle` | not one of the five cycles |
| `invalid_date` | `next_billing_date` | not a real date in `yyyy-MM-dd` (or `dd/MM/yyyy` in `;` files) |
| `date_in_past` | `next_billing_date` | earlier than today (America/Bogota) |
| `invalid_status` | `status` | not `Active` or `Inactive` |
| `invalid_kind` | `kind` | not `Subscription` or `Bill` (instalment plans cannot be imported; the file has no instalment counts) |
| `invalid_payment_url` | `payment_url` | not an `https://` address, too long, or with a user name or password |
| `wrong_cell_count` | `row` | the row has a different number of cells than the header |

Problems with the whole file return `400` (`file_required`, `unsupported_file_type`, `empty_file`,
`invalid_encoding`, `unsupported_delimiter` (a `sep=` line with anything other than `,` or `;`), `missing_columns`,
`duplicate_columns`, `malformed_csv`) or `413` (`file_too_large`,
`too_many_rows`).

## Confirm

`POST /api/subscription-imports/confirm` takes **the same file again** (nothing is kept between the two calls),
repeats every check above against your data at that moment and creates the rows that are still `valid`, all in one
transaction: either all of them are created or none. `invalid` and `duplicate` rows are skipped. The response is

```json
{ "total": 4, "created": 2, "invalid": 1, "duplicate": 1 }
```

Confirming the same file twice is safe: the second time every row is already a duplicate and `created` is `0`. The
file errors and status codes are the same as the preview.

## In the app

Workspace → Subscriptions → **Import CSV** (`/app/subscriptions/import`) checks the file, shows the preview row by
row, confirms with the same file and offers a template to download (header plus four example rows whose dates
are computed from today, so the template always previews as valid).
