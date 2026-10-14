# HU-01: Register a subscription

- **Status:** Implemented _(2026-10-14; Q1/Q2/Q4/Q5 as proposed, Q3 = round amount to 2 decimals)_
- **Story / Issue:** FlowTrim-tracker#2 · tasks: backend#4 (domain), backend#5 (persistence), backend#6 (API), frontend#2 (form)
- **Priority:** P0
- **Author / Date:** Ander (with Claude) · 2026-10-14

## 1. Context and goal
First MVP story after EP-00. A user needs a single place to record a recurring subscription
(name, amount, currency, billing cycle, next charge date) so their recurring spending is
centralized. This story delivers the **create** path end to end: domain entity + persistence
(EF Core + PostgreSQL, first migration) + `POST /api/subscriptions` + an Angular creation form.
It is the foundation every later story (summary, upcoming charges, simulator) builds on.

## 2. Scope
**In scope:**
- `Subscription` domain entity with invariants and the `BillingCycle` / `SubscriptionStatus` enums.
- EF Core persistence: `FlowTrimDbContext`, `subscriptions` table mapping (snake_case), first migration `AddSubscriptionsTable`.
- `POST /api/subscriptions` → `201 Created` with the created resource as a response DTO.
- Backend input validation → `400` with a consistent error body; nothing persisted on invalid input.
- Angular reactive form to create a subscription (loading / success / error states), posting to the API.
- xUnit tests for domain invariants and the create use case.

**Out of scope (later stories):**
- Listing, detail, edit, delete → HU-02 (backend#7, frontend#3). The "appears in the list" acceptance
  criterion is fully realized in HU-02; here we verify persistence directly (re-read / DB).
- `GET /api/subscriptions/{id}` → HU-02. `POST` therefore returns the created resource in the body
  (and a `Location` header pointing at the future route) rather than relying on a GET.
- Centralized exception middleware and the full RFC 7807 field-error shape → HU-09. HU-01 does minimal,
  consistent `400` validation using ASP.NET Core's built-in `ValidationProblemDetails`.
- Category catalog (the definitive list is a pending decision, CLAUDE.md §13).
- Financial calculations (monthly equivalent, projection) → HU-03.

## 3. Functional requirements
- **FR-1:** The API accepts a create request with `name`, `amount`, `currency`, `billingCycle`,
  `nextBillingDate` and optional `category`, and persists a new subscription with a generated `id`.
- **FR-2:** On success the API returns `201 Created` with the created subscription (all fields,
  including `id`, `status`, `createdAt`, `updatedAt`).
- **FR-3:** New subscriptions are created with `status = Active`.
- **FR-4:** `createdAt` and `updatedAt` are set to the current UTC instant from an injected `TimeProvider`
  (never `DateTime.UtcNow` directly).
- **FR-5:** Invalid input is rejected with `400` and a field-keyed error body; nothing is persisted.
- **FR-6:** The persisted record survives an API restart (real PostgreSQL, not in-memory).
- **FR-7:** The Angular form submits a valid payload, shows a success state, and surfaces field errors
  returned by the API; it handles loading and error states.

## 4. Business rules
Reference CLAUDE.md §4–§5. For HU-01 the relevant invariants are:
- `Name`: required, trimmed, non-empty, max length **120**.
- `Amount`: `decimal`, strictly **> 0**; stored as `numeric(18,2)`.
- `Currency`: ISO 4217 **format** `^[A-Z]{3}$`, stored uppercased, default **`COP`**. No currency list
  validation and no conversion in the MVP (we validate shape only).
- `BillingCycle`: enum, one of `Monthly`, `Yearly`.
- `Status`: enum, one of `Active`, `Inactive`; creation always sets `Active`.
- `NextBillingDate`: a `DateOnly`; any date is accepted (past dates become "overdue" later in HU-04 —
  not rejected here).
- `Category`: optional free text, max length **60** when present (catalog deferred).
- Invariants are enforced in the domain via a factory method `Subscription.Create(...)`; no public
  setters that could bypass them. No monetary rounding beyond the `numeric(18,2)` column in this story.

## 5. Acceptance criteria
- **AC-1:** Given a valid payload, when I `POST /api/subscriptions`, then it returns `201` with the
  created subscription including a generated `id` and `status = "Active"`.
- **AC-2:** Given `name` empty/whitespace, when I post, then `400` with an error on `name` and nothing persisted.
- **AC-3:** Given `amount <= 0`, when I post, then `400` with an error on `amount` and nothing persisted.
- **AC-4:** Given `billingCycle` not in {`Monthly`,`Yearly`}, when I post, then `400` with an error on `billingCycle`.
- **AC-5:** Given `currency` omitted, when I post a valid payload, then it is stored as `COP`.
- **AC-6:** Given a subscription was created, when the API is restarted and the row is read back, then it
  still exists with the same values (persistence).
- **AC-7:** Given the Angular form with valid data, when I submit, then it shows a success state; given
  invalid data rejected by the API, it shows the field errors without losing the entered values.

## 6. API contract
| Method | Route | Request | Success | Errors |
|---|---|---|---|---|
| POST | `/api/subscriptions` | `CreateSubscriptionRequest` (JSON) | `201 Created` + `SubscriptionResponse`, `Location: /api/subscriptions/{id}` | `400` (`ValidationProblemDetails`) |

Request (`CreateSubscriptionRequest`, camelCase JSON):
```json
{
  "name": "Netflix",
  "category": "Streaming",
  "amount": 38900.00,
  "currency": "COP",
  "billingCycle": "Monthly",
  "nextBillingDate": "2026-11-01"
}
```
Response (`SubscriptionResponse`, `201`):
```json
{
  "id": "4f6c...",
  "name": "Netflix",
  "category": "Streaming",
  "amount": 38900.00,
  "currency": "COP",
  "billingCycle": "Monthly",
  "nextBillingDate": "2026-11-01",
  "status": "Active",
  "createdAt": "2026-10-14T06:30:00Z",
  "updatedAt": "2026-10-14T06:30:00Z"
}
```
Error (`400`, example):
```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": { "amount": ["Amount must be greater than zero."] }
}
```
Enums are serialized as their string names (`Monthly`, `Active`). No internal details in errors.

## 7. Data model changes
New table `subscriptions` (snake_case via `EFCore.NamingConventions`):

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK `pk_subscriptions` |
| `name` | `varchar(120)` | `NOT NULL` |
| `category` | `varchar(60)` | nullable |
| `amount` | `numeric(18,2)` | `NOT NULL`, `ck_subscriptions_amount_positive` (`amount > 0`) |
| `currency` | `char(3)` | `NOT NULL`, default `COP` |
| `billing_cycle` | `text` | `NOT NULL`, `ck_subscriptions_billing_cycle` in (`Monthly`,`Yearly`) |
| `next_billing_date` | `date` | `NOT NULL`, index `ix_subscriptions_next_billing_date` |
| `status` | `text` | `NOT NULL`, `ck_subscriptions_status` in (`Active`,`Inactive`) |
| `created_at` | `timestamptz` | `NOT NULL` (UTC) |
| `updated_at` | `timestamptz` | `NOT NULL` (UTC) |

Migration name: **`AddSubscriptionsTable`**. The migration is generated and committed but **not applied**
automatically — the `dotnet ef database update` command is returned to the user to run.

New packages (EF Core 10-compatible versions, confirmed at implementation):
`Microsoft.EntityFrameworkCore`, `Npgsql.EntityFrameworkCore.PostgreSQL`, `EFCore.NamingConventions`
(Infrastructure); `Microsoft.EntityFrameworkCore.Design` (Infrastructure, for `dotnet ef`). The
`DbContext` reuses the connection string already wired in EP-00 (`ConnectionStrings:FlowTrimDb`).

## 8. Validation and error cases
| Case | Expected result |
|---|---|
| `name` empty/whitespace | `400`, error on `name`, not persisted |
| `name` > 120 chars | `400`, error on `name` |
| `amount` <= 0 or missing | `400`, error on `amount` |
| `currency` not `^[A-Z]{3}$` | `400`, error on `currency` |
| `billingCycle` invalid | `400`, error on `billingCycle` |
| `nextBillingDate` missing/unparseable | `400`, error on `nextBillingDate` |
| `category` > 60 chars | `400`, error on `category` |
| All valid | `201`, persisted, `status = Active` |

Validation runs at the API boundary (DTO) **and** as domain invariants in `Subscription.Create`
(defense in depth). Domain invariant violations throw a domain exception; the boundary validation
prevents reaching them under normal input.

## 9. Edge cases
- Leading/trailing spaces in `name` are trimmed before validation and storage.
- `currency` lowercase (e.g. `cop`) is accepted and stored uppercased (`COP`).
- `amount` with more than 2 decimals: rounded to 2 by the `numeric(18,2)` column; decide at approval
  whether to reject instead (see open questions).
- `nextBillingDate` in the past: accepted (overdue is an HU-04 concern).
- Duplicate name: allowed in HU-01 (no uniqueness rule defined).

## 10. UI states (frontend)
- **Loading:** submit button disabled + spinner while the POST is in flight.
- **Empty:** the form itself is the initial state; no list in this story.
- **Success:** confirmation message; form reset (or ready for another entry).
- **Error:** field-level errors mapped from the API `400` body; a general message for network/500.
- **Accessibility:** labels tied to inputs, errors announced (aria-describedby), keyboard-navigable,
  COP currency formatting on display. Reactive forms with client validation mirroring the backend
  rules (backend remains the authority).

## 11. Test plan
Domain (xUnit, `FlowTrim.Tests`):
- `Create_WithValidData_ReturnsActiveSubscription`
- `Create_WithEmptyName_Throws`
- `Create_WithNonPositiveAmount_Throws`
- `Create_WithBlankName_TrimsAndThrowsWhenEmpty`
- `Create_WithLowercaseCurrency_StoresUppercased`
- `Create_SetsCreatedAndUpdatedFromTimeProvider`

Application (create use case, fake repository + fixed `TimeProvider`):
- `CreateAsync_WithValidRequest_PersistsAndReturnsResponse`
- `CreateAsync_MapsRequestToDomainCorrectly`

API/validation (where practical without a full integration host; otherwise documented manual check):
- `Post_WithInvalidAmount_Returns400` · `Post_WithValidPayload_Returns201`

Manual verification (recorded in the PR): POST a valid subscription → `201`; restart API, confirm the
row persists; POST invalid payloads → `400` with field errors. Frontend: submit valid/invalid forms.

## 12. Assumptions and open questions
- **Q1:** `GET /api/subscriptions/{id}` is deferred to HU-02; `POST` returns the body + a `Location`
  header to the (not-yet-implemented) route. OK? *(proposed: yes)*
- **Q2:** `category` is optional free text in HU-01 (catalog deferred). OK? *(proposed: yes)*
- **Q3:** `amount` with >2 decimals — **resolved: round to 2** (`MidpointRounding.AwayFromZero`), then enforce `> 0` on the rounded value.
- **Q4:** Currency validated by **format only** (`^[A-Z]{3}$`), not against a real ISO 4217 list, since
  the MVP is single-currency. OK? *(proposed: yes)*
- **Q5:** Minimal `400` validation now using `ValidationProblemDetails`; the centralized middleware and
  full field-error contract land in HU-09. OK? *(proposed: yes)*
- **A1:** The migration is generated and committed but applied manually by the user (`dotnet ef database
  update`), consistent with EP-00 (CLAUDE.md §4 migrations rule).

## 13. Task breakdown
- [ ] backend#4 — Domain: `Subscription` entity, `BillingCycle`/`SubscriptionStatus` enums, `Create` factory + invariants, unit tests.
- [ ] backend#5 — Persistence: EF Core packages, `FlowTrimDbContext`, `subscriptions` mapping (snake_case + constraints), migration `AddSubscriptionsTable`, DI wiring.
- [ ] backend#6 — API: `CreateSubscriptionRequest`/`SubscriptionResponse` DTOs, create use case + `ISubscriptionRepository`, `POST /api/subscriptions`, boundary validation.
- [ ] frontend#2 — UI: reactive subscription creation form, typed model + HTTP service, loading/success/error states.

## 14. Implementation notes (filled after delivery)
Delivered on 2026-10-14. Backend PR `FlowTrim-backend#31` (closes #4/#5/#6); frontend PR
`FlowTrim-frontend#14` (closes #2). No deviations from this spec.

- Boundary validation reports presence/parse errors (missing amount, unparseable billing cycle,
  missing date) together and returns early; value-rule errors (name, amount, currency, category)
  are reported one at a time by the domain. A single malformed payload may therefore surface only
  the parse error first. Comprehensive multi-field validation is HU-09.
- EF Core packages were aligned to `10.0.4` to avoid an assembly version conflict (MSB3277); the
  Npgsql provider pins that version. `dotnet-ef` is pinned as a local tool in `.config/dotnet-tools.json`.
- Migration `AddSubscriptionsTable` was applied to the local database for verification; on a clean
  checkout run `dotnet ef database update` (see backend README).
- Verified live: `POST` valid (`currency "cop"` stored as `COP`) → `201`; invalid → `400`; row persisted.
