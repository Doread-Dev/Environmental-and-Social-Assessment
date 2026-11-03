# Second version (v2 prototype) — inventory

Reviewed 2026-11-03. Source folder: `Environmental-and-Social-Assessment-main version 2/` (untracked, not part of the repo). v2 is the current repo plus additions; `package.json` files are identical (no new dependencies). It was run locally against a separate `esms_v2` database with the demo project.

Status column: **Take** = proposed to adopt, **Ask** = needs a decision, **Skip** = leave behind. These were proposals at review time; the owner's final calls are D45–D58 in [DECISIONS.md](DECISIONS.md), which win over this file. Anything from v2 not covered there stays as in this repo unless the owner approves it.

## 1. New modules

| Module | Scope | What it is | v2 state | Proposal |
|---|---|---|---|---|
| SEMP Plan (`/semp-plan`, model `SempPlan`) | Project | One living document per project, mirrors the "SE MP" sheet of the AKF workbook: 1 Project details + Programme name + 5 narratives (scope, description, legal, screening summary, risk summary), 2 Roles (6 roles, internal user **or** external text), 3 RACI matrix (16 fixed activities × 6 roles, codes R/A/C/I/R*), 4 Objectives & targets (bullets + responsible + date), 5 Training, 6 Incidents, 7 Project files & records (uploads, 11 categories), 8 Revision history (manual). Narratives prefilled once from approved Tool 1/2. Unlocked after Tool 2 approval; does **not** gate Monitoring; not in completion %. Excel export reproduces the workbook sheet. | Hidden behind feature flag | **Ask** (recommend take) |
| Annex & Attachments | Project | Annex A–H (fixed list) with real upload / download / delete per annex. Generic attachment system: multer to `uploads/`, 10 MB limit, safe paths, `document_category`, authenticated download, cascade on project delete. | Enabled | **Ask** — conflicts with D26 |
| Project Files page | Project | Lists all project attachments grouped by type | Enabled | Skip (D26) |
| Stakeholder Awareness | Project ("support tool") | One annual report per project/year: total stakeholders + 12 months × (male, female, location, activity, notes); monthly %, annual summary computed by backend. Independent of workflow. | Hidden | **Ask** |
| GHG Emissions | Organization | One report per year: 4 fixed categories (Transport S1, Generator S1, Electricity S2, Transport S3) × Q1–Q4 CO₂ tonnes, staff count, per-staff footprint, project emissions list. Specialist writes, all read. | Hidden | **Ask** |
| Environmental Data Collection | Organization | One report per year: dynamic activity rows with free-named periods, unit, notes; totals computed. Specialist writes. | Hidden | **Ask** |

## 2. Changes to existing tools (backend)

| Change | Matches decision | Proposal |
|---|---|---|
| `workflow.service.js`: backend gates — Tool 2 needs Tool 1 approved, Tools 3/4 need Tool 2 approved, Tool 5 needs 3+4 complete | D2 | Take (fold into D30 workflow state) |
| Auth required on GET for screenings, assessments, SEMP, monitoring, management, mitigation (projects + lookups still public) | D3 (partial) | Take, finish the rest |
| Unique indexes: screening per project, score per (assessment, question), monitoring per (project, indicator); 409 on duplicate create | D18 | Take |
| Assessment submit requires all 50 distinct questions answered; scores must reference real questions; no duplicate questions | D36 | Take |
| Assessment prefill on create: `project_activity` ← project component, impacts ← approved screening | — | Take |
| Assessment `project_activity` / `description` made optional | — | Take (matches Excel) |
| `responsible_text` on Tools 3, 4, 5: responsible is an internal user **or** a free-text external party | — | **Ask** (recommend take) |
| Updates can no longer change `project` of a row | D5 | Take |
| JWT errors: 401 vs 403 vs 500 cleanly separated; no stack traces on auth errors | D3 | Take |
| Total impact: same "highest level wins" rule, cleaner code | — | Take |
| Screening approve: recommendations no longer required (was ≥ 20 chars) | — | **Ask** |

## 3. Frontend / UI

| Change | Proposal |
|---|---|
| `ProjectDetailsCard` (Location, Component, Start, End, "Not specified" fallback) replaces the placeholder Site card | Take (closes D29 replacement) |
| New brand palette from the AKF logo (primary `#008c54`, green scale, softer dark mode), tokens updated in `index.css` | Take |
| Login page redesign with local AKF logo + Syria map (local assets, offline-safe), PNG favicon, new title | Take (minus "Forgot password", D25) |
| Sidebar: Tools 3 and 4 as two separate entries; new "SEMP Plan", "Project support tools" and "Organization tools" sections | Take with the modules chosen |
| "Screening Category" label instead of "Risk Level"; viewers no longer see Start/Edit buttons | Take |
| Excel exports rewritten to reproduce the official workbook "AKF-S Environmental and Social Assessment Tooles 2025.xlsx" (Tool 2, 3, 4, 5, SEMP sheets: merges, colours, widths) | Take (D28 keeps export in frontend) |
| `featureAccess.js` / `FeatureRouteGuard` (feature flags hiding unfinished modules) | Skip — we ship what we decide |
| `ComponentShowcase.jsx`, `apiTest.js` | Skip |

## 4. Leave behind

- `docs/STEP_*.md`, `docs/verification/**` (audit evidence from the prototype's AI runs), `backend/scripts/verify*.cjs`, `frontend/scripts/verify*.{cjs,mjs}` — replaced by real tests (D39).
- `dbprobe3.js`, `dbprobe4.js`, `dbquery.js` — probes of a MongoDB Atlas cluster (hostnames inside, no passwords). Must never be committed.
- `frontend/build_err*.txt`.
- The `project.service` cascade complexity (ownership preflight across 5 attachment conventions) — only needed if legacy attachment types stay.

## 5. Problems still present in v2 (our plan already fixes them)

- Self-approval: screening/assessment update schemas still accept `status: approved` (D1).
- `GET /projects` and `/lookups/*` still public (D3).
- Open first-user registration (D7); `is_active` not checked at login (D4).
- "Forgot password?" link still a dead end (D25).
- Google Fonts / Material Symbols from the internet (D37).
- N+1 requests and frontend-derived workflow (D30–D33).
- **New bug:** the sidebar always shows "Assessment – Tool 2" as locked, because expandable nav items have no `feature` and `isFeatureEnabled(undefined)` is false.
- SEMP Plan and Stakeholder reports are not deleted when a project is deleted.
- `vendor-excel` chunk is ~930 kB.
