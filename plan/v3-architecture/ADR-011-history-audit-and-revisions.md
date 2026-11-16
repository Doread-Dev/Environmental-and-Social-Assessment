# ADR-011: History, audit and revisions — captured by the database, frozen as snapshots

**Status:** Proposed
**Date:** 2026-11-17
**Deciders:** the owner
**Draft:** §4, §9.1 M3, §9.4 P7 · **Related:** ADR-002, ADR-010, ADR-012, ADR-014

**In plain words:** the record of who changed what is written by the database itself on every
change, so no programmer and no new tool can forget it, and nobody can alter it. Each approval
also stores a sealed copy of the step exactly as approved, which can be opened and exported years
later.

## Context

- Agreed in the draft: field-level history of every write (who, when, which field, old and new
  value), append-only, read with the permission "view history"; the critical-actions log of D65
  stays; each approval of a reviewed step freezes a numbered revision that can be read and
  exported later; reopening starts a new revision and never erases one.
- Today: one audit writer for 14 critical actions, called by hand from each service, inside a
  transaction where the server supports one. Complete only as far as every caller remembers.
- The draft's own worry about pluggable tools: "a new tool cannot be forgotten by the delete
  cascade". The same worry applies to history.

## Decision

Three records, three purposes:

### 1. Field-level history — written by the database

- Every domain table has a **generic trigger** that, on insert, update and delete, writes one row
  per changed field to `history.change`: table, row, field, old value, new value, the unit and
  office it belongs to, the acting person, the request reference, the time.
- The application's part is one line per transaction: at its start the platform tells the database
  **who acts and for which request** (ADR-009 already does this for row security). A write with no
  actor set is refused by the trigger, so nothing changes anonymously; workers and migrations name
  a system actor.
- **Append-only is enforced by the database:** the application's database role has no right to
  update or delete in the `history` schema, and a trigger refuses it for every role.
- A CI test fails when a domain table has no history trigger, so a new tool gets its history
  without writing any.
- `history.change` is partitioned by month. Secrets never enter it: password hashes, session and
  token columns are excluded by the trigger's column list, and the test checks that list.
- **Reading** is the `history` module's job: it turns table and column names into the field labels
  of the tool (each tool module declares its fields once — the same declaration feeds "what is
  missing" in the step pattern, D88) and applies the "view history" permission on the unit.

### 2. Critical actions — written by the application, with meaning

- The D65 log continues as **domain events**: approve, return, reopen, archive, restore, delete,
  purge, access and role changes, catalogue publication, definition changes, sign-in events. An
  event carries what a row diff cannot: the intent, the reason typed by the person, a snapshot
  where one is needed.
- Events are written in the same transaction as the action (the outbox of ADR-014 reads the same
  table for notifications), so an action without its entry cannot exist.
- The activity-log page reads these; office administrators see their office's, global
  administrators all (draft P7).

### 3. Revisions — immutable snapshots

- On each approval of a reviewed step, the tool module produces a **snapshot document** of the
  step: every field and row, the catalogue texts of the pinned version in every language, the
  people and dates of the review, the versions of the tool's schema and of the workflow
  definition. It is stored as one JSON document in `workflow.revision` with its number, never
  updated afterwards (enforced as for history).
- Reading or exporting "Revision 2" renders from the snapshot alone, so it stays exactly as it was
  approved even after the catalogue, the tool's tables or the workflow change. A tool module ships
  a small upgrader when it changes its snapshot shape, with a test over stored examples.
- Reopening (D88) continues the live data and leaves the snapshots untouched; the next approval is
  the next number.

## Options considered

| | A. Calls in each service (today) | B. ORM change tracking | **C. Database triggers + application events** | D. Event sourcing | E. System-versioned (temporal) tables |
|---|---|---|---|---|---|
| Cannot be forgotten by a new module | No | Only for writes that go through the ORM | **Yes, for every write by any path** | Yes | Yes |
| Covers bulk statements, migrations, fixes by hand | No | No | Yes | n/a | Yes |
| Tamper resistance | Application-level | Application-level | Database-level | Depends | Database-level |
| Carries intent and reasons | Yes | No | Yes (the events) | Yes | No |
| Complexity for every module author | Remember each call | Low | None | Very high: every rule rewritten around events | Low |
| Read as "who changed which field" | Custom | Direct | Direct | Derived from events | Derived by comparing versions |
| Works on SQL Server (ADR-002) | Yes | Yes | Yes | Yes | Yes (PostgreSQL would need an extension) |

## Trade-off analysis

The draft sets a strong requirement — *every* write, *nobody* edits. Only the database can promise
that: any mechanism in application code covers the paths that remember to use it. That rules out A
and B as the foundation.

D (storing events as the source of truth and deriving the data) would give history for free, but
it reshapes the whole system around a pattern the domain does not otherwise need, makes reports
and the migration harder, and is the most expensive option to get right. E gives full old row
versions but not "which field changed" directly, and nothing about intent.

C splits the job along its natural line: the database guarantees completeness and immutability of
*what changed*; the application records *why* for the actions that have a why. The cost is that
trigger-captured history speaks in tables and columns, so the reading side needs the field
declarations — which the tools must provide anyway.

## Consequences

- Easier: history is complete from the first table of a new tool; an auditor's question is one
  query; an approved revision is a self-contained record.
- Harder: about 15 million history rows a year to partition and, later, to move to cheaper storage;
  bulk imports must set an actor; snapshot shapes need upgraders when a tool changes.
- To revisit: retention of history when the client states a policy (C14) — a setting on the
  partitions, never a silent deletion.

## Action items

1. [ ] Phase 3: the generic trigger, the actor setting, the grants, the "no table without history"
   test; measure the write cost on the walking skeleton.
2. [ ] Phase 5: field declarations per tool. Phase 9: snapshots, reading and exporting a revision.
3. [ ] Migration (ADR-020): approved steps become Revision 1 with their original people and dates;
   field history starts on the migration day (draft M3).
