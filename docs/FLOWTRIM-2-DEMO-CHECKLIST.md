# FlowTrim 2.0 Demo Checklist

## Before the demo

- [ ] CI is green for the release commit.
- [ ] `npm run e2e` (frontend) passes against the demo stack: sign-in, data, Insights evidence and account isolation.
- [ ] API health reports healthy API and database status.
- [ ] Frontend points to the intended environment.
- [ ] No real credentials or personal data are present in the repository.
- [ ] Demo account data is synthetic and clearly labelled.
- [ ] The selected identity provider is available.
- [ ] The AI provider key and quota are valid without appearing in logs.

## Five-minute path

1. Open the public landing page.
2. Sign in or create the demo account.
3. Show the protected workspace and the authenticated owner boundary.
4. Create or import a small subscription catalog.
5. Open the summary and show monthly equivalent and annual projection.
6. Open **FlowTrim Insights**, point at the privacy notice, and ask (verified in `docs/INSIGHTS-VERIFICATION.md`):
   - `How much do I spend per month on subscriptions?`
   - `Which charges are due in the next 7 days?`
   - `How much would I save in 12 months if I cancel Netflix?`
   - `What does each use of Netflix cost this month?` (cost per use is per subscription; no tool ranks it across
     subscriptions, so do not ask for "the highest")
7. Expand the answer evidence: figures (calculated by FlowTrim), assumptions, source links and "How this was
   answered"; open a source link to show the same number on the deterministic screen.
8. Show a controlled failure: an unsupported question ("Tell me a joke") and the rate-limit countdown after asking
   too many questions.
9. Sign out and confirm that the protected workspace is no longer available.

## Security evidence

- [ ] Account A cannot view account B subscriptions.
- [ ] Account A cannot edit or delete account B subscriptions.
- [ ] Account A cannot use account B identifiers in usage or simulation requests.
- [ ] Anonymous requests to private API routes are rejected.

## Import evidence

- [ ] Valid CSV preview.
- [ ] Invalid amount/date/cycle error by row and field.
- [ ] Possible duplicate classification.
- [ ] No persistence before confirmation.
- [ ] Repeated confirmation does not duplicate rows.

## Failure evidence

- [ ] API unavailable message is actionable.
- [ ] Database health failure does not expose connection details.
- [ ] AI timeout returns a controlled message (`504 insights_timeout`).
- [ ] Rate-limit response explains when to try again (`429` + countdown).
- [ ] Provider outage returns a controlled message (`502 insights_unavailable`) and the key never appears in logs.
- [ ] Expired import preview requires a new upload.

## Interview talking points

- Why the domain engine remains deterministic.
- Why the AI cannot execute SQL or calculate money.
- Why owner filtering exists in repositories and not only in Angular.
- Why subscription import is separate from transaction history.
- Why a modular monolith is sufficient for the current load.
- What evidence CI and integration tests provide.
