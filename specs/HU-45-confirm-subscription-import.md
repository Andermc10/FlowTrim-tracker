# HU-45: Confirm Owner-Scoped Subscription Import

- **Status:** Implemented _(approved 2026-10-20; backend PR #86)_
- **Story / Issue:** FlowTrim-tracker#74 · tasks: backend#59 (transactional confirmation), backend#60 (authorization and
  transaction tests)
- **Priority:** P1
- **Epic:** EP-07
- **Dependencies:** HU-43 (file validation), HU-44 (duplicate classification), HU-12 (owner)
- **Author / Date:** Ander (with Claude) · 2026-10-19

## 1. Context and goal
The preview (HU-43/HU-44) shows what an import would do but saves nothing. This story creates the subscriptions.
With decision **D4 (stateless preview)** the client confirms by sending **the same file again**; the server repeats
the whole validation and duplicate classification inside one transaction and creates only the rows that are still
`valid`. Repeating the confirmation is harmless because the rows created the first time are now existing duplicates
(D5). This replaces the earlier draft (`{id}/confirm`, previews table, expiry, 404/409), which D4 removed.

## 2. Scope
**In scope**
- `POST /api/subscription-imports/confirm`: same multipart upload and file rules as the preview.
- Create every `valid` row for the signed-in owner, all in one transaction (all or nothing).
- Skip `invalid` and `duplicate` rows (never created, never an error for the whole request).
- Re-check duplicates inside the transaction, serialized per owner, so two simultaneous confirmations of the same
  file create each subscription once.
- Response with the counts; logs with counts only.

**Out of scope**
- Preview ids, expiry, a previews table (D4).
- Importing a duplicate anyway or updating an existing subscription (D5).
- Undoing an import, import history, usage records in the file.
- The workspace screen (HU-46).

## 3. Functional requirements
- **FR-1 Same input:** multipart field `file`; the same extension, size, encoding, header, row-limit and per-field rules
  as the preview (shared code, not a copy). File problems return the same `400`/`413` codes and create nothing.
- **FR-2 What is created:** each row whose final status is `valid`, with the owner from the token, the normalized
  values and the status from the file (`Inactive` rows are created inactive). `monthly_equivalent` is never read.
- **FR-3 Transaction:** inside one database transaction, serialized against other confirmations of the same owner:
  read the owner's subscriptions, classify with `SubscriptionImportDuplicates.Classify`, insert the valid rows,
  commit. Any failure rolls everything back and returns the generic `500` (HU-09); nothing is created.
- **FR-4 Idempotency:** confirming the same file again creates nothing new (every previously created row is now a
  `duplicate` of `existing`). No idempotency key is needed.
- **FR-5 Partial files:** a file with some `invalid` or `duplicate` rows still creates its `valid` rows; the user saw
  which rows would be skipped in the preview. A file with no `valid` row returns `200` with `created: 0`.
- **FR-6 Response (`200 OK`):**
  ```json
  { "total": 5, "created": 2, "invalid": 1, "duplicate": 2 }
  ```
  `total = created + invalid + duplicate`. The counts come from the classification done inside the transaction, so
  they can differ from the preview if the owner's data changed in between.
- **FR-7 Logs:** one line with the four counts; never names, amounts or file content.

## 4. Business rules
- Imported subscriptions are **expected** subscriptions, the same as ones typed in the form; none of them is a
  confirmed bank transaction.
- Duplicate policy is D5 exactly as in HU-44 (same owner + name case-insensitive + currency, active or inactive).
- Another owner's subscriptions never affect the result and are never touched.

## 5. Acceptance criteria
- **AC-1:** Given a file with 2 valid rows, 1 invalid row and 1 duplicate of an existing subscription, when A confirms,
  then exactly the 2 valid rows are created for A and the response is `{ total: 4, created: 2, invalid: 1, duplicate: 1 }`.
- **AC-2:** Given A confirmed a file, when A confirms the same file again, then nothing new is created and the response
  has `created: 0`, with every previously valid row counted as `duplicate`.
- **AC-3:** Given B has "Spotify" COP, when A confirms a file with "Spotify" COP, then it is created for A and the data
  of B is unchanged.
- **AC-4:** Given saving fails part-way, then no row of the file is created and the response is the generic `500`.
- **AC-5:** Given two confirmations of the same file arrive at the same time for A, then each subscription exists once.
- **AC-6:** Given a row with `status = Inactive`, then the subscription is created inactive.
- **AC-7:** Given a file problem (wrong extension, too large, missing columns...), then the same `400`/`413` code as the
  preview is returned and nothing is created. Without a token the response is `401`.

## 6. API contract
`POST /api/subscription-imports/confirm` · auth required · `multipart/form-data`, field `file` · body limit 1 MB.

| Status | When |
|---|---|
| `200` | counts as in FR-6 (also when `created` is 0) |
| `400` | file problem, same codes as the preview |
| `401` | missing or invalid token |
| `413` | `file_too_large`, `too_many_rows`, or body over 1 MB |
| `500` | unexpected failure; nothing was created |

## 7. Data model changes
None (no table, no migration). The repository gains one owner-scoped import operation (see §13) that runs the read,
the classification and the insert in one transaction, after taking a PostgreSQL transaction-level advisory lock keyed
by the owner (`pg_advisory_xact_lock`), so confirmations of the same owner run one after another. The lock is released
automatically at commit or rollback.

## 8. Validation and error cases
Same as HU-43 for the file and the rows. Domain invariants still apply when creating (the preview already guarantees
them; a domain failure here is a bug and returns `500` with nothing created).

## 9. Edge cases
All rows invalid or duplicate → `200`, `created: 0`. Repeated rows inside the file → the first one is created, later
ones are `duplicate`. The owner deleted a subscription between preview and confirm → that row is created. A file of
500 valid rows → one insert batch in one transaction.

## 10. UI states
None in this story (HU-46 shows the confirmation result and the server error).

## 11. Test plan (xUnit)
- Application (in-memory repository): `Confirm_ValidRows_CreatesOnlyValidRowsForOwner`,
  `Confirm_InactiveRow_CreatesInactiveSubscription`, `Confirm_SameFileTwice_CreatesNothingTheSecondTime`,
  `Confirm_NoValidRows_ReturnsZeroCreated`, `Confirm_FileProblem_CreatesNothing`,
  `Confirm_PersistenceFailure_PropagatesAndCreatesNothing`.
- API: `Confirm_ValidCsv_ReturnsCounts` (also confirms the same file twice), `Confirm_OtherOwnerData_IsNotUsedOrChanged`,
  `Confirm_WithoutToken_Returns401`, `Confirm_WithoutFile_Returns400`, `Confirm_FileProblem_Returns400WithCode`,
  `Confirm_TooManyRows_Returns413`, `Confirm_Logs_OnlyCountsNeverContent`,
  `Confirm_PersistenceFailure_Returns500AndCreatesNothing`.
- Integration (PostgreSQL): `Confirm_RealDatabase_CreatesRowsAtomically`,
  `Confirm_ConcurrentSameFile_CreatesEachSubscriptionOnce`, `Confirm_SaveFailure_RollsBackEveryRow`.

## 12. Assumptions and open questions
- Partial import (create the valid rows, skip the rest) was already published in `docs/SUBSCRIPTION-CSV-FORMAT.md`
  with HU-43 ("creates only valid, non-duplicate rows, all at once").
- The route `/confirm` mirrors `/preview`; no resource id is returned because no import record is stored.
- No open questions.

## 13. Task breakdown
- [x] backend#59 (PR #86): shared `SubscriptionImportFile`, `ConfirmSubscriptionImportHandler`,
  `ISubscriptionRepository.AddImportedAsync` (transaction + `pg_advisory_xact_lock` on `subscription-import:<owner>`;
  in-memory double serialized with a semaphore), one route group for both endpoints, logs with counts.
- [x] backend#60 (PR #86): authorization, idempotency, rollback and concurrency tests (API + PostgreSQL). 424 tests
  (399 fast + 25 integration). Mutations caught: no lock (4 concurrent confirmations created 12 rows instead of 3), no
  explicit transaction, classification ignoring existing data. Live check on the real API and local PostgreSQL.
