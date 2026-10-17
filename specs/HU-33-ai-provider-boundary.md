# HU-33: Configure the AI Provider Boundary

- **Status:** Draft
- **Priority:** P1
- **Epic:** EP-05
- **Dependencies:** HU-12

## Goal

Keep provider-specific networking and credentials behind a small typed contract.

## Acceptance criteria

- Provider settings come from environment configuration.
- No API key appears in source, logs, tests or client bundles.
- Requests support timeout, cancellation and bounded output.
- A fake provider can be injected without network access.

## API and data changes

No public route or database change. Add infrastructure options and an application provider contract.

## Tests

`ProviderConfiguration_MissingRequiredKey_FailsSafely`, `FakeProvider_ReturnsDeterministicResponse`, `ProviderTimeout_MapsToControlledError`.

## Tasks

- [ ] backend: provider options and adapter.
- [ ] backend: fake provider and failure tests.
