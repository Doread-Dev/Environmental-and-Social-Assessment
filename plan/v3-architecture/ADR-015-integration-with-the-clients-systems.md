# ADR-015: Integration with the client's systems — links in, a stable API, events out, adapters at the edge

**Status:** Proposed — **to confirm with the client's answers (C2, C5)**
**Date:** 2026-11-17
**Deciders:** the owner; the client's IT (which systems, which direction)
**Draft:** §2.6, §6, §6.1 · **Related:** ADR-007, ADR-008, ADR-014, ADR-022

**In plain words:** we do not yet know what the client's other systems are, so v3 is built with
standard sockets on every side: a link from their platform opens ESMS already signed in; their
systems can read ESMS data through a documented, stable interface; ESMS can tell them when
something happens; and a specific connector (for their project list, for example) is a small
add-on, not a change to the core.

## Context

- The owner's criterion: stay close to how the client's organisation works, to make integration
  easy. The facts are open: what the global platform is and how it opens tools (C2), which systems
  must exchange data and in which direction (C5).
- Known wishes: a button in the global platform opens ESMS; staff arrive signed in; links open a
  given page; the platform may already hold lists (projects, countries, users) ESMS should not ask
  people to type again.
- The office export/import (draft §6) is also an integration: of ESMS with another ESMS.

## Decision

Four standard mechanisms now; specific connectors when the facts arrive.

1. **Entry and deep links (inbound, people).** Every page of ESMS has a stable address; the
   platform links to it; organisation sign-in makes arrival seamless (ADR-008). A short, published
   list of link forms ("open the project with this code", "open my queue") is part of the
   contract, so the platform never depends on internal addresses.
2. **Integration API (inbound, systems).** The read-mostly surface of ADR-007 under
   `/integration/v1`: offices, units with their codes, states and risk categories, people and
   assignments (where permitted), reports. Access by **service accounts** using the standard
   client-credentials grant, each with named permissions and a scope on the tree exactly like a
   person, every call in the history. Rate-limited and versioned.
3. **Events out (outbound).** Domain events from the outbox (ADR-014) can be delivered to
   subscribed systems as signed webhooks with retries: unit created, step approved, unit archived,
   and so on. The list of event types is part of the contract.
4. **Reporting access.** The reporting layer (ADR-022) is a set of documented database views.
   A BI tool reads them through the integration API or, if the client's IT prefers, through a
   read-only database account on a replica, limited to those views.

**Connectors are adapters at the edge.** A connector to a specific system (import the project
list from the platform, push documents to a document system, look people up in the directory)
is a small module in `integration/` that maps between that system and the core's public
interfaces, runs in the worker, and can be switched off. The core never learns the other
system's shapes. **Reference lists owned elsewhere** (if the platform owns the list of countries
or projects): ESMS keeps its own rows with the other system's identifier beside them
(`external_ref`), so a link survives renames and ESMS keeps working when the other system is
unreachable.

**Office export/import** uses the same machinery: each module's lifecycle hooks (ADR-012) write
and read a versioned archive (data, files with hashes, history, people); import runs as a job in
one transaction per office, refuses a version it does not know, and reports counts for
verification.

## Options considered

| | A. Build nothing until asked | **B. Standard sockets now, connectors later** | C. An integration platform or service bus in between | D. Let other systems read our database |
|---|---|---|---|---|
| Cost now | None | Small (API surface, service accounts, webhooks) | High | None |
| Cost when the first integration comes | A design under time pressure | A connector | Depends on the client having such a platform | None |
| Coupling | n/a | To our contract | To the bus product | To our internal tables: every change breaks them |
| Security and audit of access | n/a | Per service account, in the history | In the bus | A database password, no audit in ESMS |
| Stand-alone shape | n/a | Same | No | Same |

## Trade-off analysis

A is tempting because the facts are missing, but integration is the stated reason the owner wants
the technology chosen with care. The four mechanisms are not guesses about the client's systems;
they are the forms almost any system can use, and each reuses something v3 has anyway (addresses,
the API, the outbox, the reporting views). C is right only if the client already runs such a
platform and requires it — then a connector to it is written, still at the edge. D is the classic
shortcut that turns every later schema change into a negotiation; only the reporting views are
offered that way, because they are a contract.

## What would change this decision

- C2: the platform is a product with its own connection standard (an app catalogue, a launch
  protocol) → a connector implementing it; nothing in the core changes.
- C5: a system must *write* into ESMS (create projects from the platform) → the integration API
  gains those writes with idempotency keys; the rules stay ESMS's own.
- C5: no integration wanted → the surface stays, unused, at no running cost.

## Consequences

- Easier: the first integration is a connector, not a redesign; every outside access is named,
  scoped and logged.
- Harder: a second, stable API surface to version; webhooks need a delivery log and a replay tool.
- To revisit: after C2 and C5; this ADR is the one most shaped by the client's answers.

## Action items

1. [ ] Owner: C2 and C5; if possible a technical contact for the global platform.
2. [ ] Phase 3: service accounts in the identity and access modules.
3. [ ] Phase 10: deep-link list, integration API v1. Phase 14: office export/import.
