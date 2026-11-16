# ADR-023: Country installations and the head office — a hub with spokes

**Status:** Proposed — **what may leave a country is the client's legal decision (C4, C19)**
**Date:** 2026-11-17
**Deciders:** the owner; the client (per country: where data lives, what may be seen from outside)
**Draft:** §3, §6 · **Related:** ADR-008, ADR-012, ADR-015, ADR-016, ADR-022

**In plain words:** some countries will say "our data stays on a server in our country". This
record answers the owner's questions about them: how such a country stays part of the same system,
how the head office sees its work, and how it is managed. The answer: the central installation is
a *hub*, a country's own installation is a *spoke*. Settings flow down from the hub so every
country works the same way; people from head office open the country's site with the same account;
and, only if that country's rules allow it, a summary without names flows up for the global
reports. The country's records themselves never leave it.

## Context

- Agreed (draft §6): one product, two shapes; a stand-alone installation is possible; an office can
  be moved between installations. The draft designed nothing more for stand-alone servers because
  the case looked rare.
- The owner now expects it to be common enough to design for (2026-11-17): countries that require
  their own server or forbid data from leaving.
- What v3 treats as **global** must stay the same everywhere (draft §2.4, §3, §4): catalogues, the
  role list, workflow definitions, which tools apply, languages, the global library.
- What the head office expects (draft §3): a person with organisation scope sees the projects of
  every office, and yearly organisation totals are computed (draft §2.5a).
- Two kinds of country installation exist: **online** (in the country, reachable over the
  internet) and **offline** (inside a closed network, as Syria runs today).
- "Data may not leave" means different things in different laws: sometimes only storage must be
  in the country and viewing from abroad is fine; sometimes nothing personal may leave; rarely,
  nothing at all. Only the client can say which, per country.

## Decision

### Roles of the installations

- **Hub:** the central installation. Most offices simply live in it. It is the **authority for
  everything global** and keeps the **register of all offices**, including those hosted
  elsewhere, each with its code and the address of its site.
- **Spoke:** a country installation — the same image, holding that country's office — in the
  country's own cloud region or on its own servers.

### 1. Settings flow down (so every country works the same way)

- The hub publishes **configuration packages**: catalogue versions, the role list, workflow
  definitions, the tool set per unit kind, languages and translations, global library documents.
  Each package is versioned, signed by the hub, and states the lowest software version it needs.
- An **online spoke** fetches and applies new packages by itself; an **offline spoke** receives
  the same package as a file that its administrator loads.
- On a spoke the global settings are **read-only**: nobody there edits a catalogue or a role. The
  spoke's own administrator manages only what an office administrator manages (people and access
  in that office, the office library).
- The same packages move settings from the staging environment to production, so a catalogue is
  tried before it is published.

### 2. People from head office open the country's site (data stays where it is)

- An online spoke uses the **same organisation sign-in** as the hub (ADR-008). A head-office
  person opens the spoke's address — from the office switcher or the global platform — and is
  signed in without a second password.
- What they may do there follows the agreed rule for people across offices (draft §3): they need
  an assignment in that office, given by its administrator; a first visit creates the person with
  no access and notifies the office's administrators (draft §2.6). Nothing new for the domain.
- In the hub, the office switcher and the "Office" filter **list the spoke office and open its
  site**; its projects are not mixed into the hub's own lists.
- This path moves nothing: the records are stored and processed in the country and only displayed
  to an authorised person. Whether viewing from abroad is allowed is the country's rule (C19); if
  it is not, only people inside the country are given access.

### 3. A summary flows up, only where allowed (for the global reports)

- A spoke can send the hub a **reporting summary**: the rows of the reporting layer (ADR-022)
  reduced to an agreed list of fields. Three levels, set per spoke by the client:
  - `none` — nothing is sent;
  - `totals` — numbers only (how many units per state and risk category; the yearly office
    totals of the organisation-level reports);
  - `summary` — one line per project or activity: code, state, risk category, dates, area; **no
    people's names, no free text, no documents**.
- The hub stores what it receives in its reporting layer, marked with its origin and date. The
  global Reports page and the organisation totals then cover every country, and a summary row
  links to the country's site for the details.
- An online spoke sends it on a schedule through the integration API (ADR-015); an offline spoke
  exports a file that someone uploads at the hub.
- The exact field list of each level is a documented part of the contract, so the client's legal
  team can approve it line by line.

### 4. Keeping the fleet healthy

- Each online spoke reports a **heartbeat** to the hub: software version, configuration version,
  time of the last good backup, health. No project data. The global administrator and the
  supplier see one page of all installations and what needs an update.
- Spokes are updated with the same releases as the hub and must stay within a stated number of
  releases behind it; a package that needs a newer version is not applied until the spoke is
  updated, and the spoke says so.
- Office codes are given by the hub's register, so project codes never collide between
  installations.

### 5. Moving an office in or out

- The office export/import (draft §6, ADR-015) works in both directions: a spoke's office moves
  into the hub when a country no longer needs its own server, and an office moves out of the hub
  into a new spoke when a country starts to require one.
- On import, people are matched by their organisation identity (ADR-008), so a person who exists
  on both sides becomes one person, not two.

### Not chosen now, possible later

- **A live combined view:** the hub asking spokes for data at the moment a head-office person
  opens a list, so all countries appear in one list without storing anything centrally. It makes
  the hub depend on every spoke being reachable and is, for the law, the same as viewing from
  abroad. Left out until the summary proves insufficient.

## Options considered

| | A. Islands (today's draft) | **B. Hub with spokes: settings down, visits, optional summary up** | C. One system spread over regions, each region's data stored locally | D. Copy every country's data to the hub |
|---|---|---|---|---|
| Records stay in the country | Yes | Yes | Stored yes; shown abroad on every query | **No** |
| Same catalogues, roles and workflow everywhere | By hand, drifts | Yes, signed packages | Yes | Yes |
| Head office sees the country's work | No | By visiting, and in reports where allowed | Yes, in the same lists | Yes |
| Works for an offline country | Yes | Yes (packages and summaries as files) | No | No |
| What the client's lawyers must approve | Nothing | A short, fixed field list per level | Every cross-border query | Not approvable where residency applies |
| One country's outage affects the others | No | No | Possibly (shared control parts) | No |
| Complexity and running cost | Lowest | Moderate | High: a distributed platform to build and operate | Low |

## Trade-off analysis

A is what the draft implied and it fails the owner's questions: the head office would be blind to
such a country and its settings would drift apart from everyone else's. D is the simple way to
give the head office everything and is exactly what such a country forbids.

C is how very large online services handle residency: one application whose data is partitioned
by region. It gives the smoothest experience, one list for everything. But it cannot include an
offline country at all, it shows data abroad on every head-office query (so it helps only where
the law cares about storage and not about access), and it turns a small system into a distributed
one that must be built and run as such. For a handful of countries with residency rules that is
out of proportion.

B is built almost entirely from parts v3 has anyway — the same image, organisation sign-in, the
integration API, the reporting layer, the office export/import — plus two new, small things:
configuration packages and the heartbeat. Its weakness is honest and visible: a head-office
person works with such a country in a second browser tab rather than in one combined list, and
sees only a summary of it in global reports. That is the direct price of the country's own rule,
and each country can relax it by choosing a higher summary level or by moving into the hub.

## What would change this decision

- C4, C19: no country needs its own installation → this record costs nothing; packages are still
  used between staging and production.
- C19: many countries need one, and all allow viewing from abroad → reconsider the live combined
  view above.
- A country forbids even totals → level `none`; it stays managed through packages and visits by
  people inside it.

## Consequences

- Easier: a country with strict rules is still the same ESMS with the same settings; the client
  can show its legal team precisely what leaves; an office can change shape later without loss.
- Harder: every spoke is a server someone must host, back up and update (the client's cost per
  such country); packages and summaries are two more contracts to version; support must think
  about version differences between installations.
- To revisit: after C4 and C19.

## Action items

1. [ ] Owner: C4 and C19 (which countries, online or offline, what may be viewed from abroad,
   which summary level, who hosts and operates each).
2. [ ] Phase 6: catalogues and definitions exportable as signed packages (also used staging →
   production). Phase 12: the summary field lists on the reporting layer.
3. [ ] Phase 14: spoke mode (read-only global settings, package fetch and file load, summary
   send, heartbeat), the offices register and the fleet page in the hub, export/import both ways.
