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

### Revised order (2026-10-18, decided by Ander)

FlowTrim is a portfolio and practice project with **no budget for paid hosting or paid AI**. The goal is
an active, high-quality GitHub, not a production service. Revised order after HU-12 and HU-38:

1. **HU-39** — environment and CORS hardening (no cost; production-ready configuration even if not deployed).
2. **HU-47** — PostgreSQL integration tests (Testcontainers in CI).
3. **HU-41** — structured logs and correlation ids.
4. **EP-10 / EP-09 (added 2026-10-18)** — HU-53 animated toasts → HU-50 analytics endpoint → HU-51 analytics
   workspace (Chart.js) → HU-52 CSV export + printable PDF report → HU-54 upcoming-charge alert toasts.
5. **EP-05 (HU-33 → HU-37)** — FlowTrim Insights. The local machine cannot run models (no Ollama); the AI
   provider strategy (fake provider + a free-tier option) is decided before HU-33.
6. **HU-48** — browser critical flow in CI.
7. **EP-07 (HU-43 → HU-46)** — subscription catalog CSV import.
8. **HU-40** — optional, **free-tier only** deployment (e.g. Firebase Hosting for Angular, Render free web
   service for the API, Neon free PostgreSQL). Until then the demo is documented with screenshots/video.
9. **HU-42 / HU-49** — portfolio evidence and release readiness.

Constraints: no paid services; free tiers are accepted with their limits documented honestly (cold starts,
storage caps, rate limits).

### AI provider strategy (2026-10-18, approved by Ander)

The local machine cannot run models, and there is no budget for paid AI. EP-05 therefore uses:

1. **Own boundary** — an application-layer interface for the chat model; no provider SDK leaks into the
   domain or application logic.
2. **Fake provider by default** — deterministic, no network, no key. Used by tests, CI and anyone who
   clones the repositories.
3. **One OpenAI-compatible adapter** — configured only through `BaseUrl`, `Model` and an API key in User
   Secrets / environment variables (never in Git). Switching between free-tier providers (GitHub Models,
   Groq, OpenRouter, Gemini's OpenAI-compatible endpoint) is a configuration change, not a code change.
   ~~Initial choice: GitHub Models~~ — **GitHub Models was retired on 2026-07-30** (found on 2026-10-19: its API
   answers `200 OK` text/plain). **Current choice: Groq** free tier (`https://api.groq.com/openai/v1`,
   `openai/gpt-oss-120b`; 1,000 requests/day and 8,000 tokens/minute for this account, tool calling verified live),
   with OpenRouter as the configuration-only fallback. Gemini's free tier was not chosen because outside the
   EEA/UK/CH prompts may be used to improve Google's products.
4. **The AI explains, it never calculates** — the model can only request allow-listed deterministic C#
   tools (summary, simulation, upcoming charges, cost per use), always scoped to the authenticated owner;
   answers carry the figures, the tools used and their assumptions.
5. **Controlled failures** — rate limits (`429`), timeouts and provider errors produce a clear message;
   the rest of the app keeps working.
6. **Privacy** — free tiers may retain prompts; only demo data is used with real providers, and the README
   says so.

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
