# Phase 9 — v3 locked buttons

**Goal:** the four v3 modules show as **locked buttons** in the agreed places. Nothing of the modules themselves is built or ported: no endpoint, no route, no model, no page, no `v3/` folder (D70). Their designs are kept in [V3_VISION.md](../V3_VISION.md) for the v3 review.

**Decisions:** D46, D48 (locked buttons, no switch), D59 (SEMP Plan button place), D64 (place keys), D70 (no port of the v2 module code).

## Locked buttons

| Module | Scope | Place key | Button location |
|---|---|---|---|
| SEMP Plan | Project | `semp_plan` | SEMP overview page, in place of the "Coming soon" card (D59) |
| Stakeholder Awareness | Project | `stakeholder_awareness` | Project sidebar, under "Project support tools" |
| GHG Emissions | Organization | `ghg_emissions` | Main sidebar + mobile menu, under "Organization tools" |
| Environmental Data Collection | Organization | `environmental_data` | Main sidebar + mobile menu, under "Organization tools" |

- One constant `V3_LOCKED_NAV` in `routes/routes.config.js` describes each button: label, Material Symbols icon, location, place key.
- A locked button is **not a link** and has no route: lock icon, "Available in v3", keyboard-focusable, `aria-disabled` + a description. Light and dark mode, desktop and 375 px. AKF tokens only (D49), `components/ui` + `cn()`.
- Every role sees them, the viewer included. No env variable, query flag or role can enable them; enabling = building the module in v3.

## Tests
- The buttons render in each location (main sidebar, mobile menu, project sidebar, SEMP overview), have no `href`, a click does not navigate, and expose the "Available in v3" description.
- The frontend router has no v3 route.
- Backend route table: fails if any v3 path (`/semp-plan`, `/stakeholder-awareness`, `/organization-*`) is mounted.
- `semp_record` files still answer 404 (existing test in `projectFiles.test.js`).

## v3 notes (for when the modules are built)
- **D69:** the SEMP Plan must not prefill its narrative inputs (v2 copies them from the approved Tools 1/2); they start empty.
- The rest of the agreed rules (D46, D47, D64–D66) is in [V3_VISION.md](../V3_VISION.md) → "v3 modules (designs kept from v2)".

## Done when
- [x] Locked buttons visible in the agreed places for every role; not navigable; no v3 route or endpoint.
- [x] `CLAUDE.md` describes the locked buttons, D70, and that there are no `v3/` folders.

## Out of scope
Building, porting or turning on any of the four modules.

## Found during phase
- **Choices made here:** the SEMP Plan card shows on every SEMP overview (the old "Coming soon" banner showed only once Tools 3/4 were open); Stakeholder Awareness also shows in the project variant of the mobile menu, the project sidebar's counterpart below `lg`. The unused `SempCTABanner` was removed.
- **Not fixed (UI polish, phase 10):** at 375 px the long project title overflows: in the project mobile menu it runs past its card, and a fragment of it is drawn over the page heading (seen on the SEMP overview with the demo project). Not caused by this phase.
- **Not fixed (script):** `seed-demo-project.js` on an empty database stops with `400 "value" must contain at least 1 items` on the scores call; it needs `npm run seed` first. The order is right, the error message is not helpful.
- Browser check: throwaway DB `esms_phase9_check` (dropped afterwards), ports 3001/5174 (stopped); 3000/5173 and `esms` untouched.
