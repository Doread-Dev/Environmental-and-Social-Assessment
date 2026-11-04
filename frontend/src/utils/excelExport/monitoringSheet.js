/**
 * Tool 5: Environmental Checklist and Evaluation Tool (Monitoring) sheet (this repo's layout,
 * D68). Baseline, quarters, total and score are free text (D57); Responsibility = internal user
 * or external party (D55).
 */

import {
  addAkfHeader,
  applyBorders,
  extractId,
  extractUserJobTitle,
  extractUserName,
  fill,
  formatDate,
  responsibleText,
  rowHeight,
  safeString,
  setText,
  mergeCells,
  EXCEL_STYLES,
} from './excelBase'
import { getRankingDisplayLabel } from '../rankingHelp'
import { IMPACT_LEVEL_CONFIG } from '../impactLevels'

export const MONITORING_SHEET = 'Tool 5 Monitoring'

const HEADERS = [
  'S',
  'Indicator',
  'Definition',
  'Measurement',
  'Baseline',
  'Q1',
  'Q2',
  'Q3',
  'Q4',
  'Total',
  'Score',
  'Ranking',
  'Responsibility',
  'Note',
]
const WIDTHS = [5, 40, 50, 40, 12, 12, 12, 12, 12, 10, 10, 28, 22, 30]
const LAST_COL = HEADERS.length

/**
 * @param {import('exceljs').Workbook} workbook
 * @param {Object} data
 * @param {Object} data.project
 * @param {Object} [data.screening] - For the Tool 1 category
 * @param {Object} [data.assessment] - For the officer
 * @param {Array} [data.records] - Monitoring records
 * @param {Array} [data.categoriesWithIndicators] - useLookups().categoriesWithIndicators
 * @param {string} [data.status] - In progress / Completed
 * @returns {import('exceljs').Worksheet}
 */
export function addMonitoringSheet(
  workbook,
  { project, screening, assessment, records = [], categoriesWithIndicators = [], status }
) {
  if (!project) throw new Error('Project data is required')
  const worksheet = workbook.addWorksheet(MONITORING_SHEET)
  WIDTHS.forEach((width, i) => {
    worksheet.getColumn(i + 1).width = width
  })

  addAkfHeader(worksheet, 1, 'Tool 5', LAST_COL)
  let currentRow = 3

  // Project & officer (labels in A:B so they are not squeezed into the S column)
  const info = [
    [
      'Officer Name:',
      extractUserName(assessment?.officer),
      'Position:',
      extractUserJobTitle(assessment?.officer),
    ],
    ['Project Title:', project.title, 'Location:', project.location],
    ['Start Date:', formatDate(project.start_date), 'End Date:', formatDate(project.end_date)],
    ['Category (Tool 1):', screening?.category_code || 'N/A', 'Status:', status],
  ]
  const infoStart = currentRow
  info.forEach(([label1, value1, label2, value2]) => {
    worksheet.getCell(currentRow, 1).value = label1
    worksheet.getCell(currentRow, 1).font = { bold: true }
    mergeCells(worksheet, currentRow, 1, currentRow, 2)
    setText(worksheet, currentRow, 3, value1)
    worksheet.getCell(currentRow, 4).value = label2
    worksheet.getCell(currentRow, 4).font = { bold: true }
    setText(worksheet, currentRow, 5, value2)
    mergeCells(worksheet, currentRow, 5, currentRow, 9)
    currentRow++
  })
  applyBorders(worksheet, infoStart, 1, currentRow - 1, 9)

  // Table headers
  currentRow++
  const headerRow = currentRow
  HEADERS.forEach((header, index) => {
    const cell = worksheet.getCell(currentRow, index + 1)
    cell.value = header
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = fill(EXCEL_STYLES.headerBgColor)
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  })
  worksheet.getRow(currentRow).height = 30
  currentRow++

  // Records by indicator (placeholders are unsaved)
  const recordsMap = new Map()
  records.forEach((record) => {
    if (typeof record?._id === 'string' && record._id.startsWith('placeholder_')) return
    const indicatorId = extractId(record?.indicator)
    if (indicatorId) recordsMap.set(indicatorId, record)
  })

  let sequenceNumber = 1
  categoriesWithIndicators.forEach((category) => {
    const categoryCode = category.code || category.id
    worksheet.getCell(currentRow, 1).value =
      `Category ${categoryCode} (${category.name || categoryCode})`
    worksheet.getCell(currentRow, 1).font = { bold: true }
    mergeCells(worksheet, currentRow, 1, currentRow, LAST_COL)
    worksheet.getCell(currentRow, 1).fill = fill(EXCEL_STYLES.lightBgColor)
    currentRow++

    ;(category.indicators || []).forEach((indicator, idx) => {
      const questionNumber = idx + 1 // as in the UI (ranking help per question)
      const record = recordsMap.get(indicator._id || indicator.id)
      worksheet.getCell(currentRow, 1).value = sequenceNumber++
      worksheet.getCell(currentRow, 1).alignment = { horizontal: 'center', vertical: 'top' }
      const cells = [
        indicator.name || indicator.indicator_name,
        indicator.definition || indicator.definition_text,
        indicator.measurement || indicator.measurement_unit,
        record?.scores?.baseline,
        record?.scores?.Q1,
        record?.scores?.Q2,
        record?.scores?.Q3,
        record?.scores?.Q4,
        record?.total,
        record?.final_assessment,
        record?.ranking
          ? getRankingDisplayLabel(
              record.ranking,
              categoryCode,
              questionNumber,
              IMPACT_LEVEL_CONFIG
            )
          : '',
        responsibleText(record),
        record?.note,
      ]
      let height = 30
      cells.forEach((value, i) => {
        const col = i + 2
        const text = safeString(value)
        const centred = col >= 5 && col <= 11
        setText(worksheet, currentRow, col, text, centred ? { horizontal: 'center' } : {})
        height = Math.max(height, rowHeight(text, WIDTHS[col - 1]))
      })
      worksheet.getRow(currentRow).height = height
      currentRow++
    })
  })

  applyBorders(worksheet, headerRow, 1, currentRow - 1, LAST_COL)
  return worksheet
}
