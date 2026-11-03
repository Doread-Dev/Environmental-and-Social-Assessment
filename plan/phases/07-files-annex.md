# Phase 7 — File module & Annex

**Goal:** one small, safe file module. Annex A–H uses it now; SEMP Plan §7 is supported in the data model from day one (UI locked until v3).

**Decisions:** D47 (and D46/D48 for the §7 part).

## Design
- Model `ProjectFile`: `project`, `area` (`annex` | `semp_record`), `category` (annex: `annex_a`…`annex_h`; semp_record: the 11 §6.1 categories or `null`), `original_name`, `stored_name` (server-generated), `mime_type`, `size`, `uploaded_by`, timestamps.
- Upload parsing: `multer` **2.x** (1.x is deprecated with known vulnerabilities; phase 1 removes the old 1.x dependency) or the current best maintained alternative — check `npm audit` is clean for it.
- Storage: `UPLOADS_DIR` env (default `backend/uploads`), files at `<project>/<stored_name>`. Never trust client paths or names. Size limit from env (default 10 MB). Allow-list of extensions/MIME types (PDF, Office, images, text, zip — confirm with the owner when implementing).
- Endpoints: `GET /projects/:id/files?area=annex`, `POST /projects/:id/files` (multipart, `area`, `category`), `GET /files/:fileId/download` (auth, `Content-Disposition` with UTF-8 name), `DELETE /files/:fileId`, `PATCH /files/:fileId` (category only, semp_record area only).
- Roles: read = all logged-in roles; upload/delete = editor roles + admin. Archived projects read-only.
- **Locked area:** requests with `area=semp_record` return 404 while the SEMP Plan is locked (D48) — the model, validation and categories exist, the route branch is disabled in code (no env switch).
- Project hard-delete removes its files (DB rows + disk) after the DB delete succeeds; failures are logged, never block.

## v2 reference (ideas only)
- `backend/src/middlewares/upload.js` (size boundary, safe names), Arabic filename decoding in the v2 attachment controller, `frontend/src/constants/sempRecordCategories.js` (the 11 categories), the v2 Annex page layout (`pages/project-workspace/annex/AnnexOverviewPage.jsx`).
- **Not** v2's multi-convention ownership cascade — our model has one owner (`project`).

## Frontend
- Annex page: 8 annexes from `utils/annexTypes.js`, each with count, list, upload (multi-file, sequential, one refresh), download, delete with confirm; viewer read-only; loading/error/retry states.

## Tests
- Upload ok / too big (413) / wrong type / path tricks in name / missing category.
- Download auth + headers + bytes; delete removes file and row; viewer write → 403.
- `semp_record` area → 404 today.
- Project delete removes files.

## Done when
- [ ] Annex works in the browser for editors and viewers.
- [ ] Backups (phase 11) must include `UPLOADS_DIR` — noted in `CLAUDE.md`.

## Out of scope
SEMP Plan UI (phase 9 keeps it locked).

## Found during phase
