# HU-28: Optimize landing motion performance

- **Status:** Implemented _(2026-10-16)_
- **Epic:** EP-03 · **Priority:** P1 · **Dependency:** EP-02

## Acceptance criteria

- Motion uses transforms and opacity instead of layout-triggering properties where possible.
- Hero and cards remain smooth on desktop and mobile.
- No animation dependency is added without a measured need.
- Reduced-motion disables non-essential movement.
- Browser checks show no visual or console regressions.
