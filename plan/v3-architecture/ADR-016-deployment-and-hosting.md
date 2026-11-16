# ADR-016: Deployment and hosting — one container image, managed services centrally, a compose bundle stand-alone

**Status:** Proposed — **to confirm with the client's answers (C3, C4)**
**Date:** 2026-11-17
**Deciders:** the owner; the client's IT (where and on what it runs)
**Draft:** §6, §6.1 · **Related:** ADR-001, ADR-002, ADR-006, ADR-013, ADR-017, ADR-018

**In plain words:** ESMS is delivered as one sealed package that runs the same way everywhere. For
the central, online installation the recommendation is the client's own cloud account with the
database and file storage as managed services (the provider keeps them running and backed up). A
country that must keep its data inside can run the very same package on one machine.

## Context

- Agreed: one product, two shapes; online first; the client's choice which shape each country
  uses; an office can move from stand-alone to central.
- Not known: which cloud or servers the client's IT runs, whether containers are allowed, where
  data may live (C3, C4).
- Today: a zip with Node and the built interface, installed by PowerShell or bash scripts as a
  service beside MongoDB, behind IIS or nginx, with a nightly dump to a second disk. Two operating
  systems are supported equally; only the Windows path was run on a real machine.
- Maintaining two native install paths plus a cloud path would be three products to test.

## Decision

1. **One artefact: a signed OCI container image** (ADR-006) that runs as `api`, `worker` or
   `migrate` by its start command. Configuration only through the environment; secrets from the
   host's secret store, never in the image or the repository.
2. **Central shape — in the client's cloud tenancy** (their account, their region, their
   policies), built from managed services:

   | Need | Managed service of the kind |
   |---|---|
   | Run `api` (two or more) and `worker` | a container service with rolling updates and health checks |
   | Database | managed PostgreSQL with high availability and point-in-time restore |
   | Files | object storage with versioning |
   | Entry | load balancer / web application firewall terminating TLS |
   | Secrets | the cloud's secret store |
   | Logs, metrics, traces | the cloud's monitoring, through open standards (ADR-017) |
   | Sign-in, mail | the organisation's identity provider and mail service |

   Every major cloud offers each row; the ADR names kinds, not products, until C3 and C4 answer.
   The whole environment is described as **infrastructure code** in the repository, so staging is
   a true copy of production and a region can be rebuilt.
3. **If the client hosts on their own servers instead:** the same image on their container
   platform, or under Docker Compose on Linux virtual machines, with PostgreSQL run by their
   database team. Nothing in the application changes.
4. **Stand-alone shape:** a **compose bundle** for one Linux machine: `api`, `worker`,
   PostgreSQL, a reverse proxy with the certificate, the filesystem file driver, a backup job to a
   second disk, and an offline installer that loads the images from a file. A Windows-only site
   runs it in a Linux virtual machine. The v2 native install scripts are not carried over.
5. **Releases:** `migrate` runs first; migrations are written to be compatible with the previous
   release, so `api` instances are replaced one by one without downtime and a rollback is the
   previous image. Changes that cannot be compatible are split over two releases.
6. **Environments:** development (compose on a laptop), staging (same shape as production; holds
   the migration rehearsals with copies of real data under the client's rules), production. A
   central installation per region if residency rules demand it (system overview §8).
7. **Backups and recovery (targets in ADR-017):** the managed database's continuous backup plus
   a daily logical dump kept in another location; object storage versioning; a restore rehearsal
   on a schedule, as v2's `test-backup-restore` does today.

## Options considered

| | A. Native install scripts (today) | **B. Container image + managed services / compose** | C. A platform-as-a-service outside the client's tenancy | D. Kubernetes as the required base |
|---|---|---|---|---|
| Same artefact tested and installed | No (built per machine) | Yes | Yes | Yes |
| Both shapes from one build | Two script sets | Yes | No stand-alone | Heavy for one machine |
| Data under the client's control | Yes | Yes | Depends on the provider's regions and terms | Yes |
| Effort for the client's IT | Runs our scripts | Standard for any modern IT | Least | Highest unless they already run it |
| High availability, restore to a point in time | Hand-made | From the managed services | Yes | Hand-made or managed |
| Fits a Windows-only IT | Yes | Cloud: yes. Stand-alone: needs a Linux VM | Yes | Rarely |

## Trade-off analysis

A served one server in one country well. For a global, online product it means building our own
availability, backups and updates on machines we do not control, twice (Windows and Linux). C is
the least work but places an NGO's project data and staff accounts with a company the client did
not choose; the hosting must be the client's. D is a good base *if the client already runs it*
(the image runs there unchanged), but requiring it would impose a platform team on them.

B's one real loss is the native Windows install. It is accepted because the stand-alone shape is
"possible, not the design target" (draft §6) and a Linux virtual machine is a small ask next to
the cost of a second packaging forever.

## What would change this decision

- C3: containers are not allowed anywhere → the `api` and `worker` run as system services from the
  same build output; managed database and storage stay. A larger, slower path; said plainly to the
  client as a cost.
- C3 names their cloud → the table above is filled with that cloud's services and the
  infrastructure code is written for it.
- C4: several countries require data inside → several regional or stand-alone installations; no
  code change.

## Consequences

- Easier: one thing to test; updates without downtime; recovery handled by services built for it;
  the client's IT sees a standard workload.
- Harder: cloud running costs (accepted by the owner); infrastructure code to maintain; Syria's
  move changes its hosting as well as its software, unless it stays stand-alone.
- To revisit: after C3 and C4.

## Action items

1. [ ] Owner: C3 and C4; ask who in the client's IT would own the cloud account and the database.
2. [ ] Phase 3: image, compose for development, staging environment as infrastructure code.
3. [ ] Phase 14: the stand-alone bundle and its offline installer. Phase 15: release runbook and
   deployment checklist.
