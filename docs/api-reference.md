# API reference

REST API under **`/api/v1`**, one section per router (`backend/src/routes/*.routes.js`, mounted in
`routes/index.js`). Every route of the route table appears here: `backend/tests/docs.test.js`
fails when a mounted route is missing from this page.

## Conventions

- **Auth:** `Authorization: Bearer <JWT>` (from `POST /auth/login`). Every route except
  `POST /auth/login` needs a valid token of an active user with no pending forced password change —
  GETs and unknown paths included (401 / 403 before 404).
- **Permission** column: the `requirePermission(name)` of the route ([roles and permissions](roles-and-permissions.md)).
  "—" = any signed-in role, viewer included.
- **Access** column: the project-access check (D66 a, `middlewares/projectAccess.js`): `param:id`,
  `param:projectId`, `body:project`, `record:<Model>` (the record's project), `list` (adds the
  user's project filter). A denied check answers **404**.
- **Body:** JSON validated by Joi (`validate(schema)`: unknown keys stripped, defaults applied).
  Server-owned fields (`status`, `officer`, `approved_by`, `reject_by`, `reject_reason`,
  `recommendations`, totals, `is_active`) are never accepted in create/update bodies.
- **Responses:** `{ success: true, data }` (lists with `pagination` where noted);
  errors `{ success: false, error, code? }`. An unexpected server error answers 500
  `"Server Error"` (its message only in `development`). Mongoose CastError → 404, duplicate key → 409. A
  broken workflow rule → 409 ([workflow rules](workflow-rules.md)). A stale `version` → 409
  `code: "STALE_VERSION"`; a missing one → 400.
- **Free text** is at most 30,000 characters (D74 4).
- **Rate limits:** 1000 requests / 7 min per user (per IP without a valid token); login: 10 failed
  attempts / 15 min per IP.
- Outside `/api/v1`: `GET /health` (no auth) and, in production, the built frontend
  ([architecture](architecture.md#single-process)).

## Auth (`auth.routes.js`)

| Route | Permission | Notes |
|---|---|---|
| `POST /auth/login` | none (no token) | `{ email, password }` → `{ user, token }`. Wrong credentials 401; deactivated 403 "Account is deactivated" (only after a correct password). Login limiter. |
| `GET /auth/me` | — | `{ user (job_title populated, must_change_password), permissions, password_rules: { min_length }, upload_rules: { max_bytes, extensions, library_extensions } }`. Answers during a forced change. |
| `PUT /auth/password` | — | `{ current_password, new_password }` → same shape as `/auth/me`; clears `must_change_password`. Wrong current password or the same password → 400. Answers during a forced change. |

There is no register or logout endpoint (logout is client-side).

## Users (`users.routes.js`)

| Route | Permission | Notes |
|---|---|---|
| `GET /users` | — | Admin: every account incl. inactive (`job_title` populated). Others: active users only, `_id, name, job_title, is_active` (pickers). |
| `POST /users` | `manage_users` | `{ name, email, role, job_title? }` → `201 { user, temporary_password }` (12 characters, shown once; `must_change_password` set). Duplicate email → 409. Logged `user.create`. |
| `PUT /users/:id` | `manage_users` | `{ name?, role?, job_title? }` (at least one; email is fixed; `job_title: null` clears; unknown job title → 400). Logged `user.role_change` when the role changes. |
| `PATCH /users/:id/deactivate` | `manage_users` | The last active admin → 409. Logged. |
| `PATCH /users/:id/reactivate` | `manage_users` | Logged. |
| `POST /users/:id/reset-password` | `manage_users` | → `{ user, temporary_password }`, sets `must_change_password`. Logged `user.reset_password`. |

## Projects (`projects.routes.js`)

| Route | Permission | Access | Notes |
|---|---|---|---|
| `GET /projects` | — | list | Each project + `screening` / `assessment` summary (or null) + `workflow` + `allowed_actions`; `pagination: { page, limit, total, pages }`. Query: `archived` (default false; true = only archived), `search` (title/location), `status`, `category` (A–F), `sort` (`createdAt` default newest first, `updatedAt`, `title`, `start_date`), `page`, `limit` (≤ 100; **no limit = all**). Invalid → 400. |
| `GET /projects/:id` | — | param:id | The plain project (kept; the frontend uses the workspace). |
| `GET /projects/:id/workspace` | — | param:id | `{ project (archived_by populated), workflow, allowed_actions, screening, assessment, counts }`; works on archived projects. |
| `POST /projects` | `project.create` | — (exempt) | `{ title, location, start_date, end_date, project_component? }` → 201. End before start → 400. |
| `PUT /projects/:id` | `project.edit` | param:id | `{ version, …fields }` (`version` = the project's `updatedAt`). Archived → 409. |
| `DELETE /projects/:id` | `project.delete` | param:id | 204. Screening or assessment approved → 409. Deletes all data and files. Logged `project.delete`. |
| `PATCH /projects/:id/archive` | `project.archive` | param:id | Sets `archived`, `archived_by`, `archived_at`. Logged. |
| `PATCH /projects/:id/restore` | `project.restore` | param:id | Logged. |
| `DELETE /projects/:id/purge` | `project.purge` | param:id | 204. Admin; only an archived project (else 409); approved work included; the audit entry is written first and required. |
| `PUT /projects/:id/management` | `semp.edit` | param:id | Tool 3 bulk save `{ version, rows }` → `{ data: rows, version }` ([rules](workflow-rules.md#tools-3-4-5-bulk-saves-d32)). Needs the assessment approved. |
| `PUT /projects/:id/mitigation` | `semp.edit` | param:id | Tool 4 bulk save, same shape. |
| `PUT /projects/:id/monitoring` | `monitoring.edit` | param:id | Tool 5 `{ version, records }`, upsert by `indicator`. Needs Tools 3 and 4 complete. |
| `GET /projects/:id/files` | — | param:id | `?area=documents` (default) → files oldest first, `uploaded_by` populated. Area `semp_record` → 404 until v3 (D48). |
| `POST /projects/:id/files` | `files.edit` | param:id | Multipart: one `file` + `area` + `category` (documents: a project-workflow place key or `other`). PDF + Office only (extension **and** first bytes), ≤ `MAX_UPLOAD_MB` (413 when larger). → 201. Archived → 409. |

## Screenings (`screenings.routes.js`)

| Route | Permission | Access | Notes |
|---|---|---|---|
| `GET /screenings/:id` | — | record:Screening | |
| `GET /screenings/project/:projectId` | — | param:projectId | `200 { data: null }` when not started (D34). User refs populated with `job_title`; `status_history.by` populated. |
| `POST /screenings` | `screening.create` | body:project | `{ project, category_code (A–F), category_reason, potential_negative?, potential_positive?, screening_date? }` → 201. Second screening → 409. |
| `PUT /screenings/:id` | `screening.edit` | record:Screening | `{ version, …fields }`; only while `draft`/`rejected`; changing `project` → 400. |
| `PATCH /screenings/:id/submit` | `screening.submit` | record:Screening | `{ version }`; sets `officer`. |
| `PATCH /screenings/:id/approve` | `screening.approve` | record:Screening | `{ recommendations }` (required). |
| `PATCH /screenings/:id/reject` | `screening.reject` | record:Screening | `{ reject_reason? }`. |

## Assessments (`assessments.routes.js`)

| Route | Permission | Access | Notes |
|---|---|---|---|
| `GET /assessments/:id` | — | record:Assessment | |
| `GET /assessments/project/:projectId` | — | param:projectId | The assessment with `methods`, `consultations` and `scores` embedded (one request for Tool 2); `null` when not started. |
| `POST /assessments` | `assessment.create` | body:project | `{ project, project_activity?, description?, environmental_setting?, legal_requirements?, potential_negative_impact?, potential_positive_impact? }` → 201 with one `negligible` score per question. Needs the screening approved. |
| `PUT /assessments/:id` | `assessment.edit` | record:Assessment | `{ version, …fields }`; only while `draft`/`rejected`. |
| `PUT /assessments/:id/methods` | `assessment.edit` | record:Assessment | `{ version, methods: [{ method_type, details? }] }` replaces the list; answers the whole assessment. |
| `PUT /assessments/:id/consultations` | `assessment.edit` | record:Assessment | `{ version, consultations: [{ type, participants?, notes? }] }` replaces the list. |
| `POST /assessments/:id/scores` | `assessment.edit` | record:Assessment | `{ version, scores: [{ question, level, note? }] }` (≥ 1) upserts the questions sent; totals recalculated. |
| `PATCH /assessments/:id/submit` | `assessment.submit` | record:Assessment | `{ version }`; the four metadata fields and every score required (400). |
| `PATCH /assessments/:id/approve` | `assessment.approve` | record:Assessment | `{ recommendations }` (required). |
| `PATCH /assessments/:id/reject` | `assessment.reject` | record:Assessment | `{ reject_reason? }`. |

## Tables of Tools 3–5 (`management.routes.js`, `mitigation.routes.js`, `monitoring.routes.js`)

Reads only; the writes are the bulk saves under Projects.

| Route | Permission | Access | Notes |
|---|---|---|---|
| `GET /management/project/:projectId` | — | param:projectId | `{ data: rows, version }` (`[]` when empty, revision 0). `responsible` populated. |
| `GET /mitigation/project/:projectId` | — | param:projectId | Same shape. |
| `GET /monitoring/project/:projectId` | — | param:projectId | `{ data: records, version }`; `indicator` and `responsible` populated. |
| `GET /monitoring/:id` | — | record:MonitoringRecord | One record. |

## Project files (`files.routes.js`)

| Route | Permission | Access | Notes |
|---|---|---|---|
| `GET /files/:fileId/download` | — | record:ProjectFile | The bytes with the stored type, `Cache-Control: private, no-store`, `X-Content-Type-Options: nosniff`, and **no `Content-Disposition`** (download managers such as IDM hijack fetched responses that carry it; the app names the saved file from the record's `original_name`). |
| `DELETE /files/:fileId` | `files.edit` | record:ProjectFile | 204. Archived → 409. Logged `file.delete` (name, area, category, size, uploader, date). |
| `PATCH /files/:fileId` | `files.edit` | record:ProjectFile | `{ category }` — `semp_record` files only (404 until v3). |

## Lookups, dashboard, audit log

| Route | Permission | Access | Notes |
|---|---|---|---|
| `GET /lookups` | — | — | `{ impact_categories, impact_questions, indicators, job_titles, places, place_groups }` (the only lookup endpoint; places from `config/places.js`, D64 a). |
| `GET /dashboard` | — | list | `{ stats: { total_projects, by_status, high_risk (category A/B) }, latest_projects (5, newest update first) }`; archived left out. |
| `GET /audit-logs` | `read_audit_log` | — | Newest first; query `page`, `limit` (≤ 100, default 50), `action` (an action or a prefix such as `user.`), `from` / `to` (ISO, inclusive) → `{ data, pagination }`. Invalid → 400. No endpoint writes, edits or deletes entries. |

## Reference library (`library.routes.js`, D64 b)

Organisation guidance, not tied to a project (no access check).

| Route | Permission | Notes |
|---|---|---|
| `GET /library` | — | `?place=`, `?search=` (title/description); sorted by `order`, then title. |
| `GET /library/:id/file` | — | The PDF, same headers as project downloads (no `Content-Disposition`). |
| `POST /library` | `manage_library` | Multipart: one PDF `file` + `title` (≤ 200), `description` (≤ 2,000), `places` (`a,b` or the field repeated; unknown place → 400; v3 places accepted), `order`. → 201. |
| `PATCH /library/:id` | `manage_library` | `{ title?, description?, places?, order? }` (at least one). |
| `PUT /library/:id/file` | `manage_library` | New PDF; links and title kept; the old file is removed after the row points to the new one. Logged `library.replace_file`. |
| `DELETE /library/:id` | `manage_library` | Logged `library.delete`. |

## Removed endpoints

Removed on purpose (`tests/removedEndpoints.test.js`): `POST /auth/register`; the lists
`GET /screenings`, `/assessments`, `/monitoring`; `GET /lookups/<one>`; row writes
`POST/PUT/DELETE /management|mitigation[/:id]`, `POST/PUT /monitoring[/:id]`,
`PATCH /monitoring/:id/quarter/:q`; `POST /assessments/:id/methods|consultations`,
`PATCH /assessments/:id/calculate`, `GET /assessments/:id/methods|consultations|scores` (phase 8,
D63 c). No v3 module path is mounted (`tests/v3Locked.test.js`).
