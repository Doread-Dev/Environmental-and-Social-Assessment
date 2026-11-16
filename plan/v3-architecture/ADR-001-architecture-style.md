# ADR-001: Architecture style — a modular monolith with three process roles

**Status:** Proposed
**Date:** 2026-11-17
**Deciders:** the owner
**Draft:** §2.2a (tool registry), §6, §6.1 · **Related:** ADR-004, ADR-012, ADR-016

**In plain words:** v3 stays one application, not many small services. Inside, it is cut into
modules with hard walls between them, so a new tool is added as one module and nothing else has to
be opened.

## Context

- The load is small (system overview §3); the hard part is rules and change: scopes, approvals,
  revisions, history, and tools that must be easy to add.
- Today's backend is one process with layers by technical kind (`routes/`, `controllers/`,
  `services/`, `models/`). It works, but a feature is spread over five folders and nothing stops a
  service from reading another domain's model. The v2 prototype showed the cost: new modules were
  forgotten by the delete cascade.
- Every save must be one transaction that also writes history and the events for notifications.
- The same build must run centrally and on a single machine with no internet.

## Decision

A **modular monolith**:

1. **Modules by domain**, each with its own folder, database schema, public interface, permissions,
   lifecycle hooks and tests. Two groups: the *kernel* (identity, access, org, workflow, catalogues,
   files, history, notifications, places, reports, exports, integration, platform) and the *tools*
   (one module per tool).
2. **Dependency rules, enforced by a test in CI:** a tool depends on kernel interfaces only, never
   on another tool; the kernel never imports a tool (it reads the registry); a module is used only
   through its public interface or through an event; no module queries another module's tables,
   except the reporting views.
3. **Inside a module, domain code is free of the framework:** rules are plain functions and classes
   that take data and return data; HTTP, database and queue code sit at the edge. This keeps the
   rules testable without a server and keeps ADR-004 reversible.
4. **One image, three process roles:** `api` (HTTP), `worker` (background jobs), `migrate` (schema
   migrations, one run per release). All three load the same modules.
5. **One database** for all modules, so a save, its history and its events commit together.

## Options considered

| | A. Keep the layered monolith | **B. Modular monolith** | C. Microservices |
|---|---|---|---|
| Fit to "a tool is one module" | Poor: a tool is spread over layers | Direct | Direct, at a high price |
| One transaction per save | Yes | Yes | No: needs sagas and eventual consistency |
| Stand-alone shape on one machine | Easy | Easy | Hard: many services, a broker, discovery |
| Operations for the client's IT | One service | One image, two running roles | Many services, a platform to run them |
| Complexity | Low now, grows without limit | Medium, bounded by the rules | High from day one |
| Path to split later | None | Each module can be lifted out | Already split |
| Cost | Lowest | Low | Highest (infrastructure and people) |

**A** was right for v2 and is the reason v3 exists: the vision notes call v2 "a solid base for a
small-to-medium internal app, not enterprise-level".

**C** solves problems this system does not have (independent scaling, many teams releasing
separately) and breaks things it needs (one transaction for a save with its history; a stand-alone
installation). It would also make the office export/import a distributed operation.

## Trade-off analysis

The real choice is between A and B: how much structure to pay for inside one process. B costs a
fixed amount up front (the module template, the boundary test, the registry) and repays it every
time a tool is added or changed, which the owner expects to happen. The discipline B asks for
cannot rest on good intentions, so it is enforced mechanically: a dependency test fails the build
when a module reaches around another's interface, and a conformance suite (ADR-012) fails when a
tool forgets a lifecycle hook.

The risk in B is boundaries drawn in the wrong place. The mitigation is that the first cut follows
seams the current code already proves (workflow, access, audit, files, each tool) rather than
guesses.

## Consequences

- Easier: adding or switching a tool; reasoning about who may touch what; testing rules without a
  server; lifting a module out later if it ever needs it.
- Harder: a feature that crosses modules needs an interface or an event, not a quick import; the
  first phase spends time on the skeleton before any page works.
- To revisit: only when one module needs its own scale or release rhythm (system overview §8).

## Action items

1. [ ] Phase 3: module template, the public-interface convention, the dependency test in CI.
2. [ ] Phase 3: a walking skeleton (one thin slice through identity, access, org, workflow, one
   tool, history, export) before the remaining modules are built.
3. [ ] Phase 5: the tool conformance suite (ADR-012).
