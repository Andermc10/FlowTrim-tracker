# EP-02: Localization and Motion Layer

- **Status:** Implemented _(2026-10-16; tests, build and browser QA passed)_
- **Priority:** P1
- **Milestone:** Localization and Motion
- **Author / Date:** Ander (with Claude) · 2026-10-16

## Goal

Extend the EP-01 experience with bilingual presentation, an explicit return path to the landing page
and purposeful accessible motion.

## Scope

- Client-side English and Spanish UI dictionaries.
- Persisted language selector on landing and workspace.
- Workspace-to-landing navigation.
- CSS/SVG motion and a native scroll-snap feature rail.
- Reduced-motion and keyboard accessibility support.

## Out of scope

- Backend translation APIs or external translation providers.
- Translating user-entered data or financial values.
- Authentication, database or API contract changes.
- Large animation or icon libraries without a demonstrated need.

## Acceptance criteria

- The user can switch English and Spanish without a reload.
- Language and theme preferences survive navigation and browser sessions.
- The workspace has a visible route back to `/`.
- Landing motion is responsive, keyboard-accessible and reduced-motion aware.
- `npm test`, `npm run build` and browser checks pass in both languages.

## Implementation notes

- Added typed client-side English/Spanish dictionaries with persisted language preference.
- Added visible workspace-to-landing navigation.
- Added CSS/SVG motion, native scroll-snap feature rail and reduced-motion handling.
