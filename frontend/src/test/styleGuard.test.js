/**
 * Style guard (D71, STYLE_GUIDE rules in CLAUDE.md): fails when a forbidden colour class, a raw
 * hex colour, a light-mode gray class where a token exists, a leftover emerald/teal class, a raw
 * `<select>` or a new `window.confirm` comes back anywhere in `src/`.
 *
 * Allowed gray: only dark-mode text shades (`dark:text-gray-200…500`, incl. hover/placeholder
 * variants) — the tokens are `text-text-main` / `text-text-secondary` in light mode and
 * `dark:text-white` / `dark:text-gray-400` in dark mode. Excel exports (utils/excelExport) use
 * ARGB colours for the workbook and are not checked.
 */
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const LF = String.fromCharCode(10)
const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function sourceFiles(dir = SRC, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'excelExport') continue
      sourceFiles(full, out)
    } else if (/\.(jsx?)$/.test(entry.name) && !/\.test\.jsx?$/.test(entry.name)) {
      out.push(full)
    }
  }
  return out
}

const FILES = sourceFiles().map((file) => ({
  file: path.relative(SRC, file).split(path.sep).join('/'),
  text: fs.readFileSync(file, 'utf8'),
}))

/** Every match of `re` in every file, as "file:line  match" */
function findAll(re, { except = [] } = {}) {
  const hits = []
  for (const { file, text } of FILES) {
    if (except.includes(file)) continue
    text.split('\n').forEach((line, i) => {
      for (const m of line.matchAll(re)) hits.push(`${file}:${i + 1}  ${m[0]}`)
    })
  }
  return hits
}

describe('style guard (D71)', () => {
  it('scans the app sources', () => {
    expect(FILES.length).toBeGreaterThan(100)
  })

  it('has none of the forbidden classes of the style guide', () => {
    const re =
      /(?<![\w:/-])(?:dark:bg-gray-(?:700|800|900)|border-gray-200|dark:border-gray-700|bg-gray-100)(?![\w/-])/g
    expect(findAll(re)).toEqual([])
  })

  it('has no raw hex colours (classes or strings): colours come from the tokens in index.css', () => {
    const arbitrary = /-\[#[0-9a-fA-F]{3,8}\]/g
    const literal = /['"`\s(]#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?\b/g
    expect([...findAll(arbitrary), ...findAll(literal)]).toEqual([])
  })

  it('uses tokens instead of gray/slate/zinc/neutral/stone classes (dark-mode text shades excepted)', () => {
    const re =
      /(?<![\w-])((?:[a-z-]+:)*)(?:bg|text|border|ring|divide|from|to|via|fill|stroke|outline|placeholder|shadow|decoration|accent)-(?:gray|slate|zinc|neutral|stone)-\d{2,3}(?:\/\d+)?/g
    const hits = findAll(re).filter((hit) => {
      const cls = hit.split('  ')[1]
      // allowed: dark-mode text shades, e.g. dark:text-gray-400, dark:hover:text-gray-300,
      // dark:placeholder:text-gray-500
      return !/^dark:(?:[a-z-]+:)*(?:text|placeholder)-gray-[2-5]00$/.test(cls)
    })
    expect(hits).toEqual([])
  })

  it('has no leftover emerald/teal classes (the AKF green scale is green-50…950)', () => {
    expect(findAll(/(?<![\w-])(?:[a-z-]+:)*[a-z]+-(?:emerald|teal)-\d{2,3}/g)).toEqual([])
  })

  it('uses bg-surface / bg-background instead of raw white or black backgrounds', () => {
    expect(findAll(/(?<![\w:/-])bg-(?:white|black)(?![\w/-])/g)).toEqual([])
  })

  it('has no raw <select>: every select box is the shared Select (components/ui/Select.jsx)', () => {
    expect(findAll(/<select\b/g, { except: ['components/ui/Select.jsx'] })).toEqual([])
  })

  it('asks for confirmation in the app ConfirmDialog, never window.confirm (allow-list empty)', () => {
    // Phase 10a replaced the last three (unsaved changes in Tools 3, 4, 5) with the shared guard
    // (contexts/UnsavedChangesContext: Save / Discard / Stay). No file may add one.
    expect(findAll(/(?<![\w.])(?:window\.)?confirm\(/g)).toEqual([])
  })

  it('hides Material Symbols ligature text from screen readers (aria-hidden on icon spans)', () => {
    const hits = []
    for (const { file, text } of FILES) {
      for (const m of text.matchAll(/<span[^>]*material-symbols-outlined[^>]*>/g)) {
        if (!/aria-hidden|aria-label|role=/.test(m[0])) {
          hits.push(`${file}:${text.slice(0, m.index).split(LF).length}`)
        }
      }
    }
    expect(hits).toEqual([])
  })

  it('never uses window.alert / window.prompt (in-app dialogs and toasts only)', () => {
    expect(findAll(/(?<![\w.])(?:window\.)?(?:alert|prompt)\(/g)).toEqual([])
  })

  it('has one date format: dates go through utils/formatters, not toLocale*String', () => {
    const re = /\.toLocale(?:Date|Time)?String\(/g
    expect(findAll(re, { except: ['utils/formatters.js'] })).toEqual([])
  })
})
