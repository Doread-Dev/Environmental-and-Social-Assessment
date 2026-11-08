# Phase 14 — User guide

**Goal:** one user guide, in English and Arabic, for every role — admin, environmental specialist, the editor roles (program manager, project manager, environmental focal point) and viewer — that says what each role does in each tool, who submits and who approves, what locks and when, written on the screens of v2.0.0, read inside the app, where each user sees only the parts for their own role.

**Decisions:** D76 1, D77 3, D78 (to be written: bilingual guide, in-app Help filtered by permission, contextual help by place key, Markdown as the single source per language) (+ D2, D13–D19, D21–D25, D35, D60–D62, D64, D65, D66 b, D73, D74 for the behaviour it describes).

**Depends on:** 12a (release readiness: its small UI fixes change some screens; the guide describes the screens after them). No longer on 13 (D77: phase 13 moved to v3).

## Scope
- **Audience:** the people who use the app, not developers or IT (they have the technical docs of phase 12 and the `deploy/` guides).
- **Per role:** what the role sees and can do (from `config/permissions.js` and the project's allowed actions), told as tasks, not as a permission table.
- **Per tool (Screening, Assessment, Tool 3, Tool 4, Monitoring):** what to fill in, how to save, how to submit, who approves or rejects (recommendations required, reject reason), what locks after submit/approve, what unlocks the next tool, how to export (who may).
- **Project life:** create, edit, documents, archive / restore, delete (blocked once something is approved), permanent delete (admin), the library and the Guidance button.
- **Admin part:** users (create, temporary password shown once, forced change at first sign-in, edit, role change, deactivate / reactivate, reset password, the last active admin), the own password (Profile), the Activity log.
- **Everyday situations:** unsaved changes (Save / Discard / Stay), "Someone else changed this" (Reload / Keep editing), session expired (sign in on the page), offline banner, locked v3 buttons ("Available in v3").
- A first-day quick start per role and a glossary (ESMS, SEMP, the five tools).
- **Two languages (owner, 2026-11-08):** `docs/user-guide/en/` (the reference) and `docs/user-guide/ar/` (Modern Standard Arabic), the same parts and section ids; UI labels stay in English, exactly as on screen, in both. Format: [docs/user-guide/README.md](../../docs/user-guide/README.md).
- **Each user sees only their own role's guide (owner, 2026-11-08):** every part/section is tagged with the permissions it needs (`data-requires` / `data-unless`, names from `config/permissions.js`, never roles; untagged = everyone).
- **In-app Help (owner, 2026-11-08), built after the release-prep PR (12a) has merged into `Development`:**
  - backend `GET /api/v1/help?lang=en|ar`: signed in, Joi on `lang`, returns only the sections `can(user, …)` allows; in the API reference; the release bundle carries the guide files;
  - frontend `/help` page (a `ROUTES` constant) for every role, reachable from the navigation: fetched through `services/api.js` with a `queryKeys` key, sanitised Markdown, contents list, EN/AR switch (Arabic `dir="rtl"`, choice kept in localStorage), print stylesheet, lazy-loaded, shared components and tokens, light and dark;
  - a contextual Help button on every page with a place key that opens its section (or the guide start when the user's guide has no such section); no role logic in the frontend.
- No screenshots in v2.0.0 (owner).

## Tests
- Docs check (`backend/tests/userGuide.test.js`): every UI label the guide quotes in **bold** exists in `frontend/src`, in both languages — a renamed or removed label makes the test fail.
- Every role in `config/roles.js` has its own section in "Your role" and in the quick start (from its permissions).
- Every tool route with a place key (`handle: { place }` in `routes/index.jsx`) has a part or section with that id, in both languages.
- English and Arabic have the same files, the same ids in the same order and the same tags; ids are unique; every `##` has its anchor.
- Every `requires` / `unless` tag names a real permission.
- The guide's relative links point at existing files and section ids.
- After the release-prep merge: the Help endpoint gives each role exactly its sections (admin all, viewer no tagged parts), validates `lang`, answers 401 when not signed in; the Help page renders, switches language (RTL for Arabic), and a contextual button opens its section; the rendered HTML is sanitised; the Help chunk is lazy (not in the main entry); styleGuard passes.

## Done when
- [ ] Every item under Tests has a test (file names listed in Result).
- [ ] Guide reviewed by the owner (and, if possible, read by one person of each role).
- [ ] `plan/README.md` progress table complete.

## Result

*(in progress)* Content: `docs/user-guide/en/` and `ar/` (13 parts each), tagged by permission, checked against the code and the running app (sign-in, project overview, screening form, submit, reject and approve, assessment start, metadata, methods and scoring with the submit check, the viewer's SEMP and monitoring pages). Tests: `backend/tests/userGuide.test.js` (+ `tests/helpers/userGuide.js`); `backend/tests/docs.test.js` now reads only the `.md` files of `docs/` (the new `docs/user-guide/` folder broke its link check). Help endpoint and page: after the release-prep merge.

## Found during phase
- Screening "Confirm Submission" says "unless the screening is rejected by an administrator"; a reviewer is an environmental specialist or an administrator (UI wording, phase 13 list / v3).
- A rejected screening shows no header "Export Excel" (only submitted and approved do); the guide says so.
- A rejected assessment shows "Edit Assessment" to every role, the viewer included; the metadata page it opens is read-only for a viewer (UI, phase 13 list / v3).
- On the assessment scoring page a closed category shows "Score: …", an open one "Category Score:".
