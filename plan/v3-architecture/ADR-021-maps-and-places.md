# ADR-021: Maps and places — points in the database, areas from a boundary dataset we hold, the map picture from a provider

**Status:** Proposed — **boundary dataset and map provider to confirm with the client (C18)**
**Date:** 2026-11-17
**Deciders:** the owner; the client (which boundaries and map service they use)
**Draft:** §2.5, §9.1 M7 · **Related:** ADR-002, ADR-010, ADR-016

**In plain words:** a person drops a pin on a map; ESMS stores the pin and works out the country
and area by itself from a list of official boundaries it keeps. Only the background picture of the
map comes from an outside service, so if that service changes or is unreachable, no data is lost
and typed coordinates still work.

## Context

- Agreed (draft §2.5): several map points per unit, one main; a name and free text; country and
  administrative area filled from the map and stored; a map view on the Projects list; typed
  coordinates as the fallback on a stand-alone server; the provider is chosen in this stage.
- Fixed lists of governorates do not travel across countries (vision notes).
- Borders and place names are politically sensitive for an international organisation; the choice
  of which boundaries to show and store is the client's, not ours.

## Decision

1. **Storage:** points are geographic values in PostgreSQL with PostGIS (ADR-002), in the standard
   world coordinate system, with the unit, a label, free text and a "main" flag.
2. **Areas come from a boundary dataset held in our own database,** not from an online geocoder:
   a table of administrative areas (country, level 1, level 2 where available) with their shapes.
   On save, the database finds the areas containing the point and stores their identifiers and
   names **on the point** (so later boundary updates never rewrite history). This works offline,
   gives the same answer every time, and makes "projects by area" a simple grouped query.
3. **Which boundaries:** the dataset is a *managed catalogue* (versioned, like the others,
   ADR-010), loaded by the global administrator. **The source is the client's decision (C18)**:
   the boundaries their own mapping team uses if they have them; otherwise the administrative
   boundaries published for humanitarian work, which many organisations of this kind standardise
   on. The licence and the attribution it requires are checked when the source is named.
4. **The map picture:** an open-source map component in the interface, drawing tiles from a
   provider **behind an interface** (address, key, attribution in configuration). Candidates are
   the client's own map service if they have one, or a commercial tile service. No provider's
   proprietary component in the code, so changing provider is configuration.
5. **Place search** ("find a town by name") is an optional provider feature behind the same
   interface; without it the person moves the map by hand or types coordinates.
6. **Privacy:** a place can be marked sensitive (shown only as its area, never as a pin, to people
   without edit rights) — supported by the structure, off until asked.
7. **Stand-alone without internet:** no map picture; typed coordinates; areas still resolved from
   the boundary table.

## Options considered

| | A. Free text only (today) | B. Fixed lists of areas per country | C. Pin + online geocoder for the area | **D. Pin + our own boundary table + tiles from a provider** |
|---|---|---|---|---|
| Works across countries | Yes, ungroupable | Lists to maintain per country | Yes | Yes |
| Group and filter by area | No | Yes | Depends on the geocoder's naming | Yes |
| Same answer over time, offline | n/a | Yes | No: results change, needs internet | Yes |
| Control over which borders and names are used | n/a | Ours | The provider's | The client's |
| Dependence on a provider | None | None | For data | For the picture only |

## Trade-off analysis

C is the quickest to build and the weakest where it matters: the stored area would be whatever a
commercial service called the place that day, under that company's view of borders. D takes one
extra piece of work (loading and versioning a boundary dataset) and in exchange the data is
stable, reproducible, offline-capable and under the client's authority, while the only thing
bought from a provider is the replaceable background.

## Consequences

- Easier: reports by country and area; a map view with no per-country lists; a provider change
  without touching data.
- Harder: a boundary dataset to choose, license, load and occasionally update; map tiles are a
  small running cost.
- To revisit: drawing areas instead of points (a line or a zone for an activity) — PostGIS already
  stores them; not in scope until asked.

## Action items

1. [ ] Owner: C18 (does the client have a mapping team, a map service, preferred boundaries).
2. [ ] Phase 11: PostGIS, the boundary catalogue and its loader, the map component behind the
   provider interface, the map view of projects.
