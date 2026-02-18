# API Reference

This document describes the HTTP API of the Environmental and Social Management System (ESMS) backend. All domain endpoints are under a single versioned base URL; authentication uses JWT Bearer tokens. An LLM or client with only this document can call the API correctly without reading source code.

---

## Base URL & Versioning

**Base URL**: All API endpoints are prefixed with `/api/v1`. The server does not expose a different base path; the only non-API route is `GET /health`.

**Version**: The path segment `v1` is the API version. Future breaking changes may introduce `v2` under `/api/v2`; the current implementation does not support multiple versions simultaneously.

**Full URL form**: `{ORIGIN}/api/v1/{resource path}`. Example: `http://localhost:3000/api/v1/projects`.

**Constraints**

- No query-based or header-based versioning is used; the version is only in the path.
- All API routes are subject to the global API rate limiter (see [ARCHITECTURE.md](ARCHITECTURE.md)). `GET /health` is not under `/api/v1` and is not rate-limited.

---

## Authentication

**Mechanism**: JWT (JSON Web Token). The server issues a token on successful login or registration; the client sends it on subsequent requests to protected routes.

**Token placement**: Send the token in the `Authorization` header: `Authorization: Bearer <token>`. No query parameter or cookie-based auth is used for API access.

**Token lifecycle**: Tokens are signed with `JWT_SECRET` (server env). The backend does not implement refresh or revocation in this version; token expiry is determined by the signing options in the auth service (see [AUTHENTICATION.md](AUTHENTICATION.md)).

**Protected vs public**:

- **Public (no auth)**: `POST /api/v1/auth/register` (only when no users exist; otherwise requires auth and role `environmental_specialist`), `POST /api/v1/auth/login`, `GET /api/v1/projects`, `GET /api/v1/projects/:id`, `GET /api/v1/screenings`, `GET /api/v1/screenings/:id`, `GET /api/v1/screenings/project/:projectId`, `GET /api/v1/assessments`, `GET /api/v1/assessments/:id`, `GET /api/v1/assessments/project/:projectId`, `GET /api/v1/assessments/:id/methods`, `GET /api/v1/assessments/:id/consultations`, `GET /api/v1/assessments/:id/scores`, `GET /api/v1/monitoring`, `GET /api/v1/monitoring/project/:projectId`, `GET /api/v1/monitoring/:id`, `GET /api/v1/semp/project/:projectId`, `GET /api/v1/management/project/:projectId`, `GET /api/v1/mitigation/project/:projectId`, `GET /api/v1/lookups/impact-categories`, `GET /api/v1/lookups/impact-questions`, `GET /api/v1/lookups/indicators`, `GET /api/v1/lookups/job-titles`, `GET /api/v1/attachments/:id`.
- **Protected**: All other documented endpoints require a valid JWT and, where stated, a specific role. Missing or invalid token yields `401 Unauthorized`; valid token but insufficient role yields `403 Forbidden`.

**Constraints**

- Do not send `Authorization` for login/register unless the request is register and users already exist (then the token must be from a user with role `environmental_specialist`).
- Role values are exactly: `environmental_specialist`, `program_manager`, `project_manager`, `environmental_focal_point`, `viewer`.

---

## Endpoints

Response envelope for successful JSON responses: `{ success: true, data: T }` where `T` is the documented type. Error responses use `{ success: false, error: string }` and an appropriate HTTP status. Creation endpoints return `201` with body `{ success: true, data }`; delete returns `204` with no body.

---

### Auth

#### POST /api/v1/auth/register

**Purpose**: Create a new user. When the user collection is empty, no auth is required. When at least one user exists, the request must be authenticated and the caller must have role `environmental_specialist`.

**Auth**: None when no users exist; otherwise Bearer token with role `environmental_specialist`.

**Request body** (JSON):

```ts
{
  name: string;           // required
  email: string;          // required, valid email
  password: string;      // required, min length 6
  job_title?: string;     // optional, ObjectId string
  role?: "environmental_specialist" | "program_manager" | "project_manager" | "environmental_focal_point" | "viewer";
}
```

**Response**: `201`. Body: `{ success: true, data: { user: UserPublic, token: string } }`. `UserPublic`: `{ _id: string, name: string, email: string, job_title?: string, role: string, is_active: boolean, createdAt: string, updatedAt: string }` (no `password`).

**Errors**: `400` validation (e.g. invalid email, short password); `401` when users exist and no/invalid token or not environmental_specialist.

---

#### POST /api/v1/auth/login

**Purpose**: Authenticate by email and password; returns user and JWT.

**Auth**: None. Subject to login rate limiter (10 attempts per 15 minutes per IP, successful requests not counted).

**Request body** (JSON):

```ts
{ email: string; password: string; }
```

**Response**: `200`. Body: `{ success: true, data: { user: UserPublic, token: string } }`.

**Errors**: `400` validation; `401` invalid credentials; `429` too many login attempts.

---

### Users

#### GET /api/v1/users

**Purpose**: List all users (for admin/assignment UIs).

**Auth**: Required. Roles: `environmental_specialist`, `program_manager`, `project_manager`, `environmental_focal_point`, `viewer`.

**Request**: No body. No required query params.

**Response**: `200`. Body: `{ success: true, data: UserPublic[] }`.

**Errors**: `401` missing/invalid token; `403` role not allowed.

---

### Projects

#### GET /api/v1/projects

**Purpose**: List all projects.

**Auth**: Not required.

**Response**: `200`. Body: `{ success: true, data: Project[] }`. `Project`: `{ _id: string, title: string, location: string, start_date: string (ISO), end_date: string (ISO), project_component?: string, createdAt: string, updatedAt: string }`.

**Errors**: None beyond generic 500.

---

#### GET /api/v1/projects/:id

**Purpose**: Get one project by ID.

**Auth**: Not required.

**Params**: `id` — MongoDB ObjectId of the project.

**Response**: `200`. Body: `{ success: true, data: Project }`.

**Errors**: `404` when project not found (or invalid ObjectId).

---

#### POST /api/v1/projects

**Purpose**: Create a project.

**Auth**: Required. Roles: `environmental_specialist`, `program_manager`, `project_manager`, `environmental_focal_point`.

**Request body** (JSON):

```ts
{
  title: string;
  location: string;
  start_date: string;   // ISO date
  end_date: string;    // ISO date
  project_component?: string;
}
```

**Response**: `201`. Body: `{ success: true, data: Project }`.

**Errors**: `400` validation; `401`/`403` auth/role.

---

#### PUT /api/v1/projects/:id

**Purpose**: Update a project. All listed fields are optional for update.

**Auth**: Required. Roles: `environmental_specialist`, `program_manager`, `project_manager`, `environmental_focal_point`.

**Params**: `id` — project ObjectId.

**Request body** (JSON): Same shape as create; any subset of `title`, `location`, `start_date`, `end_date`, `project_component`.

**Response**: `200`. Body: `{ success: true, data: Project }`.

**Errors**: `400` validation; `401`/`403`; `404` project not found.

---

#### DELETE /api/v1/projects/:id

**Purpose**: Delete a project.

**Auth**: Required. Role: `environmental_specialist` only.

**Params**: `id` — project ObjectId.

**Response**: `204` no content.

**Errors**: `401`/`403`; `404` project not found.

---

### Screenings

#### GET /api/v1/screenings

**Purpose**: List all screenings.

**Auth**: Not required.

**Response**: `200`. Body: `{ success: true, data: Screening[] }`. `Screening`: includes `_id`, `project` (ObjectId or populated), `category_code` ("A"|"B"|"C"|"D"|"E"|"F"), `category_reason`, `potential_negative`, `potential_positive`, `recommendations`, `reject_reason`, `approved_by`, `reject_by`, `officer`, `screening_date`, `status` ("draft"|"submitted"|"approved"|"rejected"), `createdAt`, `updatedAt`.

**Errors**: Generic 500.

---

#### GET /api/v1/screenings/:id

**Purpose**: Get one screening by ID.

**Auth**: Not required.

**Params**: `id` — screening ObjectId.

**Response**: `200`. Body: `{ success: true, data: Screening }`.

**Errors**: `404` not found.

---

#### GET /api/v1/screenings/project/:projectId

**Purpose**: List screenings for a project.

**Auth**: Not required.

**Params**: `projectId` — project ObjectId.

**Response**: `200`. Body: `{ success: true, data: Screening[] }`.

**Errors**: `404` if project invalid or not found (implementation-dependent).

---

#### POST /api/v1/screenings

**Purpose**: Create a screening.

**Auth**: Required. Roles: `environmental_specialist`, `program_manager`, `project_manager`, `environmental_focal_point`.

**Request body** (JSON):

```ts
{
  project: string;       // ObjectId
  category_code: "A" | "B" | "C" | "D" | "E" | "F";
  category_reason: string;
  potential_negative?: string | null;
  potential_positive?: string | null;
  recommendations?: string | null;
  screening_date?: string;  // ISO date
  status?: "draft" | "submitted" | "approved" | "rejected";
}
```

**Response**: `201`. Body: `{ success: true, data: Screening }`.

**Errors**: `400` validation; `401`/`403`; `404` if project invalid.

---

#### PUT /api/v1/screenings/:id

**Purpose**: Update a screening. All fields in create schema are optional.

**Auth**: Required. Same roles as POST.

**Params**: `id` — screening ObjectId.

**Request body** (JSON): Subset of create body (project, category_code, category_reason optional for update).

**Response**: `200`. Body: `{ success: true, data: Screening }`.

**Errors**: `400` validation; `401`/`403`; `404` screening not found.

---

#### PATCH /api/v1/screenings/:id/approve

**Purpose**: Set screening status to approved and record approver.

**Auth**: Required. Role: `environmental_specialist` only.

**Params**: `id` — screening ObjectId.

**Request body** (JSON): `{ recommendations?: string | null }`.

**Response**: `200`. Body: `{ success: true, data: Screening }`.

**Errors**: `400` validation; `401`/`403`; `404` not found.

---

#### PATCH /api/v1/screenings/:id/reject

**Purpose**: Set screening status to rejected and record reject reason.

**Auth**: Required. Role: `environmental_specialist` only.

**Params**: `id` — screening ObjectId.

**Request body** (JSON): `{ reject_reason?: string | null }`.

**Response**: `200`. Body: `{ success: true, data: Screening }`.

**Errors**: `400` validation; `401`/`403`; `404` not found.

---

### Assessments

#### GET /api/v1/assessments

**Purpose**: List all assessments.

**Auth**: Not required.

**Response**: `200`. Body: `{ success: true, data: Assessment[] }`. `Assessment`: includes `_id`, `project`, `project_activity`, `description`, `environmental_setting`, `legal_requirements`, `potential_negative_impact`, `potential_positive_impact`, `recommendations`, `approved_by`, `reject_reason`, `reject_by`, `officer`, `status` ("draft"|"submitted"|"approved"|"rejected"), timestamps.

**Errors**: Generic 500.

---

#### GET /api/v1/assessments/:id

**Purpose**: Get one assessment by ID.

**Auth**: Not required.

**Params**: `id` — assessment ObjectId.

**Response**: `200`. Body: `{ success: true, data: Assessment }`.

**Errors**: `404` not found.

---

#### GET /api/v1/assessments/project/:projectId

**Purpose**: List assessments for a project.

**Auth**: Not required.

**Params**: `projectId` — project ObjectId.

**Response**: `200`. Body: `{ success: true, data: Assessment[] }`.

**Errors**: `404` when project invalid/not found (implementation-dependent).

---

#### POST /api/v1/assessments

**Purpose**: Create an assessment.

**Auth**: Required. Roles: `environmental_specialist`, `program_manager`, `project_manager`, `environmental_focal_point`.

**Request body** (JSON):

```ts
{
  project: string;
  project_activity: string;
  description: string;
  environmental_setting?: string | null;
  legal_requirements?: string | null;
  potential_negative_impact?: string | null;
  potential_positive_impact?: string | null;
  recommendations?: string | null;
  status?: "draft" | "submitted" | "approved" | "rejected";
}
```

**Response**: `201`. Body: `{ success: true, data: Assessment }`.

**Errors**: `400` validation; `401`/`403`; `404` if project invalid.

---

#### PUT /api/v1/assessments/:id

**Purpose**: Update an assessment. Create-schema fields optional.

**Auth**: Required. Same roles as POST.

**Params**: `id` — assessment ObjectId.

**Request body** (JSON): Subset of create (project, project_activity, description optional for update).

**Response**: `200`. Body: `{ success: true, data: Assessment }`.

**Errors**: `400` validation; `401`/`403`; `404` not found.

---

#### POST /api/v1/assessments/:id/methods

**Purpose**: Add one assessment method.

**Auth**: Required. Roles: `environmental_specialist`, `program_manager`, `project_manager`, `environmental_focal_point`.

**Params**: `id` — assessment ObjectId.

**Request body** (JSON): `{ method_type: string; details?: string | null }`.

**Response**: `201`. Body: `{ success: true, data: AssessmentMethod }`.

**Errors**: `400` validation; `401`/`403`; `404` assessment not found.

---

#### GET /api/v1/assessments/:id/methods

**Purpose**: List methods for an assessment.

**Auth**: Not required.

**Params**: `id` — assessment ObjectId.

**Response**: `200`. Body: `{ success: true, data: AssessmentMethod[] }`.

**Errors**: `404` assessment not found.

---

#### PUT /api/v1/assessments/:id/methods

**Purpose**: Replace all methods for an assessment.

**Auth**: Required. Same roles as POST methods.

**Params**: `id` — assessment ObjectId.

**Request body** (JSON): Array of `{ method_type: string; details?: string | null }` (min length 0).

**Response**: `200`. Body: `{ success: true, data: AssessmentMethod[] }`.

**Errors**: `400` validation; `401`/`403`; `404` not found.

---

#### POST /api/v1/assessments/:id/consultations

**Purpose**: Add one community consultation.

**Auth**: Required. Same roles as POST methods.

**Params**: `id` — assessment ObjectId.

**Request body** (JSON): `{ type: string; participants?: string | null; notes?: string | null }`.

**Response**: `201`. Body: `{ success: true, data: CommunityConsultation }`.

**Errors**: `400` validation; `401`/`403`; `404` not found.

---

#### GET /api/v1/assessments/:id/consultations

**Purpose**: List consultations for an assessment.

**Auth**: Not required.

**Params**: `id` — assessment ObjectId.

**Response**: `200`. Body: `{ success: true, data: CommunityConsultation[] }`.

**Errors**: `404` assessment not found.

---

#### PUT /api/v1/assessments/:id/consultations

**Purpose**: Replace all consultations for an assessment.

**Auth**: Required. Same roles as POST methods.

**Params**: `id` — assessment ObjectId.

**Request body** (JSON): Array of `{ type: string; participants?: string | null; notes?: string | null }` (min length 0).

**Response**: `200`. Body: `{ success: true, data: CommunityConsultation[] }`.

**Errors**: `400` validation; `401`/`403`; `404` not found.

---

#### POST /api/v1/assessments/:id/scores

**Purpose**: Add impact scores for an assessment.

**Auth**: Required. Same roles as POST methods.

**Params**: `id` — assessment ObjectId.

**Request body** (JSON): Array of `{ question: string; level: "negligible"|"low"|"medium"|"high"|"not_applicable"; note?: string | null }` (min length 1).

**Response**: `201`. Body: `{ success: true, data: ImpactScore[] }` (or equivalent list).

**Errors**: `400` validation; `401`/`403`; `404` not found.

---

#### GET /api/v1/assessments/:id/scores

**Purpose**: List scores for an assessment.

**Auth**: Not required.

**Params**: `id` — assessment ObjectId.

**Response**: `200`. Body: `{ success: true, data: ImpactScore[] }`.

**Errors**: `404` assessment not found.

---

#### PATCH /api/v1/assessments/:id/calculate

**Purpose**: Trigger impact calculation for an assessment.

**Auth**: Required. Roles: `environmental_specialist`, `program_manager`, `project_manager`, `environmental_focal_point`.

**Params**: `id` — assessment ObjectId.

**Request body**: None required.

**Response**: `200`. Body: `{ success: true, data: Assessment }` (with updated calculated fields).

**Errors**: `401`/`403`; `404` not found.

---

#### PATCH /api/v1/assessments/:id/approve

**Purpose**: Approve an assessment.

**Auth**: Required. Role: `environmental_specialist` only.

**Params**: `id` — assessment ObjectId.

**Request body** (JSON): `{ recommendations?: string | null }`.

**Response**: `200`. Body: `{ success: true, data: Assessment }`.

**Errors**: `400` validation; `401`/`403`; `404` not found.

---

#### PATCH /api/v1/assessments/:id/reject

**Purpose**: Reject an assessment.

**Auth**: Required. Role: `environmental_specialist` only.

**Params**: `id` — assessment ObjectId.

**Request body** (JSON): `{ reject_reason?: string | null }`.

**Response**: `200`. Body: `{ success: true, data: Assessment }`.

**Errors**: `400` validation; `401`/`403`; `404` not found.

---

### Monitoring

#### GET /api/v1/monitoring

**Purpose**: List all monitoring records.

**Auth**: Not required.

**Response**: `200`. Body: `{ success: true, data: MonitoringRecord[] }`. `MonitoringRecord`: includes `_id`, `project`, `indicator`, `scores` (baseline, Q1–Q4), `total`, `final_assessment`, `ranking` ("negligible"|"low"|"medium"|"high"|"not_applicable"), `responsible`, `note`, timestamps.

**Errors**: Generic 500.

---

#### GET /api/v1/monitoring/project/:projectId

**Purpose**: List monitoring records for a project.

**Auth**: Not required.

**Params**: `projectId` — project ObjectId.

**Response**: `200`. Body: `{ success: true, data: MonitoringRecord[] }`.

**Errors**: `404` when project invalid/not found (implementation-dependent).

---

#### GET /api/v1/monitoring/:id

**Purpose**: Get one monitoring record by ID.

**Auth**: Not required.

**Params**: `id` — record ObjectId.

**Response**: `200`. Body: `{ success: true, data: MonitoringRecord }`.

**Errors**: `404` not found.

---

#### POST /api/v1/monitoring

**Purpose**: Create a monitoring record.

**Auth**: Required. Roles: `environmental_specialist`, `program_manager`, `project_manager`, `environmental_focal_point`.

**Request body** (JSON):

```ts
{
  project: string;
  indicator: string;
  scores?: { baseline?: string; Q1?: string; Q2?: string; Q3?: string; Q4?: string };
  total?: string | null;
  final_assessment?: string | null;
  ranking?: "negligible" | "low" | "medium" | "high" | "not_applicable";
  responsible?: string | null;
  note?: string | null;
}
```

**Response**: `201`. Body: `{ success: true, data: MonitoringRecord }`.

**Errors**: `400` validation; `401`/`403`; `404` if project/indicator invalid.

---

#### PUT /api/v1/monitoring/:id

**Purpose**: Update a monitoring record. Same shape as create.

**Auth**: Required. Same roles as POST.

**Params**: `id` — record ObjectId.

**Request body** (JSON): Same as create (all fields optional in validator where applicable).

**Response**: `200`. Body: `{ success: true, data: MonitoringRecord }`.

**Errors**: `400` validation; `401`/`403`; `404` not found.

---

#### PATCH /api/v1/monitoring/:id/quarter/:q

**Purpose**: Update a single quarter score (Q1–Q4) for a record.

**Auth**: Required. Roles: `environmental_specialist`, `program_manager`, `project_manager`, `environmental_focal_point`.

**Params**: `id` — record ObjectId; `q` — quarter identifier (e.g. "1","2","3","4").

**Request body** (JSON): `{ value: string | null }`.

**Response**: `200`. Body: `{ success: true, data: MonitoringRecord }`.

**Errors**: `400` validation; `401`/`403`; `404` not found.

---

### Management

#### GET /api/v1/management/project/:projectId

**Purpose**: List management activities for a project.

**Auth**: Not required.

**Params**: `projectId` — project ObjectId.

**Response**: `200`. Body: `{ success: true, data: ManagementActivity[] }`. `ManagementActivity`: includes `_id`, `project`, `serial_number`, `activity_description`, `potential_impact`, `recommended_actions` (string or array of strings), `monitoring_requirements`, `responsible`, `notes`, timestamps.

**Errors**: `404` when project invalid/not found (implementation-dependent).

---

#### POST /api/v1/management

**Purpose**: Create a management activity.

**Auth**: Required. Roles: `environmental_specialist`, `program_manager`, `project_manager`, `environmental_focal_point`.

**Request body** (JSON):

```ts
{
  project: string;
  serial_number?: number;
  activity_description: string;
  potential_impact?: string | null;
  recommended_actions?: string | string[] | null;
  monitoring_requirements?: string | null;
  responsible?: string | null;
  notes?: string | null;
}
```

**Response**: `201`. Body: `{ success: true, data: ManagementActivity }`.

**Errors**: `400` validation; `401`/`403`; `404` if project invalid.

---

#### PUT /api/v1/management/:id

**Purpose**: Update a management activity. Create-schema fields optional (project, activity_description optional for update).

**Auth**: Required. Same roles as POST.

**Params**: `id` — activity ObjectId.

**Request body** (JSON): Subset of create.

**Response**: `200`. Body: `{ success: true, data: ManagementActivity }`.

**Errors**: `400` validation; `401`/`403`; `404` not found.

---

#### DELETE /api/v1/management/:id

**Purpose**: Delete a management activity.

**Auth**: Required. Same roles as POST.

**Params**: `id` — activity ObjectId.

**Response**: `204` no content.

**Errors**: `401`/`403`; `404` not found.

---

### Mitigation

#### GET /api/v1/mitigation/project/:projectId

**Purpose**: List mitigation plans for a project.

**Auth**: Not required.

**Params**: `projectId` — project ObjectId.

**Response**: `200`. Body: `{ success: true, data: MitigationPlan[] }`. `MitigationPlan`: includes `_id`, `project`, `serial_number`, `output_description`, `potential_impact_and_significance`, `mitigation_and_enhancement_measures`, `monitoring`, `schedule`, `responsible`, `notes`, timestamps.

**Errors**: `404` when project invalid/not found (implementation-dependent).

---

#### POST /api/v1/mitigation

**Purpose**: Create a mitigation plan.

**Auth**: Required. Roles: `environmental_specialist`, `program_manager`, `project_manager`, `environmental_focal_point`.

**Request body** (JSON):

```ts
{
  project: string;
  serial_number?: number;
  output_description: string;
  potential_impact_and_significance?: string | null;
  mitigation_and_enhancement_measures?: string | null;
  monitoring?: string | null;
  schedule?: string | null;
  responsible?: string | null;
  notes?: string | null;
}
```

**Response**: `201`. Body: `{ success: true, data: MitigationPlan }`.

**Errors**: `400` validation; `401`/`403`; `404` if project invalid.

---

#### PUT /api/v1/mitigation/:id

**Purpose**: Update a mitigation plan. Create-schema fields optional (project, output_description optional for update).

**Auth**: Required. Same roles as POST.

**Params**: `id` — plan ObjectId.

**Request body** (JSON): Subset of create.

**Response**: `200`. Body: `{ success: true, data: MitigationPlan }`.

**Errors**: `400` validation; `401`/`403`; `404` not found.

---

#### DELETE /api/v1/mitigation/:id

**Purpose**: Delete a mitigation plan.

**Auth**: Required. Same roles as POST.

**Params**: `id` — plan ObjectId.

**Response**: `204` no content.

**Errors**: `401`/`403`; `404` not found.

---

### SEMP (Environmental and Social Management Plan)

#### GET /api/v1/semp/project/:projectId

**Purpose**: Get the full SEMP plan for a project (objectives, targets, actions).

**Auth**: Not required.

**Params**: `projectId` — project ObjectId.

**Response**: `200`. Body: `{ success: true, data: { objectives: SempObjective[], targets: SempTarget[], actions: SempAction[] } }`. Objectives have `project`, `objective_text`; targets have `objective`, `target_text`; actions have `target`, `action_text`, `responsible`, `resources`, `due_date`.

**Errors**: `404` when project invalid/not found (implementation may return empty arrays).

---

#### POST /api/v1/semp/objectives

**Purpose**: Create a SEMP objective.

**Auth**: Required. Roles: `environmental_specialist`, `program_manager`, `project_manager`, `environmental_focal_point`.

**Request body** (JSON): `{ project: string; objective_text: string }`.

**Response**: `201`. Body: `{ success: true, data: SempObjective }`.

**Errors**: `400` validation; `401`/`403`; `404` if project invalid.

---

#### PUT /api/v1/semp/objectives/:id

**Purpose**: Update a SEMP objective. `project` optional in update.

**Auth**: Required. Same roles as POST.

**Params**: `id` — objective ObjectId.

**Request body** (JSON): `{ project?: string; objective_text: string }`.

**Response**: `200`. Body: `{ success: true, data: SempObjective }`.

**Errors**: `400` validation; `401`/`403`; `404` objective not found.

---

#### POST /api/v1/semp/targets

**Purpose**: Create a SEMP target (linked to an objective).

**Auth**: Required. Same roles as POST objectives.

**Request body** (JSON): `{ objective: string; target_text: string }`.

**Response**: `201`. Body: `{ success: true, data: SempTarget }`.

**Errors**: `400` validation; `401`/`403`; `404` if objective invalid.

---

#### PUT /api/v1/semp/targets/:id

**Purpose**: Update a SEMP target. `objective` optional in update.

**Auth**: Required. Same roles as POST.

**Params**: `id` — target ObjectId.

**Request body** (JSON): `{ objective?: string; target_text: string }`.

**Response**: `200`. Body: `{ success: true, data: SempTarget }`.

**Errors**: `400` validation; `401`/`403`; `404` target not found.

---

#### POST /api/v1/semp/actions

**Purpose**: Create a SEMP action (linked to a target).

**Auth**: Required. Same roles as POST objectives.

**Request body** (JSON): `{ target: string; action_text: string; responsible?: string; resources?: string | null; due_date?: string }`.

**Response**: `201`. Body: `{ success: true, data: SempAction }`.

**Errors**: `400` validation; `401`/`403`; `404` if target invalid.

---

#### PUT /api/v1/semp/actions/:id

**Purpose**: Update a SEMP action. `target` optional in update.

**Auth**: Required. Same roles as POST.

**Params**: `id` — action ObjectId.

**Request body** (JSON): Subset of create (target optional).

**Response**: `200`. Body: `{ success: true, data: SempAction }`.

**Errors**: `400` validation; `401`/`403`; `404` action not found.

---

### Reports

#### GET /api/v1/reports/dashboard

**Purpose**: Get dashboard statistics (counts by status, category, etc.).

**Auth**: Required. Roles: `environmental_specialist`, `program_manager`, `project_manager`, `environmental_focal_point`, `viewer`.

**Response**: `200`. Body: `{ success: true, data: DashboardStats }`. `DashboardStats`: `{ totalProjects: number; screening: { byStatus: Record<string,number>; byCategory: Record<string,number> }; assessments: { byStatus: Record<string,number> }; monitoring: { total: number }; management: { total: number }; mitigation: { total: number } }`.

**Errors**: `401`/`403`.

---

#### GET /api/v1/reports/export

**Purpose**: Export data as CSV, Excel, or PDF. Response is a file download (binary or text).

**Auth**: Required. Roles: `environmental_specialist`, `program_manager` only.

**Query params**:

| Param      | Type   | Required | Description |
|-----------|--------|----------|-------------|
| type      | string | yes      | `"projects"` or `"monitoring"` |
| projectId | string | no       | For `type=monitoring`, filter by project ObjectId |
| format    | string | no       | `"csv"` (default), `"excel"`, or `"pdf"` |

**Response**: `200`. Headers: `Content-Type` (e.g. `text/csv`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `application/pdf`), `Content-Disposition: attachment; filename=<name>`. Body: file bytes.

**Errors**: `400` unsupported type/format; `401`/`403`; `500` on build error.

---

### Lookups

All lookup endpoints are read-only and do not require authentication.

#### GET /api/v1/lookups/impact-categories

**Purpose**: List impact categories (reference data).

**Response**: `200`. Body: `{ success: true, data: ImpactCategory[] }`. Sorted by `code`. Schema details in [DATA_MODELS.md](DATA_MODELS.md).

**Errors**: Generic 500.

---

#### GET /api/v1/lookups/impact-questions

**Purpose**: List impact questions with category populated.

**Response**: `200`. Body: `{ success: true, data: ImpactQuestion[] }`. Sorted by `createdAt` desc.

**Errors**: Generic 500.

---

#### GET /api/v1/lookups/indicators

**Purpose**: List indicators with category populated.

**Response**: `200`. Body: `{ success: true, data: Indicator[] }`. Sorted by `createdAt` desc.

**Errors**: Generic 500.

---

#### GET /api/v1/lookups/job-titles

**Purpose**: List job titles (reference data for users).

**Response**: `200`. Body: `{ success: true, data: JobTitle[] }`. Sorted by `title_name`.

**Errors**: Generic 500.

---

### Attachments

#### POST /api/v1/attachments

**Purpose**: Create an attachment record (metadata only; use upload for file + record).

**Auth**: Required. Roles: `environmental_specialist`, `program_manager`, `project_manager`, `environmental_focal_point`.

**Request body** (JSON):

```ts
{
  entity_type: "project" | "screening" | "assessment" | "monitoring";
  entity_id: string;   // ObjectId
  file_name: string;
  file_path: string;
  file_type?: string | null;
  file_size?: number;
  uploaded_by?: string;
}
```

**Response**: `201`. Body: `{ success: true, data: Attachment }`. `Attachment`: includes `_id`, `entity_type`, `entity_id`, `file_name`, `file_path`, `file_type`, `file_size`, `uploaded_by`, timestamps.

**Errors**: `400` validation; `401`/`403`; `404` if entity references invalid.

---

#### GET /api/v1/attachments/:id

**Purpose**: Get one attachment by ID.

**Auth**: Not required.

**Params**: `id` — attachment ObjectId.

**Response**: `200`. Body: `{ success: true, data: Attachment }`.

**Errors**: `404` not found.

---

#### POST /api/v1/attachments/upload

**Purpose**: Upload a file and create an attachment record. File is sent as multipart form field `file`; `entity_type` and `entity_id` as form fields.

**Auth**: Required. Roles: `environmental_specialist`, `program_manager`, `project_manager`, `environmental_focal_point`.

**Request**: `multipart/form-data`. Fields: `file` (file); `entity_type` (string); `entity_id` (string). Server sets `file_name`, `file_path`, `file_type`, `file_size` from the uploaded file and `uploaded_by` from `req.user._id`.

**Response**: `201`. Body: `{ success: true, data: Attachment }`.

**Errors**: `400` no file uploaded or validation; `401`/`403`; `413` if body size exceeds server limit (e.g. 10mb).

---

## Common Error Codes

| HTTP Status | Meaning | Common cause |
|-------------|---------|--------------|
| 400 | Bad Request | Joi or Mongoose validation failed; invalid enum/value; duplicate key (e.g. unique email). Response body: `{ success: false, error: string }`. |
| 401 | Unauthorized | Missing or invalid `Authorization` header; token expired or signature invalid; user no longer in DB. |
| 403 | Forbidden | Valid token but role not in the allowed set for the route. |
| 404 | Not Found | Resource not found (invalid ObjectId or document deleted); also used for "Route not found" when path does not match any route (aggregate 404 handler). |
| 413 | Payload Too Large | Request body exceeds server limit (e.g. 10mb). May not be explicitly returned by all middlewares. |
| 429 | Too Many Requests | API rate limit (1000/7 min per IP) or login rate limit (10/15 min per IP). Response: `{ success: false, error: "..." }`. |
| 500 | Internal Server Error | Unhandled exception; Mongoose or JWT errors not mapped to 4xx. In development, response may include `stack`. |

**Invariants**

- Success responses use `{ success: true, data: T }` and status 2xx; delete uses 204 with no body.
- Error responses use `{ success: false, error: string }` and a 4xx or 5xx status. Validation errors concatenate Joi/Mongoose messages into a single `error` string.
- The API does not expose stack traces in production; see [ARCHITECTURE.md](ARCHITECTURE.md) and errorHandler middleware.
