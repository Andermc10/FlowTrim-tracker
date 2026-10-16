# HU-18: Add dark and light theme modes

- **Status:** Implemented _(2026-10-15)_
- **Epic:** EP-01 · **Priority:** P1 · **Dependencies:** HU-16, HU-17

## Goal

Allow users to switch between a Carbon Signal dark theme and an accessible light theme.

## Acceptance criteria

- The first visit follows the system preference when no saved preference exists.
- Users can switch themes without a full page reload.
- The selected theme persists between browser sessions.
- All screens, forms, tables, cards and alerts use the active theme.
- The toggle has an accessible name and visible focus state.
- The application still renders if local storage is unavailable.
