// @vitest-environment node
// Phase 12a: the production build ships a subset of the Material Symbols font (scripts/iconFont.js).
// This test fails when an icon name used in src/ — ligature text in JSX, <Icon name>, `icon:` in
// config and lookup maps — is missing from the subset, when a name is no icon at all (a typo), or
// when the subset needs the network or loses the FILL / weight axes.
import fs from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import {
  CSS_FILE,
  FONT_FILE,
  PACKAGE_DIR,
  SRC_DIR,
  candidateWords,
  materialSymbolsSubset,
  openFont,
  sourceFiles,
  subsetIcons,
} from '../../scripts/iconFont.js'

const fullFont = fs.readFileSync(path.join(PACKAGE_DIR, FONT_FILE))

// Icon names written where an icon is expected, found independently of the build's word scan
function iconUsages() {
  // The results of an expression: a lone literal or the branches of a ternary (`x === 'asc'` is a
  // comparison, not an icon)
  const literals = (expression) =>
    [...expression.matchAll(/(?:^|[?:])\s*'([a-z0-9_]+)'/g)].map((m) => m[1])
  const patterns = [
    // <span className="material-symbols-outlined …">name</span> (text child)
    [/material-symbols-outlined[^>]*>\s*([a-z0-9_]+)\s*</g, (m) => [m[1]]],
    // <span className="material-symbols-outlined …">{done ? 'check_circle' : 'lock'}</span>
    [/material-symbols-outlined[^>]*>\s*\{([^}]*)\}/g, (m) => literals(m[1])],
    // <Icon name="name" /> and <Icon name={x ? 'a' : 'b'} />
    [/<Icon\b[^>]*?\bname="([a-z0-9_]+)"/g, (m) => [m[1]]],
    [/<Icon\b[^>]*?\bname=\{([^}]*)\}/g, (m) => literals(m[1])],
    // icon="name" (EmptyState, ErrorState …)
    [/\bicon="([a-z0-9_]+)"/g, (m) => [m[1]]],
    // { icon: 'name' } in config and lookup maps
    [/\b(?:icon|iconName)\s*:\s*'([a-z0-9_]+)'/g, (m) => [m[1]]],
  ]
  const found = new Map()
  for (const file of sourceFiles()) {
    const code = fs.readFileSync(file, 'utf8')
    for (const [pattern, names] of patterns) {
      for (const match of code.matchAll(pattern)) {
        for (const name of names(match)) {
          if (!found.has(name)) found.set(name, path.relative(SRC_DIR, file))
        }
      }
    }
  }
  return found
}

let full
let subset
let subsetFont

beforeAll(async () => {
  // No network: everything comes from node_modules
  vi.stubGlobal(
    'fetch',
    vi.fn(() => {
      throw new Error('the icon subset must not download anything')
    })
  )
  full = await openFont(fullFont)
  subset = await subsetIcons(fullFont, candidateWords())
  subsetFont = await openFont(subset.woff2)
}, 120_000)

afterAll(() => vi.unstubAllGlobals())

describe('Material Symbols subset', () => {
  it('was built without the network', () => {
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('draws every icon the app names (JSX, <Icon name>, config and lookup maps)', () => {
    const usages = iconUsages()
    // The patterns find the icons of the sidebars, alerts, category maps …
    expect(usages.size).toBeGreaterThan(100)
    const notIcons = [...usages].filter(([name]) => full.iconGlyph(name) === null)
    // A name the font does not know shows as plain text in the app (a typo)
    expect(notIcons.map(([name, file]) => `${name} (${file})`)).toEqual([])
    const missing = [...usages]
      .filter(([name]) => full.iconGlyph(name) !== null && subsetFont.iconGlyph(name) === null)
      .map(([name, file]) => `${name} (${file})`)
    expect(missing).toEqual([])
  })

  it('keeps every word of src/ that is an icon, and nothing else', () => {
    const words = [...candidateWords()]
    const icons = words.filter((word) => full.iconGlyph(word) !== null).sort()
    expect(subset.icons).toEqual(icons)
    for (const name of icons) expect(subsetFont.iconGlyph(name), name).not.toBeNull()
  })

  it('drops the icons the app does not use, so it is much smaller than the full font', () => {
    const used = new Set(subset.icons)
    const unused = ['house', 'rocket_launch', 'pets', 'sports_soccer'].filter(
      (name) => !used.has(name)
    )
    expect(unused.length).toBeGreaterThan(0)
    for (const name of unused) {
      expect(full.iconGlyph(name), name).not.toBeNull()
      expect(subsetFont.iconGlyph(name), name).toBeNull()
    }
    expect(subset.woff2.length).toBeLessThan(fullFont.length / 5)
  })

  it('keeps the variation axes (FILL is used, and the weights)', () => {
    const axes = Object.keys(subsetFont.face.getAxisInfos())
    expect(axes).toEqual(expect.arrayContaining(['FILL', 'wght', 'opsz', 'GRAD']))
  })
})

describe('materialSymbolsSubset (Vite plugin)', () => {
  it('runs for the build only, before Vite resolves the package CSS', () => {
    const plugin = materialSymbolsSubset({ cacheDir: '/cache' })
    expect(plugin.apply).toBe('build')
    expect(plugin.enforce).toBe('pre')
    expect(plugin.resolveId(`material-symbols/${CSS_FILE}`)).toBe(path.join('/cache', CSS_FILE))
    expect(plugin.resolveId('react')).toBeNull()
  })

  it('writes the subset font next to a copy of the package CSS', async () => {
    const cacheDir = fs.mkdtempSync(path.join(PACKAGE_DIR, '..', '.cache-icon-test-'))
    try {
      // The subset built above, so the test pays for HarfBuzz once
      const plugin = materialSymbolsSubset({ cacheDir, subset: async () => subset })
      const info = vi.fn()
      await plugin.buildStart.call({ info })
      const css = fs.readFileSync(path.join(cacheDir, CSS_FILE), 'utf8')
      expect(css).toContain(`url("./${FONT_FILE}")`)
      expect(fs.statSync(path.join(cacheDir, FONT_FILE)).size).toBe(subset.woff2.length)
      expect(info).toHaveBeenCalledWith(expect.stringMatching(/Material Symbols: \d+ icons/))
    } finally {
      fs.rmSync(cacheDir, { recursive: true, force: true })
    }
  }, 120_000)
})
