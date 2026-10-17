# FlowTrim 2.0 Roadmap

## Objective

Turn the existing FlowTrim MVP into a secure, deployable and interview-ready portfolio project without replacing the current modular monolith, deterministic financial engine or Angular feature structure.

## Product narrative

FlowTrim 2.0 tells one coherent story:

1. A user signs in to a private workspace.
2. The user imports or registers recurring subscriptions.
3. FlowTrim computes financial values through deterministic C# rules.
4. FlowTrim Insights explains those values through an allow-listed AI orchestration boundary.
5. CI verifies the code and the application is available through a reproducible deployment.

The assistant explains data; it does not invent financial calculations, execute SQL or perform financial actions.

## Scope by epic

| Epic | Scope | Priority | Target |
|---|---|---:|---|
| EP-04 | Secure multi-user foundation and owner isolation | P0 | Required before public private-data demo |
| EP-05 | FlowTrim Insights with deterministic financial tools | P1 | Main differentiator |
| EP-06 | CI/CD, deployment and observability | P0 | Required for a credible public demo |
| EP-07 | Subscription catalog CSV import | P1 | Include if the core path is stable |
| EP-08 | Integration tests and portfolio evidence | P0 | Release confidence and interview evidence |

## Implementation order

### Sprint 1 — Secure foundation

- Start CI for backend and frontend.
- Configure the selected OIDC/JWT provider.
- Add application identity and ownership columns.
- Scope every repository and handler by the authenticated owner.
- Add Angular guard, authentication flow and token interceptor.
- Add cross-user integration tests.

### Sprint 2 — Product differentiator and delivery

- Add the AI provider boundary and fake provider.
- Expose deterministic financial tools.
- Add the protected Insights endpoint and Angular feature.
- Configure production secrets, CORS and deployment.
- Add health, structured logs and correlation evidence.

### Sprint 3 — Optional onboarding and release evidence

- Add subscription catalog CSV preview and confirmation.
- Add PostgreSQL integration tests and browser smoke flow.
- Complete the release checklist, README and demo script.

If time is limited, defer EP-07 before deferring EP-04, EP-06 or EP-08.

## Target evidence

| Capability | Evidence |
|---|---|
| Security | Two accounts, isolated data and negative authorization tests |
| Backend | Owner-scoped handlers, migrations, validation and deterministic tools |
| AI | Four representative questions with tool results, assumptions and controlled failures |
| DevOps | Green CI, production build and repeatable deployment |
| UX | Authenticated workspace, Insights states, responsive and accessible interaction |
| Quality | PostgreSQL integration tests and browser smoke flow |

## Explicit non-goals

- Bank connections or transaction reconciliation.
- Treating expected renewals as confirmed payments.
- Verifying declared usage automatically.
- A custom password recovery system.
- Microservices, Kubernetes or RabbitMQ.
- Python/FastAPI analytics extraction.
- RAG, vector databases or autonomous agents.
- Automatic cancellation of third-party subscriptions.
- Email and push notifications in this increment.

## Existing backlog decisions

- HU-12 is refined as the security foundation and included in EP-04.
- HU-13 remains deferred for scheduled external notifications.
- HU-14 remains reserved for future confirmed transaction imports.
- HU-15 remains deferred unless a measured analytics requirement justifies Python/FastAPI.
- HU-43 to HU-46 cover subscription catalog import without claiming transaction history.

## Definition of success

FlowTrim 2.0 is ready to present when every P0 story is verified, the public demo is healthy, CI is green, no real credentials or personal data are committed, and the documentation matches the deployed behavior.
