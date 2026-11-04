/**
 * Tool 1: Environmental Integration Screening Tool sheet (this repo's layout, D68)
 */

import {
  addAkfHeader,
  addInfoRows,
  addReviewSection,
  addTextRow,
  applyBorders,
  extractUserJobTitle,
  extractUserName,
  fill,
  formatDate,
  lastStatusDate,
  mergeCells,
  RECORD_STATUS_LABELS,
  EXCEL_STYLES,
} from './excelBase'

export const SCREENING_SHEET = 'Tool 1 Screening'

export const SCREENING_CATEGORIES = [
  { code: 'A', description: 'High potential environmental risk' },
  { code: 'B', description: 'Low to moderate environmental risk' },
  { code: 'C', description: 'Negligible environmental risk' },
  { code: 'D', description: 'Emergency cases and initiatives' },
  { code: 'E', description: 'Not enough information.' },
  { code: 'F', description: 'Positive Environmental Impact' },
]

/**
 * @param {import('exceljs').Workbook} workbook
 * @param {Object} data
 * @param {Object} data.project
 * @param {Object} data.screening
 * @returns {import('exceljs').Worksheet}
 */
export function addScreeningSheet(workbook, { project, screening }) {
  if (!project || !screening) throw new Error('Project and screening data are required')
  const worksheet = workbook.addWorksheet(SCREENING_SHEET)

  // Column widths first: row heights are computed from them
  worksheet.getColumn(1).width = 28.57
  worksheet.getColumn(2).width = 50
  for (let i = 3; i <= 10; i++) worksheet.getColumn(i).width = 15

  addAkfHeader(worksheet, 1, 'Tool 1')
  let currentRow = 3

  // Row 3: Title
  worksheet.mergeCells(currentRow, 1, currentRow, 10)
  const titleCell = worksheet.getCell(currentRow, 1)
  titleCell.value = 'ENVIRONMENTAL INTEGRATION SCREENING TOOL – SUMMARY TABLE'
  titleCell.font = EXCEL_STYLES.titleFont
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  worksheet.getRow(currentRow).height = 20
  currentRow++

  // Project, officer and status
  const firstInfoRow = currentRow
  currentRow = addInfoRows(
    worksheet,
    currentRow,
    [
      ['Project Title:', project.title, 'Screening Date:', formatDate(screening.screening_date)],
      ['Location:', project.location, 'Status:', RECORD_STATUS_LABELS[screening.status]],
      [
        'Program Officer:',
        extractUserName(screening.officer),
        'Position:',
        extractUserJobTitle(screening.officer),
      ],
      [
        'Project Start Date:',
        formatDate(project.start_date),
        'Project End Date:',
        formatDate(project.end_date),
      ],
      ...(lastStatusDate(screening, 'submitted')
        ? [['Submitted on:', lastStatusDate(screening, 'submitted')]]
        : []),
    ],
    10
  )
  addTextRow(
    worksheet,
    currentRow,
    'Project Components/Activities:',
    project.project_component || project.description
  )
  currentRow++

  // Category result
  const chosen = SCREENING_CATEGORIES.find((c) => c.code === screening.category_code)
  worksheet.getCell(currentRow, 1).value = 'Screening Project Category:'
  worksheet.getCell(currentRow, 1).font = { bold: true }
  worksheet.getCell(currentRow, 2).value = chosen
    ? `Category ${chosen.code} – ${chosen.description}`
    : 'Not selected'
  worksheet.getCell(currentRow, 2).font = { bold: true }
  mergeCells(worksheet, currentRow, 2, currentRow, 10)
  currentRow++

  worksheet.getCell(currentRow, 1).value = 'Indicate the category that best describes the project:'
  worksheet.getCell(currentRow, 1).font = { bold: true, italic: true }
  mergeCells(worksheet, currentRow, 1, currentRow, 10)
  currentRow++

  // Category rows (A–F); the selected one is filled and carries the reason
  SCREENING_CATEGORIES.forEach((cat) => {
    const isSelected = cat === chosen
    worksheet.getCell(currentRow, 1).value = isSelected
      ? `Category ${cat.code}: ✓ selected`
      : `Category ${cat.code}:`
    worksheet.getCell(currentRow, 1).font = { bold: true }
    worksheet.getCell(currentRow, 2).value = cat.description
    mergeCells(worksheet, currentRow, 2, currentRow, 10)
    if (isSelected) {
      worksheet.getCell(currentRow, 1).fill = fill(EXCEL_STYLES.lightBgColor)
      worksheet.getCell(currentRow, 2).fill = fill(EXCEL_STYLES.lightBgColor)
    }
    currentRow++

    if (isSelected) {
      addTextRow(worksheet, currentRow, `Why Category ${cat.code}:`, screening.category_reason)
      worksheet.getCell(currentRow, 1).fill = fill(EXCEL_STYLES.lightBgColor)
      worksheet.getCell(currentRow, 2).fill = fill(EXCEL_STYLES.lightBgColor)
      currentRow++
    }
  })

  addTextRow(worksheet, currentRow, 'Potential Negative Impact:', screening.potential_negative)
  worksheet.getRow(currentRow).height = Math.max(40, worksheet.getRow(currentRow).height)
  currentRow++
  addTextRow(worksheet, currentRow, 'Potential Positive Impact:', screening.potential_positive)
  worksheet.getRow(currentRow).height = Math.max(40, worksheet.getRow(currentRow).height)
  currentRow++

  // Approval (with recommendations) or rejection (with reason)
  currentRow = addReviewSection(worksheet, currentRow, screening, 10)

  applyBorders(worksheet, firstInfoRow, 1, currentRow - 1, 10)
  return worksheet
}
