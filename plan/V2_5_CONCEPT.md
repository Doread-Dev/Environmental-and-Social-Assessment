# v2.5 — Design concept (working notes)

**What this is:** the working notes of the v2.5 design discussion between the owner and the main chat. Nothing here is a decision until it is recorded in [DECISIONS.md](DECISIONS.md). Started 2026-11-10.

## Where v2.5 sits
- **v2.0.x:** delivered; goes to the Syria IT server.
- **v2.5:** the Syrian version, rebuilt on a new enterprise-grade design system, on the same Syria server. Same backend structure, small backend changes only where the design needs them (for example error codes for a multilingual interface).
- **v3:** the global version (other AKF offices, entry from AKF's global platform) and the structural rebuild. Notes in [V3_VISION.md](V3_VISION.md) ("Global use"). v3 reuses the v2.5 design system as it is.

## Agreed in the discussion so far (owner, 2026-11-10)
- **Every page is redesigned from scratch** (D79); the current layout is not a base.
- **Design decisions are made by the main chat as the design lead**, each with its reason; the owner reviews. The owner answers questions about the client's work, not design taste.
- **Design system in layers:** 1 foundations (tokens: colour, type, spacing, elevation, motion, light/dark), 2 components, 3 patterns — built now and meant to last into v3 (layer 3 may still change). 4 the app shell and navigation, 5 page layouts — designed for Syria, with room for a country/office context from day one, so navigation is not drawn twice.
- **Global-ready from day one:** a multilingual interface (English + Arabic shipped in v2.5, RTL mirroring; other languages added later without design changes; **English is the default** — the client's staff all read English — and each user can switch to Arabic), locale formats for dates and numbers, a context slot ("AKF Syria") in the shell. Head-office views across countries are allowed by the structure, not built.
- **Devices:** laptop first; phone and tablet must work well.
- **Look:** close to AKF's own look and colours, but our own system. ESMS links to AKF's global platform; it does not become part of it.
- **The four locked modules** (SEMP Plan, Stakeholder Awareness, GHG Emissions, Environmental Data Collection) are built in v2.5, **after** the design system and all existing pages are rebuilt, as the test of how well the design system supports building something new.
- **In-app notifications** in v2.5 (something waits for your review, your submission was approved or rejected), with a place in the shell. Email only if the Syria server can send mail (a question for IT); it can be added later on the same events.
- **Help:** placement decided in the shell step (the sidebar item felt wrong to the owner; the floating button seemed fine but is not settled). Note: the Help guide and the Guidance panel (library documents for a page) are both "help with this page" for the user.

## Users and tasks (inferred; the owner confirmed 1–4 and 6–7)
No access to real users yet (the system is new to them), so priorities are inferred and checked with the owner.

| Person | Roles today | Main tasks | How often |
|---|---|---|---|
| **Preparer** | Environmental Focal Point, Project Manager (others can too) | create a project; fill Tools 1–5; submit; fix after a rejection; quarterly monitoring; upload documents; export | daily during a project; monitoring every quarter |
| **Reviewer** | Environmental Specialist (one or two for all of Syria) | review what is waiting; approve or reject with recommendations; also authors; manages the library; archives/deletes | whenever something is submitted |
| **Overseer** | Program Manager | follow where each project stands; spot what is stuck; approve/review; export for reporting; **also edits tools at times** (owner) | weekly |
| **Reader** | Viewer: internal management, **or a third party** (agent, partner) | read projects; possibly download | occasional |
| **Administrator** | Admin | users and access, activity log, purge | rare |

- Recurring work is dominated by **quarterly monitoring** (Tool 5) over a project's life; screening and assessment happen once per project.
- Scale for Syria: **tens** of active projects, not hundreds.
- **Exports matter:** the Excel goes outside (management, donors, head office), into reports, and for approvals. Export must be visible, not hidden.
- **A third-party reader must see only their own projects** (owner: this is the point of the viewer role). Today every viewer sees every project.

### Design principles drawn from this (draft)
1. **Home = "what needs me now"**, per person: the reviewer's waiting list, the preparer's projects and next steps (rejections with their reasons first), the overseer's status across projects.
2. **Inside a project, the workflow is the spine:** the five tools in order, each with its state; the next step is always obvious.
3. **One primary action per screen state** (save, submit, approve); secondary actions grouped, never scattered.
4. **Export is first-class** on the project and on each tool.
5. **Long tables are working surfaces:** dense, keyboard-friendly, with a save bar that never covers content.
6. **Access-aware:** the interface shows only what the person may see; a restricted reader never sees other projects, even as names or counts.
7. **Global-ready** (see above) and **laptop first, responsive**.
8. **Design for variation:** where v3 may change the shape (the list of workflow steps, scope levels, languages, roles, activities inside a project — see V3_VISION "Activities"), patterns are generic and fed by the backend (a "workflow step" pattern, not five hand-made tool pages), so v3 changes the structure underneath without a redesign. In particular, the **"workflow unit"** (a thing that goes through Tools 1–5 with its own states) is one pattern: in v2.5 it is the project; in v3 a project is a workflow unit **and** holds activities, each a workflow unit of its own (a mini-project). The project area is laid out so an "activities" level can be added without redrawing it.

## Standing rule (owner, 2026-11-10)
**Enterprise level, always:** structure, backend and design are built the proper way from the foundation; no quick patches.

## Access model in v2.5 (agreed by the owner, 2026-11-10)
The owner rejected a "project-scoped viewer" patch: the real need is per-person access (which projects each focal point, project manager, program manager or third party sees, edits, approves, exports). Proposal — the standard enterprise model, built in v2.5 because the need exists in Syria now, it shapes every page, and it does not depend on the unknown v3 facts (countries, hosting, sign-in):
- **Permission:** the smallest action (view a project, edit Tool 5, approve a screening, export, manage users).
- **Role:** a named bundle of permissions, **managed by the admin in Settings** (the six hard-coded roles become editable starting roles).
- **Scope:** where a role applies. v2.5 levels: **organisation → project**. v3 adds country / office above them without changing the model.
- **No programme record** (owner correction): programmes exist in the client's organisation, but nobody asked for them in the platform. A programme manager is simply assigned to their projects (or to the organisation). If the client asks for programmes later, a programme becomes one more scope level.
- **Assignment:** person + role + scope (for example: Focal Point on projects A and B; Reviewer on the whole organisation; Reader on project C only, without export). A person's access is the union of their assignments. Teams/groups can be added later on the same model.
- **No per-person permission checkboxes:** with many people and permissions nobody can tell who may do what; a different need gets its own role.
- Every access change is logged (D65). The backend seams from phase 7a (one project-access check, named permissions, D66) are where it plugs in.

- **Third-party readers download by default** (owner); if the client asks otherwise, the admin removes the export permission from that role in Settings — a setting, not a code change.

## App shell (agreed by the owner: option 1, 2026-11-10)
Three options compared on screen in [design/app-shell-options.html](design/app-shell-options.html) (wireframe playground: option, place, person, device, language; open it in a browser). Recommended and agreed: **option 1**.

1. **Switching sidebar (recommended):** outside a project, one sidebar with the global menu; inside a project, the same column becomes the project's workflow spine (back link, project name and state, Overview, Tools 1–5 in order each with its state and sub-parts, then Documents and the project support tools, and a reserved "Activities" slot for v3). Collapsible to icons and tool numbers.
2. Icon rail + project panel: global icons always visible, a second panel with the spine inside a project.
3. Top menu + project tabs: global menu in the header, tools as horizontal tabs (plus a second row for sub-parts).

Why option 1: one navigation column leaves the most width for long tables on a laptop; full labels (clear to new users, fit longer translations); the vertical spine carries each tool's state and sub-parts without extra rows; a v3 activity opens with the same spine one level down (back to the project), so nothing is redrawn. Weak point: the global menu is not visible inside a project; search, notifications, help and the logo stay in the header, and most work happens inside one project anyway. Option 2 costs about 300 px of width and relies on unlabelled icons; option 3 does not fit 8–9 tabs with states (worse in Arabic), needs a second tab row for sub-parts and has no natural place for activities.

Applies to any option:
- **Header:** logo, context slot ("AKF Syria"; a switcher in v3 only for people with several offices), project search (Ctrl+K), Help "?", notifications bell, user menu (profile, language, theme, sign out).
- **Help:** the header "?" opens a side panel "Help with this page" with two tabs, the guide section for this page and the library guidance linked to the page (D64), plus a link to the full guide. No floating button and no sidebar item: one fixed place; a floating button covers the save bar and the last table row; a side panel keeps the page visible (a modal would hide it). Full screen on a phone.
- **Notifications:** bell with a count; a short list; each item opens its place.
- **Administration:** an item at the bottom of the sidebar, shown only to people with an admin permission and listing only the sections they may use.
- **Access-aware:** a restricted reader sees only their projects and no section they lack permission for.
- **Page header:** breadcrumb, title, state; one primary action; Export always visible; the rest under "⋯". The save bar is part of the page under the content, never floating over it.
- **Tablet:** the sidebar shrinks to an icon rail (inside a project: tool numbers with their states), and ☰ in the header opens the full menu as a drawer. **Phone:** the sidebar is a drawer (☰); inside a project a "Step n of 5" bar switches tools. The rule goes by screen width, not by device name.
- **RTL:** the whole shell mirrors from logical CSS properties; no separate design.

## Screens follow permissions, not role names (owner clarification, 2026-11-10)
Reviewing and editing are not separate kinds of people. The Environmental Specialist, the admin and the Programme Manager mainly review and approve, but they also edit at times. So every screen is built from **what this person may do** (their assignments) **and the item's state**, never from a role label:
- anyone allowed to edit an item sees the editing surface, the save bar and "Submit" while it is a draft;
- anyone allowed to approve sees "Approve / Return" once it is submitted;
- one person can have both, and then sees both, each at the right state;
- the home combines sections the same way: a specialist who also prepares projects sees "Waiting for your review" **and** "My projects".

The people in the playground (preparer, reviewer, reader, admin) only show typical combinations; they are not fixed screen types.

## Page map (main chat, 2026-11-10 — proposal)
Every page is built from a small set of page patterns (design-system layer 3), so a new page or a v3 activity reuses one instead of a new layout.

| Pattern | Pages |
|---|---|
| **Work queue** (sections of "what needs me", built from permissions) | Home |
| **Unit overview** (facts, workflow strip, next step, people, activity, documents) | Project overview (v3: activity overview) |
| **Workflow step** (one anatomy for every tool, see below) | Tool 1 Screening; Tool 2 Assessment (parts: Context, Methods & consultation, Scoring, Summary & submit); Tool 3 Management activities; Tool 4 Mitigation plan; Tool 5 Monitoring; later SEMP Plan, Stakeholder Awareness |
| **Collection list** (one table look: search, filters, sort, paging, empty/loading/error, row actions) | Projects (with an "Archived" tab), Library, project Documents, Notifications, Users, Access, Activity log, Deleted items; Roles & permissions is a matrix on the same frame |
| **Form** (page for a long form, side panel for a short one) | New project / Edit details (page), user, role, assignment, library document (side panels) |
| **Reader** | Help guide, PDF viewer |
| **Auth** | Sign in, forced password change (v3: organisation sign-in) |
| **Organisation report** (built last in v2.5) | GHG Emissions, Environmental Data Collection |

New in v2.5: Notifications page, Administration (Users, Roles & permissions, Access, Activity log, Deleted items), "People on this project" on the overview, the personal page (profile, password, language, theme, my access, read only).

## Core pages (proposal, 2026-11-10 — playground [design/core-pages.html](design/core-pages.html))
**Workflow step page — the same anatomy for Tools 1–5:**
1. Header: tool number and name (Assessment: the part), state, who/when; Export always visible; one primary action by state and permission (Submit / Resubmit; Approve + Return with comments; Add row; none for a reader); the rest under "⋯".
2. Status strip, always in the same place: returned (reason + reviewer), submitted (locked until the decision), approved (reviewer + recommendations), incomplete (what is missing and what it unlocks, e.g. Tools 3/4 rows without a description).
3. Body: Tool 1 form (category cards A–F with their meaning, reason, impacts); Tool 2 scoring (questions grouped by category, the level as visible buttons, a sticky summary that updates); Tools 3/4 grid with long text clamped to 3 lines and a **row editor side panel** (all fields, previous/next, responsible staff or external); Tool 5 with every column open (fill in any order, any time) and **gaps** marked: an empty value before a later filled one, Baseline counting first (e.g. Q1 and Q2 filled, Baseline empty; Q3 empty, Q4 filled); a strip names them and a filter shows only them; on a phone each indicator becomes a card with its five fields.
4. Save bar under the content, only while editable.
- **One page for reading and editing:** read mode is the same page without inputs. The separate "summary" and "review" pages go away; the reviewer reads exactly what the preparer wrote.
- **Approve / return in a side panel**, not a modal, so the reviewer writes recommendations with the content in view.

**Home:** sections built from the person's permissions: "Needs your action" (returned first, with the reason on the row), "Waiting for your review", "Monitoring gaps", "My projects"; organisation-wide counts only for people with organisation scope; a restricted reader sees only their projects with Export.

**Project overview:** facts; the five steps on one line with states; a "Next step" card with one button; "People on this project" (with "Manage access" for those allowed); recent activity; documents. Export workbook is a header button, not a full-width bar.

## Monitoring reminders: gaps, not dates (owner, 2026-11-10)
Teams fill Tool 5 when they like, often all at once (even at the end of the year), so there are **no time-based reminders** and no due dates. The only reminder is a **gap**: an empty value before a later filled one in the order Baseline, Q1, Q2, Q3, Q4 (Baseline empty while Q1/Q2 are filled; Q3 empty while Q4 is filled). Empty quarters at the end are not gaps. The backend computes gaps (with the workflow state, never in the frontend); they show in the Tool 5 status strip, as marked cells, and in "Monitoring gaps" on the home, and disappear once fixed. No notification is sent for a gap.

## Project team (owner, 2026-11-10)
The person who creates a project does not choose its team (they may be a Focal Point without that right). Access to a project is managed by people with the "manage access" permission (admin and Environmental Specialist in the starting roles). Proposal: the creator is assigned to the new project automatically with their own role, so they can continue working on it, and people who can manage access get an in-app notification "New project — assign its team".

## Lists, Administration and New project (proposal, 2026-11-10 — playground [design/lists-and-admin.html](design/lists-and-admin.html))
**Collection list pattern (every list):**
- Page header with the count and one primary action (New project, Upload, Add user, Give access); then search and filters; then the table; then paging.
- Active filters are highlighted, with "Clear filters". Filters, sort and page live in the URL, so going back returns to the same list and a link can be shared.
- Five drawn states for every list:
  - data;
  - empty on first use (says what goes here, with the primary action);
  - no results (with "Clear filters");
  - loading (grey skeleton in the table's own shape, so nothing jumps);
  - error (with "Try again").
- A row click opens the item. Small row buttons are for quick actions (export, preview, "⋯").
- On a phone, rows become cards, the filters sit behind one "Filters" button, and "Show more" replaces paging.
- Bulk selection only where it means something (Deleted items).
- A page the person may not use is not in the menu. A direct link shows a clear "You don't have access to this page" page.

**Pages:**
- **Projects:**
  - tabs "My projects" / "All projects" (organisation scope only) / "Archived" (people who can archive). The archive is a tab here, not its own page.
  - Columns: project (with a short code and the place), a mini workflow of five bars, where it stands, "Needs attention" built from the person's permissions (returned, waiting for your review, monitoring gaps, needs a team), last update, Export.
  - "Export list" exports the filtered list to Excel.
  - A third-party reader sees only their projects: no tabs, no attention column, no counts of others.
  - **New:** a short project code (for example ESMS-024), given by the server, for search, talk and exports.
- **Library:**
  - each document shows where it appears ("Shows on": the pages whose "Help with this page" panel lists it);
  - upload and edit in a side panel (file, title, description, pages, position);
  - "Read the library" is a permission; the starting Reader role does not have it.
- **Project documents:**
  - grouped by workflow step in spine order, with empty steps hidden;
  - a drop zone that states the allowed types and size up front;
  - PDFs open in the viewer, other files download;
  - "Download all" as a ZIP.
- **Notifications page:**
  - All / Unread, and "Mark all as read";
  - each item is a sentence (who, what, which project, when) and opens the exact place;
  - items follow permissions: submitted for your review, returned, approved, new project needs a team, you were given access;
  - in-app only (email on the same events if the server can send mail); no notification for monitoring gaps.
- **New project:**
  - a full page with sections (Project, Location, Dates) and errors shown at the field while typing;
  - a note that the creator is added automatically with their role and that access managers are notified;
  - after creating, the project overview opens with "Start screening".
- **Users:**
  - name and email, job title, access as a short line ("Focal Point · 4 projects"), status ("No access yet" highlighted), last sign-in;
  - **new:** a `last sign-in` field;
  - a row opens a side panel with the tabs Details / Access / Security (temporary password, deactivate; never delete, D4);
  - you cannot change your own access or deactivate yourself (v2.0.1 rule).
- **Roles & permissions:**
  - one matrix, with permissions as rows (grouped: Projects, Workflow tools, Library, Administration, each a plain sentence) and roles as columns with their people count;
  - click to change, with a save bar;
  - "organisation only" marks permissions that work only when the role is given for the whole organisation;
  - the six v2 roles become editable starting roles: the Programme Manager gets "approve or return" (owner: they review and approve) and the Reader keeps Export (owner);
  - the Administrator's "Manage users" and "Manage roles" are locked, so nobody locks everyone out;
  - "New role" in a side panel (name, description, start from an existing role);
  - on a phone: pick a role, see its permissions as a list.
- **Access:**
  - one list answers "who works on what", one line per person + role + where (whole organisation or chosen projects);
  - a strip "New projects need a team" with "Assign team";
  - "Give access" in a side panel: person, role (with what it allows), where, and a **result sentence** before saving ("Lina S. will be able to … on 1 project: …");
  - the same panel opens from the user's Access tab and from "People on this project";
  - a specialist sees only "Access" under Administration.
- **Activity log:**
  - the D65 critical actions, plus **every access and role change**;
  - each entry is a sentence with the person and their role at the time;
  - a row opens details with "As it was before";
  - filters (action, person, project, date) and export;
  - entries are never edited or deleted;
  - workflow decisions stay in each tool's history; a field-level log is v3.
- **Deleted items (new, proposal):**
  - deleting a project, a project file or a library document moves it to Deleted items for 30 days (restore or delete now), then it is removed for good;
  - needs a soft delete in the backend;
  - archiving stays separate (finished projects kept for the record); permanent delete of an archived project stays with the admin.

**Owner answers (2026-11-10):**
- **Deleted items:** the client has no retention rule; 30 days, as proposed.
- **Location and component stay free text.** There is no grouping by sector. Grouping by place may come later; the owner's idea is to pick the place on a map (coordinates). That is kept for v3, where the global shape is decided (see [V3_VISION.md](V3_VISION.md), "Global use").

## Account, sign-in, readers and system pages (proposal, 2026-11-10 — playground [design/account-and-readers.html](design/account-and-readers.html))
- **Sign in:**
  - on a laptop, two halves: a brand panel (AKF logo and map of Syria, as today, D51) and the form; on tablet and phone the logo sits above the form. The final look of the brand panel (colours, map drawing, AKF/AKDN marks, the overall feel) is settled in the design-system foundations; in v3 the map follows the office. The form is plain (email, password, one button), with the language switch in the corner (English by default; after sign-in the account's language applies);
  - errors say only what is safe: "Email or password is not correct"; "deactivated" only after a correct password (as today); "too many attempts" says how long to wait (the login limiter exists);
  - "Forgot your password?" says the truth: the administrator gives a temporary one (no email). A reset link comes only if the server can send mail;
  - v3: "Sign in with your organisation account" goes into the same card.
- **Forced password change (D22):**
  - the same card, with no Help and no menus (D78);
  - one sentence on why the user is here;
  - the rules are ticked live while typing;
  - "Sign out" is there in case it is the wrong person.
- **Password rule (owner, 2026-11-10):** at least 12 characters instead of 6; no forced symbols or digits; block common and leaked passwords.
- **Session ended:**
  - when the token expires during work, a small dialog over the same page asks only for the password (email fixed);
  - the user carries on in place and unsaved changes are kept;
  - it works with today's tokens.
  - Session length (owner, 2026-11-10): the session ends after 8 hours without activity (today: 12 hours from sign-in).
- **My account:**
  - sections Profile (read only, kept by the administrator), Preferences, Password, My access (read only, with whom to ask);
  - on a laptop, a small section menu at the side;
  - **new:** language and theme (light / dark / match my device) are saved on the account, not in the browser, so they follow the user to any device; they apply at once;
  - "sign out of all devices" needs server sessions (v3).
- **User guide (Reader pattern):**
  - a contents list that follows the reading position (D78) and text at a reading width;
  - each person sees only the parts their permissions allow (D78);
  - **new:** search inside the guide;
  - it opens in the account's language with a switch, and can be printed;
  - the header "?" opens this page's section in a side panel, with "Open the full guide". It replaces D78 (6)'s floating button (agreed in the shell step);
  - on tablet and phone the contents sit behind a "Contents" button.
- **PDF viewer:** inside the app, with a bar (back, name, size, where it shows, Download, Open in new tab), and the document shown by the browser's own viewer. On a phone: "Open" and "Download" instead, because phones show PDFs badly inside a page.
- **System pages:**
  - Not found, with the likely reason and two ways back;
  - Server error, with "Try again" and a **reference code** that the server also writes to its log (new, small backend change), for IT;
  - Offline: a bar under the header ("keep reading; saving is paused; nothing is lost") and a disabled Save.
- **Tablet (all pages):**
  - the sidebar becomes an icon rail, with ☰ for the full menu (see "App shell");
  - pages use the full width; side columns (contents, section menus) move above the content or behind a button;
  - long tables stay tables (not cards).

## Open questions
- None open right now. (Closed on 2026-11-10: Programme Manager also edits; monitoring has gaps, not dates; the project team is set by admin / specialist; deleted items kept 30 days; location and component stay free text; passwords at least 12 characters; sessions end after 8 idle hours.)

## Next steps
1. Close the open questions above.
2. App shell: sidebar, header, project navigation, context slot, Help — options compared with the owner on screen (playground), decision with reasons. **Done: option 1 agreed (see "App shell" above).**
3. Page by page: priorities and layout. **Proposed for every page group** (core pages, lists and Administration, account / sign-in / readers / system pages), each in a playground under [design/](design/), with phone views and the tablet rule; waiting for the owner's review of the last group.
4. Design system: foundations → components → patterns.
5. Record the outcome as decisions (DECISIONS.md), write the v2.5 phase files, and rename the "phase 13" references in CLAUDE.md and plan/ in the same change.
