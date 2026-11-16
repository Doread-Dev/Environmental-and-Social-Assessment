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

**[PROPOSAL]** One tree of *organisation units*, each node a possible scope for assignments:

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
- **[OPEN]** Which levels really exist at the client: regions? field offices inside a country?
  other AKDN agencies beside AKF?

### 2.2 The workflow unit

**[PROPOSAL]** The thing that goes through Tools 1–5 becomes its own entity, the **workflow unit**
(already one pattern in the v2.5 design, concept §"Design for variation"):

- A project owns one workflow unit; each activity owns one workflow unit.
- Screening, assessment, Tool 3/4/5 rows, status history, files and the step states point to a
  `unit_id`, never straight to a project. One implementation of the tools serves projects and
  activities.
- `computeWorkflow(unit)` stays the single source of workflow state.
- **[OPEN]** How a project's own tools relate to its activities' tools (roll-up, gates, category) —
  see §4.

### 2.3 Activities

**[OPEN]** — the first topic of the session. Questions asked to the owner:

1. Does the project still fill its own Tools 1–5 when it has activities, or do the activities
   replace them?
2. Are activities optional (a small project with none) or required?
3. Does anything roll up from activities to the project (category, risk, completion %, monitoring)?
4. Does an activity have its own team/access, code, dates, location, documents?

### 2.4 Reference data (lookups) and content translation

**[PROPOSAL]**

- Impact questions, indicators, categories and job titles become **managed catalogues**: versioned
  sets edited by an administrator in the app, not seed files.
- A unit is **pinned to the catalogue version it started with**, so editing a question never changes
  an approved screening.
- Every catalogue text is stored per language (`{ en, ar, fr, … }`), with English as the fallback —
  this is the "content translation" left open by D81.
- **[OPEN]** Is there one global catalogue for every country, or may an office add/override items?

### 2.5 Places

**[PROPOSAL]** A project/activity location = free text **plus** optional coordinates picked on a map
(owner's idea, 2026-11-10). No fixed lists of governorates. **[OPEN]** map tiles on an offline server.

### 2.6 People and identity

**[PROPOSAL]** A user = a person record + one or more *identities* (local password; organisation
account through single sign-on). Home office on the person. Accounts created on first sign-in from
the global platform get a default "no access" state until someone with "manage access" assigns them
— or a default role per office (**[OPEN]**).

---

## 3. Access model changes

**[PROPOSAL]**

- Scope levels grow from `organisation → project` to
  `organisation → office → project → activity` (the tree of §2.1). An assignment on a node covers
  everything under it.
- "Administrator" splits by scope: a **global administrator** (roles, catalogues, offices) and an
  **office administrator** (users and access inside their office).
- Roles stay admin-managed bundles (D82). **[OPEN]** Are roles global (one list for all offices) or
  may an office define its own?
- A restricted person never sees names or counts outside their scopes (D82 rule, applied to offices
  too).
- Head-office (cross-country) views are allowed by the structure and built only when asked.
- Teams/groups: only if asked.

---

## 4. Workflow changes

**[PROPOSAL]** (all depend on the answers to §2.3)

- The five steps and their rules stay as in v2.5 for every workflow unit.
- The workflow definition (list of steps, kind, gates) moves from code constants to a **versioned
  workflow definition** read by `computeWorkflow`, so a different path (per office, per unit kind) is
  data. Not a visual workflow designer.
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

- **Deployment shape [OPEN]:** one central server for all countries, or one server per country
  (data-residency rules), or central + the Syrian offline server. This decides the most.
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
| Q1 | Activities: do they replace or add to the project's own tools? | owner | asked |
| Q2 | Activities: optional or required; what rolls up to the project? | owner | asked |
| Q3 | Activities: own team, code, dates, location, documents? | owner | asked |
| Q4 | Deployment: central, per country, or both? Does the Syria server stay? | owner / client | asked |
| Q5 | Organisation levels that really exist (regions, field offices, other agencies). | owner / client | — |
| Q6 | Catalogues: one global set or per-office additions? | owner / client | — |
| Q7 | Roles: global or per office? | owner | — |
| Q8 | How do staff sign in to the global platform (identity provider)? | client IT | — |
| Q9 | The client features not disclosed yet. | owner / client | — |

---

## 8. Proposed phase outline

**[PROPOSAL]** — rough order, refined at the end of the session.

1. v3 review and decisions (this draft → D-numbers).
2. Platform base: database choice, module layout, migrations tooling, TypeScript.
3. Organisation tree and scopes; access model on the tree; migration of v2.5 assignments.
4. Workflow unit: tools re-pointed to units; data migration.
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
