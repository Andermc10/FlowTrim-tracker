# HU-36: Add the FlowTrim Insights Workspace

- **Status:** Approved _(approved 2026-10-19 by Ander, assumptions decision A)_
- **Story / Issue:** FlowTrim-tracker#58 · tasks: frontend#62 (feature and API service), frontend#63 (states and
  accessibility tests)
- **Priority:** P1
- **Epic:** EP-05
- **Dependencies:** HU-35 (`POST /api/insights/questions`), HU-12 (session and guard), HU-41 (correlation reference),
  HU-25 (English/Spanish localization), `MoneyPipe`
- **Author / Date:** Ander (with Claude) · 2026-10-19

## 1. Context and goal
HU-35 exposes a protected endpoint that answers one short question about the signed-in owner's data. The model only
explains results of deterministic tools; the backend returns the answer plus typed evidence (`figures`,
`assumptions`, `sources`, `toolsUsed`). This story gives the user an Angular page to ask those questions and to see
the evidence next to the answer, so a generated sentence is never the only source of a number.

## 2. Scope
**In scope**
- Lazy route `/app/insights` inside the protected workspace, with a navigation entry (desktop rail and mobile bar).
- Feature folder `features/insights/`: typed models mirroring the HU-35 DTOs, `InsightsService`, `InsightsPage`.
- Suggested questions, a text box with a character counter, submit and cancel.
- Answer, figures, assumptions and sources rendered as safe text, in English and Spanish.
- Every state: idle, loading, answered, no data, unsupported, validation error, rate limited, timeout, provider
  unavailable, network error and session expired.

**Out of scope**
- Conversation history, follow-up context or persistence of questions and answers (HU-35 answers one question).
- Streaming responses, Markdown rendering, voice input.
- Any backend change; any browser-to-provider call.
- Formal evidence verification matrix and demo documentation (HU-37).

## 3. Functional requirements
- **FR-1 Route and navigation:** `/app/insights` is a child of the guarded `app` route and is loaded with
  `loadComponent` (keeps the initial bundle budget). The rail and the mobile bar get an "Insights" entry.
- **FR-2 Service:** `InsightsService.ask(question)` posts `{ question }` to
  `${environment.apiUrl}/api/insights/questions` and returns `Observable<InsightsAnswer>`. No other endpoint, no
  provider URL.
- **FR-3 Question input:** a labelled `<textarea>` (reactive form control). The question is trimmed; it is valid with
  1 to 500 characters (same rule as the backend, which stays the authority). A live counter shows `n / 500`.
  `Enter` submits, `Shift+Enter` adds a line. Submit is disabled while invalid, while a question is pending and while
  a rate-limit wait is running.
- **FR-4 Suggested questions:** four buttons in the current language: monthly spending, charges in the next 7 days,
  spending by category, annual projection. Clicking one fills the box and submits it.
- **FR-5 One question at a time:** while pending, the page shows the question being answered, a loading state that
  says it can take up to 45 seconds, and a **Cancel** button that unsubscribes (the HTTP request is aborted). Only
  the latest answer is shown; nothing is stored in the browser.
- **FR-6 Answer by status:**
  - `answered`: the answer text, then the evidence (FR-7).
  - `no_data`: the answer text and a hint to check that the subscription name exists, with a link to
    `/app/subscriptions`.
  - `unsupported`: a translated fixed message listing what can be asked; the `answer` field is not displayed.
- **FR-7 Evidence:**
  - **Figures:** one row per figure. The title is translated by `kind` (fallback: the English `label`). `subject` is
    shown as received (user data). `months` renders as "12 months" / "12 meses"; `date` as a localized date. Values
    with `currency` use `MoneyPipe`; values without currency (`declared_uses`) use a localized number.
  - **Assumptions:** translated by `key` (backend#82); `other` or an unknown key shows the English `text`.
  - **Sources:** translated chips; `summary`, `analytics`, `upcoming-charges` and `simulator` link to the
    deterministic screen where the user can check the number (`/app/summary`, `/app/analytics`, `/app/upcoming`,
    `/app/simulator`); the others are plain chips.
  - **Tools used:** listed in a collapsed "How this was answered" `<details>` block.
- **FR-8 Errors (inline, not toasts, consistent with load errors):**

  | Response | Message | Extra |
  |---|---|---|
  | `400` | "Write a question of up to 500 characters." | |
  | `401` | existing session-expired flow (auth interceptor) | |
  | `429` | "Too many questions. You can ask again in N s." | countdown from `Retry-After` (default 60 s); submit disabled until 0 |
  | `504` | "The assistant took too long to answer. Try again." | correlation reference |
  | `502` | "The assistant is not available right now. Try again later." | correlation reference |
  | `0` / other | existing `toUserMessage` text | correlation reference when present |

  The question text is kept in the box after an error so the user can retry.
- **FR-9 Honesty and privacy notice (always visible):** "Answers explain FlowTrim's own calculations from the data
  you entered. They are not financial advice. Your question is sent to an external AI provider: do not include
  personal data." (translated).
- **FR-10 Safe rendering:** every server string (answer, subject, assumptions) is bound with interpolation only, never
  `innerHTML`. The answer keeps line breaks (`white-space: pre-line`); Markdown is not interpreted.

## 4. Business rules
- The numbers the user should trust are the figures, which come from the backend tools; the page never parses
  numbers out of the answer text.
- Currencies are never combined: each figure is formatted with its own currency and never totalled on the client.
- Simulator answers keep the "nothing is cancelled, savings are not guaranteed" assumption visible.

## 5. Acceptance criteria
- **AC-1:** Given a signed-out visitor, when they open `/app/insights`, then the guard sends them to sign-in.
- **AC-2:** Given the page in Spanish, when the user clicks the "monthly spending" suggestion, then the Spanish
  question is posted once and, on `answered`, the answer, translated figure titles with COP formatting, translated
  assumptions and source links are shown.
- **AC-3:** Given an empty, whitespace-only or 501-character question, then submit is disabled and no request is sent.
- **AC-4:** Given a pending question, then submit is disabled, the region has `aria-busy="true"`, and **Cancel**
  aborts the request and returns to the idle state with the question kept.
- **AC-5:** Given `status = unsupported`, then the translated fixed message is shown and the server `answer` is not.
- **AC-6:** Given `status = no_data`, then the answer and the hint with the subscriptions link are shown and no figure
  list is rendered.
- **AC-7:** Given a `429` with `Retry-After: 30`, then the message shows a countdown from 30 s and submit stays
  disabled until it reaches 0.
- **AC-8:** Given a `502` or `504` with a correlation id, then the specific message and `Reference: <id>` are shown.
- **AC-9:** Given an answer containing `<img src=x onerror=alert(1)>`, then it is shown as literal text.
- **AC-10:** Given keyboard-only use, then suggestions, text box, submit, cancel, source links and the details block
  are reachable with Tab in visual order, and the result region is announced with `aria-live="polite"`.
- **AC-11:** The page works at 360 px width without horizontal scroll, in light and dark themes.

## 6. API contract
Consumes HU-35 with one addition (backend#82): `POST /api/insights/questions` with `{ "question": string }` returns
`200 { status, answer, figures[], assumptions[], sources[], toolsUsed[] }`, figures
`{ kind, label, subject?, value, currency?, months?, date? }`, assumptions `{ key, text }`; errors `400`, `401`, `429` (+ `Retry-After`), `502`,
`504` as ProblemDetails with `code` and `correlationId`. `Retry-After` is already exposed by CORS.

## 7. Data model changes
None.

## 8. Validation and error cases
Client validation mirrors FR-1 of HU-35 (trimmed, 1 to 500). The backend remains the authority; a `400` is still
handled (FR-8).

## 9. Edge cases
- Mixed currencies: figures are listed per currency.
- The backend caps figures at 20; the list wraps without horizontal overflow.
- `Retry-After` missing or not a number: 60 s countdown.
- The user switches language while an answer is shown: titles, assumptions and sources re-translate; the answer text
  stays in the language it was written in.
- Navigating away while pending cancels the request (component destroy).

## 10. UI states
Idle (intro, notice, suggestions) · Loading (question echo, spinner, cancel) · Answered · No data · Unsupported ·
Validation error · Rate limited (countdown) · Timeout · Unavailable · Network or unknown error. Visual style follows
the existing Carbon Signal workspace cards; no new design tokens.

## 11. Test plan (Vitest)
`InsightsService_Ask_PostsQuestionToInsightsEndpoint`, `InsightsRoute_RequiresSession`,
`InsightsPage_Suggestion_SubmitsTranslatedQuestion`, `InsightsPage_RendersAnsweredEvidence`,
`InsightsPage_Unsupported_HidesServerAnswer`, `InsightsPage_NoData_ShowsHint`,
`InsightsPage_InvalidQuestion_DoesNotSend`, `InsightsPage_Cancel_AbortsRequest`,
`InsightsPage_RateLimited_DisablesSubmitUntilRetryAfter`, `InsightsPage_ProviderError_ShowsReference`,
`InsightsPage_AnswerWithMarkup_RendersAsText`, `InsightsPage_EnterSubmits_ShiftEnterDoesNot`.
Then `npm run build` (budget) and a headless-browser check of `/app/insights` against the real API with the fake
provider: zero console and network errors.

## 12. Assumptions and open questions
- **Decided (option A):** each assumption carries a stable `key` (`expected_charges`, `constant_prices`,
  `active_only`, `no_conversion`, `declared_usage`, `nothing_cancelled`, `other`) next to its English `text`, so the UI
  never matches English wording (backend#82). Rejected option B: mapping the English sentences in the frontend.
- The answer text follows the language of the question (model instruction in HU-35); the UI does not translate it.
- The `unsupported` message is replaced by a UI translation by status. The `no_data` fixed message (every tool call
  rejected) is shown as received, in English.

## 13. Task breakdown
- [ ] frontend#62: models, `InsightsService`, lazy route, navigation entry, `InsightsPage` with all states and
  translations.
- [ ] frontend#63: Vitest coverage of section 11, accessibility checks, browser verification.
