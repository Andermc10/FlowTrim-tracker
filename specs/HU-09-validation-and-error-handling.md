# HU-09: Centralized validation and consistent error handling

- **Status:** Implemented _(2026-10-14; all proposals accepted — Q1..Q5 as proposed)_
- **Story / Issue:** FlowTrim-tracker#10 · tasks: backend#17 (global exception middleware), backend#18 (centralized validation / consistent 400), frontend#11 (HTTP error interceptor)
- **Priority:** P0 (cross-cutting)
- **Author / Date:** Ander (with Claude) · 2026-10-14

## 1. Context and goal
Make failures predictable and safe: a consistent RFC 7807 shape for validation errors, a generic `500`
that never leaks stack traces or secrets, coherent status codes, and a frontend that always shows an
actionable message without breaking. This replaces the ad-hoc per-handler error mapping and the
Development exception page with one central mechanism.

## 2. Scope
**In scope:**
- Backend: a global exception handler (`IExceptionHandler` + `UseExceptionHandler`) returning
  `ProblemDetails` — `DomainValidationException` → `400` `ValidationProblemDetails`; anything else →
  generic `500` (logged server-side, no stack trace/secrets to the client). `AddProblemDetails()` for a
  consistent shape across the app.
- Backend: centralize validation-error mapping — handlers stop catching `DomainValidationException`
  (it bubbles to the middleware), keeping only boundary presence/parse checks that already return
  `ValidationProblemDetails`. Coherent codes: `200/201/204/400/404/500`.
- Frontend: a functional HTTP error interceptor that centrally normalizes/logs errors (no secrets) and
  surfaces an actionable message; views keep their field-level `400` handling and never block.
- Tests: the exception handler maps domain validation → `400` and unknown → `500`; a frontend
  interceptor test.

**Out of scope:**
- New endpoints or business rules. Auth-related errors (post-MVP). Localizing error text (English MVP).

## 3. Functional requirements
- **FR-1:** Validation errors use a consistent `ValidationProblemDetails` (field → messages) with `400`.
- **FR-2:** Unhandled exceptions return a generic `500` `ProblemDetails` with no stack trace, no secrets,
  no internal detail; the real error is logged server-side.
- **FR-3:** Status codes are coherent across the API: `200`, `201`, `204`, `400`, `404`, generic `500`.
- **FR-4:** A `DomainValidationException` thrown anywhere maps to `400` with the offending field, without
  each handler catching it.
- **FR-5:** The frontend shows an actionable message for any failed request and does not crash or hang.

## 4. Business rules
No new business rules. The backend remains the validation authority; the domain keeps enforcing invariants.

## 5. Acceptance criteria
- **AC-1:** An invalid create/update returns `400` `ValidationProblemDetails` with the field error(s),
  in the same shape as today.
- **AC-2:** An unexpected server error returns `500` `ProblemDetails` with a generic title and **no**
  stack trace or secret; the exception is logged.
- **AC-3:** Unknown ids return `404` `ProblemDetails`; successful calls keep `200/201/204`.
- **AC-4:** A domain invariant violation reaching the API surfaces as `400`, not `500`.
- **AC-5:** On any HTTP error the UI shows a readable, actionable message and remains usable.

## 6. API contract
No new endpoints. Error bodies become consistent:
- `400` → `ValidationProblemDetails` (`{ type, title, status, errors: { field: [..] } }`).
- `404` → `ProblemDetails` (`status: 404`, generic title).
- `500` → `ProblemDetails` (`status: 500`, generic title, no detail).
The exception handler is registered early in the pipeline and runs in all environments (replacing the
Development exception page) so behavior is consistent and testable.

## 7. Data model changes
None.

## 8. Validation and error cases
| Case | Expected result |
|---|---|
| Boundary presence/parse error (missing amount, bad enum) | `400` `ValidationProblemDetails` (as today) |
| Domain invariant violation (name empty, amount ≤ 0, bad currency) | `400` via the global handler (field from `DomainValidationException`) |
| Unknown id | `404` `ProblemDetails` |
| Unexpected exception (e.g. DB down mid-request) | `500` generic `ProblemDetails`, logged, no detail |
| Frontend receives any error | actionable message shown; app stays usable |

## 9. Edge cases
- The `GET /api/health` DB-down path stays a `503` with no internals (unchanged; it already handles its own error).
- Cancellation is not applicable; this is cross-cutting.
- The `500` body must not include the connection string or any config value.

## 10. UI states (frontend)
- The interceptor centralizes error normalization/logging; each view keeps its existing error state with
  a retry where present. A generic fallback message is shown for non-field errors (`0`/`5xx`).
- No new screens; verify no view blocks on an error.

## 11. Test plan
Backend: `GlobalExceptionHandler_MapsDomainValidation_To400`,
`GlobalExceptionHandler_MapsUnknown_To500WithoutDetail`; existing 68 tests stay green (handlers that
dropped their try/catch still return `400` for invalid input, now via the middleware — covered by the
API-level checks and a live run).
Frontend: an interceptor spec asserting an `HttpErrorResponse` is handled (message derived, rethrown)
without crashing; existing specs stay green.
Manual/live (PR): invalid `POST`/`PUT` → `400`; unknown id → `404`; force an error → `500` with no stack
trace; UI shows a message.

## 12. Assumptions and open questions
- **Q1 — Exception handler:** `IExceptionHandler` + `AddProblemDetails()` + `UseExceptionHandler`, mapping
  `DomainValidationException` → `400` and everything else → generic `500` *(proposed)*.
- **Q2 — Centralize domain-error mapping:** remove the per-handler `catch (DomainValidationException)` in
  create/update so it bubbles to the middleware; keep boundary presence/parse checks *(proposed)*.
- **Q3 — Development behavior:** use the ProblemDetails handler in **all** environments (replace the dev
  exception page) so `500` is consistent and testable *(proposed)*; the real error is still logged.
- **Q4 — Frontend:** a functional error interceptor that logs centrally and surfaces an actionable
  message, with views keeping field-level `400` handling *(proposed)*.
- **Q5 — 404 shape:** keep `Results.Problem(statusCode: 404)` (ProblemDetails) *(proposed)*.

## 13. Task breakdown
- [ ] backend#17 — `GlobalExceptionHandler` (ProblemDetails `500`, no detail), `AddProblemDetails`, `UseExceptionHandler`; map `DomainValidationException` → `400`.
- [ ] backend#18 — Remove per-handler domain-exception catching; confirm coherent `400/404` shapes; tests.
- [ ] frontend#11 — Functional HTTP error interceptor (central logging + actionable message); register via `withInterceptors`; test.

## 14. Implementation notes (filled after delivery)
Delivered on 2026-10-14. Backend PR `FlowTrim-backend#37` (closes #17/#18); frontend PR
`FlowTrim-frontend#20` (closes #11). No deviations.

- `GlobalExceptionHandler` + `AddProblemDetails`/`UseExceptionHandler` maps `DomainValidationException`
  → `400` `ValidationProblemDetails` and anything else → generic `500`, logged, no detail; runs in all
  environments. Create/update handlers no longer catch domain exceptions (centralized). Those handler
  unit tests now assert the throw. 68 backend tests green.
- Verified live: domain-invalid `POST` → `400` with `errors.name`; unknown id → `404`; DB stopped →
  `500` "An unexpected error occurred." with no stack trace / Npgsql / connection string / password.
- Frontend: `httpErrorInterceptor` logs centrally and rethrows; `toUserMessage` derives actionable
  messages; 10 Vitest tests.
