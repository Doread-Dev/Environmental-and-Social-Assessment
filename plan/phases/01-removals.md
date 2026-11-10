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
- `clean-test-data.js`: drop the removed models and the uploads cleanup (its `removeUploads()` also resolved `process.cwd()/backend/uploads`, so it only worked from the repo root — found in phase 0).
- `src/db/seed.js` (`npm run seed`): make it **idempotent** — upsert lookups by a stable key (category `code`, question text/order, indicator name, job title name) instead of `deleteMany` + `insertMany`. Today every run gives lookups new `_id`s and breaks `assessmentImpactScore.question`, `monitoringRecord.indicator` and `user.job_title` (found in phase 0). Test: running `seedLookupData()` twice keeps the same `_id`s and counts.
- After the removals, re-run `npm audit` in both apps and update the leftover list in `00-foundations.md` (removing backend `exceljs` should clear backend `uuid` and most `minimatch` findings).
- `seed-demo-project.js`: still works (it doesn't use removed endpoints — verify).

## Tests
- Removed endpoints return 404 (`/attachments`, `/semp/objectives`, `/reports/export`).
- Project delete still cascades screening, assessment (+ methods, consultations, scores), management, mitigation, monitoring.
- `ProjectDetailsCard` renders values and "Not specified".

## Done when
- [x] No reference left to removed files (`grep` clean), build + lint + tests pass.
- [x] `multer`, `pdfkit`, backend `exceljs` gone from `backend/package.json` and lockfile.
- [x] Overview shows Project Details, no placeholder data.
- [x] Demo seed works.

## Out of scope
New file module (phase 7), SEMP Plan (phase 9).

## Found during phase

### Decisions taken during the phase
- **`/reports/dashboard` removed too.** Phase 4 builds a new `GET /dashboard` (stats + latest projects with workflow state) with a different shape; the old counts-by-status endpoint was unused. The whole reports module is gone.
- **Annex nav:** with Attachments gone, "Annex & Attachments" (expandable) became a plain "Annex" link in the sidebar and mobile menu; the Annex page title is now "Annex". `/app/projects/:id/files` now shows the 404 page.
- **`components/ui/FileUpload.jsx`** removed (no other user).
- **`ProjectDetailsCard`** ported from v2 with `bg-surface` instead of `bg-white` (style guide), and `<dl>/<dt>/<dd>` markup.
- **Project delete** keeps its response (`204`); the cascade now covers screening, assessment (+ methods, consultations, scores), management, mitigation and monitoring only.

### Findings for later phases
- `utils/formatFileSize.js` has no user left (only the deprecated `src/data/` barrel). Kept for the file module → phase 7.
- Idempotent seed: rows that are taken out of the seed list are **not** deleted, and changing a question's text or an indicator's name in the seed creates a new row (the old one stays, still referenced by old scores/records). Fine for now; if lookup content ever needs editing, it needs a decision (lookups admin or a migration) → owner.
- Frontend `minimatch`/`uuid` audit findings come from `exceljs` → phase 8 (see `00-foundations.md`).
