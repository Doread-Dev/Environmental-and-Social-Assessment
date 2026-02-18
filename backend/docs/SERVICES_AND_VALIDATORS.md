# Services and Validators

This document describes the backend service layer and Joi validators for the ESMS API. Services hold business logic and persistence; validators enforce request payload shape before controllers invoke services. An LLM or maintainer can use this document to reason about inputs, outputs, and error behaviour without reading every service or validator file.

---

## Overview

The backend divides server-side behaviour into: **routes** (HTTP method and path, middleware order), **controllers** (request/response, call services), **services** (business logic, model access), and **validators** (Joi schemas applied to `req.body` by the validate middleware). Services live in `backend/src/services/`; validators in `backend/src/validators/`. Controllers never call models directly; they call services. Validation runs after auth/role middlewares and before the controller, and only on the request body (not params or query). Terminology follows the project: project, screening, assessment, monitoring, management activity, mitigation plan, SEMP (objectives, targets, actions), lookups, attachments, reports. See [ARCHITECTURE.md](ARCHITECTURE.md) for request flow and [API_REFERENCE.md](API_REFERENCE.md) for endpoints.

**Constraints**

- Services are the only layer that perform Mongoose operations or throw `ApiError`. Controllers pass service errors to `next(err)` (often via `asyncHandler`).
- Validators run only against `req.body`. Path params (e.g. `id`, `projectId`, `q`) and query strings are not validated by Joi in the current codebase; services may validate or use them as-is.

---

## Service Layer

The service layer sits between controllers and models. Each domain (auth, user, project, screening, assessment, monitoring, mitigation, management, SEMP, report, lookup, attachment) has one service module. Controllers receive `req`/`res`, extract body/params/query, call one or more service functions, then send JSON. Services are stateless; they receive plain objects or IDs and return documents (or plain objects), or throw `ApiError` with status code and message. No service sends HTTP responses or accesses `req`/`res`. Shared error handling is via `utils/ApiError` (status code + message); the global error handler in `middlewares/errorHandler.js` turns thrown errors into JSON responses.

**Data flow**

1. Request hits route → auth/role (if any) → validate(schema) on `req.body` → controller.
2. Controller calls e.g. `service.createProject(req.body)` or `service.getScreening(req.params.id)`.
3. Service uses models (e.g. `Project.create(payload)`), returns result or throws `ApiError`.
4. Controller sends `res.status(...).json({ success: true, data })` or passes error to `next(err)`.

**Constraints**

- Every domain route that mutates or creates data goes through a service. Read-only lookup and report endpoints also use services (e.g. `lookup.service`, `report.service`).
- Services do not call other services in the current codebase except implicitly via model relationships (e.g. project delete cascades implemented inside `project.service`).

---

## Service Map


| Domain     | Service module                           | Exported functions                                                                                                                                                                                                                                                                              |
| ---------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth       | `services/auth.service.js`               | `register`, `login`                                                                                                                                                                                                                                                                             |
| User       | `services/user.service.js`               | `listUsers`                                                                                                                                                                                                                                                                                     |
| Project    | `services/project.service.js`            | `listProjects`, `getProject`, `createProject`, `updateProject`, `deleteProject`                                                                                                                                                                                                                 |
| Screening  | `services/screening.service.js`          | `listScreenings`, `getScreening`, `getByProject`, `createScreening`, `updateScreening`, `setStatus`, `approveScreening`, `rejectScreening`                                                                                                                                                      |
| Assessment | `services/assessment.service.js`         | `listAssessments`, `getAssessment`, `getByProject`, `createAssessment`, `updateAssessment`, `addMethod`, `addConsultation`, `addScores`, `calculateImpact`, `approveAssessment`, `rejectAssessment`, `listMethods`, `replaceMethods`, `listConsultations`, `replaceConsultations`, `listScores` |
| Monitoring | `services/monitoring.service.js`         | `listMonitoring`, `getMonitoringRecord`, `getByProject`, `createRecord`, `updateRecord`, `updateQuarter`                                                                                                                                                                                        |
| Mitigation | `services/mitigationPlan.service.js`     | `listByProject`, `createPlan`, `updatePlan`, `deletePlan`                                                                                                                                                                                                                                       |
| Management | `services/managementActivity.service.js` | `listByProject`, `createActivity`, `updateActivity`, `deleteActivity`                                                                                                                                                                                                                           |
| SEMP       | `services/semp.service.js`               | `listPlan`, `createObjective`, `updateObjective`, `createTarget`, `updateTarget`, `createAction`, `updateAction`                                                                                                                                                                                |
| Report     | `services/report.service.js`             | `getDashboardStats`, `exportReport`                                                                                                                                                                                                                                                             |
| Lookup     | `services/lookup.service.js`             | `getImpactCategories`, `getImpactQuestions`, `getIndicators`, `getJobTitles`                                                                                                                                                                                                                    |
| Attachment | `services/attachment.service.js`         | `createAttachment`, `getAttachment`                                                                                                                                                                                                                                                             |


---

## Auth Service

**File:** `backend/src/services/auth.service.js`

Auth handles registration and login. It uses `User` and `ApiError`; JWT is signed with `JWT_SECRET` and optional `JWT_EXPIRES_IN` (default `"12h"`).

- `**register(payload)`**  
  - **Payload:** `{ name, email, password, job_title?, role? }`. Email is compared lowercased.  
  - **Returns:** `{ user, token }` where `user` is the created Mongoose document, `token` is a JWT with `{ sub: user._id, role: user.role }`.  
  - **Throws:** `ApiError(400, "Email already in use")` if email exists.
- `**login(email, password)`**  
  - **Returns:** `{ user, token }` with the same token shape.  
  - **Throws:** `ApiError(401, "Invalid credentials")` if user not found or password does not match.

**Constraints**

- Passwords are hashed by the User model (e.g. pre-save hook); the service does not hash. Token is created only after successful register or login.

---

## User Service

**File:** `backend/src/services/user.service.js`

User service is read-only: list all users.

- `**listUsers()`**  
  - **Returns:** Array of User documents sorted by `createdAt` descending.

**Constraints**

- No create/update/delete in this service; no validation of params.

---

## Project Service

**File:** `backend/src/services/project.service.js`

Project service provides CRUD and cascade delete. It uses Project, Screening, Assessment, AssessmentMethod, CommunityConsultation, AssessmentImpactScore, ManagementActivity, MitigationPlan, MonitoringRecord, SempObjective, SempTarget, SempAction, Attachment, and a private helper `deleteFile(filePath)` for filesystem cleanup.

- `**listProjects()`** — Returns all projects sorted by `createdAt` descending.
- `**getProject(id)**` — Returns project or throws `ApiError(404, "Project not found")`.
- `**createProject(payload)**` — Creates project from payload; returns created document.
- `**updateProject(id, payload)**` — Updates by id with `runValidators: true`; returns updated document or throws 404.
- `**deleteProject(id)**` — Deletes project and all dependent data in order: assessment sub-entities (methods, consultations, impact scores), assessments, SEMP (actions → targets → objectives), screenings, management activities, mitigation plans, monitoring records; then deletes attachment records and their files (project, screening, assessment, monitoring entity types); then deletes the project. Returns `true` on success. Throws 404 if project not found.

**Constraints**

- Cascade order is fixed: assessments and their children, then SEMP hierarchy, then screenings/monitoring/management/mitigation, then attachments (DB + files), then project. `deleteFile` ignores ENOENT.

---

## Screening Service

**File:** `backend/src/services/screening.service.js`

Screening service manages screening documents and approval/rejection. All list/get/create/update responses populate `project`, `approved_by`, `reject_by`, `officer` (with `job_title` for user refs).

- `**listScreenings()`** — Returns all screenings with populate as above.
- `**getScreening(id)**` — One by id; throws `ApiError(404, "Screening not found")` if missing.
- `**getByProject(projectId)**` — One screening by project; throws 404 if not found.
- `**createScreening(payload, createdBy)**` — Creates screening; if `createdBy` (user id) provided, sets `officer`. Returns created document with populate.
- `**updateScreening(id, payload, updatedBy)**` — Updates by id. If `updatedBy` provided and (`payload.status === "submitted"` or `!screening.officer`), sets `officer` to `updatedBy`. Returns updated with populate or 404.
- `**setStatus(id, status, approvedBy, recommendations?, rejectReason?)**` — Sets status; if `approved` sets `approved_by` and optional `recommendations`; if `rejected` sets `reject_by` and `reject_reason` (default ""). Returns updated with populate or 404.
- `**approveScreening(id, approvedBy, recommendations)**` — Calls `setStatus(id, "approved", ...)`.
- `**rejectScreening(id, rejectBy, rejectReason?)**` — Calls `setStatus(id, "rejected", ...)`.

**Constraints**

- Status values used in logic: `draft`, `submitted`, `approved`, `rejected`. Officer is set on create or when submitting or when missing.

---

## Assessment Service

**File:** `backend/src/services/assessment.service.js`

Assessment service manages assessments and sub-entities: methods, community consultations, impact scores. It uses Assessment, AssessmentMethod, CommunityConsultation, AssessmentImpactScore. List/get/create/update use a shared `populateAssessment(query)` (project, officer, approved_by, reject_by with job_title).

- `**listAssessments()`** — All assessments, populated, sorted by `createdAt` desc.
- `**getAssessment(id)**` — One by id; throws 404 if not found.
- `**getByProject(projectId)**` — One by project; throws 404 if not found.
- `**createAssessment(payload, createdBy)**` — Creates; if `createdBy` provided sets `officer`. Returns created with populate.
- `**updateAssessment(id, payload, updatedBy)**` — Same officer rule as screening: if `updatedBy` and (`payload.status === "submitted"` or no officer), sets `officer`. Returns updated with populate or 404.
- `**addMethod(assessmentId, payload)**` — Ensures assessment exists; creates AssessmentMethod linked to assessment.
- `**addConsultation(assessmentId, payload)**` — Same for CommunityConsultation.
- `**addScores(assessmentId, scoresPayload)**` — Replaces all AssessmentImpactScore for that assessment with the given array; each item gets `assessment: assessmentId`.
- `**calculateImpact(assessmentId)**` — Counts scores by `level` (negligible, low, medium, high, not_applicable). Sets `total_project_score` (counts) and `total_project_impact` (single level) on assessment; priority: high > medium > low > negligible > not_applicable. Throws 400 if no scores. Returns assessment with populate.
- `**setStatus(id, status, approvedBy, recommendations?, rejectReason?)**` — Same pattern as screening (approved_by/recommendations or reject_by/reject_reason).
- `**approveAssessment(id, approvedBy, recommendations)**` / `**rejectAssessment(id, rejectBy, rejectReason?)**` — Delegate to setStatus.
- `**listMethods(assessmentId)**`, `**replaceMethods(assessmentId, payload)**` — List or replace-all AssessmentMethod for assessment.
- `**listConsultations(assessmentId)**`, `**replaceConsultations(assessmentId, payload)**` — Same for CommunityConsultation.
- `**listScores(assessmentId)**` — List AssessmentImpactScore for assessment.

**Constraints**

- Impact level enum: `negligible`, `low`, `medium`, `high`, `not_applicable`. Replace methods/consultations delete existing then insert; replace with empty array yields empty list.

---

## Monitoring Service

**File:** `backend/src/services/monitoring.service.js`

Monitoring service manages monitoring records and per-quarter score updates.

- `**listMonitoring()`** — All records, populated `project`, `indicator`, `responsible`, sorted by `createdAt` desc.
- `**getMonitoringRecord(id)**` — One by id; throws 404 if not found.
- `**getByProject(projectId)**` — All records for project, populated.
- `**createRecord(payload)**` — Creates record; populates before return.
- `**updateRecord(id, payload)**` — Update by id; returns populated or 404.
- `**updateQuarter(id, quarterKey, value)**` — Loads record; validates `quarterKey` in `["baseline", "Q1", "Q2", "Q3", "Q4"]` (throws 400 if invalid). Sets `record.scores[quarterKey] = value` (value is string). Saves and returns populated record.

**Constraints**

- Quarter keys are fixed. Scores object is not auto-totaled; total can be sent from client. All return values are populated for project, indicator, responsible.

---

## Mitigation Plan Service

**File:** `backend/src/services/mitigationPlan.service.js`

- `**listByProject(projectId)`** — Mitigation plans for project, populated project and responsible, sorted by `serial_number` and `createdAt`.
- `**createPlan(payload)**` — Creates one plan.
- `**updatePlan(id, payload)**` — Update by id; returns updated or `ApiError(404, "Mitigation plan item not found")`.
- `**deletePlan(id)**` — Delete by id; returns `true` or 404.

---

## Management Activity Service

**File:** `backend/src/services/managementActivity.service.js`

- `**listByProject(projectId)`** — Management activities for project, populated project and responsible, sorted by `serial_number` and `createdAt`.
- `**createActivity(payload)**` — Creates one activity.
- `**updateActivity(id, payload)**` — Update by id; returns updated or 404 ("Management activity not found").
- `**deleteActivity(id)**` — Delete by id; returns `true` or 404.

---

## SEMP Service

**File:** `backend/src/services/semp.service.js`

SEMP is a three-level hierarchy: SempObjective (per project), SempTarget (per objective), SempAction (per target).

- `**listPlan(projectId)`** — Returns `{ objectives, targets, actions }` (plain arrays from `.lean()`), all for the project (targets/actions filtered by objective/target ids).
- `**createObjective(payload)**` / `**updateObjective(id, payload)**` — Create or update objective; update throws 404 "Objective not found" if missing.
- `**createTarget(payload)**` / `**updateTarget(id, payload)**` — Same for target; 404 "Target not found".
- `**createAction(payload)**` / `**updateAction(id, payload)**` — Same for action; 404 "Action not found".

**Constraints**

- No delete operations in this service. Hierarchy is project → objectives → targets → actions.

---

## Report Service

**File:** `backend/src/services/report.service.js`

Report service provides dashboard stats and export (CSV, Excel, PDF). Uses ExcelJS, PDFDocument, and models: Project, Screening, Assessment, MonitoringRecord, ManagementActivity, MitigationPlan.

- `**getDashboardStats()`** — Returns object: `totalProjects`, `screening: { byStatus, byCategory }`, `assessments: { byStatus }`, `monitoring: { total }`, `management: { total }`, `mitigation: { total }`. Counts/aggregations by status or category as applicable.
- `**exportReport({ type, projectId, format })**` — `type`: `"projects"` or `"monitoring"`; `projectId` optional (used for monitoring filter); `format`: `"csv"` | `"excel"` | `"pdf"`. Returns `{ filename, content, contentType }`. Content is string (CSV), buffer (Excel/PDF). Throws if type or format unsupported.

**Constraints**

- Supported types: `projects`, `monitoring`. Supported formats: `csv`, `excel`, `pdf`. Build logic for rows is in `buildRows`; CSV escaping and Excel/PDF generation are internal helpers.

---

## Lookup Service

**File:** `backend/src/services/lookup.service.js`

Read-only lookups for impact categories, impact questions, indicators, job titles.

- `**getImpactCategories()`** — ImpactCategory, sorted by `code`.
- `**getImpactQuestions()**` — ImpactQuestion with `category` populated, sorted by `createdAt` desc.
- `**getIndicators()**` — Indicator with `category` populated, sorted by `createdAt` desc.
- `**getJobTitles()**` — JobTitle, sorted by `title_name`.

---

## Attachment Service

**File:** `backend/src/services/attachment.service.js`

- `**createAttachment(payload)`** — Creates attachment document; returns created document.
- `**getAttachment(id)**` — By id with `uploaded_by` populated; throws `ApiError(404, "Attachment not found")` if missing.

**Constraints**

- File upload and filesystem path are handled elsewhere (e.g. upload middleware + controller); this service only persists and retrieves attachment metadata.

---

## Validators (Joi)

Validators are Joi schemas used by the `validate` middleware in `backend/src/middlewares/validate.js`. The middleware calls `schema.validate(req.body, { abortEarly: false, stripUnknown: true })`. On failure it responds with 400 and joined validation messages; on success it calls `next()` and does not modify `req`. Only `req.body` is validated; no route in the codebase validates `req.params` or `req.query` with Joi. Schemas are one per domain (and per operation where needed); each is exported from the corresponding file under `validators/`.

**Constraints**

- Validation runs after auth/role when present. Joi does not coerce or default in the documented schemas unless stated; stripUnknown removes keys not defined in the schema.

---

## Validator Map


| Domain     | Validator file                               | Schemas                                                                                                                                                                                                    | Used on routes                                                         |
| ---------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Auth       | `validators/auth.validator.js`               | registerSchema, loginSchema                                                                                                                                                                                | POST /auth/register, POST /auth/login                                  |
| Project    | `validators/project.validator.js`            | createProjectSchema, updateProjectSchema                                                                                                                                                                   | POST /projects, PUT /projects/:id                                      |
| Screening  | `validators/screening.validator.js`          | createScreeningSchema, updateScreeningSchema, approveScreeningSchema, rejectScreeningSchema                                                                                                                | POST, PUT screenings; approve/reject                                   |
| Assessment | `validators/assessment.validator.js`         | createAssessmentSchema, updateAssessmentSchema, addMethodSchema, replaceMethodsSchema, addConsultationSchema, replaceConsultationsSchema, addScoresSchema, approveAssessmentSchema, rejectAssessmentSchema | Create/update assessment; methods/consultations/scores; approve/reject |
| Monitoring | `validators/monitoring.validator.js`         | createMonitoringSchema, updateMonitoringSchema, updateQuarterSchema                                                                                                                                        | POST/PUT monitoring; PATCH :id/quarter/:q (body only)                  |
| Mitigation | `validators/mitigationPlan.validator.js`     | createMitigationPlanSchema, updateMitigationPlanSchema                                                                                                                                                     | POST, PUT mitigation                                                   |
| Management | `validators/managementActivity.validator.js` | createManagementActivitySchema, updateManagementActivitySchema                                                                                                                                             | POST, PUT management                                                   |
| SEMP       | `validators/semp.validator.js`               | createObjectiveSchema, updateObjectiveSchema, createTargetSchema, updateTargetSchema, createActionSchema, updateActionSchema                                                                               | SEMP objective/target/action create and update                         |
| Attachment | `validators/attachment.validator.js`         | createAttachmentSchema                                                                                                                                                                                     | POST attachments                                                       |


User, lookup, and report domains have no body validators (list/get/query only or file upload with multipart).

---

## Auth Validator

**File:** `backend/src/validators/auth.validator.js`

- **registerSchema:** name (string required), email (email required), password (string min 6 required), job_title (string optional), role (enum: environmental_specialist, program_manager, project_manager, environmental_focal_point, viewer, optional).
- **loginSchema:** email (email required), password (string required, no min).

---

## Project Validator

**File:** `backend/src/validators/project.validator.js`

- **createProjectSchema:** title (string trim required), location (string trim required), start_date (date required), end_date (date required), project_component (string trim optional).
- **updateProjectSchema:** Same keys as create but title, location, start_date, end_date are optional (fork of create).

---

## Screening Validator

**File:** `backend/src/validators/screening.validator.js`

- **createScreeningSchema:** project (string required), category_code (enum A,B,C,D,E,F required), category_reason (string required), potential_negative, potential_positive (string allow "", null), approved_by, recommendations (string optional or allow "", null), screening_date (date optional), status (draft|submitted|approved|rejected optional). Officer is not in schema (set by service; stripUnknown removes it).
- **updateScreeningSchema:** Same keys with project, category_code, category_reason optional.
- **approveScreeningSchema:** recommendations (string allow "", null optional).
- **rejectScreeningSchema:** reject_reason (string allow "", null optional).

---

## Assessment Validator

**File:** `backend/src/validators/assessment.validator.js`

- **createAssessmentSchema:** project (string required), project_activity (string required), description (string required), environmental_setting, legal_requirements, potential_negative_impact, potential_positive_impact (string allow "", null), approved_by optional, recommendations (string allow "", null), status (draft|submitted|approved|rejected optional). Officer not in schema.
- **updateAssessmentSchema:** Same keys with project, project_activity, description optional.
- **addMethodSchema:** method_type (string required), details (string allow "", null).
- **replaceMethodsSchema:** Array of addMethodSchema, min 0.
- **addConsultationSchema:** type (string required), participants, notes (string allow "", null).
- **replaceConsultationsSchema:** Array of addConsultationSchema, min 0.
- **addScoresSchema:** Array of { question (string required), level (negligible|low|medium|high|not_applicable required), note (string allow "", null) }, min 1.
- **approveAssessmentSchema:** recommendations (string allow "", null optional).
- **rejectAssessmentSchema:** reject_reason (string allow "", null optional).

---

## Monitoring Validator

**File:** `backend/src/validators/monitoring.validator.js`

- **createMonitoringSchema:** project (string required), indicator (string required), scores (object with baseline, Q1, Q2, Q3, Q4 as string allow "", null optional), total, final_assessment, ranking (string optional; ranking enum negligible|low|medium|high|not_applicable), responsible (string allow null, "" optional), note (string allow "", null).
- **updateMonitoringSchema:** Same as createMonitoringSchema (reused).
- **updateQuarterSchema:** value (string allow "", null required). Used for PATCH body; quarter key comes from `req.params.q`, validated in service.

---

## Mitigation Plan Validator

**File:** `backend/src/validators/mitigationPlan.validator.js`

- **createMitigationPlanSchema:** project (string required), serial_number (number optional), output_description (string required), potential_impact_and_significance, mitigation_and_enhancement_measures, monitoring, schedule (string allow "", null), responsible (string optional), notes (string allow "", null).
- **updateMitigationPlanSchema:** Same keys with project, output_description optional.

---

## Management Activity Validator

**File:** `backend/src/validators/managementActivity.validator.js`

- **createManagementActivitySchema:** project (string required), serial_number (number optional), activity_description (string required), potential_impact (string allow "", null optional), recommended_actions (string or array of strings optional), monitoring_requirements (string allow "", null), responsible (string optional), notes (string allow "", null).
- **updateManagementActivitySchema:** Same keys with project, activity_description optional.

---

## SEMP Validator

**File:** `backend/src/validators/semp.validator.js`

- **createObjectiveSchema:** project (string required), objective_text (string required).
- **updateObjectiveSchema:** project optional.
- **createTargetSchema:** objective (string required), target_text (string required).
- **updateTargetSchema:** objective optional.
- **createActionSchema:** target (string required), action_text (string required), responsible (string optional), resources (string allow "", null), due_date (date optional).
- **updateActionSchema:** target optional.

---

## Attachment Validator

**File:** `backend/src/validators/attachment.validator.js`

- **createAttachmentSchema:** entity_type (enum project|screening|assessment|monitoring required), entity_id (string required), file_name (string required), file_path (string required), file_type (string allow "", null), file_size (number optional), uploaded_by (string optional).

---

## Key Invariants

1. **Controller → service only** — Controllers do not call Mongoose models directly; all persistence and business rules go through services.
2. **Services throw ApiError** — 400/401/404 (and no other statuses in the current services) are expressed by throwing `ApiError(statusCode, message)`; the global error handler maps them to JSON.
3. **Validation is body-only** — The validate middleware validates only `req.body` with Joi; options are `abortEarly: false`, `stripUnknown: true`. Params and query are not validated by Joi.
4. **One service module per domain** — Auth, user, project, screening, assessment, monitoring, mitigation, management, SEMP, report, lookup, attachment each have a single service file; no cross-service calls.
5. **Validator per domain** — Each domain that accepts JSON body for create/update has a matching validator file; schemas are named by operation (e.g. createX, updateX, approveX).
6. **Screening and assessment officer logic** — Officer is set in service on create when `createdBy` is passed, and on update when status becomes submitted or officer was missing; it is not accepted from client in the schema (stripUnknown).
7. **Project delete cascade** — Deletion order is fixed: assessment sub-docs, assessments, SEMP (actions → targets → objectives), screenings, management, mitigation, monitoring, attachment records and files, then project. No other service performs cascade delete.

