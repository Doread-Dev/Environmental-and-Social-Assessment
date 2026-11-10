# Workflow rules

The backend owns every business rule; the frontend only displays state and hides buttons for
convenience (DECISIONS context, D30). Code: [`services/workflow.service.js`](../backend/src/services/workflow.service.js),
[`utils/statusTransition.js`](../backend/src/utils/statusTransition.js),
[`utils/version.js`](../backend/src/utils/version.js), [`utils/transaction.js`](../backend/src/utils/transaction.js).

## The order

**Screening (Tool 1) → Assessment (Tool 2) → SEMP: Management activities (Tool 3) + Mitigation plan
(Tool 4) → Monitoring (Tool 5).** Plus project documents, the reference library and Settings.

Every create/update/delete of project data calls a gate; reads never do. **Every broken workflow
rule answers 409** (gate, lock, archived, duplicate):

| Write | Needs |
|---|---|
| Assessment and its children (methods, consultations, scores) | the screening **approved** (`requireScreeningApproved`) — any category A–F, E included |
| Tools 3 and 4 | the assessment **approved** (`requireAssessmentApproved`) |
| Tool 5 (monitoring) | Tools 3 and 4 complete: at least one row each, every row with its description (`requireSempComplete`) |
| Anything on an archived project | restore first (`assertProjectWritable`, called by all gates) |

Each project has at most one screening and one assessment (unique indexes; a second create → 409),
one score per (assessment, question) and one monitoring record per (project, indicator).

## Workflow state (D30–D32, D35)

`computeWorkflow()` is the one source of truth for a project's state; the gates use it too.

- **Per step** (`screening`, `assessment`, `semp`, `monitoring`): `locked | not_started |
  in_progress | submitted | approved | rejected | completed` (a screening/assessment `draft` shows
  as `in_progress`).
- **Overall** `status`: `draft | in_progress | needs_action | monitoring | completed`;
  `current_step`; `percent_complete` (approved/completed = 1 step, in_progress/submitted/rejected =
  ½, out of 4); `next_action` (`step`, `tool`, `route` = a frontend `ROUTES` key, `label`,
  `description`).
- **SEMP:** `management_activities` / `mitigation_plans` `{ count, described, status:
  not_started|in_progress|completed }`.
- **Monitoring:** `records`, `complete_records`, `quarters_filled`; in progress once it has any
  record (a baseline alone included), completed once one record has all four quarters.
- `loadWorkflowInputs(ids)` loads many projects in 5 queries — never loop per project.
- `allowedActions(user, project, workflow)`: see [roles and permissions](roles-and-permissions.md#per-project-allowed_actions).

## Screening and assessment statuses

`draft | submitted | approved | rejected`, changed **only** through
`PATCH /<screenings|assessments>/:id/submit|approve|reject`:

| Transition | Who | Effect |
|---|---|---|
| `draft`/`rejected` → `submitted` | editors (body `{ version }`) | sets `officer` |
| `submitted` → `approved` | specialists | sets `approved_by` and `recommendations` (required, trimmed; blank → 400 "Recommendations are required to approve", D74 5) |
| `submitted` → `rejected` | specialists | sets `reject_by` and `reject_reason` |
| anything else | | 409 |

A specialist may approve their own work. `status` in a create/PUT body is ignored. Each create and
transition appends `{ status: created|submitted|approved|rejected, by, at, note? }` to
`status_history` (note = reject reason), returned with `by` populated (`name`, `role`).

- **Locking:** screening/assessment PUT and assessment methods/consultations/scores/calculate only
  while `draft` or `rejected` (`assertEditable`); `submitted`/`approved` → 409. No reopen. SEMP,
  monitoring and project metadata stay editable unless the project is archived.
- **Assessment create** copies nothing (D69): inputs start empty; it creates one `negligible` score
  per `ImpactQuestion` (D54). Every metadata field may be empty on create and on a draft PUT; submit
  requires project activity, description, environmental setting and legal requirements (D74 2)
  → 400 naming the missing ones ("Fill in Environmental setting and Legal requirements before
  submitting"), and every question scored.
- **Scores:** `POST /assessments/:id/scores` upserts only the questions sent (duplicate or unknown
  question → 400). `total_project_score` (counts per level) and `total_project_impact` (highest
  level: high > medium > low > negligible > not_applicable, D68) are recalculated on every score
  change. Methods and consultations are replaced as whole lists.
- **Updates keep the project:** `assertSameProject` refuses a changed `project` (400).

Impact levels everywhere: `negligible | low | medium | high | not_applicable`. Screening category
codes `A`–`F`.

## Tools 3, 4, 5: bulk saves (D32)

The only writes of Tools 3–5:

- `PUT /projects/:id/management` and `/mitigation` with `{ version, rows }` replace the whole table:
  a row with `_id` updates that row (fields not sent keep their value), a row without one is
  created, rows left out are deleted, a row without `serial_number` gets its position.
- `PUT /projects/:id/monitoring` with `{ version, records }` upserts by `indicator` (must exist,
  once per payload); records not sent stay.
- Every row is checked first (Joi, responsible rule, ids of this project, model validation →
  400 `Row n: …` / `Record n: …`) and nothing is written on error; then one `bulkWrite`.
- **Responsible** (D55): `responsible` (user id) **or** `responsible_text` (external party), never
  both (400); setting one clears the other (`utils/responsible.js`).
- Monitoring quarter values and `total` are free text, never parsed (D57).
- Rows a save deletes are logged as `management.rows_removed` / `mitigation.rows_removed`.

## Stale saves (D62, D73)

Every write of project data carries `version`, the version the client loaded:

- missing → 400 (`validators/version.validator.js`);
- stale → **409** `{ error: "Someone else changed this since you opened it. Reload to see the latest version.", code: "STALE_VERSION" }`, nothing written.
- Project PUT, screening PUT and submit, assessment PUT, methods, consultations, scores and submit:
  the record's `updatedAt` (ISO); checked first (before locks and gates), then again in one
  conditional update (`updateIfCurrent`) that moves `updatedAt` on by at least 1 ms. Approve/reject
  take no version (the record is locked while submitted) but move it on.
- Tools 3, 4, 5: a revision per project and table (`TableRevision`, 0 before the first save), sent
  as `version` next to `data` by the table GETs and bulk saves; `withRevision` checks and raises it
  in one conditional update after the rows are validated and before they are written (a failed
  write gives it back).

In the app, `useProjectSave` shows one dialog: **Reload** (refetch, the other person's changes
appear) or **Keep editing** (input kept). Nothing is merged.

## Projects: archive, delete, purge (D17, D60)

- `PATCH /projects/:id/archive|restore` (specialists) sets `archived` + `archived_by` /
  `archived_at`. Archived projects are hidden from `GET /projects` (`?archived=true` lists only
  them), still readable by id, and every write on them → 409.
- `DELETE /projects/:id` → 409 when the screening or the assessment is approved (archive instead);
  otherwise the project is deleted with all its data and files.
- `DELETE /projects/:id/purge` (**admin only**) permanently deletes an **archived** project,
  approved work included (not archived → 409), after writing its audit entry.
- **Dates (D74 1):** an end date before the start date → 400 "End date cannot be before the start
  date" (create and update; an update with one date compares it with the stored one); a one-day
  project is allowed.

## Limits (D57, D74 4)

No minimum-length rules anywhere (D57). Every free-text field (project, screening, assessment and
its methods, consultations and score notes, Tools 3/4 rows, monitoring values, approve
recommendations, reject reasons) is at most **30,000 characters** (`text()` in
`validators/text.validator.js` → 400 "… is too long (at most 30,000 characters)"); shorter limits
stay (library title 200, description 2,000).

## Critical-actions log (D65)

`services/audit.service.js` → `record(user, action, { project, target, snapshot, details })` is the
only writer. Logged, exactly: `project.delete`, `project.purge`, `project.archive`,
`project.restore`, `file.delete`, `library.replace_file`, `library.delete`,
`management.rows_removed`, `mitigation.rows_removed`, `user.create`, `user.role_change` (only when
the role changes), `user.deactivate`, `user.reactivate`, `user.reset_password`. Not logged:
creates, edits, submit/approve/reject (those are in `status_history`), uploads (`uploaded_by`),
sign-ins, CLI scripts. Keys matching password/token/hash/secret are dropped. Entries are
append-only and survive project deletion and user deactivation. Read by admins only
(`GET /audit-logs`, Settings → Activity log). A phase that adds a critical action logs it here and
tests the entry.

## Transactions (phase 11)

`atomic(fn)` runs `fn` in one MongoDB transaction when the server is a replica set (asked once per
client), else as it is (standalone: local development, the standalone CI job). Mongoose attaches
the session to every query inside, so services pass no `session`. Inside a transaction
`audit.record()` throws on a failed write (the action is rolled back) and `withRevision` leaves the
claimed revision to the abort. Wrapped: every critical action with its entry and the Tools 3–5 bulk
saves (rows + revision + `rows_removed` entry). Files on disk are written before and removed after
the transaction. A new critical action or bulk write goes through `atomic()`. On a standalone
MongoDB a failed audit write is logged with `console.error` and the request still answers; the
purge entry is written first and is required in both cases.
