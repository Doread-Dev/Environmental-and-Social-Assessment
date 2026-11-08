# Data models

MongoDB through Mongoose 8, one file per entity in [`backend/src/models/`](../backend/src/models).
Conventions: snake_case fields, `timestamps: true` (`createdAt`, `updatedAt`), `versionKey: false`,
references as `ObjectId` + `ref`. No real data exists yet (DECISIONS context): schemas change
without migrations. Impact levels everywhere: `negligible | low | medium | high | not_applicable`.

## Overview

```
User ──(job_title)──> JobTitle
Project ─┬─ Screening (1)            status_history[]
         ├─ Assessment (1) ─┬─ AssessmentMethod (n)
         │                  ├─ CommunityConsultation (n)
         │                  └─ AssessmentImpactScore (1 per ImpactQuestion)
         ├─ ManagementActivity (n)     Tool 3
         ├─ MitigationPlan (n)         Tool 4
         ├─ MonitoringRecord (1 per Indicator)   Tool 5
         ├─ TableRevision (1 per table: management, mitigation, monitoring)
         └─ ProjectFile (n)
ImpactCategory ─┬─ ImpactQuestion (n)
                └─ Indicator (n)
LibraryDocument (organisation, not per project)
AuditLog (append-only, survives deletes)
```

Deleting or purging a project removes every record and file under it (`removeProjectData`); audit
entries stay.

## Users and lookups

**User** (`user.model.js`): `name`*, `email`* (unique, lowercase), `password`* (bcrypt hash, set in a
pre-save hook; never returned — `toJSON` drops it), `job_title` → JobTitle, `role` (one of
[the six roles](roles-and-permissions.md), default `viewer`), `is_active` (default true; users are
deactivated, never deleted, D4), `must_change_password` (D22).

Lookups, filled by `npm run seed` (`src/db/seed.js`, upsert by a stable key, safe to re-run):

| Model | Fields | Key |
|---|---|---|
| **ImpactCategory** | `code`* (A–F, H, J; unique), `name`* (unique), `name_ar` (unused in the UI) | `code` |
| **ImpactQuestion** | `category`* → ImpactCategory, `question_text`*, `question_text_ar` | question text |
| **Indicator** | `category`* → ImpactCategory, `name`*, `definition`*, `measurement`* | name |
| **JobTitle** | `title_name`* (unique) | name |

## Projects and Tools 1–2

**Project**: `title`*, `location`*, `start_date`*, `end_date`* (end never before start, D74 1),
`project_component`, `archived` (default false), `archived_by` → User, `archived_at`.

**Screening** (Tool 1; unique per project): `project`*, `category_code`* (`A`–`F`),
`category_reason`*, `potential_negative`, `potential_positive`, `screening_date` (default now),
`status` (`draft | submitted | approved | rejected`, default `draft`), `officer` → User (set on create
and submit), `approved_by` → User, `recommendations`, `reject_by` → User, `reject_reason`,
`status_history[]`.

**Assessment** (Tool 2; unique per project): `project`*, `project_activity`, `description`,
`environmental_setting`, `legal_requirements` (all four required at submit, D74 2),
`potential_negative_impact`, `potential_positive_impact`, `total_project_score` (`{ negligible, low,
medium, high, not_applicable }` counts) and `total_project_impact` (highest level) — both computed by
the server — and the same status / officer / review fields and `status_history[]` as Screening.

- **AssessmentMethod**: `assessment`*, `method_type`*, `details`.
- **CommunityConsultation**: `assessment`*, `type`*, `participants`, `notes`.
- **AssessmentImpactScore**: `assessment`*, `question`* → ImpactQuestion, `level`*, `note`; unique
  per (assessment, question); one `negligible` score per question is created with the assessment
  (D54).

**status_history** entry (`statusHistory.schema.js`): `status`* (`created | submitted | approved |
rejected`), `by` → User, `at` (default now), `note` (the reject reason).

## Tools 3–5

All three take `responsible` → User **or** `responsible_text` (an external party), never both (D55).

**ManagementActivity** (Tool 3): `project`*, `serial_number`, `activity_description`*,
`potential_impact`, `recommended_actions` (text or list of texts), `monitoring_requirements`,
`responsible`, `responsible_text`, `notes`.

**MitigationPlan** (Tool 4): `project`*, `serial_number`, `output_description`*,
`potential_impact_and_significance`, `mitigation_and_enhancement_measures`, `monitoring`,
`schedule`, `responsible`, `responsible_text`, `notes`.

**MonitoringRecord** (Tool 5; unique per (project, indicator)): `project`*, `indicator`* →
Indicator, `scores` (`baseline`, `Q1`–`Q4`: free text, never parsed, D57), `total` (free text),
`final_assessment`, `ranking` (an impact level, empty until picked, D69), `responsible`,
`responsible_text`, `note`.

**TableRevision** (D62, D73): `project`*, `table`* (`management | mitigation | monitoring`),
`revision`* (0 before the first save); unique per (project, table). The `version` the Tools 3–5
GETs return and the bulk saves check.

## Files and library

**ProjectFile** (D47, D64 d): `project`*, `area`* (`documents`; `semp_record` modelled, closed until
v3), `category` (documents: a project-workflow place key or `other`; `semp_record`: one of 11
categories or null), `original_name`* (display only), `stored_name`* (`<uuid>.<ext>`, unique),
`mime_type`* (from the extension), `size`*, `uploaded_by`* → User. Stored at
`<UPLOADS_DIR>/<project id>/<stored_name>`.

**LibraryDocument** (D64 b): `title`* (≤ 200), `description` (≤ 2,000), `places` (place keys from
`config/places.js`; empty = general), `order` (≥ 0), `original_name`*, `stored_name`*
(`<uuid>.pdf`, unique), `mime_type`*, `size`*, `uploaded_by`* → User, `updated_by` → User. Stored
at `<UPLOADS_DIR>/library/<stored_name>`.

## Audit log

**AuditLog** (D65): `action`* (one of the 14 logged actions, see
[workflow rules](workflow-rules.md#critical-actions-log-d65)), `by`* → User with copied `by_name`*
and `by_role`*, `project` → Project with copied `project_title`, `target_type`* (`project | file |
library_document | management_activity | mitigation_plan | user`), `target_id`, `target_label`
(copied), `snapshot` (the record as it was), `details`, `createdAt`. Only `audit.service.record()`
writes it (a test fails if another module loads the model); keys matching
password/token/hash/secret are dropped; no endpoint edits or deletes entries.

## Indexes

Unique: Screening and Assessment per `project`; AssessmentImpactScore per (`assessment`,
`question`); MonitoringRecord per (`project`, `indicator`); TableRevision per (`project`, `table`);
`stored_name` of ProjectFile and LibraryDocument; User `email`; lookup keys. Others: AuditLog by
`createdAt`, (`action`, `createdAt`), (`project`, `createdAt`); ProjectFile by (`project`, `area`,
`createdAt`); LibraryDocument by `places` and (`order`, `title`).
