/**
 * Offline (D37, phase 11): the app needs no internet at runtime. The text font and the Material
 * Symbols icons are bundled from npm packages, nothing is loaded from Google Fonts, a CDN or a
 * remote image host, and Vercel Speed Insights (which reports to Vercel) is gone.
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

// What the browser loads: index.html, the files in public/ and every source file (tests aside).
const shippedSources = () => [
  ['index.html', read('index.html')],
  ...[
    ...filesUnder(path.join(FRONTEND, 'public'), /\.(js|css|html|svg|json)$/),
    ...filesUnder(path.join(FRONTEND, 'src'), /\.(css|html|js|jsx)$/).filter(
      (f) => !/\.test\.jsx?$/.test(f) && !f.includes(`${path.sep}test${path.sep}`)
    ),
  ].map((f) => [path.relative(FRONTEND, f).split(path.sep).join('/'), fs.readFileSync(f, 'utf8')]),
]

// URLs that are not requests: XML/SVG namespaces, and the dev-only fallback to the local backend.
const ALLOWED = [/^http:\/\/www\.w3\.org\//, /^http:\/\/localhost:3000\/api\/v1$/]

describe('offline (D37)', () => {
  it('nothing is loaded from Google Fonts', () => {
    const hits = shippedSources()
      .filter(([, text]) => /fonts\.(googleapis|gstatic)\.com/.test(text))
      .map(([file]) => file)
    expect(hits).toEqual([])
  })

  it('index.html, the CSS and the source name no remote URL (no CDN, no remote image)', () => {
    const hits = []
    for (const [file, text] of shippedSources()) {
      for (const [url] of text.matchAll(/https?:\/\/[^\s'"`)<>]+/gi)) {
        if (ALLOWED.some((re) => re.test(url))) continue
        hits.push(`${file}: ${url}`)
      }
    }
    expect(hits).toEqual([])
  })

  it('CSS has no @import of a URL and no url() pointing outside the app', () => {
    const hits = []
    for (const [file, text] of shippedSources().filter(([f]) => f.endsWith('.css'))) {
      for (const m of text.matchAll(/@import\s+url\(|url\(\s*['"]?(?:https?:)?\/\//gi)) {
        hits.push(`${file}: ${m[0]}`)
      }
    }
    expect(hits).toEqual([])
  })

  it('the Material Symbols icons are bundled from the material-symbols package (exact version)', () => {
    expect(read('src/fonts.js')).toMatch(/import 'material-symbols\/outlined\.css'/)
    const pkg = JSON.parse(read('package.json'))
    expect(pkg.dependencies['material-symbols']).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('Vercel Speed Insights is gone from package.json and main.jsx', () => {
    const pkg = JSON.parse(read('package.json'))
    expect({ ...pkg.dependencies, ...pkg.devDependencies }).not.toHaveProperty(
      '@vercel/speed-insights'
    )
    expect(read('src/main.jsx')).not.toMatch(/speed-insights|SpeedInsights/)
  })

  it('index.html has no inline script (the server CSP allows script-src self only)', () => {
    const html = read('index.html')
    const inline = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter(
      ([, attrs, body]) => !/\bsrc=/.test(attrs) || body.trim() !== ''
    )
    expect(inline).toEqual([])
    expect(html).toContain('<script src="/theme-init.js"></script>')
    expect(fs.existsSync(path.join(FRONTEND, 'public/theme-init.js'))).toBe(true)
  })
})
