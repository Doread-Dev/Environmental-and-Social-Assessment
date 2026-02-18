# Routing and Pages

This document describes the frontend routing configuration, route protection, workflow guards, the full list of pages, and the project-workspace structure. The frontend uses React Router 7 with a single `createBrowserRouter` definition; all route constants and navigation metadata are centralized in `routes.config.js`.

---

## Routes Configuration

Route paths and navigation metadata live in `src/routes/routes.config.js`. The application does not use inline path strings elsewhere for app routes; components import `ROUTES` or `getProjectRoute` from this file.

**Route constants (`ROUTES`):**

| Constant | Path | Description |
|----------|------|-------------|
| `LOGIN` | `/login` | Public auth page |
| `APP` | `/app` | Base for all authenticated app routes |
| `DASHBOARD` | `/app/dashboard` | Main dashboard |
| `PROJECTS` | `/app/projects` | Project list |
| `PROJECT_NEW` | `/app/projects/new` | Create project |
| `PROJECT_BASE` | `/app/projects/:projectId` | Project workspace root (dynamic) |
| `PROJECT_OVERVIEW` | `/app/projects/:projectId/overview` | Project overview |
| `SCREENING` | `/app/projects/:projectId/screening` | Screening (Tool 1) |
| `SCREENING_SUMMARY` | `/app/projects/:projectId/screening/summary` | Screening summary |
| `ASSESSMENT` | `/app/projects/:projectId/assessment` | Assessment (Tool 2) index |
| `ASSESSMENT_METADATA` | `/app/projects/:projectId/assessment/metadata` | Assessment metadata step |
| `ASSESSMENT_METHODS` | `/app/projects/:projectId/assessment/methods` | Assessment methods step |
| `ASSESSMENT_SCORING` | `/app/projects/:projectId/assessment/scoring` | Assessment scoring step |
| `ASSESSMENT_REVIEW` | `/app/projects/:projectId/assessment/review` | Assessment review step |
| `SEMP` | `/app/projects/:projectId/semp` | SEMP overview (Tools 3 & 4) |
| `SEMP_ACTIVITIES` | `/app/projects/:projectId/semp/activities` | Management activities (Tool 3) |
| `SEMP_MITIGATION` | `/app/projects/:projectId/semp/mitigation` | Mitigation plan (Tool 4) |
| `MONITORING` | `/app/projects/:projectId/monitoring` | Monitoring (Tool 5) overview |
| `MONITORING_DATA` | `/app/projects/:projectId/monitoring/data-entry` | Monitoring data entry |
| `PROJECT_FILES` | `/app/projects/:projectId/files` | Project attachments |
| `PROJECT_ANNEX` | `/app/projects/:projectId/annex` | Annex overview |
| `SETTINGS` | `/app/settings` | Settings (role-restricted) |

**Helper:**

- `getProjectRoute(projectId: string, route: string): string` — Replaces `:projectId` in a route constant with the given ID. Example: `getProjectRoute('123', ROUTES.PROJECT_OVERVIEW)` → `'/app/projects/123/overview'`.

**Navigation arrays (used by layout sidebars):**

- `MAIN_NAV_ITEMS`: dashboard, projects (paths under `/app`).
- `PROJECT_WORKFLOW_NAV`: overview, screening, assessment (with children metadata, methods, scoring), semp, monitoring (paths relative to project workspace).
- `PROJECT_SECONDARY_NAV`: annex & attachments (children: files, annex).

**Constraints**

- All app URLs under `/app` are defined in `ROUTES` or as children of `PROJECT_BASE`. Root `/` redirects to `ROUTES.LOGIN`. Unmatched paths render the 404 (NotFoundPage).
- Project-scoped links must use `getProjectRoute(projectId, ROUTES.*)` so that path and config stay in sync.

---

## Protected Routes

Any route that requires an authenticated user is wrapped by the `ProtectedRoute` component. Protection is applied at layout level in `src/routes/index.jsx`: the `/app` tree and the `/app/projects/:projectId` trees render with `ProtectedRoute` as the outer wrapper.

**Behavior of `ProtectedRoute`:**

1. Reads `isAuthenticated`, `isLoading`, and `hasAnyRole` from `useAuth()` (AuthContext).
2. While `isLoading` is true: renders an inline loading UI (spinner + “Verifying authentication...”).
3. If not authenticated: `<Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />` so the user can be sent back after login.
4. If `allowedRoles` prop is provided and non-empty: checks `hasAnyRole(allowedRoles)`; on failure redirects to `ROUTES.DASHBOARD` with `replace`.
5. Otherwise: renders `children`.

**Where it is used:**

- `path: ROUTES.APP` — element `<ProtectedRoute><MainLayout /></ProtectedRoute>`. All dashboard, projects, and settings routes are under this layout.
- `path: '/app/projects/:projectId'` — element `<ProtectedRoute><ProjectLayout /></ProtectedRoute>`. All project-workspace routes (overview, screening, assessment, SEMP, monitoring, files, annex) are under this layout.
- `path: '/app/projects/:projectId/semp'` (second SEMP tree) — element `<ProtectedRoute><SempRouteGuard /></ProtectedRoute>`. SEMP full-width sub-routes (activities, mitigation) are protected and then guarded by workflow.

**Constraints**

- `ProtectedRoute` does not perform API calls; it only uses AuthContext state. Auth is established at app load (e.g. token in storage) and refreshed by the auth layer.
- Role-based protection via `allowedRoles` is supported by the component but not used in the current route tree; role restriction for Settings is enforced by `SettingsRouteGuard` instead.

---

## Guards

Guards are route-level components that either render `<Outlet />` (and pass through `outletContext`) or redirect. They run after authentication (inside `ProtectedRoute` or under a protected layout). All guards that depend on project data use `useParams()` to get `projectId` and relevant hooks (`useScreening`, `useAssessment`, `useSemp`) to load workflow state.

### SettingsRouteGuard

- **File:** `src/routes/SettingsRouteGuard.jsx`
- **Wraps:** `/app/settings` and its index child (SettingsPage).
- **Logic:** If `user.role !== USER_ROLES.ENVIRONMENTAL_SPECIALIST`, redirects to `/app/dashboard` with `state={{ from: location }}`. While `isLoading`, shows an inline loading UI.
- **Invariant:** Only the Environmental Specialist role can access Settings. No other roles are allowed.

### AssessmentRouteGuard

- **File:** `src/routes/AssessmentRouteGuard.jsx`
- **Wraps:** `/app/projects/:projectId/assessment` and all its children (index, metadata, methods, scoring, review).
- **Logic:** Uses `useScreening(projectId)`. If `screening?.status !== 'approved'`, redirects to `/app/projects/${projectId}/screening` with `state={{ from: location }}`. While loading screening, shows inline loading.
- **Invariant:** Assessment routes are only reachable when the project’s screening status is `approved`.

### SempRouteGuard

- **File:** `src/routes/SempRouteGuard.jsx`
- **Wraps:** SEMP routes (overview under ProjectLayout, and the full-width SEMP tree for activities/mitigation).
- **Logic:** Uses `useAssessment(projectId)` and `useScreening(projectId)`. If screening is not approved, redirects to project screening. If assessment is not approved, redirects to project assessment. Otherwise renders `<Outlet context={outletContext} />`. Loading state shown while either hook is loading.
- **Invariant:** SEMP is only reachable when both screening and assessment are approved.

### MonitoringRouteGuard

- **File:** `src/routes/MonitoringRouteGuard.jsx`
- **Wraps:** `/app/projects/:projectId/monitoring` and its children (overview, data-entry).
- **Logic:** Uses `useAssessment`, `useScreening`, and `useSemp(projectId)`. Same screening and assessment checks as SempRouteGuard; additionally, if `getSempStatus() !== 'completed'`, redirects to `/app/projects/${projectId}/semp`. Otherwise renders outlet. Loading state while any of the three is loading.
- **Invariant:** Monitoring is only reachable when screening is approved, assessment is approved, and SEMP is completed.

**Constraints**

- Guards do not fetch data themselves; they rely on hooks that call the API. Redirects use `replace` and preserve `from` in location state where applicable.
- Guard order in the route tree: ProtectedRoute (auth) → layout → workflow guard (when present) → page. Settings is the only route that uses a role guard instead of a workflow guard.

---

## Pages List

Pages are lazy-loaded in `src/routes/index.jsx` via `lazy(() => import('...'))` and rendered inside `<Suspense fallback={<PageLoader />}>`. The table below lists each page component, its route path, and the layout/guard that wraps it.

| Page component | Route path | Layout / guard |
|----------------|------------|----------------|
| LoginPage | `/login` | AuthLayout |
| DashboardPage | `/app/dashboard` | MainLayout, ProtectedRoute |
| ProjectListPage | `/app/projects` | MainLayout, ProtectedRoute |
| ProjectCreatePage | `/app/projects/new` | MainLayout, ProtectedRoute |
| SettingsPage | `/app/settings` (index) | MainLayout, ProtectedRoute, SettingsRouteGuard |
| ProjectOverviewPage | `/app/projects/:projectId/overview` | ProjectLayout, ProtectedRoute |
| ScreeningRouter | `/app/projects/:projectId/screening` | ProjectLayout, ProtectedRoute (router chooses form vs summary) |
| ScreeningSummaryPage | `/app/projects/:projectId/screening/summary` | ProjectLayout, ProtectedRoute |
| AssessmentRouter | `/app/projects/:projectId/assessment` (index) | ProjectLayout, ProtectedRoute, AssessmentRouteGuard |
| AssessmentGatewayPage | Rendered by AssessmentRouter (same path) | Same as AssessmentRouter |
| AssessmentMetadataPage | `/app/projects/:projectId/assessment/metadata` | ProjectLayout, ProtectedRoute, AssessmentRouteGuard |
| AssessmentMethodsPage | `/app/projects/:projectId/assessment/methods` | ProjectLayout, ProtectedRoute, AssessmentRouteGuard |
| AssessmentScoringPage | `/app/projects/:projectId/assessment/scoring` | ProjectLayout, ProtectedRoute, AssessmentRouteGuard |
| AssessmentReviewPage | `/app/projects/:projectId/assessment/review` and via AssessmentRouter | ProjectLayout, ProtectedRoute, AssessmentRouteGuard |
| SempOverviewPage | `/app/projects/:projectId/semp` (index) | ProjectLayout, ProtectedRoute, SempRouteGuard |
| ManagementActivitiesPage | `/app/projects/:projectId/semp/activities` | SempFullWidthLayout, ProtectedRoute, SempRouteGuard |
| MitigationPlanPage | `/app/projects/:projectId/semp/mitigation` | SempFullWidthLayout, ProtectedRoute, SempRouteGuard |
| MonitoringOverviewPage | `/app/projects/:projectId/monitoring` (index) | ProjectLayout, ProtectedRoute, MonitoringRouteGuard |
| MonitoringDataEntryPage | `/app/projects/:projectId/monitoring/data-entry` | ProjectLayout, ProtectedRoute, MonitoringRouteGuard |
| ProjectFilesPage | `/app/projects/:projectId/files` | ProjectLayout, ProtectedRoute |
| AnnexOverviewPage | `/app/projects/:projectId/annex` | ProjectLayout, ProtectedRoute |
| NotFoundPage | `*` (catch-all) | None |

**Special cases:**

- **ScreeningRouter** is a component that does not correspond to a single URL; it is mounted at `screening` and, based on `useScreening(projectId)` and optional `?edit=true`, renders either `ScreeningFormPage` or `ScreeningSummaryPage`. The URL stays `/app/projects/:projectId/screening` unless the user navigates to `screening/summary`.
- **AssessmentRouter** is mounted at `assessment` (index). It does not change the URL; it chooses among `AssessmentGatewayPage` and `AssessmentReviewPage` based on assessment and screening state.
- **SEMP** has two route trees: one under ProjectLayout for the SEMP overview (index), and one with `SempFullWidthLayout` for `activities` and `mitigation`. Both are protected and wrapped by SempRouteGuard.

**Constraints**

- Every path in the table is defined in `ROUTES` or as a child of a route that uses `:projectId`. There are no page components for `/` or `/app`; those are redirects (to login and dashboard respectively). The only catch-all is `*` → NotFoundPage.

---

## Project Workspace

The project workspace is the set of routes under `/app/projects/:projectId`. It is the main area for ESMS workflow: overview, screening, assessment, SEMP, monitoring, and annex/files. The layout is `ProjectLayout`, which provides the project sidebar and breadcrumbs; `projectId` comes from the URL and is used by hooks and guards.

**Structure under `src/pages/project-workspace/`:**

- **overview** — `ProjectOverviewPage` (project summary).
- **screening** — `ScreeningRouter`, `ScreeningFormPage`, `ScreeningSummaryPage`. Router decides form vs summary by screening status and `edit` query.
- **assessment** — `AssessmentRouter`, `AssessmentGatewayPage`, `AssessmentMetadataPage`, `AssessmentMethodsPage`, `AssessmentScoringPage`, `AssessmentReviewPage`. Router decides gateway vs review for the index route.
- **semp** — `SempOverviewPage`, `ManagementActivitiesPage`, `MitigationPlanPage`. Overview in ProjectLayout; activities and mitigation in SempFullWidthLayout (separate route tree).
- **monitoring** — `MonitoringOverviewPage`, `MonitoringDataEntryPage`.
- **annex** — `ProjectFilesPage` (path `files`), `AnnexOverviewPage` (path `annex`).

Barrel exports: `src/pages/project-workspace/index.js` re-exports all of the above page components and routers. Feature modules (e.g. screening, assessment) have their own `index.js` for local exports.

**Workflow order enforced by guards:**

1. **Overview** — always available (no workflow guard).
2. **Screening** — no guard; first step in workflow.
3. **Assessment** — AssessmentRouteGuard: requires screening approved.
4. **SEMP** — SempRouteGuard: requires screening and assessment approved.
5. **Monitoring** — MonitoringRouteGuard: requires screening approved, assessment approved, SEMP completed.
6. **Files / Annex** — no workflow guard; available whenever the project workspace is accessible.

**ScreeningRouter behavior (no URL change):**

- No screening or status `draft` → `ScreeningFormPage`.
- Query `edit=true` and status `rejected` → `ScreeningFormPage`.
- Otherwise (e.g. submitted, rejected without edit, approved) → `ScreeningSummaryPage`.

**AssessmentRouter behavior (no URL change):**

- Screening not approved → inline message “Complete Screening First” (no redirect; guard already ensures screening is approved when this runs).
- No assessment or status `draft` → `AssessmentGatewayPage`.
- Status `submitted`, `approved`, or `rejected` → `AssessmentReviewPage`.

**Constraints**

- All project-workspace routes require `:projectId` in the URL. Navigation to a project (e.g. from dashboard or project list) must use `getProjectRoute(project._id, ROUTES.PROJECT_OVERVIEW)` or the appropriate ROUTES constant. The project sidebar uses relative paths (e.g. `overview`, `screening`) under the current project.
- SEMP sub-routes `activities` and `mitigation` use a different layout (SempFullWidthLayout) and a separate route branch; they share the same `SempRouteGuard` and path prefix `/app/projects/:projectId/semp`.

---

## Key Invariants

1. **Single router:** The app uses one `createBrowserRouter` instance exported from `src/routes/index.jsx` and provided in `App.jsx` via `RouterProvider`. No other router or `<Routes>` root defines app routes.
2. **Config as single source of paths:** All app route paths are defined in `routes.config.js` (`ROUTES`, `getProjectRoute`). Navigation and redirects use these constants.
3. **Protection order:** Auth is checked first (ProtectedRoute). Under `/app`, role or workflow guards run inside the layout. Settings is the only route restricted by role (Environmental Specialist) via SettingsRouteGuard.
4. **Workflow sequence:** Assessment requires screening approved; SEMP requires screening and assessment approved; Monitoring requires screening, assessment, and SEMP completed. Guards enforce this with redirects to the correct step.
5. **Lazy loading:** Every page component is lazy-loaded in the route config; layouts (AuthLayout, MainLayout, ProjectLayout, SempFullWidthLayout) and guards are eager. A single `PageLoader` Suspense fallback is used for lazy segments.
6. **Project workspace scope:** Every route under `/app/projects/:projectId` receives `projectId` from the URL. Hooks and guards that need project-scoped data use `useParams()` to read it; they do not rely on a separate “current project” store for routing.
