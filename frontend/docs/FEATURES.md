# Frontend Features

This document describes the main user-facing features of the ESMS frontend: screening workflow, assessment workflow, SEMP (Tools 3 & 4), monitoring (Tool 5), annex and project files, Excel export, and settings. Each section is self-contained; routing and state are covered in ROUTING_AND_PAGES and STATE_AND_CONTEXTS.

---

## Screening Workflow

Screening (Tool 1) is the first step in the project workflow. The frontend lets users create or edit a screening, submit it for approval, and—if the user has approval permission—approve or reject it. Workflow state is driven by the screening entity’s `status` and by a router that chooses between the form and the summary view.

**Entry:** Route `/app/projects/:projectId/screening` is rendered by `ScreeningRouter` (see `src/pages/project-workspace/screening/ScreeningRouter.jsx`). There is no route guard; any authenticated user in the project workspace can open screening.

**Routing logic (ScreeningRouter):**

- No screening exists, or `screening.status === 'draft'` → render `ScreeningFormPage`.
- Query `edit=true` and `screening.status === 'rejected'` → render `ScreeningFormPage` (edit after rejection).
- All other cases (`submitted`, `rejected` without edit, `approved`) → render `ScreeningSummaryPage`.

**ScreeningFormPage:** Form with three sections: (1) Screening Information (date), (2) Project Risk Category (A–F plus justification), (3) Potential Impacts (negative and positive text). Client-side validation enforces required fields and minimum lengths (e.g. justification ≥ 50 characters). Actions: **Save as Draft** (calls `useScreening.saveDraft`) and **Submit Screening** (confirmation modal, then `submitScreening` and redirect to `/app/projects/:projectId/screening/summary`). Data is loaded and saved via `useScreening(projectId)` and `screeningService` (getByProject, create, update).

**ScreeningSummaryPage:** Read-only summary of the screening. Shows status badge (submitted / approved / rejected / draft), category, officer, recommendations, and potential impacts. Actions depend on status and role:

- **Submitted:** If `canApprove` (from AuthContext), show Approve (with recommendations text) and Reject (with reason).
- **Rejected:** Show **Edit** (navigate to `/app/projects/:projectId/screening?edit=true`).
- **Approved:** Show **Proceed to Assessment** and **Export** (Excel). The layout can trigger export via the custom event `screening-export`; the page listens and calls `exportScreeningToExcel(project, screening)`.

**Screening status values:** `draft`, `submitted`, `approved`, `rejected`. The backend owns these; the frontend does not define new statuses.

**Constraints**

- Screening is not guarded by workflow; Assessment, SEMP, and Monitoring are unlocked only after screening is approved (see Assessment Workflow and SEMP).
- Approve/Reject are only shown when `useAuth().canApprove` is true and status is `submitted`.
- All screening API calls use the shared `api` client and `screeningService` (create, update, approve, reject, getByProject).

---

## Assessment Workflow

Assessment (Tool 2) runs after screening is approved. The frontend implements a linear flow: gateway → metadata → methods → scoring → review, with route guards ensuring screening is approved before any assessment route.

**Guards:** `AssessmentRouteGuard` wraps all `/app/projects/:projectId/assessment` routes. It uses `useScreening(projectId)`; if `screening?.status !== 'approved'`, it redirects to `/app/projects/:projectId/screening`. No role restriction—only the screening gate.

**Entry and routing (AssessmentRouter):** At `/app/projects/:projectId/assessment`, `AssessmentRouter` decides:

- Screening not approved → “Complete Screening First” message (no redirect; guard already ensures approved when this runs).
- No assessment document → `AssessmentGatewayPage` (start assessment).
- Assessment exists and `status` is `draft` → `AssessmentGatewayPage` (continue).
- Assessment `status` in `['submitted', 'approved', 'rejected']` → `AssessmentReviewPage`.

**Steps (routes and pages):**


| Step     | Route suffix           | Page                   | Purpose                                                      |
| -------- | ---------------------- | ---------------------- | ------------------------------------------------------------ |
| Gateway  | `/assessment`          | AssessmentGatewayPage  | Start or continue; links to metadata/methods/scoring/review  |
| Metadata | `/assessment/metadata` | AssessmentMetadataPage | Project activity, description, officer, etc.                 |
| Methods  | `/assessment/methods`  | AssessmentMethodsPage  | Environmental assessment methods and community consultations |
| Scoring  | `/assessment/scoring`  | AssessmentScoringPage  | Impact scores by category/question and narrative impacts     |
| Review   | `/assessment/review`   | AssessmentReviewPage   | Read-only summary; Submit / Approve / Reject                 |


**Data and actions:** `useAssessment(projectId)` exposes: `assessment`, `methods`, `consultations`, `impactScores`, `categoriesWithQuestions` (from LookupContext), and actions `startAssessment`, `saveMetadata`, `saveMethods`, `saveConsultations`, `saveImpactScores` / `saveImpactScoresDraft`, `submitAssessment`, `approveAssessment`, `rejectAssessment`. Assessment is created via `assessmentService.create`; methods, consultations, and scores via assessmentService sub-resources. Submit sets `status: 'submitted'`; approve/reject call backend PATCH endpoints.

**Assessment status values:** `draft`, `submitted`, `approved`, `rejected`. Workflow derivation (e.g. in `useWorkflow`) uses these to compute project status and next action.

**Constraints**

- Assessment routes are not reachable until screening is approved (AssessmentRouteGuard).
- SEMP and Monitoring guards require assessment approved (see SEMP and Monitoring).
- Review page shows Approve/Reject only when `canApprove` and status is `submitted`.

---

## SEMP

SEMP covers Tool 3 (Management Activities) and Tool 4 (Mitigation Plan). The frontend provides an overview page and two full-width tool pages; access is gated until the assessment is approved.

**Guards:** `SempRouteGuard` wraps `/app/projects/:projectId/semp` and its children. It redirects to screening if screening is not approved, and to assessment if `assessment?.status !== 'approved'`. No SEMP-specific role.

**Routes:**

- `/app/projects/:projectId/semp` → `SempOverviewPage` (inside ProjectLayout).
- `/app/projects/:projectId/semp/activities` → `ManagementActivitiesPage` (inside SempFullWidthLayout).
- `/app/projects/:projectId/semp/mitigation` → `MitigationPlanPage` (inside SempFullWidthLayout).

**SempOverviewPage:** Title “Environmental & Social Management Plan”, subtitle “Management, mitigation, and monitoring actions”. If assessment is not approved, a lock banner is shown and the tool cards are disabled; “Go to Assessment” navigates to assessment. Two cards: **Tool 3 – Management Activities** and **Tool 4 – Management & Mitigation**. Each card shows status (`not_started`, `in_progress`, `completed`) from `useSemp(projectId).getTool3Status()` / `getTool4Status()` and navigates to the corresponding sub-route.

**ManagementActivitiesPage (Tool 3):** Table of management activities. Columns: #, Activity Description, Potential Impact / Risk, Recommended Action Items, Monitoring Requirements, Responsibility (user select), Notes. Rows are editable via `ManagementActivitiesTable` and `useSemp`: `addManagementActivity`, `updateManagementActivity`, `deleteManagementActivity`, `saveManagementActivities`. New rows get a temporary `_id` (e.g. `temp_...`); save sends creates/updates/deletes to the backend and refetches. Export is triggered by the custom event `semp-export` with `event.detail.toolType === 'tool3'`; the page calls `exportManagementActivitiesToExcel(project, activities)`.

**MitigationPlanPage (Tool 4):** Table of mitigation plans. Structure is analogous: rows managed by `useSemp` (`addMitigationPlan`, `updateMitigationPlan`, `deleteMitigationPlan`, `saveMitigationPlans`), with required “Output Description”. Export via `semp-export` and `event.detail.toolType === 'tool4'` → `exportMitigationPlanToExcel(project, mitigationPlans)`.

**useSemp(projectId):** Loads management activities and mitigation plans via `sempService.getManagementActivities(projectId)` and `getMitigationPlans(projectId)`. Add/update/delete are local until explicit save; save batches creates, updates, and deletes. Status helpers: `getTool3Status()`, `getTool4Status()`, `getSempStatus()` (pending / in_progress / completed). Tool 3 is “completed” when every row has `activity_description`; Tool 4 when every row has `output_description`.

**Constraints**

- SEMP is locked until assessment is approved (SempRouteGuard and in-page lock UI).
- Workflow derivation (workflowDerivation.js) marks SEMP completed only when both Tool 3 and Tool 4 have completed rows.
- MonitoringRouteGuard requires `getSempStatus() === 'completed'` before allowing monitoring routes.

---

## Monitoring

Monitoring (Tool 5) is the last workflow step. The frontend provides an overview and a data-entry page; both are gated by screening approved, assessment approved, and SEMP completed.

**Guards:** `MonitoringRouteGuard` wraps `/app/projects/:projectId/monitoring`. It redirects to screening if not approved, to assessment if assessment not approved, and to `/app/projects/:projectId/semp` if `getSempStatus() !== 'completed'`.

**Routes:**

- `/app/projects/:projectId/monitoring` → `MonitoringOverviewPage`.
- `/app/projects/:projectId/monitoring/data-entry` → `MonitoringDataEntryPage`.

**MonitoringOverviewPage:** Title “Environmental & Social Monitoring”, “Tool 5 – Monitoring and Evaluation”. If assessment is not approved, a lock banner is shown and “Enter / Edit Data” and “Export Excel” are disabled. Actions: **Enter / Edit Data** (navigate to data-entry) and **Export Excel** (calls `exportMonitoringToExcel(project, screening, assessment, records, categoriesWithIndicators, IMPACT_LEVEL_CONFIG)`). Content includes category cards and a progress timeline driven by `useMonitoring(projectId).getAllCategoryStats()` and quarter completion (baseline, Q1–Q4).

**MonitoringDataEntryPage:** Table of monitoring records by impact category (from LookupContext `categoriesWithIndicators`). Each record has indicator rows and quarter scores (baseline, Q1–Q2–Q3–Q4). Edits are in-memory until **Save**; `useMonitoring(projectId).saveAllRecords()` persists to the backend. After save, the page dispatches the custom event `monitoring-data-updated` with `projectId` so `useWorkflow` can refetch monitoring data. Export is available and listens for `monitoring-export` to call the same Excel export. Optional URL `?category=X` auto-expands that category.

**useMonitoring(projectId):** Fetches records via `monitoringService.getByProject(projectId)`. Exposes `records`, `getCategoryData(code)`, `getAllCategoryStats()`, `updateQuarterScore(recordId, quarter, value)`, `updateRecordField(recordId, field, value)`, `saveAllRecords()`. Workflow derivation treats monitoring as completed when at least one record has all four quarters filled.

**Constraints**

- Monitoring routes are only available after screening approved, assessment approved, and SEMP completed (MonitoringRouteGuard).
- Monitoring data is project-scoped; records are keyed by category/indicator and quarter.

---

## Annex and Project Files

Two related areas: **Annex** is a static list of standard annex types with a read-only overview; **Project Files** is the place to upload, list, and delete attachments by entity type (project, screening, assessment, monitoring).

**Annex (AnnexOverviewPage):** Route `/app/projects/:projectId/annex`. Renders a list of standard annexes from `utils/annexTypes.js`: `annexItems` (e.g. Annex A — Environmental Policy, Annex B — Stakeholder Engagement Logs, …). Each item has `_id`, `title`, `description`. The page shows cards and a summary table; “View” is present but does not yet open real documents. No API calls; data is static.

**Project Files (ProjectFilesPage):** Route `/app/projects/:projectId/files`. Uses `useFiles(projectId)`. Categories: Project Files, Screening Files, Assessment Files, Monitoring Files (each maps to an `entityType`). UI: **Upload File** toggles an upload section; user selects entity type and uploads one or more files. List is grouped by category via `FileCategoryAccordion` and `getFilesByType(entityType)`. Actions: upload (`uploadFile(file, entityType)`), delete (`deleteFile(fileId)`), download (`downloadFile(file)`). **Current implementation:** `useFiles` currently uses mock logic (setAttachments from a timeout, no real API). The comment indicates future replacement with `attachmentService.getByProject(projectId)` and real upload/delete/download endpoints.

**File entity shape (frontend):** `{ _id, entity_type, entity_id, file_name, file_path, file_type, file_size, uploaded_by?, createdAt? }`. Grouping uses `utils/attachmentsHelpers.groupAttachmentsByType(attachments)`.

**Constraints**

- Annex content is static; no per-project annex document storage in this feature.
- Project Files upload/delete/download are intended to be wired to the backend attachments API when available; until then behavior is mock.

---

## Excel Export

The frontend exports screening, assessment, management activities, mitigation plan, and monitoring data to Excel (.xlsx) using ExcelJS and file-saver. All exports use shared base utilities and AKF branding.

**Location:** `src/utils/excelExport/`. Barrel: `index.js` re-exports the five export functions and the base helpers.

**Export functions (signatures):**


| Function                                                                                                          | Parameters                            | Used from                                       |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------- |
| `exportScreeningToExcel(project, screening)`                                                                      | project, screening objects            | ScreeningSummaryPage                            |
| `exportAssessmentToExcel(project, assessment, ...)`                                                               | project, assessment, and related data | Assessment review/export                        |
| `exportManagementActivitiesToExcel(project, activities)`                                                          | project, array of activities          | ManagementActivitiesPage (semp-export, tool3)   |
| `exportMitigationPlanToExcel(project, plans)`                                                                     | project, array of mitigation plans    | MitigationPlanPage (semp-export, tool4)         |
| `exportMonitoringToExcel(project, screening, assessment, records, categoriesWithIndicators, IMPACT_LEVEL_CONFIG)` | full context for Tool 5               | MonitoringOverviewPage, MonitoringDataEntryPage |


**Base utilities (excelBase.js):** `createWorkbook()`, `addAkfHeader(worksheet, startRow, toolTitle)`, `applyBorders`, `mergeCells`, `saveWorkbook(workbook, fileName)` (uses file-saver `saveAs`), `generateFileName(prefix, projectTitle)`, `extractId`, `extractUserName`, `extractUserJobTitle`, `formatRecommendedActions`, `formatDate`, `safeString`, `EXCEL_STYLES` (header font, title font, body font, primary/header colors, impact level colors). Workbooks are created with `workbook.creator = 'AKF Syria'`.

**Triggering exports:** Screening: page listens for `screening-export` or user button. SEMP: layout fires `semp-export` with `detail.toolType === 'tool3' | 'tool4'`; the corresponding page handles it. Monitoring: button on overview/data-entry or event `monitoring-export`. All export calls are async; success/error are shown via toast.

**Constraints**

- Export runs entirely in the browser; no server-side Excel generation.
- File names are generated from project title and tool/type; no user-editable filename in the current UI.
- Export functions expect populated objects (e.g. screening.officer as user object for extractUserName); missing data is handled with safeString/extract helpers.

---

## Settings

Settings is a single page under `/app/settings` that exposes user management and project management. Access is restricted to the Environmental Specialist role.

**Guard:** `SettingsRouteGuard` wraps the `/app/settings` route. It reads `useAuth().user` and `USER_ROLES`; if `user.role !== USER_ROLES.ENVIRONMENTAL_SPECIALIST`, it redirects to `/app/dashboard` with `<Navigate to="/app/dashboard" replace state={{ from: location }} />`. No other roles can reach the settings outlet.

**SettingsPage:** Renders two sections: `UsersManagementSection` and `ProjectsManagementSection`. Page header: “Settings”, “Manage users and projects (Environmental Specialist only)”.

**UsersManagementSection:** Loads users via `userService.getAll()`. Supports add user (form: name, email, password, role), validation (email format, password length and complexity), and submit via auth/registration or user API. Lists users in a table with search, role filter, and pagination. Roles use `USER_ROLES` and `ROLE_LABELS` from AuthContext. No delete user in the described slice; focus is list and create.

**ProjectsManagementSection:** Loads projects via `projectService.getAll()`. Table with search and pagination. Delete is available when `useAuth().canDeleteProject` is true; confirm dialog then `projectService.delete(projectId)` and refetch.

**Constraints**

- Only users with role `Environmental Specialist` can access `/app/settings`; enforcement is in SettingsRouteGuard.
- User and project data are loaded and mutated via `userService` and `projectService`; all requests go through the shared API client.

---

## Key Invariants

- **Workflow order:** Screening → Assessment → SEMP (Tool 3 + 4) → Monitoring. Route guards and in-page locks enforce this; workflow status is derived from entities in `workflowDerivation.js` and `useWorkflow`.
- **Approval:** Approve/Reject for screening and assessment are shown only when `useAuth().canApprove` is true and the entity status is `submitted`.
- **Export:** Excel exports are client-side only; they are triggered from summary/review pages or by layout events (screening-export, semp-export, monitoring-export).
- **Settings:** Only Environmental Specialist can access Settings; Projects and Users sections use the same API client and services as the rest of the app.
- **Annex vs Files:** Annex is a static reference list; project files are entity-scoped attachments, with upload/delete/download currently mocked in `useFiles` until the attachments API is wired.

