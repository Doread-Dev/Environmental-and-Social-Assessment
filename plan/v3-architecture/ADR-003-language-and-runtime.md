# ADR-003: Language and runtime — TypeScript on Node.js, on both sides

**Status:** Proposed — **to confirm with the client's answers (C3, C15)**
**Date:** 2026-11-17
**Deciders:** the owner; the client's IT only if they set a standard or will maintain the code
**Draft:** §6.1 · **Related:** ADR-004, ADR-005, ADR-007, ADR-012

**In plain words:** the owner allowed a rewrite in any language. After weighing the alternatives,
the recommendation is to stay in the JavaScript family but move to TypeScript (JavaScript with
checked types) for the server and the interface alike. One exception is named: if the client's IT
will take the code over and works in .NET, C# becomes the better choice.

## Context

- The owner's criteria: the best decision, cost no object, closeness to the client's organisation
  matters more than closeness to today's code.
- "Closeness to the client" has two different meanings. What their IT **hosts** (database, sign-in,
  servers, monitoring) touches them every day; it is settled by ADR-002, ADR-008 and ADR-016, and
  a container hides the language from the host. What their IT **maintains** touches them only if
  they will ever change the code; that is not known (question C15, added by this stage).
- The interface is a React application and stays one: the v2.5 design system and every page design
  are built for it (draft §1.2).
- A tool in v3 is one unit made of a server part, an interface part, an export and tests (draft
  §2.2a). The fewer languages a tool crosses, the easier it is to add one.
- The existing rules are JavaScript: workflow computation, gates, version checks, Excel exports,
  and about 9,500 lines of backend tests that describe the behaviour v3 must keep.
- Today's code is plain JavaScript with no types. In a system whose weight is rules over many
  related records, the lack of checked types is a real cost: a wrong field name or a missing case
  is found by a test or a user, not by the build.

## Decision

**TypeScript in strict mode on the current Node.js LTS line, for server, worker, interface, exports
and tests.** One language end to end, one set of types for the API contract shared by both sides
(ADR-007), no plain JavaScript in the new codebase.

## Options considered

| | A. JavaScript as today | **B. TypeScript on Node.js** | C. C# on .NET | D. Java or Kotlin on Spring | E. Python |
|---|---|---|---|---|---|
| Checked types for a rule-heavy domain | No | Yes | Yes (strongest tooling) | Yes | Optional, weaker |
| One language for a whole tool (server, interface, export) | Yes | Yes | No: C# + TypeScript | No | No |
| API contract shared with the interface | By convention | Same types, generated | Generated from OpenAPI | Generated | Generated |
| Reuse of today's rules, exports and tests | Direct | Ported with types added | Rewritten | Rewritten | Rewritten |
| Sign-in, SQL, queue, Excel, observability libraries | Mature | Mature | Mature (first-class Microsoft sign-in) | Mature | Mature |
| Fit when the client's IT maintains the code | Common skill | Common skill | Best in a Microsoft shop | Best in a Java shop | Rare for this kind of system |
| Runtime characteristics at this load | Ample | Ample | Ample | Ample | Ample |
| Long-term support | LTS every year | LTS every year | LTS every two years, long windows | Long | Long |

**A** keeps the gap that matters most for an enterprise codebase.

**C** is the serious alternative. .NET is an excellent platform for exactly this kind of system:
long support windows, first-class Microsoft sign-in, strong data tooling. Its costs here are
specific: every tool would cross two languages; the Excel exports and the tested rules would be
rewritten rather than ported; and the API contract would be translated between type systems
instead of shared.

**D** has the same costs as C without the Microsoft fit. **E** is the wrong tool for a typed,
transactional web system of this shape.

## Trade-off analysis

At this load every option runs the system comfortably, so the decision rests on change and
ownership, not speed. For change, one language across a tool is a structural advantage that
matches the owner's requirement ("add tools easily") and no other option has it. For ownership,
the answer depends on who will maintain the code in five years:

- the supplier (as today) → TypeScript is the best fit on every row;
- the client's IT, in a .NET organisation → C# gives them a codebase their own people can own, and
  that outweighs the one-language advantage.

The runtime itself is not a hosting concern in either case: the client's IT receives a container
image (ADR-016) and operates a database, a sign-in registration and logs, none of which depend on
the language.

## What would change this decision

- The client's IT states a mandated platform for applications they host, or will maintain the code
  themselves in .NET → option C for the server; the interface stays React + TypeScript; ADR-004 is
  rewritten (ASP.NET Core); every other ADR stands as written.

## Consequences

- Easier: one skill set; shared contract types; today's rules and exports are ported with their
  tests as the safety net; a tool module is one language.
- Harder: Node.js needs discipline for heavy work in the request path (exports and scans go to the
  worker, ADR-014); yearly LTS upgrades.
- To revisit: after C15.

## Action items

1. [ ] Owner: ask C15 (who maintains the code long term; any mandated platform).
2. [ ] Phase 3: compiler settings (strict, no implicit any, no unchecked index access), lint rules
   and the type-check as a required CI job.
