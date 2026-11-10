/**
 * Tool 3 (Management Activities) and Tool 4 (Mitigation Plan) sheets (this repo's layout, D68).
 * Responsibility = internal user or external party (D55).
 */

import {
  addAkfHeader,
  applyBorders,
  formatRecommendedActions,
  responsibleText,
  rowHeight,
  setLabel,
  setText,
  mergeCells,
  fill,
  EXCEL_STYLES,
} from './excelBase'

export const MANAGEMENT_SHEET = 'Tool 3 Management'
export const MITIGATION_SHEET = 'Tool 4 Mitigation'

const TOOL3 = {
  sheet: MANAGEMENT_SHEET,
  tool: 'Tool 3',
  title: 'Template for environmental and social management activities - Tool 3',
  headers: [
    'S',
    'Activity description',
    'Potential Impact and Significance/Risk',
    'Recommended Action Items',
    'Monitoring requirements',
    'Responsibility',
    'Notes',
  ],
  widths: [5, 40, 40, 40, 30, 22, 30],
  fields: (row) => [
    row.activity_description,
    row.potential_impact,
    formatRecommendedActions(row.recommended_actions),
    row.monitoring_requirements,
    responsibleText(row),
    row.notes,
  ],
}

const TOOL4 = {
  sheet: MITIGATION_SHEET,
  tool: 'Tool 4',
  title: 'Environmental and social impact assessment and mitigation plan - Tool 4',
  headers: [
    'S',
    'Output or Activity description',
    'Potential Impact and Significance/Risk of each - low-med-high, including climate-related risks',
    'Mitigation and enhancement measures',
    'Monitoring',
    'Responsibility',
    'Schedule',
    'Notes',
  ],
  widths: [5, 40, 40, 40, 30, 22, 20, 30],
  fields: (row) => [
    row.output_description,
    row.potential_impact_and_significance,
    row.mitigation_and_enhancement_measures,
    row.monitoring,
    responsibleText(row),
    row.schedule,
    row.notes,
  ],
}

function addTableSheet(workbook, config, { project, rows, status }) {
  if (!project) throw new Error('Project data is required')
  const worksheet = workbook.addWorksheet(config.sheet)
  const lastCol = config.headers.length
  config.widths.forEach((width, i) => {
    worksheet.getColumn(i + 1).width = width
  })

  addAkfHeader(worksheet, 1, config.tool, lastCol)
  let currentRow = 3

  // Title
  worksheet.mergeCells(currentRow, 1, currentRow, lastCol)
  const titleCell = worksheet.getCell(currentRow, 1)
  titleCell.value = config.title
  titleCell.font = EXCEL_STYLES.titleFont
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  worksheet.getRow(currentRow).height = 20
  currentRow++

  // Project: label in A:B, value in C:D, second label in E, value in F..last
  const infoStart = currentRow
  ;[
    ['Project Title:', project.title, 'Location:', project.location],
    ...(status ? [['Status:', status]] : []),
  ].forEach(([label1, value1, label2, value2]) => {
    setLabel(worksheet, currentRow, 1, label1)
    mergeCells(worksheet, currentRow, 1, currentRow, 2)
    setText(worksheet, currentRow, 3, value1)
    mergeCells(worksheet, currentRow, 3, currentRow, label2 ? 4 : lastCol)
    if (label2) {
      setLabel(worksheet, currentRow, 5, label2)
      setText(worksheet, currentRow, 6, value2)
      mergeCells(worksheet, currentRow, 6, currentRow, lastCol)
    }
    currentRow++
  })
  applyBorders(worksheet, infoStart, 1, currentRow - 1, lastCol)
  currentRow++

  // Table headers
  const headerRow = currentRow
  config.headers.forEach((header, index) => {
    const cell = worksheet.getCell(currentRow, index + 1)
    cell.value = header
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = fill(EXCEL_STYLES.headerBgColor)
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  })
  worksheet.getRow(currentRow).height = 30
  currentRow++

  // Data rows (saved rows only; numbering as in the app)
  const data = (rows ?? []).filter((row) => row && typeof row === 'object')
  data.forEach((row, index) => {
    worksheet.getCell(currentRow, 1).value = row.serial_number || index + 1
    worksheet.getCell(currentRow, 1).alignment = { horizontal: 'center', vertical: 'top' }
    let height = 30
    config.fields(row).forEach((text, i) => {
      setText(worksheet, currentRow, i + 2, text)
      height = Math.max(height, rowHeight(text, config.widths[i + 1]))
    })
    worksheet.getRow(currentRow).height = height
    currentRow++
  })

  applyBorders(worksheet, headerRow, 1, currentRow - 1, lastCol)
  return worksheet
}

/**
 * @param {import('exceljs').Workbook} workbook
 * @param {{ project: Object, rows: Array, status?: string }} data
 */
export const addManagementSheet = (workbook, data) => addTableSheet(workbook, TOOL3, data)

/**
 * @param {import('exceljs').Workbook} workbook
 * @param {{ project: Object, rows: Array, status?: string }} data
 */
export const addMitigationSheet = (workbook, data) => addTableSheet(workbook, TOOL4, data)
