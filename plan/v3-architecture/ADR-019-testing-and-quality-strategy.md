# ADR-019: Testing and quality strategy — rules tested as pure code, structure tested against a real database, v2.5 as the reference

**Status:** Proposed
**Date:** 2026-11-17
**Deciders:** the owner
**Draft:** §8 (rules of every phase), §8.2 · **Related:** ADR-001, ADR-006, ADR-009, ADR-011,
ADR-012, ADR-020

**In plain words:** v3 keeps the rule that nothing ships without tests, and adds kinds of tests
that the new structure needs: proof that the walls between modules hold, that no office can see
another's data, that every tool obeys the common rules, and that v3 behaves like v2.5 wherever it
is supposed to.

## Context

- Today: backend tests against a real MongoDB (about 95 % coverage), frontend unit tests, twelve
  end-to-end flows in a production-style process, a docs test, coverage floors that only go up,
  CI required before a merge (D39, D76).
- v2.5 is the behavioural reference for v3 (draft §8.2): a v3 phase rebuilds a behaviour, it does
  not redesign it.
- v3 moves guarantees into the database (constraints, row security, history triggers). Tests that
  replace the database with a stand-in would test nothing of that.

## Decision

### Layers

| Layer | What it proves | How | Share |
|---|---|---|---|
| **Unit** | Rules: gates, state computation, scoring, totals, what-is-missing, permissions arithmetic, snapshot upgraders | Pure functions, no server, no database (possible because of ADR-001 point 3) | Most tests; seconds to run |
| **Integration** | A module through its public interface with **a real PostgreSQL**: constraints, transactions, history rows, row security, version conflicts, outbox events | A disposable database per test run, migrations applied, each test in its own transaction or schema | Every module |
| **Contract** | The API matches its published document; no breaking change without a version step; the generated client compiles | Generated from schemas, checked in CI (ADR-007) | Every route |
| **Structure** | The architecture itself (below) | Dedicated suites that run on every pull request | Fixed set |
| **Interface** | Components and pages: states, forms, keyboard, both directions, light and dark, accessibility checks, the v2.5 audit rules | Component tests in a browser-like environment; visual checks for the design system | Every component and page with logic |
| **End to end** | The golden flows on the built image: sign-in, a project and an activity through the tools, review, revision, export, access limits, deleted items, both languages | Playwright against the compose stack | A few dozen flows |
| **Non-functional** | Performance budgets, recovery, security | Load test of the main reads and saves at ten times the planned load before each stage's release; restore rehearsal; the scans and the penetration test of ADR-018 | Per release stage |

### Structure suites (new in v3)

1. **Module boundaries:** no import across a wall; no query on another module's schema.
2. **Route coverage:** every route declares a permission and a scope; start-up of each role works.
3. **Tool conformance** (ADR-012): every registered tool passes the shared suite.
4. **Database conventions:** every office-data table has `office_id`, a row-security policy and a
   history trigger; every soft-deleting table has its view; history cannot be updated or deleted.
5. **Leak test** (ADR-009): a person of office A calls every read route and search with office
   B's identifiers and receives nothing, including counts.
6. **Migrations:** apply on an empty database and on the previous release's schema with data;
   the old `api` still works after the new migration (for rolling updates, ADR-016).

### v2.5 as the reference

- For every behaviour carried over (the five tools, review cycle, stale saves, gates, exports), the
  v2.5 test cases are ported as **characterisation tests**: same inputs, same expected outcomes,
  expressed against the v3 interfaces. A deliberate difference is listed in the phase's notes with
  its draft section; an accidental one is a failing test.
- The v2.5 end-to-end flows are ported as the first v3 flows.

### Migration tests (with ADR-020)

Fixtures of v2.5 data covering every state (draft, returned, approved, archived, deleted, with
files) run through the migration in CI; the count-and-checksum report must match; the rehearsals
on copies of real data use the same report.

### Rules kept

Every behaviour change ships with a test; coverage floors per package that only rise; all checks
required before a merge; a flaky test is fixed or removed within the phase, never retried into
green; test data uses invented people and `example.com` addresses, never client documents.

## Options considered

| | A. Mostly end-to-end | B. Mostly unit tests with a stand-in for the database | **C. Pure-rule unit tests + integration on a real database + structure suites** |
|---|---|---|---|
| Speed of feedback | Slow | Fastest | Fast for rules, minutes for the rest |
| Proves constraints, row security, history | Indirectly | No | Yes |
| Proves the architecture rules | No | No | Yes |
| Maintenance | Brittle | Stand-ins drift from the real database | Moderate |

## Trade-off analysis

The system's guarantees now live in two places: pure rules and the database. C tests each where
it lives and keeps end-to-end for what only a whole system can show. Its cost is a real database
in every test run, which the pipeline provides in seconds and v2 already does with MongoDB.

## Consequences

- Easier: a module author gets most guarantees from shared suites; a regression against v2.5 is a
  red test, not a discovery in production.
- Harder: porting the v2.5 cases is a large, unglamorous task in phases 5–7; the full pipeline is
  slower than a unit-only one (kept in check by running suites in parallel).
- To revisit: coverage floors at the end of each phase, as today.

## Action items

1. [ ] Phase 3: test harness (disposable database, per-test isolation), suites 1, 2, 4 and 6, the
   pipeline layout.
2. [ ] Phase 4: the leak test. Phase 5: the conformance suite and the first characterisation set.
3. [ ] Each stage release: load test at ten times the planned load, restore rehearsal.
