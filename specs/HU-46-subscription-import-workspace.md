# HU-46: Add Subscription Import Workspace Flow

- **Status:** Draft
- **Priority:** P1
- **Epic:** EP-07
- **Dependencies:** HU-44, HU-45

## Goal

Make CSV onboarding clear, reviewable and safe before persistence.

## Acceptance criteria

- User can select, preview, replace and confirm a CSV.
- Table shows row, field error, duplicate status and accepted values.
- Loading, empty, success, expired-preview and server-error states are handled.
- Flow is keyboard accessible and usable on mobile.
- Copy distinguishes expected subscriptions from confirmed transactions.

## API contract

Uses the preview and confirmation endpoints from HU-43 to HU-45 through a typed Angular service.

## Tests

`ImportView_InvalidFile_ShowsActionableError`, `ImportView_ConfirmationDoesNotPersistBeforeSubmit`, `ImportView_ExpiredPreview_RequiresNewUpload`.

## Tasks

- [ ] frontend: file picker, preview table and confirmation flow.
- [ ] frontend: responsive, localization and accessibility tests.
