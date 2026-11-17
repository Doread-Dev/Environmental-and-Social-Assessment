# v3 — System overview (baseline for the architecture decisions)

**What this is:** the requirements, limits and overall shape that every architecture decision
record (ADR) in this folder is measured against. It adds no domain decision: the domain comes from
[V3_STRUCTURE_DRAFT.md](../V3_STRUCTURE_DRAFT.md) (called "the draft" below). Index of the ADRs:
[README.md](README.md).

**Status:** proposal of the technology stage (2026-11-17). Numbers marked *assumption* are planning
values until the client answers ([V3_CLIENT_QUESTIONS.md](../V3_CLIENT_QUESTIONS.md)).

---

## 1. What the system must do (from the draft)

| Area | Requirement | Draft |
|---|---|---|
| Organisation | A tree of organisation units stored as data: Organisation → Office → Project → Activity; new levels without a rebuild. | §2.1 |
| Workflow | A *workflow unit* per project and per activity goes through the tools; one implementation serves both. | §2.2 |
| Tools | Tools are modules in one registry; which tools a unit kind has is configuration. | §2.2a |
| Workflow definitions | Versioned definitions per unit kind: tools, order, gates, approval levels. | §4 |
| Catalogues | Managed, versioned lists with draft/publish, translations, units pinned to a version. | §2.4 |
| Access | Permission → role → assignment on any node of the tree; global and office administrators. | §3 |
| Records | Numbered revisions of reviewed steps; field-level history of every write; append-only. | §4 |
| People | Staff sign in with the organisation account; outside people by invitation, local account. | §2.6 |
| Notifications | In-app and by email on the same events. | §2.6 |
| Places | Map points per unit; country and area filled from the map. | §2.5 |
| Files | Project and activity documents, library in two layers (global, office). | §2.5b |
| Reports | A Reports page with fixed tables and Excel export on one reporting layer. | §2.5d |
| Exports | Workbooks per unit, in a chosen language; old revisions exportable. | §2.3, §2.4 |
| Shapes | One product, two deployment shapes: central online (the design target), stand-alone possible. | §6 |
| Office move | Export/import of one office between installations. | §6 |
| Migration | Syria moves from v2.5 in one scripted, rehearsed cut-over. | §5, §9.1 |

What the current system gives us to build on: the rules of the five tools as tested behaviour
(about 9,500 lines of backend tests, twelve end-to-end flows), the v2.5 design system and page
designs (D80–D95), and three seams that already point at v3: one audit writer (D65), one
project-access check with named permissions (D66), places by stable key (D64).

What it cannot give: integrity across the scope tree, assignments, revisions and history (today
enforced in application code over MongoDB, transactions only on a replica set); sessions that can
be revoked (a token in the browser's storage); any sign-in but local passwords; a reporting layer.

---

## 2. Quality attributes and targets

Targets are **proposals**; the ones the client must confirm are marked with their question.

| Attribute | Target | Why |
|---|---|---|
| Integrity | Every write that touches several records is one transaction; the database refuses orphaned or duplicate records by itself. | Scope tree, assignments, revisions and history must never disagree. |
| Auditability | Every change of domain data leaves a history row that the application cannot skip, edit or delete. | Draft §4: "history is append-only". |
| Confidentiality | A person never receives a name or a count outside their scopes; the check is enforced in two layers. | Draft §3, D82. |
| Availability (central) | 99.5 % in the offices' working hours; planned maintenance outside them. *(C17)* | A work tool, not a 24/7 service. |
| Recovery (central) | Lose at most 15 minutes of data (RPO); back in service within 4 hours (RTO). *(C17)* | Managed database with point-in-time restore. |
| Performance | A page of work data answers in under 500 ms at the 95th percentile; a save in under 1 s. | Today's request budgets (two requests per page) stay. |
| Extensibility | A new tool is one module plus its registration; no change in the workflow, shell, permissions, exports or delete code. | Draft §2.2a (owner's requirement). |
| Operability | One artefact for both shapes; health, logs, metrics and traces in standard formats the client's IT already collects. | Draft §6.1 constraints. |
| Portability | No hard dependency on one cloud: every outside service sits behind an interface with at least two drivers. | Hosting is not known yet (C3, C4). |
| Accessibility, languages | WCAG 2.1 AA; English and Arabic with RTL; more languages as data. | D81, D94 (carried from v2.5). |

---

## 3. Planning assumptions (sizing)

Not known yet (C6). The design is sized for the values below with **ten times headroom on one
database server**, so the real numbers change settings, not the structure.

| Quantity | Assumption |
|---|---|
| Offices | up to 30 |
| Named users | up to 3,000; at most 300 working at the same moment |
| Workflow units (projects + activities) | up to 10,000 live, 50,000 over ten years |
| Rows of tool data | a few million (small text rows) |
| History rows | about 15 million a year (300 people × ~200 field changes a working day) |
| Files | up to 500 GB (documents and photos, at most tens of MB each) |
| Requests | under 50 a second at peak |

This is a small system by load and a demanding one by rules. That shapes the main choice: **the
difficulty is correctness and change, not scale**, so the architecture optimises for integrity,
clear module boundaries and operability, and deliberately avoids distributed machinery
(microservices, message brokers, caches, search clusters) that this load does not need.

---

## 4. Limits that hold whatever is chosen

From the draft §6.1 and the project rules:

1. One build, two deployment shapes; online services (map, email, organisation sign-in) behind
   interfaces so the core work never fails because one of them is down.
2. Transactions and referential integrity; globally unique identifiers; export/import of one office.
3. A scripted, tested migration from v2.5; v2.5 is the behavioural reference (draft §8.2).
4. The v2.5 design system and page designs are reused as they are.
5. The backend owns every business rule; the interface shows state and never decides (D30).
6. Client documents (the AKF workbook, Annex 1) never enter a repository.
7. Cost is not a constraint; closeness to how the client's IT works is a goal (owner).

---

## 5. Context

```
                         ┌──────────────────────────────┐
   AKF staff ───────────▶│  Organisation sign-in (IdP)  │  OpenID Connect      (ADR-008, C1)
                         └──────────────┬───────────────┘
   Global AKF platform ──link / SSO─────┤                                      (ADR-015, C2)
                                        ▼
   Staff, outside readers ──HTTPS──▶ ┌───────────────────────────────────────┐
                                     │                 ESMS v3               │
   Other systems ──integration API──▶│  web app · API · worker · database    │
   (project lists, BI, documents)    └───┬─────────┬──────────┬──────────┬───┘
                                         │         │          │          │
                                    email service  map tiles  object     monitoring
                                    (ADR-014, C7)  (ADR-021)  storage    (ADR-017)
                                                              (ADR-013)
```

Everything on the right and bottom is an **outside service behind an interface**: the stand-alone
shape swaps each for a local driver or runs without it.

---

## 6. Shape of the system (ADR-001)

One codebase, one container image, three process roles, one PostgreSQL database. The server is
C# on .NET (ADR-003); the interface is React in TypeScript (ADR-005).

```
 Browser (React SPA, TypeScript) ── same origin ──▶  api  (HTTP: /api/v1, the SPA files, /health)
                                                      │
                                    ┌─────────────────┼──────────────────┐
                                    │   modules (in one process)         │
                                    │                                    │
   kernel:   identity · access · org · workflow · catalogues · files · history ·
             notifications · places · reports · exports · integration · platform
   tools:    screening · assessment · management · mitigation · monitoring ·
             semp-plan · stakeholder-awareness · ghg-emissions · environmental-data
                                    │                                    │
                                    └─────────────────┬──────────────────┘
                                                      ▼
                                              PostgreSQL (one database,
                                              one schema per module,
                                              history, outbox, job queue)
                                                      ▲
  worker (same image): email, exports, file scans, ───┘
          scheduled clean-ups, integration deliveries
  migrate (same image, one run per release): schema migrations
```

Module rules (enforced by tests, ADR-001):

- A **tool** module depends on kernel interfaces only, never on another tool. The kernel never
  depends on a tool; it reads the tool registry.
- A module is reached only through its public interface or through an event; nobody reads another
  module's tables. The one exception is the **reporting layer**, a set of read-only database views
  owned by the `reports` module.
- Every module owns its tables in its own database schema, its permissions, its lifecycle hooks
  and its tests.

### How one save travels

1. The browser sends `PUT /api/v1/units/{id}/tools/screening` with the `version` it loaded.
2. The session cookie is resolved to a person (`identity`); the route's named permission is checked
   on the unit's place in the tree (`access`); the body is validated against the tool's schema.
3. One database transaction opens and is told who acts and for which request.
4. `workflow` checks the gates from the unit's pinned workflow definition; the tool module writes
   its rows with a version check (stale → `409 STALE_VERSION`, as today).
5. The database writes the field-level history rows by itself (ADR-011); the module adds outbox
   events (for example "submitted for review").
6. Commit. The answer carries the new state from `computeWorkflow(unit)`.
7. The worker picks the outbox events up: in-app notification rows, email, integration deliveries.

Nothing in steps 3–6 leaves the database, so a save either fully happens or does not.

---

## 7. Deployment views (ADR-016)

**Central (design target):**

```
 Internet ─▶ WAF / load balancer (TLS) ─▶ api × 2+  ─┐
                                          worker × 1+ ┼─▶ managed PostgreSQL (HA, point-in-time restore)
                                                      ├─▶ object storage (files, backups)
                                                      └─▶ IdP · email · map tiles · monitoring
```

**Stand-alone (possible, one office, may be offline):** the same image under Docker Compose on one
Linux machine: `api`, `worker`, PostgreSQL, a reverse proxy; files on a disk through the filesystem
driver; local accounts; nightly backup to a second disk, as today.

---

**Country installation (a "spoke", ADR-023):** the same image in a country that keeps its data
inside — online in its own region or offline on its own servers. Global settings come down from
the central installation as signed packages; head-office people open the country's site with the
same organisation account; a summary without names goes up for global reports only where the
country allows it.

---

## 8. What to revisit as it grows

| Sign | Then |
|---|---|
| History table passes ~200 million rows | Move old partitions to cheaper storage; they are already monthly partitions. |
| Reports slow the working database | Point the reporting views at a read replica. |
| Search needs more than names, codes and titles | Add a search service fed from the outbox; nothing else changes. |
| One module needs its own release rhythm or scale | Lift it out behind its existing interface; the module boundaries are already drawn. |
| Many countries run their own installation and allow viewing from abroad | Add the live combined view left out of ADR-023. |
