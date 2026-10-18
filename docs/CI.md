# Continuous Integration

FlowTrim uses GitHub Actions in the two code repositories (HU-38). The tracker repository holds
documentation only and has no CI.

## Workflows

| Repository | Workflow | Job (required check) | Steps |
|---|---|---|---|
| `FlowTrim-backend` | `.github/workflows/ci.yml` — **Backend CI** | `build-and-test` | .NET `10.0.x` → `dotnet restore` → `dotnet build -c Release` → `dotnet test -c Release` |
| `FlowTrim-frontend` | `.github/workflows/ci.yml` — **Frontend CI** | `test-and-build` | Node 22 (npm cache) → `npm ci` → `npm test -- --watch=false` → `npm run build` |

Both workflows:

- run on pull requests to `main`, on pushes to `main` and manually (`workflow_dispatch`);
- use `permissions: contents: read` and **no secrets** — backend HTTP tests use a fake authentication
  scheme and in-memory repositories, frontend tests run in jsdom;
- cancel an in-progress run when a newer commit arrives on the same branch, and time out after 15 minutes.

The backend job also runs the **PostgreSQL integration tests** (HU-47): Testcontainers starts a disposable
`postgres:17-alpine` container on the runner (Docker is preinstalled on GitHub-hosted Ubuntu runners), applies
the real migrations and removes it at the end. This adds about 20 seconds to the job (≈30 s → ≈50 s).

## Required checks (branch protection)

`main` is protected in both repositories:

| Setting | Value |
|---|---|
| Required status check | backend `build-and-test` · frontend `test-and-build` |
| Require branches to be up to date | No |
| Required reviews | None (single maintainer) |
| Include administrators | **Yes** — the owner cannot bypass a red check |

A pull request cannot be merged while its check is pending or failing. Direct pushes to `main` are not
part of the workflow (see `CLAUDE.md` §8).

Verify the configuration with:

```bash
gh api repos/Andermc10/FlowTrim-backend/branches/main/protection --jq '.required_status_checks.contexts, .enforce_admins.enabled'
```

## Reading a failed run

1. Open the pull request → **Checks** → the failed job.
2. Expand the failed step: `Build`/`Production build` = compile or TypeScript error; `Test`/`Unit tests` =
   failing test (the test name and assertion are printed); `Install dependencies` = `package-lock.json`
   out of sync with `package.json` (run `npm install` locally and commit the lockfile).
3. Fix on the same branch and push; the check re-runs automatically.

## Known warnings

- Backend log shows `NU1903` for the transitive `Microsoft.OpenApi 2.0.0` (backend `docs/TECH-DEBT.md`
  TD-001). Warnings do not fail the build.

## Verification (2026-10-18)

- First runs on the workflow PRs (backend #65, frontend #74): green — 120/120 backend tests, 38/38
  frontend tests and production build; no secrets in the logs.
- Failure proof: throwaway PRs with a deliberately failing test (backend #66, frontend #75) → check
  failed, merge state `BLOCKED`, `gh pr merge` rejected; PRs closed and branches deleted.
- After merging, the push runs on `main` were green in both repositories.
