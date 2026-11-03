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
- [ ] Dashboard loads in ≤ 2 API calls, project workspace in ≤ 3; no 404 noise in the console.
- [ ] No role list or workflow rule left in the frontend.
- [ ] All flows work in the browser; tests, lint, build pass.

## Out of scope
Visual changes (phase 8/10).

## Found during phase
