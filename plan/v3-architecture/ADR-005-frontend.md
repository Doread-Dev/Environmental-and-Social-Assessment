# ADR-005: Frontend — the React single-page app, in TypeScript, on the v2.5 design system

**Status:** Proposed (re-examined 2026-11-17 after the owner's review; the recommendation stands)
**Date:** 2026-11-17
**Deciders:** the owner
**Draft:** §1.2, §8.2 · **Related:** ADR-003, ADR-006, ADR-007, ADR-012

**In plain words:** the owner asked whether the screens must stay in React or whether something
better exists for a system like this. The alternatives were weighed with a free hand. React stays,
and not out of habit: none of the others would make a better product here, and two of them would
make a worse one for offices with weak internet. What changes is that the code gains checked types
and takes its knowledge of the server from a generated contract.

## Context

- The interface is a rich application behind sign-in: long forms, large editable tables (Tools 3–5,
  pasting blocks from Excel), a PDF reader, maps, English and Arabic with right-to-left layout,
  light and dark, phone to laptop, WCAG 2.1 AA.
- Its look and behaviour are fixed by the v2.5 design system and page designs (draft §1.2), which
  are our own components, not a bought component library. By the time v3 starts, v2.5 will have
  built and tested all of it in React (phases 15–26).
- Users include field and country offices where the connection can be slow or unstable.
- The server owns every rule; the interface shows the state and the allowed actions it receives.
- A tool brings its own pages, and the shell must pick them up from the registry (draft §2.2a).

## Decision

1. **React, as a single-page app** built with Vite, served as static files by the `api` role on
   the same origin, so no cross-origin setup exists in either deployment shape. Routing, server
   state and styling as in v2.5 (React Router, TanStack Query, Tailwind CSS with the tokens).
2. **TypeScript, strict.** The v2.5 component library is carried over and typed; its visual tests
   and the style guard come with it.
3. **A generated API client** from the server's OpenAPI document (ADR-007): request and response
   types and the list of error codes come from the server. Hand-written service functions and
   query-key lists are replaced by generated ones; "all HTTP through one client" stays.
4. **A tool's interface is a package** that registers its routes, navigation entry, pages, export
   action and help mapping against a small front-end registry; the shell renders what the server
   says the unit has and what the person may do. Nothing in the shell names a tool.
5. **Kept from v2.5 as behaviour:** unsaved-changes guard, one save path with the stale-save
   dialog, the session-ended dialog that keeps the page, request budgets per page, filters in the
   URL, light and dark, English and Arabic with RTL from logical properties.
6. **Light on weak connections:** code split per route and per tool, static files cached by the
   browser for a year (as today), so after the first visit a page costs only its data.

## Options considered

| | **A. React (SPA)** | B. Angular (SPA) | C. Blazor (C# in the browser or on the server) | D. Vue or Svelte (SPA) | E. Pages rendered by the server |
|---|---|---|---|---|---|
| Can build this interface (forms, big tables, RTL, accessibility) | Yes | Yes | Yes, with more custom work for the tables and paste | Yes | Poorly: the tables and forms are too interactive |
| Our own design system as components | Built and tested in v2.5 | Rebuilt | Rebuilt | Rebuilt | Rebuilt |
| Weak or unstable connections | Good: small files, cached | Good | **Weak:** in the browser it downloads a multi-megabyte runtime first; on the server every click needs a live connection | Good | Every action is a round trip |
| Batteries included, one way to do things | No: libraries are chosen (already chosen and proven in v2.5) | **Yes**, the most uniform | Yes | Partly | Yes |
| Long-term stability | Core very stable; surrounding libraries move | Scheduled releases with automatic upgrades | Tied to one vendor's investment in it | Good | Good |
| Pool of people and ready parts (tables, maps, PDF) | Largest | Large | Smallest | Medium | n/a |
| One language with a C# server | No | No | **Yes** | No | Yes |

**B, Angular,** is the strongest alternative and a common partner of a .NET server in large
organisations: it prescribes one way for forms, routing, translation and structure, which keeps
large teams consistent. Against it here: everything it prescribes is already decided, built and
tested for this product in v2.5; choosing it would mean building the same screens a second time to
reach the same result, with new defects on the way and no capability gained. Its advantage
(uniformity for many developers) answers a problem this product does not have.

**C, Blazor,** looks natural once the server is C# (ADR-003): one language again. It is rejected
on a user-facing ground, not on effort: its browser form makes the first load heavy and its server
form needs a continuous live connection, and both hurt exactly the offices with the weakest
internet. It also has the smallest ecosystem for the demanding parts of this interface.

**D** offers nothing the others do not, with a smaller pool. **E** does not fit an interface this
interactive.

## Trade-off analysis

Judged only on what the finished product would be, A and B are equals and C is behind. Between
equals, the existing, tested, accessible implementation of the agreed design is not a matter of
convenience but of risk: replacing it changes nothing a user can see except the chance of
regressions. If the product were starting with no interface at all and a large in-house team,
Angular would be a fair choice; that is not the situation v3 will be in.

The two changes inside A (types, generated client) are where the enterprise gain is: they remove
the classes of error that plain JavaScript and hand-written calls allow.

## Consequences

- Easier: a wrong field or a forgotten error code fails the build; a new tool's pages plug into the
  shell; the interface cannot drift from the API.
- Harder: the generated client becomes part of the build; typing the carried-over components is
  real work in phase 3; the surrounding libraries need periodic upgrades.
- To revisit: nothing foreseen.

## Action items

1. [ ] Phase 3: workspace package for the design system (typed), the generated client, the
   front-end tool registry on the walking skeleton.
2. [ ] Phase 3: carry over the v2.5 UI checks (tokens only, logical properties, icon on the text
   line, contrast) as CI tests; a size budget per route.
