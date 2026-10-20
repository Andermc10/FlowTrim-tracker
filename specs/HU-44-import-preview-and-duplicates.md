# HU-44: Preview Duplicates and Import Results

- **Status:** Implemented _(approved 2026-10-19; backend PR #85)_
- **Story / Issue:** FlowTrim-tracker#73 · task: backend#58 (owner-scoped import preview)
- **Priority:** P1
- **Epic:** EP-07
- **Dependencies:** HU-43 (preview endpoint), HU-12 (owner)
- **Author / Date:** Ander (with Claude) · 2026-10-19

## 1. Context and goal
HU-43 tells the user which rows are valid. Before confirming (HU-45), the user must also see which valid rows would
**not** be created because they repeat a subscription they already have or an earlier row of the same file. With the
approved EP-07 decisions (D4 stateless preview, D5 duplicate policy) this story only adds owner-scoped duplicate
classification and a complete summary to the existing preview; there is no preview id or expiry.

## 2. Scope
**In scope**
- Duplicate classification in `POST /api/subscription-imports/preview`, against the signed-in owner's subscriptions
  (active and inactive) and against earlier rows of the same file.
- A `duplicate` row status with the reason, and `duplicate` in the summary.
- The same classification as a reusable step for HU-45 (confirmation re-runs it inside its transaction).

**Out of scope**
- Persisting anything, preview ids, expiry (D4).
- Updating an existing subscription from the file, or letting the user import a duplicate anyway (D5).
- Fuzzy matching (accents, typos, similar names).

## 3. Functional requirements
- **FR-1 Duplicate key (D5):** name trimmed and compared case-insensitively (ordinal, no accent folding) + currency.
- **FR-2 Classification order:** only rows that are otherwise `valid` are checked (an `invalid` row stays `invalid`).
  For each valid row, in file order:
  1. key equals an existing subscription of the owner → `duplicate`, `duplicateOf: "existing"`;
  2. else key equals an earlier valid row of this file → `duplicate`, `duplicateOf: "file"`, `duplicateOfRow: <n>`;
  3. else stays `valid` (will be created by HU-45).
- **FR-3 Response additions:**
  ```json
  {
    "rows": [
      { "rowNumber": 2, "status": "duplicate", "duplicateOf": "existing", "values": { "name": "Netflix", "...": "..." }, "errors": [] },
      { "rowNumber": 4, "status": "duplicate", "duplicateOf": "file", "duplicateOfRow": 3, "values": { "...": "..." }, "errors": [] }
    ],
    "summary": { "total": 5, "valid": 2, "invalid": 1, "duplicate": 2 }
  }
  ```
  `valid` now means "will be created"; `duplicateOf` / `duplicateOfRow` appear only on duplicate rows; duplicate rows
  keep their normalized `values` so the user can see what was matched.
- **FR-4 Owner scope:** the existing subscriptions are read through the owner-scoped repository
  (`ListAllAsync(ownerId)`); another owner's data never affects the result.
- **FR-5 Reuse:** the classification is a pure function over the HU-43 preview and the owner's existing keys, so HU-45
  calls the same code (`SubscriptionImportDuplicates.Classify(preview, existing)`; counts through `ImportSummary.From`).
- **FR-6 Precedence:** when a row matches both an existing subscription and an earlier row, `existing` wins (both rows
  report `duplicateOf: "existing"`). The repository is not read when no row is valid.

## 4. Business rules
- A duplicate is never created (D5); the preview shows it so the user can rename it in the file if it really is a
  different subscription.
- The same name in another currency is **not** a duplicate (prices per currency are separate subscriptions).

## 5. Acceptance criteria
- **AC-1:** Given owner A has "Netflix" in COP, when A previews a file with "netflix " in COP, then that row is
  `duplicate` with `duplicateOf: "existing"`.
- **AC-2:** Given owner B has "Spotify" in COP, when A previews a file with "Spotify" in COP, then the row is `valid`.
- **AC-3:** Given a file with "Gym" COP on rows 3 and 5, then row 3 is `valid` and row 5 is `duplicate` with
  `duplicateOf: "file"` and `duplicateOfRow: 3`.
- **AC-4:** Given "Netflix" COP exists, when the file has "Netflix" USD, then the row is `valid`.
- **AC-5:** Given an invalid row whose name matches an existing subscription, then it stays `invalid` (not
  `duplicate`).
- **AC-6:** The summary counts satisfy `total = valid + invalid + duplicate`, and nothing is persisted.

## 6. API contract
Same endpoint; response gains `duplicate` status, `duplicateOf`, `duplicateOfRow` and `summary.duplicate`.

## 7. Data model changes
None.

## 8. Validation and error cases
Unchanged from HU-43.

## 9. Edge cases
Inactive existing subscription (still a duplicate); an earlier row of the file that is invalid does not make a later
valid row a duplicate; the owner has no subscriptions; 500 rows (one repository read per preview, matching in memory).

## 10. UI states
None in this story (HU-46 shows the duplicate badge and reason).

## 11. Test plan (xUnit)
- Classifier: `Classify_ExistingMatch_IsDuplicateOfExisting`, `Classify_RepeatedRow_IsDuplicateOfFirstRow`,
  `Classify_OtherCurrency_IsValid`, `Classify_InvalidRow_StaysInvalid`, `Classify_EarlierInvalidRow_DoesNotMakeDuplicate`,
  `Classify_Summary_AddsUp`, `Classify_ExistingMatchTakesPrecedenceOverFileMatch`, `Classify_AccentedName_IsNotFolded`,
  `Classify_NoExistingAndNoRepeats_LeavesPreviewUnchanged`.
- API: `Preview_ExistingOwnerMatch_ClassifiesDuplicate` (also asserts nothing is persisted),
  `Preview_OtherOwnerRow_IsNotUsedForDuplicateDetection`.
- Integration (PostgreSQL): `Preview_DuplicateDetection_UsesOwnerRowsFromDatabase`.

## 12. Assumptions and open questions
- No open questions (D4 and D5 already decided).

## 13. Task breakdown
- [x] backend#58 (PR #85, 405 tests: 383 fast + 22 integration): duplicate classifier, repository read in the preview handler, response fields, tests.
