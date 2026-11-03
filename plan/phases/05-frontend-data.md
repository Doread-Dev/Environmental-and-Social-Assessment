# Phase 5 — Frontend data layer

**Goal:** the frontend reads state from the backend, caches it, and makes few requests. Remove client-side business logic.

**Decisions:** D28a, D30, D33, D34, D35, D57.

## Tasks

### TanStack Query (D33)
- Add `@tanstack/react-query`; `QueryClientProvider` in `main.jsx`; query keys per resource (`['workspace', projectId]`, `['dashboard']`, `['lookups']`, …).
- Rewrite hooks (`useProjects`, `useProjectContext`, `useWorkflow`, `useScreening`, `useAssessment`, `useSemp`, `useMonitoring`, lookups) on top of queries/mutations. Mutations invalidate the right keys.
- Replace window events (`monitoring-data-updated`, etc.) with query invalidation. Keep the export events only if still needed.
- Guards, layout, sidebar and pages share the workspace query — no duplicate fetches.

### Backend switch (D34)
- Backend: "not started" returns `200 { data: null }` instead of 404 for get-by-project endpoints.
- Frontend: remove `silent404` and the global `console.error` override in `services/api.js`.

### Remove derived logic (D30, D35)
- Delete `utils/workflowDerivation.js`; sidebar, overview, timeline, route guards use `workflow` from the workspace response.
- `useAuth` permission helpers read `permissions` / `allowed_actions` from the backend; delete hard-coded role lists.
- Export buttons visible only with the `export` permission (viewers never see them) (D28a).

### Bulk saves (D32)
- Tools 3, 4 and Monitoring save through the bulk endpoints (one request per Save).

### Clean-up
- Remove backend endpoints no longer used by anyone (check with grep and the tests), and their tests.
- `src/data/` deprecated folder: delete if nothing imports it.
- Race conditions found in phase 0: `hooks/useScreening.js` (`isMounted`) and `hooks/useSemp.js` (`cancelled`) set a cancellation flag in the effect cleanup but never check it, so a stale/unmounted request can still set state. Gone once these hooks sit on TanStack Query — make sure no manual flag pattern survives.
- Clear the 4 `react-hooks/exhaustive-deps` warnings left from phase 0 (`components/settings/ProjectsManagementSection.jsx`, `UsersManagementSection.jsx`, `components/ui/Toast.jsx`, `hooks/useAssessment.js`) — by moving the loads to queries, not by disabling the rule.

## Tests
- Hooks: loading / data / error with mocked API (MSW or axios mock).
- Guards redirect based on `workflow`.
- Viewer sees no export / edit buttons.
- Request count on dashboard and workspace load (assert in a test or verify manually and note the numbers here).

## Done when
- [x] Dashboard loads in ≤ 2 API calls, project workspace in ≤ 3; no 404 noise in the console.
- [x] No role list or workflow rule left in the frontend.
- [x] All flows work in the browser; tests, lint, build pass.

## Out of scope
Visual changes (phase 8/10).

## Request counts (full page load, measured in the browser and asserted in `src/routes/requestCounts.test.jsx`)

| Page | Requests |
|---|---|
| Dashboard | 2 — `/auth/me`, `/dashboard` |
| Project overview | 2 — `/auth/me`, `/projects/:id/workspace` |
| SEMP overview | 2 — tool statuses come from the workspace |
| Screening | 3 — + `/screenings/project/:id` |
| Tool 3 / Tool 4 | 4 — + the table, `/users` (picker) |
| Assessment gateway | 5 — + `/lookups`, assessment, screening (methods/consultations/scores only once it exists: +3) |

`/auth/me`, `/lookups` and `/users` are loaded once per session; moving between pages of a project adds no workspace request (shared cache, 30 s stale time). A save refetches the workspace once.

## Decisions taken in this phase

- **TanStack Query** (`@tanstack/react-query` 5): one cache (`services/queryClient.js`, keys in `services/queryKeys.js`). Every tool write goes through `useProjectSave` (mutation → result into the tool's query → workspace refetched before the save resolves, project list/dashboard marked stale). The `workflow-data-changed` window event is gone; the export events stay (header button → page that has the data).
- **Permissions**: `GET /auth/me` once per session (the app waits for it, so buttons don't flicker); per project the workspace's `allowed_actions` decide edit/approve/export buttons (this also covers archived projects). `USER_ROLES` / `ROLE_LABELS` stay as display names and for the user form only.
- **Lookups** are no longer loaded at login: `useLookups()` / `useUsers()` load them the first time a page needs them (the dashboard never does).
- **Backend**: `GET /screenings|assessments/project/:id` → `200 { data: null }`. Each SEMP table summary in `workflow` got a `status` (not_started | in_progress | completed) so the SEMP overview shows Tool 3/4 without loading the tables.
- **Removed endpoints** (no user left, `tests/removedEndpoints.test.js`): tool lists (`GET /screenings`, `/assessments`, `/monitoring`), single lookups, row writes of Tools 3–5 (incl. `PATCH /monitoring/:id/quarter/:q`), `POST /assessments/:id/methods|consultations`, `PATCH /assessments/:id/calculate`. GET-by-id reads are kept. Their tests moved to the bulk endpoints (gates, responsible, archive, immutable project). The phase-4 note on the monitoring row endpoints not checking the indicator is moot (removed; the bulk save checks it).
- **Kept in the frontend on purpose**: the live total-impact preview on the scoring page (`utils/impactCalculations.js`, for scores not saved yet; saved totals come from the backend) and required-field checks before a save (UX mirror, D36). The D36 required-field list in the workspace response is still not needed.
- **Tool 3/4 save** sends the whole table; every row must have its description (before, only new/changed rows were checked; the backend validates every row anyway). Read-only users get no auto-created empty row and no Save button.

## Found during phase

- The Tool 3–5 tables only offer the user picker for "Responsible"; an external party (`responsible_text`, D55) is kept on save but not shown or editable. UI for it belongs with the v2 UI work (phase 8).
- The assessment pages load the assessment in 4 requests (record + methods + consultations + scores). One aggregate read would cut that to 1 — not in scope here.
- `UsersManagementSection` still hard-codes which roles can be registered (hides `admin`) and password complexity rules — phase 6.
