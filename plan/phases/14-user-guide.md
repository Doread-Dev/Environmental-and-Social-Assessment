# Phase 14 — User guide

**Goal:** one user guide, in English and Arabic, for every role — admin, environmental specialist, the editor roles (program manager, project manager, environmental focal point) and viewer — that says what each role does in each tool, who submits and who approves, what locks and when, written on the screens of v2.0.0, read inside the app, where each user sees only the parts for their own role.

**Decisions:** D76 1, D77 3, D78 (bilingual guide, in-app Help filtered by permission, contextual help by place key, Markdown as the single source per language) (+ D2, D13–D19, D21–D25, D35, D60–D62, D64, D65, D66 b, D73, D74 for the behaviour it describes).

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
- **In-app Help (owner, 2026-11-08, D78), built after the release-prep PR (12a) merged into `Development`:**
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
- The Help endpoint gives each role exactly its sections (admin all, viewer no tagged parts), validates `lang`, answers 401 when not signed in; the Help page renders, switches language (RTL for Arabic), and a contextual button opens its section; the rendered HTML is sanitised; the Help chunk is lazy (not in the main entry); styleGuard passes.

## Done when
- [x] Every item under Tests has a test (file names listed in Result).
- [ ] Guide reviewed by the owner (and, if possible, read by one person of each role).
- [x] `plan/README.md` progress table complete.

## Result

- **Guide:** `docs/user-guide/en/` and `docs/user-guide/ar/`, 13 parts each (introduction, quick start, signing in, your role, projects, Tools 1–5, Library and Guidance, Settings and administration, everyday situations, glossary); format in `docs/user-guide/README.md`. Every section has an id and the permissions it needs; the read-only texts use `data-unless="edit"`. Checked against the code and in the running app (sign-in, overview, screening submit / reject / approve with their dialogs, assessment start, metadata, methods, scoring and the submit check, the viewer's SEMP and monitoring pages, the Help page in both languages and from a tool's Help button); updated for the 12a labels (**Go to SEMP**, **(on submit)**, the version in the user menu).
- **Backend:** `GET /api/v1/help?lang=en|ar` (`routes/help.routes.js`, `validators/help.validator.js`, `controllers/help.controller.js`, `services/help.service.js`): signed in, Joi on `lang`, only the parts and sections `can(user, …)` allows, links to hidden sections turned into text, cached in production. API reference, architecture and developer guide updated.
- **Release:** `deploy/build-release.mjs` copies `docs/user-guide/` next to `backend/`; `install.ps1` and `install.sh` copy `docs`; `OWNER-RUNBOOK.md` lists it.
- **Frontend:** `/app/help` (`ROUTES.HELP`, `getHelpRoute(section)`) in the main navigation and the project user menus (desktop and mobile); `pages/help/HelpPage.jsx` (lazy chunk with `react-markdown` 10.1.0 + `remark-gfm` 4.0.1, `skipHtml`, only in-page links), `hooks/useHelp.js` (`queryKeys.help(lang)`, language per user in localStorage), `services/helpService.js`, the floating Help button (below, after the owner review); print rules in `index.css` (`data-print`). Main bundle unchanged; the Help chunk is 170 kB (50 kB gzip).
- **Tests:** `backend/tests/userGuide.test.js` (labels in `frontend/src` in both languages, every role has its sections, every place key has a section in both languages, EN/AR same files, ids and tags, tags are real permissions, links and ids resolve), `backend/tests/help.test.js` (each role gets exactly its sections, admin all but the read-only texts, viewer no tagged section, editor no review/users/log, `lang=ar`, 400 on another `lang`, 401, links, format errors, production cache), `backend/tests/release.test.js` (the release and both install scripts carry the guide where the service reads it), `backend/tests/projectAccess.test.js` (`/help` classified), `frontend/src/pages/help/HelpPage.test.jsx` (renders, contents, Arabic RTL and remembered, opens at `?section=` or at the start, in-page links, sanitised, error, print, the Help button, the lazy chunk), `frontend/src/components/layout/SempFullWidthLayout.test.jsx` (the floating Help button in the project layouts, the project user menus), `frontend/src/routes/routes.test.jsx` (route and nav). `backend/tests/docs.test.js` reads only the `.md` files of `docs/`. styleGuard and the icon font test pass.
- **Numbers:** frontend 571 tests, lines 88.8 % (floors 87/81/82/88); backend 998 tests, lines 97.5 %, branches 91.8 % (floors 96/91/96/97, functions raised).
- **Owner review of PR #29 (2026-11-09, D78 6):** one floating Help button (`components/help/FloatingHelpButton.jsx`, bottom-right, `z-30`, focus ring, accessible name), mounted once in `MainLayout`, `ProjectLayout`, `SempFullWidthLayout` and `AuthLayout` (on the forced password change, not on sign-in; not on Help); the layouts leave room under the content, `StickyFooter` lifts it above the save bar. Page → section map `routes/helpSections.js` (keyed by `ROUTES`, most specific first; every id checked against both languages). `GET /help` and the Help route open before the forced password change. Contents scroll-spy (`IntersectionObserver` on the headings, `aria-current`, the list keeps the item in view). Project workbook as a full-width action bar right under the project header (same permission and behaviour). Guide text updated (EN + AR). Checked in a production build at 375 px, 768 px and desktop, light and dark: the button sits above save bars, in the strip below the Tools 3/4 grid, under the open mobile menu, and is absent on Help. Tests: `components/help/FloatingHelpButton.test.jsx`, `pages/help/HelpPage.test.jsx` (scroll-spy, sections, fallback), `pages/project-workspace/overview/ProjectOverviewPage.test.jsx`, `components/layout/SempFullWidthLayout.test.jsx`, `backend/tests/help.test.js` (forced change), `backend/tests/userGuide.test.js` (map ids).

## Found during phase
- Screening "Confirm Submission" said "unless the screening is rejected by an administrator", but an environmental specialist reviews too: fixed in this phase to "rejected by a reviewer" (no role named, as in the assessment), test `frontend/src/pages/project-workspace/screening/ScreeningFormPage.test.jsx`.
- A rejected screening shows no header "Export Excel" (only submitted and approved do); the guide says so.
- A rejected assessment showed "Edit Assessment" to every role, the viewer included (fixed by 12a: only with `assessment.edit`).
- On the assessment scoring page a closed category shows "Score: …", an open one "Category Score:".
- At 375 px the assessment metadata save bar cuts its right button ("Save and Co…"): `StickyFooter` does not wrap (UI, phase 13 list / v3).
