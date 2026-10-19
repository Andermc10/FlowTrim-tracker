# HU-34: Expose Deterministic Financial Tools

- **Status:** Draft _(refined 2026-10-19, pending approval)_
- **Story / Issue:** FlowTrim-tracker#56 · tasks: backend#48 (owner-scoped tool contracts), backend#49 (deterministic
  and owner-scope tests)
- **Priority:** P1
- **Epic:** EP-05
- **Dependencies:** HU-12 (owner isolation), HU-33 (`IChatModel` tool definitions), HU-50 (analytics)
- **Author / Date:** Ander (with Claude) · 2026-10-19

## 1. Context and goal
FlowTrim Insights must never let the language model calculate money. The model may only *ask* for allow-listed
tools; the backend runs them with the existing, tested C# handlers for the authenticated owner and returns typed
results that the model explains (HU-35). This story builds those tools and their allow-list. No public route ships
here.

## 2. Scope
**In scope:**
- `IFinancialTool` contract and a `FinancialToolRegistry` (the allow-list) in `FlowTrim.Application/Insights/Tools`.
- Five tools that **wrap existing handlers** (no new financial rule):

  | Tool | Wraps | Arguments | Returns |
  |---|---|---|---|
  | `get_spending_summary` | `IGetSummaryHandler` (HU-03) | none | per currency: monthly equivalent, annual projection, active count |
  | `get_spending_analytics` | `IGetAnalyticsHandler` (HU-50) | `months` 1–24 (default 12) | per currency: categories with share, top 5, expected charges per month |
  | `get_upcoming_charges` | `IGetUpcomingChargesHandler` (HU-04) | `withinDays` 1–60 (default 30) | charges due within the window (overdue included), max 20, with days and alert window |
  | `simulate_cancellation` | `ISimulateHandler` (HU-07) | `subscriptionNames` (1–10 names), optional `horizons` | per currency: current/selected/projected monthly and savings; names that matched nothing |
  | `get_cost_per_use` | `IGetCostPerUseHandler` (HU-06) | `subscriptionName`, optional `from`/`to` (`yyyy-MM-dd`) | period cost, uses, cost per use or *not calculable* with reason |

- Each tool exposes its name, description and **JSON Schema** parameters as a HU-33 `ChatTool`.
- A uniform `ToolResult` (status, data, assumptions, sources) serialized to compact JSON for the model and kept
  typed for HU-35's evidence (figures, assumptions, sources).

**Out of scope:** the question endpoint and orchestration loop (HU-35), prompts, UI (HU-36), new calculations,
write operations of any kind (tools are read-only; the simulator never persists).

## 3. Functional requirements
- **FR-1 Owner scope:** tools run inside the request scope and call handlers that already filter by the token
  `sub` (`ICurrentUser`). Tools **never accept subscription ids** from the model: subscriptions are referenced by
  **name** and resolved only within the owner's own subscriptions, so another owner's data is unreachable.
- **FR-2 Allow-list:** the registry exposes exactly these five tools. An unknown tool name returns
  `status = unknown_tool` (never an exception, never a dynamic lookup).
- **FR-3 Arguments:** parsed from the model's raw JSON. Invalid JSON, wrong types or out-of-range values return
  `status = invalid_arguments` with a short reason (e.g. `withinDays must be between 1 and 60`); unknown properties
  are ignored. Defaults apply when an optional argument is missing.
- **FR-4 Name resolution:** case-insensitive, trimmed, exact match. `simulate_cancellation` uses **active**
  subscriptions (as the simulator does) and reports unmatched names in `data.unmatchedNames`; `get_cost_per_use`
  searches all of the owner's subscriptions and returns `not_found` when nothing matches or `ambiguous` (with the
  candidates' name, currency and amount — no ids) when several match.
- **FR-5 Result shape** (camelCase JSON):
  `{ "tool": "...", "status": "ok|not_found|ambiguous|not_calculable|invalid_arguments|unknown_tool",
     "data": { ... }, "assumptions": ["..."], "sources": ["..."] }`.
  Amounts are numbers with their currency next to them; currencies are never combined.
- **FR-6 Honesty labels:** results state that charges are *expected* (not confirmed payments), usage is *declared*
  (not verified), projections assume constant prices, and the simulation does not cancel anything.
- **FR-7 Bounded output:** lists are capped (20 upcoming charges, 10 names, analytics already capped by HU-50) so a
  result stays small enough for the model's context.

## 4. Business rules
All numbers come from the wrapped handlers; this story adds no formula. Rules from CLAUDE.md §5 apply unchanged.

## 5. Acceptance criteria
- **AC-1:** Given owner A with COP and USD subscriptions, when `get_spending_summary` runs, then it returns one entry
  per currency with the same values as `GET /api/summary` for A.
- **AC-2:** Given owners A and B, when A runs any tool (including by naming B's subscription), then no B data appears;
  B's names come back as unmatched/not found.
- **AC-3:** Given `get_cost_per_use` for a subscription without usage, then `status = not_calculable` with the
  calculator's reason (no division by zero).
- **AC-4:** Given `simulate_cancellation` with one known and one unknown name, then the result includes the
  savings for the known one and lists the unknown one in `unmatchedNames`.
- **AC-5:** Given invalid arguments (bad JSON, `withinDays = 90`, empty names, malformed date), then
  `status = invalid_arguments` with a reason and no handler is called.
- **AC-6:** Given an unknown tool name, then `status = unknown_tool`.
- **AC-7:** Given the registry, then it exposes exactly the five tools, each with a valid JSON Schema
  (`type: object`) usable as a HU-33 `ChatTool`.
- **AC-8:** Given any tool result, then it carries the assumptions and sources that apply (expected / declared /
  constant prices / no conversion / nothing cancelled).

## 6. API contract
No public route. Internal contract:

```csharp
public interface IFinancialTool
{
    string Name { get; }
    ChatTool Definition { get; }                // name, description, JSON Schema (HU-33)
    Task<ToolResult> ExecuteAsync(string argumentsJson, CancellationToken cancellationToken);
}
```

`FinancialToolRegistry.ExecuteAsync(ChatToolCall call, CancellationToken)` → `ToolResult` (with `ToJson()`).

## 7. Data model changes
None.

## 8. Validation and error cases
| Case | Result |
|---|---|
| Arguments are not a JSON object | `invalid_arguments` |
| `months` outside 1–24, `withinDays` outside 1–60 | `invalid_arguments` with the range |
| `subscriptionNames` empty, more than 10, or blank names | `invalid_arguments` |
| `from`/`to` not `yyyy-MM-dd`, or `from` after `to` | `invalid_arguments` |
| Name matches nothing | simulation: `unmatchedNames`; cost per use: `not_found` |
| Name matches several | cost per use: `ambiguous` with candidates (no ids) |
| No subscriptions at all | `ok` with empty data (the model explains there is nothing to analyse) |

## 9. Edge cases
- Inactive subscriptions: excluded from summary, analytics, upcoming and simulation (handler rules); cost per use can
  still be asked for an inactive one by name.
- Two currencies in a simulation selection: savings reported per currency.
- Names with accents/case differences ("Música" vs "música") match; different spellings do not (no fuzzy matching).

## 10. UI states
None (HU-36).

## 11. Test plan
Unit/application tests with the in-memory repositories and the **real handlers**:
`Registry_ExposesExactlyTheFiveToolsWithObjectSchemas`, `Registry_UnknownTool_ReturnsUnknownTool`,
`SummaryTool_MixedCurrencies_MatchesSummaryHandler`, `AnalyticsTool_InvalidMonths_ReturnsInvalidArguments`,
`UpcomingTool_FiltersByWindowAndCapsItems`, `UpcomingTool_ReturnsOwnerRowsOnly`,
`SimulationTool_KnownAndUnknownNames_ReportsUnmatched`, `SimulationTool_OtherOwnerName_DoesNotLeakData`,
`CostPerUseTool_ZeroUsage_ReturnsNotCalculable`, `CostPerUseTool_AmbiguousName_ReturnsCandidatesWithoutIds`,
`Tools_InvalidJsonArguments_ReturnInvalidArguments` (theory), `Tools_Results_CarryAssumptionsAndSources`,
`ToolResult_ToJson_IsCompactCamelCase`. Plus one HTTP-hosted check that the registry resolves owner-scoped data
through the real DI container (fake auth, in-memory repositories).

## 12. Assumptions and open questions
- Subscriptions are referenced by name because the model sees names in the conversation, and ids would open a path
  to guessing other owners' identifiers.
- No new dependencies (`System.Text.Json`).
- No open questions.

## 13. Task breakdown
- [ ] backend#48: `IFinancialTool`, `ToolResult`, registry, five tools, DI registration.
- [ ] backend#49: deterministic, argument-validation and owner-scope tests.

## 14. Implementation notes
To be completed after delivery.
