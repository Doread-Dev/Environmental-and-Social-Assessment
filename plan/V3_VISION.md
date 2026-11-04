# v3 — Vision notes (not a spec)

**What this is:** a reminder list kept during v2, so that nothing gets lost. It is **not** a source of truth and nothing here is decided. When v3 starts, the owner and Claude hold a long, deep review of the whole system (what is weak, what to improve, what to restructure), and that review produces the v3 decisions. Add to this file whenever v2 work turns up something for v3.

**Owner's intent (2026-11-04):**
- v3 is a full restructure toward an **enterprise-level** architecture: built right inside, wider and sturdier.
- Large architecture changes are expected and accepted.
- The client has also asked for features that are not disclosed yet. They are planned for v3 and will shape the structure too.

## Where v2 stands (assessment at the review of phase 7)
**A solid base for a small-to-medium internal app, not enterprise-level.**
- **Strengths:** clear layering; workflow rules on the backend from one source (`computeWorkflow`); consistent validation and API shape; backend tests about 95%; CI.
- **Limits:** listed below as v3 topics.

## Topics for the v3 review

### Access & identity
- **Per-user capabilities instead of fixed roles.** What each person works on, sees and does is set per person (or per group), not by six hard-coded roles.
- **Project membership / scoped access.** For example, a viewer who sees only project X, or a team that works only on its own projects. D66 already routes every project access through one check and every route through named permissions, so this can be added behind those seams.
- **Sessions:**
  - Today: JWT in `localStorage`, no revocation (a password change does not end other sessions), no refresh tokens.
  - Consider server-side sessions or short-lived tokens with refresh and revocation.
- **Single sign-on:** Active Directory / LDAP or SSO for an institutional server.
- **Organisation structure:** branches, offices or regions, if the client needs them; possibly multi-organisation.

### Records & history
- **Full activity log:** field-level changes for every write, project history for the roles allowed to see the project. It builds on the v2 critical-actions log entries (D65).
- **Versioning and revisions of documents:** an approved screening or assessment can't be reopened today and has no revisions. The SEMP Plan design (D46) already has a revision history.
- **Configurable workflows:** multi-level approval, or a different path per project type or category. Today the workflow is linear and in code.

### Configuration
- **Admin-managed lookups:** impact questions, indicators, categories and job titles are seeded today and not editable in the app.
- Annex/library places are code by design (D64). Revisit if v3 makes pages configurable.

### Data & reliability
- **Data integrity:**
  - Today: standalone MongoDB with no transactions; phase 11 adds a single-node replica set and transactions for bulk saves and audit entries.
  - Review whether the domain, which is relational by nature (projects → tools → rows, users, permissions, audit), fits a relational database better. A question for the review, not a plan.
- **Observability:** structured logs, error tracking and health/metrics beyond `GET /health`.
- **Backups and restore**, beyond phase 11's daily dump, if the client needs more.

### Product & quality
- **v3 modules ported locked in v2 (D48):** SEMP Plan, Stakeholder Awareness, GHG Emissions, Environmental Data Collection.
- **Client-requested features:** not disclosed yet; the owner brings them to the v3 review.
- **Frontend test coverage:** about 34% after phase 7.
- **Office file preview:** server-side conversion (D64 left it out).

## Prepared in v2 for v3
- D65: one audit writer and a forward-compatible entry shape.
- D66: one project-access check and `requirePermission` on every route.
- D64: places by stable key, including v3 and organisation-level places.
- D48: v3 modules ported as dead code, ready to switch on.
