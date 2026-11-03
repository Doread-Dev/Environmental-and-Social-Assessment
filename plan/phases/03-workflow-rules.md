# Phase 3 — Workflow rules on the backend

**Goal:** the backend enforces the workflow; the frontend can no longer break it.

**Decisions:** D2, D12, D13, D14, D15, D16, D17, D18, D19, D53, D54, D55, D56, D57, D58.

## Tasks

### Order gates (D2, D12)
- `services/workflow.service.js` (port from v2, `backend/src/services/workflow.service.js`): Tool 2 needs Tool 1 approved; Tools 3/4 need Tool 2 approved; Tool 5 needs Tools 3 and 4 complete (≥1 row each, every row has its description). Any category A–F, including E, follows the same order.
- Call the gates in every create/update/delete of the gated tool (not in reads). Use 409 (or 403 as in v2 — pick one, document it in `CLAUDE.md`).

### Locking (D13, D14, D15)
- Screening/assessment: update and child edits (methods, consultations, scores, calculate) allowed only in `draft` or `rejected`. `submitted`/`approved` → 409. No reopen.
- SEMP tables (Tools 3, 4) and Monitoring: always editable once unlocked.
- Project metadata: always editable.

### Status history (D16)
- `status_history: [{ status, by, at, note? }]` on screening and assessment, appended by the transition endpoints (and on create). Returned populated with user names.

### Project delete / archive (D17)
- `DELETE /projects/:id`: hard delete only if nothing in the project is approved; otherwise 409 with a hint to archive.
- `PATCH /projects/:id/archive` and `/restore`; `archived` flag (+ who/when). Archived projects: hidden from default lists (`?archived=true` to list them), read-only (all writes → 409).
- Roles: `admin`, `environmental_specialist`.

### Uniqueness (D18, D58)
- Unique indexes: screening per project, assessment per project, score per (assessment, question), monitoring record per (project, indicator). Duplicate create → 409 (port v2's checks in `screening.service.js` / `assessment.service.js`).
- Scores must reference real `ImpactQuestion`s; no duplicate question in one payload (port from v2 `assessment.service.js`).

### Assessment behavior (D53, D54)
- On create: prefill once — `project_activity` ← project `project_component`; `potential_negative_impact` / `potential_positive_impact` ← approved screening. Only when the field is empty in the payload.
- On create: insert all 50 scores as `negligible`. Recalculate `total_project_impact` automatically whenever scores change (no separate calculate call needed; keep the endpoint or remove it — decide and document).
- Submit requires all distinct questions to have a level (always true with the default, kept as a safety check).
- `project_activity` and `description` stay required (D57).

### Responsible (D55)
- `responsible_text` on management activity, mitigation plan, monitoring record. User **or** text, never both (400 if both). Port `normalizeResponsibility` from v2 services, but in one shared helper, not three copies.

### Validation (D56, D57, D19)
- Screening approve: recommendations optional.
- Remove every minimum-length rule (backend validators). Required stays required. Password policy is security, not a text-length rule — keep it.
- Monitoring values and `total`: free text, never parsed.

## Tests
- Each gate: blocked before prerequisite, allowed after (incl. category E).
- Edits on submitted/approved → 409; rejected → editable again.
- Status history entries with user + time.
- Delete with approved content → 409; archive/restore; archived project writes → 409; hidden from list.
- Duplicate screening/assessment/monitoring → 409.
- New assessment has 50 negligible scores, prefilled fields, total impact = negligible; changing one score to high → total high.
- Responsible user vs text rules.

## Frontend (minimal)
- Remove min-length checks in `ScreeningFormPage`, `ScreeningSummaryPage` (recommendations), `AssessmentMetadataPage`, `AssessmentScoringPage` (D57).
- Scoring page shows the backend defaults (all Negligible) — full UI work in phase 8.
- Show 409 messages from the backend through `extractErrorMessage`.

## Done when
- [ ] Tests pass; the whole workflow works in the browser; demo seed adapted (no manual scores needed for unchanged questions).
- [ ] `CLAUDE.md` describes gates, locking, archive, history.

## Out of scope
Aggregate endpoints (phase 4), UI redesign.

## Found during phase
