# HU-25: Add English and Spanish interface localization

- **Status:** Implemented _(2026-10-16)_
- **Epic:** EP-02 · **Priority:** P1 · **Dependency:** EP-02

## Acceptance criteria

- Language selector is available on landing and workspace.
- Navigation, headings, buttons, labels, empty states and errors change without reload.
- English is the default language when no preference exists.
- Language preference persists between sessions.
- Financial values, dates and API data remain unchanged.
- Selector is accessible and has visible focus.
- Missing keys safely fall back to English.

## Implementation

- Client-side typed dictionary in the existing core structure.
- No backend changes or external translation dependency.
