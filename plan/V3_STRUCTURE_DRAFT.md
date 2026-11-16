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
| G1 | **Global use:** AKF offices in other countries use ESMS, entering from AKF's global platform. | [PROPOSAL] (client hint 2026-11-10, V3_VISION) |
| G2 | **Activities inside a project:** an activity is a mini-project that goes through the tools on its own. | [PROPOSAL] (owner 2026-11-10, V3_VISION) |
| G3 | **Structural rebuild to enterprise level:** identity and sessions, full history, configurable reference data, data integrity, observability. | [PROPOSAL] (owner 2026-11-04) |
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

**[PROPOSAL]** The thing that goes through Tools 1–5 becomes its own entity, the **workflow unit**
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
4. **An activity is a full unit of its own:** its own code (shape `ESMS-024-A03`: the project code
   plus an activity number, given by the server, Latin, D93), dates, location, documents and
   team.
5. **Access:** a person with access to a project sees all its activities; a person can also be
   assigned to **one activity only** (activity is a scope level, §3).

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
- Every catalogue text is stored per language (`{ en, ar, fr, … }`), with English as the fallback —
  this is the "content translation" left open by D81.
- **[PROPOSAL]** Moving a running unit to a newer catalogue version is an explicit action by someone
  who can edit it, never automatic.

### 2.5 Places

**[PROPOSAL]** A project/activity location = free text **plus** optional coordinates picked on a map
(owner's idea, 2026-11-10). No fixed lists of governorates. **[OPEN]** map tiles on an offline server.

### 2.6 People and identity

**[PROPOSAL]** A user = a person record + one or more *identities* (local password; organisation
account through single sign-on). Home office on the person. **[AGREED 2026-11-16]** An account created on first sign-in from the global platform starts
with **no access**; the administrators of its office are notified ("New person needs access") and
assign a role (same pattern as "New project needs a team", D82/D90).

---

## 3. Access model changes

**[PROPOSAL]**

- Scope levels grow from `organisation → project` to
  `organisation → office → project → activity` (the tree of §2.1). An assignment on a node covers
  everything under it. **[AGREED 2026-11-16]** for the activity level: project access covers every
  activity of the project, and a person can be assigned to a single activity. A person assigned
  only to an activity sees the parent project's name and code (to know where they are) but not the
  project's own tools or its other activities (**[PROPOSAL]** for this last sentence).
- **[AGREED 2026-11-16]** "Administrator" splits by scope: a **global administrator** (offices,
  roles, catalogues, workflow definitions) and an **office administrator** (users and access inside
  their own office only; never sees or changes another office's people). On a stand-alone server
  the same person can hold both.
- **[AGREED 2026-11-16]** Roles stay admin-managed bundles (D82) in **one global list**, so a role
  means the same in every country. Office-defined roles only if the client asks.
- A restricted person never sees names or counts outside their scopes (D82 rule, applied to offices
  too).
- Head-office (cross-country) views are allowed by the structure and built only when asked.
- Teams/groups: only if asked.

---

## 4. Workflow changes

**[PROPOSAL]** (all depend on the answers to §2.3)

- The five steps and their rules stay as in v2.5 for every workflow unit.
- The workflow definition (per unit kind: which registered tools apply, their order, kind and
  gates — §2.2a) moves from code constants to a **versioned workflow definition** read by
  `computeWorkflow`, so a different path (per unit kind, later per office) is data. **[AGREED
  2026-11-16]** for "which tools a unit has is configuration". Not a visual workflow designer.
- Real **revisions** of approved steps (v2.5 has "reopen with a reason", D88): each approval freezes a
  numbered revision that can be read later and exported.
- **Field-level history** for every write (extends the D65 audit entries).

---

## 5. Data migration from v2.5

**[PROPOSAL]**

- One office is created ("AKF Syria"); every project is attached to it; every user's home office is
  Syria.
- Every project gets one workflow unit; tool data is re-pointed from `project_id` to `unit_id`.
- Organisation-scope assignments become **office-scope (Syria)** assignments, except administrators
  chosen as global administrators (**[OPEN]** who).
- The seeded lookups become catalogue **version 1**; every existing unit is pinned to it.
- The audit log, files, notifications and deleted items are carried over as they are.
- The migration is a scripted, repeatable, tested step with a dry run and a backup first; never by
  hand.

---

## 6. Architecture

**[PROPOSAL]** — to be discussed after the domain questions.

- **Deployment shape [AGREED 2026-11-16]:** **one product, two shapes.** The same build runs
  (a) **central** — one installation holding many offices — or (b) **stand-alone** — one
  installation holding a single office, offline, as Syria runs today. The choice per country is a
  deployment setting, not a fork of the code, so the structure does not wait for the client's
  hosting decision. Consequences:
  - the office level always exists in the data (a stand-alone server simply has one office);
  - every identifier that may one day meet another installation's data is globally unique (UUIDs,
    and project codes that carry an office prefix when more than one office exists — **[PROPOSAL]**);
  - sign-in works both with an organisation account (central) and with local accounts (stand-alone);
  - nothing at runtime needs the internet (D37) in either shape;
  - **[OPEN]** moving an office's data from a stand-alone server into the central one (an
    export/import of one office) — wanted or not.
- **Database:** review MongoDB against a relational database (PostgreSQL) for a domain that is
  relational by nature (tree of scopes, assignments, revisions, field history).
- **Backend:** a modular monolith (modules: identity, access, org, workflow, tools, files, catalogue,
  audit, notifications) with typed boundaries; TypeScript on both sides.
- **Identity:** OpenID Connect sign-in with the organisation account + local accounts for offline
  servers; server-side sessions with revocation ("sign out of all devices").
- **Offline server:** must keep working with no internet (D37) in every shape.
- **Observability:** structured logs, error tracking, health and metrics.

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
| Q11 | Moving one office's data from a stand-alone server into the central one. | owner / client | — |

---

## 8. Proposed phase outline

**[PROPOSAL]** — rough order, refined at the end of the session.

1. v3 review and decisions (this draft → D-numbers).
2. Platform base: database choice, module layout, migrations tooling, TypeScript.
3. Organisation tree and scopes; access model on the tree; migration of v2.5 assignments.
4. Workflow unit and tool registry: tools become registered modules pointing to units; versioned
   workflow definitions; data migration.
5. Activities (model, workflow, pages on the existing patterns, exports).
6. Managed catalogues with versions and translations.
7. Identity: OIDC sign-in, server sessions, entry from the global platform.
8. History: field-level log, revisions.
9. Places on a map.
10. Deployment shapes, observability, release.

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
