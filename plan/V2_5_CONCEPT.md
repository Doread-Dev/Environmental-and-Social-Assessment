# v2.5 — Design concept (working notes)

**What this is:** the working notes of the v2.5 design discussion between the owner and the main chat. Nothing here is a decision until it is recorded in [DECISIONS.md](DECISIONS.md). Started 2026-11-10.

## Where v2.5 sits
- **v2.0.x:** delivered; goes to the Syria IT server.
- **v2.5:** the Syrian version, rebuilt on a new enterprise-grade design system, on the same Syria server. Same backend structure, small backend changes only where the design needs them (for example error codes for a multilingual interface).
- **v3:** the global version (other AKF offices, entry from AKF's global platform) and the structural rebuild. Notes in [V3_VISION.md](V3_VISION.md) ("Global use"). v3 reuses the v2.5 design system as it is.

## Agreed in the discussion so far (owner, 2026-11-10)
- **Every page is redesigned from scratch** (D79); the current layout is not a base.
- **Design decisions are made by the main chat as the design lead**, each with its reason; the owner reviews. The owner answers questions about the client's work, not design taste.
- **Design system in layers:** 1 foundations (tokens: colour, type, spacing, elevation, motion, light/dark), 2 components, 3 patterns — built now and meant to last into v3 (layer 3 may still change). 4 the app shell and navigation, 5 page layouts — designed for Syria, with room for a country/office context from day one, so navigation is not drawn twice.
- **Global-ready from day one:** a multilingual interface (English + Arabic shipped in v2.5, RTL mirroring; other languages added later without design changes; **English is the default** — the client's staff all read English — and each user can switch to Arabic), locale formats for dates and numbers, a context slot ("AKF Syria") in the shell. Head-office views across countries are allowed by the structure, not built.
- **Devices:** laptop first; phone and tablet must work well.
- **Look:** close to AKF's own look and colours, but our own system. ESMS links to AKF's global platform; it does not become part of it.
- **The four locked modules** (SEMP Plan, Stakeholder Awareness, GHG Emissions, Environmental Data Collection) are built in v2.5, **after** the design system and all existing pages are rebuilt, as the test of how well the design system supports building something new.
- **In-app notifications** in v2.5 (something waits for your review, your submission was approved or rejected), with a place in the shell. Email only if the Syria server can send mail (a question for IT); it can be added later on the same events.
- **Help:** placement decided in the shell step (the sidebar item felt wrong to the owner; the floating button seemed fine but is not settled). Note: the Help guide and the Guidance panel (library documents for a page) are both "help with this page" for the user.

## Users and tasks (inferred; the owner confirmed 1–4 and 6–7)
No access to real users yet (the system is new to them), so priorities are inferred and checked with the owner.

| Person | Roles today | Main tasks | How often |
|---|---|---|---|
| **Preparer** | Environmental Focal Point, Project Manager (others can too) | create a project; fill Tools 1–5; submit; fix after a rejection; quarterly monitoring; upload documents; export | daily during a project; monitoring every quarter |
| **Reviewer** | Environmental Specialist (one or two for all of Syria) | review what is waiting; approve or reject with recommendations; also authors; manages the library; archives/deletes | whenever something is submitted |
| **Overseer** | Program Manager (inferred, owner unsure) | follow where each project stands; spot what is stuck; export for reporting | weekly |
| **Reader** | Viewer: internal management, **or a third party** (agent, partner) | read projects; possibly download | occasional |
| **Administrator** | Admin | users and access, activity log, purge | rare |

- Recurring work is dominated by **quarterly monitoring** (Tool 5) over a project's life; screening and assessment happen once per project.
- Scale for Syria: **tens** of active projects, not hundreds.
- **Exports matter:** the Excel goes outside (management, donors, head office), into reports, and for approvals. Export must be visible, not hidden.
- **A third-party reader must see only their own projects** (owner: this is the point of the viewer role). Today every viewer sees every project.

### Design principles drawn from this (draft)
1. **Home = "what needs me now"**, per person: the reviewer's waiting list, the preparer's projects and next steps (rejections with their reasons first), the overseer's status across projects.
2. **Inside a project, the workflow is the spine:** the five tools in order, each with its state; the next step is always obvious.
3. **One primary action per screen state** (save, submit, approve); secondary actions grouped, never scattered.
4. **Export is first-class** on the project and on each tool.
5. **Long tables are working surfaces:** dense, keyboard-friendly, with a save bar that never covers content.
6. **Access-aware:** the interface shows only what the person may see; a restricted reader never sees other projects, even as names or counts.
7. **Global-ready** (see above) and **laptop first, responsive**.
8. **Design for variation:** where v3 may change the shape (the list of workflow steps, scope levels, languages, roles, activities inside a project — see V3_VISION "Activities"), patterns are generic and fed by the backend (a "workflow step" pattern, not five hand-made tool pages), so v3 changes the structure underneath without a redesign. In particular, the **"workflow unit"** (a thing that goes through Tools 1–5 with its own states) is one pattern: in v2.5 it is the project; in v3 a project is a workflow unit **and** holds activities, each a workflow unit of its own (a mini-project). The project area is laid out so an "activities" level can be added without redrawing it.

## Standing rule (owner, 2026-11-10)
**Enterprise level, always:** structure, backend and design are built the proper way from the foundation; no quick patches.

## Access model in v2.5 (agreed by the owner, 2026-11-10)
The owner rejected a "project-scoped viewer" patch: the real need is per-person access (which projects each focal point, project manager, program manager or third party sees, edits, approves, exports). Proposal — the standard enterprise model, built in v2.5 because the need exists in Syria now, it shapes every page, and it does not depend on the unknown v3 facts (countries, hosting, sign-in):
- **Permission:** the smallest action (view a project, edit Tool 5, approve a screening, export, manage users).
- **Role:** a named bundle of permissions, **managed by the admin in Settings** (the six hard-coded roles become editable starting roles).
- **Scope:** where a role applies. v2.5 levels: **organisation → project**. v3 adds country / office above them without changing the model.
- **No programme record** (owner correction): programmes exist in the client's organisation, but nobody asked for them in the platform. A programme manager is simply assigned to their projects (or to the organisation). If the client asks for programmes later, a programme becomes one more scope level.
- **Assignment:** person + role + scope (for example: Focal Point on projects A and B; Reviewer on the whole organisation; Reader on project C only, without export). A person's access is the union of their assignments. Teams/groups can be added later on the same model.
- **No per-person permission checkboxes:** with many people and permissions nobody can tell who may do what; a different need gets its own role.
- Every access change is logged (D65). The backend seams from phase 7a (one project-access check, named permissions, D66) are where it plugs in.

- **Third-party readers download by default** (owner); if the client asks otherwise, the admin removes the export permission from that role in Settings — a setting, not a code change.

## Open questions
- Programme Manager: oversee only, or also fill tools? (Owner unsure; the home adapts to the person's assignments either way.)

## Next steps
1. Close the open questions above.
2. App shell: sidebar, header, project navigation, context slot, Help — options compared with the owner on screen (playground), decision with reasons.
3. Page by page: priorities and layout.
4. Design system: foundations → components → patterns.
5. Record the outcome as decisions (DECISIONS.md), write the v2.5 phase files, and rename the "phase 13" references in CLAUDE.md and plan/ in the same change.
