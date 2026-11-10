# ESMS user guide

The guide for the people who use ESMS 2.0.0, in two languages with the same structure:

- [English](en/00-introduction.md) (`en/`): the reference;
- [العربية](ar/00-introduction.md) (`ar/`): the same parts and sections, in Modern Standard Arabic.

Users read it in the app: the Help page shows each user only the sections their role may use.
These Markdown files are its single source. IT has the [server guides](../../deploy/README.md);
developers have the technical docs in the repository (`docs/`).

## Parts

| File | Part |
|---|---|
| `00-introduction.md` | about the guide, the workflow |
| `01-quick-start.md` | the first day |
| `02-signing-in.md` | signing in, the first password, the screen, the dashboard, the project list, the profile |
| `03-your-role.md` | what your role does |
| `04-projects.md` | create, edit, documents, export, archive, restore, delete, permanent delete |
| `05-tool-1-screening.md` | Tool 1 |
| `06-tool-2-assessment.md` | Tool 2 |
| `07-tools-3-4-semp.md` | Tools 3 and 4 |
| `08-tool-5-monitoring.md` | Tool 5 |
| `09-library-and-guidance.md` | the Library and the Guidance button |
| `10-administration.md` | Settings: users, passwords, the Activity log |
| `11-everyday-situations.md` | unsaved changes, someone else changed this, session expired, offline, v3 buttons |
| `12-glossary.md` | the words ESMS uses |

## How the files are written

The rules below are checked by `backend/tests/userGuide.test.js`.

- **One part per file.** The file starts with front matter: `id` (the part's id) and, optional,
  `requires` and `unless` (below). Then one `#` title.
- **Sections.** Every `##` heading is a section and has an anchor on the line just before it:
  `<a id="screening-submit" data-requires="edit"></a>`. Ids are lowercase words joined by `-`,
  unique in the whole guide. `###` headings belong to their section.
- **Who sees what.** `data-requires` (or `requires:` for a whole part) lists the permissions a user
  needs, separated by spaces, all of them; `data-unless` hides the section from a user who has that
  permission (used for the read-only texts). Names are the permissions of
  `backend/src/config/permissions.js` (for example `edit`, `approve`, `export`, `manage_users`),
  never roles. No tag: everyone sees it. The text before the first `##` belongs to the part.
- **Places.** Each tool page with a place key (`handle: { place }` in
  `frontend/src/routes/index.jsx`) has a part or a section with that key as its id (`screening`,
  `assessment`, `management`, `mitigation`, `monitoring`); its help button opens it.
- **English and Arabic match.** Same files, same ids in the same order, same tags. Change both in
  the same commit.
- **Labels.** Words in **bold** are UI labels, written exactly as on screen (in English in both
  languages, because the app is in English). Each one must exist in `frontend/src`. Use bold for
  nothing else.
- **Links** between parts are relative (`05-tool-1-screening.md#screening-review`): to a part file,
  or to a section id.
- No screenshots in 2.0.0.
