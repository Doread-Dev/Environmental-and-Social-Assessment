# v3 — Structure draft

**What this is:** a working draft of the v3 structure, written with the owner in a design session
(started 2026-11-16). It is the starting point for the v3 review, **not** a set of decisions: nothing
here enters [DECISIONS.md](DECISIONS.md) until the v3 review turns it into decisions. It builds on
[V3_VISION.md](V3_VISION.md) (the reminder list) and on the v2.5 decisions D80–D95, which it does
not change.

**How to read it:** every item carries a status.

- **[AGREED]** — the owner agreed in the session (date given).
- **[PROPOSAL]** — Claude's recommendation, not yet discussed or not yet confirmed.
- **[OPEN]** — needs an answer from the owner, the client or the client's IT.

No code is written from this file. Design-system, layout and navigation choices are delegated to
Claude (owner's standing rule); the owner answers domain and business questions.

---

## 1. Goals and scope

### 1.1 Goals of v3

| # | Goal | Status |
|---|---|---|
| G1 | **Global use:** AKF offices in other countries use ESMS, entering from AKF's global platform. | [AGREED 2026-11-16] (online first, §6; client hint 2026-11-10) |
| G2 | **Activities inside a project:** an activity is a mini-project that goes through the tools on its own. | [AGREED 2026-11-16] (§2.3) |
| G3 | **Structural rebuild to enterprise level:** identity and sessions, full history, configurable reference data, data integrity, observability. | [AGREED] as a goal (owner 2026-11-04); the technology is its own stage (§6.1) |
| G4 | **Client features not disclosed yet** — the structure must leave room for them. | [OPEN] |

### 1.2 What stays from v2.5

| Item | Status |
|---|---|
| The v2.5 design system (tokens, components, patterns) as it is (D80, D86, D87). | [AGREED] (D80) |
| The app shell: one switching sidebar, the workflow spine, the reserved Activities slot, the header context slot (D84). | [AGREED] (D84) |
| Page patterns, and the server-driven step pattern: kind, state, missing fields, allowed actions (D85, D88). | [AGREED] (D85, D88) |
| The access model's shape: permission → role → scope → assignment, union of assignments (D82). v3 adds scope levels, it does not replace the model. | [AGREED] (D82) |
| Screens follow permissions, not role names (D83). | [AGREED] (D83) |
| English + Arabic interface, one locale per language (D81). | [AGREED] (D81) |
| Notifications, deleted items, project code, account rules (D89–D93). | [AGREED] (D89–D93) |
| The backend seams: one project-access check, named permissions, one audit writer, places by key (D64–D66). | [AGREED] |

### 1.3 Out of scope for v3 (proposal)

- A redesign of the interface (v3 changes the structure under the v2.5 design).
- Features nobody asked for (programme records, sector grouping) unless the client asks.

---

## 2. Domain model

### 2.1 The organisation tree (scopes)

**[AGREED 2026-11-16]** One tree of *organisation units*, each node a possible scope for
assignments. v3 builds **one new level, the country office**; the tree is stored as data so a level
the client asks for later is added without a rebuild:

```
Organisation (AKF)
└── Office (a country office: "AKF Syria")          ← new in v3
    └── Project
        └── Activity                                ← new in v3
```

- The tree is data (one `org_units` collection/table with a parent and a kind), not code, so a level
  the client asks for later (region above offices, field office below a country, a programme between
  office and project) is a new *kind*, not a rebuild.
- Every project belongs to exactly one office. Every user has a home office.
- **[OPEN, for the client]** Whether other levels are really in use (regions grouping countries,
  field offices inside a country, other AKDN agencies beside AKF). The owner knows of none today;
  the structure does not depend on the answer.

### 2.2 The workflow unit

**[AGREED 2026-11-16]** The thing that goes through Tools 1–5 becomes its own entity, the **workflow unit**
(already one pattern in the v2.5 design, concept §"Design for variation"):

- A project owns one workflow unit; each activity owns one workflow unit.
- Screening, assessment, Tool 3/4/5 rows, status history, files and the step states point to a
  `unit_id`, never straight to a project. One implementation of the tools serves projects and
  activities.
- `computeWorkflow(unit)` stays the single source of workflow state.
- **[AGREED 2026-11-16]** A project's unit and its activities' units are independent: see §2.3.

### 2.2a The tool registry (tools are pluggable)

**[AGREED 2026-11-16]** (owner's requirement: "the structure must let us add tools easily, for
activities or for the project as a whole" — the client may ask for the SEMP Plan and Stakeholder
Awareness on activities too, or for new tools.)

Every tool is a **module registered in one tool registry**. The rest of the system (workflow,
navigation spine, permissions, exports, help, deleted items) reads the registry and never names a
tool by hand. A tool's registration declares:

| Field | Meaning |
|---|---|
| `key` | Stable key, also its place key for guidance and help (D64, D78). Never a number or an order. |
| `level` | Where an instance of the tool lives: `unit` (one per project or activity), `office`, `organisation` (GHG Emissions, Environmental Data Collection). |
| `kind` | `reviewed` (submit → review → approve/return), `working` (no approval), `support` (outside the gated path: SEMP Plan, Stakeholder Awareness), `report` (periodic, e.g. one per year). The step pattern of D88 already draws these. |
| `permissions` | The named permissions the tool adds (view, edit, approve, export…), which then appear in Roles & permissions (D82). |
| data module | Its own tables, validation, service and routes behind one module boundary; every row points to a `unit_id` (or an office / the organisation). |
| lifecycle hooks | What it does on archive, delete/restore, purge and migration of its owner, so a new tool cannot be forgotten by the delete cascade (the gap found in the v2 prototype). |
| export | Its sheet(s) in the workbook export. |
| catalogues | Which managed catalogues it reads (§2.4). |

**Which tools a unit has is configuration, not code:** the *workflow definition* (§4) lists, per
unit kind (`project`, `activity`), the tools that apply, their order and their gates. So:

- turning the SEMP Plan on for activities = one more line in the activity definition, with no new
  page, model or migration;
- a brand-new tool = one new module + its registration; the spine, the overview, permissions,
  notifications, help and exports pick it up from the registry;
- a tool for the whole office or organisation uses the same registration with another `level`.

**Start configuration [AGREED 2026-11-16]:** project = Tools 1–5 + SEMP Plan + Stakeholder
Awareness (as in v2.5); activity = Tools 1–5 + its documents. **[OPEN, owner asks the client]**
whether activities also get the SEMP Plan and Stakeholder Awareness, and whether more tools are
wanted.

### 2.3 Activities

**[AGREED 2026-11-16]** (owner accepted the four recommendations of round 1)

1. **Activities add to the project's tools, they do not replace them.** The project keeps its own
   Tools 1–5 for the project as a whole; each activity has its own Tools 1–5. Nothing is copied
   automatically between them (in line with D69: inputs the user fills are never auto-filled).
2. **Activities are optional.** A project with no activities works exactly as in v2.5, so every
   existing project stays valid after the migration.
3. **Roll-up is display only.** The project overview shows a summary of its activities (each
   activity's state, and the highest risk category among them). An activity never blocks the
   project's own steps and never changes the project's category by itself.
4. **An activity is a full unit of its own:** its own code (shape `ESMS-SY-024-A03`: the project
   code, §2.5c, plus an activity number, given by the server, Latin, D93), dates, location,
   documents and team.
5. **Access:** a person with access to a project sees all its activities; a person can also be
   assigned to **one activity only** (activity is a scope level, §3).

**[AGREED 2026-11-16]** (round 6)

- **Who creates an activity:** a new permission "create activity", given at the start to the same
  roles that can edit the project. Creating an activity needs no approval.
- **The risk rating of an activity always comes from its own tools** (its screening and
  assessment), exactly as for a project. It is never a label somebody picks.
- **Activity kind (a descriptive label such as "construction", "training", "distribution") is not
  wanted now.** The structure supports it as an optional managed catalogue (§2.4) on the activity,
  switched off; the owner asks the client whether such a list is wanted (C12).

**[AGREED 2026-11-16]** (round 2)

6. **An activity can be added at any time** after the project exists; it does not wait for the
   project's screening or any other project step.
7. **Archive and delete follow the project:** archiving a project makes its activities read only;
   deleting a project moves its activities with it to Deleted items (30 days, D89) and restoring
   brings them back together. An activity can also be archived or deleted on its own.
8. **Exports:** one workbook per activity; the project workbook gains a sheet summarising its
   activities.
9. **Support modules** stay at project level at the start (§2.2a); moving them to activities is a
   configuration change if the client wants it.

### 2.4 Reference data (lookups) and content translation

**[AGREED 2026-11-16]** (owner: "enterprise level — questions, indicators, categories and the like
must all be editable and manageable")

- Impact questions, indicators, categories, job titles — and every other fixed list a tool reads
  (file categories, RACI activities, GHG categories, …) — become **managed catalogues**: versioned
  sets edited by an administrator in the app, not seed files or code constants.
- **One global catalogue for every country**, managed by the global administrator. An office does
  not change it; office-specific *additions* on top of the global set are added only if the client
  asks (the structure allows an `office` owner on a catalogue item).
- Editing happens on a **draft version**; publishing makes it the current version for new units.
  Items are retired, never deleted, so old data keeps its meaning.
- A permission "manage catalogues" (global scope) and an entry in the audit log for every publish.
- A unit is **pinned to the catalogue version it started with**, so editing a question never changes
  an approved screening.
- **[AGREED 2026-11-16]** Every catalogue text is stored per language (`{ en, ar, … }`), with
  English as the fallback — this is the "content translation" left open by D81. v3 starts with
  English and Arabic; another language is added as data (interface strings + catalogue
  translations), with no structural change.
- **[AGREED 2026-11-16]** **What people type is never translated by the system:** it is stored and
  shown as written (`dir="auto"`, D87).
- **[AGREED 2026-11-16]** **Exports ask for the language** at export time: fixed labels and
  catalogue texts come out in that language, typed content as written.
- **[AGREED 2026-11-16]** (§9.3 K1) Moving a running unit to a newer catalogue version is an explicit action by someone
  who can edit it, never automatic.

### 2.5 Places

**[AGREED 2026-11-16]** (round 5; replaces the round 4 proposal, which was written for an offline
server before the owner said the global platform is online)

- a location is a **point picked on a map** (coordinates) with a name; the free-text field stays;
- a project or activity can have **several** location points (one marked as the main one);
- the country and administrative area are filled from the map at the time of saving and stored
  with the point (editable), so grouping by place never depends on a later lookup;
- the Projects list gains a map view;
- the map provider is chosen in the technology stage (§6.1; the global platform may already have
  one);
- on a stand-alone installation without a map source, coordinates can be typed or pasted and the
  area chosen by hand (the fallback of §6; decided by Claude, delegated).

### 2.5a Office-level and organisation-level tools

**[AGREED 2026-11-16]** GHG Emissions and Environmental Data Collection become **one report per
office and year** (tool `level` = office, §2.2a). The organisation sees the **sum of its offices,
computed**, never typed in. On a stand-alone server with one office nothing changes for the user.

### 2.5b Library

**[AGREED 2026-11-16]** Two layers, on the same model as D64:

- **Global documents** — managed by the global administrator, read by every office.
- **Office documents** — managed by the office administrator, read only inside that office (local
  laws, national guidance).

Both appear under the same "Guidance" button of a page and on the Library page. **Owner's
condition: it must stay organised, not cluttered.** So (design delegated to Claude and decided, §9.6):
the two layers are always shown as two labelled groups ("AKF global", "AKF Syria"), never one mixed
list; inside a group the order is the manager's order; the Library page has one filter for layer
and one for place, and each document shows its layer, language and date; a document belongs to
exactly one layer (no copies between layers).

### 2.5c Project and office codes

**[AGREED 2026-11-16]**

- A project belongs to **exactly one office**. People from another office who work on it are given
  assignments on it (§3); there are no projects shared between offices.
- Every office has a short code (country code: `SY`). The project code carries it:
  `ESMS-SY-024`; an activity: `ESMS-SY-024-A03`. Given by the server, Latin, unique across all
  offices (D93).
- Existing codes (`ESMS-024`) keep working in search and links as **aliases** of the new code, so
  workbooks exported before v3 still lead to their project.

### 2.5d Reports across projects

**[AGREED 2026-11-16]** (round 6) A **Reports** page with a few fixed tables — projects and
activities by state, by risk category and by office; monitoring gaps — each with an Excel export,
and each showing only what the person's assignments allow (an office-scope person sees their
office; an organisation-scope person sees every office). **Built to grow:** the tables read from
one reporting layer over the units, so later versions add wider reports and dashboards without a
structural change (owner: "start with this, wider reports in later versions as long as the
structure allows it").

### 2.6 People and identity

**[PROPOSAL — settled as a recommendation in [ADR-008](v3-architecture/ADR-008-identity-and-sessions.md)]** A user = a person record + one or more *identities* (local password; organisation
account through single sign-on). Home office on the person.

**[AGREED 2026-11-16]** (round 5)

- **Staff sign in with their organisation account only** — no ESMS password for them.
- **People outside the organisation** (third-party readers, donors, consultants) get a **local
  account by invitation:** the office administrator sends an email invitation, the person sets
  their own password (the v2.5 password rules, D91), and the account can carry an optional **expiry
  date**. An external account is marked as external wherever people are listed.
- **Email:** the notification events of D90 are also sent by email; each person can switch email
  off in My account. "Forgot your password?" becomes a reset link by email for local accounts
  (replaces D91's "the administrator gives a temporary one" where email exists). No time-based
  reminders: monitoring keeps "gaps, not dates" (D90). **[AGREED 2026-11-16]** An account created on first sign-in from the global platform starts
with **no access**; the administrators of its office are notified ("New person needs access") and
assign a role (same pattern as "New project needs a team", D82/D90).

---

## 3. Access model changes

**[AGREED 2026-11-16]** (the items below, with §9.4)

- Scope levels grow from `organisation → project` to
  `organisation → office → project → activity` (the tree of §2.1). An assignment on a node covers
  everything under it. **[AGREED 2026-11-16]** for the activity level: project access covers every
  activity of the project, and a person can be assigned to a single activity. A person assigned
  only to an activity sees the parent project's name and code (to know where they are) but not the
  project's own tools or its other activities (§9.2 A5).
- **[AGREED 2026-11-16]** "Administrator" splits by scope: a **global administrator** (offices,
  roles, catalogues, workflow definitions) and an **office administrator** (users and access inside
  their own office only; never sees or changes another office's people). On a stand-alone server
  the same person can hold both.
- **[AGREED 2026-11-16]** Roles stay admin-managed bundles (D82) in **one global list**, so a role
  means the same in every country. Office-defined roles only if the client asks.
- A restricted person never sees names or counts outside their scopes (D82 rule, applied to offices
  too).
- **[AGREED 2026-11-16]** **People across offices:** every person has one **home office** and can be
  given assignments in other offices. The office switcher in the header (the D84 context slot)
  appears only for a person with access to more than one office.
- **[AGREED 2026-11-16]** **Head office:** a person with an organisation-scope assignment sees the
  projects of every office in the same lists, with an "Office" filter and column. Cross-country
  comparison dashboards are not built until asked.
- Teams/groups: only if asked.

---

## 4. Workflow changes

- **[AGREED 2026-11-16]** **One path for everyone at the start:** the five steps and their rules stay
  as in v2.5 for every workflow unit, in every office, for projects and activities (Tools 1–2
  reviewed, Tools 3–5 without approval, D88).
- **[AGREED 2026-11-16]** **Multi-level approval is supported by the structure, not switched on:** a
  reviewed step's definition holds an ordered list of approval levels (one level today). A second
  level (for example office reviewer, then head office) is a change of the definition when the
  client asks, not a rebuild.
- The workflow definition (per unit kind: which registered tools apply, their order, kind and
  gates — §2.2a) moves from code constants to a **versioned workflow definition** read by
  `computeWorkflow`, so a different path (per unit kind, later per office) is data. **[AGREED
  2026-11-16]** for "which tools a unit has is configuration". Not a visual workflow designer.
- **[AGREED 2026-11-16]** **Revisions:** each approval of a reviewed step freezes a numbered revision
  (Revision 1, 2, …) that can be read and exported later. Reopening (D88) starts a new revision and
  never erases an earlier one.
- **[AGREED 2026-11-16]** **Field-level history:** every write records who changed which field,
  when, and the old and new value (extends the D65 audit entries, which stay for critical actions).
  It is read by people with a new permission "view history" on the project or activity. History is
  append-only: nobody edits or deletes it in the app.

---

## 5. Data migration from v2.5

**[AGREED 2026-11-16]** (round 5) **How Syria moves:**

- Syria is the **first office on v3** and the test of the migration.
- Syria keeps working on v2.5 until v3 is ready; the two systems are **never run side by side**.
- **One cut-over on a set day:** rehearsals of the migration on a copy of the data beforehand, a
  full backup, the migration, checks, then people sign in to v3. v2.5 stays **read only** for a
  period afterwards (length to set with the client), then is retired.

**[AGREED 2026-11-16]** What the migration does (details in §9.1):

- One office is created ("AKF Syria", code `SY`); every project is attached to it; every user's
  home office is Syria.
- Project codes become `ESMS-SY-nnn`, with the old code kept as an alias (§2.5c).
- Free-text locations are kept as text; map points are added by people afterwards (never guessed).
- Staff accounts are matched to organisation accounts by email at first sign-in; accounts of
  people outside the organisation stay local.
- Every project gets one workflow unit; tool data is re-pointed from `project_id` to `unit_id`.
- Organisation-scope assignments become **office-scope (Syria)** assignments. Syria's current
  administrator also holds the global role until the client names theirs (§9.1 M1).
- The seeded lookups become catalogue **version 1**; every existing unit is pinned to it.
- The audit log, files, notifications and deleted items are carried over as they are.
- The migration is a scripted, repeatable, tested step with a dry run and a backup first; never by
  hand.

---

## 6. Architecture

- **Deployment shape [AGREED 2026-11-16]:** **one product, two shapes.** The same build runs
  (a) **central** — one installation holding many offices — or (b) **stand-alone** — one
  installation holding a single office, offline, as Syria runs today. The choice per country is a
  deployment setting, not a fork of the code, so the structure does not wait for the client's
  hosting decision. Consequences:
  - the office level always exists in the data (a stand-alone server simply has one office);
  - every identifier that may one day meet another installation's data is globally unique (UUIDs,
    and project codes that carry the office code, §2.5c);
  - sign-in works both with an organisation account (central) and with local accounts (stand-alone);
  - **[AGREED 2026-11-16] (owner's correction, round 4): the global platform is online — do not
    design v3 around an offline server.** The central shape assumes the internet and may use
    online services (map, email, organisation sign-in). D37's "no runtime internet dependency" is a
    v2/v2.5 rule for the Syria server and no longer limits what v3 can offer;
  - **[AGREED 2026-11-16] v3 is online first.** Every feature is designed for the online, central
    shape. A stand-alone installation stays **possible** for a country whose rules keep data inside
    it; without internet it simply runs **without the online features** (map picking, email,
    organisation sign-in → typed coordinates, in-app notifications only, local accounts). Nothing
    is designed around that case;
  - **[AGREED 2026-11-16]** **an office can be moved** from a stand-alone server into the central
    one: a full export/import of one office (its data, files, history and people), which is why
    identifiers are globally unique from day one;
  - **[PROPOSAL 2026-11-17]** (owner: some countries will require their own server or forbid
    data from leaving — how do they stay connected to the head office?) **country installations
    are linked to the central one as a hub with spokes:** global settings (catalogues, roles,
    workflow definitions, the global library) flow down as signed packages and are read-only in
    the country; head-office people open the country's site with the same organisation account
    and need an assignment there like anyone from another office (§3); a summary without names
    flows up for the global reports only where that country allows it. Details:
    [ADR-023](v3-architecture/ADR-023-country-installations-and-the-head-office.md).

### 6.1 Technology — a separate stage, not decided here

**[PROPOSAL 2026-11-17] The stage has run:** its output is the system overview and the 23
architecture decision records in [v3-architecture/](v3-architecture/README.md). They are
recommendations (best enterprise-level option now, adjusted when the client answers), not
decisions; the ones that wait for a client fact say which (C1–C19). In one line: a modular
monolith with the server in C# on .NET and the interface in React and TypeScript, on PostgreSQL;
organisation sign-in through OpenID Connect with server-side sessions; history written by the
database; tools as modules with workflow paths as data; one container image hosted in the
client's cloud, with country installations linked to it as hub and spokes. (The first pass
recommended TypeScript for the server too; the owner asked for a choice on merit alone and the
server recommendation changed — ADR-003.)

**[AGREED 2026-11-16]** (owner) The technology choices (database, languages, frameworks, sign-in
technology, how ESMS connects to the client's systems) are **not decided in this draft**. They get
their own stage, after the domain structure above is settled:

- **How:** a dedicated architecture session that reads the whole project and writes architecture
  decision records with the installed engineering skills (architecture, system design, and the
  others where they fit), option by option with trade-offs.
- **The owner's criteria:** the best decision on the right foundations. **Cost is not a
  constraint** — rewriting the whole application, in any language, is acceptable. Staying close to
  how the client's organisation already works (their accounts, their systems, their hosting) matters
  more than staying close to today's code.
- **What is needed first** (facts about the client, §7.1): how staff accounts work, what the global
  platform is built on and how it links to other tools, what databases and servers the client's IT
  runs, where data may live.

**Inputs already known** (to verify, not decisions):

- The owner believes the client's systems are SQL-based; a relational database for ESMS is "most
  likely yes", to be confirmed in that stage.
- Staff use organisation email accounts (the Syria environment lead's address is on the `akdn.org`
  domain), so an organisation-wide directory probably exists; which identity provider is behind it
  is a question for the client's IT.
- **Claude's starting lean, to be tested in that stage, not a decision:** PostgreSQL, TypeScript on
  both sides, a modular monolith (modules: identity, access, org, workflow, tools, files,
  catalogues, history, notifications), OpenID Connect sign-in beside local accounts, server-side
  sessions with revocation.

**Constraints that hold whatever is chosen** (they come from agreed items):

- one build, two deployment shapes (central online, the design target; stand-alone possible,
  without the online features when it has no internet);
- online services (map, email, organisation sign-in) sit behind interfaces, so the core work
  (filling, reviewing, exporting) never fails because one of them is down;
- transactions and referential integrity for the tree of scopes, assignments, revisions and history;
- globally unique identifiers; export/import of one office;
- a scripted, tested migration from v2.5 (§5);
- observability: structured logs, error tracking, health and metrics.

---

## 7. Open questions (running list)

| # | Question | For | Status |
|---|---|---|---|
| Q1 | Activities: do they replace or add to the project's own tools? | owner | **answered** — add (§2.3) |
| Q2 | Activities: optional or required; what rolls up to the project? | owner | **answered** — optional, display-only roll-up (§2.3) |
| Q3 | Activities: own team, code, dates, location, documents? | owner | **answered** — yes (§2.3) |
| Q4 | Deployment: central, per country, or both? Does the Syria server stay? | owner / client | **answered** — one product, two shapes (§6); which shape each country uses is the client's choice |
| Q5 | Organisation levels that really exist (regions, field offices, other agencies). | owner / client | **answered** — build the country office only; tree is data; client to confirm other levels |
| Q6 | Catalogues: one global set or per-office additions? | owner / client | **answered** — one global, managed in the app, versioned (§2.4) |
| Q7 | Roles and administration: global or per office? | owner | **answered** — global + office administrators, one global role list (§3) |
| Q8 | How do staff sign in to the global platform (identity provider)? | client IT | — |
| Q9 | The client features not disclosed yet. | owner / client | asked, no answer yet |
| Q10 | Activities: when may one be added; archive/delete with the project; support modules per activity; exports. | owner | **answered** (§2.3 6–9) |
| Q12 | Do activities also get the SEMP Plan and Stakeholder Awareness? Are more tools wanted (project or activity)? | owner asks the client | — (structure ready either way, §2.2a) |
| Q11 | Moving one office's data from a stand-alone server into the central one. | owner / client | **answered** — yes, export/import of one office (§6) |
| Q13 | One person in several offices; head-office view. | owner | **answered** (§3) |
| Q14 | Approval path per country / for activities; multi-level approval. | owner | **answered** — one path, levels supported but off (§4) |
| Q15 | History and revisions. | owner | **answered** (§4) |
| Q17 | Office-level tools (GHG, Environmental Data); library layers; one office per project and the code; languages and exports. | owner | **answered** (§2.5a–c, §2.4) |
| Q18 | Location of a project/activity now that the platform is online. | owner | **answered** — map points (§2.5) |
| Q19 | Must a stand-alone installation without internet still be supported in v3? | owner | **answered** — online first; stand-alone possible without the online features (§6) |
| Q20 | People outside the organisation (third-party readers): how they get an account. | owner | **answered** — email invitation, local account, optional expiry (§2.6) |
| Q21 | Email notifications and password reset by email. | owner | **answered** (§2.6) |
| Q22 | How Syria moves to v3. | owner | **answered** — first office, one cut-over (§5) |
| Q23 | Order of delivery: one release or stages; what the client needs first. | owner / client | **answered** — three stages, order to confirm with the client (§8.1, C11) |
| Q24 | Reports across projects (office and organisation level). | owner | **answered** — a Reports page with a few fixed tables, wider reports in later versions (§2.5d) |
| Q25 | Who creates an activity; activity kinds. | owner / client | **answered** — permission "create activity"; kinds supported but off, client asked (§2.3, C12) |
| Q16 | Technology (database, languages, sign-in technology, integration). | separate stage | **proposed** — [v3-architecture/](v3-architecture/README.md), 23 ADRs; confirmed after the client facts |

### 7.1 Facts to collect from the client and their IT (before the technology stage)

The sheet the owner takes to the client, in English and Arabic: [V3_CLIENT_QUESTIONS.md](V3_CLIENT_QUESTIONS.md).

| # | Fact | Why it matters |
|---|---|---|
| C1 | How staff sign in at work: which identity provider (for example Microsoft Entra ID / Active Directory, Google, another), one directory for all AKDN or one per agency/country, multi-factor rules. | Decides the sign-in technology and how accounts are created. |
| C2 | What the global AKF platform is: product or custom build, its technology, and how it opens other tools (a plain link, single sign-on, an embedded frame, an API). | Decides the entry from the platform and deep links. |
| C3 | Which databases and server systems the client's IT runs and supports (SQL Server, PostgreSQL, other; Windows or Linux; cloud or own servers). | A stack their IT already operates is easier to host, back up and approve. |
| C4 | Where data may live: one central hosting, or countries whose data must stay inside them. | Decides which countries are central and which stand-alone. |
| C5 | Whether ESMS must exchange data with other systems (project lists from the global platform, reporting tools, document storage). | Decides the integration layer (APIs, import/export). |
| C6 | Which countries and how many users are expected first, and when. | Sizing and the order of the roll-out. |
| C7 | Whether the server can send email (open IT item since v2). | Notifications by email (D90). |
| C8 | Other organisation levels in use (regions, field offices, other AKDN agencies) — Q5. | Extra scope levels. |
| C9 | The SEMP Plan and Stakeholder Awareness on activities, and other tools wanted — Q12. | Start configuration of the tool registry. |
| C10 | The features the client has not disclosed yet — Q9. | May shape the structure. |
| C11 | What the client needs first: activities for Syria, or the global roll-out (other countries, entry from the global platform) — Q23. | Order of the delivery stages (§8.1). |
| C13 | Whether every office reports by calendar year; which languages beyond English and Arabic, and who translates the catalogues. | Periods of the yearly reports; languages are added as data. |
| C14 | Rules on keeping and removing data (project records after closing, personal data). | A retention rule would be a setting; v3 removes nothing by itself. |
| C15 | Who maintains and extends the code in the long term (the supplier or the client's IT), and whether IT mandates a platform or language for applications it hosts. | Language of the server (ADR-003). |
| C16 | The client's security requirements: standards they follow, an assessment or penetration test they require before go-live, how they classify this data. | Security baseline (ADR-018). |
| C17 | Working hours per office, how much downtime and data loss is acceptable, who is called when the service is down. | Availability and recovery targets (ADR-016, ADR-017). |
| C18 | Whether the client has a mapping (GIS) team, a map service, and preferred administrative boundaries. | Boundary dataset and map provider (ADR-021). |
| C19 | For a country that must keep its data inside: online or offline; may head-office staff view it from abroad; may a summary without names be sent for global reports; who hosts and operates its server. | How that country links to the central installation (ADR-023). |
| C12 | Whether activities should carry a kind (a descriptive list such as construction, training, distribution) — Q25. | Switches on an optional catalogue; no structural change. |

---

## 8. Proposed phase outline

**[AGREED 2026-11-16]** as the working order (§9.8); the technology stage may regroup phases.

1. v3 review and decisions (this draft → D-numbers), after the client facts of §7.1 are collected.
2. **Technology stage** (§6.1): architecture decision records for the database, languages, sign-in
   and integration; then the platform base (module layout, migration tooling). *Run on 2026-11-17
   as proposals: [v3-architecture/](v3-architecture/README.md).*
3. **Platform base:** module layout, the history writer (field-level, used by every later module),
   sessions, migration tooling, CI, observability. It starts with a **walking skeleton** (one thin
   slice through sign-in, access, one unit, one tool, history, a revision and an export) that
   proves the stack before the modules are built (ADR-001, ADR-004).
4. **Organisation tree and access:** offices, scopes on the tree, global and office administrators,
   the office switcher and the "Office" filter.
5. **Workflow unit, tool registry, workflow definitions:** Tools 1–5 as registered modules pointing
   to units; approval levels in the definition.
6. **Managed catalogues:** versions, draft/publish, translations, pinning of units.
7. **The other tools as modules:** SEMP Plan, Stakeholder Awareness (unit level), GHG Emissions,
   Environmental Data Collection (office level, organisation total); library in two layers; files.
8. **Activities:** model, codes, access, the spine one level down, overview roll-up, archive/delete
   with the project.
9. **Revisions and history pages:** numbered revisions, reading and exporting an old revision, the
   history panel.
10. **Identity and email:** organisation sign-in, entry and deep links from the global platform,
    invitations for outside people, email notifications and password reset.
11. **Places:** map points, areas from the map, the map view of projects.
12. **Exports:** language at export time, activity workbooks, the activities sheet.
13. **Migration from v2.5:** the script, rehearsals on copies, the Syria cut-over.
14. **Office export/import and the stand-alone package.**
15. **Release readiness:** E2E of the golden flows, security and performance review, docs, user
    guide in both languages.

Every phase keeps the rules of the v2.5 phases (tests, CI, coverage floors, docs in the same
change, the design system as it is).

### 8.1 Delivery stages

**[AGREED 2026-11-16]** v3 is delivered in stages, not as one big release. **The order of the
stages stays open until the owner has asked the client (C11)**; the structure does not depend on
it, because offices, units and the tool registry exist from the first stage in every order.

| Stage | Holds | Phases |
|---|---|---|
| **v3.0** | The whole new structure (one office in use), the tool registry, managed catalogues, activities, history and revisions; Syria moves to it. | 3–9, 12, 13, 15 |
| **v3.1** | Several offices in use, organisation sign-in and entry from the global platform, invitations and email, the first other country, office export/import. | 10, 14 (+ the office pages of 4) |
| **v3.2** | Map points and the map view, the Reports page beyond its first tables, later additions. | 11 |

If the client wants the global roll-out first, v3.0 and v3.1 swap: offices and sign-in first with
the tools as they are, activities next.

### 8.2 v2.5 and v3: the work order

**[AGREED 2026-11-16]** (owner) **v2.5 is built as planned** (phases 15–26, D95) on the current
backend. The technology stage (§6.1) is **not** moved in front of it: changing what the v2.5
sessions build, mid-plan, would cause more confusion than it saves.

- The owner accepts that the parts of v2.5 written on today's backend (access model, notifications,
  deleted items, accounts) are **written again in v3**, on the new structure, "so that it is
  consistent and built right".
- What carries from v2.5 into v3 as it is: the design system, the page designs and patterns, the
  decisions D80–D95 as behaviour, the tests as a description of that behaviour, and the data
  (through the migration, §5).
- v2.5 is therefore the **behavioural reference** for v3: a v3 phase rebuilds a v2.5 behaviour on
  the new structure, it does not redesign it.

---

## 9. Final details (round 7)

Everything that was still a proposal or not yet asked, closed in one round so that only the client
questions (§7.1, [V3_CLIENT_QUESTIONS.md](V3_CLIENT_QUESTIONS.md)) and the technology stage (§6.1)
remain. **Status: every row is [AGREED 2026-11-16]** (owner, round 7); M1 was settled the next day (see its row).

### 9.1 Migration from v2.5 — details

| # | Item | Rule |
|---|---|---|
| M1 | Administrators | Today's Syria administrators become **office administrators of Syria**. Until the client names a Global Administrator, **Syria's current administrator also holds the Global Administrator role**, so nothing they can do today is lost and the shared things (catalogues, roles, offices) have a manager from day one. When the client names their person, that person gets **their own account** with the global role, and the global role is removed from Syria's administrator. **No account or password is ever passed from one person to another**, so the history always shows who did what. **[AGREED 2026-11-17]** (the owner first chose to hold the global role himself, then returned to this). |
| M2 | Assignments | Organisation-scope assignments of v2.5 become **office-scope (Syria)**; project-scope assignments stay as they are. Nobody gains or loses access through the migration. |
| M3 | History | The v2.5 activity log is carried over as it is. Field-level history **starts on the migration day**; nothing is reconstructed. Each step that is approved at the migration becomes **Revision 1**, with its original approval date and people. |
| M4 | Carried as they are | Archived projects, deleted items with their remaining days, notifications with their read state, project files, status histories. |
| M5 | Library | v2.5 library documents become **office documents of Syria**; the global administrator then moves to the global layer the ones that are AKF-wide guidance (a move, not a copy). Links to places are kept. |
| M6 | Catalogues | The seeded lookups become catalogue **version 1**; every existing project is pinned to it. |
| M7 | Locations | The free text is kept. No map point is guessed; people add points afterwards. |
| M8 | Accounts | Passwords keep working after the migration. When organisation sign-in opens (stage v3.1), a staff account is linked to the organisation account **by email** at first sign-in; accounts of outside people stay local. |
| M9 | v2.5 after the cut-over | Read only for **3 months** (final length with the client), then a final backup is handed to the client's IT and the old server is retired. |
| M10 | Method | Scripted and repeatable; at least two rehearsals on copies of the real data; a report that compares counts before and after for every kind of record; a full backup first; if the checks fail on the day, v2.5 simply stays in use (nothing is switched until the checks pass). |

### 9.2 Activities — remaining rules

| # | Rule |
|---|---|
| A1 | **One level only:** an activity cannot hold activities. |
| A2 | An activity **does not move** to another project, and a project does not become an activity (or the reverse). A wrongly placed one is deleted and created again; an administrator "move" is added only if asked. |
| A3 | The project's completion % counts **only the project's own tools**. The overview shows the activities' progress next to it ("Activities: 3 of 5 completed"), never mixed into it. |
| A4 | A project can be archived while some activities are unfinished; the confirmation says how many. |
| A5 | A person assigned only to an activity sees the parent project's **name and code only**, not its tools, people, documents or other activities. |
| A6 | Activities appear in the Home queues, search, notifications, monitoring gaps and Reports exactly as projects do. |

### 9.3 Catalogues, tools and workflow definitions

| # | Rule |
|---|---|
| K1 | A unit stays on the catalogue version it started with. Moving to a newer version is an explicit action by someone who can edit, and only for a step that is **not approved**; an approved revision keeps its version for good. |
| K2 | Only the **global administrator** changes workflow definitions and which tools a unit kind has. Every change is a new version and an audit entry. |
| K3 | **Adding** a tool to a unit kind also reaches existing units (it appears as "Not started"). **Removing** a tool, reordering or changing gates applies to **new units only**; existing units keep their definition and their data. |

### 9.4 People, roles and offices

| # | Rule |
|---|---|
| P1 | Starting roles: the six of v2.5 plus **Global Administrator** and **Office Administrator**. |
| P2 | New permissions: create activity, view history, view reports, manage catalogues, manage offices, manage workflow definitions, invite outside people, manage the global library, manage the office library. |
| P3 | An office is **never deleted**: it is closed (read only) and stays readable for people with organisation scope. |
| P4 | Only a global administrator changes a person's home office. Their assignments in the old office stay until someone removes them; the confirmation lists them. |
| P5 | A person who leaves is deactivated: sign-in ends, assignments end, and their name stays in the history. Accounts are never deleted. |
| P6 | An outside account with an expiry date is deactivated on that date; the office administrators are notified 7 days before and can extend it. |
| P7 | The activity log: an office administrator reads their own office's entries, a global administrator all of them. |
| P8 | Teams/groups are not built until asked (an assignment is always person + role + scope). |

### 9.5 Time and periods

| # | Rule |
|---|---|
| T1 | Times are stored once (UTC) and shown in the reader's own time zone; each office has a time zone used in its exports. |
| T2 | Yearly reports follow the **calendar year** in every office, unless the client says an office reports differently (C13). |

### 9.6 Decided by Claude (design, delegated by the owner)

- The library always shows its two layers as two labelled groups (§2.5b).
- The header's context slot shows the office name; exports carry the office's name; the sign-in
  brand panel is AKF-wide on a central installation and follows the office on a one-office server.
- An activity opens with the same spine one level down (back to the project), as designed in D84.
- Reports is an item of the main menu; the map is a view switch on the Projects list, not a
  separate page.
- The office switcher lists only the offices the person can enter, with the home office first.

### 9.7 Out of scope for v3 unless the client asks

No redesign of the interface; no programme records; no grouping by sector; no visual workflow
designer; no cross-country comparison dashboards; no teams/groups; no automatic translation of
typed content; no time-based reminders; no office-defined roles; no projects shared by two offices.
The structure allows each of them later.

### 9.8 Phase order

The 15 phases of §8 and the three stages of §8.1 are the working order; only the order of v3.0 and
v3.1 waits for the client (C11).

---

## Session log

- 2026-11-16 — draft created from V3_VISION and D80–D95; first questions asked (activities,
  deployment shape).
- 2026-11-16 — round 1 agreed: activities add to the project's tools, optional, display-only
  roll-up, full unit with its own code/team/documents, activity as a scope level; deployment = one
  product in two shapes (central, stand-alone).
- 2026-11-16 — round 2 agreed: tools are pluggable through a tool registry and per-unit-kind
  workflow definitions (owner's requirement); activities added at any time, archive/delete with the
  project, own workbook; one new level (country office), tree as data; one global managed catalogue
  with versions; global and office administrators, one global role list; new accounts start with no
  access.
- 2026-11-16 — round 3 agreed: home office plus assignments in other offices, head office sees all
  offices in the same lists; one approval path, multi-level approval supported but off; numbered
  revisions and field-level history; export/import of one office. **Technology deferred by the
  owner** to a dedicated architecture stage (§6.1), with the list of client facts to collect first
  (§7.1).
- 2026-11-16 — round 4 agreed: GHG and Environmental Data per office with a computed organisation
  total; library in two organised layers (global, office); one office per project, codes with the
  office code and old codes as aliases; catalogues per language, typed content never translated,
  exports ask for the language. **Owner's correction: the global platform is online; v3 is not
  designed around an offline server.** Location re-opened for that reason.
- 2026-11-16 — round 5 agreed: v3 is online first, stand-alone possible without the online
  features; locations are map points (several per unit, area from the map, map view of projects);
  staff sign in with the organisation account, outside people by email invitation with an optional
  expiry; email notifications and password reset by email; Syria is the first office, one cut-over,
  v2.5 read only afterwards. Phase outline rewritten (15 phases).
- 2026-11-16 — round 6 agreed: delivery in three stages with the order
  to confirm with the client (C11); a Reports page with fixed tables, built to grow; permission
  "create activity"; an activity's risk rating comes only from its own tools; activity kinds
  supported but off (C12).
- 2026-11-16 — work order agreed: v2.5 is built as planned on the current backend; the technology
  stage stays after the domain structure and the client facts; rewriting the v2.5 backend parts in
  v3 is accepted (§8.2).
- 2026-11-16 — round 7 asked: every remaining proposal and small rule gathered in §9 (migration
  details, activity rules, catalogues and definitions, people and offices, time, out of scope);
  the client question sheet written ([V3_CLIENT_QUESTIONS.md](V3_CLIENT_QUESTIONS.md), C1–C14).
- 2026-11-16 — round 7 agreed: all of §9 (migration details M2–M10, activity rules, catalogues and
  definitions, people and offices, time, out of scope, phase order) except M1 (administrators at
  the migration), explained again to the owner.
- 2026-11-16 — M1 settled by the owner: Syria's administrators become office administrators only;
  the first Global Administrator is the owner, handed over when the client names theirs.
- 2026-11-17 — M1 final: Syria's current administrator holds both roles (office and global) until
  the client names a Global Administrator, who then gets their own account; no account or password
  is passed between people. Replaces the entry above. The draft is closed: only the client
  questions (C1–C14) and the technology stage remain.
- 2026-11-17 — technology stage run in the same session (owner: "propose the best as enterprise
  level, we adjust from the client's answers"): system overview and ADR-001 to ADR-022 in
  [v3-architecture/](v3-architecture/README.md), all as proposals; four client questions added
  (C15–C18); the model item of §2.6 (person + identities) is ADR-008. Skills used:
  architecture, system-design, testing-strategy.
- 2026-11-17 — owner's review of the technology stage: "choose the best for this kind of
  system, not the nearest to today's code or to a familiar language". Re-examined on merit:
  the server recommendation changed to C# on .NET (ADR-003, ADR-004); React kept after weighing
  Angular and Blazor (ADR-005); a new repository agreed (v3 starts after v2.5 is finished); the
  second sign-in step narrowed to local administrators on an internet-facing server (ADR-008);
  ADR-023 added for countries with their own server (hub and spokes) with client question C19.
