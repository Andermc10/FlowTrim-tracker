# EP-05: FlowTrim Insights

- **Status:** Implemented _(delivered 2026-10-19; stories HU-33 to HU-37 verified and closed)_
- **Story / Issue:** FlowTrim-tracker#54 · stories: HU-33 (#55), HU-34 (#56), HU-35 (#57), HU-36 (#58), HU-37 (#59)
- **Priority:** P1
- **Author / Date:** FlowTrim team / October 2026

## 1. Context and goal

Add a focused financial assistant that explains the authenticated user’s FlowTrim data while preserving deterministic C# calculations.

## 2. Scope

**In scope:** provider adapter, allow-listed financial tools, protected question endpoint, structured evidence response, Angular Insights route, limits and controlled failures.

**Out of scope:** SQL generation, RAG, vector databases, autonomous actions, conversation persistence and financial advice.

## 3. Functional requirements

- FR-1: A question is interpreted only within an authenticated owner scope.
- FR-2: Tools reuse existing handlers and calculators.
- FR-3: Responses expose figures, assumptions and sources.
- FR-4: Provider failures and limits are safe and actionable.

## 4. Business rules

- AI prose is explanatory; money, dates and simulation results come from typed backend tool results.
- Expected renewals and declared usage remain explicitly labelled.
- No conversation content is persisted in the MVP.

## 5. Acceptance criteria

- AC-1: Given a supported question, when Insights runs, then the response contains a deterministic result and explanation evidence.
- AC-2: Given an unsupported question, when it is submitted, then the API returns a safe bounded response.
- AC-3: Given a provider timeout, when the request ends, then the UI shows a retryable error without internal details.
- AC-4: Given owner A, when Insights runs, then it cannot access owner B data.

## 6. API contract

| Method | Route | Request | Success | Errors |
|---|---|---|---|---|
| POST | `/api/insights/questions` | `{ "question": "..." }` | 200 structured answer | 400 / 401 / 429 / 502 / 504 |

Response shape (as delivered in HU-35/HU-36; the story specs are the source of truth):

```json
{
  "status": "answered",
  "answer": "You spend 55,800 COP per month on subscriptions...",
  "figures": [{ "kind": "monthly_equivalent", "label": "Monthly equivalent", "value": 55800, "currency": "COP" }],
  "assumptions": [{ "key": "constant_prices", "text": "Projections assume constant prices, with no taxes or penalties." }],
  "sources": ["summary"],
  "toolsUsed": ["get_spending_summary"]
}
```

`status` is `answered`, `no_data` or `unsupported`; figures may also carry `subject`, `months` and `date`.

## 7. Data model changes

None required for the MVP. Provider configuration is external. Conversation history is intentionally not persisted.

## 8. Validation and error cases

Question must be non-empty and bounded. Provider keys are required only at runtime. Tool names, arguments and output sizes are allow-listed.

## 9. Edge cases

No subscriptions, mixed currencies, no usage records, zero usage, invalid selected IDs, provider outage and repeated requests.

## 10. UI states

Suggested questions, input, loading, cancellation/retry, success evidence, no-data, unsupported-question, rate-limit and provider-error states.

## 11. Test plan

- `Question_WithSummary_ReturnsEvidenceBackedAnswer`.
- `Question_WithOtherOwnerId_CannotEscapeOwnerScope`.
- `ProviderTimeout_ReturnsControlledGatewayTimeout`.
- `UnsupportedQuestion_ReturnsSafeStatus`.
- `InsightsView_RendersLoadingSuccessAndErrorStates`.

## 12. Assumptions and open questions

- Resolved: provider strategy approved 2026-10-18 (own boundary, fake provider by default, one OpenAI-compatible
  adapter). GitHub Models was retired on 2026-07-30, so the configured provider is **Groq** free tier
  (`openai/gpt-oss-120b`); OpenRouter remains a configuration-only fallback.
- Resolved: the fields sent to the provider are documented in the backend README ("Privacy and data sent to the AI
  provider") and pinned by `Question_ModelRequests_ContainNoIdsOwnerOrToken` (HU-37).

## 13. Task breakdown

- [x] backend: provider boundary and fake adapter (HU-33, backend PRs #76/#77).
- [x] backend: deterministic financial tools (HU-34, backend PR #78).
- [x] backend: protected orchestration endpoint (HU-35, backend PRs #80/#81).
- [x] frontend: Insights feature (HU-36, frontend PR #88; backend PR #82 assumption keys).
- [x] tracker: privacy and demo evidence (HU-37, backend PR #83, tracker PR #122).

## 14. Implementation notes

- Every acceptance criterion is covered: AC-1 by the HU-37 verification matrix (figures equal the deterministic
  endpoints even when the model text is wrong), AC-2 by the `unsupported` status (model text discarded), AC-3 by the
  `504 insights_timeout` path and the HU-36 retryable error, AC-4 by owner-scoped tools and
  `Question_CannotAccessOtherOwner`.
- Decisions taken during delivery: figures carry typed `months`/`date` and assumptions a stable `key`, so the bilingual
  UI never parses English text; when every tool call is rejected the model text is replaced by a fixed message; the
  model is asked for plain text because the UI does not render Markdown.
- Limits: 5 questions per 60 s per owner, 45 s per question, at most 2 tool rounds and 3 model calls.
- Open, non-blocking findings (no figure affected) are tracked in `docs/INSIGHTS-VERIFICATION.md`.
