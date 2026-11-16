# ADR-005: Frontend — the React single-page app, in TypeScript, on the v2.5 design system

**Status:** Proposed
**Date:** 2026-11-17
**Deciders:** the owner
**Draft:** §1.2, §8.2 · **Related:** ADR-003, ADR-006, ADR-007, ADR-012

**In plain words:** the interface keeps the technology v2.5 is built on (React), gains checked
types, and takes its knowledge of the server from a generated contract instead of hand-written
calls. The design does not change.

## Context

- v3 reuses the v2.5 design system and page designs as they are (draft §1.2); v2.5 builds them in
  React 19, Vite, React Router, TanStack Query and Tailwind CSS with tokens (phases 15–26).
- The app is used behind a sign-in by staff; there is no public page and no search-engine need.
- The backend owns every rule; the interface shows state it is given (`workflow`, allowed actions).
- A tool brings its own pages, and the shell must pick them up from the registry (draft §2.2a).
- Today's interface is plain JavaScript with hand-written service functions per endpoint.

## Decision

1. **Keep the stack:** React, Vite, React Router, TanStack Query, Tailwind CSS with the v2.5
   tokens. A **single-page app** served as static files by the `api` role on the same origin (as
   D38 today), so no cross-origin setup exists in either deployment shape.
2. **TypeScript, strict.** The v2.5 component library is carried over and typed; its visual tests
   and the style guard come with it.
3. **A generated API client** from the OpenAPI document (ADR-007): request and response types and
   the list of error codes come from the server's schemas. Hand-written service functions and
   query-key lists are replaced by generated ones; the rule "all HTTP through one client" stays.
4. **A tool's interface is a package** that registers its routes, navigation entry, pages, export
   action and help mapping against a small front-end registry; the shell renders what the server's
   registry says the unit has and what the person may do. Nothing in the shell names a tool.
5. **Kept from v2.5 as behaviour:** unsaved-changes guard, one save path with the stale-save
   dialog, the session-ended dialog that keeps the page, request budgets per page, filters in the
   URL, light and dark, English and Arabic with RTL from logical properties.

## Options considered

| | **A. React SPA + TypeScript (carry v2.5 over)** | B. A server-rendering React framework | C. Another framework (Angular, Vue, Blazor) |
|---|---|---|---|
| Reuse of the v2.5 design system and pages | Direct | Mostly, with changes to data loading | None: rebuilt |
| Fit to an app wholly behind sign-in | Exact | Server rendering buys little | Same as A |
| Stand-alone shape | Static files from the API | A second server process | Same as A |
| Complexity | Low | Higher (two runtimes of the same code) | A full rewrite of the interface |
| Shared types with the server | Yes | Yes | Only with a TypeScript framework |

**B** earns its complexity when first paint and search engines matter. Here every page needs the
person's data and permissions first, and the stand-alone shape is simpler with static files.

**C** would throw away the largest finished asset of v2.5 for no gain the domain asks for. (If
ADR-003 moved the server to .NET, the interface would still stay React: the design system decides
this, not the server language.)

## Trade-off analysis

There is no real contest: the draft already fixes the design system, and the design system is
React. The decision inside option A is how much to change while carrying it over, and the answer
is "types and the data contract, nothing visual": those two changes remove the classes of error
that plain JavaScript and hand-written calls allow, without touching what the owner approved.

## Consequences

- Easier: a wrong field or a forgotten error code fails the build; a new tool's pages plug into the
  shell; the interface cannot drift from the API.
- Harder: the generated client becomes part of the build; typing the carried-over components is
  real work in phase 3.
- To revisit: nothing foreseen.

## Action items

1. [ ] Phase 3: workspace package for the design system (typed), the generated client, the front-end
   tool registry on the walking skeleton.
2. [ ] Phase 3: carry over the v2.5 UI checks (tokens only, logical properties, icon on the text
   line, contrast) as CI tests.
