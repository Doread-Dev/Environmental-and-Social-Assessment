# ADR-012: Tool modules, the registry and workflow definitions — tools as code, paths as data

**Status:** Proposed
**Date:** 2026-11-17
**Deciders:** the owner
**Draft:** §2.2, §2.2a, §4, §9.3 · **Related:** ADR-001, ADR-005, ADR-010, ADR-011

**In plain words:** a tool (screening, monitoring, a future one) is a self-contained piece of code
that plugs into a socket. Which tools a project or an activity goes through, in which order and
with how many approvals, is a setting an administrator's change can alter — not code. There is no
drag-and-drop tool builder and no heavyweight workflow product underneath.

## Context

- Owner's requirement: "the structure must let us add tools easily, for activities or for the
  project as a whole". The client may ask for the SEMP Plan and Stakeholder Awareness on
  activities, or for new tools (C9).
- Agreed: every tool registers `key`, `level`, `kind`, permissions, data module, lifecycle hooks,
  export, catalogues; workflow definitions are versioned per unit kind and list tools, order,
  gates and approval levels; `computeWorkflow(unit)` stays the single source of state; adding a
  tool reaches existing units, removing or reordering applies to new units only (K3).
- Today the order and the gates are constants in one service, and each tool is spread over routes,
  controllers, services, models, validators, pages, hooks and export builders.

## Decision

### A tool is a compile-time module with one manifest

Each tool is a module project on the server (ADR-004) with an interface package beside it
(ADR-005), and registers a **manifest** that the registry reads at start:

| Manifest part | Used by |
|---|---|
| `key`, `level` (unit, office, organisation), `kind` (reviewed, working, support, report) | workflow, shell, registry |
| Permissions it defines | access (Roles page), route guard |
| Field declarations (code, label key, type, required-at-submit) | step pattern ("what is missing"), history reading, exports |
| Routes and schemas | API, contract |
| State function: given the tool's data, its own state and what is missing | `computeWorkflow` |
| Lifecycle hooks: on archive, soft delete, restore, purge, office export, office import | workflow, deletion, integration |
| Snapshot builder and upgraders (reviewed tools) | revisions (ADR-011) |
| Export builder (sheets) | exports (ADR-022) |
| Catalogues it reads; notification events it emits; help and guidance place | catalogues, notifications, help |
| Interface package: pages, navigation entry | the shell (ADR-005) |

A **tool kit** in the platform gives the base pieces every tool reuses (versioned save, reviewed-step
transitions, row tables with bulk save, responsible person or external party, attachments).

### A conformance suite every tool must pass

One shared test suite runs against every registered tool: all manifest parts present; every route
declares a permission and a scope; every table has `office_id`, a history trigger and a row-security
policy; create → archive → delete → restore → purge leaves no orphan row or file; an office
export and import round-trips its data; the export covers every declared field; a reviewed tool's
snapshot renders without the live tables. **A tool that fails cannot be merged.** This is the
mechanical answer to the gaps found in the v2 prototype.

### Workflow definitions are versioned data

- `workflow.definition` → `definition_version` (immutable once published): for a unit kind
  (`project`, `activity`), the list of tools with, for each, its order, its **gate** (a condition
  over other tools' states, from a small fixed vocabulary: `approved(x)`, `completed(x)`, `all`,
  `any`) and, for reviewed tools, the ordered **approval levels** (one today), each naming the
  permission that may approve it.
- Stored as a JSON document validated against a schema at publication; changed only by a global
  administrator; every change is a new version and a critical-action entry (K2).
- A unit is pinned to a definition version. Publishing a version that only **adds** a tool offers
  it to existing units; any other change applies to new units (K3). The rule is checked by the
  code that publishes, not left to the administrator.
- **`computeWorkflow(unit)` is a pure function** of the definition version, each tool's state
  function and the unit's flags (archived, reopened). Gates are evaluated by it and by nothing
  else, as today. It is tested with the v2.5 behaviour as the reference.

### Where it stops

- **No workflow engine product** and **no visual designer** (draft §4, §9.7).
- **No generic form builder**: a tool's fields and rules are code, because they carry logic
  (scoring, totals, gates, exports). What administrators change without a release is the *content*
  (catalogues, ADR-010) and the *path* (definitions).
- **No plugins loaded at run time**: tools are part of the build, reviewed and tested like the
  rest. Switching a tool on for a unit kind needs no release; a new tool does.

## Options considered

| | A. Constants in code (today) | **B. Tool modules + definitions as data + own evaluator** | C. A workflow engine product (BPMN or durable workflows) | D. A low-code tool and form builder |
|---|---|---|---|---|
| Turn an existing tool on for activities | Code change | A new definition version | A new process model | Configuration |
| Add a tool with real logic | Spread over the codebase | One module | One module + process changes | Hits the builder's limits quickly |
| Multi-level approval later | Code | Definition change | Model change | Depends |
| State always derived from data, one source | Yes | Yes | No: the engine holds its own state beside the data | Depends |
| Extra system to run in both shapes | No | No | Yes | No |
| Complexity | Low, rigid | Medium | High | Very high to build well |

## Trade-off analysis

C solves long-running orchestration: timers, retries, calls to many systems, processes that wait
for machines. ESMS's workflow is different in kind: its state is fully derived from the data people
entered and the approvals they gave, and the only waiting is for a person. Putting an engine beside
the data would create a second source of truth to keep in step, which is exactly what
`computeWorkflow` avoids today.

D is what "tools must be easy to add" might seem to ask for, but the cost of a builder able to
express scoring, gates, totals, translations and exports is the cost of a programming language
with a worse editor. The owner's real need — a new tool without touching the rest of the system,
and switching tools per unit kind without a release — is met by B with far less risk.

## Consequences

- Easier: the client's likely first asks (tools on activities, a second approval level) are
  administrator changes; a new tool has a template, a kit and a checklist that tests enforce.
- Harder: the manifest and the conformance suite are real work before the first tool is ported; the
  gate vocabulary must stay small and resist special cases.
- To revisit: a different path per office (the definition already allows a scope; not switched on).

## Action items

1. [ ] Phase 5: the manifest type, the registry, the tool kit, the conformance suite; port Tool 1
   first as the pattern, then Tools 2–5 with the v2.5 behaviour tests.
2. [ ] Phase 5: the definition schema, the publication rules (K2, K3), `computeWorkflow` on
   definitions with the v2.5 test cases.
3. [ ] Phase 7: the four other tools as modules, the office-level ones proving `level`.
