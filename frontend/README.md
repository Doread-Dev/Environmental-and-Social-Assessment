# Frontend (ESMS)

> The React-based UI for the Environmental and Social Management System — screening, assessment, SEMP, monitoring, annex files, and settings. It consumes the backend REST API and owns all client-side UX and state.

## Responsibilities

- **User interface** — Login, dashboard, project workspace, and settings.
- **ESMS workflows** — Screening, assessment, SEMP (Social and Environmental Management Plan), and monitoring flows with forms, review, and approval.
- **Annex & files** — Project and annex file listing, upload, and download via the backend API.
- **Excel export** — Client-side export (ExcelJS) for screening, assessment, mitigation plan, management activities, and monitoring.
- **Auth & session** — Token storage, login/logout, and protected routing; auth logic lives in [backend](../backend/README.md).
- **Lookups & theme** — Loading and exposing lookup data (e.g. impact categories, rankings) and light/dark/system theme.

## Local Development

1. **Prerequisites:** Node.js LTS. The backend must be running for full functionality (see [project root README](../README.md) and [backend/README.md](../backend/README.md)).
2. **Install:** From repo root, `cd frontend` then `npm install`.
3. **Environment:** Copy `.env.example` to `.env` and set `VITE_API_URL` to your backend base URL (e.g. `http://localhost:3000/api/v1`).
4. **Run:** `npm run dev`. Vite serves the app (default `http://localhost:5173`). Sign in with backend-seeded credentials.

No seed data lives in the frontend; users and lookups come from the backend.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start Vite dev server (HMR). |
| `npm run build` | Production build to `dist/`. |
| `npm run preview` | Serve the production build locally. |
| `npm run lint` | Run ESLint. |
| `npm run lint:fix` | ESLint with auto-fix. |
| `npm run format` | Prettier on `src/**/*.{js,jsx,css,json}`. |
| `npm run format:check` | Prettier check only. |

## Tech Stack

| Layer | Choice |
|-------|--------|
| Runtime / build | React 19, Vite 7, ES modules |
| Routing | React Router 7 |
| HTTP | Axios (shared instance in `src/services/api.js`) |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite`) |
| UI utilities | clsx, tailwind-merge |
| Excel export | ExcelJS, file-saver (lazy-loaded in build) |
| Analytics | @vercel/speed-insights (optional) |

Entry point: `index.html` → `/src/main.jsx`. Main app: `src/App.jsx` (router + error boundary + offline banner). Path alias: `@` → `src/`.

## Key Modules / Components

| Area | Purpose |
|------|---------|
| `src/contexts/` | Auth, Lookup, Theme providers; used in `main.jsx`. |
| `src/routes/` | Router config, guards (e.g. Settings), protected routes. |
| `src/services/` | `api.js` (Axios + interceptors), assessment, screening, semp, monitoring, user services. |
| `src/pages/` | Top-level pages: settings, project-workspace (overview, screening, assessment, semp, monitoring, annex), ComponentShowcase. |
| `src/components/layout/` | Header, MainSidebar, ProjectLayout, ProjectSidebar, MobileMenu, SempFullWidthLayout. |
| `src/components/ui/` | Shared UI + ToastProvider. |
| `src/components/` (feature) | assessment, screening, semp, monitoring, files, dashboard, project, settings. |
| `src/hooks/` | useScreening, useAssessment, useSemp, useMonitoring, useWorkflow, useFiles, useOnlineStatus. |
| `src/utils/` | Excel export, attachment/annex helpers, assessment methods, ranking/screening display, workflow statuses. |
| `src/data/` | Static/data used by the app. |

For architecture, routing, state, API usage, components, hooks, and features, see [frontend/docs/](#frontend-documentation) (when present).

## Configuration

| Key | Type | Default | Purpose |
|-----|------|---------|---------|
| `VITE_API_URL` | string | (none in production) | Backend API base URL including `/api/v1`. In dev, falls back to `http://localhost:3000/api/v1` if unset. |
| `VITE_API_TIMEOUT` | number | 30000 | Request timeout in milliseconds. |

All env vars must be prefixed with `VITE_` to be exposed to the client. Copy `.env.example` to `.env` and set values for your environment.

## How It Connects

- **Consumes:** Backend REST API for auth, users, projects, screenings, assessments, SEMP, monitoring, lookups, and attachments. The base URL is set via `VITE_API_URL`; the Axios instance in `src/services/api.js` sends the JWT and handles 401 (e.g. redirect to login).
- **Exposes:** Nothing; the frontend is a client. It is intended to be served as static assets (e.g. from Vite build or a host like Vercel) and configured to point at the backend URL.

For API contract and backend setup, see [backend/README.md](../backend/README.md) and [backend/docs/](../backend/docs/) (e.g. API_REFERENCE.md).

## Frontend Documentation

Deeper documentation for this domain lives under **frontend/docs/** (when generated), including:

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — Folder structure, data flow, entry points, build.
- [ROUTING_AND_PAGES.md](docs/ROUTING_AND_PAGES.md) — Routes, guards, pages, project workspace.
- [STATE_AND_CONTEXTS.md](docs/STATE_AND_CONTEXTS.md) — Auth, Lookup, Theme contexts and usage.
- [SERVICES_AND_API.md](docs/SERVICES_AND_API.md) — API client, auth and domain services.
- [COMPONENTS.md](docs/COMPONENTS.md) — UI, layout, and feature components.
- [HOOKS_AND_UTILS.md](docs/HOOKS_AND_UTILS.md) — useProjects, useScreening, useAssessment, useSemp, useMonitoring, useWorkflow, utils.
- [FEATURES.md](docs/FEATURES.md) — Screening, assessment, SEMP, monitoring, annex, Excel export, settings.

For project-wide quick start and links, see the [root README](../README.md).
