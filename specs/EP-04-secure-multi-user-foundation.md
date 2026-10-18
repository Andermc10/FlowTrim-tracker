# EP-04: Secure Multi-User Foundation

- **Status:** Implemented _(2026-10-18, delivered by HU-12)_
- **Story / Issue:** FlowTrim-tracker#EP-04 · implementation story: HU-12
- **Priority:** P0
- **Author / Date:** FlowTrim team / October 2026

## 1. Context and goal

FlowTrim currently has a single shared data boundary. This epic adds authenticated identity and server-side ownership so a public demo can handle private subscription data safely.

## 2. Scope

**In scope:** one OIDC/JWT provider, authenticated Angular workspace, API token validation, application identity mapping, owner-scoped repositories and negative authorization tests.

**Out of scope:** custom password storage, custom recovery flows, roles/teams, social-provider catalog, bank connections and authorization based only on Angular state.

## 3. Functional requirements

- FR-1: Private API routes require a valid token.
- FR-2: Every subscription belongs to one application owner.
- FR-3: Usage, summary, upcoming charges, cost-per-use and simulation use the authenticated owner boundary.
- FR-4: Anonymous and cross-owner access is rejected safely.

## 4. Business rules

- The client cannot select or override the owner identifier.
- Missing and non-owned resource identifiers use the same safe not-found behavior where appropriate.
- Existing development data must be reset or assigned through a documented migration strategy.

## 5. Acceptance criteria

- AC-1: Given an anonymous request, when it accesses a private route, then the API returns 401.
- AC-2: Given an authenticated owner, when it lists data, then only that owner’s rows are returned.
- AC-3: Given two owners, when one uses the other’s identifier, then it cannot read, update, delete or simulate the other owner’s data.
- AC-4: Given a valid authenticated session, when the user opens `/app`, then Angular allows access and sends the bearer token.

## 6. API contract

Existing private routes keep their names and add authorization. `/api/health` remains public.

| Method | Route | Request | Success | Errors |
|---|---|---|---|---|
| Any | Existing private routes | Bearer token | Existing response | 401 / 403 / existing 404 |

## 7. Data model changes

- **Decision (2026-10-17, HU-12):** no `users` table while there is no user profile. The owner key is
  the provider `sub` claim, stored in `subscriptions.owner_id` (`varchar(200)`, `NOT NULL`, check
  `owner_id <> ''`, index `(owner_id, next_billing_date)`). A `users` table can be added later without
  changing the API.
- Usage records remain protected through their subscription and owner-scoped queries.
- Migration: `AddUserOwnership`.

## 8. Validation and error cases

| Case | Expected result |
|---|---|
| Missing token | 401 without internal details |
| Invalid or expired token | 401 |
| Valid token for another owner | 404 or 403 according to endpoint contract, never data leakage |
| Missing required identity configuration | Safe startup failure |

## 9. Edge cases

- Existing single-user rows during migration.
- Token with a valid signature but wrong issuer or audience.
- User deleted or disabled at the identity provider.
- Direct API access without Angular.

## 10. UI states

Login, redirect, authenticated workspace, expired session, unauthorized, forbidden and logout states. Focus and error announcements must remain accessible.

## 11. Test plan

- `PrivateRoute_WithoutToken_ReturnsUnauthorized`.
- `SubscriptionList_TwoOwners_ReturnsOnlyCurrentOwnerRows`.
- `NonOwnerSubscription_Update_ReturnsSafeNotFound`.
- `NonOwnerUsageAndSimulation_CannotReadOtherOwnerData`.
- `WorkspaceRoute_WithoutSession_RedirectsToLogin`.

## 12. Assumptions and open questions

- Resolved: provider **Auth0**; local demo database **reset** (pre-auth rows back-filled with the
  inaccessible owner `legacy-owner`, column default dropped).

## 13. Task breakdown

- [x] backend: configure authentication and current-user mapping.
- [x] backend: add ownership migration and repository predicates.
- [x] backend: add authorization integration tests.
- [x] frontend: add provider flow, route guard and token interceptor.

## 14. Implementation notes

Delivered entirely by HU-12 (see `specs/HU-12-authentication-and-owner-isolation.md` §14). Valid tokens
for another owner always get `404` (never `403`), so existence is not leaked; a token without `sub` gets
`403`. Evidence: `docs/E2E-ACCEPTANCE.md` rows 15–17.
