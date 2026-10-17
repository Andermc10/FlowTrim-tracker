# HU-12: Authentication and Owner Isolation

- **Status:** Approved _(2026-10-17, by Ander)_
- **Story / Issue:** FlowTrim-tracker#13 · tasks: backend#42 (OIDC/JWT), backend#43 (ownership + migration),
  backend#44 (owner-scoped repositories), backend#45 (auth + cross-user tests), frontend#60 (login, guard,
  interceptor), frontend#61 (authenticated route and error states)
- **Priority:** P0
- **Epic:** EP-04
- **Author / Date:** Ander (with Claude) · 2026-10-17

## 1. Context and goal
Before FlowTrim can hold private financial data or be deployed publicly, every subscription must belong to
one authenticated person and the API must never let one person read or change another person's data.
FlowTrim does not store passwords: identity is delegated to an external OIDC provider.

A first implementation was merged in backend PR #63 and frontend PR #71 **before this spec was approved**.
This spec is the contract; the follow-up work closes the gaps listed in §14.

## 2. Scope
**In scope:**
- **Auth0** as the OIDC provider (one hosted tenant for local development and future deployment).
- API validates Auth0 access tokens with `JwtBearer` (issuer, audience, signature via JWKS, lifetime).
- Every subscription has an owner = the token's stable `sub` claim; repositories filter by owner.
- All private routes require authentication; `GET /api/health` stays public.
- Angular: Authorization Code + PKCE login, callback, route guard, bearer interceptor, sign-out and a safe
  re-authentication path when the session expires.
- API integration tests over HTTP with a fake authentication scheme (no real tokens, no real database).

**Out of scope:**
- A local `users` table or user profile (owner key is `sub`; see §7).
- Refresh tokens / silent renew, roles, sharing data between users, account deletion.
- Real PostgreSQL integration tests (HU-47) and public deployment (EP-06).

## 3. Functional requirements
- **FR-1:** The API validates bearer tokens issued by the configured `Authentication:Authority` for the
  configured `Authentication:Audience`. Tokens are never validated manually.
- **FR-2:** `Authority` and `Audience` are required in **every** environment; startup fails fast with a clear
  message if either is missing (validated on start, so `dotnet ef` design-time tooling is unaffected).
- **FR-3:** The default authorization policy requires an authenticated user **with a `sub` claim**.
- **FR-4:** Private routes (subscriptions, upcoming, summary, usage records, cost per use, simulations)
  return `401` without a valid token. `GET /api/health` and OpenAPI (Development only) stay anonymous.
- **FR-5:** The owner id is taken only from the token. Requests never accept an owner/user id.
- **FR-6:** Reading, updating or deleting another owner's subscription (or its usage) returns the same
  `404` as a missing id (no existence leak).
- **FR-7:** Summary, upcoming charges, simulations and cost per use only use the current owner's rows; a
  simulation selecting another owner's id behaves as if the id did not exist.
- **FR-8:** Angular protects `/app/**` with a guard that redirects to `/auth/login?returnUrl=…`.
- **FR-9:** The interceptor attaches `Authorization: Bearer …` only to FlowTrim API requests (exact API
  origin/path prefix match), never to the identity provider.
- **FR-10:** When a FlowTrim API request returns `401`, the client clears the local session and navigates to
  `/auth/login?returnUrl=<current url>&reason=expired`, where the login page explains the session expired.
- **FR-11:** Sign-out clears the local session and, when the provider discovery document exposes an
  `end_session_endpoint`, redirects there with `client_id` and a `post_logout_redirect_uri` to `/`.

## 4. Business rules
- Owner key: `sub` claim, trimmed, 1–200 chars. Missing/empty → the request is not authorized.
- Every subscription has exactly one owner; usage records inherit ownership through their subscription.
- Financial rules (CLAUDE.md §5) are unchanged; they now operate on the current owner's rows only.

## 5. Acceptance criteria
- **AC-1:** Given no token, when any private route is called, then it returns `401`.
- **AC-2:** Given owners A and B, when A gets, updates or deletes B's subscription, then it returns `404`
  and B's data is unchanged.
- **AC-3:** Given owners A and B, when A lists subscriptions, summary, upcoming charges, usage records,
  cost per use or simulations, then only A's data is used.
- **AC-4:** Given an authenticated session, when `/app` loads, then Angular sends the bearer token and the
  protected routes render real data.
- **AC-5:** Given an expired session, when an API request returns `401`, then the client clears the session
  and shows the login page with a "session expired" message and a sign-in action.
- **AC-6:** Given missing `Authority` or `Audience`, when the API starts, then it fails with a clear message.
- **AC-7:** `GET /api/health` returns `200` without a token.

## 6. API contract
No new routes. Existing private routes add `401 Unauthorized` (missing/invalid token) and `403 Forbidden`
(token without `sub`). Error bodies stay RFC 7807 `ProblemDetails`; no token details are returned.

Configuration (User Secrets in dev, environment variables in deploy):
```
Authentication:Authority  = https://<tenant>.<region>.auth0.com/
Authentication:Audience   = <Auth0 API identifier, e.g. https://api.flowtrim.dev>
Authentication:RequireHttpsMetadata = true
```
Angular `environment*.ts` holds the public SPA values (`authority`, `clientId`, `audience`, `scope`).
These are public identifiers, not secrets.

## 7. Data model changes
Migration `AddUserOwnership` (not yet applied anywhere; corrected in place):
- `subscriptions.owner_id varchar(200) NOT NULL`, check `ck_subscriptions_owner_id_not_empty`
  (`owner_id <> ''`), index `ix_subscriptions_owner_id_next_billing_date (owner_id, next_billing_date)`.
- Existing rows are back-filled with `'legacy-owner'` only during the migration; the column default is
  **dropped** afterwards so no future row can silently get an owner.
- Decision: **no `users` table** while there is no user profile. `owner_id` stores the provider `sub`;
  a `users` table can be introduced later without changing the API.
- Local demo data is **reset** (recreate the Docker volume); the legacy rows are not reassigned.

## 8. Validation and error cases
| Case | Expected result |
|---|---|
| No `Authorization` header on a private route | `401` |
| Expired / wrong-audience / wrong-issuer / bad-signature token | `401` |
| Valid token without `sub` | `403` |
| Another owner's subscription id (get/put/delete/usage/cost-per-use) | `404` |
| Body contains an owner/user id field | Ignored (not part of the DTO) |
| API started without Authority/Audience | Startup fails with a clear message |

## 9. Edge cases
- Same subscription id requested by two owners → only the owner sees it.
- Simulation with a mix of own and foreign ids → foreign ids are ignored.
- Token expires while a page is open → next API call returns 401 → re-authentication path (FR-10).
- Login callback with mismatched `state` or missing verifier → error message, no token stored.
- `returnUrl` pointing to another origin → replaced by `/app` (open-redirect protection).

## 10. UI states
- Login: idle, starting (button disabled), provider-configuration error, "session expired" notice.
- Callback: finishing, error with a link back to login.
- Workspace: existing loading / empty / success / error states, plus sign-out in the shell.

## 11. Test plan
Backend (xUnit):
- `PrivateRoute_WithoutToken_ReturnsUnauthorized` (theory over every private route) — AC-1
- `Health_WithoutToken_ReturnsOk` — AC-7
- `TokenWithoutSubject_ReturnsForbidden` — FR-3
- `SubscriptionList_TwoOwners_ReturnsOnlyCurrentOwnerRows` (HTTP) — AC-3
- `NonOwnerSubscription_GetUpdateDelete_ReturnsNotFound` (HTTP) — AC-2
- `Summary_UsesCurrentOwnerOnly`, `Simulation_WithOtherOwnerSelection_IgnoresIt`,
  `Usage_OtherOwnerSubscription_ReturnsNotFound` — AC-3
- `Startup_WithoutAuthority_Fails` — AC-6
- Existing domain/handler tests keep passing with a strict in-memory owner filter (no wildcard owner).

HTTP tests use `WebApplicationFactory` with a test authentication scheme that reads the subject from a
request header, and in-memory repositories (no database). New test dependency:
`Microsoft.AspNetCore.Mvc.Testing` (version matching ASP.NET Core 10).

Frontend (Vitest): interceptor attaches token only to API URLs; interceptor clears session and redirects on
401; guard redirects anonymous users; `safeReturnUrl` rejects external URLs.

Manual: browser E2E with the Auth0 dev tenant — sign in, create a subscription, sign out, sign in as a
second user and confirm the first user's data is not visible.

## 12. Assumptions and open questions
- Ander creates the Auth0 tenant: one **API** (identifier = audience, RS256) and one **Single Page
  Application** (callback `http://localhost:4200/auth/callback`, logout URL and web origin
  `http://localhost:4200`).
- Access tokens live in `sessionStorage` (cleared when the tab closes); no refresh token in this story.
- No open questions remain.

## 13. Task breakdown
- [ ] backend#42: options validated on start, `sub`-requiring default policy, CORS headers.
- [ ] backend#43: correct `AddUserOwnership` (drop default), single owner-aware `Subscription.Create`.
- [ ] backend#44: owner predicates (done in PR #63), fail fast when the subject is missing.
- [ ] backend#45: HTTP integration tests with fake authentication; strict in-memory owner filter.
- [ ] frontend#60: 401 → session-expired re-authentication path, provider sign-out.
- [ ] frontend#61: guard/interceptor tests and browser verification with Auth0.

## 14. Implementation notes
- PR #63 / PR #71 (2026-10-17) delivered JWT validation, owner predicates and the PKCE flow but were merged
  without spec approval and left gaps: no HTTP 401 tests, no expired-session handling, empty Authority
  accepted in Development (local workspace unusable), wildcard owner in the test double, permanent
  `'legacy-owner'` column default, and an owner-less `Subscription.Create` factory.
