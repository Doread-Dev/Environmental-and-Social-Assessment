# Data Models

This document describes all Mongoose schemas and collections used by the ESMS backend. Each entity’s fields, relationships, and lifecycle are explicit so that an LLM or maintainer can reason about persistence and integrity without reading model source files.

---

## Entity Overview

| Entity | Description | Primary Key | Key Relations |
|--------|-------------|-------------|----------------|
| User | System user; authentication and role. | `_id` (ObjectId) | JobTitle (optional). Referenced by Screening, Assessment, MonitoringRecord, MitigationPlan, ManagementActivity, SempAction, Attachment. |
| JobTitle | Lookup: user job title. | `_id` (ObjectId) | Referenced by User. |
| Project | Project under ESMS. | `_id` (ObjectId) | Referenced by Screening, Assessment, MonitoringRecord, MitigationPlan, ManagementActivity, SempObjective. |
| Screening | Environmental/social screening for a project. | `_id` (ObjectId) | Project (required), User (approved_by, reject_by, officer). |
| Assessment | Environmental/social assessment for a project. | `_id` (ObjectId) | Project (required), User (approved_by, reject_by, officer). Referenced by AssessmentImpactScore, AssessmentMethod, CommunityConsultation. |
| AssessmentImpactScore | Per-question impact score for an assessment. | `_id` (ObjectId) | Assessment (required), ImpactQuestion (required). |
| AssessmentMethod | Assessment method entry. | `_id` (ObjectId) | Assessment (required). |
| CommunityConsultation | Community consultation record for an assessment. | `_id` (ObjectId) | Assessment (required). |
| MonitoringRecord | Monitoring record per project and indicator. | `_id` (ObjectId) | Project (required), Indicator (required), User (responsible). |
| MitigationPlan | Mitigation plan item for a project. | `_id` (ObjectId) | Project (required), User (responsible). |
| ManagementActivity | Management activity for a project. | `_id` (ObjectId) | Project (required), User (responsible). |
| SempObjective | SEMP objective for a project. | `_id` (ObjectId) | Project (required). Referenced by SempTarget. |
| SempTarget | SEMP target under an objective. | `_id` (ObjectId) | SempObjective (required). Referenced by SempAction. |
| SempAction | SEMP action under a target. | `_id` (ObjectId) | SempTarget (required), User (responsible). |
| ImpactCategory | Lookup: impact category (e.g. A, B, C). | `_id` (ObjectId) | Referenced by ImpactQuestion, Indicator. |
| ImpactQuestion | Lookup: impact question per category. | `_id` (ObjectId) | ImpactCategory (required). Referenced by AssessmentImpactScore. |
| Indicator | Lookup: monitoring indicator per category. | `_id` (ObjectId) | ImpactCategory (required). Referenced by MonitoringRecord. |
| Attachment | File attached to a project, screening, assessment, or monitoring entity. | `_id` (ObjectId) | User (uploaded_by). Polymorphic via entity_type + entity_id. |
| AnnexItem | Standalone annex item (title/description). | `_id` (ObjectId) | None. |

---

## User

Stores authenticated users: name, email, hashed password, optional job title, role, and active flag. Password is hashed on save; JSON serialization strips password.

**Fields**

| Name | Type | Nullable | Default | Constraints | Description |
|------|------|----------|---------|--------------|-------------|
| name | String | No | — | trim | Full name. |
| email | String | No | — | unique, lowercase, trim | Login identifier. |
| password | String | No | — | — | Bcrypt-hashed on save. |
| job_title | ObjectId | Yes | — | ref: JobTitle | Optional job title lookup. |
| role | String | No | "viewer" | enum (see below) | Role for authorization. |
| is_active | Boolean | No | true | — | Whether account is active. |
| createdAt | Date | No | set by Mongoose | — | Set by timestamps. |
| updatedAt | Date | No | set by Mongoose | — | Set by timestamps. |

**Role enum:** `environmental_specialist`, `program_manager`, `project_manager`, `environmental_focal_point`, `viewer`.

**Relationships:** belongs to JobTitle (optional). Has no direct “has many” in schema; referenced by Screening (approved_by, reject_by, officer), Assessment (approved_by, reject_by, officer), MonitoringRecord (responsible), MitigationPlan (responsible), ManagementActivity (responsible), SempAction (responsible), Attachment (uploaded_by).

**Lifecycle:** Created via registration; updated for profile/role changes; no soft delete. Password is modified only when explicitly changed (pre-save hook hashes only if `isModified("password")`).

**Constraints**

- Email must be unique across the collection.
- Password is never returned in `toJSON()`.

---

## JobTitle

Lookup table for user job titles. Seeded; referenced by User.

**Fields**

| Name | Type | Nullable | Default | Constraints | Description |
|------|------|----------|---------|--------------|-------------|
| title_name | String | No | — | unique, trim | Display name of the job title. |
| createdAt | Date | No | set by Mongoose | — | Set by timestamps. |
| updatedAt | Date | No | set by Mongoose | — | Set by timestamps. |

**Relationships:** has many User (via User.job_title).

**Lifecycle:** Created/updated by lookup management or seed; no application-level delete contract in models.

**Constraints**

- `title_name` is unique.

---

## Project

Core project entity: title, location, dates, optional component. No soft delete.

**Fields**

| Name | Type | Nullable | Default | Constraints | Description |
|------|------|----------|---------|--------------|-------------|
| title | String | No | — | trim | Project title. |
| location | String | No | — | trim | Project location. |
| start_date | Date | No | — | — | Project start. |
| end_date | Date | No | — | — | Project end. |
| project_component | String | Yes | — | trim | Optional component. |
| createdAt | Date | No | set by Mongoose | — | Set by timestamps. |
| updatedAt | Date | No | set by Mongoose | — | Set by timestamps. |

**Relationships:** has many Screening, Assessment, MonitoringRecord, MitigationPlan, ManagementActivity, SempObjective (each has required `project` ref).

**Lifecycle:** Created via projects API; updated in place; deleted via projects API (cascading deletes of child entities and attachments are implemented in project service, not in schema).

**Constraints**

- start_date and end_date are required; application logic should enforce start_date ≤ end_date if needed.

---

## Screening

Environmental/social screening for one project. Has category (A–F), reason, impacts, approval/rejection, officer, and workflow status.

**Fields**

| Name | Type | Nullable | Default | Constraints | Description |
|------|------|----------|---------|--------------|-------------|
| project | ObjectId | No | — | ref: Project | Project this screening belongs to. |
| category_code | String | No | — | enum: A,B,C,D,E,F | Screening category. |
| category_reason | String | No | — | — | Reason for category. |
| potential_negative | String | Yes | — | — | Potential negative impacts. |
| potential_positive | String | Yes | — | — | Potential positive impacts. |
| approved_by | ObjectId | Yes | — | ref: User | User who approved (when status approved). |
| recommendations | String | Yes | — | — | Recommendations. |
| reject_reason | String | Yes | — | — | Reason when rejected. |
| reject_by | ObjectId | Yes | — | ref: User | User who rejected. |
| officer | ObjectId | Yes | — | ref: User | Responsible officer. |
| screening_date | Date | No | Date.now | — | Date of screening. |
| status | String | No | "draft" | enum: draft, submitted, approved, rejected | Workflow status. |
| createdAt | Date | No | set by Mongoose | — | Set by timestamps. |
| updatedAt | Date | No | set by Mongoose | — | Set by timestamps. |

**Relationships:** belongs to Project (required), User (approved_by, reject_by, officer optional). Attachments reference Screening via Attachment entity_type "screening" and entity_id.

**Lifecycle:** Created/updated via screenings API; deleted when project is deleted or explicitly; no soft delete.

**Constraints**

- category_code is one of: A, B, C, D, E, F.

---

## Assessment

Environmental/social assessment for one project. Includes activity description, setting, legal requirements, embedded score counts, overall impact level, potential impacts, approval/rejection, and status.

**Fields**

| Name | Type | Nullable | Default | Constraints | Description |
|------|------|----------|---------|--------------|-------------|
| project | ObjectId | No | — | ref: Project | Project this assessment belongs to. |
| project_activity | String | No | — | — | Description of project activity. |
| description | String | No | — | — | Assessment description. |
| environmental_setting | String | Yes | — | — | Environmental setting. |
| legal_requirements | String | Yes | — | — | Legal requirements. |
| total_project_score | subdoc | No | — | see below | Score counts (negligible, low, medium, high, not_applicable). |
| total_project_impact | String | Yes | — | enum: negligible, low, medium, high, not_applicable | Overall impact level. |
| potential_negative_impact | String | Yes | — | — | Potential negative impact text. |
| potential_positive_impact | String | Yes | — | — | Potential positive impact text. |
| approved_by | ObjectId | Yes | — | ref: User | Approver when status approved. |
| recommendations | String | Yes | — | — | Recommendations. |
| reject_reason | String | Yes | — | — | Rejection reason. |
| reject_by | ObjectId | Yes | — | ref: User | User who rejected. |
| officer | ObjectId | Yes | — | ref: User | Responsible officer. |
| status | String | No | "draft" | enum: draft, submitted, approved, rejected | Workflow status. |
| createdAt | Date | No | set by Mongoose | — | Set by timestamps. |
| updatedAt | Date | No | set by Mongoose | — | Set by timestamps. |

**Embedded subdocument total_project_score:** `{ negligible: Number, low: Number, medium: Number, high: Number, not_applicable: Number }`, each default 0; `_id: false`.

**Relationships:** belongs to Project (required), User (approved_by, reject_by, officer optional). Has many AssessmentImpactScore, AssessmentMethod, CommunityConsultation. Attachments reference Assessment via entity_type "assessment" and entity_id.

**Lifecycle:** Created/updated via assessments API; deleted when project is deleted or explicitly; no soft delete.

**Constraints**

- total_project_impact enum: negligible, low, medium, high, not_applicable.

---

## AssessmentImpactScore

Stores one impact score (level + optional note) for one assessment and one impact question. Used to build per-question scoring.

**Fields**

| Name | Type | Nullable | Default | Constraints | Description |
|------|------|----------|---------|--------------|-------------|
| assessment | ObjectId | No | — | ref: Assessment | Assessment this score belongs to. |
| question | ObjectId | No | — | ref: ImpactQuestion | Impact question. |
| level | String | No | — | enum: negligible, low, medium, high, not_applicable | Impact level. |
| note | String | Yes | — | — | Optional note. |
| createdAt | Date | No | set by Mongoose | — | Set by timestamps. |
| updatedAt | Date | No | set by Mongoose | — | Set by timestamps. |

**Relationships:** belongs to Assessment (required), ImpactQuestion (required).

**Lifecycle:** Created/updated/deleted with assessment flow; no soft delete. Uniqueness of (assessment, question) is not enforced at schema level.

**Constraints**

- level is one of: negligible, low, medium, high, not_applicable.

---

## AssessmentMethod

Stores one assessment method (type + details) for an assessment.

**Fields**

| Name | Type | Nullable | Default | Constraints | Description |
|------|------|----------|---------|--------------|-------------|
| assessment | ObjectId | No | — | ref: Assessment | Assessment this method belongs to. |
| method_type | String | No | — | — | Type of method. |
| details | String | Yes | — | — | Method details. |
| createdAt | Date | No | set by Mongoose | — | Set by timestamps. |
| updatedAt | Date | No | set by Mongoose | — | Set by timestamps. |

**Relationships:** belongs to Assessment (required).

**Lifecycle:** Created/updated/deleted with assessment; no soft delete.

---

## CommunityConsultation

Community consultation record linked to one assessment (type, participants, notes).

**Fields**

| Name | Type | Nullable | Default | Constraints | Description |
|------|------|----------|---------|--------------|-------------|
| assessment | ObjectId | No | — | ref: Assessment | Assessment this consultation belongs to. |
| type | String | No | — | — | Consultation type. |
| participants | String | Yes | — | — | Participants description. |
| notes | String | Yes | — | — | Notes. |
| createdAt | Date | No | set by Mongoose | — | Set by timestamps. |
| updatedAt | Date | No | set by Mongoose | — | Set by timestamps. |

**Relationships:** belongs to Assessment (required).

**Lifecycle:** Created/updated/deleted with assessment; no soft delete.

---

## MonitoringRecord

One monitoring record per project and indicator: quarterly scores (baseline, Q1–Q4), total, final assessment, ranking, responsible user, note.

**Fields**

| Name | Type | Nullable | Default | Constraints | Description |
|------|------|----------|---------|--------------|-------------|
| project | ObjectId | No | — | ref: Project | Project. |
| indicator | ObjectId | No | — | ref: Indicator | Indicator. |
| scores | subdoc | No | — | see below | baseline, Q1, Q2, Q3, Q4 (strings). |
| total | String | Yes | — | — | Total score. |
| final_assessment | String | Yes | — | — | Final assessment text. |
| ranking | String | Yes | — | enum: negligible, low, medium, high, not_applicable | Ranking. |
| responsible | ObjectId | Yes | — | ref: User | Responsible user. |
| note | String | Yes | — | — | Note. |
| createdAt | Date | No | set by Mongoose | — | Set by timestamps. |
| updatedAt | Date | No | set by Mongoose | — | Set by timestamps. |

**Embedded subdocument scores:** `{ baseline: String, Q1: String, Q2: String, Q3: String, Q4: String }`; `_id: false`.

**Relationships:** belongs to Project (required), Indicator (required), User (responsible optional). Attachments reference monitoring via entity_type "monitoring"; entity_id is the MonitoringRecord _id (per project delete logic).

**Lifecycle:** Created/updated/deleted via monitoring API; deleted when project is deleted; no soft delete.

**Constraints**

- ranking enum: negligible, low, medium, high, not_applicable.

---

## MitigationPlan

Mitigation plan item for a project: output description, impact/significance, measures, monitoring, schedule, responsible user, notes.

**Fields**

| Name | Type | Nullable | Default | Constraints | Description |
|------|------|----------|---------|--------------|-------------|
| project | ObjectId | No | — | ref: Project | Project. |
| serial_number | Number | Yes | — | — | Display order. |
| output_description | String | No | — | — | Output description. |
| potential_impact_and_significance | String | Yes | — | — | Impact and significance. |
| mitigation_and_enhancement_measures | String | Yes | — | — | Mitigation/enhancement measures. |
| monitoring | String | Yes | — | — | Monitoring description. |
| schedule | String | Yes | — | — | Schedule. |
| responsible | ObjectId | Yes | — | ref: User | Responsible user. |
| notes | String | Yes | — | — | Notes. |
| createdAt | Date | No | set by Mongoose | — | Set by timestamps. |
| updatedAt | Date | No | set by Mongoose | — | Set by timestamps. |

**Relationships:** belongs to Project (required), User (responsible optional).

**Lifecycle:** Created/updated/deleted via mitigation API; deleted when project is deleted; no soft delete.

---

## ManagementActivity

Management activity for a project: description, potential impact, recommended actions (string or array via Mixed), monitoring requirements, responsible user, notes.

**Fields**

| Name | Type | Nullable | Default | Constraints | Description |
|------|------|----------|---------|--------------|-------------|
| project | ObjectId | No | — | ref: Project | Project. |
| serial_number | Number | Yes | — | — | Display order. |
| activity_description | String | No | — | — | Activity description. |
| potential_impact | String | Yes | — | — | Potential impact (free text). |
| recommended_actions | Mixed | Yes | — | — | String or array of strings. |
| monitoring_requirements | String | Yes | — | — | Monitoring requirements. |
| responsible | ObjectId | Yes | — | ref: User | Responsible user. |
| notes | String | Yes | — | — | Notes. |
| createdAt | Date | No | set by Mongoose | — | Set by timestamps. |
| updatedAt | Date | No | set by Mongoose | — | Set by timestamps. |

**Relationships:** belongs to Project (required), User (responsible optional).

**Lifecycle:** Created/updated/deleted via management API; deleted when project is deleted; no soft delete.

**Constraints**

- recommended_actions has no schema constraint; consumers must handle both string and array.

---

## SempObjective

SEMP objective for a project. Top level of SEMP hierarchy (Objective → Target → Action).

**Fields**

| Name | Type | Nullable | Default | Constraints | Description |
|------|------|----------|---------|--------------|-------------|
| project | ObjectId | No | — | ref: Project | Project. |
| objective_text | String | No | — | — | Objective text. |
| createdAt | Date | No | set by Mongoose | — | Set by timestamps. |
| updatedAt | Date | No | set by Mongoose | — | Set by timestamps. |

**Relationships:** belongs to Project (required). Has many SempTarget (target.objective).

**Lifecycle:** Created/updated/deleted via SEMP API; deleted when project is deleted or explicitly; no soft delete.

---

## SempTarget

SEMP target under one objective.

**Fields**

| Name | Type | Nullable | Default | Constraints | Description |
|------|------|----------|---------|--------------|-------------|
| objective | ObjectId | No | — | ref: SempObjective | Parent objective. |
| target_text | String | No | — | — | Target text. |
| createdAt | Date | No | set by Mongoose | — | Set by timestamps. |
| updatedAt | Date | No | set by Mongoose | — | Set by timestamps. |

**Relationships:** belongs to SempObjective (required). Has many SempAction (action.target).

**Lifecycle:** Created/updated/deleted via SEMP API; cascade from objective/project; no soft delete.

---

## SempAction

SEMP action under one target: action text, responsible user, resources, due date.

**Fields**

| Name | Type | Nullable | Default | Constraints | Description |
|------|------|----------|---------|--------------|-------------|
| target | ObjectId | No | — | ref: SempTarget | Parent target. |
| action_text | String | No | — | — | Action description. |
| responsible | ObjectId | Yes | — | ref: User | Responsible user. |
| resources | String | Yes | — | — | Resources. |
| due_date | Date | Yes | — | — | Due date. |
| createdAt | Date | No | set by Mongoose | — | Set by timestamps. |
| updatedAt | Date | No | set by Mongoose | — | Set by timestamps. |

**Relationships:** belongs to SempTarget (required), User (responsible optional).

**Lifecycle:** Created/updated/deleted via SEMP API; cascade from target; no soft delete.

---

## ImpactCategory

Lookup: impact category with name, code (e.g. A, B, C), optional Arabic name. Referenced by ImpactQuestion and Indicator.

**Fields**

| Name | Type | Nullable | Default | Constraints | Description |
|------|------|----------|---------|--------------|-------------|
| name | String | No | — | unique, trim | Category name. |
| code | String | No | — | unique, trim | Category code (e.g. A, B, C). |
| name_ar | String | Yes | — | trim | Arabic name. |
| createdAt | Date | No | set by Mongoose | — | Set by timestamps. |
| updatedAt | Date | No | set by Mongoose | — | Set by timestamps. |

**Relationships:** has many ImpactQuestion, Indicator (each has required category ref).

**Lifecycle:** Seeded or managed via lookups API; no soft delete.

**Constraints**

- name and code are unique.

---

## ImpactQuestion

Lookup: impact question per category (text and optional Arabic). Used by AssessmentImpactScore.

**Fields**

| Name | Type | Nullable | Default | Constraints | Description |
|------|------|----------|---------|--------------|-------------|
| category | ObjectId | No | — | ref: ImpactCategory | Category. |
| question_text | String | No | — | — | Question text. |
| question_text_ar | String | Yes | — | — | Question text (Arabic). |
| createdAt | Date | No | set by Mongoose | — | Set by timestamps. |
| updatedAt | Date | No | set by Mongoose | — | Set by timestamps. |

**Relationships:** belongs to ImpactCategory (required). Referenced by AssessmentImpactScore.

**Lifecycle:** Seeded or managed via lookups API; no soft delete.

---

## Indicator

Lookup: monitoring indicator per impact category (name, definition, measurement). Used by MonitoringRecord.

**Fields**

| Name | Type | Nullable | Default | Constraints | Description |
|------|------|----------|---------|--------------|-------------|
| category | ObjectId | No | — | ref: ImpactCategory | Impact category. |
| name | String | No | — | — | Indicator name. |
| definition | String | No | — | — | Definition. |
| measurement | String | No | — | — | Measurement description. |
| createdAt | Date | No | set by Mongoose | — | Set by timestamps. |
| updatedAt | Date | No | set by Mongoose | — | Set by timestamps. |

**Relationships:** belongs to ImpactCategory (required). Referenced by MonitoringRecord.

**Lifecycle:** Seeded or managed via lookups API; no soft delete.

---

## Attachment

File attachment polymorphically linked to a project, screening, assessment, or monitoring record via entity_type and entity_id. Stores file metadata and uploader.

**Fields**

| Name | Type | Nullable | Default | Constraints | Description |
|------|------|----------|---------|--------------|-------------|
| entity_type | String | No | — | enum: project, screening, assessment, monitoring | Type of owning entity. |
| entity_id | ObjectId | No | — | — | _id of the owning entity. |
| file_name | String | No | — | — | Original file name. |
| file_path | String | No | — | — | Server path to file. |
| file_type | String | Yes | — | — | MIME or extension. |
| file_size | Number | Yes | — | — | Size in bytes. |
| uploaded_by | ObjectId | Yes | — | ref: User | User who uploaded. |
| createdAt | Date | No | set by Mongoose | — | Set by timestamps. |
| updatedAt | Date | No | set by Mongoose | — | Set by timestamps. |

**Relationships:** belongs to User (uploaded_by optional). Polymorphic: entity_type + entity_id reference Project, Screening, Assessment, or MonitoringRecord; no DB foreign key; application deletes attachments when parent entity is deleted.

**Lifecycle:** Created via attachments API with entity_type and entity_id; deleted when parent entity is deleted or explicitly; no soft delete.

**Constraints**

- entity_type must be exactly one of: project, screening, assessment, monitoring. Referential integrity to the referenced collection is enforced by application logic (e.g. project delete cascades to Attachment.deleteMany).

---

## AnnexItem

Standalone annex item: title and optional description. No relation to Project or other entities in schema.

**Fields**

| Name | Type | Nullable | Default | Constraints | Description |
|------|------|----------|---------|--------------|-------------|
| title | String | No | — | trim | Title. |
| description | String | Yes | — | trim | Description. |
| createdAt | Date | No | set by Mongoose | — | Set by timestamps. |
| updatedAt | Date | No | set by Mongoose | — | Set by timestamps. |

**Relationships:** none in schema.

**Lifecycle:** Created/updated/deleted via API that consumes this model; no soft delete.

---

## Relationship Map

```
JobTitle ──< User
Project ──< Screening, Assessment, MonitoringRecord, MitigationPlan, ManagementActivity, SempObjective
User ── referenced by: Screening (approved_by, reject_by, officer), Assessment (same), MonitoringRecord (responsible),
       MitigationPlan (responsible), ManagementActivity (responsible), SempAction (responsible), Attachment (uploaded_by)

SempObjective ──< SempTarget ──< SempAction
SempAction ── responsible ──> User

ImpactCategory ──< ImpactQuestion, Indicator
Assessment ──< AssessmentImpactScore, AssessmentMethod, CommunityConsultation
AssessmentImpactScore ── question ──> ImpactQuestion
MonitoringRecord ── project ──> Project, indicator ──> Indicator, responsible ──> User

Attachment: polymorphic (entity_type + entity_id) ──> Project | Screening | Assessment | MonitoringRecord
Attachment ── uploaded_by ──> User

AnnexItem: standalone (no refs)
```

---

## Key Invariants

1. **No soft delete** — All entities use hard delete. Deleted documents are removed from the database; cascade of attachments and child entities (screenings, assessments, etc.) is implemented in project service and related services, not by Mongoose schema hooks.
2. **Timestamps** — Every model uses `timestamps: true`; `createdAt` and `updatedAt` are set automatically. No model uses `versionKey` (no __v).
3. **ObjectId references** — All refs are `mongoose.Schema.Types.ObjectId` with `ref` set to the model name. MongoDB does not enforce referential integrity; orphaned refs are possible if deletes are done outside the intended services.
4. **Attachment entity_type** — Only `project`, `screening`, `assessment`, `monitoring` are valid. For `entity_type === "monitoring"`, `entity_id` is the MonitoringRecord _id.
5. **Workflow status** — Screening and Assessment share the same status enum: `draft`, `submitted`, `approved`, `rejected`. Default is `draft`.
6. **Impact/ranking enums** — The set `negligible`, `low`, `medium`, `high`, `not_applicable` is used in Assessment.total_project_impact, MonitoringRecord.ranking, and AssessmentImpactScore.level.
7. **User password** — Never stored in plain text; hashed with bcrypt on save. Never returned in toJSON().
8. **Lookups** — ImpactCategory, ImpactQuestion, Indicator, JobTitle are reference data; ImpactCategory.code aligns with Screening.category_code (A–F) by convention but is not enforced by schema.
