# EP-05: FlowTrim Insights

- **Status:** Draft
- **Story / Issue:** FlowTrim-tracker#EP-05 · stories: HU-33 to HU-37
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

Response shape:

```json
{
  "answer": "Your monthly equivalent spending is ...",
  "figures": [{ "label": "Monthly equivalent", "value": 52900, "currency": "COP" }],
  "assumptions": ["Prices are assumed constant."],
  "sources": ["summary", "active subscriptions"],
  "status": "answered"
}
```

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

- Select provider, model and quota before implementation.
- Document exactly which fields are sent to the provider.

## 13. Task breakdown

- [ ] backend: provider boundary and fake adapter.
- [ ] backend: deterministic financial tools.
- [ ] backend: protected orchestration endpoint.
- [ ] frontend: Insights feature.
- [ ] tracker: privacy and demo evidence.

## 14. Implementation notes

To be completed after delivery.
