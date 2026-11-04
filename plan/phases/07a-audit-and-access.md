# Phase 7a — Critical-actions log & access seams

**Goal:** (1) critical actions record who did them; (2) two internal seams so v3 can change access control in one place. Users see nothing new except the admin's Activity log page.

**Decisions:** D65, D66 (+ D16 status history, D60 purge entry, D4 users are never deleted). The full activity log and per-project access are **v3**, not this phase ([V3_VISION.md](../V3_VISION.md)).

## Part 1 — Critical-actions log (D65)

### Model and helper
- Generalise `models/auditLog.model.js`. Nothing is migrated: dev data may be wiped.
  - `action` (enum), `by` (user ref) + `by_name` / `by_role` (copied), `project` (ref, nullable) + `project_title` (copied).
  - `target_type`, `target_id`, `target_label` (copied), `snapshot`, `details`, `createdAt`.
  - Indexes: `createdAt`, `(action, createdAt)`, `(project, createdAt)`.
- `services/audit.service.js` → `record(user, action, { project, target, snapshot, details })` is the only writer. Never store passwords, hashes, tokens or temporary passwords; a test scans entries for them.
- Write the entry right after the action succeeds (the purge entry stays before the delete, D60). If writing the entry fails, log the error on the server and still answer. Phase 11 adds a transaction.

### Actions (exactly these in v2)
| Action | Snapshot / details |
|---|---|
| `project.delete` | title, location, screening/assessment status, row counts, file count |
| `project.purge` | as today (D60) |
| `project.archive`, `project.restore` | — |
| `file.delete` | name, category, size, uploader, upload date |
| `management.rows_removed`, `mitigation.rows_removed` | written by the bulk save **only when it removes rows**: serial number + description of each removed row |
| `user.create` | name, email, role |
| `user.role_change` | old role → new role (only when the role changes; name/job title edits are not logged) |
| `user.deactivate`, `user.reactivate`, `user.reset_password` | the user's name and email (never the password) |

Phase 7b adds `library.delete` and `library.replace_file`.

### Reading
- `GET /audit-logs` (admin only, through `requirePermission('read_audit_log')`): newest first, pagination (`page`, `limit` ≤ 100), filter `action` (exact or prefix like `user.`), `from` / `to`. Invalid values → 400.
- **Settings → Activity log** (admin): a simple table with date, who, action (readable label), project, target. A row expands to show its snapshot. Action filter and pagination; loading, empty and error states; light and dark mode. Labels in one map (`utils/auditLabels.js`).
- No endpoint creates, edits or deletes entries. A route-table test fails if one appears.

## Part 2 — Access seams (D66), no visible change

### (a) One project-access check
- Add one backend module (e.g. `services/access.service.js`) with `assertProjectAccess(user, projectId)` for single-project routes and `projectFilterFor(user)` for lists (project list, dashboard). In v2 they allow every signed-in user (`{}` filter), so nothing changes for users.
- Route **every** project-scoped read and write through it:
  - project list, dashboard, workspace, project CRUD, archive/restore/delete/purge
  - screening and assessment (by project **and** by their own id: resolve the project first)
  - methods, consultations, scores
  - Tools 3–5 reads and bulk saves; management, mitigation and monitoring reads by id
  - project files (list, upload, and download/delete/patch by file id: resolve the project first)
- Test: a route-table test lists every mounted route and fails if a route under a project-scoped prefix doesn't pass through the check. A spy or flag test is fine. A second test stubs the check to deny and expects 404 (not 403, so the project's existence isn't revealed) from a sample of routes.

### (b) Permissions take the user
- `permissionsFor(user)` and `allowedActions(user, project, workflow)` take the user object; the role is read inside. Every caller is updated.
- New middleware `requirePermission(name)` reads the same map. Replace every `requireRole(...LIST)` on routes with the named permission (add permission names where one is missing, e.g. `screening.submit`, `semp.edit`, `files.edit`, `manage_users`). The role → permission map in `config/permissions.js` stays the only place where roles are listed. `requireRole` is removed, or kept only if something outside routes needs it.
- The `GET /auth/me` permissions output and behaviour stay the same: the existing role tests must pass unchanged. That is the proof that nothing moved.

## Tests
- Each action in the table: exactly one entry with the right action, `by`, project, target and snapshot. Failed requests (400/403/404/409) write none. A bulk save that removes no rows writes none.
- No secrets in any entry. Entries survive project delete/purge and user deactivation (copied names).
- `GET /audit-logs`: non-admin → 403; filters and pagination work; invalid query → 400.
- Seams: the route-table and deny-stub tests above; all existing role/permission tests pass unchanged.
- Frontend: Activity log page renders entries, expands a snapshot and sends filters; non-admin has no menu entry and is redirected.

## Done when
- [ ] Every action in the table is logged and visible in Settings → Activity log in the browser (admin), in light and dark mode.
- [ ] No route uses role lists directly; every project-scoped route goes through the access check; all old tests green.
- [ ] `CLAUDE.md` describes the log, `requirePermission`, the access check and the README rules.

## Out of scope
The full field-level log, project history for other roles, per-project membership, per-user capabilities (all v3). Logging sign-ins.

## Found during phase
