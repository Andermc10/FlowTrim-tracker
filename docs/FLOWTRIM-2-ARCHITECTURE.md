# FlowTrim 2.0 Architecture Decisions

## 1. Preserve the modular monolith

FlowTrim remains one deployable ASP.NET Core backend with the existing dependency direction:

```text
FlowTrim.Api -> FlowTrim.Application -> FlowTrim.Domain
       \-> FlowTrim.Infrastructure -> FlowTrim.Application / Domain
```

The Angular application remains a standalone feature-based SPA using the existing services, signals, SCSS and localization approach.

No microservice, second backend or competing global state manager is introduced.

## 2. Identity versus ownership

Authentication is provided by one selected OIDC/JWT identity provider. The API validates the token, then maps the stable external subject to an application identity used by the domain data.

The client never supplies an owner identifier. Repositories derive ownership from the authenticated request context. Route guards improve the UX, but authorization remains server-side.

Expected persistence changes:

- An application user mapping with a unique external subject.
- An owner foreign key on `subscriptions`.
- Usage records remain owned through their subscription, with queries enforcing the same boundary.
- Explicit indexes and foreign-key delete behavior.

The migration strategy for existing single-user development data must be chosen before applying the first ownership migration: reset the disposable demo database or assign legacy rows through a controlled one-time operation.

## 3. Deterministic AI boundary

The AI provider is an infrastructure integration behind a small application contract. The provider may interpret natural language and select an allow-listed tool, but it cannot:

- Execute SQL.
- Read the database directly.
- Modify subscriptions or usage records.
- Replace C# financial calculations.
- Access another owner's data.

The financial tool layer reuses existing handlers and domain calculators. Each tool receives the authenticated owner context and returns typed results with currency, assumptions and data provenance.

The Insights response contains:

- Explanatory answer.
- Deterministic figures used.
- Assumptions.
- Source references or affected subscriptions.
- A safe status for unsupported questions, no data, provider failure or rate limits.

Conversations are not persisted in the MVP. Logs must not contain full prompts, tokens or private response bodies by default.

## 4. Configuration and secrets

Connection strings, identity settings and AI credentials are supplied through User Secrets locally and managed environment secrets in deployment. `.env.example` contains placeholders only.

Production CORS allows the deployed frontend origin and required headers, including `Authorization`. It must not use a wildcard origin with credentials.

## 5. Deployment

The first public environment should use the simplest hosting arrangement that supports:

- Angular production output.
- ASP.NET Core API.
- PostgreSQL persistence.
- Environment secrets.
- Health checks and logs.

Kubernetes, service meshes and distributed queues are explicitly out of scope.

## 6. Subscription CSV scope

EP-07 imports the current `Subscription` shape only:

```text
name,amount,currency,billingCycle,nextBillingDate
```

It creates expected subscription records. It does not import bank transactions, prove that a charge occurred or create historical payment data. HU-14 remains reserved for a future transaction model.

## 7. Test strategy

- Domain and application unit tests remain in xUnit.
- Security and ownership behavior is tested through the API boundary with fake authentication.
- PostgreSQL integration tests apply real migrations and constraints.
- Angular tests cover auth, Insights, import states and accessibility-sensitive behavior.
- Browser smoke tests verify the critical deployed journey.

The strategy adds evidence around the existing architecture; it does not replace the current test framework or introduce an alternative application pattern.
