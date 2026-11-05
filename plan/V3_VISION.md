# v3 — Vision notes (not a spec)

**What this is:** a reminder list kept during v2, so that nothing gets lost. It is **not** a source of truth and nothing here is decided. When v3 starts, the owner and Claude hold a long, deep review of the whole system (what is weak, what to improve, what to restructure), and that review produces the v3 decisions. Add to this file whenever v2 work turns up something for v3.

**Owner's intent (2026-11-04):**
- v3 is a full restructure toward an **enterprise-level** architecture: built right inside, wider and sturdier.
- Large architecture changes are expected and accepted.
- The client has also asked for features that are not disclosed yet. They are planned for v3 and will shape the structure too.

## Where v2 stands (assessment at the review of phase 7)
**A solid base for a small-to-medium internal app, not enterprise-level.**
- **Strengths:** clear layering; workflow rules on the backend from one source (`computeWorkflow`); consistent validation and API shape; backend tests about 95%; CI.
- **Limits:** listed below as v3 topics.

## Topics for the v3 review

### Access & identity
- **Per-user capabilities instead of fixed roles.** What each person works on, sees and does is set per person (or per group), not by six hard-coded roles.
- **Project membership / scoped access.** For example, a viewer who sees only project X, or a team that works only on its own projects. D66 already routes every project access through one check and every route through named permissions, so this can be added behind those seams.
- **Sessions:**
  - Today: JWT in `localStorage`, no revocation (a password change does not end other sessions), no refresh tokens.
  - Consider server-side sessions or short-lived tokens with refresh and revocation.
- **Single sign-on:** Active Directory / LDAP or SSO for an institutional server.
- **Organisation structure:** branches, offices or regions, if the client needs them; possibly multi-organisation.

### Records & history
- **Full activity log:** field-level changes for every write, project history for the roles allowed to see the project. It builds on the v2 critical-actions log entries (D65).
- **Versioning and revisions of documents:** an approved screening or assessment can't be reopened today and has no revisions. The SEMP Plan design (D46) already has a revision history.
- **Configurable workflows:** multi-level approval, or a different path per project type or category. Today the workflow is linear and in code.

### Configuration
- **Admin-managed lookups:** impact questions, indicators, categories and job titles are seeded today and not editable in the app.
- Annex/library places are code by design (D64). Revisit if v3 makes pages configurable.

### Data & reliability
- **Data integrity:**
  - Today: standalone MongoDB with no transactions; phase 11 adds a single-node replica set and transactions for bulk saves and audit entries.
  - Review whether the domain, which is relational by nature (projects → tools → rows, users, permissions, audit), fits a relational database better. A question for the review, not a plan.
- **Observability:** structured logs, error tracking and health/metrics beyond `GET /health`.
- **Backups and restore**, beyond phase 11's daily dump, if the client needs more.

### Product & quality
- **v3 modules (D48, D70):** SEMP Plan, Stakeholder Awareness, GHG Emissions, Environmental Data Collection. Only locked buttons in v2; built in v3 on the new structure. Designs below.
- **Client-requested features:** not disclosed yet; the owner brings them to the v3 review.
- **Frontend test coverage:** about 34% after phase 7.
- **Office file preview:** server-side conversion (D64 left it out).

## Prepared in v2 for v3
- D65: one audit writer and a forward-compatible entry shape.
- D66: one project-access check and `requirePermission` on every route.
- D64: places by stable key, including v3 and organisation-level places.
- D48, D70: locked buttons for the v3 modules (`V3_LOCKED_NAV`), no code behind them; designs below.

## v3 modules (designs kept from v2)

D70: these four modules are **not** ported in v2, only shown as locked buttons (`V3_LOCKED_NAV` in `frontend/src/routes/routes.config.js`). They are built in v3 on the new structure, after the v3 review. What they hold comes from [V2_INVENTORY.md](V2_INVENTORY.md) §1 (D46 for the SEMP Plan); the v2 prototype is the reference implementation.

**The v2 prototype** (`Environmental-and-Social-Assessment-main version 2/`) exists **only on the owner's machine**: it is git-ignored and was never committed (D45). It must be **kept backed up until v3**, otherwise the reference for these designs is lost. Never edit it.

### SEMP Plan
- **Scope:** project (one living document per project).
- **Holds** (D46, mirrors the "SE MP" sheet): 1 Project details + programme name + 5 narratives (scope, description, legal, screening summary, risk summary); 2 Roles (6 roles, internal user **or** external text); 3 RACI matrix (16 fixed activities × 6 roles, codes R/A/C/I/R*); 4 Objectives & targets (bullets + responsible + date); 5 Training; 6 Incidents; 7 Project files & records (uploads, 11 categories); 8 Revision history (manual). Excel export of the document.
- **Place key:** `semp_plan` (group `project_support`). Locked button: SEMP overview page (D59).
- **v2 code:** backend `models/sempPlan.model.js`, `services/sempPlan.service.js`, `validators/sempPlan.validator.js`, `controllers/sempPlan.controller.js`, `routes/sempPlan.routes.js`; frontend `pages/project-workspace/semp-plan/SempPlanPage.jsx`, `hooks/useSempPlan.js`, `services/sempPlanService.js`, `utils/excelExport/sempWorkbook.js`, `exportSempPlan.js`, `constants/sempRecordCategories.js`.
- **Agreed:**
  - D46: opens after Tool 2 is approved; does **not** gate Monitoring; **not** counted in completion %. Tools 3 & 4 stay and keep gating Monitoring.
  - D69: the narrative inputs start empty (v2 prefills them from the approved Tools 1/2 — do not port that).
  - D47: §7 records are `ProjectFile` rows in area `semp_record` (11 categories or none, `config/files.js`); the area answers 404 until the SEMP Plan opens (`OPEN_AREAS`).

### Stakeholder Awareness
- **Scope:** project ("project support tool"), independent of the workflow.
- **Holds:** one annual report per project and year: total stakeholders + 12 months × (male, female, location, activity, notes); monthly % and annual summary computed by the backend.
- **Place key:** `stakeholder_awareness` (group `project_support`). Locked button: project sidebar, "Project support tools".
- **v2 code:** backend `stakeholderAwarenessReport.*` (model, service, validator, controller, routes); frontend `pages/project-workspace/stakeholder-awareness/`, `hooks/useStakeholderAwarenessReport.js`, `services/stakeholderAwarenessService.js`, `utils/stakeholderAwareness.js`.

### GHG Emissions
- **Scope:** organization (not project-scoped).
- **Holds:** one report per year: 4 fixed categories (Transport S1, Generator S1, Electricity S2, Transport S3) × Q1–Q4 CO₂ tonnes, staff count, per-staff footprint, project emissions list. In v2 the specialist writes, every role reads.
- **Place key:** `ghg_emissions` (group `organization`). Locked button: main sidebar + mobile menu, "Organization tools".
- **v2 code:** backend `organizationGhgReport.*`; frontend `pages/organization/ghg-emissions/`, `hooks/useGhgEmissionsReport.js`, `services/ghgEmissionsService.js`, `utils/ghgEmissions.js`.

### Environmental Data Collection
- **Scope:** organization (not project-scoped).
- **Holds:** one report per year: dynamic activity rows with free-named periods, unit, notes; totals computed. In v2 the specialist writes.
- **Place key:** `environmental_data` (group `organization`). Locked button: main sidebar + mobile menu, "Organization tools".
- **v2 code:** backend `organizationEnvironmentalDataReport.*`; frontend `pages/organization/environmental-data-collection/`, `hooks/useEnvironmentalDataCollectionReport.js`, `services/environmentalDataCollectionService.js`, `utils/environmentalDataCollection.js`.

### Rules for all four (already agreed)
- **D69:** no prefilled narrative inputs; fields the user fills start empty.
- **D64:** each page sets its place key (`handle: { place }`), so library guidance already linked to it shows in its "Guidance" button when it opens.
- **D65:** critical actions (deletes, user/access changes) go through `audit.service.record()` and are tested.
- **D66:** project-scoped modules (SEMP Plan, Stakeholder Awareness) use the project-access check (`middlewares/projectAccess.js`); every route names a permission (`requirePermission`). The organisation modules are not project-scoped.
- **From the v2 review** (fix when building, don't copy): v2 does not delete SEMP Plan and Stakeholder reports with the project (the delete/purge cascade must include them and the `semp_record` files); v2 uses its own attachments (use `ProjectFile`); v2 hides modules with feature flags (`featureAccess.js`, `FeatureRouteGuard` — not wanted); writer lists must include `admin`; no client-settable `status`-style fields; responsible = user **or** external text through the shared helper.
