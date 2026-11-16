# ADR-008: Identity and sessions — person + identities, OpenID Connect, server-side sessions

**Status:** Proposed — **to confirm with the client's answers (C1, C2)**
**Date:** 2026-11-17
**Deciders:** the owner; the client's IT (identity provider, application registration)
**Draft:** §2.6, §3, §9.1 M8, §9.4 P5–P6 · **Related:** ADR-009, ADR-014, ADR-015, ADR-018,
ADR-023

**In plain words:** staff sign in to ESMS with the account they already use at work, with no ESMS
password. People from outside get an invited local account. Whoever signs in, ESMS itself holds the
session, so access can be ended at once. This also settles the last open model item of the draft:
a user is one person record with one or more ways to sign in.

## Context

- Agreed in the draft: staff use the organisation account only; outside people get a local account
  by email invitation with optional expiry; a first sign-in from the global platform creates a
  person with no access; accounts are deactivated, never deleted; a stand-alone server uses local
  accounts.
- Today: a signed token kept in the browser's storage for 12 hours, readable by any script on the
  page, impossible to revoke (a password change does not end other sessions); bcrypt passwords.
- Staff emails are on `akdn.org`; which identity provider is behind it is not known (C1). How the
  global platform opens other tools is not known (C2).

## Decision

### Model (closes the proposal in draft §2.6)

- **Person:** one row per human being — name, email, home office, language, active or not. All
  history, assignments and notifications point to the person.
- **Identity:** a way that person signs in. Kinds: `oidc` (issuer + the provider's stable subject
  identifier) and `local` (password hash). A person can hold more than one; an identity belongs to
  exactly one person. Linking at first organisation sign-in is by verified email (M8), then by the
  stable subject, never by email again.
- An outside person has a local identity and the flag `external`.

### Organisation sign-in

- **OpenID Connect, authorization-code flow with PKCE, the server as a confidential client.** The
  browser never receives a token from the provider; the server exchanges the code, validates the
  ID token and opens an ESMS session.
- The platform's own OpenID Connect components (ADR-003), not hand-written protocol code. The provider is
  configuration (issuer, client, claim mapping), so any standards-compliant provider works. If the
  client can only offer SAML, the same module gains a SAML driver; nothing above it changes.
- **Multi-factor sign-in is the provider's job** for staff; ESMS can require that the provider
  confirms it (the authentication-context claim) when the client's policy says so.
- **Provisioning on first sign-in:** person created with no access; the office administrators are
  notified (draft §2.6). The home office is taken from a directory claim when one exists (C1),
  otherwise chosen by an administrator.
- **Leavers:** a staff member disabled in the directory can no longer sign in, by construction.
  To also end their ESMS assignments and sessions at once (draft P5), ESMS offers the **standard
  provisioning interface (SCIM 2.0)** that organisation directories use to tell applications about
  people who join, change or leave. It is built in from the start and switched on when the
  client's IT connects it (C1); without it an administrator deactivates the person.

### Local accounts

- Invitation by a signed, single-use, expiring link; the person sets their own password (D91
  rules: 12 characters, common and leaked passwords refused from an offline list).
- Passwords hashed with a memory-hard algorithm (Argon2id). Hashes migrated from v2.5 keep working
  and are re-hashed at the next sign-in (M8).
- Password reset by a single-use link by email; expiry date with a 7-day notice (P6).
- **A second sign-in step (a code from an authenticator app) — kept narrow** (owner,
  2026-11-17: only where it is really needed):
  - staff never meet it in ESMS: their organisation account already carries the organisation's
    own second step;
  - outside readers and other ordinary local accounts: **off**. Their protection is the
    password rules of D91, the limit on attempts, the expiry date and their narrow, read-mostly
    access;
  - **required in one case only: a local account with an administrator role on an installation
    reachable from the internet.** One stolen password there would hand over every user and
    every access right. On the central installation that is at most one emergency account; on
    a country server inside a closed network it is not required;
  - the ability comes with the platform (ADR-003), so a client security team that asks for
    more (C16) gets it by a setting, not by new work.
- Sign-in attempts are rate-limited per account and per address; lockouts are temporary.

### Sessions

- **Server-side sessions** stored in the database: an opaque random identifier in a cookie that
  scripts cannot read (`HttpOnly`, `Secure`, `SameSite=Lax`, host-only). Only a hash of the
  identifier is stored.
- Idle timeout 8 hours (D91), an absolute lifetime, rotation at sign-in and at privilege change.
- **Revocation is immediate:** deactivating a person, changing a password, removing an identity or
  "sign out everywhere" deletes the sessions. A person sees their open sessions in My account.
- Protection against cross-site request forgery: same-site cookie, plus an origin check and a
  token on every state-changing request.
- The v2.5 "session ended" dialog that keeps unsaved changes stays as it is.

### Entry from the global platform (with ADR-015)

A link opens a page of ESMS; if there is no session, the person is sent through organisation
sign-in (silent when they are already signed in there) and lands on the page asked for. Deep links
are ordinary ESMS addresses. **ESMS opens as its own page, not inside a frame of the platform:**
embedding would force the session cookie to be a third-party cookie, which browsers increasingly
block, and would weaken the protections above. If the client insists on embedding (C2), it is a
separate decision with its own risks.

## Options considered

| | A. Token in the browser (today) | **B. Server-side session, direct OpenID Connect** | C. A separate identity broker in front (for example Keycloak) | D. A hosted identity service |
|---|---|---|---|---|
| Immediate revocation | No | Yes | Yes | Yes |
| Token exposed to page scripts | Yes | No | No | No |
| Works in the stand-alone shape, offline | Yes | Yes (local accounts) | Yes, with one more server to run | No |
| Extra component for the client's IT to operate | None | None | A full identity server | A subscription and a data flow outside |
| Several providers, SAML, user federation | No | One or a few providers by configuration; SAML by a driver | Everything, ready-made | Everything |
| Fit to "local accounts for outside people" | Yes | Yes, in our own module | Yes | Yes, their data in a third party |

## Trade-off analysis

A is not acceptable for an enterprise system: no revocation and a token any script can read.
Between B and C the question is whether ESMS needs an identity *product* or an identity *module*.
C brings every protocol and a ready administration console, at the price of a second system with
its own database, upgrades and security surface in both deployment shapes. ESMS's needs are
narrow and already specified (one organisation provider, invited local accounts, sessions), so a module built on the platform's own sign-in components is the smaller and safer whole. The door to C stays open: the
`identity` module is the only place that knows how a person proved who they are. D sends staff and
outside people's personal data to another company and cannot serve the stand-alone shape.

## What would change this decision

- C1: the provider is not standards-based OpenID Connect → SAML driver in the same module.
- C1: several directories (one per agency or country) → several providers in configuration, the
  sign-in page asks for the work email first; if that grows past a few, reconsider option C.
- C2: the platform must embed ESMS in a frame → a separate decision on cookies and framing.

## Consequences

- Easier: one click from the global platform; leavers lose access with their work account; access
  can be cut at once; every history row has one stable person.
- Harder: an application registration and claim mapping to agree with the client's IT; sessions
  add a database read per request (cached per request, negligible at this load).
- To revisit: after C1 and C2.

## Action items

1. [ ] Owner: bring C1 and C2; ask the client's IT for a test tenant or test accounts.
2. [x] Second sign-in step: settled as above with the owner (2026-11-17).
3. [ ] Phase 3: sessions and local accounts on the walking skeleton. Phase 10: organisation
   sign-in, invitations, entry from the platform.
