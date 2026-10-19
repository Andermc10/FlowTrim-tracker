# HU-53: Animated Toast Notification System

- **Status:** Implemented _(2026-10-19; approved 2026-10-18 by Ander)_
- **Story / Issue:** FlowTrim-tracker#101 · task: frontend#81
- **Priority:** P1
- **Epic:** EP-10
- **Dependencies:** HU-41 (error reference)
- **Author / Date:** Ander (with Claude) · 2026-10-18

## 1. Context and goal
Give every user action clear, attractive feedback: "Subscription saved", "Deleted", "Usage recorded",
"Something went wrong — Reference: …". Toasts must look like part of FlowTrim (Carbon Signal: dark fintech
surfaces, signal accents) and feel alive through creative animations.

## 2. Scope
**In scope:** `ToastService` + `ToastHost` in the workspace shell; four variants; animations; adoption in the
subscription create/edit/delete flows, usage registration and unexpected HTTP errors; i18n EN/ES; tests.
**Out of scope:** charge alerts (HU-54), notification history, sounds, OS notifications.

## 3. Functional requirements
- **FR-1 API:** `toast.success(message, options?)`, `.error(…)`, `.warning(…)`, `.info(…)`, `.dismiss(id)`;
  options: `title`, `duration`, `action: { label, route }`, `reference` (correlation id). Signal-based queue.
- **FR-2 Placement:** top-right on desktop, top-center full-width on mobile; above modals; stack of max 3
  visible (older ones collapse behind, "+N more" pill); newest on top.
- **FR-3 Lifetime:** success/info 4 s, warning 6 s, error 8 s; hover or keyboard focus **pauses** the timer;
  a progress line shows the remaining time; close button (×) on all; `Esc` dismisses the focused toast.
- **FR-4 Visual design (Carbon Signal):** glassy dark surface (light variant in light theme) with backdrop blur,
  a 3px accent edge and glow in the variant color (success = signal green, error = red, warning = amber,
  info = cyan), variant icon in a tinted circle, bold title + body, monospace `Reference` chip with copy button
  for errors.
- **FR-5 Animations (CSS keyframes via `animate.enter` / `animate.leave`):**
  - **Enter:** slide in from the right with a spring overshoot (`cubic-bezier(.2,1.4,.4,1)`) + slight scale-up
    and blur-to-sharp.
  - **Icon draw:** the icon's SVG stroke draws itself (`stroke-dashoffset`) — the success check "ticks", the
    error cross "slashes", the warning mark "drops".
  - **Signal pulse:** one radial pulse of the accent color behind the icon on entry; errors add a short
    horizontal shake.
  - **Progress line:** shrinks linearly with the timer; pauses with it.
  - **Exit:** slide-out + fade + collapse height so the stack reflows smoothly.
  - **Reduced motion:** only opacity fades, no shake, no pulse, static progress.
- **FR-6 Accessibility:** polite live region for success/info, assertive for error/warning; `role="status"` /
  `role="alert"`; close button labelled; toasts do not steal focus; contrast AA in both themes.
- **FR-7 Adoption:** subscription created / updated / deleted → success toast; usage registered → success toast
  (replaces the inline success banner); delete failure and unexpected `5xx`/network errors → error toast with
  the HU-41 reference; load-error states with retry stay inline in their views.

## 4. Business rules
Toast copy never invents numbers and never claims something happened outside the app.

## 5. Acceptance criteria
- **AC-1:** Given a subscription is created, edited or deleted, then a success toast appears with the name.
- **AC-2:** Given an unexpected API error, then an error toast shows the message and the reference chip.
- **AC-3:** Given four toasts in a row, then at most three are visible and the rest are summarized.
- **AC-4:** Given the pointer or focus is on a toast, then it does not auto-dismiss until it leaves.
- **AC-5:** Given `prefers-reduced-motion`, then toasts only fade.
- **AC-6:** Given a screen reader, then success is announced politely and errors assertively.
- **AC-7:** Given light and dark themes and mobile width, then toasts are readable and correctly placed.

## 6. API contract
None.

## 7. Data model changes
None.

## 8. Validation and error cases
Duplicate identical toasts within 1 s are merged (prevents double-submit spam).

## 9. Edge cases
Navigation between routes keeps active toasts; very long messages wrap (max 3 lines + expand); toast while a
modal is open stays above it; copying the reference works without HTTPS (fallback to selection).

## 10. UI states
Variants × themes × desktop/mobile × reduced motion. A demo trigger is not shipped (tests and real flows only).

## 11. Test plan
Vitest: service queue (add, dismiss, max visible, merge duplicates, durations per variant, pause/resume with
fake timers); host renders roles and live regions; adoption points call the service (create/update/delete,
usage, interceptor for 5xx with reference). Manual browser check of all animations in both themes, mobile, and
reduced motion; zero console errors.

## 12. Assumptions and open questions
No new dependencies. Final colors come from the existing Carbon Signal tokens.

## 13. Task breakdown
- [x] frontend: service, host, styles/animations, adoption, i18n, tests.

## 14. Implementation notes
- Delivered in frontend PR #83: `core/ui/toast` (`ToastService`, `ToastHost`, `ToastItem`), adoption in the
  subscription form, list (delete) and usage page, EN/ES copy.
- Decisions (reported to Ander): the host is a **manual popover** (top layer) because modals are native
  `<dialog>` elements that no `z-index` can cover; it opens with the first toast and is re-shown only while a
  modal is open, so visible toasts do not restart their animations. Error toasts are raised by each **action**
  (create/update/delete/usage) instead of a global interceptor, so load errors are not duplicated (they stay
  inline with retry). `ToastService.httpError` translates the message (EN/ES) and attaches the HU-41 reference.
- Verification: 51/51 frontend tests (+10), production build, CI green on the PR and `main`. Real browser run
  against the real API and PostgreSQL (test issuer token): create and delete show success toasts with the name;
  with the API stopped, the translated network error toast renders above the open modal; light and dark themes;
  zero console errors; the toast sits inside the viewport after its entrance.
- Not verified in a browser: reduced-motion rendering (CSS reviewed; the headless tool cannot emulate the media
  query) and keyboard interaction with a toast while a modal is open (the modal makes the rest of the page inert).
