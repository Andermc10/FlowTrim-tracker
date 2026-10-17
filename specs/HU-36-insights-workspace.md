# HU-36: Add the FlowTrim Insights Workspace

- **Status:** Draft
- **Priority:** P1
- **Epic:** EP-05
- **Dependencies:** HU-35

## Goal

Expose an accessible Angular feature for asking questions and reviewing evidence.

## Acceptance criteria

- `/app/insights` is protected and uses the existing standalone feature pattern.
- Suggested questions and typed input are available.
- Loading, empty, success, unauthorized, rate-limit and provider-error states are visible.
- Figures, assumptions and sources render as safe text.
- The view works responsively and in both existing languages.

## API contract

Uses `POST /api/insights/questions`; no browser-to-provider call is allowed.

## Tests

`InsightsRoute_RequiresSession`, `InsightsView_RendersSuccessEvidence`, `InsightsView_RendersProviderError`, `InsightsView_IsKeyboardNavigable`.

## Tasks

- [ ] frontend: route, navigation, models and HTTP service.
- [ ] frontend: response presentation and accessibility tests.
