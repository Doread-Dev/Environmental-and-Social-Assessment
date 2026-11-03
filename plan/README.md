# ESMS v2 — Phase plan

What we build is decided in [DECISIONS.md](DECISIONS.md) (D1–D59). This file says **in which order**. Each phase is done in its own conversation: open the phase file, do exactly that scope, finish with its "Done when" list.

The v2 prototype (`Environmental-and-Social-Assessment-main version 2/`, git-ignored) is a **reference only** — see [V2_INVENTORY.md](V2_INVENTORY.md). Port code from it only where a phase file names it; never edit it. Anything from v2 not covered by a decision: keep this repo's behavior and ask the owner.

## Phases

| # | Phase | Main decisions | Depends on |
|---|---|---|---|
| 0 | [Foundations: tooling, tests, lint](phases/00-foundations.md) | D39–D42, D44 | — |
| 1 | [Removals & cleanup](phases/01-removals.md) | D12, D26–D29, D50 | 0 |
| 2 | [Security & authentication](phases/02-security.md) | D1, D3–D10, D24, D58 | 1 |
| 3 | [Workflow rules on the backend](phases/03-workflow-rules.md) | D2, D12–D19, D53–D58 | 2 |
| 4 | [Workflow state & aggregate API](phases/04-aggregate-api.md) | D30–D32, D35, D36 | 3 |
| 5 | [Frontend data layer](phases/05-frontend-data.md) | D28a, D30, D33–D35, D57 | 4 |
| 6 | [Users & passwords](phases/06-users-passwords.md) | D9, D21–D25 | 2, 5 |
| 7 | [File module & Annex](phases/07-files-annex.md) | D47 | 5 |
| 8 | [UI & Excel from v2](phases/08-ui-excel.md) | D49–D52, D54, D55, D59 | 5 |
| 9 | [v3 modules as locked code](phases/09-v3-locked.md) | D46, D48 | 7, 8 |
| 10 | [UI polish](phases/10-ui-polish.md) | D43 | 9 |
| 11 | [Offline & server deployment](phases/11-offline-deploy.md) | D6, D37, D38 | 10 |
| 12 | [E2E tests & documentation](phases/12-e2e-docs.md) | D39, D44 | 11 |

Order matters: removals before new code (less to secure), backend rules before the frontend switches to them, data layer before the UI work that sits on it, deployment last because Vercel stays in use until then (D38).

## Rules for every phase

- **Branch:** `phase-NN-short-name` from the latest integration branch. Commit or push only when the owner asks. No Claude/AI attribution in commits or PRs, ever.
- **Tests:** from phase 0 on, every behavior change and every fix ships with a test (D39). Backend tests run against `esms_test`, never `esms`. New code without a test is not done, even if CI is green: CI only proves existing tests pass.
- **CI:** `.github/workflows/ci.yml` runs lint, Prettier check, tests with coverage (+ frontend build) on every PR. A PR is merged only when CI is green. New `*.test.js(x)` files run automatically; a new **kind** of check (e.g. Playwright E2E) is added to the workflow in the phase that introduces it.
- **Coverage never goes down:** `thresholds` in `backend/vitest.config.mjs` and `frontend/vitest.config.js` are the floor. At the end of each phase, run `npm run test:coverage` in each app touched and raise the thresholds to the new numbers (rounded down). Never lower them; if a removal drops coverage, add tests instead.
- **Keep it running:** at the end of a phase the app starts, `npm run lint`, `npm run build` and all tests pass, and `backend/scripts/seed-demo-project.js` still creates the full demo project (update the script when the API changes).
- **Data:** no real data exists (see DECISIONS context). Schema changes need no migration; wiping local data is fine — ask before running destructive scripts.
- **Scope:** do only what the phase file lists. Something found outside scope → write it under "Found during phase" at the bottom of that phase file and tell the owner; don't fix it silently.
- **Docs:** old `backend/docs` and `frontend/docs` are outdated (D44) — code wins. Update `CLAUDE.md` when a convention it describes changes (routes, roles, responses, commands).
- **Language:** UI and code in English (see DECISIONS context). Replies to the owner in Arabic.
- **Close a phase:** tick its "Done when" list in the phase file, raise the coverage thresholds, add a one-line result (incl. coverage) to the table below.

## Progress

| # | Status | Branch / PR | Notes |
|---|---|---|---|
| 0 | Done | `phase-00-foundations` — [PR #4](https://github.com/Doread-Dev/Environmental-and-Social-Assessment/pull/4) | Node 26 LTS, lockfiles, Vitest in both apps (14 backend / 6 frontend tests), lint 0 errors, Prettier applied |
| 1 | Done | `phase-01-removals` — [PR #5](https://github.com/Doread-Dev/Environmental-and-Social-Assessment/pull/5) | Attachments, old SEMP tree, reports (+ `multer`, `pdfkit`, backend `exceljs`) removed; idempotent lookup seed; Project Details card; 27 backend / 8 frontend tests |
| 1a | Done | `ci-and-node-watch` — [PR #6](https://github.com/Doread-Dev/Environmental-and-Social-Assessment/pull/6) | Not a plan phase (owner request): GitHub Actions CI, coverage with never-lower thresholds (baseline lines: backend 62% / frontend 0.4%), `nodemon` → `node --watch` |
| 2 | Done | `phase-02-security` | Auth on every route (table-driven test), `validate()` strips, submit/approve/reject endpoints with 409 rules, `admin` role, no open register, `create-admin` / `reset-password` CLI, `TRUST_PROXY`, per-user rate limit; 183 backend / 19 frontend tests, backend lines 78% |
| 3 | Not started | | |
| 4 | Not started | | |
| 5 | Not started | | |
| 6 | Not started | | |
| 7 | Not started | | |
| 8 | Not started | | |
| 9 | Not started | | |
| 10 | Not started | | |
| 11 | Not started | | |
| 12 | Not started | | |
