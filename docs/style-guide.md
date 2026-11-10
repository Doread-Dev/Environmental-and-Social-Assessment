# Style guide

The UI rules of ESMS v2, binding for every frontend change. A full design system comes with v3
([D77 2](../plan/DECISIONS.md); its starting list is
[phase 13](../plan/phases/13-page-by-page-ui-review.md)). These rules merge the old
`frontend/docs/STYLE_GUIDE.md` (Arabic, January 2026; translated here, with what the code has
since changed) and the style rules that were in `CLAUDE.md`. Where the old guide and the code
disagree, the code and this page win.

`frontend/src/test/styleGuard.test.js` enforces the hard rules below; a violation fails `npm test`.

## Principles

- **Reuse, never restyle by hand (D71, phase 10):** one shared component for each kind of control.
  Import from `@/components/ui`; do not create a new primitive when one exists.
- **Tokens only:** colours come from the design tokens in `frontend/src/index.css` (`@theme`).
  No hard-coded colours (`#xxx`, `rgb()`), no invented arbitrary values.
- **Light and dark mode:** every UI change must work in both.
- **English UI only** (DECISIONS context). Arabic appears only as user data (and is shown with the
  Arabic font and, in exports, right-to-left).
- Merge classes with `cn()` from `@/utils/cn`.

## Shared components (`@/components/ui`)

| Need | Use |
|---|---|
| Any button | `Button` — variants `primary` / `secondary` / `outline` / `ghost` / `danger`; sizes `sm` / `md` / `lg`; `isLoading`, `leftIcon` |
| Text input, select, textarea, checkbox | `Input`, `Select`, `Textarea`, `Checkbox` (share `components/ui/formControl.js`: size md = `h-10 text-sm`, like Button md; `variant="cell"` inside table cells; `readOnly` look). `Input` / `Textarea` default to `maxLength` 30,000 (`utils/textLimits.js`, D74 4) |
| Select box | **`Select` is the only select box** (native `<select>` underneath; `options` or `<option>/<optgroup>` children; optional `placeholder` with value `""`). A raw `<select>` fails the style guard |
| Status of anything | `StatusBadge` (steps, records, projects, `archived`; labels and variants in `utils/statusBadges.js`) on top of `Badge` |
| Loading / empty / error | `LoadingState`, `EmptyState`, `ErrorState` (`onRetry` → "Try again") |
| Confirmations | `ConfirmDialog` — **never** `window.confirm` / `alert` / `prompt` (the guard's allow-list is empty) |
| Dialog | `Modal` (focus moves in and back; Escape via `useOverlay`, only the topmost overlay closes) |
| Page title block | `PageHeader` (the page `h1` + description + actions) |
| Notifications | `useToast` (from `components/ui/useToast.js`) |
| Others | `Card` (`Card.Header/Body/Footer`), `Alert`, `Table`, `Pagination`, `Tooltip`, `SidePanel`, `StickyFooter`, `Icon`, `LoadingSpinner`, … |

Brand mark: `components/layout/BrandLogo` (cropped AKF emblem + "ESMS System / Aga Khan
Foundation – Syria"); use it for any new brand spot.

## Colour tokens

Defined in `frontend/src/index.css`. Main values (light / dark):

| Token | Value | Use |
|---|---|---|
| `primary` | `#008c54` (hover `#006f42`) | AKF green (D49); `text-primary`, `bg-primary` |
| `primary-soft` / `primary-border` | `#e8f6ef` / `#b8e1cc` | soft highlight background / border |
| `background` / `background-dark` | `#f7fbf8` / `#0b2419` | page; also subtle panels, table heads, read-only fields |
| `surface` / `surface-dark` | `#ffffff` / `#113523` | cards and containers |
| `card-dark` | `#0e2c1d` | nested cards in dark mode |
| `text-main` / `text-secondary` / `text-disabled` | `#111813` / `#5b7969` / `#9ca3af` | text |
| `border-default` / `border-dark` | `#c9e6d7` / `#264d38` | borders and inputs |
| `success` / `warning` / `error` / `info` | `#008c54` / `#f59e0b` / `#ef4444` / `#3b82f6` | semantic states |
| `green-50 … green-950` | AKF scale from `#00ab67` | institutional green scale |
| `risk-a … risk-f` (`-bg`, `-text`) | | screening category badges |

### Classes to use

| Purpose | Light | Dark |
|---|---|---|
| Page | `bg-background` | `dark:bg-background-dark` |
| Card / container | `bg-surface` | `dark:bg-surface-dark` (nested: `dark:bg-card-dark`) |
| Subtle panel, table head, read-only field | `bg-background` | `dark:bg-white/5` |
| Track (progress bars) | `bg-border-default` | `dark:bg-border-dark` |
| Main text | `text-text-main` | `dark:text-white` |
| Secondary text | `text-text-secondary` | `dark:text-gray-400` |
| Disabled text | `text-text-disabled` | `dark:text-gray-500` |
| Border | `border-border-default` | `dark:border-border-dark` |

### Forbidden (style guard)

- `dark:bg-gray-800/900/700`, `border-gray-200`, `dark:border-gray-700`, `bg-gray-100`.
- Arbitrary hex such as `bg-[#1a1a1a]`, `text-[#888]`, `dark:bg-[#152a1d]` (the old guide's card
  colour; use `dark:bg-card-dark`).
- Light-mode `gray-*`, `slate`, `zinc`, `neutral`, `stone`, `bg-white`, `bg-black`, emerald and teal
  (the old guide allowed `bg-white` and `bg-gray-50/50`: use `bg-surface` and `bg-background`).
  In dark mode the only gray classes are the text shades `dark:text-gray-200 … 500`.
- A raw `<select>`, `window.confirm` / `confirm(`, `toLocale*String` outside
  `utils/formatters.js`, and Material icon spans without `aria-hidden`.

## Typography

- **Font (D71, D72):** IBM Plex Sans, with IBM Plex Sans Arabic for Arabic text, self-hosted:
  `src/fonts.js` imports the `@fontsource` files (exact versions; weights 400/500/600/700; Latin,
  Latin extended, Arabic); `--font-sans` in `@theme` names both families. Nothing loads from
  Google Fonts, a CDN or any remote URL (`src/test/fonts.test.js`, `src/test/offline.test.js`).
- Weights: only `font-normal`, `font-medium`, `font-semibold`, `font-bold` (no other weight is
  loaded).
- Sizes in `components/ui/typography.js`: `PAGE_TITLE` (`text-2xl md:text-3xl font-bold`, the
  page `h1`; `PageHeader` uses it), `PAGE_DESCRIPTION`, `SECTION_TITLE` (`text-lg font-bold`); body
  `text-sm`; labels and small print `text-xs`.

## Icons

Material Symbols only, self-hosted (phase 11: `material-symbols/outlined.css`, the variable font,
so `FILL` and weights work). Write `<span className="material-symbols-outlined" aria-hidden="true">name</span>`
or `<Icon name="…" />`. The ligature text is never an accessible name: an icon-only button needs
`aria-label`. Sizes: `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`.

The production build ships a **subset** of the font with only the icons named in `src/` (phase 12a,
`frontend/scripts/iconFont.js`: ~170 kB instead of ~4 MB, all axes kept). So write icon names as
literals in the source — in the JSX, `<Icon name="…">`, or a config map (`icon: '…'`) — never build
them from strings at run time or take them from the API, or the icon is missing from the build.
`src/test/iconFont.test.js` fails when a used name is not in the subset or is not an icon.

## Dates

One format on screen: `formatDate` → "5 Nov 2026", `formatDateTime` → "5 Nov 2026, 14:30",
`formatDateRange` → "… – …" (`utils/formatters.js`). Never `toLocale*String` elsewhere. Excel
exports keep their own formats (`utils/excelExport/excelBase.js`).

## Shapes, spacing, states (from the old guide, still the norm)

| | Classes |
|---|---|
| Radius | card `rounded-xl`; button, input, icon tile `rounded-lg`; small badge `rounded-full` |
| Shadow | card `shadow-sm`; raised card `shadow-md`; primary button `shadow-primary` token; sticky footer `shadow-lg` |
| Padding | card body `p-6`; card header `px-6 py-4`; main container `p-4 sm:p-6 lg:p-8` |
| Gaps | between sections `gap-8`; inside a section `gap-6`; between items `gap-4`; icon and text `gap-2` |
| Transitions | `transition-colors` (or `transition-all`), `duration-200` |
| Focus | `focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary` (the shared controls already do this) |
| Disabled | `disabled:opacity-50 disabled:cursor-not-allowed` |

## Review checklist (before a commit)

- No hard-coded colours; only tokens; dark mode checked.
- Shared components from `@/components/ui`; `cn()` for class merging.
- No forbidden class; `npm test` (style guard) passes; Prettier: no semicolons, single quotes,
  2 spaces, width 100, trailing commas es5, LF.
