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
| D16 | Simple status history on screening & assessment: created / submitted / approved / rejected, with user + timestamp. Full field-level audit log deferred to **v3**. |
| D17 | Projects: hard delete only when nothing in the project is approved; otherwise **archive** (hidden from default lists, read-only, restorable). Delete/archive: `admin` + `environmental_specialist`. |
| D18 | Each project has at most one screening and one assessment — enforced by unique indexes. |
| D19 | Monitoring quarter values and `total` stay **free text** (clients mix numbers and text). Backend must not parse or compute them. |
| D20 | Concurrent edits to the same SEMP table: last save wins (known limitation, not handled now). |

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
| D47 | One small file module serving **Annex A–H** and, from day one, **SEMP Plan §7 records** (data model and categories ready now so v3 needs no rework; the §7 UI stays locked with the SEMP Plan). Local disk storage, size limit, server-generated file names, authenticated download, upload/delete for editors, read for viewers, removed with the project. Backups include the uploads folder (D38). |
| D48 | **Locked until v3:** SEMP Plan, Stakeholder Awareness, GHG Emissions, Environmental Data Collection. Their code is ported but **dead**: backend routers are not mounted (no reachable endpoint), frontend pages are not registered as routes (so not in the build); the UI shows their buttons with a lock and "Available in v3". No env switch can turn them on in production. |
| D49 | Adopt v2's AKF brand palette (primary `#008c54`, green scale from the logo, updated dark tokens). |
| D50 | Adopt v2's Project Details card (location, component, start/end date, "Not specified" when empty) on the project overview. |
| D51 | Adopt v2's login page design (local AKF logo + Syria map, PNG favicon), with "Contact your system administrator" instead of "Forgot password?" (D25). |
| D52 | Excel exports reproduce the official AKF workbook layout ("AKF-S Environmental and Social Assessment Tooles 2025.xlsx") — port v2's builders for Tools 2–5 (and the SEMP Plan sheet with D46). |
| D53 | Assessment prefill, once, when the assessment is created: project activity ← project component; potential negative / positive impact ← approved screening. Fields stay editable afterwards. |
| D54 | All 50 assessment questions default to **Negligible** (set by the backend when the assessment is created). The user changes only what differs; submit is always possible; the backend still checks that all 50 distinct questions have a level. |
| D55 | Tools 3, 4, 5 "Responsible" = an internal user **or** a free-text external party (`responsible_text`), never both. |
| D56 | Screening approval: recommendations are optional. |
| D57 | No minimum-character rules on any field, frontend or backend. Required fields stay required (must not be empty) — e.g. assessment `project_activity` and `description` remain required. |
| D58 | Port v2's backend hardening that matches D1–D18: unique score per (assessment, question) and monitoring record per (project, indicator), 409 on duplicate create, `project` cannot change on update, scores must reference real questions, clean 401/403/500 for auth errors. |

| D59 | Navigation stays as in this repo: one sidebar entry "SEMP – Tools 3 & 4" (not split). The locked SEMP Plan button lives inside the SEMP overview page, where the "Coming soon" card is today. The overview metric keeps the label "Risk Level". |

## Open items

None. The phase plan is in [README.md](README.md).
