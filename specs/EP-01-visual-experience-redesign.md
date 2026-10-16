# EP-01: FlowTrim Visual Experience Redesign

- **Status:** Implemented _(2026-10-15; frontend build, tests and browser verification passed)_
- **Priority:** P1
- **Milestone:** Visual Experience Redesign
- **Author / Date:** Ander (with Claude) · 2026-10-15

## 1. Context and goal

The MVP is functionally complete, but the current Angular interface is a minimal dark MVP shell.
This epic establishes a distinctive, responsive and accessible FlowTrim product experience without
changing backend behavior, financial rules or API contracts.

## 2. Scope

- Carbon Signal visual identity using black, teal `#1FC1CE` and green `#00C483` accents.
- Light and dark themes with persisted preference.
- Separate public landing page and application workspace.
- Responsive desktop and mobile navigation.
- Visual redesign of overview, subscriptions, summary, upcoming, simulator and usage screens.
- Responsive, accessibility, browser and regression verification.

## 3. Out of scope

- Authentication, multi-user data isolation or authorization.
- Backend, database, financial formula or API contract changes.
- Notifications, CSV import or Python/FastAPI extraction.
- New frontend state-management library.
- Tailwind or chart library unless a later approved decision requires it.

## 4. Architecture constraints

- Keep Angular standalone components, signals, Router and SCSS.
- Keep the existing feature-oriented structure and typed HTTP services.
- Put global visual tokens in `src/styles.scss` and theme behavior in the existing `core` area.
- Do not introduce a competing state-management pattern or backend layer.

## 5. Acceptance criteria

- The public root route presents a landing page and the workspace has a separate shell.
- The workspace supports desktop and mobile navigation.
- Dark and light themes work across all existing feature screens.
- Existing API-driven behavior and loading, empty, success and error states remain functional.
- The redesigned application passes `npm test`, `npm run build` and browser acceptance checks.
- No redesign-related console errors, failed requests or horizontal overflow are present.

## 6. Delivery

Stories: HU-16 through HU-24. Frontend only, with tracker documentation and updated screenshots.

## 7. Implementation notes

- Added the Carbon Signal visual tokens, FlowTrim SVG mark, landing page and responsive workspace shell.
- Added persisted light/dark themes without introducing a state-management dependency.
- Redesigned overview, subscriptions, forms, upcoming charges, simulator and usage presentation.
- `npm test`: 13 passed. `npm run build`: passed. Browser checks reported zero console errors and zero failed requests.
