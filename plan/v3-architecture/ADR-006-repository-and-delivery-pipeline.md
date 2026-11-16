# ADR-006: Repository and delivery pipeline — a new workspace repository that ships one image

**Status:** Proposed
**Date:** 2026-11-17
**Deciders:** the owner
**Draft:** §8.2 · **Related:** ADR-001, ADR-016, ADR-019

**In plain words:** v3 gets its own code repository, organised as one workspace holding the server,
the interface and the modules. Every change goes through automatic checks and ends as one packaged
image that is the same thing tested and installed. The v2 repository stays as it is for v2.5.

## Context

- Today: one repository with three independent packages (`backend`, `frontend`, `e2e`), no shared
  code between them, releases as a zip built by a script, installed by PowerShell or bash scripts.
- v2.5 is still to be built there (phases 15–26) and stays in service, then read-only, until Syria
  has moved (draft §5, §9.1 M9).
- v3 is a different toolchain (TypeScript, a workspace, containers) and a different structure
  (modules shared by server, worker and interface).

## Decision

1. **A new repository for v3** in the same GitHub organisation. The current repository continues
   unchanged for v2.5 and its maintenance releases; it is archived when v2.5 is retired.
   - The v3 planning documents (the draft, these ADRs, the client sheet) move to the new repository
     when phase 3 starts; `plan/DECISIONS.md` keeps D1–D95 and the v3 review continues the
     numbering there.
   - The standing rules move with it: no client documents in the repository, no AI attribution in
     commits, changes through pull requests, every behaviour change with a test.
2. **One workspace** (a package manager with workspaces):

   ```
   apps/api        HTTP process          apps/worker     background jobs
   apps/web        the interface         apps/migrate    migrations runner
   modules/<name>  one folder per module of ADR-001 (server part; `ui/` for its pages)
   packages/contracts      schemas and generated API types
   packages/design-system  the v2.5 components, typed
   packages/platform       transaction, logging, config, test helpers
   db/migrations   SQL migrations        e2e/            Playwright flows
   deploy/         compose files, infrastructure definitions, runbooks
   ```
3. **Pipeline on every pull request:** type-check, lint, format, unit tests, integration tests
   against a real PostgreSQL, the module-boundary test, migrations on an empty and on the previous
   schema, build of the image, end-to-end flows against that image, dependency and image scans.
   All required before a merge, as today.
4. **Release = one versioned, signed container image** plus the migration set, promoted unchanged
   from staging to production. No rebuild between environments; configuration comes from the
   environment.
5. **Environments:** development (local, compose), a staging environment that mirrors production
   and holds the migration rehearsals, production.

## Options considered

| | A. Same repository, new folders beside v2 | **B. New repository, one workspace** | C. Several repositories (server, interface, modules) |
|---|---|---|---|
| v2.5 work undisturbed | Mixed pipelines and rules in one place | Fully separate | Fully separate |
| One change across server and interface in one review | Yes | Yes | No |
| Shared contract and design system | Possible | Natural | Versioned packages, slower |
| Clean history, dependency and security scans for v3 | Mixed with v2 | Clean | Clean |
| Planning history in one place | Yes | Moved once, linked | Scattered |

## Trade-off analysis

A keeps everything in one place but ties two systems with different rules, tools and release forms
to one pipeline for a year or more; every v2.5 session would run among v3 files and the reverse.
C splits what must change together: a tool is server, interface and contract in one change. B
gives each system its own clean pipeline and keeps a tool in one pull request. Its one cost, the
planning documents changing home, is a single move with links left behind.

## Consequences

- Easier: v3 rules and checks are not diluted by v2 exceptions; what is tested is exactly what is
  installed; a rollback is the previous image.
- Harder: two repositories to look after during the overlap; the project instructions and the
  working model of sessions are written again for the new repository.
- To revisit: nothing foreseen.

## Action items

1. [ ] Owner: confirm the new repository (name, visibility, who has access).
2. [ ] Phase 3: workspace, pipeline, image build and signing, staging environment.
3. [ ] Phase 3: move the v3 planning documents; leave links in the old repository.
