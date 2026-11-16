# ADR-020: Migration from v2.5 — a repeatable three-step load from MongoDB into PostgreSQL

**Status:** Proposed (the field mapping is written when v2.5's schema is final, phase 13)
**Date:** 2026-11-17
**Deciders:** the owner
**Draft:** §5, §9.1 (M1–M10) · **Related:** ADR-002, ADR-010, ADR-011, ADR-013, ADR-019

**In plain words:** the day Syria moves to v3, a program copies everything from the old system
into the new one, checks that nothing is missing, and only then are people let in. The same
program is run several times beforehand on copies, so the real day holds no surprises. This ADR
is about *how* that program is built; *what* it does was agreed in the draft.

## Context

- Agreed (draft §5, §9.1): one cut-over, never side by side; scripted and repeatable; at least two
  rehearsals on copies of real data; a count report for every kind of record; a full backup first;
  if the checks fail, v2.5 simply stays in use; v2.5 read-only for three months afterwards.
- The source is MongoDB with ObjectIds, documents and files on disk; the target is PostgreSQL with
  UUIDs, constraints, the org tree, units, pinned catalogue and definition versions, history.
- v2.5 is not built yet (phases 15–26); its final collections are known only when it is released.

## Decision

1. **Three steps, each repeatable from the start:**
   - **Extract:** from a `mongodump` of the frozen v2.5 database and a copy of its uploads folder
     (never from the live server). Each document is loaded unchanged into a `migration` schema in
     PostgreSQL as raw JSON, one table per collection, with a manifest of counts and file hashes.
   - **Transform and load:** SQL and TypeScript transforms read the raw tables and write the
     target tables **through the same constraints as normal use**, in one transaction: the Syria
     office, people and identities, assignments (M1, M2), units, tool data, catalogue version 1
     with every unit pinned to it (M6), Revision 1 snapshots of approved steps (M3), the
     critical-actions log, notifications, deleted items with their remaining days, files (M4, M5).
   - **Verify:** a report compares source and target for every kind of record — counts,
     checksums of text fields, file hashes, per-project spot totals (rows per tool, states) — and
     lists every difference. The cut-over proceeds only on a clean report.
2. **Deterministic identifiers:** each new UUID is derived from the old ObjectId (a name-based
   UUID in a namespace reserved for the migration), and the old id stays in `legacy_id`. Running
   the migration twice gives the same ids; rehearsal findings can be traced; old links can be
   redirected.
3. **Old addresses and codes keep working:** a redirect table maps v2.5 page addresses and
   project codes (`ESMS-024` → `ESMS-SY-024`, draft §2.5c) to the new ones.
4. **History rule in practice (M3):** the load runs under a named system actor "Migration from
   v2.5", so the field-level history starts on that day with one clearly labelled origin; the
   v2.5 critical-actions entries are imported into the events table with their original people
   and times.
5. **Passwords and accounts (M8):** bcrypt hashes are carried as they are, marked for re-hash at
   next sign-in (ADR-008); nobody is asked to reset.
6. **Files:** copied into the v3 storage with their hashes checked; scan state "not scanned"
   until the worker has scanned them, which is scheduled right after the load (ADR-013).
7. **The migration is code in the repository** with tests (ADR-019): fixtures for every state, the
   report as an assertion. It ships in a release and is removed from the product after Syria's
   read-only period ends.
8. **Cut-over runbook:** announce → v2.5 to read-only → final dump and backup → extract, load,
   verify → smoke flows by the owner and the Syria administrator → open v3. A stated point of no
   return (people signing in to v3); before it, the fallback is to reopen v2.5.

## Options considered

| | **A. Offline extract → raw staging → transform → verify** | B. Read v2.5 through its API | C. Both systems live, data synchronised until the switch | D. A generic migration or ETL product |
|---|---|---|---|---|
| Matches "never side by side, one cut-over" | Yes | Yes | No (contradicts the agreed rule) | Yes |
| Complete (history log, deleted items, hashes) | Yes, reads everything | Only what the API exposes | Yes | Yes |
| Repeatable for rehearsals | Fully | Slower, needs a running v2.5 | Complex | Yes |
| Transforms as rich as needed (snapshots, pinning) | Yes, in our own code | Yes | Hard | Awkward: the logic is ours, not mappings |
| Effort | Medium | Medium | Very high | Medium plus a tool to learn |

## Trade-off analysis

C exists for systems that cannot stop; the owner and the draft chose a clean cut-over, and Syria's
data volume makes the whole run a matter of minutes. B would miss what the API does not serve. D
moves rows well but the hard part here is domain transformation (building revisions, pinning
versions, mapping roles), which is better written and tested as ordinary code. A's staging step
is what makes it safe: the raw copy is taken once and every later step can be rerun and inspected.

## Consequences

- Easier: rehearsals are cheap; every difference has a row to look at; a failed attempt costs
  nothing but time.
- Harder: the mapping must follow v2.5's schema as its phases finish; realistic fixtures need
  care; rehearsals on real copies must respect the client's data rules.
- To revisit: the same three steps serve a later country arriving from spreadsheets or another
  system — with a different extract.

## Action items

1. [ ] During v2.5 phases: keep a running list of collections and fields (a "migration contract").
2. [ ] Phase 13: extract, transforms, report, fixtures, redirects; two rehearsals on copies.
3. [ ] Phase 13: the cut-over runbook, agreed with the Syria administrator.
