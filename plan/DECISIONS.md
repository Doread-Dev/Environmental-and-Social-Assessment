# ESMS v2 — Decisions Log

Decisions agreed during planning (2026-11-03). This file is the source of truth for *what* we are building; the phase plan will reference it. Update it when a decision changes — don't silently diverge.

## Context

- No real data exists anywhere (local or deployed). Schemas can change freely; no migrations needed. Existing data may be wiped.
- Target deployment: **one internal institutional server, no internet access**. Vercel stays in use until the final "prepare for server" phase. The platform *may* get internet access later — build for offline, but don't make choices that would break or block an online setup.
- UI language: **English only**. No Arabic UI, no RTL. Arabic lookup fields in the backend are not used.
- Direction: **the backend owns business logic**; the frontend displays state and hides buttons for convenience only.

## Security & permissions

| # | Decision |
|---|---|
| D1 | Fix self-approval: `status` can never be set through `PUT`. Status changes only through explicit transition endpoints (submit / approve / reject) with role checks. |
| D2 | Enforce workflow order on the backend (assessment requires approved screening; SEMP requires approved assessment; monitoring requires SEMP complete). |
| D3 | All API endpoints require authentication except `GET /health` and `POST /auth/login`. Viewers keep read access. |
| D4 | Keep `is_active`. "Deleting" a user = deactivating (history keeps their name). Inactive users cannot log in; their existing tokens stop working immediately. Inactive users are hidden from "responsible" pickers. |
| D5 | `validate()` replaces `req.body` with the validated/stripped value. Clients cannot set server-owned fields (`officer`, `approved_by`, `reject_by`, `status`, …). |
| D6 | `TRUST_PROXY` env setting (default off), enabled only when behind IIS/nginx. |
| D7 | Remove open first-user registration. The first admin is created with a server-side CLI script. |
| D8 | Rate limiting keyed per authenticated user (IP only for anonymous/login). Reduce request volume (see D30–D33) so normal use never approaches limits. |

## Roles

| # | Decision |
|---|---|
| D9 | Add role `admin`: full access — user management **and** everything the specialist can do (including approve/edit environmental work). |
| D10 | `environmental_specialist` may approve a screening/assessment they created themselves; who created and who approved is recorded. |
| D11a | `program_manager`, `project_manager` and `environmental_focal_point` keep **identical permissions** for now; differentiating them only makes sense together with per-project assignment in **v3**. |
| D11 | Everyone sees all projects for now. Per-project assignment (e.g. focal point → specific projects) is deferred to **v3**. |

## Workflow rules

| # | Decision |
|---|---|
| D12 | All screening categories (A–F), **including E**, behave the same: once the screening is approved, the remaining tools unlock in order as normal. `requiresAssessment` in the frontend is unused and will be removed. |
| D13 | `submitted` and `approved` screening/assessment are locked for editing. `rejected` becomes editable again and can be resubmitted. No "reopen" for now. |
| D14 | SEMP (tools 3 & 4) and Monitoring stay editable at all times (living documents). |
| D15 | Project metadata (title, dates, location, component) stays editable after approvals. |
| D16 | Simple status history on screening & assessment: created / submitted / approved / rejected, with user + timestamp. Full field-level audit log deferred to **v3** (see [V3_VISION.md](V3_VISION.md)); v2 logs critical actions only (D65). |
| D17 | Projects: hard delete only when nothing in the project is approved; otherwise **archive** (hidden from default lists, read-only, restorable). Delete/archive: `admin` + `environmental_specialist`. |
| D18 | Each project has at most one screening and one assessment — enforced by unique indexes. |
| D19 | Monitoring quarter values and `total` stay **free text** (clients mix numbers and text). Backend must not parse or compute them. |
| D20 | ~~Concurrent edits to the same SEMP table: last save wins.~~ Replaced by D62 (stale saves are refused). |

## Users & passwords (offline, no email)

| # | Decision |
|---|---|
| D21 | User management: list, create, edit (name, role, job title), deactivate/reactivate, admin password reset. |
| D22 | Admin reset generates a one-time temporary password; user must change it at next login (`must_change_password`). |
| D23 | Every user can change their own password from a profile page. |
| D24 | Break-glass CLI script on the server to reset any password (e.g. the only admin is locked out). |
| D25 | Remove "Forgot password?" link → replace with "Contact your system administrator". |

## Removals

| # | Decision |
|---|---|
| D26 | Remove the current generic attachments: backend (old routes, `entity_type` project/screening/assessment/monitoring, unrestricted multer) and frontend (Project Files page, mocked `useFiles`, related components/nav). Replaced by the small file module in D47. |
| D27 | Remove SEMP objectives/targets/actions models, routes, validators and services. SEMP will be restructured from the second version. |
| D28 | Remove backend `/reports/export`, `pdfkit` and backend `exceljs`. Excel exports stay in the frontend. |
| D28a | Excel export: every role **except `viewer`** may export (`admin`, `environmental_specialist`, `program_manager`, `project_manager`, `environmental_focal_point`). Viewers can only view on the platform. Permission comes from the backend (D35); the frontend hides export for viewers. |
| D29 | Remove the "Project Site Area" card (placeholder data); replaced by the Project Details card (D50). The "Coming soon" SEMP card is replaced by the SEMP Plan entry (D46). |

## Fewer requests, logic on the backend

| # | Decision |
|---|---|
| D30 | Backend computes project workflow state (current step, per-tool status, % complete, next action) and SEMP completeness. Frontend `workflowDerivation.js` goes away. |
| D31 | Aggregate endpoints: one call for the dashboard (stats + latest projects with workflow state), one call for a project workspace, one call for all lookups. |
| D32 | Bulk save endpoints for table-style tools (SEMP rows, monitoring records) instead of one request per row. |
| D33 | Frontend request caching/deduplication (TanStack Query) so guards, layouts and pages don't refetch the same data. |
| D34 | "Not started yet" returns `200 { data: null }` instead of 404. Remove `silent404` and the global `console.error` override in `api.js`. |
| D35 | Backend tells the frontend what the current user may do (permissions/allowed actions) so role lists aren't duplicated in two places. |
| D36 | Validation rules live in the backend; frontend mirrors them for UX only. No minimum-length rules (see D57). |

## Offline readiness & deployment

| # | Decision |
|---|---|
| D37 | No runtime internet dependency: self-host fonts and Material Symbols, replace remote images with local assets, remove `@vercel/speed-insights` (at the server phase). |
| D38 | Single-process deployment: Express serves `/api/v1` and the built frontend (same origin, no CORS). Runs as a service (Windows: NSSM, Linux: systemd). HTTPS via certificate in config or IIS/nginx in front. Daily `mongodump` backup. Must keep working on Vercel until the server phase. |

## Quality

| # | Decision |
|---|---|
| D39 | Automated tests: backend Vitest + Supertest against a local test DB (`esms_test`); frontend Vitest + React Testing Library; Playwright E2E for golden flows later. Every fix ships with a test. |
| D40 | Commit `package-lock.json`, pin the Node LTS version, fix `npm audit` findings, handle esbuild install-script approval. |
| D41 | Fix lint errors, clear warnings, format the codebase once (in a dedicated commit). |
| D42 | `clean-test-data.js` stays as a dev-only tool: drop uploads/removed models, refuse to run when `NODE_ENV=production`. |
| D43 | Full frontend UI polish pass (empty fields such as "Approved By"/"Position", consistency, states). |
| D44 | Existing `backend/docs/` and `frontend/docs/` are deleted and rewritten from scratch in the final phase. Until then, code is the source of truth. |

## From the second version (v2 prototype)

Inventory: [V2_INVENTORY.md](V2_INVENTORY.md). v2 was built by someone else and never reviewed by the owner: it is a **reference only**. Nothing in v2 is edited; ideas and code are ported into this repo. Anything not listed below stays as in this repo unless the owner approves it.

| # | Decision |
|---|---|
| D45 | v2 folder is ignored by Git and never committed. Its STEP reports, `verify*` scripts, `dbprobe*`/`dbquery` files and `build_err*` files are not ported. |
| D46 | **SEMP Plan** (v2 `SempPlan`: project details + narratives, 6 roles, 16-activity RACI, objectives & targets, training, incidents, files & records, revision history) is the approved design for the SEMP document. The old objectives/targets/actions approach is dropped (D27). It is **locked until v3** (D48). When it opens in v3: available after Tool 2 is approved, does not gate Monitoring, not counted in completion %. Tools 3 & 4 stay as they are today and keep gating Monitoring. |
| D47 | (Annex A–H part replaced by D64: those titles were placeholder data.) One small file module serving **Annex A–H** and, from day one, **SEMP Plan §7 records** (data model and categories ready now so v3 needs no rework; the §7 UI stays locked with the SEMP Plan). Local disk storage, size limit, server-generated file names, authenticated download, upload/delete for editors, read for viewers, removed with the project. Backups include the uploads folder (D38). |
| D48 | **Locked until v3:** SEMP Plan, Stakeholder Awareness, GHG Emissions, Environmental Data Collection. Their code is ported but **dead**: backend routers are not mounted (no reachable endpoint), frontend pages are not registered as routes (so not in the build); the UI shows their buttons with a lock and "Available in v3". No env switch can turn them on in production. |
| D49 | Adopt v2's AKF brand palette (primary `#008c54`, green scale from the logo, updated dark tokens). |
| D50 | Adopt v2's Project Details card (location, component, start/end date, "Not specified" when empty) on the project overview. |
| D51 | Adopt v2's login page design (local AKF logo + Syria map, PNG favicon), with "Contact your system administrator" instead of "Forgot password?" (D25). |
| D52 | (Layout goal replaced by D68: exports keep this repo's own layouts, tidy and complete.) Excel exports reproduce the official AKF workbook layout ("AKF-S Environmental and Social Assessment Tooles 2025.xlsx") — port v2's builders for Tools 2–5 (and the SEMP Plan sheet with D46). |
| D53 | (Replaced by D69: nothing is prefilled.) Assessment prefill, once, when the assessment is created: project activity ← project component; potential negative / positive impact ← approved screening. Fields stay editable afterwards. |
| D54 | All 50 assessment questions default to **Negligible** (set by the backend when the assessment is created). The user changes only what differs; submit is always possible; the backend still checks that all 50 distinct questions have a level. |
| D55 | Tools 3, 4, 5 "Responsible" = an internal user **or** a free-text external party (`responsible_text`), never both. |
| D56 | Screening approval: recommendations are optional. |
| D57 | No minimum-character rules on any field, frontend or backend. Required fields stay required (must not be empty) — e.g. assessment `project_activity` and `description` remain required. |
| D58 | Port v2's backend hardening that matches D1–D18: unique score per (assessment, question) and monitoring record per (project, indicator), 409 on duplicate create, `project` cannot change on update, scores must reference real questions, clean 401/403/500 for auth errors. |

| D59 | Navigation stays as in this repo: one sidebar entry "SEMP – Tools 3 & 4" (not split). The locked SEMP Plan button lives inside the SEMP overview page, where the "Coming soon" card is today. The overview metric keeps the label "Risk Level". |
| D60 | (Owner, phase 3) An **archived** project can be deleted permanently, approved work included, by `admin` only (from the archive list, UI in phase 10). Each such delete is recorded in an audit log (who, when, project title and a snapshot of its state), readable by `admin`. Extends D17; the audit log started with this one action and covers the critical actions of D65; the full field-level log stays v3 (D16). The demo seed deletes its own previous copies straight in MongoDB (dev only) and does not use this. |
| D61 | (Owner) Every screen is checked outside the happy path too — unsaved changes (Cancel / Back / sidebar / refresh), double clicks, every server error (400/401/403/404/409/500/offline), two users on one project, each role, empty and large data — and fixed with a shared mechanism, not one bug at a time. Own phase (10a) after UI polish; key unhappy paths join the phase 12 E2E suite. |
| D62 | (Review of phases 0–5) **No silent overwrite.** Since phase 5 Tools 3 and 4 save the whole table, so with "last save wins" (old D20) a second user or tab deletes rows the other added. Every save of project data now carries the version the client loaded, and the backend refuses a stale save with **409** ("changed by someone else since you opened it"). Versions: `updatedAt` of the record for project, screening, assessment (+ its methods, consultations, scores); a revision counter per project and table for Tools 3, 4 and Monitoring, raised by every bulk save and returned with the table. The page shows the message, keeps what the user typed visible, and offers Reload. No merging of edits. Built in phase 10a (backend + shared frontend handling). |
| D63 | (Review of phases 0–5) Small rules: (a) `recommendations` on screening and assessment is the approver's field — set only through the approve endpoint, dropped from create/PUT bodies; (b) a new screening form starts with today's date (editable); (c) the assessment pages read the assessment with its methods, consultations and scores in **one** request instead of four; (d) `express-rate-limit` upgraded to 8.x with `ipKeyGenerator` for the IP fallback key (IPv6 grouped by subnet). (a)–(c) in phase 8, (d) in phase 11. |
| D67 | (Part (a) replaced by D68: exports need not reproduce the official sheet layout; the "official sheet order" in (b) is simply Tool 1 → Tool 5.) (Concept review of phase 8, owner 2026-11-04) Exports and Tool 2 submit: (a) Tool 1 is exported in the official "Tool 1" sheet layout too, so all five tools match the official workbook; (b) a "Export project workbook" action on the project overview builds ONE file with a sheet per tool that has data, in the official sheet order (Tool 1 → Tool 5; SE MP joins in v3/phase 9); per-tool exports stay; (c) the Tool 2 submit confirmation says how many of the 50 questions differ from Negligible ("You changed 7 of 50; the other 43 stay Negligible"); submit is never blocked (D54 unchanged); (d) every export carries the tool's status and the export date in the file name and in the printed page footer (e.g. `Tool2_<project>_Draft_2026-11-04.xlsx`), never inside the official sheet area. |
| D68 | (Owner, phase 8 review, 2026-11-04) Business rules (calculations, totals, validations) come from the app as it is, never from the official workbook, which the client made quickly to show which fields exist. Tool 2 total project impact stays the highest scored level. Exports need not reproduce the official sheet layout (replaces D52's layout goal and D67 a): they must be tidy, well organised and contain all information the app holds for that tool. |
| D69 | (Owner, 2026-11-04) Input fields the user is meant to fill start empty; nothing fills them automatically (no prefill from another tool or from the project, no placeholder text saved as a value). Locked / read-only fields that show project data stay automatic. One exception: the screening date starts as today (D63 b, a date default, not content; still editable and required). Assessment scores starting Negligible (D54) are kept. The monitoring ranking starts empty (saved only when picked). Replaces D53. |
| D64 | (Owner, review of phase 7) **Annexes are an organisation reference library, not per-project uploads.** The official workbook's annex (sheet 8, "Annex 1 — Climate change resilience examples") is fixed guidance, the same for every project, used while writing Tool 4 mitigation/enhancement measures; the Annex A–H titles built in phase 7 were placeholder data. (a) **Places:** one code registry of the places in the app where guidance can appear, each with a stable key, label and group — *Project workflow* (screening, assessment, Tool 3, Tool 4, monitoring), *Project support* (SEMP Plan, Stakeholder Awareness — v3), *Organization* (GHG Emissions, Environmental Data Collection — v3). Linking never uses tool numbers or order, so tools without a number or without a project fit the same way; a new tool adds one key. v3 places can already be chosen (marked "v3"), so their guidance is ready when they open. Places are code (a place exists only where a page renders it); library documents are data. (b) **Library documents:** title, description, one PDF (PDF only — the library is for reading), `places` (zero or more; none = general, shown only on the Library page), order. Upload, edit, re-link, replace the PDF (links kept) and delete: `admin` + `environmental_specialist`; read: every role. Not tied to a project. (c) **In place:** each page with linked documents shows a "Guidance (n)" button in its header (hidden when n = 0) that opens a side panel; a document opens in an in-app PDF viewer, without leaving the page. A "Library" page in the main navigation lists every document with search and a place filter, and is where documents are managed. (d) **Project documents** replace the Annex A–H page: per-project files grouped by the same project-workflow place keys plus "Other"; PDF + Office as in phase 7; PDFs open in the same viewer, Office files download only. No server-side conversion (Office files can be required as PDF later). The remaining annexes come from the client later and are added as data. Built in phase 7b; the rework of phase 7 code is accepted. |
| D65 | (Owner, review of phase 7) **Critical-actions log in v2; the full activity log stays v3.** Only actions where we must know who did them are recorded: **destructive** — project delete (snapshot), project purge (as D60), file delete (snapshot), library document delete and file replacement (D64), rows removed from Tools 3/4 by a bulk save (their descriptions); **project state** — archive, restore; **users & access** — user create, role change, deactivate, reactivate, admin password reset. Not logged in v2: ordinary edits and creates (uploads already store `uploaded_by`; submit/approve/reject already live in `status_history`, D16), sign-ins. Entry: when, who (+ copied name/role), action, project (+ copied title) when there is one, target (type, id, copied label), snapshot/details; never passwords, hashes or tokens. Append-only (no endpoint edits or deletes entries), survives project delete/purge and user deactivation. Read by `admin` only: `GET /audit-logs` + a simple Settings → Activity log page. One writer helper, so the v3 full log builds on the same entries. Built in phase 7a; a later phase that adds a critical action logs it and tests it (README rule). Phase 11 puts the write and its entry in one transaction. The full field-level log, project histories for other roles and their access rules are v3 ([V3_VISION.md](V3_VISION.md)). |
| D66 | (Owner, review of phase 7) **Two seams so v3 can change access in one place.** (a) **One project-access check:** every route that reads or writes a project or anything inside it (project list and dashboard, workspace, each tool's read by project or by id, rows, files, history) goes through one backend function (e.g. `assertProjectAccess(user, projectId)` / `projectFilterFor(user)`). In v2 it allows every signed-in user, so behaviour does not change; v3 puts project membership behind it. A route-table test fails if a project-scoped route skips it. (b) **Permissions take the user, not the role:** `permissionsFor(user)`, `allowedActions(user, project, workflow)`, and routes name a permission (`requirePermission('screening.approve')`) instead of listing roles; the role → permission map stays in `config/permissions.js`. v3 swaps that map for per-user capabilities without touching routes. Built in phase 7a; no visible change. |

## Open items

None. The phase plan is in [README.md](README.md).
