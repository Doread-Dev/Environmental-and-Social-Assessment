# Phase 15 — Design foundations in code (v2.5)

**Goal:** the app gets the v2.5 design system's layer 1 and the multilingual base that every later
phase builds on: tokens and themes, fonts, SVG icons, English + Arabic with RTL, locale formats, and
error codes from the server. No page is redesigned here.

**Decisions:** D80, D81, D86, D87 (icons), D94 (+ D37, D72).

**Design reference:** [V2_5_CONCEPT.md](../V2_5_CONCEPT.md) "Design system foundations" and the
locale decisions; playground [design/foundations.html](../design/foundations.html) (the single
source of the tokens, between its `@tokens` markers).

**Depends on:** v2.0.x (phase 14). Runs next to phase 17 (backend, another session; this phase does
not touch `backend/src/services/access*`, permissions or project-access code).

## Scope
1. **Tokens:** primitives → semantic tokens (light and dark) → used by components, taken from
   `foundations.html` into the Tailwind 4 theme (CSS variables). One source: a small script or test
   keeps the app tokens equal to the playground's. Old tokens and the `#008c54` palette go (D49
   replaced).
2. **Theme:** light / dark / match my device; the choice is read from the account once phase 19
   stores it (until then from the browser). No flash of the wrong theme on load.
3. **Fonts:** IBM Plex Sans + Plex Sans Arabic at 400/500/600 only (700 dropped from the bundle);
   the type scale with taller Arabic lines; sizes in rem.
4. **Icons:** an `Icon` component that renders SVG paths of the Material Symbols set (bundled,
   offline), only the icons used; the icon box is one text line tall (`1lh`) and sits in a flex row.
   The font ligature spans and their subset step go. `styleGuard.test.js` refuses an icon placed
   inline on the text baseline and any icon font class.
5. **Languages:** an i18n layer (English default, Arabic), message catalogues per language with the
   same keys, `dir`/`lang` on the document, logical CSS properties only (the style guard refuses
   `left/right` margins and paddings in new code), arrows that mirror. The language is read from the
   account once phase 19 stores it.
6. **Locale formats:** one formatter module (`Intl`): `en` and `ar-SY` with Latin digits, Levantine
   months, "9 Nov 2026", 24-hour times, relative times with the full date on hover. Every date and
   number in the app goes through it.
7. **Error codes:** the server answers every error with a stable `code` (the existing
   `STALE_VERSION` and `PASSWORD_CHANGE_REQUIRED` included) and the interface writes the message from
   its catalogue; a server error (500) also returns a **reference code** that the server writes to
   its log with the error. `extractErrorMessage` maps codes to messages (fallback: the server text).
8. **Brand assets:** the Syria map as a light SVG (replaces the 700 KB PNG).
9. **Docs:** `docs/style-guide.md` becomes the v2.5 design system guide (tokens, type, icons,
   languages), linking the concept and the playgrounds.

## Tests
- Tokens: the app's token values equal the ones in `foundations.html` (light and dark).
- Theme: the three choices apply; "match my device" follows `prefers-color-scheme`.
- Fonts: no weight 700 in the bundle; no request to Google Fonts (existing test kept).
- Icons: every icon name used in `src/` exists in the SVG set; the icon box equals the line height
  (component test); the style guard catches an inline baseline icon and an icon font class.
- Languages: switching to Arabic sets `dir="rtl"` and `lang="ar"`; every key exists in both
  catalogues (a test lists missing keys); the style guard refuses physical `left/right` spacing in
  new files.
- Formats: `ar-SY` dates use Latin digits and Levantine month names; English "9 Nov 2026".
- Error codes: each error response has a `code` (backend route-table style test over the error
  handler and validators); a 500 returns a reference code that appears in the log line; the frontend
  shows the catalogue message for a known code in both languages.
- Docs: `backend/tests/docs.test.js` passes.

## Done when
- [ ] Every item under Tests has a test (file names listed in Result).
- [ ] `npm test`, `npm run lint`, `npm run format:check` in each app touched; frontend `npm run build`;
      E2E run; coverage floors raised.
- [ ] Screens still work in both languages and both themes (the old layouts, now on the new tokens);
      the visible differences are listed for the owner.

## Found during phase
