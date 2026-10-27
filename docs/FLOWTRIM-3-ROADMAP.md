# FlowTrim 3.0 Roadmap — from subscription tracker to daily personal-finance manager

- **Status:** Direction approved by Ander on 2026-10-22; each epic still gets its own spec and approval.
- **Author:** Ander (with Claude)

## Why
FlowTrim 2.0 answers "what do my subscriptions cost and when do they renew?". Ander wants a daily tool for all
personal finances: accounts, income and spending, budgets and goals, with recurring payments as one part of it.

## Principles that stay
- **Manual data:** no bank connection and no automatic charge detection. Bank CSV files can be imported, with a
  preview and the user's confirmation.
- **Honesty:**
  - an expected charge is never a payment until the user records it;
  - estimates show their assumptions;
  - FlowTrim is not a financial advisor.
- **Per-currency totals** and no conversion.
- **One deployable backend**, owner isolation and a deterministic engine; the AI explains, it never calculates.

**Principle that changes:** the MVP had "no transaction history". FlowTrim 3.0 adds **user-recorded** transactions:
they are confirmed by the user, never inferred. `CLAUDE.md` §1/§4 will be updated with the phase 1 spec.

## Order (approved)

| Step | Epic | Content |
|---|---|---|
| 0 | **EP-11** UX polish (`specs/EP-11-ux-polish.md`) | Fixes reported on 2026-10-22 |
| 1 | **Phase 1** Daily base | Accounts (cash, bank, card), transactions (income, expense, transfer, quick add), custom categories (color/icon), daily dashboard with "safe to spend today" |
| 2 | **Landing redesign** | More striking, advertising-style landing with **GSAP + ScrollTrigger** (approved dependency, loaded only on the landing), scroll-driven story, reduced-motion support, no fake testimonials or brand logos |
| 3 | **Phase 2** Recurring payments | Subscriptions generalized to recurring payments (rent, utilities, instalments); "Mark as paid" records a transaction; financial calendar; optional **payment link** per recurring payment |
| 4 | **Phase 3** Control (**EP-15**, `specs/EP-15-budgets-and-goals.md`) | Monthly budgets per category (alerts at 80 % / 100 %), savings goals with contributions and projection |
| 5 | **Phase 4** Notifications | Daily **e-mail** digest at 08:00 Bogota (Resend free tier) for charges due tomorrow and overdue ones, then **Web Push**; notification centre and settings. Requires the free-tier deployment (HU-40) |
| 6 | **Phase 5** Reports and AI | Monthly statement (income vs spending, month-over-month), bank CSV import with preview, new AI Assistant tools (budget left, goals, month spending) |
| 7 | Optional | **Wompi sandbox** checkout for a demo "Pro" plan (no real money), only as a portfolio integration |

The landing goes after phase 1 so its copy and animations promote the new daily-finance product, not only
subscriptions.

## Decisions (2026-10-22, recommended options chosen at Ander's request)
- **Dates:** next billing date today or later (create, import, edit when changed); usage dates today or earlier.
- **CSV:** stays CSV and dependency-free, made spreadsheet-friendly (`sep=,`, `;` files with decimal comma and
  `dd/MM/yyyy`).
- **Notifications:** e-mail first (Resend), Web Push second. SMS and WhatsApp are not used (cost per message).
  Telegram is not used either (it needs an extra account).
- **Alert sound:** opt-in, off by default, synthesized with the Web Audio API.
- **Payments:**
  - FlowTrim never pays third parties on the user's behalf: that would need payment-intermediary regulation and PCI
    scope.
  - Recurring payments can store a **payment link** to the provider's own page.
  - A Wompi sandbox remains optional.
- **Dependencies:** GSAP approved for the landing.

## What happens to the open 2.0 stories
- **HU-42** (portfolio evidence) and **HU-49** (release readiness) close FlowTrim 2.0 when Ander decides to tag it,
  or move to the 3.0 release.
- **HU-40** (free deployment) becomes a prerequisite of phase 4.
- **HU-13** (scheduled notifications) is covered by phase 4.
- **HU-14** (import transactions from CSV) is covered by phase 5.
- **HU-15** (Python analytics engine) is not planned: it breaks the single-backend principle.
