# ADR-018: Security baseline — a named standard, checked in the pipeline, tested before go-live

**Status:** Proposed — **level to confirm with the client's answer (C16)**
**Date:** 2026-11-17
**Deciders:** the owner; the client's IT or security team (their requirements)
**Draft:** §3, §6.1 · **Related:** ADR-008, ADR-009, ADR-011, ADR-013, ADR-016, ADR-017

**In plain words:** "secure" is turned into a checklist from a recognised standard, most of it
checked automatically on every change, and an outside party tests the system before it opens to
several countries.

## Context

- v2 already has a sound base for its size: every route behind sign-in, named permissions, strict
  response headers, rate limits, validated input, file type checks, no secrets in logs.
- v3 raises the stakes: reachable from the internet, several countries' data in one installation,
  staff identities from the organisation's directory, outside people with accounts.
- The client's own security requirements are not known (C16).

## Decision

1. **Target: OWASP Application Security Verification Standard, level 2** (the level meant for
   applications holding business data and personal data). Each requirement is mapped to a control
   in the code, the pipeline or the hosting; the mapping is a living document reviewed each
   release.
2. **Identity, sessions, access** — ADR-008 and ADR-009: no tokens in the browser, revocable
   sessions, second step where required, one policy module, database row security, the leak test.
3. **Data protection:** TLS 1.2 or later everywhere, including to the database and storage;
   encryption at rest by the managed services; secrets only in the secret store, rotated;
   personal data kept to the minimum (name, work email, home office); backups encrypted and
   access-logged. Data residency per ADR-016.
4. **Input and output:** every request validated against its schema (ADR-004); queries only
   through parameters; output encoding by the interface framework; a strict content security
   policy without inline scripts (kept from v2); uploads per ADR-013 (real type, scan, never
   served from a public address); protection against request forgery (ADR-008); rate limits per
   person, per service account and per address, stored centrally so several instances share them.
5. **Supply chain:** dependencies of both toolchains pinned by lock files, the interface's packages
   installed without running install scripts; a small, reviewed list of third-party packages in
   the server (ADR-003); automated dependency and image vulnerability scans as required pipeline
   jobs; a software bill of materials published with each image; images signed (ADR-006); a
   policy for how fast a critical finding is patched.
6. **Auditability:** ADR-011 — complete, append-only history; administrator actions, access
   changes, sign-ins and service-account calls are critical-action events.
7. **Privacy and retention:** v3 deletes nothing by itself beyond Deleted items (draft §9.7). When
   the client states a policy (C14), retention becomes settings on the history partitions and on
   closed units, and "remove a person's data" becomes a documented administrator procedure that
   replaces the name in the person record while keeping the history's integrity.
8. **Verification:** a threat model written in phase 3 and updated when a module is added;
   security tests in the pipeline (static analysis, the authorization tests, the leak test);
   **an independent penetration test before the first multi-country go-live** and after major
   changes; findings tracked to closure.
9. **Accessibility** is treated with the same seriousness as a compliance item: WCAG 2.1 AA,
   automated checks in the pipeline plus the v2.5 manual checks (D94).

## Options considered

| | A. Good practice as we go (today) | **B. ASVS level 2 as the written baseline** | C. A formal certification programme for the product from day one |
|---|---|---|---|
| A clear answer to "is it secure enough?" | No | Yes, requirement by requirement | Yes, audited |
| Effort | Low | Medium, mostly automated | High, organisational as much as technical |
| Fits what a client's security team asks | Case by case | Maps onto most questionnaires | Fully |
| Right now | Too weak for the internet and several countries | Proportionate | Premature without a client requirement |

## Trade-off analysis

A leaves "enough" undefined, which is uncomfortable exactly when a client's security team starts
asking. C is an organisational commitment that only makes sense if the client requires it (C16);
B is designed to be the technical base such a programme would later build on, so nothing is
wasted if the answer is yes.

## Consequences

- Easier: security questions get documented answers; regressions are caught by the pipeline; the
  client's review has something concrete to read.
- Harder: some requirements cost real work (central rate limits, second step, scanning, the
  mapping document); a penetration test must be planned and paid for.
- To revisit: the level after C16; privacy settings after C14.

## Action items

1. [ ] Owner: C16 (the client's security requirements, any assessment they require before go-live,
   standards they follow) and C14.
2. [ ] Phase 3: threat model, the ASVS mapping, the pipeline scans.
3. [ ] Phase 15: penetration test, findings closed, the security section of the operations guide.
