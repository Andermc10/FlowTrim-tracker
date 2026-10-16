# HU-30: Add reusable CRUD modals and icon actions

- **Status:** Implemented _(2026-10-16)_
- **Epic:** EP-03 · **Priority:** P1 · **Dependencies:** EP-02, HU-29

## Acceptance criteria

- Create and edit open a reusable modal over the subscription list.
- Delete opens an explicit confirmation modal.
- CRUD actions use accessible SVG icons with labels and tooltips.
- Modal action order is Cancel first and primary action second.
- X, Escape and backdrop close are supported.
- Dirty forms ask before discarding data.
- API errors preserve the modal and entered values.
- Existing validation and API behavior remain unchanged.
