# Phase 9 — v3 modules as locked code

**Goal:** port the four v3 modules so v3 only has to switch them on, while in v2 they are **unreachable**: no mounted endpoint, no route, not in the frontend bundle. The UI shows locked buttons.

**Decisions:** D46, D48 (+ D47 §7 area already in the file module).

## Modules and v2 sources

| Module | Scope | v2 backend | v2 frontend | Locked button location |
|---|---|---|---|---|
| SEMP Plan | Project | `models/sempPlan.model.js`, `services/sempPlan.service.js`, `validators/sempPlan.validator.js`, `controllers/sempPlan.controller.js`, `routes/sempPlan.routes.js` | `pages/project-workspace/semp-plan/SempPlanPage.jsx`, `hooks/useSempPlan.js`, `services/sempPlanService.js`, `utils/excelExport/sempWorkbook.js`, `exportSempPlan.js`, `constants/sempRecordCategories.js` | SEMP overview page, in place of the "Coming soon" card (D59) |
| Stakeholder Awareness | Project | `stakeholderAwarenessReport.*` (model/service/validator/controller/routes) | `pages/project-workspace/stakeholder-awareness/`, `hooks/useStakeholderAwarenessReport.js`, `services/stakeholderAwarenessService.js`, `utils/stakeholderAwareness.js` | Project sidebar, "Project support tools" section |
| GHG Emissions | Organization | `organizationGhgReport.*` | `pages/organization/ghg-emissions/`, `hooks/useGhgEmissionsReport.js`, `services/ghgEmissionsService.js`, `utils/ghgEmissions.js` | Main sidebar + mobile menu, "Organization tools" |
| Environmental Data Collection | Organization | `organizationEnvironmentalDataReport.*` | `pages/organization/environmental-data-collection/`, `hooks/useEnvironmentalDataCollectionReport.js`, `services/environmentalDataCollectionService.js`, `utils/environmentalDataCollection.js` | Main sidebar + mobile menu, "Organization tools" |

## How "locked" is built
- Backend code lives under `backend/src/v3/<module>/` (or the normal folders with a clear `v3` marker — decide once). Routers are **not** required from `routes/index.js`. Models are not registered at startup (nothing requires them), so no collection is created.
- Frontend code lives under `frontend/src/v3/<module>/`; no route in `routes/index.jsx` imports it, so Vite leaves it out of the build. ESLint/Prettier still check it.
- One constant `V3_LOCKED_NAV` in `routes.config.js` describes the locked buttons (label, icon, location). Locked buttons are not links: lock icon + "Available in v3" tooltip, keyboard-accessible.
- No env variable, query flag or role can enable them. Enabling = a code change in v3.
- While porting, align the code with our rules so v3 needs little rework: `admin` role in writer lists, auth on every route, no `status`-style client fields, shared `normalizeResponsibility`, project delete cascade includes SEMP Plan, Stakeholder reports and `semp_record` files (cascade code written but only active when the module is), files via our `ProjectFile` module (not v2 attachments), no v2 feature-flag code (`featureAccess.js`, `FeatureRouteGuard`).

## Tests
- A test that lists the mounted Express routes and fails if any v3 path (`/semp-plan`, `/stakeholder-awareness`, `/organization-*`) is reachable.
- Build test: the production bundle contains none of the v3 page names (grep `dist/`).
- Unit tests for pure v3 helpers (normalizers, summaries) so they don't rot.
- Locked buttons render, are not navigable, show the tooltip.

## Done when
- [ ] v3 endpoints unreachable, pages absent from the bundle, locked buttons visible in the agreed places.
- [ ] `CLAUDE.md` explains the `v3/` folders and how v3 will enable them.

## Out of scope
Turning any of them on.

## Found during phase
