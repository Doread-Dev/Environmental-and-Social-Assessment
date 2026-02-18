# Hooks and Utilities

This document describes the frontend custom hooks and utility modules used by the ESMS application. Hooks encapsulate project-scoped data loading and mutations; utilities provide constants, formatters, validators, and workflow derivation.

---

## Overview

Hooks live in `frontend/src/hooks/` and are re-exported from `frontend/src/hooks/index.js`. Utils live in `frontend/src/utils/` with a barrel at `frontend/src/utils/index.js`. Domain hooks (`useProjects`, `useScreening`, `useAssessment`, `useSemp`, `useMonitoring`, `useWorkflow`) take a `projectId` (or none for `useProjects`) and return loading/error state plus data and actions. Workflow status is derived on the frontend from entity data (screening, assessment, SEMP, monitoring) via `@/utils/workflowDerivation`.

**Constraints**

- Domain hooks that accept `projectId` do nothing when `projectId` is falsy (no API calls, empty data).
- Save actions return `{ success: boolean, data?: Object, error?: string }`. Callers must check `success` before relying on `data`.

---

## useProjects

**Purpose:** Manages the project list and project CRUD. Fetches projects and enriches each with screening, assessment, SEMP, and monitoring data to derive workflow and project status.

**Signature:** `useProjects()` — no arguments.

**Returned state**


| Property    | Type            | Description                                                                                   |
| ----------- | --------------- | --------------------------------------------------------------------------------------------- |
| `projects`  | `Array`         | List of projects, each with `screening`, `assessment`, `workflow`, `projectStatus` (derived). |
| `isLoading` | `boolean`       | True while initial fetch or refetch is in progress.                                           |
| `error`     | `string | null` | Last error message from fetch or CRUD.                                                        |


**Returned actions**


| Method           | Signature                                                           | Description                                                          |
| ---------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `fetchProjects`  | `() => Promise<void>`                                               | Fetches all projects and workflow data; updates `projects`, `error`. |
| `createProject`  | `(data: Object) => Promise<{ success, data?, error? }>`             | Creates project via API; prepends enhanced project to `projects`.    |
| `updateProject`  | `(id: string, data: Object) => Promise<{ success, data?, error? }>` | Updates project; preserves existing workflow on the updated item.    |
| `deleteProject`  | `(id: string) => Promise<{ success, error? }>`                      | Deletes project and removes it from `projects`.                      |
| `getProjectById` | `(id: string) => Object | undefined`                                | Returns project from current `projects` by ID.                       |


**Data flow:** On mount, `fetchProjects` runs. It calls `projectService.getAll()`, `screeningService.getAll()`, `assessmentService.getAll()`, then per project `sempService.getManagementActivities`, `sempService.getMitigationPlans`, `monitoringService.getByProject`. Results are merged with `enhanceProjectWithWorkflow` (uses `deriveWorkflowStatus` and `calculateProjectStatusFromWorkflow` from `@/utils/workflowDerivation`). The hook subscribes to the `monitoring-data-updated` window event and refetches projects when it fires.

**Invariants**

- `projects` items always include `workflow` and `projectStatus` (derived; not stored on backend).
- New project from `createProject` has `screening: null`, `assessment: null`, empty SEMP/monitoring in derivation.

---

## useScreening

**Purpose:** Loads and mutates the single screening record for a project (Tool 1). Supports draft, submit, approve, and reject.

**Signature:** `useScreening(projectId: string)`.

**Returned state**


| Property    | Type            | Description                                                                |
| ----------- | --------------- | -------------------------------------------------------------------------- |
| `screening` | `Object | null` | The screening document for the project, or null if none or not loaded.     |
| `isLoading` | `boolean`       | True while loading.                                                        |
| `isSaving`  | `boolean`       | True while a mutation (saveDraft, submit, approve, reject) is in progress. |
| `error`     | `string | null` | Last error message.                                                        |


**Returned actions**


| Method      | Signature                                                        | Description                                                                                            |
| ----------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `refetch`   | `() => void`                                                     | Triggers reload (same as loadData).                                                                    |
| `saveDraft` | `(data: Object) => Promise<{ success, data?, error? }>`          | Creates or updates with `status: 'draft'`. For create, requires `category_code` and `category_reason`. |
| `submit`    | `(data: Object) => Promise<{ success, data?, error? }>`          | Creates or updates with `status: 'submitted'`.                                                         |
| `approve`   | `(recommendations: any) => Promise<{ success, data?, error? }>`  | Calls `screeningService.approve(screening._id, recommendations)`. Requires existing screening.         |
| `reject`    | `(rejectReason?: string) => Promise<{ success, data?, error? }>` | Calls `screeningService.reject(screening._id, rejectReason)`. Requires existing screening.             |


**Invariants**

- If `projectId` is falsy, `loadData` resolves without calling the API and `screening` stays null.
- All mutations require a valid `screening._id` for update/approve/reject; create is used when there is no screening.

---

## useAssessment

**Purpose:** Loads and mutates the environmental assessment for a project (Tool 2): assessment document, methods, consultations, and impact scores. Depends on `useLookups` (categories/questions) and `useAuth` (user for create).

**Signature:** `useAssessment(projectId: string)`.

**Returned state**


| Property                  | Type            | Description                                              |
| ------------------------- | --------------- | -------------------------------------------------------- |
| `assessment`              | `Object | null` | Assessment document.                                     |
| `methods`                 | `Array`         | Assessment methods for this assessment.                  |
| `consultations`           | `Array`         | Community consultations.                                 |
| `impactScores`            | `Array`         | Impact scores (normalized: `question` as ID).            |
| `categoriesWithQuestions` | `Array`         | From LookupContext; used for scoring UI.                 |
| `lookupsLoading`          | `boolean`       | From LookupContext.                                      |
| `isLoading`               | `boolean`       | True while assessment/methods/consultations/scores load. |
| `isSaving`                | `boolean`       | True during any mutation.                                |
| `error`                   | `string | null` | Last error.                                              |


**Returned actions**


| Method                  | Signature                                                  | Description                                                             |
| ----------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------- |
| `refetch`               | `() => void`                                               | Reloads assessment and related data.                                    |
| `startAssessment`       | `() => Promise<{ success, data?, error? }>`                | Creates assessment in backend (draft) if none; no-op if already exists. |
| `saveMetadata`          | `(data: Object) => Promise<...>`                           | Creates or updates assessment metadata.                                 |
| `saveMethods`           | `(newMethods: Array) => Promise<...>`                      | Replaces methods via `assessmentService.setMethods`.                    |
| `saveConsultations`     | `(newConsultations: Array) => Promise<...>`                | Replaces consultations via `assessmentService.setConsultations`.        |
| `saveImpactScores`      | `(scores, negativeImpact, positiveImpact) => Promise<...>` | Saves scores, updates impact fields, optionally runs calculate.         |
| `saveImpactScoresDraft` | Same                                                       | Same as saveImpactScores, used for draft save.                          |
| `submitAssessment`      | `() => Promise<...>`                                       | Sets assessment `status: 'submitted'`.                                  |
| `approveAssessment`     | `(recommendations) => Promise<...>`                        | Calls `assessmentService.approve`.                                      |
| `rejectAssessment`      | `(rejectReason?: string) => Promise<...>`                  | Calls `assessmentService.reject`.                                       |


**Invariants**

- `impactScores` are normalized so `score.question` is always an ID string (populated object from API is converted).
- Load runs when `projectId` or `user?._id` changes; if no assessment exists, `assessment`, `methods`, `consultations`, `impactScores` are null/empty.

---

## useSemp

**Purpose:** Manages SEMP data for a project: Management Activities (Tool 3) and Mitigation Plans (Tool 4). All edits are local until the user clicks Save; then create/update/delete are sent to the API in parallel.

**Signature:** `useSemp(projectId: string)`.

**Returned state**


| Property               | Type            | Description                                                    |
| ---------------------- | --------------- | -------------------------------------------------------------- |
| `managementActivities` | `Array`         | Rows for Tool 3; new rows have `_isNew`, edited have `_dirty`. |
| `mitigationPlans`      | `Array`         | Rows for Tool 4; same flags.                                   |
| `isLoading`            | `boolean`       | True while loading activities and plans.                       |
| `isSaving`             | `boolean`       | True during saveManagementActivities or saveMitigationPlans.   |
| `error`                | `string | null` | Last error.                                                    |


**Returned actions (Management Activities)**


| Method                                          | Description                                                                                                     |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `addManagementActivity`                         | Appends a new row with temp ID, `_isNew: true`, `activity_description: ''`.                                     |
| `updateManagementActivity(rowId, field, value)` | Updates local state, sets `_dirty: true`.                                                                       |
| `deleteManagementActivity(rowId)`               | Removes from list; if row was persisted, adds ID to deleted list for API on save.                               |
| `saveManagementActivities`                      | Validates required `activity_description`; runs deletes, creates, updates in parallel; then refetches from API. |


**Returned actions (Mitigation Plans)**


| Method                                      | Description                                                         |
| ------------------------------------------- | ------------------------------------------------------------------- |
| `addMitigationPlan`                         | Appends new row with `output_description: ''`.                      |
| `updateMitigationPlan(rowId, field, value)` | Local update, `_dirty: true`.                                       |
| `deleteMitigationPlan(rowId)`               | Same pattern as management activities.                              |
| `saveMitigationPlans`                       | Validates `output_description`; deletes/creates/updates; refetches. |


**Returned status helpers**


| Method             | Returns                                       | Description                                       |
| ------------------ | --------------------------------------------- | ------------------------------------------------- |
| `getTool3Status()` | `'not_started' | 'in_progress' | 'completed'` | Based on presence and completeness of activities. |
| `getTool4Status()` | Same                                          | Based on mitigation plans.                        |
| `getSempStatus()`  | `'pending' | 'in_progress' | 'completed'`     | Combined Tool 3 + Tool 4.                         |


**Invariants**

- Payloads sent to API normalize `project` and `responsible` to ID strings; empty `responsible` is omitted.
- After save, data is refetched from API and internal `_isNew`/`_dirty`/deleted-id lists are cleared.

---

## useMonitoring

**Purpose:** Manages monitoring records (Tool 5) per project. Uses LookupContext for impact categories and indicators. Records can be existing or placeholders (`_id` starting with `placeholder_`); edits are local until Save.

**Signature:** `useMonitoring(projectId: string)`.

**Returned state**


| Property    | Type            | Description                                                                                                           |
| ----------- | --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `records`   | `Array`         | Monitoring records; placeholders for new rows have `_id: 'placeholder_<indicatorId>'`, `isNew: true`, `_dirty: true`. |
| `isLoading` | `boolean`       | True while loading records or lookups.                                                                                |
| `isSaving`  | `boolean`       | True during saveAllRecords.                                                                                           |
| `error`     | `string | null` | Last error.                                                                                                           |


**Returned actions**


| Method                                                       | Signature                                        | Description                                                                                                 |
| ------------------------------------------------------------ | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `refetch`                                                    | `() => void`                                     | Reloads records.                                                                                            |
| `updateQuarterScore(recordId, quarter, value, indicatorId?)` |                                                  | Updates one quarter in `scores`; creates placeholder record if none for that indicator.                     |
| `updateRecordField(recordId, field, value, indicatorId?)`    |                                                  | Updates any field (e.g. total, final_assessment, responsible, note); creates placeholder if needed.         |
| `addRecord(indicatorId)`                                     |                                                  | Adds a placeholder record for the indicator.                                                                |
| `saveAllRecords`                                             | `() => Promise<{ success, error? }>`             | Creates placeholders and updates dirty records; then refetches and dispatches `monitoring-data-updated`.    |
| `getCategoryData(categoryCode)`                              | `(code: string) => Array<{ indicator, record }>` | Pairs each indicator in the category with its record (or placeholder).                                      |
| `getAllCategoryStats()`                                      | `() => Array`                                    | For each impact category, returns completed/total counts and status (Not Started / In Progress / Complete). |


**Invariants**

- `recordMap` (internal) keys are indicator IDs; placeholders use `placeholder_<indicatorId>` as `_id`.
- On save, `responsible` is sent as user ID or omitted; backend receives normalized payloads. After save, the hook refetches and fires `monitoring-data-updated` so `useWorkflow` / `useProjects` can refresh.

---

## useWorkflow

**Purpose:** Derives the workflow status for a project from screening, assessment, SEMP (management activities + mitigation plans), and monitoring. Used by project workspace and progress UIs.

**Signature:** `useWorkflow(projectId: string)`.

**Returned shape**


| Property                                                                    | Type            | Description                                                                                                |
| --------------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------- |
| `workflow`                                                                  | `Object`        | `{ screening, assessment, semp, monitoring }` — each step has `status`, `tool`/`tools`, optional `locked`. |
| `nextAction`                                                                | `Object`        | `{ tool, path, title, description }` — next step for the user.                                             |
| `projectStatus`                                                             | `string`        | `'draft' | 'in_progress' | 'monitoring' | 'needs_action' | 'completed'`.                                   |
| `isLoading`                                                                 | `boolean`       | True if any of screening, assessment, SEMP, or monitoring load is in progress.                             |
| `screening`                                                                 | `Object | null` | Raw screening entity.                                                                                      |
| `assessment`                                                                | `Object | null` | Raw assessment entity.                                                                                     |
| `managementActivities`                                                      | `Array`         | Raw Tool 3 data.                                                                                           |
| `mitigationPlans`                                                           | `Array`         | Raw Tool 4 data.                                                                                           |
| `monitoringRecords`                                                         | `Array`         | Raw Tool 5 data.                                                                                           |
| `screeningLoading`, `assessmentLoading`, `sempLoading`, `monitoringLoading` | `boolean`       | Per-source loading.                                                                                        |


**Data flow:** Uses `useScreening(projectId)` and `useAssessment(projectId)`; fetches SEMP and monitoring via `api.get` (`/management/project/:id`, `/mitigation/project/:id`, `/monitoring/project/:id`). Listens to `monitoring-data-updated` and refetches monitoring when `event.detail.projectId === projectId`. Workflow is computed with `deriveWorkflowStatus` from `@/utils/workflowDerivation`; `nextAction` and `projectStatus` from `getNextAction` and `calculateProjectStatusFromWorkflow`.

---

## useWorkflowLight

**Purpose:** Lighter variant that only uses screening and assessment to derive workflow (SEMP and monitoring set to empty). Use in list or summary views where full SEMP/monitoring data is not needed.

**Signature:** `useWorkflowLight(projectId: string)`.

**Returned shape:** `{ workflow, isLoading, screening, assessment }` — no `nextAction`, `projectStatus`, or raw SEMP/monitoring. `workflow.semp` and `workflow.monitoring` are derived with empty arrays, so their statuses stay pending/locked as appropriate.

**Invariants**

- `useWorkflow` and `useWorkflowLight` both use `deriveWorkflowStatus` from `@/utils/workflowDerivation`; step order and locking rules are defined there (screening → assessment → SEMP → monitoring).

---

## Utils Index

The barrel `frontend/src/utils/index.js` re-exports:

- `cn` from `./cn`
- All from `./validators`
- All from `./formatters`
- All from `./constants`
- All from `./categoryIcons`
- All from `./projectStatus`
- All from `./impactCalculations`
- All from `./workflowDerivation`

Other utils are imported by path (e.g. `@/utils/workflowStatuses`, `@/utils/screeningDisplay`, `@/utils/annexTypes`, `@/utils/formatFileSize`, `@/utils/attachmentsHelpers`, `@/utils/rankingHelp`, `@/utils/assessmentMethods`, `@/utils/excelExport`).

---

## cn

**File:** `frontend/src/utils/cn.js`.

**Signature:** `cn(...inputs) => string`.

**Purpose:** Merges Tailwind CSS class names. Uses `clsx` for conditionals and `tailwind-merge` to resolve conflicts. Typical usage: `cn('base', isActive && 'active', className)`.

---

## constants

**File:** `frontend/src/utils/constants.js`.

**Exports:** `APP_NAME`, `APP_SHORT_NAME`, `APP_ORGANIZATION`, `THEME_STORAGE_KEY`, `THEMES` (LIGHT, DARK, SYSTEM), `RISK_CATEGORIES` (A–F with label, description, color), `WORKFLOW_STEPS` (SCREENING–MONITORING with id, label, order), `BREAKPOINTS` (SM–2XL), `ANIMATION` (FAST, NORMAL, SLOW).

---

## formatters

**File:** `frontend/src/utils/formatters.js`.

**Exports:** `formatDate(date, options?)`, `calculateDurationMonths(startDate, endDate)`, `formatDateRange(startDate, endDate)`, `formatDateFull(date)`, `formatDateShort(date)`, `formatDuration(months)`, `truncateText(text, maxLength?)`. Dates use `toLocaleDateString('en-US', ...)`.

---

## validators

**File:** `frontend/src/utils/validators.js`.

**Exports:** `validateEmail(email)`, `validatePassword(password)`, `validateProjectTitle(title)`, `validateLocation(location)`, `validateProjectDescription(description)`, `validateDates(startDate, endDate)`, `validateProjectForm(formData)`. Each returns a validation result (e.g. error string or validity); `validateProjectForm` aggregates project form fields.

---

## workflowDerivation

**File:** `frontend/src/utils/workflowDerivation.js`.

**Purpose:** Derives workflow status from entity data (backend does not store workflow on project). Used by `useWorkflow`, `useWorkflowLight`, and `useProjects`.

**Exports**

- `WORKFLOW_STATUS`: pending, draft, in_progress, submitted, approved, rejected, completed, needs_action.
- `deriveScreeningStatus(screening)` → `{ status, tool: 1 }`.
- `deriveAssessmentStatus(assessment, screening)` → `{ status, tool: 2, locked? }` (locked if screening not approved).
- `deriveSempStatus(managementActivities, mitigationPlans, assessment)` → `{ status, tools: [3,4], locked? }` (locked if assessment not approved).
- `deriveMonitoringStatus(monitoringRecords, sempStatus)` → `{ status, tool: 5, locked? }` (locked if SEMP not completed).
- `deriveWorkflowStatus({ screening, assessment, managementActivities, mitigationPlans, monitoringRecords })` → `{ screening, assessment, semp, monitoring }` (each step object).
- `isStepAccessible(stepId, workflow)`, `isStepCompleted(stepId, workflow)`.
- `getNextAction(workflow)` → `{ tool, path, title, description }`.
- `calculateProjectStatusFromWorkflow(workflow)` → `'draft' | 'in_progress' | 'monitoring' | 'needs_action' | 'completed'`.

**Invariants**

- Step order: 1 Screening → 2 Assessment → 3–4 SEMP → 5 Monitoring. Each step can be `locked` until the previous is completed/approved.
- SEMP is completed when both management activities and mitigation plans exist and all required description fields are non-empty.

---

## workflowStatuses

**File:** `frontend/src/utils/workflowStatuses.js` (not in barrel).

**Exports:** `WORKFLOW_TOOLS` (SCREENING, ASSESSMENT, SEMP, MONITORING with key, number(s), label, labelAr), `workflowStepStatuses` (pending, draft, in_progress, submitted, approved, rejected, completed, needs_action with key, label, labelAr, color, textColor, isComplete), `mapBackendStatusToDisplay(backendStatus, toolKey)`, `projectStatuses` (draft, in_progress, monitoring, needs_action, completed with key, label, labelAr, bgColor, textColor, borderColor, dotColor).

---

## screeningDisplay

**File:** `frontend/src/utils/screeningDisplay.js` (not in barrel).

**Exports:** `screeningCategories` (A–F with code, label, labelAr, description, bgColor, textColor, borderColor, requiresAssessment, canProceed), `screeningStatuses` (display config for screening statuses), `getScreeningCategory(code)`.

---

## Other utils (brief)

- **annexTypes:** `annexItems` (list of annex file categories), `getAnnexItemById(id)`.
- **assessmentMethods:** `ASSESSMENT_METHOD_TYPES`, `assessmentMethods`, `CONSULTATION_METHOD_TYPES`, `consultationMethods`.
- **categoryIcons:** `CATEGORY_ICONS`, `getCategoryIcon(code)`.
- **projectStatus:** `DEFAULT_WORKFLOW`, `createDefaultWorkflow()`, `calculateProjectStatus(workflow)`, `calculateSempStatus(...)`, `calculateMonitoringStatus(quarters)`.
- **impactCalculations:** `PRIORITY_LEVELS`, `calculateTotalImpact(totalScore)`, `getCategoryHighestLevel(scores, categoryQuestions)`, `calculateTotalScore(scores)`.
- **formatFileSize:** `formatFileSize(bytes)`.
- **attachmentsHelpers:** `groupAttachmentsByType(attachments)`.
- **rankingHelp:** `RANKING_HELP`, `getRankingDisplayLabel(...)`.
- **excelExport (folder):** `exportScreening`, `exportAssessment`, `exportManagementActivities`, `exportMitigationPlan`, `exportMonitoring`, plus `excelBase` helpers (createWorkbook, styles, headers, borders, saveWorkbook, formatDate, etc.).

---

## Key Invariants

- **Hooks:** All project-scoped hooks are idempotent when `projectId` is missing: no fetch, no side effects, empty or null data.
- **Workflow:** Single source of truth for derivation is `workflowDerivation.js`; hooks and `useProjects` use it consistently. Display labels and colors come from `workflowStatuses.js` and `screeningDisplay.js`.
- **SEMP / Monitoring:** Local edits are flushed only on explicit Save; new rows use temp or placeholder IDs until saved. After save, data is refetched from the API.
- **Utils barrel:** Only a subset of utils is re-exported from `@/utils`; workflowStatuses, screeningDisplay, annexTypes, excelExport, and others are imported by full path where needed.

