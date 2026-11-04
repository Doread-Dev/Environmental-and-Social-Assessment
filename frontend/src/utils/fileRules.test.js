import { describe, expect, it } from 'vitest'
import { acceptAttribute, checkFile, formatBytes } from './fileRules'

const RULES = { max_bytes: 10 * 1024 * 1024, extensions: ['pdf', 'docx'] }
const fakeFile = (name, size) => ({ name, size })

describe('fileRules', () => {
  it('formats sizes', () => {
    expect(formatBytes(500)).toBe('500 B')
    expect(formatBytes(2048)).toBe('2 KB')
    expect(formatBytes(10 * 1024 * 1024)).toBe('10 MB')
    expect(formatBytes(2.45 * 1024 * 1024)).toBe('2.5 MB')
    expect(formatBytes(undefined)).toBe('')
  })

  it('builds the accept attribute from the server rules', () => {
    expect(acceptAttribute(RULES)).toBe('.pdf,.docx')
    expect(acceptAttribute(null)).toBeUndefined()
  })

  it('checks type (case-insensitive), size and emptiness', () => {
    expect(checkFile(fakeFile('Report.PDF', 10), RULES)).toBeNull()
    expect(checkFile(fakeFile('a.exe', 10), RULES)).toMatch(/File type not allowed/)
    expect(checkFile(fakeFile('noext', 10), RULES)).toMatch(/File type not allowed/)
    expect(checkFile(fakeFile('a.pdf', RULES.max_bytes + 1), RULES)).toBe(
      'File is too large (max 10 MB)'
    )
    expect(checkFile(fakeFile('a.pdf', 0), RULES)).toBe('The file is empty')
  })

  it('lets everything through until the rules are known (the server checks anyway)', () => {
    expect(checkFile(fakeFile('a.exe', 10), null)).toBeNull()
  })
})

describe('libraryRules (D64 b)', () => {
  it('keeps the size limit and allows the library extensions only', async () => {
    const { libraryRules } = await import('./fileRules')
    const rules = libraryRules({ ...RULES, library_extensions: ['pdf'] })
    expect(rules).toEqual({ ...RULES, library_extensions: ['pdf'], extensions: ['pdf'] })
    expect(checkFile(fakeFile('plan.docx', 10), rules)).toMatch(/Allowed: \.pdf$/)
    expect(checkFile(fakeFile('guide.pdf', 10), rules)).toBeNull()
    expect(libraryRules(null)).toBeNull()
  })
})
