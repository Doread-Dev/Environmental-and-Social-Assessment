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
- **Help:** decided in the shell step (see "App shell"): the header "?" opens a side panel "Help with this page" (the guide section and the library guidance for the page), with a link to the full guide. No floating button, no sidebar item.

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
Reviewing and editing are not separate kinds of people. The Environmental Specialist, the admin and the Program Manager mainly review and approve, but they also edit at times. So every screen is built from **what this person may do** (their assignments) **and the item's state**, never from a role label:
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
| **Auth** | Sign in, forced password change, the "session ended" dialog (v3: organisation sign-in) |
| **System** | Not found, server error (with a reference code), offline bar; "no access" page |
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
  - the six v2 roles become editable starting roles: the Program Manager gets "approve or return" (owner: they review and approve) and the Reader keeps Export (owner);
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

## Design system foundations (proposal, 2026-11-10 — playground [design/foundations.html](design/foundations.html))
Layer 1 of the design system: the tokens every component is built from. Checked with the accessibility review (WCAG 2.1 AA): every text pair passes 4.5:1 and every border, focus ring and state marker passes 3:1, in light and dark.
- **Direction:** neutral, flat working surfaces; green means "act here" or "this is AKF", not the colour of everything (v2 tinted every background and border green, so the main button stopped standing out). One signature only: the **diamond** from the woven AKF mark, used as the marker of each workflow step on the spine (it carries the step's state with an icon inside). The brand shows fully in one place, the sign-in brand panel.
- **AKF palette (found by the main chat, owner agreed to use it, 2026-11-10):** AKF's brand guidelines (the 2025 draft of AKF USA, built on the 2015 guidelines) name **Foundation Green `#00B140`** (PMS 354, the green of the mark), **Verdant Green `#1C7C54`** and **Spring Green `#98D44E`**, plus Deep Turquoise `#177E89`, Earthy Gold `#BEAD48`, Rubine Red and greys. The system uses these instead of a green sampled from the logo PNG. AKF's typeface (Proxima Nova) is commercial and has no Arabic, so IBM Plex stays (D72). If the Syria office has its own guide, it is compared when it arrives.
- **Token tiers:** primitives (AKF Foundation, Verdant and Spring greens, forest, terrain, neutrals) → semantic tokens used by components (`--color-action`, `--color-text`, `--color-surface`, `--info-fg` …) → component tokens (layer 2). Components never use raw values.
- **Colour:**
  - the action colour (primary buttons, links, focus, the selected item) is AKF **Verdant Green `#1C7C54`** in light mode (5.2:1 with white) and AKF **Foundation Green `#00B140`** in dark mode (6:1, dark text on it). Foundation Green is 2.9:1 on white, so in light mode it is used only for the mark and the brand panel. Today's primary `#008C54` fails with white text (4.3:1), so this is also a fix;
  - neutral canvas `#F4F6F5`, white surfaces, dividers `#D9DFDB`, input borders `#86918B` (3:1), two text levels (text, muted);
  - status families, each with text, fill and border: info (in review), ok (approved), warn (returned, gaps), danger (errors, delete, high risk), neutral (draft, locked, archived), violet (category D, emergency);
  - impact levels: high, medium, low, negligible, each with its own text colour and a 3-2-1-0 bar meter;
  - terrain scale (pale green, Spring, a middle green, Verdant, forest, echoing the Syria map) for the brand panel and one-direction charts, never for status; AKF's other colours (Deep Turquoise, Earthy Gold, Rubine Red) are kept for categorical charts, chosen with the charts in layer 2;
  - dark mode: charcoal with a trace of green (canvas `#101412`, surface `#171C19`); floating things are lighter as well as shadowed; the action colour is Foundation Green with dark text.
- **Type:** IBM Plex Sans + IBM Plex Sans Arabic (D72), weights 400 / 500 / 600 only (700 is too heavy in Arabic; drop it from the bundle). Scale 12 · 13 · 14 · 16 · 18 · 24 · 30 px: 14 is the UI default (tables, controls), 16 is reading text (guide, help), 24 the page title, 30 only on sign-in. Arabic keeps the sizes with taller lines (14/24, 16/28) and a 13 px minimum. No letter-spacing and no all-caps anywhere. Tables use tabular figures. In code the sizes are written in rem so the browser's text size setting applies.
- **Space and sizes:** 4 px grid (4 … 64). Controls 32 / 40 / 48 (small in table cells and toolbars, medium elsewhere, large on sign-in and the phone's main action); on touch screens small becomes 40 and medium 44. Header 56, sidebar 264, icon rail 64, side panels 400, reading width 72 characters, table rows at least 44.
- **Breakpoints:** phone under 640 (drawer), tablet 640–1199 (icon rail), laptop 1200 and up (full sidebar), wide 1600 and up. 1200 because below it the full sidebar takes too much of a long table's width.
- **Shape:** radius grows with the size of the thing: 4 (buttons, inputs, badges), 8 (cards, tables, menus, notices), 12 (dialogs, drawers, sign-in), round only for avatars, counts and switches.
- **Elevation:** flat by default (borders separate surfaces). Shadow means "floats": level 1 save bar and sticky table header, level 2 menus and toasts, level 3 dialogs, drawers and side panels.
- **Focus:** a 2 px ring in the action colour, 2 px from the element, always visible.
- **Motion:** only in answer to an action (open, close, save), never on page load, no hover lifts. 120 ms (hover, press), 200 ms (menus, toasts), 280 ms (drawers, panels, dialogs); entering eases out, leaving is quicker. With the device's reduced-motion setting nothing slides: things fade in 120 ms and loading skeletons stop shimmering.
- **Status never by colour alone:** every state is an icon and a word; categories are the letter in a square plus the name (A high risk, B low–moderate, C negligible, D emergency, E insufficient information (dashed), F positive impact); impact levels carry the bar meter.
- **Icons:** Material Symbols Outlined (D37, bundled), 20 px in controls and 16 px in badges; arrows and chevrons mirror in Arabic, other icons do not.
- **Locale formats:** formatted by the browser from one locale per language, never by hand. Dates as "9 Nov 2026" (never 09/11/2026). **Arabic (owner, 2026-11-10): Western digits 0123** (the same as Excel, the exports and data typed in English) and **Levantine month names** (كانون الثاني، تموز، تشرين الثاني), i.e. the `ar-SY` locale with Latin digits; times in 24 hours; "3 days ago" with the full date on hover; the project code (ESMS-024) always in Latin letters and digits.
- **Brand panel (sign-in):** deep forest green, the diamond lattice fading down, the Syria map in the terrain greens, the AKF logo in white. The map PNG (700 KB) becomes a light SVG in the build.

## Components, group 1: actions and inputs (proposal, 2026-11-10 — playground [design/components-inputs.html](design/components-inputs.html))
Layer 2 of the design system, first group: everything a person presses or fills in. Each component is shown in all its states (default, hover, keyboard focus, pressed, unavailable, working, error), light and dark, English and Arabic, mouse and touch sizes. Built only from the foundation tokens; the playgrounds take the tokens from [design/foundations.html](design/foundations.html) through [design/sync-tokens.js](design/sync-tokens.js), so every playground uses the same values (`node plan/design/sync-tokens.js <playground>` after a foundations change). The `design-playgrounds` entry in `.claude/launch.json` serves the folder on port 5510 for the browser pane.
- **Button:** four variants only: primary (one per screen state, the step that moves the work on), secondary (bordered: Export, Upload, Add row), ghost (Cancel, Discard, table tools) and danger (only inside a confirmation dialog). Sizes 32 / 40 / 48 (touch 40 / 44 / 48). The primary action sits at the end of every row (page header, save bar, dialog), the quieter ones before it. Labels are a verb and its object ("Submit for review", "Save changes"), and the message after it uses the same words ("Submitted for review"). While working, the button keeps its width, shows a spinner and refuses a second press.
- **Unavailable actions:** an action that only lacks input stays available and, when pressed, lists what is missing; an action that cannot run now (offline, wrong state) stays visible, marked unavailable, with the reason written next to it. No silent greyed-out buttons.
- **Icon buttons and the "⋯" menu:** icon-only buttons only for icons everyone knows (more, help, close, notifications), each with a tooltip and an accessible name. The "⋯" menu groups the secondary actions; the destructive one comes last, in red, with "…" because it opens a confirmation; an unavailable item says why under its name. Full keyboard: arrows, a letter to jump, Esc returns focus to the button.
- **Field anatomy:** the label is above the box and always visible (never a placeholder as the label); the hint sits under the label, before the box, so screen readers read it first; the error sits under the box with an icon. Short forms (new project, users, account) mark the few **optional** fields "(optional)". Tool pages never block a draft save: what is missing is checked on "Submit for review", with a summary at the top that links to each field. Read-only values are plain text, not grey boxes.
- **Error wording:** what happened and how to fix it, no apology and no codes ("Enter an end date after the start date (1 Apr 2026)", not "Invalid date"; a version conflict says someone else saved and that the user's changes are kept).
- **Text and numbers:** every box for the user's own text follows the direction of what is typed (`dir="auto"`), so Arabic typed in the English interface lines up on its own. Numbers use aligned figures with the unit inside the box (m³, %). Long text grows to 10 lines, then scrolls; the 30,000-character counter (D74) appears only in the last 10%.
- **Choices:** the browser's own select for short fixed lists (up to about 15); a **combobox with search** for long or growing lists (people, library items, projects), one or several, with the match marked and chosen items as removable chips; checkboxes for independent choices and the permission grid (with a "some selected" state); radio buttons when 2–5 options should all be seen; a **switch only for settings that act at once** (no Save); a segmented control for a view or mode (theme: light / dark / match my device).
- **Dates:** our own date field instead of the browser's date box (whose format follows the computer, e.g. 09/11/2026), showing "1 Apr 2026" / "1 نيسان 2026", accepting typed dates, with a calendar from the icon (Levantine months in Arabic, Latin digits). A **quarter picker** for monitoring shows which quarters are filled and which are empty, so gaps show while entering data too.
- **Upload:** a "Choose files" button first (works on phones and with the keyboard), dropping as a laptop shortcut; the allowed types and the size limit are written before anyone tries. Several files can be chosen; they go up one by one (the server takes one file per request, no backend change); each file shows its own state (uploading with progress and Cancel, uploaded, or the reason it was refused and the fix). One bad file does not stop the others.
- **Search:** filters while typing (after a short pause), shows "4 of 23 projects", has a clear button, and keeps the text in the page address like the filters. The header search (Ctrl K) is designed with the overlays group.
- **Arabic interface text:** simple Modern Standard Arabic, buttons as verbal nouns ("حفظ التعديلات", "إرسال للمراجعة"); the notes to the owner stay Levantine. Arabic labels run about 25% longer, so no button or column has a fixed text width.
- **Still to come in layer 2:** group 2, data display (table with sorting, selection, bulk bar and editable cells; pagination; badges; key-value lists; stat tiles; empty, loading and error states; activity items; charts, with the dataviz rules); group 3, navigation and overlays (sidebar items and the diamond spine, tabs, breadcrumb, the phone step bar, notices, toasts, dialogs and confirmations, side panels, tooltips, the save bar, notifications list, Ctrl K search).

## Build notes for the v2.5 phases (collected during the design, 2026-11-10)
**How these are handled:** the design stage (this file) only records them. Step 5 below turns them into decisions in [DECISIONS.md](DECISIONS.md) and puts each one in the scope of a v2.5 phase file in [phases/](phases/); the phase session that owns that part builds and tests it, and the main chat reviews the code. **Rule (owner, 2026-11-10):** questions about implementation (sizes, types, limits, server settings) are still asked as they come up, and the answer is recorded here; but the work is **assigned to the phase that builds it**, never done now at the expense of the design. v2.5 is above all the design: small and medium changes the design needs go in this table; a large structural change goes to v3 ([V3_VISION.md](V3_VISION.md)) instead. A related change that fits with an item already here (permissions, project code, deleted items, passwords…) is added to this table.

| Item | Where it came from | Notes for the phase |
|---|---|---|
| Access model: permissions, editable roles, scopes (organisation → project), assignments; every access change logged | Access model | Plugs into the 7a seams (D65, D66); the biggest backend piece of v2.5. |
| Error codes for a multilingual interface | Where v2.5 sits | The server returns codes, the interface writes the message in the user's language. |
| Server error reference code written to the log | System pages | Shown to the user for IT. |
| In-app notifications (waiting for review, approved, returned) | Agreed list | Email on the same events only if the server can send mail (IT item). |
| Project code (ESMS-024) given by the server | Lists | Searchable, in exports. |
| `last sign-in` on users | Users page | |
| Deleted items: soft delete, kept 30 days, then removed | Administration | Projects, project files, library documents. |
| Language and theme saved on the account | My account | Apply at once, follow the user to any device. |
| Passwords: at least 12 characters, no forced symbols, block common and leaked passwords | Owner, sign-in | Replaces the 6-character minimum. |
| Session ends after 8 hours without activity; "session ended" dialog that keeps unsaved changes | Owner, sign-in | Today: 12 hours from sign-in (`JWT_EXPIRES_IN`). |
| Search inside the user guide | Readers | |
| **Upload size stays configurable** (owner, 2026-11-10) | Components group 1 | Never fixed in code. Today a server setting, `MAX_UPLOAD_MB` (10 MB by default). The phase decides with the owner whether the administrator can also change it in the app, and the right default for full assessment reports with annexes. The interface always shows the current limit from the server. |
| **Site photos can be uploaded** (owner, 2026-11-10) | Components group 1 | Today only PDF and Office files are accepted. The phase adds image types (at least JPG and PNG; iPhone HEIC to be checked), with the same file-signature check as the other types, and shows them as images (preview, not only a download). |
| Syria map as a light SVG; IBM Plex weight 700 dropped from the bundle | Foundations | Frontend only. |

## Open questions
- None open right now. (Closed on 2026-11-10: Arabic digits 0123; Levantine month names; AKF palette from AKF's brand guidelines; Program Manager also edits; monitoring has gaps, not dates; the project team is set by admin / specialist; deleted items kept 30 days; location and component stay free text; passwords at least 12 characters; sessions end after 8 idle hours.)

## Next steps
1. Close the open questions above. **Done.**
2. App shell: sidebar, header, project navigation, context slot, Help — options compared with the owner on screen (playground), decision with reasons. **Done: option 1 agreed (see "App shell" above).**
3. Page by page: priorities and layout. **Done (owner approved all groups, 2026-11-10):** shell, core pages, lists and Administration, account / sign-in / readers / system pages, each in a playground under [design/](design/), with phone views and the tablet rail. A consistency pass over the four playgrounds and these notes followed the same day: where they differed, these notes win.
4. Design system: foundations → components → patterns. **Foundations done** (2026-11-10, owner answered the locale questions and agreed to AKF's palette). Components: group 1 (actions and inputs) proposed; groups 2 (data display) and 3 (navigation and overlays) next.
5. Record the outcome as decisions (DECISIONS.md), write the v2.5 phase files (each build note above goes into the scope of one phase), and rename the "phase 13" references in CLAUDE.md and plan/ in the same change.
