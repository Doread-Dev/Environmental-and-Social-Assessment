# Phase 26 — Release readiness (v2.5.0)

**Goal:** ship v2.5.0 as cleanly as v2.0.0: every page checked in both languages, both themes and
three widths, the user guide updated for the new screens in English and Arabic, the docs true to
the code, and the version visible.

**Decisions:** D94, D80, D78 (guide), D77 (release practice).

**Depends on:** 21, 22, 23, 24, 25.

## Scope
1. **Full UI audit of the app:** an automated pass over every route (Playwright: both languages,
   both themes, phone / tablet / laptop): accessibility (axe, WCAG 2.1 AA), contrast, icons on the
   text line, nothing clipped or overlapping, no horizontal scroll; findings fixed with a test or
   brought to the owner. The [findings list](ui-findings.md) is empty or each remaining item has an
   owner decision.
2. **Performance:** bundle size per route, first load on the server's network, no request loops;
   numbers recorded.
3. **User guide:** both languages rewritten for the v2.5 screens (same parts and permission tags),
   in-app Help checked page by page.
4. **Docs:** `docs/` checked item by item against the code (style guide = the v2.5 design system),
   `CLAUDE.md`, `deploy/` (new env vars, the daily Deleted-items job).
5. **Version 2.5.0** in the three `package.json` files, `GET /health`, the app, `CHANGELOG.md`
   (contents, changes from 2.0, known limits), the release archive name.
6. **Clean folder:** components and pages the redesign replaced are gone; no dead code.

## Tests
- The route audit runs in CI (E2E job) and passes.
- Every E2E flow passes in English and Arabic.
- Version: `/health` and the three `package.json` files agree with `CHANGELOG.md`.
- Guide: both languages have the same section ids; every page's Help opens an existing section.
- Docs: `backend/tests/docs.test.js` passes.

## Done when
- [ ] Every item under Tests has a test (file names listed in Result).
- [ ] All apps: tests, lint, Prettier, build; E2E; `node deploy/build-release.mjs`; coverage floors
      raised.
- [ ] The owner has walked the release build.

## Found during phase
