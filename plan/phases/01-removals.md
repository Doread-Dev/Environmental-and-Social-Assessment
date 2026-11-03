# Phase 1 — Removals & cleanup

**Goal:** remove everything we decided not to keep, so later phases secure and refactor less code.

**Decisions:** D12, D26, D27, D28, D29, D50.

## Tasks

### Attachments (D26)
- Backend: remove `routes/attachments.routes.js`, `controllers/attachment.controller.js`, `services/attachment.service.js`, `models/attachment.model.js`, `validators/attachment.validator.js`, `middlewares/upload.js`, `models/annexItem.model.js` (unused), the attachment part of `project.service.deleteProject`, and `multer` from dependencies. Keep `backend/uploads/` ignored.
- Frontend: remove the Project Files page (`pages/project-workspace/annex/ProjectFilesPage.jsx`), its route and `ROUTES.PROJECT_FILES`, sidebar/mobile nav entries, `hooks/useFiles.js`, `components/files/*`, `components/ui/FileUpload.jsx` if unused afterwards. The Annex page stays (static list) until phase 7.

### Old SEMP tree (D27)
- Remove `SempObjective`, `SempTarget`, `SempAction` models, `routes/semp.routes.js`, `semp.controller`, `semp.service`, `semp.validator`, the `/semp` mount and their part of the project delete cascade. (Frontend does not call `/semp/*`; verify with grep.)

### Reports (D28)
- Remove `/reports/export`, `pdfkit` and backend `exceljs`. Keep `/reports/dashboard` only if phase 4 will reuse it; otherwise remove it too (it is unused today).

### Screening category (D12)
- Remove `requiresAssessment` from `utils/screeningDisplay.js` and its uses.

### Overview card (D29, D50)
- Delete `components/project/ProjectSiteCard.jsx`; port `ProjectDetailsCard.jsx` from v2 (`frontend/src/components/project/ProjectDetailsCard.jsx`) — real project data only (location, component, start, end; "Not specified" when empty). Keep the "Risk Level" label (D59).

### Scripts
- `clean-test-data.js`: drop the removed models and the uploads cleanup.
- `seed-demo-project.js`: still works (it doesn't use removed endpoints — verify).

## Tests
- Removed endpoints return 404 (`/attachments`, `/semp/objectives`, `/reports/export`).
- Project delete still cascades screening, assessment (+ methods, consultations, scores), management, mitigation, monitoring.
- `ProjectDetailsCard` renders values and "Not specified".

## Done when
- [ ] No reference left to removed files (`grep` clean), build + lint + tests pass.
- [ ] `multer`, `pdfkit`, backend `exceljs` gone from `backend/package.json` and lockfile.
- [ ] Overview shows Project Details, no placeholder data.
- [ ] Demo seed works.

## Out of scope
New file module (phase 7), SEMP Plan (phase 9).

## Found during phase
