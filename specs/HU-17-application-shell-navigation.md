# HU-17: Create the application shell and navigation

- **Status:** Implemented _(2026-10-15)_
- **Epic:** EP-01 · **Priority:** P1 · **Dependency:** HU-16

## Goal

Replace the basic header with a clear workspace shell containing desktop navigation, responsive
mobile navigation, active route indication, branding and the primary add-subscription action.

## Acceptance criteria

- Desktop workspace navigation is a vertical rail with an active route indicator.
- The FlowTrim logo links to the landing page or workspace overview.
- `Add subscription` is accessible from the workspace shell.
- Mobile navigation works without horizontal scrolling.
- All existing features remain reachable.
- Existing routes remain supported or redirect cleanly to workspace routes.
- Unknown routes render a controlled not-found state.
