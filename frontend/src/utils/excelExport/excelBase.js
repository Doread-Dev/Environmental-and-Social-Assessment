/**
 * Excel Export Base Utilities
 * Common functions and styling for all Excel exports
 */

import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
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

/**
 * Create a new Excel workbook with standard settings
 * @returns {ExcelJS.Workbook}
 */
export function createWorkbook() {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'AKF Syria'
  workbook.created = new Date()
  workbook.modified = new Date()
  return workbook
}

/**
 * Add AKF-S branding header to worksheet
 * @param {ExcelJS.Worksheet} worksheet
 * @param {number} startRow - Starting row (default: 1)
 * @param {string} toolTitle - Tool title (e.g., "Tool 1 - Screening")
 */
export function addAkfHeader(worksheet, startRow = 1, toolTitle = '') {
  // Row 1: AKF-S branding (merged)
  worksheet.mergeCells(startRow, 1, startRow, 10)
  const headerCell = worksheet.getCell(startRow, 1)
  headerCell.value = 'AGA KHAN FOUNDATION - SYRIA'
  headerCell.font = EXCEL_STYLES.headerFont
  headerCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: EXCEL_STYLES.headerBgColor },
  }
  headerCell.alignment = { horizontal: 'center', vertical: 'middle' }
  worksheet.getRow(startRow).height = 25

  // Row 2: Tool title (if provided)
  if (toolTitle) {
    worksheet.mergeCells(startRow + 1, 1, startRow + 1, 10)
    const titleCell = worksheet.getCell(startRow + 1, 1)
    titleCell.value = `Environmental Assessment - ${toolTitle}`
    titleCell.font = EXCEL_STYLES.titleFont
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getRow(startRow + 1).height = 20
  }
}

/**
 * Apply borders to a cell range
 * @param {ExcelJS.Worksheet} worksheet
 * @param {number} startRow
 * @param {number} startCol
 * @param {number} endRow
 * @param {number} endCol
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
 * Merge cells safely (checks if cells exist)
 * @param {ExcelJS.Worksheet} worksheet
 * @param {number} startRow
 * @param {number} startCol
 * @param {number} endRow
 * @param {number} endCol
 */
export function mergeCells(worksheet, startRow, startCol, endRow, endCol) {
  try {
    worksheet.mergeCells(startRow, startCol, endRow, endCol)
  } catch (error) {
    // Ignore merge errors (cell might already be merged)
    console.warn('Merge cells warning:', error.message)
  }
}

/**
 * Save workbook to file and trigger download
 * @param {ExcelJS.Workbook} workbook
 * @param {string} fileName
 */
export async function saveWorkbook(workbook, fileName) {
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  saveAs(blob, fileName)
}

/**
 * Generate safe file name from project title
 * @param {string} projectTitle
 * @param {number} toolNumber
 * @param {string} toolName
 * @returns {string}
 */
export function generateFileName(projectTitle, toolNumber, toolName) {
  if (!projectTitle) {
    return `Project_Tool${toolNumber}_${toolName}.xlsx`
  }

  const sanitized = projectTitle
    .replace(/[^a-zA-Z0-9\s\u0600-\u06FF]/g, '') // Allow Arabic characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_+/g, '_') // Collapse multiple underscores
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    .substring(0, 50)
    .trim()

  if (!sanitized) {
    return `Project_Tool${toolNumber}_${toolName}.xlsx`
  }

  return `${sanitized}_Tool${toolNumber}_${toolName}.xlsx`
}

// ==========================================
// Data Normalization Helpers
// ==========================================

/**
 * Extract ID from populated object or return ID string
 * @param {any} value
 * @returns {string|null}
 */
export function extractId(value) {
  if (!value) return null
  if (typeof value === 'object' && value._id) return value._id
  if (typeof value === 'string') return value
  return null
}

/**
 * Extract name from populated User object
 * @param {any} user
 * @returns {string}
 */
export function extractUserName(user) {
  if (!user) return ''
  if (typeof user === 'object') {
    return user.name || user.username || ''
  }
  return ''
}

/**
 * Extract job title from populated User object
 * IMPORTANT: job_title is a reference to JobTitle model with title_name field
 * Falls back to role label if job_title not populated
 * @param {any} user
 * @returns {string}
 */
export function extractUserJobTitle(user) {
  if (!user) return ''
  if (typeof user === 'object') {
    // job_title is populated object with title_name field
    if (user.job_title && typeof user.job_title === 'object') {
      return user.job_title.title_name || ''
    }
    // job_title is just string (rare case)
    if (user.job_title && typeof user.job_title === 'string') {
      return user.job_title
    }
    // Fallback to role label
    if (user.role && ROLE_LABELS[user.role]) {
      return ROLE_LABELS[user.role]
    }
  }
  return ''
}

/**
 * Handle recommended_actions (can be string or array)
 * @param {any} actions
 * @returns {string}
 */
export function formatRecommendedActions(actions) {
  if (!actions) return ''
  if (Array.isArray(actions)) {
    return actions.filter(Boolean).join('\n')
  }
  return String(actions || '')
}

/**
 * Format date to Excel-friendly string
 * @param {any} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return ''
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

/**
 * Get safe string value (handles null/undefined)
 * @param {any} value
 * @param {string} defaultValue
 * @returns {string}
 */
export function safeString(value, defaultValue = '') {
  if (value === null || value === undefined) return defaultValue
  return String(value)
}
