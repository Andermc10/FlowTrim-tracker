# HU-22: Redesign summary and upcoming charges

- **Status:** Implemented _(2026-10-15)_
- **Epic:** EP-01 · **Priority:** P1 · **Dependencies:** HU-20, HU-21

## Goal

Make financial totals and imminent renewals visually scannable while preserving server-calculated
values and alert semantics.

## Acceptance criteria

- Summary cards prioritize monthly equivalent and annual projection.
- Multiple currencies remain separate.
- The summary empty state is branded and actionable.
- Upcoming charges use a timeline or grouped alert presentation.
- Overdue, today and upcoming charges have distinct semantic treatments.
- Alert meaning does not depend only on color.
- Loading and error states remain available in both themes.
- Server countdown values remain the source of truth.
