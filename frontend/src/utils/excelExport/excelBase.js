/**
 * Excel Export Base Utilities
 * Common functions and styling for all Excel exports (this repo's own layouts, D68).
 * Each tool builder adds its sheet to a workbook it is given (see workbooks.js).
 */

import { ROLE_LABELS } from '@/contexts'

/**
 * Excel Styling Constants
 */
export const EXCEL_STYLES = {
  headerFont: { bold: true, size: 14, color: { argb: 'FFFFFFFF' } },
  titleFont: { bold: true, size: 12 },
  bodyFont: { size: 10 },
  primaryColor: 'FF2E7D32', // AKF Green
  headerBgColor: 'FF1B5E20',
  lightBgColor: 'FFE8F5E9',
  borderStyle: { style: 'thin', color: { argb: 'FF9E9E9E' } },
  // Impact level colors
  impactColors: {
    high: 'FFFFEBEE',
    medium: 'FFFFF3E0',
    low: 'FFE8F5E9',
    negligible: 'FFF5F5F5',
    not_applicable: 'FFFFFFFF',
  },
}

export const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } })

/**
 * Add AKF-S branding header to worksheet
 * @param {import('exceljs').Worksheet} worksheet
 * @param {number} startRow - Starting row (default: 1)
 * @param {string} toolTitle - Tool title (e.g., "Tool 1")
 * @param {number} [lastCol] - Last column of the merged header (default 10)
 */
export function addAkfHeader(worksheet, startRow = 1, toolTitle = '', lastCol = 10) {
  worksheet.mergeCells(startRow, 1, startRow, lastCol)
  const headerCell = worksheet.getCell(startRow, 1)
  headerCell.value = 'AGA KHAN FOUNDATION - SYRIA'
  headerCell.font = EXCEL_STYLES.headerFont
  headerCell.fill = fill(EXCEL_STYLES.headerBgColor)
  headerCell.alignment = { horizontal: 'center', vertical: 'middle' }
  worksheet.getRow(startRow).height = 25

  if (toolTitle) {
    worksheet.mergeCells(startRow + 1, 1, startRow + 1, lastCol)
    const titleCell = worksheet.getCell(startRow + 1, 1)
    titleCell.value = `Environmental Assessment - ${toolTitle}`
    titleCell.font = EXCEL_STYLES.titleFont
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getRow(startRow + 1).height = 20
  }
}

/**
 * Apply borders to a cell range
 */
export function applyBorders(worksheet, startRow, startCol, endRow, endCol) {
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const cell = worksheet.getCell(row, col)
      cell.border = {
        top: EXCEL_STYLES.borderStyle,
        left: EXCEL_STYLES.borderStyle,
        bottom: EXCEL_STYLES.borderStyle,
        right: EXCEL_STYLES.borderStyle,
      }
    }
  }
}

/**
 * Merge cells safely (a range already merged is left as it is)
 */
export function mergeCells(worksheet, startRow, startCol, endRow, endCol) {
  if (startRow === endRow && startCol === endCol) return
  try {
    worksheet.mergeCells(startRow, startCol, endRow, endCol)
  } catch {
    // already merged
  }
}

// ==========================================
// Text helpers
// ==========================================

const ARABIC = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/

/** True when the text contains Arabic letters (users type Arabic) */
export const hasArabic = (text) => ARABIC.test(safeString(text))

/**
 * Alignment for a cell holding user text: wrapped, top-aligned, right-to-left when Arabic
 * @param {string} text
 * @param {Object} [base] - Alignment to extend
 */
export function textAlignment(text, base = {}) {
  const alignment = { vertical: 'top', wrapText: true, ...base }
  return hasArabic(text) ? { ...alignment, horizontal: 'right', readingOrder: 'rtl' } : alignment
}

/**
 * Write user text into a cell (empty text stays an empty cell) with the RTL-aware alignment
 * @returns {import('exceljs').Cell}
 */
export function setText(worksheet, row, col, text, base) {
  const value = safeString(text)
  const cell = worksheet.getCell(row, col)
  cell.value = value === '' ? null : value
  cell.alignment = textAlignment(value, base)
  return cell
}

/** Bold label in one cell */
export function setLabel(worksheet, row, col, label) {
  const cell = worksheet.getCell(row, col)
  cell.value = label
  cell.font = { bold: true }
  cell.alignment = { vertical: 'top', wrapText: true }
  return cell
}

/**
 * Rough height of a row that wraps `text` in `width` characters (Excel width units)
 */
export function rowHeight(text, width, { min = 15, max = 300 } = {}) {
  const t = safeString(text)
  if (!t) return min
  const perLine = Math.max(4, Math.floor(width * 1.1))
  const lines = t
    .split('\n')
    .reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / perLine)), 0)
  return Math.min(Math.max(min, lines * 15 + 6), max)
}

/** Sum of the widths of columns from..to */
export function spanWidth(worksheet, from, to) {
  let total = 0
  for (let c = from; c <= to; c++) total += worksheet.getColumn(c).width || 8.43
  return total
}

/**
 * A labelled row: label in column 1, text merged over columns 2..lastCol, height to fit
 */
export function addTextRow(worksheet, row, label, text, lastCol = 10) {
  setLabel(worksheet, row, 1, label)
  setText(worksheet, row, 2, text)
  mergeCells(worksheet, row, 2, row, lastCol)
  worksheet.getRow(row).height = Math.max(20, rowHeight(text, spanWidth(worksheet, 2, lastCol)))
}

/**
 * Info pairs side by side: [label, value] in columns 1 / 2..3 and 4 / 5..lastCol
 * @param {Array<[string, string, string?, string?]>} rows
 * @returns {number} The next free row
 */
export function addInfoRows(worksheet, startRow, rows, lastCol = 6) {
  let row = startRow
  rows.forEach(([label1, value1, label2, value2]) => {
    setLabel(worksheet, row, 1, label1)
    setText(worksheet, row, 2, value1)
    mergeCells(worksheet, row, 2, row, 3)
    if (label2) {
      setLabel(worksheet, row, 4, label2)
      setText(worksheet, row, 5, value2)
      mergeCells(worksheet, row, 5, row, lastCol)
    } else {
      mergeCells(worksheet, row, 2, row, lastCol)
    }
    row++
  })
  return row
}

// ==========================================
// Data Normalization Helpers
// ==========================================

/** ID from a populated object or an id string */
export function extractId(value) {
  if (!value) return null
  if (typeof value === 'object' && value._id) return value._id
  if (typeof value === 'string') return value
  return null
}

/** Name of a populated user (inactive users marked as in the app) */
export function extractUserName(user) {
  if (!user || typeof user !== 'object') return ''
  const name = user.name || user.username || ''
  return name && user.is_active === false ? `${name} (inactive)` : name
}

/**
 * Job title of a populated user (job_title is populated with title_name); falls back to the
 * role label
 */
export function extractUserJobTitle(user) {
  if (!user || typeof user !== 'object') return ''
  if (user.job_title && typeof user.job_title === 'object') return user.job_title.title_name || ''
  if (user.job_title && typeof user.job_title === 'string') return user.job_title
  if (user.role && ROLE_LABELS[user.role]) return ROLE_LABELS[user.role]
  return ''
}

/**
 * Tools 3, 4, 5: an internal user or an external party (D55)
 * @param {Object} row - Row with `responsible` (populated user or id) and `responsible_text`
 */
export function responsibleText(row) {
  if (!row) return ''
  const name = extractUserName(row.responsible)
  if (name) return name
  const text = safeString(row.responsible_text).trim()
  return text ? `${text} (external party)` : ''
}

/** recommended_actions may be a string or an array */
export function formatRecommendedActions(actions) {
  if (!actions) return ''
  if (Array.isArray(actions)) return actions.filter(Boolean).join('\n')
  return String(actions || '')
}

/** Long English date ("November 4, 2026") */
export function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

/** Safe string (null/undefined → default) */
export function safeString(value, defaultValue = '') {
  if (value === null || value === undefined) return defaultValue
  return String(value)
}

/** Readable workflow status of a screening/assessment record */
export const RECORD_STATUS_LABELS = {
  draft: 'Draft',
  submitted: 'Submitted (awaiting review)',
  approved: 'Approved',
  rejected: 'Rejected',
}

/** Date of the latest status_history entry with this status (e.g. when it was approved) */
export function lastStatusDate(record, status) {
  const entries = (record?.status_history ?? []).filter((entry) => entry?.status === status)
  return entries.length ? formatDate(entries[entries.length - 1].at) : ''
}

/**
 * Review section of a screening/assessment: who approved (with date and recommendations) or
 * who rejected (with date and reason). Nothing while draft or submitted.
 * @returns {number} The next free row
 */
export function addReviewSection(worksheet, startRow, record, lastCol = 10) {
  const status = record?.status
  if (status !== 'approved' && status !== 'rejected') return startRow
  const approved = status === 'approved'
  let row = startRow + 1
  setLabel(worksheet, row, 1, approved ? 'The Approval and Recommendations by:' : 'Rejected by:')
  mergeCells(worksheet, row, 1, row, lastCol)
  worksheet.getCell(row, 1).fill = fill(EXCEL_STYLES.lightBgColor)
  row++
  const reviewer = approved ? record.approved_by : record.reject_by
  row = addInfoRows(
    worksheet,
    row,
    [
      ['Name:', extractUserName(reviewer), 'Position:', extractUserJobTitle(reviewer)],
      [approved ? 'Approved on:' : 'Rejected on:', lastStatusDate(record, status)],
    ],
    lastCol
  )
  addTextRow(
    worksheet,
    row,
    approved ? 'Recommendations:' : 'Reason for rejection:',
    approved ? record.recommendations : record.reject_reason,
    lastCol
  )
  return row + 1
}
