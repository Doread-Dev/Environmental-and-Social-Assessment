# ADR-004: Backend framework and data access — NestJS at the edges, SQL-first with a typed query builder

**Status:** Proposed (the exact library versions are pinned on the walking skeleton, phase 3)
**Date:** 2026-11-17
**Deciders:** the owner
**Related:** ADR-001, ADR-002, ADR-003, ADR-007, ADR-011

**In plain words:** two choices inside the server. For the framework: a well-known, structured one
(NestJS) instead of our own conventions, so any developer recognises the layout. For talking to the
database: we write real SQL migrations and typed queries, and avoid a heavy layer that hides the
database.

## Context

- ADR-001 asks for modules with hard walls, a registry that discovers tools, one permission check
  on every route with a test that proves none is missed (today's D66 route-table tests), and three
  process roles sharing the same code.
- ADR-002 uses database features on purpose (row security, triggers, partitions, JSON, geography).
  The data layer must not fight them.
- The codebase may one day be read by people who did not write it (the client's IT, another
  supplier). A recognisable structure is worth more than a clever one.
- Today: Express 4 with hand-made conventions, Mongoose models, Joi schemas.

## Decision

### Framework

**NestJS, on its Fastify adapter**, used for what a framework is for — modules, dependency
injection, guards, request pipeline, route discovery — and **kept at the edges**: domain rules are
plain TypeScript with no framework import (ADR-001, point 3).

- A NestJS module = one module of ADR-001. What a module does not export cannot be injected
  elsewhere, which gives the wall a runtime meaning on top of the CI dependency test.
- One global guard resolves the session and checks the route's named permission; the framework's
  discovery lists every route with its metadata, so the test "no write route without a permission,
  no unit-scoped route without the scope check" is kept from v2.
- The same discovery builds the tool registry: a tool module declares itself once.

### Validation and contract

One schema per request and response, written once (a schema library with static type inference),
used for validation at the edge, for the TypeScript types on both sides and for the generated
OpenAPI document (ADR-007). No second, hand-written copy of a shape anywhere.

### Data access

**SQL-first:**

- The schema is owned by **plain SQL migrations**: forward-only, reviewed, run by the `migrate`
  role at deploy time, never at application start. Tables, constraints, triggers, policies,
  partitions and views are all written in the language the database speaks.
- Queries go through a **typed query builder (Kysely)** whose types are generated from the real
  database after each migration. A query that names a missing column fails the build.
- Each module has repository functions over its own schema; a transaction is opened once per
  request by the platform and carries who acts (ADR-011). No repository opens its own.
- No heavy object-relational mapper, no lazy loading, no schema defined twice.

## Options considered

### Framework

| | A. Express with own conventions (today) | **B. NestJS** | C. Fastify with own module conventions |
|---|---|---|---|
| Module walls | Convention only | Built in (exports) + CI test | Plugin encapsulation + CI test |
| Route discovery for the permission tests and the registry | Hand-made | Built in | Hand-made |
| Recognisable to an outside developer | Depends on our docs | Yes, widely known | Partly |
| Hidden behaviour ("magic") | None | Decorators and injection | Little |
| Coupling of rules to the framework | None | None if kept at the edges | None |

### Data access

| | A. Document mapper (today) | B. Heavy ORM (entities, unit of work) | C. Schema-first ORM with its own schema language | **D. SQL migrations + typed query builder** |
|---|---|---|---|---|
| Uses row security, triggers, partitions, geography as they are | n/a | Possible, against the grain | Partly; raw SQL for the rest | Natively |
| Schema defined in one place | Models | Entities + migrations | Schema file | Migrations (types generated) |
| Queries checked at build time | No | Partly | Yes | Yes |
| What the database runs is visible in the code | Hidden | Hidden | Mostly hidden | Visible |
| Works on SQL Server if C3 requires it | No | Yes | Yes | Yes (dialect exists) |
| Reports and complex reads | Hand-made pipelines | Awkward | Raw SQL | Natural |

## Trade-off analysis

**Framework.** B and C both satisfy ADR-001. C is leaner and has less hidden behaviour; B brings
the module system, the guards and the discovery ready-made and, above all, a structure that
thousands of developers already know. For a product that must be maintainable by people other than
its authors, the recognisable structure wins. NestJS's known cost is its reliance on decorators and
runtime injection: errors of wiring appear at start-up rather than at build time. Two things
contain it: the domain rules never import the framework (so they are untouched by it and the
choice stays reversible), and the start-up of every process role is itself a CI test.

**Data access.** A heavy ORM earns its keep when the database is treated as a dumb store. Here the
database is asked to do real work (ADR-009, ADR-011), and the history no longer needs an ORM's
change tracking because the database captures changes itself. With that gone, the remaining value
of an ORM is small and its cost (a second schema, hidden queries) is real. SQL-first keeps one
source of truth and makes the reporting layer, the migration from v2.5 and a possible move to SQL
Server straightforward.

## Consequences

- Easier: a new module follows a template; permission coverage is provable; schema changes are
  reviewed as SQL; complex reads are ordinary queries.
- Harder: more SQL is written by hand; framework upgrades are a yearly task; the "edges only" rule
  needs the CI dependency test to stay honest.
- To revisit: the framework, if its decorator model ever blocks a runtime upgrade — the rules do
  not depend on it, so the replacement would touch the edges only.

## Action items

1. [ ] Phase 3: walking skeleton with the framework, the query builder, generated types, one
   migration with a trigger and a policy; pin exact versions from the current documentation then.
2. [ ] Phase 3: CI jobs — start each process role, type generation is up to date, migrations apply
   on an empty database and on the previous release's schema.
