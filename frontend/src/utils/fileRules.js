/**
 * Client-side pre-check of a file against the server's upload rules (GET /auth/me upload_rules,
 * D47). Only to fail early: the server checks again and has the last word.
 */

/**
 * @param {number} bytes
 * @returns {string} e.g. "820 KB", "2.4 MB"
 */
export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${Number((bytes / 1024 / 1024).toFixed(1))} MB`
}

/** @param {{extensions: string[]}|null} rules → value for <input accept> */
export function acceptAttribute(rules) {
  return rules?.extensions?.map((ext) => `.${ext}`).join(',') ?? undefined
}

/**
 * @param {File} file
 * @param {{max_bytes: number, extensions: string[]}|null} rules
 * @returns {string|null} why the file would be refused, or null
 */
export function checkFile(file, rules) {
  if (!rules) return null
  const extension = /\.([A-Za-z0-9]+)$/.exec(file.name)?.[1]?.toLowerCase()
  if (!extension || !rules.extensions.includes(extension)) {
    return `File type not allowed. Allowed: ${rules.extensions.map((ext) => `.${ext}`).join(', ')}`
  }
  if (file.size > rules.max_bytes) return `File is too large (max ${formatBytes(rules.max_bytes)})`
  if (file.size === 0) return 'The file is empty'
  return null
}

/**
 * The rules for a reference library document (D64 b): the same size limit, PDF only.
 * @param {{max_bytes: number, extensions: string[], library_extensions?: string[]}|null} rules
 */
export function libraryRules(rules) {
  if (!rules) return null
  return { ...rules, extensions: rules.library_extensions ?? [] }
}
