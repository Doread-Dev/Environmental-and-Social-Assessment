# v3 — Architecture decision records (technology stage)

**What this is:** the output of the v3 technology stage ([draft §6.1](../V3_STRUCTURE_DRAFT.md)):
the technical choices for v3, each as an architecture decision record (ADR) with the options
weighed, the trade-offs and what would change the decision. Start with the
[system overview](00-system-overview.md).

**Status of everything here: Proposed** (2026-11-17). Nothing is a decision until the v3 review
gives it a D-number. The owner's rule for this stage: propose the best enterprise-level option
now, adjust when the client answers. Each ADR that waits for a client fact says so in its status
line and has a section "What would change this decision".

**Domain items are not reopened here.** What the system does is the draft; these records only say
how it is built.

## The decisions at a glance

| ADR | Topic | Recommendation | Waits for |
|---|---|---|---|
| [001](ADR-001-architecture-style.md) | Architecture style | A modular monolith: one application cut into modules with enforced walls; three process roles (api, worker, migrate) from one image. | — |
| [002](ADR-002-database.md) | Database | PostgreSQL, used fully; a named list of what would change for SQL Server. | **C3** |
| [003](ADR-003-language-and-runtime.md) | Language | TypeScript on Node.js for server and interface; C# if the client's IT will own the code in .NET. | **C3, C15** |
| [004](ADR-004-backend-framework-and-data-access.md) | Server framework, data access | NestJS at the edges with framework-free rules; SQL migrations and a typed query builder, no heavy ORM. | — |
| [005](ADR-005-frontend.md) | Interface | The React single-page app of v2.5, typed, with a generated API client; tools plug into the shell. | — |
| [006](ADR-006-repository-and-delivery-pipeline.md) | Repository, pipeline | A new workspace repository for v3; every change checked; one signed image per release. | owner |
| [007](ADR-007-api-and-contracts.md) | API | REST with an OpenAPI contract generated from the code; stable error codes; a separate stable surface for other systems. | — |
| [008](ADR-008-identity-and-sessions.md) | Sign-in, sessions | A person with one or more identities; OpenID Connect for staff; invited local accounts; revocable server-side sessions. | **C1, C2** |
| [009](ADR-009-authorization.md) | Access enforcement | One policy module over the scope tree; database row security per office as a second lock. | — |
| [010](ADR-010-data-model-conventions.md) | Data conventions | UUID v7, schema per module, typed tool tables, one version column, versioned catalogues, soft delete. | — |
| [011](ADR-011-history-audit-and-revisions.md) | History, revisions | Field history written by database triggers; critical actions as events; revisions as sealed snapshots. | — |
| [012](ADR-012-tool-modules-and-workflow-definitions.md) | Tools, workflow | Tools as code modules with one manifest and a conformance suite; workflow paths as versioned data; no engine product, no form builder. | — |
| [013](ADR-013-files-and-documents.md) | Files | Object storage behind an interface (filesystem when stand-alone); virus scan before first download. | **C3, C4** |
| [014](ADR-014-background-work-notifications-and-email.md) | Background work, email | A transactional outbox and a job queue inside PostgreSQL; mail behind an interface. | **C7** |
| [015](ADR-015-integration-with-the-clients-systems.md) | Integration | Deep links in, a stable integration API, signed events out, reporting views; connectors as adapters. | **C2, C5** |
| [016](ADR-016-deployment-and-hosting.md) | Hosting | One container image; managed services in the client's cloud centrally; a compose bundle stand-alone. | **C3, C4** |
| [017](ADR-017-observability-and-operations.md) | Operations | OpenTelemetry logs, metrics and traces to the client's tools; stated availability and recovery targets. | **C17** |
| [018](ADR-018-security-baseline.md) | Security | OWASP ASVS level 2 as the written baseline; scans in the pipeline; a penetration test before go-live. | **C14, C16** |
| [019](ADR-019-testing-and-quality-strategy.md) | Testing | Rules as pure unit tests, modules against a real database, structure suites, v2.5 cases as the reference. | — |
| [020](ADR-020-migration-from-v2-5.md) | Migration | Offline extract → raw staging → transform → verify; deterministic identifiers; rehearsed runbook. | — |
| [021](ADR-021-maps-and-places.md) | Maps | Points in PostGIS; areas from a boundary dataset we hold; map picture from a replaceable provider. | **C18** |
| [022](ADR-022-exports-and-reports.md) | Exports, reports | Excel built on the server from tool builders and revision snapshots; one reporting layer of views. | — |

## What each client answer decides

Questions are in [V3_CLIENT_QUESTIONS.md](../V3_CLIENT_QUESTIONS.md).

| Answer | ADRs it settles | If the answer differs from the assumption |
|---|---|---|
| **C1** identity provider | 008 | Not OpenID Connect → a SAML driver; several directories → several providers. |
| **C2** the global platform | 008, 015 | Embedding in a frame → a separate decision; a platform standard → a connector. |
| **C3** databases and servers | 002, 003, 013, 016 | SQL Server only → ADR-002's switch list; no containers → system services. |
| **C4** where data lives | 013, 016 | Residency rules → regional or stand-alone installations, no code change. |
| **C5** other systems | 015, 022 | Writes into ESMS → the integration API gains them. |
| **C7** email | 014 | No mail → in-app notifications only, administrator-given passwords as in v2.5. |
| **C14** retention | 011, 018 | A policy → settings on history partitions and closed units. |
| **C15** who maintains the code | 003, 004 | The client's IT in .NET → C# server. |
| **C16** security requirements | 018 | A formal programme → built on the same baseline. |
| **C17** availability, recovery | 016, 017 | Stricter targets → a hosting change (more instances, a second region). |
| **C18** maps and boundaries | 021 | Their own map service and boundaries → configuration and a catalogue load. |

## How firm each recommendation is

- **Firm whatever the client says:** 001, 005, 007, 009, 010, 011, 012, 014 (the pattern), 019,
  020, 022. They follow from the agreed domain and the planned size.
- **Firm in kind, product open:** 013, 016, 017, 021 — the shape is decided, the product behind
  each interface is the client's.
- **Depends on one fact:** 002 (which database their IT supports), 003 (who maintains the code),
  008 (which identity provider).
- **The least consequential:** 004 — the rules do not import the framework, so it can be changed
  at the edges.

## What happens next

1. The owner takes the client sheet (C1–C18) to the client and their IT.
2. The answers are written into the draft and the affected ADRs are confirmed or redone.
3. The v3 review turns the draft and these records into D-numbers.
4. Phase 3 starts with a **walking skeleton**: one thin slice through sign-in, access, one office,
   one unit, one tool with history, approval, a revision and an export — to prove the stack before
   the modules are built, with exact library versions pinned from the documentation of that day.

## Skills used in this stage

`engineering:architecture` (the ADR form), `engineering:system-design` (the overview: requirements,
shape, scale, trade-offs), `engineering:testing-strategy` (ADR-019). Kept for later phases:
`engineering:deploy-checklist` (release readiness), `engineering:documentation` (the docs of the
new repository), `engineering:tech-debt` (not needed for a rebuild).
