# Phase 4 — Workflow state & aggregate API

**Goal:** the backend computes project state and serves whole screens in one call. New endpoints are **added** here; the frontend switches to them in phase 5, then old endpoints nobody uses are removed.

**Decisions:** D30, D31, D32, D35, D36.

## Tasks

### Workflow state (D30)
- One function `getProjectWorkflow(project)` → per tool: status (`locked | not_started | in_progress | submitted | approved | rejected | completed`), `current_step`, `percent_complete`, `next_action` (label + target route key), SEMP completeness (Tools 3 & 4 rule from phase 3), monitoring quarters filled.
- Same function used by the gates of phase 3 (one source of truth).
- Port the rules from `frontend/src/utils/workflowDerivation.js` and `hooks/useWorkflow.js` — then that logic is deleted in phase 5.

### Allowed actions (D35)
- `GET /auth/me` returns the user + `permissions` (e.g. `manage_users`, `export`, `delete_project`, `archive_project`).
- Every project-scoped response includes `allowed_actions` for the current user (e.g. `screening.edit`, `screening.submit`, `screening.approve`, `assessment.edit`, `semp.edit`, `monitoring.edit`, `project.delete`, `project.archive`, `export`). Computed from role + workflow state + lock state. Viewers: no `export` (D28a).

### Aggregate endpoints (D31)
- `GET /dashboard` — stats + latest projects each with workflow state (replaces the N+1 in `useProjects`).
- `GET /projects` — list with workflow state per project (paginated, filter, `archived`).
- `GET /projects/:id/workspace` — project + workflow + allowed actions + screening + assessment summary + counts (one call for layout, sidebar, guards, overview).
- `GET /lookups` — all four lookup collections in one response.

### Bulk saves (D32)
- `PUT /projects/:id/management` and `/mitigation` — replace/upsert the whole table in one request (ids kept for existing rows).
- `PUT /projects/:id/monitoring` — upsert all records in one request. Values stay free text (D19).
- Validation once for the whole payload; all-or-nothing (transaction if the deployment supports it, otherwise validate fully before writing).

### Validation rules (D36)
- Keep rules in backend validators only; expose nothing extra unless the frontend needs it (e.g. required field list per form via the workspace response — optional, decide in phase).

## Tests
- Workflow state for: empty project, screening draft, approved screening, each later stage, rejected states, category E, archived.
- Allowed actions per role × state (table-driven).
- Dashboard/workspace/lookups shapes; query count stays bounded (no per-project loops).
- Bulk saves: create, update, delete rows in one call; invalid row → nothing written.

## Done when
- [ ] New endpoints tested and documented in `CLAUDE.md`.
- [ ] Existing frontend still works unchanged (additive phase).

## Out of scope
Frontend migration (phase 5), `200 {data:null}` switch (phase 5, done together with the hooks).

## Found during phase
