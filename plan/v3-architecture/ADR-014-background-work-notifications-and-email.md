# ADR-014: Background work, notifications and email — an outbox and a job queue in the database

**Status:** Proposed — **mail service to confirm with the client's answer (C7)**
**Date:** 2026-11-17
**Deciders:** the owner; the client's IT (mail service)
**Draft:** §2.6, §6.1, §9.4 P6 · **Related:** ADR-002, ADR-011, ADR-013, ADR-015

**In plain words:** some work should not make a person wait or should happen later: sending
emails, building big exports, scanning files, clearing deleted items after 30 days. v3 does this
with a small waiting-list kept inside the same database, so an email about an approval is never
sent for an approval that did not happen, and never lost for one that did.

## Context

- Agreed: the D90 notification events also go by email, with a per-person switch; reset links and
  invitations by email; external accounts expire with a 7-day notice; deleted items are removed
  after 30 days; no time-based reminders for monitoring.
- Draft constraint: the core work never fails because an online service is down.
- Today there is no background work at all: everything happens inside the request.
- Whether and how the server may send mail is an open IT item since v2 (C7).

## Decision

1. **Transactional outbox.** The critical-action events of ADR-011 are written in the same
   transaction as the action. A dispatcher in the `worker` reads new events and turns each into
   jobs (in-app notification rows, emails, integration deliveries). Because the event commits with
   the action, the two can never disagree.
2. **Job queue in PostgreSQL** (a maintained queue library on the database, workers claim jobs
   with `SKIP LOCKED`): retries with back-off, a dead-letter state an administrator can see and
   retry, scheduled and recurring jobs, one job at a time per key where order matters.
3. **Jobs are idempotent** (safe to run twice): each carries the id of the event or object it
   serves, and the effect is recorded against that id.
4. **What runs in the worker:** notification fan-out, email, file scans and image processing
   (ADR-013), large exports (ADR-022), the purge of deleted items, the expiry of external accounts
   and its notice, integration deliveries and imports (ADR-015), office export/import, history
   partition maintenance.
5. **Notifications:** one `notifications` module renders an event into an in-app row and, when
   the person has not switched it off, an email, in the person's language, from templates. The
   bell reads a count by a light request at an interval and on focus; a push channel can replace
   that later without touching the rest.
6. **Email behind an interface with drivers:** standard mail submission (SMTP with TLS and
   authentication) as the default driver; a driver for the client's mail service's own interface
   if their IT prefers it (C7). When no mail service is configured (a stand-alone server), email
   jobs are simply not created and the interface says that notifications are in-app only.
7. **A failing outside service only delays its own jobs.** The save that produced the event has
   already committed.

## Options considered

| | A. Do it in the request (today) | **B. Outbox + queue in PostgreSQL** | C. A separate queue server (for example Redis-based) | D. A message broker or the cloud's queue service |
|---|---|---|---|---|
| Event and action commit together | n/a | Yes (same transaction) | No: two systems, needs an outbox anyway | No: needs an outbox anyway |
| Extra system in both shapes | No | No | Yes | Yes; the stand-alone shape has none |
| Throughput | n/a | Thousands of jobs a minute — far above need | Higher | Highest |
| A mail outage affects the person's save | Yes | No | No | No |
| Portability if ADR-002 moves to SQL Server | n/a | The queue moves to option C or D | Unchanged | Unchanged |

## Trade-off analysis

The need is modest (hundreds of jobs an hour at the planned size) and the requirement is strict
(no lost or phantom notification). C and D are built for volume this system will not reach; both
would still need the outbox to be correct, and both add a server to operate in the central shape
and to bundle in the stand-alone one. B meets the requirement with the database already there. Its
known ceiling is far away, and the queue sits behind an interface so a later move is a driver
change. The one dependency to remember is on ADR-002: if the client requires SQL Server, the
queue moves to C or D.

## Consequences

- Easier: saves stay fast; mail or scanner trouble never blocks work; every background failure is
  visible and retryable in one place.
- Harder: a second process role to run and watch; every job must be written to be repeatable.
- To revisit: live push for notifications, if polling proves too slow for people.

## Action items

1. [ ] Owner: C7 (may the server send mail, through which service, from which address).
2. [ ] Phase 3: outbox, queue, the worker role, the administrator's jobs view.
3. [ ] Phase 10: email templates in both languages, invitations, reset links, expiry notices.
