# ESMS v2 — Phase plan

What we build is decided in [DECISIONS.md](DECISIONS.md) (D1–D66). This file says **in which order**. Each phase is done in its own conversation: open the phase file, do exactly that scope, finish with its "Done when" list.

The v2 prototype (`Environmental-and-Social-Assessment-main version 2/`, git-ignored) is a **reference only** — see [V2_INVENTORY.md](V2_INVENTORY.md). Port code from it only where a phase file names it; never edit it. Anything from v2 not covered by a decision: keep this repo's behavior and ask the owner.

## Phases

| # | Phase | Main decisions | Depends on |
|---|---|---|---|
| 0 | [Foundations: tooling, tests, lint](phases/00-foundations.md) | D39–D42, D44 | — |
| 1 | [Removals & cleanup](phases/01-removals.md) | D12, D26–D29, D50 | 0 |
| 2 | [Security & authentication](phases/02-security.md) | D1, D3–D10, D24, D58 | 1 |
| 3 | [Workflow rules on the backend](phases/03-workflow-rules.md) | D2, D12–D19, D53–D58, D60 | 2 |
| 4 | [Workflow state & aggregate API](phases/04-aggregate-api.md) | D30–D32, D35, D36 | 3 |
| 5 | [Frontend data layer](phases/05-frontend-data.md) | D28a, D30, D33–D35, D57 | 4 |
| 6 | [Users & passwords](phases/06-users-passwords.md) | D9, D21–D25 | 2, 5 |
| 7 | [File module & Annex](phases/07-files-annex.md) | D47 | 5 |
| 7a | [Critical-actions log & access seams](phases/07a-audit-and-access.md) | D65, D66 | 7 |
| 7b | [Reference library & project documents](phases/07b-library-documents.md) | D64 | 7a |
| 8 | [UI & Excel from v2](phases/08-ui-excel.md) | D49–D52, D54, D55, D59, D63 a–c | 7b |
| 9 | [v3 modules as locked code](phases/09-v3-locked.md) | D46, D48 | 7b, 8 |
| 10 | [UI polish](phases/10-ui-polish.md) | D43 | 9 |
| 10a | [Unhappy paths & edge cases](phases/10a-unhappy-paths.md) | D61, D62 | 10 |
| 11 | [Offline & server deployment](phases/11-offline-deploy.md) | D6, D37, D38, D63 d | 10a |
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
- **Critical-actions log (D65, from phase 7a):** a phase that adds a destructive action, an archive/restore-like state change or a user/access change records it through the shared audit helper (who, action, project, target, snapshot; never passwords or tokens) and tests the entry. Ordinary edits are not logged in v2 (full log = v3). Each phase file names the critical actions it adds.
- **Access seams (D66, from phase 7a):** new project-scoped routes go through the single project-access check, and new route checks use `requirePermission(...)`, never role lists.
- **Close a phase:** tick its "Done when" list in the phase file, raise the coverage thresholds, add a one-line result (incl. coverage) to the table below.

## Progress

| # | Status | Branch / PR | Notes |
|---|---|---|---|
| 0 | Done | `phase-00-foundations` — [PR #4](https://github.com/Doread-Dev/Environmental-and-Social-Assessment/pull/4) | Node 26 LTS, lockfiles, Vitest in both apps (14 backend / 6 frontend tests), lint 0 errors, Prettier applied |
| 1 | Done | `phase-01-removals` — [PR #5](https://github.com/Doread-Dev/Environmental-and-Social-Assessment/pull/5) | Attachments, old SEMP tree, reports (+ `multer`, `pdfkit`, backend `exceljs`) removed; idempotent lookup seed; Project Details card; 27 backend / 8 frontend tests |
| 1a | Done | `ci-and-node-watch` — [PR #6](https://github.com/Doread-Dev/Environmental-and-Social-Assessment/pull/6) | Not a plan phase (owner request): GitHub Actions CI, coverage with never-lower thresholds (baseline lines: backend 62% / frontend 0.4%), `nodemon` → `node --watch` |
| 2 | Done | `phase-02-security` — [PR #7](https://github.com/Doread-Dev/Environmental-and-Social-Assessment/pull/7) | Auth on every route (table-driven test), `validate()` strips, submit/approve/reject endpoints with 409 rules, `admin` role, no open register, `create-admin` / `reset-password` CLI, `TRUST_PROXY`, per-user rate limit; 183 backend / 19 frontend tests, backend lines 78% |
| 3 | Done | `phase-03-workflow-rules` — [PR #8](https://github.com/Doread-Dev/Environmental-and-Social-Assessment/pull/8) | Backend gates (409), locking, `status_history`, archive/restore + guarded delete + admin purge of archived projects with audit log (D60), unique indexes, assessment prefill + 50 Negligible scores + auto total, `responsible_text`; no min-length rules; sidebar refreshes after every save/approve; 270 backend / 36 frontend tests, backend lines 90% |
| 4 | Done | `phase-04-aggregate-api` — [PR #11](https://github.com/Doread-Dev/Environmental-and-Social-Assessment/pull/11) | Backend workflow state (`computeWorkflow`, also used by the gates), `GET /auth/me` permissions, `allowed_actions`, `GET /dashboard`, `GET /projects` with workflow + filters + pagination, `GET /projects/:id/workspace`, `GET /lookups`, bulk `PUT /projects/:id/management|mitigation|monitoring` (validated before any write); monitoring "in progress" from its first record (owner); 419 backend / 40 frontend tests, backend lines 92% |
| 5 | Done | `phase-05-frontend-data` — [PR #12](https://github.com/Doread-Dev/Environmental-and-Social-Assessment/pull/12) | TanStack Query cache + shared workspace query, permissions from `/auth/me` / `allowed_actions`, no workflow rule or role list in the frontend, bulk saves for Tools 3–5, `200 {data:null}` for not started, unused endpoints removed; dashboard 2 requests, overview 2; 419 backend / 73 frontend tests, lines backend 94% / frontend 25% |
| 6 | Done | `phase-06-users-passwords` — [PR #13](https://github.com/Doread-Dev/Environmental-and-Social-Assessment/pull/13) | Admin-only user management (`POST/PUT /users`, deactivate/reactivate, reset → one-time temporary password, last-active-admin guard), forced change (403 `PASSWORD_CHANGE_REQUIRED`), `PUT /auth/password`, new accounts get a temporary password; Settings → Users, Profile, forced change screen, login "Contact your system administrator", inactive users out of pickers; demo seed creates a user per role; 495 backend / 100 frontend tests, lines backend 94% / frontend 32%; confirmations in an in-app dialog (the browser pane suppresses `window.confirm`) |
| 7 | Done | `phase-07-files-annex` — [PR #15](https://github.com/Doread-Dev/Environmental-and-Social-Assessment/pull/15) | File module (`ProjectFile`, multer 2, memory parse → disk under `<UPLOADS_DIR>/<project>/<uuid>.<ext>`): PDF + Office only, 10 MB (owner), extension + first-bytes check, UTF-8 names, authenticated download, `files.edit` action + `upload_rules` in `/auth/me`; `semp_record` area modelled but 404 until v3; files removed with the project (delete/purge/demo reset); Annex A–H page with multi-file upload, download, delete; 558 backend / 115 frontend tests, lines backend 95% / frontend 34% |
| 7a | Done | `claude/phase-07a-audit-and-access-b84e2f` — [PR #17](https://github.com/Doread-Dev/Environmental-and-Social-Assessment/pull/17) | Critical-actions log: generalised `AuditLog`, one writer `audit.service.record()` (copied names, secrets dropped, failure logged), exactly the 12 D65 actions, `GET /audit-logs` (pagination, action/prefix, from/to), Settings → Activity log (admin); access seams: `access.service` + `middlewares/projectAccess` on every project-scoped route (route-table + deny-stub tests), `requirePermission(name)` replaces `requireRole`, `can(user)` / `permissionsFor(user)` / `allowedActions(user, …)`; 702 backend / 131 frontend tests, lines backend 95% / frontend 36% |
| 7b | Done (owner uploads Annex 1 after merge) | `claude/phase-07b-library-documents-ce1ce8` | Places registry in `/lookups` (5 workflow + 4 locked v3 places); reference library (`LibraryDocument`, PDF only, `manage_library` = admin + specialist, `library.replace_file` / `library.delete` logged); one storage helper for project documents and library; Annex A–H → project Documents by place + Other; shared in-app `PdfViewer`; Library page (search, place filter, grouped place picker with v3 tags); "Guidance (n)" side panel on screening, assessment, Tools 3–5; demo seed adds a generated sample PDF; 775 backend / 170 frontend tests, lines backend 96% / frontend 41% |
| 8 | Not started | | |
| 9 | Not started | | |
| 10 | Not started | | |
| 11 | Not started | | |
| 12 | Not started | | |
