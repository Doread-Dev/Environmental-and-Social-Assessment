# ADR-002: Database — PostgreSQL

**Status:** Proposed — **to confirm with the client's answer (C3)**
**Date:** 2026-11-17
**Deciders:** the owner; the client's IT (which databases they run and support)
**Draft:** §6.1, §2.1, §2.4, §4 · **Related:** ADR-009, ADR-010, ADR-011, ADR-014, ADR-021

**In plain words:** v3 leaves MongoDB for a relational (SQL) database, and the recommended one is
PostgreSQL. If the client's IT only supports Microsoft SQL Server, the same design moves to it; the
ADR lists exactly what would change.

## Context

- The v3 domain is relational by nature: a tree of scopes, assignments of people to nodes, units
  with ordered steps, revisions, catalogues with versions that units are pinned to, a history that
  must be complete, and reports across all of it.
- Today MongoDB holds it. Integrity (one screening per project, rows belong to their project,
  delete cascades) lives in application code; transactions need a replica set; reports would be
  aggregation pipelines written by hand.
- The owner believes the client's systems are SQL-based. Which product and which hosting are not
  known (C3, C4).
- The database must run both as a managed cloud service and on one offline machine, with no
  licence fee per installation.

## Decision

**PostgreSQL** (the current major release at phase 3), used fully rather than as a lowest common
denominator, with a short, named list of PostgreSQL-specific features so the cost of a change is
always known:

| Feature used | For | Equivalent if the client requires SQL Server |
|---|---|---|
| Transactions, foreign keys, unique and check constraints | Integrity everywhere | Same |
| Row-level security | Second layer of office isolation (ADR-009) | Security policies (row-level security exists) |
| `jsonb` | Revision snapshots, workflow definitions, history values | `json` type / `nvarchar(max)` with JSON functions |
| Triggers | History capture (ADR-011) | Triggers |
| Declarative partitioning | History by month | Partitioned tables |
| `FOR UPDATE SKIP LOCKED` | Job queue and outbox in the database (ADR-014) | `READPAST` hints, or a queue service |
| PostGIS | Map points, areas (ADR-021) | `geography` type |
| Trigram and full-text search | Project and people search | Full-text search |
| Native UUID v7 | Identifiers (ADR-010) | UUID made in the application |

Portable by choice where it costs nothing: the scope tree uses a closure table (not `ltree`), and
the query layer (ADR-004) has a SQL Server dialect.

## Options considered

| | A. Stay on MongoDB | **B. PostgreSQL** | C. Microsoft SQL Server | D. MySQL / MariaDB |
|---|---|---|---|---|
| Fit to the domain (tree, assignments, revisions, reports) | Weak: integrity in application code | Strong | Strong | Medium |
| Integrity enforced by the database | Little | Full | Full | Full (weaker checks historically) |
| Second layer of data isolation (row-level security) | No | Yes | Yes | No |
| Stand-alone shape (free, any OS, offline) | Yes | Yes | Size-capped free edition, or a paid licence per server | Yes |
| Managed service on every major cloud | Vendor's own service | Yes, everywhere | Yes (best on Azure) | Yes |
| Geography, JSON, queue-in-database | Partial | All built in or one extension | All, different syntax | Partial |
| Reporting and BI tools read it directly | Through connectors | Yes | Yes (native for Microsoft BI) | Yes |
| Closeness to the client's IT | Unlikely | Likely acceptable | Best if they are a Microsoft shop | Unknown |
| Licence cost | None | None | Per core, per installation | None |
| Migration effort from v2.5 | None | Full (ADR-020) | Full | Full |

**A** keeps the weakness the vision notes named ("relational by nature"), and every new v3 concept
(assignments on a tree, pinned catalogue versions, revisions, history) adds more integrity rules
to hand-written code.

**C** is a sound engine and the natural choice in a Microsoft-only organisation. Its cost is the
licence on every stand-alone installation, and a tighter coupling to one vendor's hosting.

**D** has no advantage over B here and lacks row-level security.

## Trade-off analysis

B against C is the only close call, and it turns on a fact we do not have: what the client's IT
runs. Technically both carry the design. PostgreSQL wins on three points that are ours to judge:
no licence in the stand-alone shape, the same engine on every cloud and on a laptop, and the
richest feature set for exactly what v3 needs (row security, JSON, geography, queue) in one
product. SQL Server wins on one point that is the client's to judge: if their database
administrators, backups, monitoring and BI are all built around it, that operational fit can
outweigh the rest.

So the recommendation is PostgreSQL, with the switch kept cheap on purpose: SQL written through a
query layer that speaks both, a closure table instead of a PostgreSQL-only tree type, and the table
above as the complete list of what would be rewritten.

## What would change this decision

- The client's IT supports SQL Server only and will operate the database themselves → option C; the
  table above becomes the work list; ADR-014 moves the queue to a queue service.
- The client mandates a database-as-a-service with no extensions → check PostGIS availability
  first (it is offered by the major managed PostgreSQL services).

## Consequences

- Easier: every v3 rule about structure becomes a constraint the database enforces; reports and BI
  read plain SQL views; one transaction covers data, history and events without a replica set.
- Harder: a full data migration from v2.5 (ADR-020); schema changes are explicit migrations (a
  cost, and the point); the deploy scripts and backup tooling of v2 are replaced (ADR-016).
- To revisit: after the client's answer to C3; nothing is built before it.

## Action items

1. [ ] Owner: bring the answer to C3 (which databases IT runs and supports).
2. [ ] Phase 3: confirm on the walking skeleton — row-level security with the connection pool,
   history triggers, the queue — before modules are built on them.
3. [ ] Phase 3: the migration runner and the rule "forward-only, reviewed, run by `migrate`".
