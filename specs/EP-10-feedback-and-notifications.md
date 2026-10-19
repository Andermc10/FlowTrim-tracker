# EP-10: Feedback and Notifications

- **Status:** Implemented _(2026-10-19; HU-53 and HU-54 delivered)_
- **Story / Issue:** FlowTrim-tracker#97 · stories: HU-53 (#101), HU-54 (#102)
- **Priority:** P1
- **Author / Date:** Ander (with Claude) · 2026-10-18

## 1. Context and goal
Feedback in the Angular app is inconsistent: creating, editing or deleting a subscription gives no
confirmation (the app silently navigates or refreshes); errors are static banners inside each view, some with
hard-coded English text; only the usage page shows a success banner. Upcoming-charge alerts exist only as
badges on `/app/upcoming`, so a user who never opens that page never sees them.

Goal (requested by Ander, 2026-10-18): eye-catching, animated **toast notifications** that match the Carbon
Signal visual identity, used consistently for action feedback, unexpected errors and upcoming-charge alerts.

## 2. Scope
**In scope:** a reusable toast system (HU-53) and in-app charge-alert toasts on entering the workspace (HU-54).
**Out of scope:** email, push, SMS or browser (OS) notifications — FlowTrim alerts are **visual and in-app only**
(CLAUDE.md §5); a notification history/inbox; sounds.

## 3. Principles
- Toasts are for **transient** feedback. Data states (loading/empty/load error with retry) stay inside the view.
- Accessible first: announced by screen readers, keyboard-dismissable, never the only place critical info lives.
- Motion is expressive but respects `prefers-reduced-motion`.
- No new dependency: Angular signals, native `animate.enter`/`animate.leave` (Angular 20.2+) and CSS keyframes.

## 4. Stories
| Story | Title | Priority |
|---|---|---|
| HU-53 | Animated toast notification system | P1 |
| HU-54 | Upcoming-charge alert toasts | P1 |

## 5. Implementation notes
HU-53 (frontend #83): toast system in a manual popover above modals; action-level error toasts with the HU-41
reference. HU-54 (frontend #86): once-per-session grouped alert toast on workspace entry. In-app only.
