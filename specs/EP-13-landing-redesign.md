# EP-13: Landing Redesign for FlowTrim 3.0

- **Status:** Draft _(2026-10-23)_
- **Story / Issue:** to be created on approval · stories HU-69 to HU-71
- **Priority:** P1 (roadmap step 2 of FlowTrim 3.0)
- **Dependencies:** EP-12 (the product the landing now promotes), EP-01/EP-02/EP-03 (Carbon Signal identity, EN/ES,
  reduced motion, back-to-top), `docs/FLOWTRIM-3-ROADMAP.md` (GSAP approved for the landing)
- **Author / Date:** Ander (with Claude) · 2026-10-23

## 1. Context and goal
The current landing (EP-01/EP-03) tells a subscriptions-only story: monthly burn, next charge, simulator savings. Since
EP-12, FlowTrim is a daily personal-finance manager: accounts, categories, transactions recorded in seconds and a
transparent "safe to spend today". The roadmap asks for a more striking, advertising-style landing with a scroll-driven
story built with **GSAP + ScrollTrigger**, loaded only on the landing, honest and accessible.

Goal: a landing that, in one scroll, shows the daily loop (where your money is → record in seconds → what is still
expected this month → one number you can trust today), keeps the subscription tools as a second chapter, explains the
formula, and sends the visitor to the workspace — without fake claims, fake testimonials or brand logos.

## 2. Decisions (recommended options, to be confirmed with the spec approval)

| # | Topic | Decision | Why |
|---|---|---|---|
| D1 | Visual identity | Keep **Carbon Signal** (EP-01 tokens, fonts, light/dark themes); the redesign changes layout, story and motion, not the brand. | Consistency with the workspace; no new design system. |
| D2 | Product visuals | **HTML/CSS mock-ups** of real FlowTrim UI pieces (Today hero, quick add, transactions, accounts), rendered with the app's tokens and the money pipe. No screenshots, no images. | Crisp in both themes and languages, light, translatable, accessible text. |
| D3 | Figures shown | Only **sample data, labelled "Sample data"**, internally consistent and computed with the real formula (e.g. available 1,175,000 COP − charges 38,900 ÷ 10 days = 113,610). No user counts, savings promises, ratings, testimonials or logos. | Honesty principle; the numbers on the landing must be reproducible in the app. |
| D4 | Motion library | **`gsap` 3.15.0** (core + ScrollTrigger, "Standard no-charge" licence) loaded with a **dynamic `import()` only in the landing**, after the first render. Nothing in the initial bundle or the workspace. | The landing is in the initial bundle (410 kB of the 500 kB budget); GSAP ≈ 110 kB raw must not count there. |
| D5 | Progressive enhancement | The page is **complete and readable without GSAP** (no JS motion, reduced motion, load failure). GSAP only adds `from` animations after it loads; nothing starts hidden in CSS. | Content never depends on an animation library or on timing. |
| D6 | Reduced motion and small screens | With `prefers-reduced-motion: reduce` GSAP is **not even loaded**. Below 760 px there is **no pinning**: the story becomes stacked steps with light reveals. | Accessibility; pinned scroll is unpleasant on phones. |
| D7 | Story structure | 1 hero · 2 pinned daily story (4 steps) · 3 subscriptions chapter · 4 "no mystery" formula · 5 feature grid · 6 honesty principles · 7 final CTA. The old signal rail, story cards and proof grid are replaced. | One narrative instead of four overlapping sections. |
| D8 | Copy | New EN/ES copy in the existing dictionaries (`landing.*` keys replaced, unused ones removed; EN/ES parity test stays green). | Same i18n mechanism; no translation service. |

## 3. Scope
**In scope:** stories HU-69 to HU-71 (frontend only): new landing structure and copy, the GSAP motion layer, quality
pass (accessibility, performance, both themes and languages, 360/1280 px), README screenshot of the new landing.

**Out of scope:** backend changes, analytics/tracking, marketing pages beyond `/`, video, 3D/WebGL, sound, a pricing
section (no paid plan exists; the optional Wompi demo is a later roadmap item), new fonts or icon libraries, changes to
the workspace.

## 4. Stories

| Story | Title | Repos |
|---|---|---|
| HU-69 | Landing story and content for the daily-finance product | frontend |
| HU-70 | Scroll-driven motion with GSAP (lazy, progressive) | frontend |
| HU-71 | Landing quality pass and evidence | frontend, tracker |

### HU-69 — Landing story and content
- **FR-1 Sections (D7), static first:**
  1. **Hero:** headline about knowing what you can spend today, lead line, primary CTA "Open workspace" (`/app`),
     secondary "See how it works" (anchor to the story), and a hero mock-up of the **Today card** (sample data, D3).
  2. **Daily story** (`#how-it-works`), 4 steps, each with a short text and its mock-up:
     *Where your money is* (accounts strip, card shown as "Owed") → *Record in seconds* (quick-add modal with the `N`
     key hint, category chips) → *What is still coming* (charges until month end) → *One number for today* (safe to
     spend today with the formula disclosure open).
  3. **Subscriptions chapter:** monthly burn, upcoming countdown and the simulator's savings at 1/12/24 months (sample
     data), with the simulator's "nothing is cancelled" assumption.
  4. **No mystery:** the formula `(available − expected charges) ÷ days left`, what counts as available (cash, bank,
     savings; not credit cards) and the "estimate, not financial advice" caveat.
  5. **Feature grid:** accounts, categories, transactions, quick add, Today, subscriptions, analytics & report, CSV
     import/export, AI Assistant (explains FlowTrim's own figures), EN/ES and light/dark.
  6. **Principles:** manual data (never connects to banks), recorded facts vs expected charges, deterministic numbers,
     your data isolated per account.
  7. **Final CTA** and the existing footer.
- **FR-2:** mock-ups are real markup (headings, lists, `dl`), marked as illustrations (`role="img"` with an
  `aria-label` summary, inner content `aria-hidden`) so screen readers hear one sentence, not every sample number.
- **FR-3:** the navigation bar keeps brand, section anchors, language toggle and "Open workspace"; the theme toggle is
  added to the landing (today only the workspace has it).
- **FR-4:** every sample amount uses the money pipe (COP without cents, locale by language) and the label
  "Sample data" / "Datos de ejemplo" is visible next to each mock-up group.
- **AC-1:** With JavaScript animations unavailable (GSAP not loaded), every section, text and CTA is visible and the
  page has no horizontal overflow at 360 px.
- **AC-2:** All copy exists in EN and ES (parity test), and switching language does not reload the page.
- **AC-3:** The hero sample numbers satisfy the formula exactly (1,175,000 − 38,900) ÷ 10 = 113,610.

### HU-70 — Scroll-driven motion with GSAP
- **FR-1 Loading (D4/D6):** the landing calls `import('gsap')` and `import('gsap/ScrollTrigger')` in
  `afterNextRender`, only when `matchMedia('(prefers-reduced-motion: reduce)')` is false. The build must show GSAP in a
  separate lazy chunk and the initial bundle must not grow by more than 5 kB.
- **FR-2 Motion:**
  - hero: headline and mock-up entrance; the "safe to spend today" figure counts up to its sample value once;
  - daily story (≥ 760 px): the section **pins** and scrubs through the 4 steps (text crossfade, mock-up morph: accounts
    → quick add → charges → today), with a progress indicator; < 760 px: no pin, each step reveals when it enters;
  - chapters below: staggered reveals (opacity/transform only).
- **FR-3 Cleanup:** all tweens and ScrollTriggers live in one `gsap.context` (or `gsap.matchMedia`) reverted in
  `ngOnDestroy`; navigating to `/app` and back must not duplicate triggers or leave pinned spacers.
- **FR-4 Performance (HU-28 rules):** only `transform` and `opacity`; no layout-triggering animation; no animation on
  more than ~40 elements at once; `will-change` only while animating.
- **AC-1:** With reduced motion, the network panel shows no GSAP chunk request and the page is identical to HU-69's
  static version.
- **AC-2:** Scrolling the pinned story forward and back shows each step's text and mock-up in order; resizing across
  760 px switches between pinned and stacked without broken layout.
- **AC-3:** Leaving and re-entering the landing 3 times leaves exactly one set of ScrollTriggers (checked in a test via
  `ScrollTrigger.getAll().length`).
- **AC-4:** No console errors; keyboard focus never lands inside a visually hidden step (inactive steps are `inert` while
  pinned).

### HU-71 — Quality pass and evidence
- Browser checks (Playwright, temporary scripts as in EP-12) at 360 / 768 / 1280 px, light and dark, EN and ES, with
  and without reduced motion: no console errors, no horizontal overflow, CTAs reach `/app` (sign-in when signed out).
- Accessibility: one `h1`, ordered headings, visible focus, skip link to main content, contrast of new text on both
  themes, mock-ups announced as single illustrations.
- Performance evidence: initial bundle size before/after, GSAP chunk size, no long tasks over 200 ms while scrolling
  in Chrome's performance panel (one manual capture, documented).
- README (frontend): new landing screenshot (both themes) and the GSAP note; `docs/E2E-ACCEPTANCE.md` row.

## 5. Business rules
- No new financial rules. Sample figures follow EP-12 §5 exactly (D3) and are labelled as samples.
- The landing never claims connected banks, automatic detection, guaranteed savings or advice.

## 6. API contract
None (frontend only; the landing calls no API).

## 7. Data model changes
None.

## 8. Validation and error cases
| Case | Result |
|---|---|
| GSAP chunk fails to load (offline, blocked) | Static landing stays as is; one `console.warn`, no error UI |
| Reduced motion | GSAP never requested; static landing |
| Window resized across 760 px | `gsap.matchMedia` swaps pinned ↔ stacked cleanly |

## 9. Edge cases
- Very tall or very short viewports (pin length relative to viewport height; content never cut).
- Language switch while pinned (text lengths change): ScrollTrigger refreshes after the switch.
- Theme switch: mock-ups use tokens, no re-render needed.
- Back/forward cache and anchor links (`#how-it-works`) while pinned.

## 10. UI states
The landing has no data states. Motion states: static (no GSAP / reduced motion), animated desktop (pinned),
animated mobile (stacked reveals).

## 11. Test plan
- **Unit (Vitest):** the landing renders every section and CTA in EN/ES without GSAP; the sample figures satisfy the
  formula; the motion service is not imported with reduced motion (mocked `matchMedia`); cleanup reverts the context
  on destroy.
- **Build:** initial bundle growth ≤ 5 kB; GSAP present only in a lazy chunk.
- **Browser (temporary Playwright scripts):** HU-70 AC-1..AC-4 and HU-71 matrix; screenshots reviewed.
- **`npm run e2e`:** unchanged flow still starts from the landing CTA.

## 12. Assumptions and open questions
- GSAP's "Standard no-charge" licence fits FlowTrim (not a visual website builder competing with Webflow).
- Open: none if D1–D8 are approved. (If Ander prefers no pinning at all, HU-70 keeps only reveals and the counter.)

## 13. Task breakdown and delivery order
1. HU-69 (static story and copy) — reviewable on its own.
2. HU-70 (GSAP layer on top).
3. HU-71 (quality pass, screenshots, evidence).

## 14. Implementation notes (filled after delivery)
—
