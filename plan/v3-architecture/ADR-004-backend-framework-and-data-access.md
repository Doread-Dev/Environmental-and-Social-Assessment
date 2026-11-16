# ADR-004: Server framework and data access — ASP.NET Core, one assembly per module, EF Core over a database that stays in charge

**Status:** Proposed (revised 2026-11-17 with ADR-003; exact versions are pinned on the walking
skeleton, phase 3)
**Date:** 2026-11-17
**Deciders:** the owner
**Related:** ADR-001, ADR-002, ADR-003, ADR-007, ADR-009, ADR-011

**In plain words:** inside the server we use the standard Microsoft web framework and its standard
way of talking to the database, instead of assembling our own from many small parts. The database
keeps its own guards (constraints, history, office isolation) written in SQL, so those guards hold
even if a programmer makes a mistake.

## Context

- ADR-001 asks for modules with hard walls, a registry that discovers tools, one permission check
  on every route with a test that proves none is missed (today's D66 route-table tests), and three
  process roles sharing the same code.
- ADR-002 uses database features on purpose (row security, triggers, partitions, JSON, geography).
  The data layer must not fight them, and must be able to move to SQL Server if C3 requires.
- The codebase may one day be read by people who did not write it. A recognisable structure is
  worth more than a clever one.

## Decision

### Framework and structure

- **ASP.NET Core** for HTTP, sign-in, authorization, configuration, health checks, background
  services and telemetry — the platform's own pieces wherever one exists.
- **One assembly (project) per module** of ADR-001, plus a small *contracts* project per module
  holding only what other modules may see (interfaces, events, data shapes). Everything else is
  `internal`, so reaching around a module is a **compile error**. An architecture test adds the
  rules the compiler cannot express (a tool never references another tool; the kernel never
  references a tool; no module queries another module's schema).
- **Rules are plain C#** with no reference to web or database libraries; endpoints and data
  access sit at the module's edge. Rules are tested without a server.
- **One authorization pipeline:** every endpoint declares a named permission and how its scope is
  found; a single policy handler calls the access module (ADR-009). The framework's endpoint list
  feeds the test "no endpoint without a permission and a scope" (D66, kept).
- **The tool registry** is filled at start-up by each tool module registering its manifest
  (ADR-012); a tool that is not registered does not exist for the rest of the system.
- **One typed contract:** request and response types in C# are the single source for validation
  and for the OpenAPI document, from which the interface's TypeScript client is generated
  (ADR-007). No shape is written twice by hand.

### Data access

- **EF Core with the PostgreSQL provider** for each module's own data: typed queries checked by
  the compiler, the `version` column as a built-in concurrency token (ADR-010), default filters
  for soft-deleted rows, one context per module limited to its schema.
- **The database stays the authority.** Constraints, history triggers, row-security policies,
  partitions and reporting views are written as **SQL inside the migrations**, reviewed as SQL.
  EF Core is how the application reads and writes; it is not what keeps the data right.
- **Migrations:** authored per module, turned into SQL scripts that are reviewed in the pull
  request, applied by the `migrate` role at deploy time (never at application start), forward-only.
- **One transaction per request,** opened by the platform, which also tells the database who acts
  and for which request (ADR-009, ADR-011). No module opens its own.
- **Plain SQL for reads that are naturally SQL:** reports, the access condition for lists, search.
- No lazy loading; no entity shared between modules; no generic repository hiding queries.

## Options considered

### Framework and structure

| | **A. ASP.NET Core, a project per module** | B. ASP.NET Core, one project with folders | C. A third-party application framework on top |
|---|---|---|---|
| Module walls | Compiler + architecture test | Convention + architecture test | Depends on the framework |
| Recognisable to an outside .NET developer | Yes | Yes | Only to those who know that framework |
| Dependence on anything but the platform | None | None | A second product's roadmap |
| Build complexity | More projects | Fewest | Moderate |

### Data access

| | **A. EF Core + SQL for database features** | B. Micro-mapper and hand-written SQL only | C. A document or event store on PostgreSQL |
|---|---|---|---|
| Queries checked at build time | Yes | No (strings) | Partly |
| Uses row security, triggers, partitions, geography | Yes (SQL in migrations) | Yes | Against the grain |
| Version conflicts, soft-delete filters | Built in | By hand each time | Built in, different model |
| Move to SQL Server if C3 requires | Provider change + the SQL parts of ADR-002's list | Rewrite every query | No |
| Reports and complex reads | SQL where it fits | Natural | Awkward |
| Risk | Generated queries must be watched | Much repetitive code, typos found at run time | Reshapes the whole design |

## Trade-off analysis

**Structure.** B is simpler to build but leaves the walls to convention, which ADR-001 exists to
avoid; A makes them a property of the build at the cost of more projects, which tooling handles.
C would put a second vendor's choices between us and the platform for little gain at this size.

**Data access.** In the first version of this record (TypeScript) the recommendation was SQL-first
with a thin query builder, because object-relational mappers in that ecosystem tend to hide the
database. EF Core is a different case: mature, first-party, with checked queries, concurrency
tokens and filters that this design needs anyway. The principle that mattered is kept — **the
database is in charge of integrity, history and isolation** — by writing those parts in SQL and
letting EF Core be only the access path. The known risk of any mapper, inefficient generated
queries, is handled by logging slow queries (ADR-017), by tests that count queries on the main
pages (today's request budgets, one level down), and by plain SQL for reads that want it.

## Consequences

- Easier: a new module follows a template; walls and permission coverage are proven by the build;
  the security pipeline is the platform's; a database change is a reviewed SQL script.
- Harder: more projects in the solution; discipline to keep rules free of framework types;
  migrations that mix generated and hand-written SQL need a clear convention.
- To revisit: nothing foreseen; a platform upgrade every two years.

## Action items

1. [ ] Phase 3: walking skeleton — solution layout, one module with its contracts project, the
   authorization pipeline, a migration with a trigger and a policy, the transaction-and-actor
   wrapper; pin versions from the current documentation.
2. [ ] Phase 3: CI jobs — architecture test, start of each process role, migrations on an empty
   database and on the previous release's schema, generated OpenAPI is up to date.
