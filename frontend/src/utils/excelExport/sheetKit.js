/**
 * Shared helpers for the official-workbook sheet builders (D52, D67).
 *
 * The builders never create a workbook: each adds its sheet to the workbook it is given, so a
 * per-tool export and the project workbook (D67 b) share them. Nothing here touches the browser.
 */

export const BLACK = 'FF000000'
export const WHITE = 'FFFFFFFF'

// Colours of the official workbook (theme colours resolved to RGB, so the export looks the same
// whatever theme the reader's Excel uses)
export const OFFICIAL = {
  green: 'FF00B050',
  lightGreen: 'FF92D050',
  paleGreen: 'FFA9D08E',
  headerGreen: 'FFB3E5A1',
  blue: 'FF5B9BD5', // accent 1
  darkBlue: 'FF4472C4', // accent 5
  paleBlue: 'FFBDD7EE', // accent 1, lighter 60 %
  grey: 'FFBFBFBF', // background 1, darker 25 %
  greyBrown: 'FFAEAAAA', // background 2, darker 25 %
  orange: 'FFFFC000',
  salmon: 'FFFFCABC',
  yellow: 'FFFFE084',
  paleYellow: 'FFFFF2CC',
  lightYellow: 'FFFFE699',
}

const THIN = { style: 'thin', color: { argb: BLACK } }
const MEDIUM = { style: 'medium', color: { argb: BLACK } }

export const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } })

export function safeString(value) {
  if (value === null || value === undefined) return ''
  return String(value)
}

const ARABIC = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/

/** True when the text contains Arabic letters (users type Arabic) */
export const hasArabic = (text) => ARABIC.test(safeString(text))

/**
 * Alignment for a cell that holds user text: wrapped, top-aligned, and right-to-left when the
 * text is Arabic (ExcelJS `readingOrder`).
 * @param {string} text
 * @param {Object} [base] - Alignment to extend
 */
export function textAlignment(text, base = {}) {
  const alignment = { vertical: 'top', wrapText: true, ...base }
  return hasArabic(text) ? { ...alignment, horizontal: 'right', readingOrder: 'rtl' } : alignment
}

/** Merge a range unless (part of) it is merged already */
export function merge(ws, top, left, bottom, right) {
  if (top === bottom && left === right) return
  try {
    ws.mergeCells(top, left, bottom, right)
  } catch {
    // already merged
  }
}

/** Set width per column ({ 1: 12.9, … }); 0 hides the column like the official sheets */
export function setWidths(ws, widths) {
  for (const [col, width] of Object.entries(widths)) {
    const column = ws.getColumn(Number(col))
    if (width === 0) column.hidden = true
    else column.width = width
  }
}

/**
 * Write a cell: value + font + optional fill/alignment/border.
 * @returns {import('exceljs').Cell}
 */
export function put(ws, row, col, value, { font, fillColor, alignment, border } = {}) {
  const cell = ws.getCell(row, col)
  cell.value = value === '' ? null : value // an empty answer stays an empty cell
  if (font) cell.font = font
  if (fillColor) cell.fill = fill(fillColor)
  if (alignment) cell.alignment = alignment
  if (border) cell.border = border
  return cell
}

/** Border on every cell of a range (thin or medium) */
export function box(ws, top, left, bottom, right, weight = 'thin') {
  const side = weight === 'medium' ? MEDIUM : THIN
  for (let r = top; r <= bottom; r++) {
    for (let c = left; c <= right; c++) {
      ws.getCell(r, c).border = { top: side, left: side, bottom: side, right: side }
    }
  }
}

/** Fill every cell of a range (merged cells keep their fill on every part) */
export function paint(ws, top, left, bottom, right, argb) {
  for (let r = top; r <= bottom; r++) {
    for (let c = left; c <= right; c++) {
      ws.getCell(r, c).fill = fill(argb)
    }
  }
}

/**
 * "Label: value" in one cell, as the official sheets print it: the label bold, the value in
 * the regular weight.
 */
export function labelled(label, value, font) {
  const text = safeString(value)
  return {
    richText: [
      { text: label, font: { ...font, bold: true } },
      ...(text ? [{ text: ` ${text}`, font: { ...font, bold: false } }] : []),
    ],
  }
}

/**
 * Rough height of a row that wraps `text` in `width` characters (Excel width units)
 * @param {string} text
 * @param {number} width
 * @param {Object} [limits]
 */
export function rowHeight(text, width, { min = 15, max = 300, lineHeight = 15 } = {}) {
  const t = safeString(text)
  if (!t) return min
  const perLine = Math.max(4, Math.floor(width * 1.1))
  const lines = t
    .split('\n')
    .reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / perLine)), 0)
  return Math.min(Math.max(min, lines * lineHeight + 6), max)
}

/** Sum of the widths of columns `from`..`to` */
export function spanWidth(widths, from, to) {
  let total = 0
  for (let c = from; c <= to; c++) total += widths[c] || 8.43
  return total
}

export function userName(user) {
  if (!user || typeof user !== 'object') return ''
  return user.name || ''
}

export function userJobTitle(user) {
  if (!user || typeof user !== 'object') return ''
  if (user.job_title && typeof user.job_title === 'object') return user.job_title.title_name || ''
  return typeof user.job_title === 'string' ? user.job_title : ''
}

/**
 * Tools 3, 4, 5: an internal user or an external party (D55)
 * @param {Object} row - Row with `responsible` (populated user or id) and `responsible_text`
 */
export function responsibleText(row) {
  if (!row) return ''
  const name = userName(row.responsible)
  if (name) return row.responsible?.is_active === false ? `${name} (inactive)` : name
  return safeString(row.responsible_text).trim()
}

/** Long English date ("4 November 2026"), as typed in the official sheets */
export function longDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
}

const idOf = (value) => (value && typeof value === 'object' ? value._id : value)
export { idOf }
