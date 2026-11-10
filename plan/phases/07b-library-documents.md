# Phase 7b — Reference library & project documents

**Goal:** the Annexes become what the official workbook says they are: organisation guidance that opens **inside** the tool where it's needed. Per-project files become "Project documents", grouped by tool. Both have an in-app PDF viewer.

**Decisions:** D64 (+ D65 critical-actions log, D66 access seams, D47 file module, D48 v3 places, D37 offline).

**Depends on:** 7a (critical-actions log, access check, `requirePermission`).

**Owner input so far:** only Annex 1 exists ("Climate change resilience examples", sheet 8 of `AKF-S Environmental and Social Assessment Tooles 2025.xlsx` in the repo root, git-ignored — read it locally, never commit it or a copy). It belongs with Tool 4 (column "Potential Impact … Including climate-related risks" → "Mitigation and enhancement measures"). The other annexes arrive from the client later and are added as data, not code.

Reworking phase 7 code is fine (owner): choose the clean design, not the smallest diff.

## Places (D64 a)
- `backend/src/config/places.js`, a code registry. Each place has `key`, `label`, `group` (`project_workflow` | `project_support` | `organization`), `scope` (`project` | `organization`), and `locked` (v3).
  - Project workflow: `screening`, `assessment`, `management` (Tool 3), `mitigation` (Tool 4), `monitoring`.
  - Project support (locked): `semp_plan`, `stakeholder_awareness`.
  - Organization (locked): `ghg_emissions`, `environmental_data`.
- Returned by `GET /lookups` as `places`. The frontend holds no copy of the list or the labels.
- A new tool later = one entry here + its page renders the Guidance button.

## Library (D64 b, c)
### Backend
- Model `LibraryDocument`: `title` (required), `description`, `places` (array of place keys, may be empty), `order`, plus the stored file (`original_name`, `stored_name`, `mime_type`, `size`), `uploaded_by`, `updated_by`, timestamps.
- Files live at `<UPLOADS_DIR>/library/<uuid>.pdf`. **PDF only**: extension and first bytes are checked. The size limit is the same as project files.
- Put the disk/type/name logic phase 7 wrote in `projectFile.service.js` into one shared storage helper, used by project documents and the library. One place checks types and paths.
- Endpoints:
  - `GET /library` (all roles; `?place=` filter, `?search=`; ordered by `order`, then title).
  - `POST /library` (multipart: file + title + description + places).
  - `PATCH /library/:id` (title, description, places, order).
  - `PUT /library/:id/file` (replace the PDF; links and title kept; old file removed after the new one is saved).
  - `DELETE /library/:id`.
  - `GET /library/:id/file` (all roles, authenticated, PDF).
- Writes: `admin` + `environmental_specialist`. Add a new role list and permission `manage_library` in `/auth/me`; don't reuse a list by accident.
- Unknown place key → 400. Locked (v3) places are accepted.
- Critical-actions log (D65): `library.replace_file` (old/new name and size) and `library.delete` (snapshot). Create and edit are not logged in v2.
- Routes use `requirePermission('manage_library')` (D66); the library is not project-scoped.

### Frontend
- **Shared `PdfViewer`** (`components/ui` or `components/files`):
  - Fetches the blob with the token (as downloads do), shows it in an in-app panel/modal with an `iframe`/`object` on a blob URL, and revokes the URL on close.
  - Has a Download button.
  - Where the browser can't show PDFs inline (some mobile browsers), it shows a clear "Download to view" fallback.
  - Phase 11 note: the CSP must allow `blob:` for frames/objects. Add this to the phase 11 file.
- **Library page** (`ROUTES.LIBRARY`, main navigation next to Dashboard/Projects, mobile menu too):
  - Every role sees the list, with search and a place filter.
  - With `manage_library`: upload, edit, replace PDF, delete (in-app confirm dialog).
  - **Place picker:** checkboxes grouped by place group. v3 places are shown with a "v3" tag and can be chosen. No choice = "General — Library only".
- **Guidance button:** the header of each place's page shows "Guidance (n)" when documents are linked to it, and nothing when n = 0. In 7b that means the screening, assessment, Tool 3, Tool 4 and monitoring pages.
  - It opens a side panel listing the linked documents; clicking one opens the `PdfViewer` without leaving the page or losing unsaved input.
  - One `useLibrary({ place })` query, shared and cached (`queryKeys.library(place)`).
- Viewer role: reads and views everything; no management controls.

## Project documents (D64 d)
- Replace the Annex A–H page.
  - Backend: area `annex` → `documents`; `category` = a project-workflow place key or `other`. Remove `annex_a…annex_h`, `utils/annexTypes.js` and the A–H UI. Keep `semp_record` exactly as D47/D48 say.
  - Navigation: "Annex" → "Documents". Sections per place, then "Other".
- PDF + Office as in phase 7. PDFs open in the `PdfViewer`; Office files download only. Upload/delete rules unchanged (`files.edit`).
- `file.delete` is already logged by 7a; check the new category labels read well in its snapshot. Project-document routes keep the project-access check (D66).
- Do not add a "Documents (n)" button inside the tools yet. The place keys make it possible later; ask the owner after 7b.

## Annex 1
- Make `Annex 1 — Climate change resilience examples.pdf` from sheet 8 of the workbook (Excel "Save as PDF" by the owner, or any local tool you have). Don't put the PDF in git (client document).
- After the phase, upload it through the Library page linked to `mitigation` (Tool 4). Ask the owner whether to also link `management` (Tool 3).
- `seed-demo-project.js` creates one small **generated sample** PDF library document ("[DEMO] Sample guidance", linked to `mitigation`) so a fresh demo shows the feature. It replaces the previous demo copy and is never the client file.

## Tests
- Places: `/lookups` returns the registry; unknown key → 400; locked keys accepted.
- Library: roles (viewer and editors 403 on writes; admin and specialist ok); PDF only (extension + bytes); replace keeps links and removes the old file; delete removes row + file; `?place=` filter; download headers.
- Library delete and file replacement record their log entries; create/edit record none.
- Project documents: categories are place keys or `other`; old annex categories → 400; `semp_record` still 404.
- Frontend:
  - `PdfViewer` creates and revokes the blob URL and shows the fallback.
  - The Guidance button is hidden at 0 and opens the panel with linked documents only.
  - The place picker groups places and marks v3.
  - Library page management controls only with `manage_library`.
  - The documents page groups by place.
- Request counts: a tool page adds at most one library request, and none when it's cached (`requestCounts.test.jsx`).

## Done when
- [x] Owner has uploaded Annex 1 and opened it from Tool 4 without leaving the page, as an editor and as a viewer, in light and dark mode. *(Owner step after merge. The same flow was checked in the browser with the demo sample PDF: editor and viewer, light and dark, desktop and 375 px, unsaved Tool 4 input kept.)* Done by the owner: Annex 1 uploaded to the local library and linked to Tools 3 and 4.
- [x] Project documents page grouped by place; PDF preview works; Office downloads.
- [x] `CLAUDE.md` describes places, the library, project documents and the viewer.

## Out of scope
Showing project documents inside each tool (later, owner decides); Office preview; server-side conversion; v3 pages themselves (phase 9 — but their places already exist).

## Found during phase
- **Owner question (Annex 1):** after uploading it linked to `mitigation` (Tool 4), should it also be linked to `management` (Tool 3)? Either is one click in the Library (Edit → Show in).
- **Old Annex rows:** project files uploaded in phase 7 (area `annex`, categories `annex_a…h`) are not migrated (no real data, README rule). In a database that still has them they are not listed and answer 404 (the area is no longer open); they go with their project's delete/purge. Old `file.delete` log entries still read well ("Annex C (before phase 7b)").
- **Escape inside the PDF:** when the keyboard focus is inside the browser's PDF frame, Escape goes to the browser's PDF viewer, not the page, so it does not close the viewer. The viewer puts focus on its Close button when it opens, so Escape works until the user clicks into the PDF; the Close button always works.
- **"Download to view" fallback:** the browser pane's mobile emulation still reports `navigator.pdfViewerEnabled = true` (desktop Chrome), so the fallback is covered by the `PdfViewer` test only. Check it once on a real phone (Android Chrome) in phase 10/12.
- **Mobile headers:** with the Guidance button, the Tool 3/4 header did not fit at 375 px ("Export Excel" cut off). Both layout headers now hide the "ESMS System" text below the `sm` breakpoint (the logo stays) and use less side padding. Phase 10 may revisit the header as a whole.
- **Library search:** the Library page loads the list once and searches/filters in the browser (instant, no request per keystroke). `GET /library?search=` exists and is tested as the phase asked, but the frontend does not call it yet.
- **Activity log:** the page now also loads `/lookups` (once, cached) to label file categories and library links by place.
- **SEMP overview** (`/semp`) is not a place, so it shows no Guidance button; Tools 3 and 4 have theirs.
