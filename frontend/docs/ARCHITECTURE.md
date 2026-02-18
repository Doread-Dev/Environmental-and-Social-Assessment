# System Architecture (Frontend)

This document describes the frontend application architecture of the Environmental and Social Management System (ESMS): folder layout, data flow, entry points, and build output. The frontend is a single-page application (SPA) built with React 19 and Vite 7 that consumes the backend REST API for auth, projects, screenings, assessments, SEMP, monitoring, lookups, and attachments.

---

## Overview

The ESMS frontend is a client-only React application. It has a single HTML entry (`index.html`), one JavaScript entry (`src/main.jsx`), and uses React Router 7 for in-app navigation. All server data is obtained via the shared Axios instance in `src/services/api.js`; authentication and reference data are provided through React contexts. There is no global Redux or Zustand store—page-level state is held in components and domain hooks that call services. The build is produced by Vite into a `dist/` directory as static assets suitable for any static host.

---

## Folder Structure

The frontend codebase is split between the project root (config and static assets) and `src/` (application code). The path alias `@` resolves to `src/`.

| Location | Purpose |
|----------|---------|
| `frontend/` (root) | Project root: `index.html`, `vite.config.js`, `package.json`, `public/`, `.env` (gitignored). |
| `frontend/public/` | Static assets copied as-is into build output (e.g. `favicon.svg`). |
| `frontend/src/` | All application source: entry, app shell, routes, contexts, services, pages, components, hooks, utils, data. |
| `frontend/src/main.jsx` | JavaScript entry: mounts React app into `#root` with providers. |
| `frontend/src/App.jsx` | Root component: `ErrorBoundary`, `OfflineBanner`, `RouterProvider`. |
| `frontend/src/index.css` | Global styles: Tailwind import, design tokens (CSS variables), dark mode variant. |
| `frontend/src/contexts/` | React context providers: `AuthContext`, `LookupContext`, `ThemeContext`; barrel `index.js`. |
| `frontend/src/routes/` | Router definition: `index.jsx` (createBrowserRouter, lazy pages), `routes.config.js` (ROUTES, nav config), `ProtectedRoute`, `*RouteGuard` components. |
| `frontend/src/services/` | API layer: `api.js` (Axios instance, interceptors, error helpers), `authService`, `lookupService`, `projectService`, `userService`, `screeningService`, `assessmentService`, `sempService`, `monitoringService`; barrel `index.js`. |
| `frontend/src/pages/` | Route targets: `auth/`, `dashboard/`, `projects/`, `project-workspace/` (overview, screening, assessment, semp, monitoring, annex), `settings/`, `ComponentShowcase.jsx`. |
| `frontend/src/components/` | Reusable UI: `layout/` (Header, MainSidebar, ProjectSidebar, AuthLayout, MainLayout, ProjectLayout, SempFullWidthLayout, MobileMenu), `ui/` (shared components + ToastProvider), `assessment/`, `screening/`, `semp/`, `monitoring/`, `files/`, `dashboard/`, `project/`, `settings/`, plus `ErrorBoundary.jsx`, `OfflineBanner.jsx`. |
| `frontend/src/hooks/` | Domain and utility hooks: `useProjects`, `useScreening`, `useAssessment`, `useSemp`, `useMonitoring`, `useWorkflow`, `useFiles`, `useOnlineStatus`; barrel `index.js`. |
| `frontend/src/utils/` | Pure helpers: Excel export (`excelExport/`), attachments, assessment methods, ranking/screening display, workflow statuses, `index.js` (re-exports including `cn`). |
| `frontend/src/data/` | Static or seed data used by the app (e.g. `data/index.js`). |

**Constraints**

- Only `src/` contains application logic; `public/` is for assets that must keep their filenames.
- All env vars exposed to the client must be prefixed with `VITE_` (see Build output).
- Imports use the `@` alias for `src/` (e.g. `@/services/api`, `@/contexts`).

---

## Data Flow

Data flows from the backend into the app via the shared API client; auth and lookups are centralized in contexts; pages and hooks fetch domain data on demand.

1. **Bootstrap**  
   The browser loads `index.html`, which runs an inline script to apply saved theme (localStorage `esms-theme`) to `<html class="dark">` before paint, then loads the module `/src/main.jsx`. `main.jsx` wraps the app in: `AuthProvider` → `LookupProvider` → `ThemeProvider` → `ToastProvider`, then renders `App`. `App` wraps content in `ErrorBoundary` and `OfflineBanner` and renders `RouterProvider` with the router from `src/routes/index.jsx`.

2. **Auth**  
   `AuthProvider` reads token and user from `authService` (localStorage: `token`, `user`). On mount it validates the token (e.g. expiry); if invalid it clears storage and leaves the user unauthenticated. Login submits credentials via `authService.login()` → `api` POST to backend; on success the backend returns a JWT and user object, which are stored and updated in context. The `api` request interceptor attaches `Authorization: Bearer <token>` to every request. The response interceptor on 401 clears token and user and redirects to `/login` (and stores `redirectAfterLogin` in sessionStorage). Protected routes use `ProtectedRoute`, which reads `useAuth()` and redirects to login when not authenticated; optional `allowedRoles` enforce role-based access.

3. **Lookups**  
   `LookupProvider` runs inside `AuthProvider` and, when the user is authenticated, calls `lookupService` to fetch impact categories, questions, indicators, job titles, and optionally users. Data is cached in context state and exposed via `useLookups()`. Lookup data is cleared on logout. Pages and components that need reference data use `useLookups()` (or the exported constants such as `IMPACT_LEVELS` / `IMPACT_LEVEL_CONFIG` from LookupContext).

4. **Theme**  
   `ThemeProvider` manages theme mode (light / dark / system) and persists it to localStorage (`esms-theme`). The same key is read by the inline script in `index.html` to avoid flash. No server round-trip.

5. **Page and domain data**  
   There is no global data store beyond the contexts above. Each page or feature fetches what it needs via:
   - **Services**: e.g. `projectService`, `screeningService`, `assessmentService`, `sempService`, `monitoringService`, `userService`. All use the shared `api` instance (base URL from `VITE_API_URL`, timeout from `VITE_API_TIMEOUT`).
   - **Hooks**: e.g. `useWorkflow(projectId)`, `useScreening(projectId)`, `useAssessment(projectId)`, `useSemp(projectId)`, `useMonitoring(projectId)`, `useProjects()`, `useFiles(projectId)`. These hooks call the above services and expose loading/error/data to components.
   - **Layouts**: `ProjectLayout` uses `useWorkflow(projectId)` and project fetch to show project name and workflow state; it does not own screening/assessment/SEMP/monitoring data for child pages—each child page or router segment uses its own hooks/services.

6. **User actions**  
   User actions (e.g. submit screening, save assessment) are handled in the page or component: they call the appropriate service method (e.g. `screeningService.update(...)`), then either invalidate local state, refetch via the same hook, or navigate. Toasts and errors use the UI toast layer and `extractErrorMessage(error)` from `api.js`.

**Invariants**

- Every HTTP request to the backend goes through `src/services/api.js` (no raw fetch to the API base URL elsewhere).
- Auth state is the single source of truth for “logged in” and “user/roles”; it is persisted in localStorage and restored on reload.
- Lookup data is loaded once per authenticated session and provided only via LookupContext (no duplicate fetch from pages for the same reference data).

---

## Entry Points

**HTML**

- **Single entry**: `frontend/index.html`. It defines the root `<div id="root">` and the only script module: `<script type="module" src="/src/main.jsx"></script>`. No other HTML files are used as entry points.

**JavaScript**

- **Single JS entry**: `frontend/src/main.jsx`. It creates the React root, mounts the provider tree and `App`, and imports `./index.css`. No other file is specified as an entry in Vite; all other modules are reached via imports (and dynamic `import()` for lazy routes).

**Router**

- **Router creation**: `frontend/src/routes/index.jsx` exports `router` created with `createBrowserRouter(...)`. The array defines:
  - **Auth**: layout `AuthLayout`, child path `ROUTES.LOGIN` (`/login`) with lazy `LoginPage`.
  - **Main app**: path `ROUTES.APP` (`/app`), element `ProtectedRoute` wrapping `MainLayout`; index redirect to `dashboard`; children: `dashboard`, `projects`, `projects/new`, `settings` (with `SettingsRouteGuard` and lazy `SettingsPage`).
  - **Project workspace**: path `/app/projects/:projectId`, element `ProtectedRoute` wrapping `ProjectLayout`; index redirect to `overview`; children: `overview`, `screening`, `screening/summary`, `assessment/*` (with `AssessmentRouteGuard` and nested metadata/methods/scoring/review), `semp` (with `SempRouteGuard`), `monitoring/*` (with `MonitoringRouteGuard`), `files`, `annex`.
  - **SEMP full-width**: path `/app/projects/:projectId/semp`, element `ProtectedRoute` and `SempRouteGuard`, layout `SempFullWidthLayout`; children `activities`, `mitigation`.
  - **Catch-all**: `/` → `Navigate` to `ROUTES.LOGIN`; `*` → `NotFoundPage`.

- **Route constants and nav**: `frontend/src/routes/routes.config.js` exports `ROUTES` (all path strings), `getProjectRoute(projectId, route)`, `MAIN_NAV_ITEMS`, `PROJECT_WORKFLOW_NAV`, `PROJECT_SECONDARY_NAV`. These are used by the router and by sidebars for links.

- **Layouts and outlets**: `AuthLayout`, `MainLayout`, `ProjectLayout`, and `SempFullWidthLayout` render `<Outlet />` where child route elements are rendered. Route guards (`ProtectedRoute`, `SettingsRouteGuard`, `AssessmentRouteGuard`, `SempRouteGuard`, `MonitoringRouteGuard`) either render `children`/outlet or redirect; they do not render their own layout.

**Lazy loading**

- Page components are loaded via `React.lazy()` and wrapped in a `Suspense` + `PageLoader` fallback. Layout components (AuthLayout, MainLayout, ProjectLayout, SempFullWidthLayout) are eagerly imported so the shell is always present.

**Invariants**

- There is exactly one HTML entry and one JS entry; the router is the single source of route definitions.
- Unauthenticated access to `/app` or any child is blocked by `ProtectedRoute`; role and workflow guards further restrict settings, assessment, SEMP, and monitoring.

---

## Build Output

The production bundle is produced by Vite when running `npm run build` (i.e. `vite build`). Output directory is the default **`dist/`** (no `outDir` override in `vite.config.js`).

**Structure**

- **Root**: `dist/index.html` is the entry HTML; it references hashed asset paths (e.g. `/assets/index-<hash>.js`, `/assets/index-<hash>.css`). Static assets from `public/` are copied to `dist/` at root (e.g. `dist/favicon.svg`).
- **Assets**: All generated JS and CSS live under `dist/assets/` with content hashes in filenames: `[name]-[hash].js`, `[name]-[hash].[ext]` for CSS and other assets. Filenames are controlled by `vite.config.js` → `build.rollupOptions.output`: `chunkFileNames`, `entryFileNames`, `assetFileNames` all use the `assets/` prefix.

**Chunking (manualChunks)**

- **vendor-excel**: `node_modules/exceljs` and `node_modules/file-saver` (one shared chunk for Excel export).
- **react**: `node_modules/react/`, `node_modules/react-dom/`.
- **router**: `node_modules/react-router` (and related).
- **utils**: `node_modules/clsx`, `node_modules/tailwind-merge`, `node_modules/axios`.
- **ui**: modules under `src/components/ui/`.
- **layout**: modules under `src/components/layout/`.
- **data**: modules under `src/data/`.
- **hooks**: modules under `src/hooks/`.
- **assessment**: modules under paths containing `/assessment/`.
- **screening**: modules under paths containing `/screening/`.
- **semp**: modules under paths containing `/semp/`.
- **monitoring**: modules under paths containing `/monitoring/`.
- Other code (e.g. pages, services, contexts, routes) is grouped by Rollup’s default behavior into entry and dynamic chunks.

**Build options (from vite.config.js)**

- **Target**: `es2020`.
- **Minification**: `terser` with `drop_console: true`, `drop_debugger: true`, and removal of `console.info`/`debug`/`trace`; comments stripped; `safari10: true` for mangling.
- **Source maps**: `sourcemap: false`.
- **CSS**: `cssCodeSplit: true`, `cssMinify: true`.
- **Warnings**: `chunkSizeWarningLimit: 500` (vendor-excel can be large).
- **Optimize deps**: `optimizeDeps.include` lists `react`, `react-dom`, `react-router-dom`, `exceljs`, `file-saver` for pre-bundling.

**Environment at build time**

- Only variables prefixed with `VITE_` are inlined into the client bundle. Typical keys: `VITE_API_URL` (backend API base including `/api/v1`), `VITE_API_TIMEOUT` (number, default 30000). In development, `api.js` falls back to `http://localhost:3000/api/v1` when `VITE_API_URL` is unset; in production there is no fallback—`VITE_API_URL` must be set for the build that is deployed.

**Serving**

- The app is a SPA: the server must serve `dist/index.html` for all non-asset paths (or configure fallback to `index.html`) so that client-side routing works. `npm run preview` serves `dist/` locally for testing.

**Invariants**

- Build output is static files only; no server-side rendering or runtime backend in the frontend repo.
- Production bundle does not contain `console.log`/`console.info`/`console.debug`/`console.trace` (stripped by terser).
- ESLint is configured to ignore the `dist/` directory.
