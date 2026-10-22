# FlowTrim Insights — Verification Matrix (HU-37)

Evidence that FlowTrim Insights is a controlled feature, not a generic chatbot: the model chooses among five read-only
tools and explains their results; every number the user should trust comes from deterministic C# code.

**Last run:** 2026-10-19 · real API + PostgreSQL · provider Groq (`openai/gpt-oss-120b`, free tier) · synthetic demo
data for a test owner, deleted afterwards · tokens from a local test issuer (no Auth0 account involved).

## 1. Representative questions

| # | Question | Tool and arguments | Figures must equal |
|---|---|---|---|
| Q1 | How much do I spend per month on subscriptions? | `get_spending_summary` `{}` | `GET /api/summary`: `monthlyEquivalent`, `annualProjection` per currency |
| Q2 | Which charges are due in the next 7 days? | `get_upcoming_charges` `{"withinDays":7}` | `GET /api/subscriptions/upcoming` items with `daysUntilCharge <= 7` |
| Q3 | How much would I save in 12 months if I cancel Netflix? | `simulate_cancellation` `{"subscriptionNames":["Netflix"],"horizons":[12]}` | `POST /api/simulations` with Netflix's id |
| Q4 | What does each use of Netflix cost between *from* and *to*? | `get_cost_per_use` `{"subscriptionName":"Netflix","from":…,"to":…}` | `GET /api/subscriptions/{id}/cost-per-use?from=&to=` |

Demo data: Netflix 38,900 COP monthly (due in 3 days, 6 declared uses), Spotify 16,900 COP monthly (due in 20 days),
Cloud Storage 120 USD yearly (due in 5 days).

## 2. Automated evidence (backend, every CI run)

`InsightsVerificationMatrixTests` drives the real endpoint with a scripted model that requests the tool above and then
answers "You pay exactly 1 COP for everything.":

| Test | Proves |
|---|---|
| `Q1_…` to `Q4_…` | figures equal the deterministic endpoint for the same owner, regardless of the model text |
| `Question_ModelTextContradictsFigures_FiguresStayDeterministic` | a wrong number in the prose never becomes a figure |
| `Question_ModelRequests_ContainNoIdsOwnerOrToken` | five tool results in two rounds: no GUID, owner `sub` or bearer token reaches the model |
| `Question_Answered_ResponseShapeMatchesContract` | exactly `status, answer, figures, assumptions, sources, toolsUsed`; no `id` |

Mutation check: changing a savings figure, leaking a subscription id to the model, adding a response field and dropping
overdue charges were each caught by these tests. Limits, provider errors, timeout, rate limit and log privacy are
covered by the HU-35 tests (`InsightsApiTests`, `AnswerQuestionHandlerTests`).

## 3. Real provider run (Groq)

After the prompt fix in finding F1:

| # | HTTP | Status | Tools | Figures equal endpoint | Prose matches figures | Latency |
|---|---|---|---|---|---|---|
| Q1 | 200 | answered | `get_spending_summary` | Yes (COP 55,800 / 669,600; USD 10 / 120) | Yes | 2.0 s |
| Q2 | 200 | answered | `get_upcoming_charges` | Yes (Netflix, Cloud Storage) | Yes | 1.8 s |
| Q3 | 200 | answered | `simulate_cancellation` | Yes (38,900 monthly; 466,800 in 12 months) | Yes, plus a needless "0 USD" (F2) | 1.7 s |
| Q4 | 200 | answered | `get_cost_per_use` | Yes (38,900 paid; 6 uses; 6,483.33 per use) | Yes, but answered in Spanish (F3) | 1.7 s |

### Findings
- **F1 (fixed, backend#83):** the first run answered with Markdown tables and bold text; the page shows the answer as
  plain text, so users would have seen raw `|` and `**`. The system prompt now asks for plain text and to mention only
  affected currencies. The rerun had no Markdown.
- **F2 (fixed 2026-10-21, backend PR #87):** for Q3 the model mentioned "0 USD saved" because the simulation result
  listed every currency. The tool now sends only the currencies with a selection
  (`SimulationTool_OnlySendsCurrenciesAffectedBySelection`).
- **F3 (open, model behavior):** Q4 was asked in English and answered in Spanish, although the prompt says to answer in
  the language of the question. Figures and the translated UI are unaffected. Possible follow-up: send the interface
  language with the question.
- **F4 (open, conservative):** `Retry-After` is always the full window (60 s) because the .NET fixed-window limiter
  reports the window, not the time left. The wait shown is never shorter than needed.

The model's prose is not verified against the figures; the page labels the figures "calculated by FlowTrim".

## 4. Controlled failures (real API)

| Scenario | Configuration (environment variables, nothing committed) | Result |
|---|---|---|
| Rate limit | default 5 questions / 60 s | the question over the limit gets `429`, `code: insights_rate_limited`, `Retry-After: 60` |
| Rate limit in the UI | `Insights__RateLimit__PermitLimit=1`, fake provider | "Too many questions. You can ask again in 60 s.", counting down; submit disabled |
| Timeout | `Insights__Provider__BaseUrl=https://10.255.255.1/v1` (unroutable), `Insights__Provider__TimeoutSeconds=30`, `Insights__RequestTimeoutSeconds=5` | `504`, `code: insights_timeout` after 5.6 s; log "ran out of its 5 s budget" |
| Provider outage | `Insights__Provider__ApiKey=<invalid demo value>` | `502`, `code: insights_unavailable`; `fail` log "provider error Unauthorized" with the correlation id; the key never appears in logs |

## 5. Privacy boundary

Documented in the backend README ("Privacy and data sent to the AI provider"): what is sent (prompt, question, tool
definitions, owner-scoped tool results), what is never sent (ids, owner, token, secrets), nothing stored, metrics-only
logs, and demo data only while a free tier may retain prompts. The Insights page shows the same notice to the user.

## 6. How to rerun
1. Start PostgreSQL (`docker compose up -d`) and a local test issuer (RS256, discovery + JWKS over HTTP).
2. Run the API from `src/FlowTrim.Api` with `Authentication__Authority=<issuer>`,
   `Authentication__RequireHttpsMetadata=false` and `Insights__Provider__Kind=OpenAiCompatible` (Groq values in User
   Secrets).
3. Seed the demo data, ask Q1–Q4, compare each figure with the endpoint in section 1, delete the demo rows.
4. Repeat section 4 with the listed variables (one API instance per scenario).
