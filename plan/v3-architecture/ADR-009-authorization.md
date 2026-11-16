# ADR-009: Authorization — one policy module over the scope tree, with database row security behind it

**Status:** Proposed
**Date:** 2026-11-17
**Deciders:** the owner
**Draft:** §2.1, §3, §9.2 A5, §9.4 · **Related:** ADR-002, ADR-008, ADR-010, ADR-012

**In plain words:** every question "may this person do this here?" is answered in one place in the
code, from their roles and where those roles apply in the organisation tree. As a second lock, the
database itself refuses to hand out rows of an office the person has no business in, even if a
programmer forgets a check.

## Context

- The model is agreed (D82, draft §3): permission → role → assignment (person + role + node of the
  tree); access is the union of a person's assignments; an assignment on a node covers everything
  under it; a restricted person never sees a name or a count outside their scopes.
- The tree grows to organisation → office → project → activity, and may gain levels as data.
- v2 already has the two seams (D66): one access check and named permissions on every route, with
  tests that fail when a route skips them. v2.5 puts the access model behind them on MongoDB.
- Two different questions must both be fast: a **point check** (may I approve this screening?) and
  a **list filter** (which units may I see, for lists, counts, search and reports?).

## Decision

1. **One policy module (`access`)** is the only code that decides. Its interface:
   - `can(person, permission, node)` → yes/no, for point checks;
   - `visible(person, permission)` → a SQL condition over the tree, joined into every list, count,
     search and report query, so filtering happens in the database, not after it;
   - `allowedActions(person, unit, workflowState)` → what the interface may show (D83), combining
     permissions with the workflow state as today.
2. **The tree is stored with a closure table** (every ancestor–descendant pair, kept by the
   database on insert and move). "Everything under this node" and "every ancestor of this unit"
   are single indexed joins at any depth; a new level is new rows, not new code.
3. **Assignments are rows** (`person`, `role`, `node`, who gave it, when, optional end date). Roles
   are rows (a named set of permissions). Permissions are declared in code by the modules that
   check them (ADR-012) and listed in the database for the Roles page.
4. **Enforcement in the request pipeline:** every route declares a permission and how to find its
   node (unit, office, organisation); a global guard runs the check before the handler. A route
   with no declaration fails at start-up and in CI (the D66 test, kept). A denied read answers
   "not found", never "forbidden" (existence is not revealed, as today).
5. **Database row security as the safety net:** every table that holds office data carries its
   `office_id`. The transaction is told which offices the person may enter; a row-security policy
   hides the rest. The fine grain (project, activity, action) stays in the policy module. Workers
   and migrations use a separate database role with its own, explicit rights.
6. **Changes take effect at once:** a person's effective access is computed per request from the
   rows (cached only inside the request). No access is baked into the session.
7. **Every access and role change** is a critical action in the history (D65, D82).
8. **Activity-only people** (draft A5): the parent project's name and code are served by a
   dedicated, minimal read, not by widening the project permission.

## Options considered

| | A. Checks written in each service | **B. One policy module + SQL filter** | C. B + database row security on the office | D. An external authorization engine |
|---|---|---|---|---|
| One place to change the rules | No | Yes | Yes | Yes |
| List filtering in the database | Hand-written each time | Generated condition | Generated condition | Needs data copied to the engine, or post-filtering |
| A forgotten check leaks another office's data | Yes | Yes, if the route test is evaded | **No** | Yes |
| New service to run in both shapes | No | No | No | Yes |
| Complexity | Low, spreads | Medium | Medium + policies | High |
| Portability to SQL Server (ADR-002) | n/a | Full | Yes (it has row security) | Full |

The decision is **C** (B with the database safety net).

## Trade-off analysis

D (a relationship or policy engine as a separate service) is built for models richer than this
one and for many applications sharing one authorization system. Here the model is role-based with
a hierarchy, the data that decides (the tree, the assignments) lives in our database, and list
filtering needs a join on exactly that data. An engine would mean copying it and keeping the copy
in step, in both deployment shapes.

The step from B to C is where the enterprise requirement bites. B is correct as long as every
query goes through the policy module, and the route tests make that likely. C makes the worst
failure — one country's staff reading another country's projects — impossible at the level below
the application, for the price of one column, one policy per table (generated and tested) and a
setting per transaction. That price is small and the failure it removes is the one the client
would least forgive.

## Consequences

- Easier: one answer to "who can see this"; counts and search are correct by construction; adding
  a tree level touches no check.
- Harder: every data table carries `office_id` (kept right by the database when a unit is created);
  background jobs must state whose rights they run with; row security needs care with the
  connection pool (settings are per transaction).
- To revisit: teams or groups, if the client asks — they become one more way to hold an assignment.

## Action items

1. [ ] Phase 3: prove row security with the pool and the query builder on the walking skeleton.
2. [ ] Phase 4: the policy module, the closure table, the route declaration and its tests, a test
   that every office-data table has its policy.
3. [ ] Phase 4: a scripted leak test — a person of office A calls every read route with office B's
   identifiers and must receive nothing.
