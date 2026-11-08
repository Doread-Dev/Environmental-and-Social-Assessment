// @vitest-environment node
// Phase 12a (owner, 2026-11-08): code comments are in English. Fails on Arabic characters in a
// comment of a non-test source file in frontend/src or backend/src. Only comments are checked
// (parsed with espree, ESLint's parser): Arabic in string literals and data — the seed's `name_ar`,
// the Arabic letter range in an export file-name regex, Arabic test fixtures — stays allowed.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import * as espree from 'espree'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const ARABIC = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/

function sourceFiles(dir) {
  const files = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!['test', 'tests', 'node_modules'].includes(entry.name)) files.push(...sourceFiles(full))
    } else if (/\.(js|jsx|mjs|cjs)$/.test(entry.name) && !/\.test\.\w+$/.test(entry.name)) {
      files.push(full)
    }
  }
  return files
}

/** The comments of a file, with their line numbers. */
function commentsOf(code) {
  const parse = (sourceType) =>
    espree.parse(code, {
      ecmaVersion: 'latest',
      sourceType,
      comment: true,
      loc: true,
      ecmaFeatures: { jsx: true },
    }).comments
  try {
    return parse('module')
  } catch {
    // CommonJS files of the backend
    return parse('commonjs')
  }
}

const arabicComments = (file) =>
  commentsOf(fs.readFileSync(file, 'utf8'))
    .filter((comment) => ARABIC.test(comment.value))
    .map((comment) => `${path.relative(repo, file)}:${comment.loc.start.line}`)

describe('code comments are in English', () => {
  it.each(['frontend/src', 'backend/src'])('no Arabic in the comments of %s', (dir) => {
    const files = sourceFiles(path.join(repo, dir))
    expect(files.length).toBeGreaterThan(20)
    expect(files.flatMap(arabicComments)).toEqual([])
  })

  it('finds Arabic in line, block, JSDoc and JSX comments, never in strings or regexes', () => {
    const code = [
      "const label = 'حلب' // تعليق",
      '/* كتلة */',
      '/**',
      ' * وصف',
      ' */',
      'const range = /[؀-ۿ]/',
      'const view = <p>{/* داخل JSX */}</p>',
    ].join('\n')
    const lines = commentsOf(code)
      .filter((comment) => ARABIC.test(comment.value))
      .map((comment) => comment.loc.start.line)
    expect(lines).toEqual([1, 2, 3, 7])
  })
})
