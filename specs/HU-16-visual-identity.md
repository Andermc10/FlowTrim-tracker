# HU-16: Define FlowTrim visual identity

- **Status:** Implemented _(2026-10-15)_
- **Epic:** EP-01 · **Priority:** P1 · **Dependency:** None

## Goal

Create a coherent FlowTrim visual language based on Carbon Signal: black surfaces, teal primary
actions, green positive outcomes, amber warnings and coral errors.

## Acceptance criteria

- All screens use centralized color, spacing, typography and elevation tokens.
- Dark and light palettes preserve the same brand identity.
- The application has a FlowTrim wordmark and custom SVG brand mark.
- Hover, focus, disabled, success, warning and error states are consistent.
- Normal text and controls meet WCAG AA contrast requirements in both themes.

## Implementation

- Frontend only; no API or database changes.
- Use SCSS and CSS custom properties without a new state library.
