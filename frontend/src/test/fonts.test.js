/**
 * Text font (D72): IBM Plex Sans + IBM Plex Sans Arabic are self-hosted, so the app's text font
 * works offline. Fails if the text font is loaded from Google Fonts again (only the Material
 * Symbols icons may still come from there until phase 11), or if a weight the app does not load
 * is used.
 */
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const FRONTEND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const read = (rel) => fs.readFileSync(path.join(FRONTEND, rel), 'utf8')

function filesUnder(dir, ext, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) filesUnder(full, ext, out)
    else if (ext.test(entry.name)) out.push(full)
  }
  return out
}

describe('self-hosted text font (D72)', () => {
  it('index.html and the CSS load nothing from Google Fonts except the Material Symbols icons', () => {
    const sources = [
      ['index.html', read('index.html')],
      ...filesUnder(path.join(FRONTEND, 'src'), /\.(css|html)$/).map((f) => [
        path.relative(FRONTEND, f),
        fs.readFileSync(f, 'utf8'),
      ]),
    ]
    const hits = []
    for (const [file, text] of sources) {
      for (const m of text.matchAll(/fonts\.googleapis\.com\/[^'")\s]*/g)) {
        if (!/family=Material\+Symbols/.test(m[0])) hits.push(`${file}: ${m[0]}`)
      }
      if (/fonts\.gstatic\.com/.test(text)) hits.push(`${file}: fonts.gstatic.com`)
    }
    expect(hits).toEqual([])
  })

  it('the font stack starts with IBM Plex Sans, then IBM Plex Sans Arabic', () => {
    const css = read('src/index.css')
    expect(css).toMatch(/--font-sans:\s*'IBM Plex Sans',\s*'IBM Plex Sans Arabic',/)
    expect(css).not.toMatch(/'Inter'/)
  })

  it('the font files are bundled from @fontsource (Latin, Latin extended, Arabic; 400–700)', () => {
    expect(read('src/main.jsx')).toMatch(/import '\.\/fonts'/)
    const fonts = read('src/fonts.js')
    for (const w of [400, 500, 600, 700]) {
      expect(fonts).toContain(`@fontsource/ibm-plex-sans/latin-${w}.css`)
      expect(fonts).toContain(`@fontsource/ibm-plex-sans/latin-ext-${w}.css`)
      expect(fonts).toContain(`@fontsource/ibm-plex-sans-arabic/arabic-${w}.css`)
    }
    const pkg = JSON.parse(read('package.json'))
    expect(pkg.dependencies['@fontsource/ibm-plex-sans']).toMatch(/^\d+\.\d+\.\d+$/)
    expect(pkg.dependencies['@fontsource/ibm-plex-sans-arabic']).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('uses only the loaded weights (no thin/extralight/light/extrabold/black classes)', () => {
    const hits = filesUnder(path.join(FRONTEND, 'src'), /\.jsx?$/)
      .filter((f) => !/\.test\.jsx?$/.test(f))
      .flatMap((f) =>
        [
          ...fs
            .readFileSync(f, 'utf8')
            .matchAll(/\bfont-(?:thin|extralight|light|extrabold|black)\b/g),
        ].map((m) => `${path.relative(FRONTEND, f)}: ${m[0]}`)
      )
    expect(hits).toEqual([])
  })
})
