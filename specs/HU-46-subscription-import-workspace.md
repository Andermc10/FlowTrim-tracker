# HU-46: Subscription Import Workspace Flow

- **Status:** Draft _(pending approval)_
- **Story / Issue:** FlowTrim-tracker#75 · tasks: frontend#67 (typed preview models, from HU-44), frontend#68 (preview
  and confirmation UI), frontend#69 (UX states and accessibility tests)
- **Priority:** P1
- **Epic:** EP-07
- **Dependencies:** HU-43, HU-44, HU-45 (API), HU-53 (toasts), HU-25 (localization)
- **Author / Date:** Ander (with Claude) · 2026-10-20

## 1. Context and goal
The import API is complete: `POST /api/subscription-imports/preview` (nothing saved) and
`POST /api/subscription-imports/confirm` (same file again, valid rows created in one transaction). This story gives
the user a screen to pick a CSV, review every row before anything is saved, and confirm. With D4 there is no stored
preview, so the earlier "expired preview" state no longer exists: the page keeps the chosen file in memory and sends
it again on confirmation.

## 2. Scope
**In scope**
- Lazy route `/app/subscriptions/import`, opened from an **Import CSV** button in the subscriptions list header and
  from the list empty state.
- File picker (native `<input type="file" accept=".csv">`, keyboard and screen-reader friendly), client pre-checks,
  preview table, summary, confirmation, result.
- Format help on the page: required and optional columns, and a **Download template** button that builds a small CSV
  in the browser (header + one example row, no request).
- English and Spanish texts; translated messages for every row and file error code.

**Out of scope**
- Drag and drop, editing rows in the browser, choosing which valid rows to import, importing duplicates (D5).
- Any backend change.

## 3. Functional requirements
- **FR-1 Pick:** choosing a file runs client pre-checks (extension `.csv`, size at most 256 KB, not empty). A failed
  pre-check shows the same translated message the server would give and sends no request. The backend stays the
  authority for everything else.
- **FR-2 Preview:** a valid pick sends the preview request automatically. While it runs the page shows a loading
  state and the picker is disabled.
- **FR-3 Summary:** counts for total, valid ("will be created"), invalid and duplicate, plus the ignored columns, if
  any.
- **FR-4 Table:** one row per file row: sheet row number, name, amount (with `MoneyPipe` when valid or duplicate),
  currency, billing cycle, next billing date, status badge (`valid`/`invalid`/`duplicate`, text and colour, never
  colour alone) and a detail cell:
  - invalid → each error as "<column>: <translated message>";
  - duplicate → "Already in your subscriptions" or "Same as row N".
  Invalid rows have no normalized values, so name/amount cells show the error detail instead. The table scrolls
  inside its own container (HU-30 pattern) on narrow screens.
- **FR-5 Confirm:** a primary button "Create N subscriptions" (N = `summary.valid`), disabled when N is 0 or a
  request is running. It sends the **same `File` object** to the confirm endpoint.
- **FR-6 Result:** after confirmation the page replaces the preview with the result counts (created, skipped invalid,
  skipped duplicate), a success toast, a link to the subscriptions list and an **Import another file** action. If
  `created` differs from the preview's `valid` (the data changed in between), a note says so.
- **FR-7 Replace:** "Choose another file" is available in the preview, file-error and server-error states; it clears
  the current file and result.
- **FR-8 Errors:**
  - file errors (`400`/`413` with `code`, including a `413` without `code` from the body limit) → inline message for
    that code, with "Choose another file";
  - other server errors (`5xx`, network) → inline error with the correlation reference (HU-41) and **Try again**,
    which repeats the same request with the same file;
  - `401` keeps the existing session-expired flow (interceptor).
- **FR-9 Honest copy:** the page states that imported rows are expected subscriptions entered by the user, not bank
  transactions, and that nothing is saved until confirmation.
- **FR-10 Leaving:** if the user leaves the page with a preview that was not confirmed, nothing is lost on the server
  (nothing was saved), so no "unsaved changes" prompt is shown.

## 4. Business rules
- Only `valid` rows are created; `invalid` and `duplicate` rows are never created (D5).
- Amounts are formatted per currency with `MoneyPipe`; currencies are never summed.

## 5. Acceptance criteria
- **AC-1:** Given the user picks `notes.txt` or a file over 256 KB, then a translated message is shown and no request
  is sent.
- **AC-2:** Given a valid CSV, when it is picked, then the preview request is sent once and the table shows every row
  with its status, errors and duplicate reason, and the summary counts.
- **AC-3:** Given a preview with 0 valid rows, then the confirm button is disabled and explains why.
- **AC-4:** Given a preview with valid rows, when the user confirms, then the same file is sent to the confirm
  endpoint and the result shows the counts and a link to the list; nothing is sent before the click.
- **AC-5:** Given the server answers `missing_columns` (or any file code), then the translated message for that code is
  shown with "Choose another file".
- **AC-6:** Given the server answers `500`, then the error shows the reference and **Try again** repeats the request.
- **AC-7:** The flow works with the keyboard only (picker, confirm, replace, links), statuses have text labels, and the
  layout works at 360 px width.
- **AC-8:** All texts exist in English and Spanish.

## 6. API contract
No new endpoints. `ImportsService` (typed, `environment.apiUrl`): `preview(file)` and `confirm(file)`, both
`multipart/form-data` with the field `file`. Typed models mirror `SubscriptionImportPreview`, `ImportRow` (with
optional `duplicateOf`/`duplicateOfRow`), `ImportSummary` (with `duplicate`) and
`SubscriptionImportConfirmation`.

## 7. Data model changes
None.

## 8. Validation and error cases
Client pre-checks: extension, size, empty file. Every other rule and every code comes from the server; unknown codes
fall back to the server message.

## 9. Edge cases
A file with only invalid rows; a file with 500 rows (table stays usable, no per-row requests); a second pick while a
preview is loading (the previous request is cancelled); confirming twice by double click (button disabled while
running); a name with commas, quotes or a leading `=` (shown as plain text, never as HTML).

## 10. UI states
Idle (picker + format help) · Loading preview · Preview (summary + table + confirm) · Confirming · Done (result) ·
File error · Server error (reference + retry).

## 11. Test plan (Vitest + Angular testing)
- Service: `preview_SendsMultipartFileField`, `confirm_PostsToConfirmRoute`.
- Page: `ImportView_InvalidFile_ShowsActionableError` (no request), `ImportView_Preview_ShowsStatusesAndReasons`,
  `ImportView_NoValidRows_DisablesConfirm`, `ImportView_ConfirmationDoesNotPersistBeforeSubmit`,
  `ImportView_Confirm_SendsSameFileAndShowsCounts`, `ImportView_FileErrorCode_IsTranslated`,
  `ImportView_ServerError_ShowsReferenceAndRetries`, `ImportView_ChooseAnotherFile_ResetsState`,
  `ImportView_Template_DownloadsHeaderAndExample`.
- i18n: every new key exists in both languages (existing key-parity test).
- Browser (HU-48 suite, `npm run e2e`): import a two-row file, check the list shows them, then delete them.

## 12. Assumptions and open questions
- Entry point is a button in the subscriptions list (not a new rail item) to keep the navigation short. Easy to change.
- No open questions.

## 13. Task breakdown
- [ ] frontend#67: typed preview and confirmation models, confirm disabled until a preview with valid rows exists.
- [ ] frontend#68: `features/imports` (service, page, route, list entry points, template, i18n).
- [ ] frontend#69: UX state, keyboard and translation tests; e2e step.
