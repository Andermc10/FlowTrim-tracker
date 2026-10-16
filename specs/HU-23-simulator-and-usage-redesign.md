# HU-23: Redesign simulator and usage experience

- **Status:** Implemented _(2026-10-15)_
- **Epic:** EP-01 · **Priority:** P1 · **Dependencies:** HU-20, HU-21, HU-22

## Goal

Make cancellation scenarios and declared usage easier to understand without changing simulation or
cost-per-use behavior.

## Acceptance criteria

- Simulator selections are visually distinct and accessible.
- Base and scenario values remain comparable after selection changes.
- The selected horizon is clearly highlighted.
- Savings use the success treatment without implying a guarantee.
- Assumptions state that no cancellation is persisted.
- Empty selection displays zero savings and a useful state.
- Calculable cost per use is the primary usage metric.
- Insufficient usage data is clear and non-alarming.
- Usage is explicitly described as declared and not verified.
