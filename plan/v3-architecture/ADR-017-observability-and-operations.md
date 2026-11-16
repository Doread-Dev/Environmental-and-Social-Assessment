# ADR-017: Observability and operations — open-standard telemetry, stated recovery targets

**Status:** Proposed — **targets to confirm with the client's answer (C17)**
**Date:** 2026-11-17
**Deciders:** the owner; the client's IT (monitoring tools, expected availability)
**Draft:** §6.1 (observability constraint) · **Related:** ADR-014, ADR-016, ADR-018

**In plain words:** when something goes wrong, the people who run ESMS must see it before users
call, and find the cause from one reference code. And "how much downtime and data loss is
acceptable" gets written numbers that the hosting is built to meet.

## Context

- Draft constraint: structured logs, error tracking, health and metrics.
- Today: `GET /health`, text logs to a file or the system journal, errors on the console, a
  nightly backup with a restore check. v2.5 adds a reference code on server errors (D81).
- The client's IT may already have monitoring tools; ESMS should feed them, not bring its own
  island.

## Decision

1. **Open standards, no vendor in the code.** Logs, metrics and traces are emitted through
   OpenTelemetry; where they go (the cloud's monitoring, the client's existing tools, a
   self-hosted stack) is configuration.
2. **Structured logs** (JSON, one event per line): time, level, module, request reference, person
   id (never name or email), unit and office ids, outcome, duration. No personal data and no
   secrets in logs; a redaction list is tested.
3. **One reference per request,** generated at the edge, carried through the database transaction
   (it is the request reference in history rows, ADR-011), every log line, every job the request
   caused, and shown to the person on an error (D81). Support starts from that code.
4. **Traces** across HTTP → module → database → job, sampled; **metrics** for the things that
   predict trouble: request rate, errors and latency per route; database pool and slow queries;
   queue depth, age of the oldest job and failures; sign-in failures; outbox lag; storage and
   scanner errors; history partition size.
5. **Health:** `/health/live` (the process runs) and `/health/ready` (database reachable,
   migrations at the expected version) for the platform's probes; a status page for administrators
   showing version, dependencies (identity provider, mail, storage, scanner, map) each as
   up/degraded/down, and the jobs view (ADR-014).
6. **Error tracking:** unexpected errors grouped with their stack, release and reference, sent to
   an error tracker through an interface (the client's or a self-hosted one); never sent to a
   third party without the client's agreement.
7. **Alerts with runbooks:** each alert links to a short runbook in `deploy/`. First set: error
   rate, latency, readiness failing, queue stuck, backup missing, certificate expiring, database
   storage.
8. **Service targets (proposals for C17):** availability 99.5 % in working hours; recovery point
   15 minutes; recovery time 4 hours; restore rehearsed at least quarterly and after every
   database major upgrade.
9. **Who operates it is written down:** an operations guide stating what the supplier does
   (releases, application incidents) and what the client's IT does (platform, database service,
   identity, network), with contacts — agreed with the client before go-live.

## Options considered

| | A. Logs and a health URL (today) | **B. OpenTelemetry to whatever the client runs** | C. One monitoring vendor's agent and SDK in the code |
|---|---|---|---|
| Works with the client's existing tools | Partly | Yes | Only if it is that vendor |
| Both deployment shapes | Yes | Yes (stand-alone: logs to files, a local dashboard optional) | Needs internet |
| Find the cause of one failed save | Hard | One reference across everything | Yes |
| Lock-in | None | None | High |

## Trade-off analysis

A is not enough for a service several countries depend on. C gives the richest experience fastest
but binds the code and the client's data flow to one company. B costs slightly more setup and
leaves the choice of tool to the people who will look at it.

## Consequences

- Easier: problems are seen first by operators; one code links a user's report to its cause;
  recovery is a rehearsed procedure with numbers.
- Harder: telemetry has a running cost and must be kept free of personal data; alerts need tuning
  to stay meaningful.
- To revisit: the targets after C17; a stricter target (for example a second region) is a hosting
  change, not a code change.

## Action items

1. [ ] Owner: C17 (working hours per office, acceptable downtime and data loss, who is on call).
2. [ ] Phase 3: logging, the request reference, health endpoints, traces and metrics on the
   walking skeleton.
3. [ ] Phase 15: alerts, runbooks, the operations guide, a recovery rehearsal before go-live.
