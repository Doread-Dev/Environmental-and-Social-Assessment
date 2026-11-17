# ADR-007: API and contracts — REST with a generated OpenAPI contract and stable error codes

**Status:** Proposed
**Date:** 2026-11-17
**Deciders:** the owner
**Draft:** §2.2a, §6.1 · **Related:** ADR-004, ADR-005, ADR-015

**In plain words:** the interface and any other system talk to ESMS through one documented API.
The document is produced from the server's own code, so it can never be out of date, and other
systems of the client can be connected later without a new design.

## Context

- Today: a REST API under `/api/v1`, described by a hand-written reference that a test compares
  with the mounted routes. Errors are messages; v2.5 moves to codes (D81).
- v3 must be open to the client's systems (draft §6.1, C2, C5) and to tools added later.
- The interface must not copy any rule: it shows the state and allowed actions it receives (D30).

## Decision

1. **Resource-oriented REST over JSON** under `/api/v1` of the new platform. Tools are addressed
   through their unit and their registry key (`/units/{id}/tools/{key}`), so a new tool adds routes
   of a known shape, not a new convention.
2. **One contract source:** the server's typed request and response shapes (ADR-004) produce
   validation and the **OpenAPI document**, published with every build; the interface's
   TypeScript client is generated from it (ADR-005). A CI check fails when a change breaks the published
   contract without a version step.
3. **Errors** follow the standard problem format with three fields the interface relies on: a
   stable `code` (the D81 error codes, listed in the contract), field-level details for forms, and
   a `reference` that is also written to the log. Messages are written by the interface in the
   reader's language.
4. **Conventions fixed once:** cursor pagination; filters and sorting as query parameters (the
   same ones the pages keep in the URL, D85); every write of versioned data carries the `version`
   it was based on and a stale one answers `409 STALE_VERSION` (D62 kept); reads return the
   computed workflow state and the allowed actions for the caller.
5. **Two audiences, one implementation:**
   - the **application API**, used by our interface, may change with the interface in the same
     release;
   - the **integration API** (`/integration/v1`, ADR-015), a smaller, read-mostly surface for the
     client's systems with a stability promise: additive changes only inside a version, a
     deprecation period before removal, idempotency keys on writes.
6. **No business rule in a client.** A new client (the global platform, a script, a mobile app)
   needs the contract and credentials, nothing else.

## Options considered

| | **A. REST + generated OpenAPI** | B. GraphQL | C. Typed remote calls shared by both sides (no public contract) |
|---|---|---|---|
| Understood by the client's IT and their tools | Universally | Often | Not outside our codebase |
| Integration by other systems | Direct | Possible; needs more governance | No: a second API would be needed |
| Fit to permissions per resource and per action | Direct (route = permission) | Harder: checks per field and resolver | Direct |
| Caching, rate limits, audit of calls | Standard | Custom | Custom |
| Type safety for our interface | Generated | Generated | Native |
| Risk of the contract drifting from the code | None (generated, CI-checked) | None | None |

## Trade-off analysis

C is the smoothest for a team that owns both sides in one language and nothing else. v3 is
neither: other systems are expected, and the server and the interface are in different languages
(ADR-003). B shines when many different clients need many shapes of the
same data; here the pages have known request budgets and the permission model is per resource and
action, which REST expresses directly and GraphQL makes harder to prove. A gives our interface the
same type safety through generation and gives everyone else a standard document.

## Consequences

- Easier: integrations start from a published document; the interface cannot call what does not
  exist; permission coverage stays a route-level test.
- Harder: contract changes are deliberate and checked; two stability levels to keep apart.
- To revisit: the integration surface, once C2 and C5 say what the client's systems need.

## Action items

1. [ ] Phase 3: the conventions above as a short API guide; the contract check in CI.
2. [ ] Phase 3: the D81 error-code list carried from v2.5 as part of the contract.
