# HU-12: Authentication and Owner Isolation

- **Status:** Draft
- **Priority:** P0
- **Epic:** EP-04
- **Dependencies:** MVP v1.0

## Goal

Allow authenticated users to operate on private subscription data while enforcing ownership in the API and persistence boundary.

## Scope

OIDC/JWT validation, application-user mapping, owner foreign keys, owner-scoped repositories and Angular guard/interceptor.

## Acceptance criteria

- Given no token, when a private API route is called, then it returns 401.
- Given owner A and owner B, when A requests B’s subscription, then no B data is returned.
- Given owner A, when A lists summary, upcoming charges, usage or simulations, then only A data is used.
- Given an authenticated session, when `/app` loads, then Angular sends the bearer token and protected routes are available.
- Given an expired session, when an API request returns 401, then the client presents a safe re-authentication path.

## API and data changes

Existing private routes gain authorization. Add `users`, `subscriptions.user_id` and `AddUserOwnership`. Do not accept `userId` from request payloads.

## Tests

`PrivateRoute_WithoutToken_ReturnsUnauthorized`, `SubscriptionList_TwoOwners_ReturnsOnlyCurrentOwnerRows`, `NonOwnerSubscription_Delete_ReturnsSafeNotFound`, `Summary_UsesCurrentOwnerOnly`.

## Tasks

- [ ] backend: authentication, identity mapping, migration and owner predicates.
- [ ] frontend: login handoff, guard, interceptor and session errors.
- [ ] backend: API integration tests with fake authentication.

## Open questions

Select one OIDC provider and choose reset-versus-assignment for existing local rows.
