# Phase 7a — Activity log

**Goal:** every write in the app leaves a readable record of who did what, when, and what changed. Built once as a shared mechanism, applied to every write that exists today, and required from every later phase.

**Decisions:** D65 (+ D16 status history stays, D60 purge entry, D4 users are never deleted).

**Why now:** the owner found that deleting a file records nobody. It is the same for every other write except the purge. In an E&S due-diligence system, accountability for changes is part of the product.

## Backend

### Model
Generalise `models/auditLog.model.js`. Nothing is migrated: the only existing action is `project.purge`, and dev data may be wiped.
- `action` (enum, `<domain>.<verb>`), `by` (user ref), `by_name` / `by_role` (copied, so the entry still reads right after the user is renamed or deactivated).
- `project` (ref, nullable) + `project_title` (copied).
- `target_type`, `target_id`, `target_label` (copied).
- `changes`: `[{ field, from, to }]` for updates.
- `rows`: `{ added: [...], changed: [{ label, changes }], removed: [...] }` for bulk saves.
- `snapshot` for deletes.
- `details` for anything else (e.g. purge counts, reject reason).
- `createdAt` only.
- Indexes: `createdAt`, `(project, createdAt)`, `(by, createdAt)`, `(action, createdAt)`.
- Values longer than ~500 characters are shortened with an ellipsis. Never stored: `password`, `password_hash`, any token, temporary passwords, file bytes. A test checks this.

### Shared helper
`services/audit.service.js`:
- `record(user, action, { project, target, changes, rows, snapshot, details })`: the only writer.
- `diffFields(before, after, fields)`: changed fields only.
- `diffRows(beforeRows, afterRows, labelOf)`: for the bulk saves.

Services call it right after a successful write. If writing the entry itself fails, log the error to the server console and still answer the write. Phase 11 puts the write and its entry in one transaction. The purge entry stays **before** the delete (D60).

### Actions to cover (every write route that exists after phase 7)
| Area | Actions |
|---|---|
| Auth | `auth.login`, `auth.login_failed` (email tried, no user id when unknown), `auth.password_change` |
| Users | `user.create`, `user.update` (fields), `user.deactivate`, `user.reactivate`, `user.reset_password` (never the password) |
| Project | `project.create`, `project.update` (fields), `project.archive`, `project.restore`, `project.delete` (snapshot: title, statuses, row counts, file count), `project.purge` (as today) |
| Screening | `screening.create`, `screening.update` (fields), `screening.submit`, `screening.approve`, `screening.reject` (reason) |
| Assessment | `assessment.create`, `assessment.update` (fields), `assessment.methods`, `assessment.consultations` (list before/after), `assessment.scores` (question → old/new level), `assessment.submit`, `assessment.approve`, `assessment.reject` |
| SEMP | `management.save`, `mitigation.save` (rows added/changed/removed with their descriptions) |
| Monitoring | `monitoring.save` (records added/changed per indicator, quarters before/after) |
| Files | `file.upload`, `file.delete` (snapshot: name, category, size, uploader), `file.update` |

`login` is not behind `auth`, so log it in the auth service. Log failed sign-ins per attempt; the login limiter already caps them.

### Read endpoints
- `GET /projects/:id/history`: every role (the same roles that can read the project). The project's entries, newest first, paginated (`page`, `limit` ≤ 100). Works on archived projects. For a purged project, the entries remain readable in the admin log.
- `GET /audit-logs`: `admin` only, as today, plus filters `user`, `project`, `action` (prefix allowed, e.g. `screening.`), `from`, `to`, and pagination. Invalid values → 400.
- No endpoint creates, edits or deletes entries. A route-table test fails if one appears.

## Frontend
- **Project history:** a "History" entry on the project overview opens a panel or page. It shows a readable list: "Sara (Environmental Specialist) approved the screening — 4 Nov 2026, 10:12". Each entry expands to show what changed (field: old → new; rows added/changed/removed). Every role sees it.
- **Settings → Activity log** (admin, `read_audit_log`): table with filters (user, project, action group, dates) and pagination; each entry expands like above.
- Field and action labels live in one map (`utils/activityLabels.js`), so new actions only add a line there.
- Both work in light and dark mode. Empty state and loading/error states are included.

## Rule for every later phase (added to README "Rules for every phase")
Every new or changed write calls `audit.record` with the right action and data, adds its label to `activityLabels.js`, and ships with a test that checks the entry: action, by, project, changes. A phase file lists the actions it adds.

## Tests
- For each route in the table above: exactly one entry with the right action, `by`, project and target. For updates, only the changed fields, with old and new values. For bulk saves, correct added/changed/removed. For deletes, a snapshot.
- Failed requests (400/403/404/409) write no entry. Exception: `auth.login_failed`.
- No password, hash, token or temporary password in any entry (scan every entry written by the user tests).
- Entries survive project delete and purge, and user deactivation (copied name shown).
- `GET /projects/:id/history`: every role can read; another project's entries are not included. `GET /audit-logs`: non-admin → 403; filters and pagination work.
- Frontend: history list renders entries and their changes; the admin log filters call the API with the right query; viewer sees history and has no admin log.
- Update `scripts/seed-demo-project.js` if needed, so the demo project has a realistic history.

## Done when
- [ ] Every write route listed above records its entry (route-by-route test).
- [ ] Project history and the admin Activity log work in the browser for each role, in light and dark mode.
- [ ] README rule added; `CLAUDE.md` describes the log, its endpoints and the rule.

## Out of scope
Undo/restore from the log, exporting the log (decide in phase 10 if wanted), retention limits (entries are kept forever).

## Found during phase
