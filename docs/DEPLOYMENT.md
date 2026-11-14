# Public demo deployment runbook (HU-40)

How to deploy and operate the free public demo described in `specs/HU-40-public-demonstration-environment.md`.
Every service runs on a free plan. Secrets are typed **only** into the provider dashboards (or your local shell for
migrations) — never into Git, chat or issues.

| Piece | Provider | URL (filled after creation) |
|---|---|---|
| Web (Angular) | Cloudflare Pages | `https://<project>.pages.dev` |
| API (.NET 10, Docker) | Render free web service | `https://<service>.onrender.com` |
| PostgreSQL | Neon free | private connection string |

> Free-plan limits change. They were checked on 2026-11-13; confirm them on each provider's pricing page while creating
> the accounts.

## 1. One-time setup

### 1.1 Neon (database)
1. Create an account and a project named `flowtrim`. Pick a region close to the Render region (for example AWS
   `us-east-2` with Render `Ohio`).
2. Copy the **direct** (not pooled) connection details and turn them into an Npgsql connection string:
   `Host=<host>;Database=neondb;Username=<user>;Password=<password>;SSL Mode=Require`
3. Keep it only in your password manager. It is the value of `ConnectionStrings__FlowTrimDb`.

### 1.2 Apply the migrations (explicit step, D4)
From `FlowTrim-backend`, with the connection string in an environment variable of **your current shell only**:

```powershell
$env:NEON_DB = '<npgsql connection string>'
dotnet ef migrations script --idempotent --project src/FlowTrim.Infrastructure --startup-project src/FlowTrim.Api --output migrations.sql
# Review migrations.sql (project rule: read the SQL before applying), then:
dotnet ef database update --project src/FlowTrim.Infrastructure --startup-project src/FlowTrim.Api --connection $env:NEON_DB
Remove-Item migrations.sql; Remove-Item Env:NEON_DB
```

Repeat this step whenever a merged PR adds a migration, **before** that API version is deployed.

### 1.3 Render (API)
1. Create an account, then **New › Web Service** from the `Andermc10/FlowTrim-backend` repository.
2. Runtime **Docker** (the `Dockerfile` at the repo root), branch `main`, plan **Free**, auto-deploy on.
3. Health check path: `/api/health`.
4. Environment variables (names only here; values in the dashboard):

| Variable | Secret | Value |
|---|---|---|
| `ConnectionStrings__FlowTrimDb` | **Yes** | Neon connection string (1.1) |
| `Authentication__Authority` | No | `https://dev-flowtrim.us.auth0.com/` |
| `Authentication__Audience` | No | `https://api.flowtrim.dev` |
| `Cors__AllowedOrigins__0` | No | The exact Pages origin, e.g. `https://<project>.pages.dev` (no trailing slash) |
| `Insights__Provider__Kind` | No | `OpenAiCompatible` |
| `Insights__Provider__BaseUrl` | No | `https://api.groq.com/openai/v1` |
| `Insights__Provider__Model` | No | `openai/gpt-oss-120b` |
| `Insights__Provider__ApiKey` | **Yes** | Groq key (create a separate key for the demo) |

`ASPNETCORE_ENVIRONMENT=Production`, the port (`10000`) and `ASPNETCORE_FORWARDEDHEADERS_ENABLED=true` come from the
image. A missing variable makes the deploy fail with its **name** in the log (never its value).

### 1.4 Cloudflare Pages (web)
1. After the API URL exists, set it in `FlowTrim-frontend/src/environments/environment.production.ts` (`apiUrl`) and in
   the CSP of `public/_headers`, through a normal PR.
2. Create a Pages project from `Andermc10/FlowTrim-frontend`, branch `main`:
   - Build command: `npm ci && npx ng build`
   - Output directory: `dist/flowtrim-frontend/browser`
   - Environment variable: `NODE_VERSION` = `22.23.3`
3. No `404.html` is published, so Pages serves `index.html` for deep links such as `/app/transactions`.

### 1.5 Auth0 (existing tenant `dev-flowtrim`)
In the **web** application (not the mobile Native one), add the Pages origin:
- Allowed Callback URLs: `https://<project>.pages.dev/auth/callback`
- Allowed Logout URLs: `https://<project>.pages.dev/`
- Allowed Web Origins: `https://<project>.pages.dev`

Keep the localhost entries for development.

## 2. Verify a deploy
Run from Git Bash after every deploy and record the result in `docs/E2E-ACCEPTANCE.md`:

```bash
scripts/smoke-demo.sh https://<service>.onrender.com https://<project>.pages.dev
```

It checks: health `200` with a healthy database, a protected route `401` without a token, a deep link served by Pages,
CORS allowed for the Pages origin and refused for another origin. Then sign in once in a browser (AC-1) and ask the AI
Assistant one question (AC-7).

## 3. Operate
- **Logs:** Render › service › Logs (JSON lines). Search by the `Reference` a user sees (`CorrelationId`), see
  `docs/OPERATIONS.md`.
- **Rotate the Groq key:** create a new key in Groq, update `Insights__Provider__ApiKey` in Render (it redeploys),
  delete the old key.
- **Rotate the database password:** reset it in Neon, update `ConnectionStrings__FlowTrimDb` in Render.
- **Restart check (AC-6):** Render › Manual Deploy › Restart; data created before must still be there.

## 4. Known limits of the free plans
| Limit | Effect | What to do |
|---|---|---|
| Render sleeps after 15 min without traffic | First request takes about a minute; the web shows its loading state | Expected; mention it when sharing the link. Do not add uptime pings (they burn the free hours). |
| Render 750 free instance hours per month (shared by the workspace) | Free services are suspended until next month | Keep a single free service in the workspace |
| Neon scales to zero after 5 min; 100 CU-hours and 1 GB per month | First query after idle is slower; writes fail at 1 GB | Check usage in the Neon dashboard |
| Groq free quota (1,000 requests/day for this account; 5 questions/min per user in FlowTrim) | AI answers `429`/`502` with a reference | Expected; figures elsewhere are unaffected |
| Anyone with an Auth0 account can sign up | Their data is isolated per owner (HU-12) | Keep demo data synthetic; never enter real finances |
