# HU-33: Configure the AI Provider Boundary

- **Status:** Implemented _(2026-10-19; real-provider smoke check pending on the developer machine)_
- **Story / Issue:** FlowTrim-tracker#55 · tasks: backend#46 (typed configuration and adapter),
  backend#47 (fake provider and failure tests)
- **Priority:** P1
- **Epic:** EP-05
- **Dependencies:** HU-12 (owner isolation), HU-41 (safe logging); AI provider strategy (roadmap, 2026-10-18)
- **Author / Date:** Ander (with Claude) · 2026-10-19

## 1. Context and goal
FlowTrim Insights (EP-05) will let a user ask questions about their subscriptions; a language model chooses
allow-listed deterministic C# tools and explains their results, it never calculates (HU-34/HU-35). Before any of
that, FlowTrim needs a **provider boundary**: one small application contract for "chat completion with tools",
a **fake** implementation for tests, CI and anyone who clones the repo, and **one OpenAI-compatible adapter** so
free-tier providers (GitHub Models first) are a configuration choice, not a code change. No user-facing feature
ships in this story.

## 2. Scope
**In scope:**
- Application contract `IChatModel` with typed request/response, including **tool definitions and tool calls**
  (needed by HU-35, defined now so the boundary does not change later).
- `FakeChatModel` (deterministic, no network) — the **default** provider.
- `OpenAiCompatibleChatModel` (typed `HttpClient`) for any `/chat/completions` endpoint in the OpenAI format.
- Validated options, controlled errors, timeouts, cancellation, bounded input/output, safe logging.
- Tests that never touch the network (fake HTTP handler with recorded OpenAI-format responses).

**Out of scope:** the question endpoint (HU-35), financial tools (HU-34), Angular UI (HU-36), evidence/limits UX
(HU-37), streaming, retries/circuit breakers, multiple providers at once, conversation persistence, prompt design.

## 3. Functional requirements
- **FR-1 Contract** (`FlowTrim.Application/Insights/`):
  `Task<ChatCompletion> CompleteAsync(ChatRequest request, CancellationToken cancellationToken)`.
  `ChatRequest`: ordered messages (`System`, `User`, `Assistant`, `Tool` with tool-call id), optional tool
  definitions (name, description, JSON-schema parameters). `ChatCompletion`: either assistant text **or** a list of
  tool calls (id, name, raw JSON arguments), plus finish reason and token usage.
- **FR-2 Controlled errors:** the adapter throws only `ChatModelException` with a `ChatModelErrorKind`:
  `Timeout`, `RateLimited` (with optional retry-after), `Unauthorized` (bad/missing key), `Unavailable`
  (network or 5xx), `InvalidResponse` (unparseable or empty), `InputTooLarge`. Messages are generic and never
  contain the key, the prompt or the provider's raw body.
- **FR-3 Configuration** (`Insights:Provider`):

  | Setting | Default | Notes |
  |---|---|---|
  | `Kind` | `Fake` | `Fake` or `OpenAiCompatible` |
  | `BaseUrl` | — | e.g. `https://models.github.ai/inference`; `/chat/completions` is appended |
  | `Model` | — | e.g. `openai/gpt-4o-mini` |
  | `ApiKey` | — | **secret**: User Secrets / environment variable only |
  | `TimeoutSeconds` | `20` | 1–60 |
  | `MaxOutputTokens` | `400` | 1–2000, sent as `max_tokens` |
  | `MaxInputCharacters` | `12000` | total message content; above it → `InputTooLarge` without calling the provider |

  With `Kind = OpenAiCompatible`, startup fails unless `BaseUrl` is an absolute `https://` URL and `Model` and
  `ApiKey` are non-empty; messages name the setting, never its value (same pattern as HU-39).
- **FR-4 Timeout and cancellation:** each call is bounded by `TimeoutSeconds` and the caller's token; a timeout
  maps to `Timeout`, a caller cancellation propagates as `OperationCanceledException`.
- **FR-5 Fake provider:** deterministic and offline. With tools: returns one call to the first tool whose name
  matches a keyword rule (e.g. "save"/"cancel" → simulation tool) or plain text otherwise; with a tool result in the
  conversation: returns a fixed explanatory text that quotes the tool result verbatim. Enough to drive HU-35's flow
  and tests; never pretends to be a real model in the UI (HU-36 labels it).
- **FR-6 Safe logging:** one log line per call — provider kind, model, outcome kind, duration, token counts.
  Never the API key, `Authorization` header, prompts, tool arguments or responses (financial data).
- **FR-7 Registration:** `AddInfrastructure` registers the implementation selected by `Kind`; the HTTP client
  uses `IHttpClientFactory` (typed client). No new NuGet dependency.

## 4. Business rules
- The model never receives another owner's data (enforced by HU-35 tools; the boundary is owner-agnostic).
- With free tiers, only demo data should be sent (roadmap privacy rule); documented in the README.

## 5. Acceptance criteria
- **AC-1:** Given no `Insights` configuration, when the API starts, then the fake provider is used and no network
  call is possible.
- **AC-2:** Given `Kind = OpenAiCompatible` without `ApiKey` (or with an `http://` URL), when the API starts, then it
  fails naming the setting and never printing values.
- **AC-3:** Given a recorded OpenAI-format text response, when the adapter completes, then it returns the text,
  finish reason and usage; given a recorded `tool_calls` response, then it returns the tool calls with raw arguments.
- **AC-4:** Given the provider answers `401`, `429` (with `Retry-After`), `500`, invalid JSON, or takes longer than
  the timeout, then the adapter throws `ChatModelException` with `Unauthorized`, `RateLimited` (+ retry-after),
  `Unavailable`, `InvalidResponse` or `Timeout`.
- **AC-5:** Given input above `MaxInputCharacters`, then `InputTooLarge` is thrown and no HTTP request is sent.
- **AC-6:** Given any call, when logs are captured, then the API key, prompt text and response text do not appear.
- **AC-7:** Given the adapter request, then it sends `Authorization: Bearer <key>`, `model`, `messages`, `tools`
  (when present) and `max_tokens` in the OpenAI format.

## 6. API contract
No public route (HU-35 adds `POST /api/insights`). Outbound: `POST {BaseUrl}/chat/completions` (OpenAI format).

## 7. Data model changes
None.

## 8. Validation and error cases
| Case | Result |
|---|---|
| `Kind` unknown | Startup fails: `Insights:Provider:Kind must be Fake or OpenAiCompatible` |
| Missing `ApiKey` / `Model`, non-https `BaseUrl`, out-of-range limits | Startup fails naming the setting |
| `401`/`403` | `Unauthorized` |
| `429` | `RateLimited` (+ `Retry-After` seconds when present) |
| `5xx`, DNS/connection error | `Unavailable` |
| Timeout | `Timeout` |
| Empty choices / unparseable body | `InvalidResponse` |

## 9. Edge cases
- Provider returns both text and tool calls → tool calls win (the orchestrator in HU-35 runs them first).
- Tool-call arguments are kept as raw JSON; validating them against the tool schema is HU-34/HU-35's job.
- `BaseUrl` with or without trailing slash.

## 10. UI states
None.

## 11. Test plan
Unit (no network; `HttpMessageHandler` double with recorded JSON):
`Options_DefaultsToFake`, `Options_OpenAiCompatibleWithoutKey_FailsNamingSetting` (theory: key, model, http URL,
limits), `Adapter_TextResponse_MapsTextFinishReasonAndUsage`, `Adapter_ToolCallsResponse_MapsCalls`,
`Adapter_SendsBearerModelMessagesToolsAndMaxTokens`, `Adapter_ErrorStatus_MapsToKind` (theory 401/403/429/500),
`Adapter_RetryAfter_IsCaptured`, `Adapter_InvalidJson_IsInvalidResponse`, `Adapter_SlowProvider_TimesOut`,
`Adapter_CallerCancellation_Propagates`, `Adapter_InputTooLarge_SendsNothing`, `Adapter_Logs_NeverContainKeyOrContent`,
`FakeProvider_IsDeterministic` (tool selection and explanation). Startup: `Startup_DefaultConfiguration_UsesFake`.

Manual (developer machine, not CI): one real call to GitHub Models with the key from User Secrets — documented as a
local smoke check; CI never calls a real provider.

## 12. Assumptions and open questions
- **Provider for local use:** GitHub Models, `BaseUrl = https://models.github.ai/inference`,
  `Model = openai/gpt-4o-mini` (supports tool calling). The older `models.inference.ai.azure.com` endpoint did not
  respond in our check. Free-tier limits are checked when HU-35 is implemented.
- **Secret name (decided 2026-10-19):** the key lives in the provider-agnostic User Secret `Insights:Provider:ApiKey`
  (renamed from `GitHub:Token`), so switching to OpenRouter/Groq/Gemini only changes values.
- No new NuGet packages (`System.Net.Http.Json` and `IHttpClientFactory` are part of ASP.NET Core).

## 13. Task breakdown
- [x] backend#46: contract, options + validation, OpenAI-compatible adapter, registration, README configuration rows.
- [x] backend#47: fake provider, recorded-response tests, failure mapping, log redaction tests.

## 14. Implementation notes
- Delivered in backend PR #76: `Application/Insights/ChatModel.cs` (contract), `Infrastructure/Insights`
  (`ChatModelOptions` + validator, `FakeChatModel`, `OpenAiCompatibleChatModel`, `AddChatModel()`), options bound and
  validated in `Program.cs`, README section.
- Decisions: Infrastructure gets `<FrameworkReference Include="Microsoft.AspNetCore.App" />` for `IHttpClientFactory`,
  logging and options (shared framework, not a NuGet package). Unexpected provider statuses other than
  401/403/429/5xx (e.g. 404 for a wrong model) map to `Unavailable`; the HTTP status code is logged. The secret was
  renamed in User Secrets from `GitHub:Token` to `Insights:Provider:ApiKey` without printing it.
- Verification: 254/254 backend tests (+38, none touches the network), CI green on the PR and `main`; mutation checks —
  removing the input-size guard and logging the question both fail their tests.
- **Pending:** real GitHub Models smoke check. From the sandbox, `models.github.ai` is intercepted (an intermediary
  answers `200 OK` text/plain even without a token), so the check must run on Ander's terminal.
