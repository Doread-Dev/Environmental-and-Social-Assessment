# ADR-022: Exports and reports — built on the server, from one reporting layer

**Status:** Proposed
**Date:** 2026-11-17
**Deciders:** the owner
**Draft:** §2.3 (workbooks), §2.4 (language at export), §2.5d (reports), §4 (revisions) ·
**Related:** ADR-011, ADR-012, ADR-014, ADR-015

**In plain words:** Excel files are built by the server instead of the person's browser, so an
old approved revision can be exported exactly as it was, in the language asked for, and other
systems can ask for the same files. The Reports page and any BI tool read the same prepared tables,
so a number is the same wherever it is shown.

## Context

- Today: Excel is built in the browser with a spreadsheet library (the largest part of the
  interface's download), from the data the page already has; layouts are this product's own (D68);
  a completeness test per tool ensures every field is in its sheet.
- v3 adds: export in a chosen language with the pinned catalogue texts; one workbook per activity
  and an activities sheet in the project workbook; export of a numbered revision; a Reports page
  with fixed tables and Excel export, scoped by the person's access, "on one reporting layer built
  to grow"; possible reading by the client's reporting tools (C5).
- An export must show only what the person may see, and exporting is itself an action to record.

## Decision

1. **Exports are produced by the server** (`exports` module). Each tool's manifest supplies its
   sheet builder (ADR-012); the module assembles workbooks, applies the office's name, time zone
   and the chosen language, and records the export as an event (who, what, when).
   - Small exports are streamed in the request; large ones (a project with many activities, a
     report over all offices) run as a job and are fetched when ready (ADR-014).
   - **A revision is exported from its snapshot** (ADR-011), a live step from live data, by the
     same builder.
   - The sheet layouts and their completeness tests are carried over as the specification; the
     builders are written on the server with a maintained spreadsheet library for .NET, and the
     interface loses its heaviest dependency.
2. **One reporting layer** (`reports` module): a set of documented database views in a `reporting`
   schema — units with their state, risk category, office and area; steps with their dates;
   monitoring gaps; access and activity counts. They are the **only** sanctioned read across
   modules (ADR-001) and are a contract: changed deliberately, with a version.
3. **The Reports page** queries those views through the API with the access condition of ADR-009
   joined in, so a table never counts what the person cannot see. Filters live in the URL; each
   table exports to Excel through the exports module.
4. **Outside reporting tools** read the same views (ADR-015): through the integration API, or a
   read-only database account limited to the `reporting` schema, on a replica when one exists.
   Office isolation for such an account is set by the database's row security, not by trust.
5. **Country installations** (ADR-023) send their summary rows into this same layer, marked
   with their origin, so global tables and totals cover them where their rules allow.
6. **Growing later:** heavier views become materialised and refreshed by a job; a replica takes
   the load; nothing on the page or in a BI model changes because the views keep their shape.

## Options considered

| | A. Build in the browser (today) | **B. Build on the server; reporting views** | C. A separate reporting database or warehouse from the start | D. Embed a BI product for the Reports page |
|---|---|---|---|---|
| Export an old revision, any language | Only what the page loaded | Yes | Yes | n/a |
| Other systems can request exports | No | Yes | n/a | n/a |
| One definition of each number | Per page | Yes (the views) | Yes | In the BI model |
| Respects each person's access | By what the page received | In the query | Needs access rules copied | Needs access rules copied |
| Extra systems to run | None | None | A pipeline and a second store | A BI server and licences |
| Fits the planned size | Yes | Yes | Oversized | Oversized; stand-alone shape loses reports |

## Trade-off analysis

A cannot serve revisions, languages or integrations without loading into the browser things the
page does not have. C and D are what large analytics needs look like; the draft asks for "a few
fixed tables … built to grow", and both would copy the access model into a second system on day
one. B meets today's need inside the system and leaves the standard growth path open: the views
are exactly what a warehouse or a BI tool would later be fed from.

## Consequences

- Easier: one builder per tool serves page, revision, language and integration; numbers agree
  everywhere; the interface is lighter.
- Harder: exports use server memory and time (bounded by sending large ones to the worker); the
  views are a contract to maintain.
- To revisit: charts and dashboards across countries when the client asks (draft §3 keeps them
  out until then).

## Action items

1. [ ] Phase 5: sheet builders ported with the tools and their completeness tests.
2. [ ] Phase 9: revision export. Phase 12: language at export, activity workbooks, the activities
   sheet, the first reporting views and the Reports page.
