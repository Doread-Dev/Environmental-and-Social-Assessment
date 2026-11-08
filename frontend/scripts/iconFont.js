/**
 * Material Symbols subset (phase 12a, D37). The `material-symbols` package ships the whole
 * Outlined variable font (~4 MB, every icon). At build time this module keeps only the icons the
 * app names in `src/`, with all four variation axes (FILL, GRAD, opsz, wght), so the browser loads
 * ~170 kB instead. Everything runs locally from node_modules (HarfBuzz as WebAssembly): no network.
 *
 * Which icons: every word in the app's source files (`[a-z0-9_]+`, test files excluded) that the
 * font draws as one icon glyph. That covers the ligature text in JSX, `<Icon name="…">`, and the
 * names in config and lookup maps (`icon: '…'`); no icon name comes from the API. Ordinary words
 * that happen to be icon names ("search", "description") are kept too, which costs a few kB and
 * never loses an icon.
 *
 * How: the font maps each icon to a private-use code point as well as to its ligature. The subset
 * keeps the letters, digits and "_" plus the code points of the wanted icons, without layout
 * closure, so only the ligatures of those icons survive (HarfBuzz drops the others).
 *
 * vite.config.js uses `materialSymbolsSubset()` for `vite build`; `npm run dev` and the tests use the
 * full font. `src/test/iconFont.test.js` checks the result.
 */
import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as hb from 'harfbuzzjs'
import fontverter from 'fontverter'
import subsetFont from 'subset-font'

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const SRC_DIR = path.join(frontendDir, 'src')
export const PACKAGE_DIR = path.join(frontendDir, 'node_modules', 'material-symbols')
export const FONT_FILE = 'material-symbols-outlined.woff2'
export const CSS_FILE = 'outlined.css'

// The characters icon names are made of: kept so the ligatures still form
const LIGATURE_CHARACTERS = 'abcdefghijklmnopqrstuvwxyz0123456789_ '
const PRIVATE_USE_START = 0xe000

/** The app's source files that ship (no tests, no test helpers). */
export function sourceFiles(dir = SRC_DIR) {
  const files = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name !== 'test') files.push(...sourceFiles(full))
    } else if (/\.(js|jsx)$/.test(entry.name) && !/\.test\.(js|jsx)$/.test(entry.name)) {
      files.push(full)
    }
  }
  return files
}

/** Every lower-case word in the given files (icon name candidates). */
export function candidateWords(files = sourceFiles()) {
  const words = new Set()
  for (const file of files) {
    for (const [word] of fs.readFileSync(file, 'utf8').matchAll(/[a-z0-9_]+/g)) words.add(word)
  }
  return words
}

/**
 * Opens a font for shaping.
 * @param {Uint8Array} woff2
 * @returns {Promise<{ face: Object, iconGlyph: (name: string) => number|null }>}
 */
export async function openFont(woff2) {
  const sfnt = await fontverter.convert(Buffer.from(woff2), 'sfnt')
  const face = new hb.Face(new hb.Blob(sfnt))
  const font = new hb.Font(face)
  const glyphs = (text) => {
    const buffer = new hb.Buffer()
    buffer.addText(text)
    buffer.guessSegmentProperties()
    hb.shape(font, buffer)
    return buffer.getGlyphInfos().map((info) => info.codepoint)
  }
  return {
    face,
    font,
    glyphs,
    // The glyph of an icon name, or null when the font spells the word with letters
    iconGlyph(name) {
      const shaped = glyphs(name)
      return shaped.length === 1 && shaped[0] !== 0 && name.length > 1 ? shaped[0] : null
    },
  }
}

/**
 * The subset of the icon font with the icons named in `words`.
 * @param {Uint8Array} woff2 - the full font
 * @param {Iterable<string>} words - icon name candidates
 * @returns {Promise<{ woff2: Buffer, icons: string[] }>} the subset and the icon names it keeps
 */
export async function subsetIcons(woff2, words) {
  const full = await openFont(woff2)
  const codePointOf = new Map()
  // Copied first: the array is a view on HarfBuzz memory, which shaping may move
  for (const codePoint of Array.from(full.face.collectUnicodes())) {
    if (codePoint < PRIVATE_USE_START) continue
    const [glyph] = full.glyphs(String.fromCodePoint(codePoint))
    if (!codePointOf.has(glyph)) codePointOf.set(glyph, codePoint)
  }
  const icons = []
  const codePoints = new Set()
  for (const word of [...words].sort()) {
    const glyph = full.iconGlyph(word)
    if (glyph === null || !codePointOf.has(glyph)) continue
    icons.push(word)
    codePoints.add(codePointOf.get(glyph))
  }
  const text = LIGATURE_CHARACTERS + String.fromCodePoint(...codePoints)
  const subset = await subsetFont(Buffer.from(woff2), text, {
    targetFormat: 'woff2',
    noLayoutClosure: true,
  })
  return { woff2: subset, icons }
}

/**
 * Vite plugin (build only): `material-symbols/outlined.css` resolves to a copy whose font is the
 * subset, written to node_modules/.cache, so the hashed file name changes with the icon set.
 * @param {{ cacheDir?: string, subset?: typeof subsetIcons }} [options] - `subset`: for the tests
 */
export function materialSymbolsSubset({
  cacheDir = path.join(frontendDir, 'node_modules', '.cache', 'material-symbols-subset'),
  subset = subsetIcons,
} = {}) {
  const cssPath = path.join(cacheDir, CSS_FILE)
  return {
    name: 'material-symbols-subset',
    apply: 'build',
    // Before Vite's own resolver, which would find the package file
    enforce: 'pre',
    async buildStart() {
      const full = fs.readFileSync(path.join(PACKAGE_DIR, FONT_FILE))
      const { woff2, icons } = await subset(full, candidateWords())
      fs.mkdirSync(cacheDir, { recursive: true })
      fs.writeFileSync(path.join(cacheDir, FONT_FILE), woff2)
      fs.copyFileSync(path.join(PACKAGE_DIR, CSS_FILE), cssPath)
      this.info(
        `Material Symbols: ${icons.length} icons, ${(full.length / 1e6).toFixed(1)} MB → ` +
          `${(woff2.length / 1e3).toFixed(0)} kB`
      )
    },
    resolveId(id) {
      return id === `material-symbols/${CSS_FILE}` ? cssPath : null
    },
  }
}
