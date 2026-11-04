# EP-17: FlowTrim Mobile (React Native + Expo)

- **Status:** Approved _(2026-11-03, Ander)_
- **Story / Issue:** epic #191 · HU-81 #192 · HU-82 #193 · HU-83 #194 · HU-84 #195 · HU-85 #196 · HU-86 #197 · HU-87 #198 ·
  HU-88 #199 · HU-89 #200 · HU-90 #201 · HU-91 #202 · milestone "FlowTrim Mobile"
- **Priority:** P1 (portfolio expansion; runs in parallel with HU-40)
- **Dependencies:** EP-12 (accounts, categories, transactions, Today), EP-14 (recurring payments, mark as paid),
  EP-15 (budgets, goals), HU-12 (Auth0, owner isolation), HU-41 (correlation id), **HU-40** (public HTTPS API — needed
  for the demo, not for development)
- **Author / Date:** Ander (with Claude) · 2026-11-03

## 1. Context and goal
FlowTrim 3.0 is complete on the web. The portfolio shows Angular and .NET but no mobile work, and the API has a single
client. Goal: a **native mobile companion app** for the daily moments — "how much can I spend today?", "I just paid
something", "this bill is due" — built with **React Native + Expo + TypeScript** in the repo `FlowTrime-Mobile`,
consuming the **existing API without changes**. It proves the API is a reusable platform and adds a second,
market-relevant frontend stack (React, mobile) to the portfolio.

The web app stays the full workspace (imports, reports, analytics, simulator, AI Assistant). The mobile app is
deliberately smaller; the README says so.

## 2. Decisions (approved by Ander on 2026-11-03)

| # | Topic | Decision | Why |
|---|---|---|---|
| D1 | Stack | **Expo (managed workflow) + React Native + TypeScript strict**, latest stable Expo SDK at HU-81 time, every dependency pinned exactly. Routing with **`expo-router`** (file-based, typed routes). | Ander's choice; React + mobile add the most portfolio value; Expo builds Android without Android Studio. |
| D2 | Hosting | HU-40 runs **in parallel**. Development uses the local API over the LAN (`http://<pc-ip>:5214`, dev builds only); the demo and release build point to the public **HTTPS** API. | Not blocked by hosting; the release build never talks cleartext HTTP. |
| D3 | Reminders | The app may schedule **local device reminders** for expected charges, **opt-in only**. FlowTrim still sends no e-mail and no server push. **Rule change:** CLAUDE.md §5 "Alerts are visual, in-app only" becomes "The web shows in-app alerts only; the mobile app may schedule local reminders on the device when the user opts in; never claim an e-mail or push was sent." Updated in the PR that approves this spec. | Ander's choice; real native value with no server or cost. |
| D4 | Platform target | **Android first** (dev build on a real phone, APK in GitHub Releases). iOS is **out of scope**: native sign-in needs a development build, and iOS builds need an Apple Developer account (paid). The code stays cross-platform (no Android-only APIs without a fallback). | No budget (2026-10-18 decision). |
| D5 | Repository and board | Public repo **`Andermc10/FlowTrime-Mobile`** (created by Ander; local folder `FlowTrim/FlowTrime-Mobile`), linked to the FlowTrim GitHub Project. Stories and the spec live in **FlowTrim-tracker** (same SDD flow, milestone **"FlowTrim Mobile"**, label `platform:mobile`); technical tasks live in the mobile repo as sub-issues. `main` protected with a required CI check, like backend/frontend. | Same proven process; one board. |
| D6 | API contract | No backend change is planned. The mobile repo keeps a **committed snapshot** of the API's OpenAPI document (`api/openapi.json`, exported from the local Development API, where `MapOpenApi` already runs) and generates types with **`openapi-typescript`**; requests go through **`openapi-fetch`**. A script `npm run api:sync` refreshes the snapshot; CI fails if the generated types are stale. | Typed, honest contract; no hand-copied DTOs; the public API keeps OpenAPI off in production. |
| D7 | Data fetching | **TanStack Query** for server state (cache, retries, invalidation after writes). No global state library. | Standard React data layer; small and well known. |
| D8 | Sign-in | A new Auth0 application of type **Native** in the existing tenant (same audience `https://api.flowtrim.dev`), Authorization Code + **PKCE** with **`expo-auth-session`**, redirect `flowtrim://callback`. **Refresh-token rotation** (`offline_access`) so the user does not sign in every day; tokens only in **`expo-secure-store`** (Android Keystore). Sign-out clears tokens, cache and scheduled reminders, then ends the Auth0 session. | `owner_id` stays the token `sub`: the user sees the same data as on the web. |
| D9 | App lock | Optional **biometric / device-PIN lock** (`expo-local-authentication`), asked on cold start and after **60 s** in the background. Off by default; the setting is offered after the first sign-in. | Financial data on a phone that can be lent or lost. |
| D10 | Offline | **Read-only offline**: the last loaded Today, payments, current-month transactions, budgets and goals are persisted (TanStack Query persister on AsyncStorage, inside the app sandbox) and shown with a "Last updated <time> · offline" banner. **Writes are disabled offline** (no queue). The persisted cache is cleared on sign-out and on a different account's sign-in. | Useful without a signal; no sync conflicts or duplicates in this epic. |
| D11 | Design | Carbon Signal tokens (colors, type scale, radii) ported to a typed `theme.ts`; light/dark follow the system with a manual override. English/Spanish with a key-parity test, default from the device language. Amounts formatted like the web `MoneyPipe` (en-US / es-CO, COP without cents). | Same identity and honesty as the web. |
| D12 | Quality | ESLint + TypeScript `--noEmit` + **Jest (`jest-expo`) + React Native Testing Library** in CI; one **Maestro** end-to-end flow run locally against the test issuer + local API (like HU-48, not in CI). Builds with **EAS Build** (free tier) — `preview` profile produces the APK. | Same quality bar as the other repos; free tools. |

## 3. Scope
**In scope:** stories HU-81..HU-91; the Auth0 Native application; CLAUDE.md §5 rule change (D3); mobile README,
privacy notes and portfolio evidence (screenshots + short screen recording).

**Out of scope:** iOS builds and stores; Play Store publication (optional later, one-time fee); server push, e-mail
(phase 4); offline writes / sync queue; widgets, wearables, deep links other than the auth callback; CSV import/export,
reports, analytics charts, simulator, cost per use, AI Assistant, category/account management beyond what forms need
(all stay on the web); any backend change (if one becomes necessary, the spec is updated first).

## 4. Stories

| Story | Title | Phase | Repos |
|---|---|---|---|
| HU-81 | Mobile repository foundation | M1 Foundation | mobile, tracker |
| HU-82 | Typed API client and error handling | M1 Foundation | mobile |
| HU-83 | Native sign-in and session | M2 Identity | mobile, Auth0 config |
| HU-84 | App lock and settings | M2 Identity | mobile |
| HU-85 | Today screen | M3 Daily | mobile |
| HU-86 | Quick add and month transactions | M3 Daily | mobile |
| HU-87 | Recurring payments and mark as paid | M4 Payments & plans | mobile |
| HU-88 | Budgets and goals | M4 Payments & plans | mobile |
| HU-89 | Local payment reminders | M5 Native & release | mobile, tracker (CLAUDE.md) |
| HU-90 | Offline read and network status | M5 Native & release | mobile |
| HU-91 | Release build and portfolio evidence | M5 Native & release | mobile, tracker |

Navigation: bottom tabs **Today · Movements · Payments · Plan** (budgets + goals), a **"+" quick-add button** over the
tab bar, and **Settings** from the Today header.

### HU-81 — Mobile repository foundation
- **FR-1:** Expo + TS strict project, `expo-router` with the four tabs and placeholder screens, path aliases, ESLint,
  Prettier, Jest + RNTL, scripts `lint`, `typecheck`, `test`.
- **FR-2:** `theme.ts` with Carbon Signal tokens for light/dark (D11); `useTheme()`; contrast WCAG AA for text tokens.
- **FR-3:** i18n EN/ES (small typed dictionary like the web; default from device language), key-parity test.
- **FR-4:** config from `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_AUTH0_DOMAIN`, `EXPO_PUBLIC_AUTH0_CLIENT_ID`,
  `EXPO_PUBLIC_AUTH0_AUDIENCE` (public values only; `.env.example` committed, `.env` ignored); release builds refuse a
  non-`https` API URL.
- **FR-5:** GitHub Actions `Mobile CI` / job `lint-test` (no secrets, `contents: read`); `main` protected with it.
- **AC-1:** A fresh clone runs `npm ci && npm test` green; the app opens on an Android phone with the dev build and
  shows the four tabs in the device theme and language.

### HU-82 — Typed API client and error handling
- **FR-1:** `api/openapi.json` snapshot + generated `api/schema.d.ts`; `npm run api:sync`; CI checks the types match
  the snapshot (D6).
- **FR-2:** one `apiClient` (`openapi-fetch`) adds `Authorization: Bearer`, `Accept-Language` (interface language)
  and maps responses: `400` field errors → form errors; `401` → session expired (HU-83); `404`/`409` → typed errors with
  `code`; `429` → wait message using `Retry-After`; `5xx`/network → generic message with **`Reference: <correlationId>`**
  when the API sent one. Never shows stack traces or raw bodies.
- **FR-3:** TanStack Query client (retry only idempotent GETs, 2 retries; no retry on 4xx).
- **AC-1:** Unit tests cover each status mapping, including a `500` with a `correlationId`.

### HU-83 — Native sign-in and session
- **FR-1:** Welcome screen with "Sign in" (D8); PKCE S256; `state` checked; redirect `flowtrim://callback`.
- **FR-2:** access + refresh token in SecureStore; silent refresh before expiry; a failed refresh or a `401` → "Your
  session expired" and back to sign-in.
- **FR-3:** sign-out (Settings): clears tokens, query cache, persisted cache and scheduled reminders, then opens the
  Auth0 logout URL; does not wait for the network to show the welcome screen.
- **AC-1:** Account A signs in and sees its own data; signs out; account B signs in and sees none of A's data (also
  after an app restart — nothing of A in the persisted cache).
- **AC-2:** No token appears in logs, in AsyncStorage or in error messages.

### HU-84 — App lock and settings
- **FR-1:** Settings: language, theme (system/light/dark), app lock on/off, reminders (HU-89), signed-in account e-mail,
  app version, links to the web app and privacy notes, sign out.
- **FR-2:** App lock (D9): cold start and > 60 s in background show a lock screen until biometric/device credential
  succeeds; if the device has no credential enrolled the toggle is disabled with an explanation; a locked screen hides
  the content (also in the Android recent-apps preview: `FLAG_SECURE`-equivalent when lock is on).
- **AC-1:** With the lock on, returning after 61 s asks for authentication; after 30 s it does not.

### HU-85 — Today screen
- **FR-1:** Uses `GET /api/dashboard/today` as is: safe to spend today per currency, available, committed until month
  end, shortfall, charges until month end, budgets to watch. Each figure has an info sheet with its formula
  (CLAUDE.md §5) and the "estimate, not financial advice" note.
- **FR-2:** pull-to-refresh; refetch on app focus.
- **AC-1:** The figures equal the web Today screen for the same account and day (manual check + unit test of the
  mapping with a fixed response).

### HU-86 — Quick add and month transactions
- **FR-1:** "+" opens a bottom sheet: type (expense/income/transfer), amount with numeric keypad, account (last used
  remembered, non-sensitive id only), category chips ordered by recent use, date (default today, ≤ today), description;
  "Save" and "Save and add another". Backend validation errors appear on the fields.
- **FR-2:** Movements tab: current month by default, month selector, grouped by day, signed amounts, totals per
  currency from the API, infinite scroll (`page` from the API), filters by account and type.
- **FR-3:** after a save, Today, Movements, budgets and accounts queries are invalidated.
- **AC-1:** An expense saved on the phone appears on the web Transactions page and lowers the web Today figure.

### HU-87 — Recurring payments and mark as paid
- **FR-1:** Payments tab: active payments ordered by next date with countdown and alert window badge (overdue / today /
  ≤ 3 days / ≤ 7 days / later, same rules as HU-04), kind badge, instalment progress.
- **FR-2:** "Mark as paid" sheet = web dialog (EP-14 D5): record in an account (same currency) with editable amount,
  date and category, or "paid outside FlowTrim"; completion message for the last instalment.
- **FR-3:** "Pay at provider ↗" opens the `https://` link in the system browser (never in an in-app WebView that could
  capture input).
- **FR-4:** creating/editing payments stays on the web (link "Manage on the web").
- **AC-1:** Marking a monthly payment as paid with an account creates the expense and moves the next date one cycle;
  both show on the web.

### HU-88 — Budgets and goals
- **FR-1:** Plan tab: this month's budgets (limit, spent, remaining, state `OnTrack`/`Warning`/`Exceeded` with text,
  not only color) and goals (saved, remaining, required per month, estimated completion with the "estimate" note).
- **FR-2:** "Add contribution" / "Withdraw" on a goal (amount ≠ 0, date ≤ today, note ≤ 200); `409 goal_saved_negative`
  shown on the amount.
- **AC-1:** A contribution added on the phone updates the goal on the web.

### HU-89 — Local payment reminders
- **FR-1:** Opt-in in Settings (and once, after the first payments load). Requests the notification permission only
  when the user turns it on (Android 13+ `POST_NOTIFICATIONS`); denied → toggle off with a hint to the system settings.
- **FR-2:** After each successful load of `GET /api/subscriptions/upcoming` the app **replaces** all its scheduled
  reminders: for each active payment due in the next 14 days, one reminder at **09:00 local time the day before** and
  one at **09:00 on the due day** (skipped when that moment has passed). Overdue payments get a single reminder at the
  next 09:00. At most 30 scheduled reminders (closest first).
- **FR-3:** Text says **expected**: "Expected charge tomorrow: Netflix · 44,900 COP" / "Cargo esperado mañana: …".
  Tapping opens the Payments tab on that payment. Amounts are hidden on the lock screen
  (`visibility: private`) — the public version says "You have an expected charge tomorrow".
- **FR-4:** Turning the toggle off or signing out cancels every scheduled reminder.
- **AC-1:** With a payment due tomorrow and the clock at 08:00 today, two reminders are scheduled (today 09:00 and
  tomorrow 09:00); at 10:00 today only tomorrow's is scheduled. Marking it as paid and refreshing removes them.
- **AC-2:** Unit tests of the pure scheduler (`planReminders(upcoming, now, timeZone)`) cover: past moments skipped,
  overdue, the 30 cap, inactive payments ignored, both languages.

### HU-90 — Offline read and network status
- **FR-1:** Persist the queries listed in D10 (max age 7 days); on start without network show them with the offline
  banner and the last-updated time.
- **FR-2:** Offline, every write action (quick add, mark as paid, contribution) is disabled with "You're offline —
  connect to save". Nothing is queued.
- **FR-3:** On reconnect, refetch and hide the banner.
- **AC-1:** Load data, enable airplane mode, restart the app: Today and Payments show the cached figures with the
  banner; the "+" button explains it cannot save.

### HU-91 — Release build and portfolio evidence
- **FR-1:** EAS `preview` profile builds a signed APK against the public API (needs HU-40); attached to a GitHub Release
  `mobile-v1.0.0` (tag only with Ander's OK).
- **FR-2:** Maestro flow `e2e/critical-flow.yaml`: sign in (test issuer) → Today → quick add expense → Movements shows
  it → mark a payment as paid → sign out. Documented, run locally.
- **FR-3:** README: what the app does and does not do, architecture diagram (app → API → PostgreSQL, Auth0), stack and
  why, setup (dev build + LAN API), privacy section (tokens in Keystore, cache in app sandbox cleared on sign-out,
  local reminders only), screenshots in both themes and a short screen recording (GIF/MP4).
- **FR-4:** Tracker: `docs/PORTFOLIO.md` and `FLOWTRIM-RESUMEN-ES.pdf` mention the mobile app; E2E-ACCEPTANCE row.

## 5. Business rules
- Every figure comes from the API; the app **never recalculates** money (no client formulas except formatting and the
  reminder schedule).
- Expected charges are never shown as payments; reminders say "expected".
- Same alert windows as HU-04; reference date = the API's (product calendar, America/Bogota) for windows; reminders
  fire in the **device** time zone at 09:00.
- Totals stay per currency; no conversion.
- Rule change D3 applies only to the mobile app.

## 6. API contract
No new or changed endpoints. Used: `GET /api/dashboard/today`, `GET/POST /api/transactions`, `GET /api/accounts`,
`GET /api/categories`, `GET /api/subscriptions`, `GET /api/subscriptions/upcoming`,
`POST /api/subscriptions/{id}/mark-paid`, `GET /api/budgets`, `GET /api/goals`, `POST /api/goals/{id}/contributions`.
CORS does not apply to native requests (no `Origin`), so `Cors:AllowedOrigins` does not change.

## 7. Data model changes
None in the database. On the device: SecureStore (tokens, lock flag), AsyncStorage (persisted query cache, language,
theme, last account id, reminder opt-in). No financial data outside the app sandbox.

## 8. Validation and error cases
| Case | Expected result |
|---|---|
| Release build with an `http://` API URL | Build/config check fails (FR-4 HU-81) |
| Auth0 callback with wrong `state` or user cancels | Back to welcome with "Sign-in was cancelled", no token stored |
| Refresh token revoked | "Your session expired", sign-in screen, cache cleared |
| `400` on a form | Field messages from the API, translated by code where available |
| `429` | "Too many requests — try again in N s" |
| `500` / network error | Generic message + `Reference: <id>` when present |
| Notification permission denied | Toggle stays off, hint to system settings |
| No biometric enrolled | Lock toggle disabled with explanation |

## 9. Edge cases
- User with several currencies: Today shows one card per currency (as the web).
- Empty account (new user): every tab has an empty state pointing to the right action ("Add your first expense",
  "Create recurring payments on the web").
- Device time zone different from Bogota: alert badges follow the API; reminders follow the device clock.
- Phone clock wrong: the API date wins for validation (`date ≤ today` errors come from the backend).
- Two devices / web and phone at once: refetch on focus; no conflicts because nothing is queued offline.

## 10. UI states
Every data screen: **loading** (skeletons), **empty**, **success**, **error** (retry + reference), **offline**
(cached + banner). Accessibility: touch targets ≥ 44 dp, `accessibilityLabel` on icon buttons, states not by color
only, Dynamic Type / font scale up to 1.3 without clipping, screen-reader order checked with TalkBack.

## 11. Test plan
- Unit (Jest + RNTL): error mapping (HU-82), token refresh/expiry (HU-83, mocked), lock timing (HU-84), Today mapping
  (HU-85), quick-add form validation and invalidation (HU-86), alert windows/mark-paid sheet (HU-87), contribution form
  (HU-88), `planReminders` (HU-89), offline gating (HU-90), i18n parity, money formatting.
- E2E: Maestro critical flow (HU-91) against the local test issuer + API with the fake Insights provider.
- Manual acceptance on a real Android phone: AC of every story, both themes, both languages, airplane mode, TalkBack.
- Cross-client checks (AC of HU-85..HU-88): the same figures on web and phone.

## 12. Assumptions and open questions
- Assumption: the Auth0 free plan allows a second (Native) application and refresh-token rotation — verify in HU-83.
- Assumption: EAS free tier build quota is enough for this epic; local `npx expo run:android` is the fallback (needs
  the Android SDK).
- Assumption: the local test issuer (`fake-issuer.mjs` / `e2e/support/test-issuer.mjs`) can serve a native PKCE flow
  for Maestro; if not, the Maestro flow uses a dev-only token injection and the spec is updated.
- **Resolved (2026-11-03):** reminders at a fixed 09:00 local; lock timeout fixed at 60 s; the repo already exists
  (`FlowTrime-Mobile`).

## 13. Security and engineering practices (mandatory for every story)

**Security (OWASP MASVS v2 as the checklist; MASTG for verification)**
- **Storage (MASVS-STORAGE):** tokens and the lock flag only in `expo-secure-store` (Keystore-backed); never in
  AsyncStorage, logs, URLs or crash reports. Persisted cache holds API data only, lives in the app sandbox, max age 7
  days, wiped on sign-out / account change. `android:allowBackup="false"` so cached data does not leave the device in
  cloud backups.
- **Auth (MASVS-AUTH):** OAuth 2.0 for native apps (RFC 8252): system browser (Custom Tabs), PKCE S256, `state`
  checked, no client secret in the app (a Native Auth0 app has none), refresh-token rotation with reuse detection,
  short-lived access tokens, `401` → sign-in. The app never sees the user's password.
- **Network (MASVS-NETWORK):** release builds HTTPS only (`usesCleartextTraffic=false`; cleartext allowed only in the
  dev build for the LAN API); no TLS validation overrides. Certificate pinning is **not** used (managed hosting rotates
  certificates; documented trade-off).
- **Platform (MASVS-PLATFORM):** only the `flowtrim://callback` deep link, validated; external links (`paymentUrl`)
  opened in the system browser and only when `https://`; no WebView for user data; screen content hidden in the
  recent-apps preview when the lock is on; minimal Android permissions (`POST_NOTIFICATIONS`, biometrics only).
- **Code and supply chain (MASVS-CODE):** exact dependency versions + committed `package-lock.json`; `npm audit` and
  Dependabot alerts on the repo; GitHub secret scanning + push protection on; Expo SDK kept on a supported version; no
  `eval`/dynamic code; release builds strip `console.*` logs.
- **Privacy (MASVS-PRIVACY):** no analytics, ads or third-party trackers; no crash reporter sending data out; the
  README states exactly what is stored and where. Test data is synthetic.
- **Secrets:** only public values in `EXPO_PUBLIC_*` (Auth0 domain/client id/audience, API URL — not secrets by
  design); the Android **upload keystore** and EAS credentials never in Git (EAS-managed credentials); `.env` ignored,
  `.env.example` committed.
- **Server side unchanged:** authorization is enforced by the API (`owner_id` = `sub`); the app hiding a screen is
  never the security boundary.
- **Review:** a security review (MASVS checklist + `security-review` agent) before HU-91's release; findings fixed or
  documented.

**Engineering**
- Same rules as the other repos: English code/commits/docs, Spanish comments, Conventional Commits, branch per story,
  PR with `Refs #n` until verified on the phone, required CI, no direct pushes to `main`.
- Structure: `app/` (routes only), `src/features/<feature>/` (screens, hooks, components), `src/core/` (api, auth,
  i18n, theme, storage, notifications), `src/shared/` (UI primitives). Screens never call `fetch` directly; data goes
  through feature hooks over `apiClient`.
- TypeScript `strict` + `noUncheckedIndexedAccess`; ESLint (`eslint-config-expo` + React hooks rules) with zero
  warnings in CI; pure functions for logic (`planReminders`, error mapping, lock timing) with unit tests first.
- Every screen: loading/empty/success/error/offline states and accessibility labels (§10).
- New dependencies beyond this spec need Ander's approval.

## 14. Task breakdown and delivery order
M1 HU-81 → HU-82 · M2 HU-83 → HU-84 · M3 HU-85 → HU-86 · M4 HU-87 → HU-88 · M5 HU-89 → HU-90 → HU-91.
HU-40 (free hosting) in parallel; HU-91's release APK waits for it.
- [ ] tracker: approve spec; update CLAUDE.md §5 (D3); epic + stories + milestone + label.
- [ ] GitHub: link `FlowTrime-Mobile` to the Project; branch protection after the first CI run.
- [ ] Auth0: Native application, callback/logout URLs, refresh-token rotation (no secrets in Git).
- [ ] mobile: one PR per story (`feature/hu-8x-…`), `Refs #n` until verified on the phone.

## 15. Implementation notes (filled after delivery)
