# EP-03: Interaction and Responsive Quality

- **Status:** Implemented _(2026-10-16; build, tests and browser QA passed)_
- **Priority:** P1
- **Milestone:** Interaction and Responsive Quality
- **Author / Date:** Ander (with Claude) · 2026-10-16

## Goal

Harden the EP-01 and EP-02 experience with faster motion, fixed workspace navigation, isolated table
scrolling, reusable CRUD modals, icon actions, richer landing content and full responsive QA.

## Scope

- Compositor-friendly landing motion and reduced-motion support.
- Fixed desktop/mobile workspace shell and table scroll containment.
- Native accessible modal component for create, edit and delete flows.
- Reusable SVG icon component and labeled icon actions.
- Dirty-form protection and correct modal action order.
- Commercial landing narrative: objective, problem, solution and CTA.
- Responsive, accessibility, formatting, test and build verification.

## Out of scope

- Backend, database or API changes.
- Authentication or multi-user behavior.
- Replacing Angular or introducing a second state-management pattern.
- An animation library unless native CSS/SVG is proven insufficient.

## Acceptance criteria

- Sidebar remains fixed and tables scroll inside their own viewport.
- CRUD works through accessible modals with preserved validation behavior.
- Unsaved form data is not discarded silently.
- Landing motion is smooth, responsive and reduced-motion aware.
- The landing explains objective, problem and solution without fabricated claims.
- `npm test`, `npm run build`, formatting and browser QA pass without errors or warnings.

## Implementation notes

- Replaced layout-based landing motion with compositor-friendly transitions where applicable.
- Added fixed workspace rail, isolated table viewport and sticky table headers.
- Added reusable native dialog, SVG icon and dirty-form protection for CRUD flows.
- Added objective, problem and solution sections to the landing page.
- Frontend tests: 16 passed. Production build passed. Browser QA reported no console or network errors.
