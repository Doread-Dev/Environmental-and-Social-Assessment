/**
 * Tool 5: Environmental Checklist and Evaluation Tool (Monitoring) Export
 */

import {
  createWorkbook,
  addAkfHeader,
  applyBorders,
  mergeCells,
  saveWorkbook,
  generateFileName,
  extractUserName,
  extractUserJobTitle,
  extractId,
  formatDate,
  safeString,
  EXCEL_STYLES,
} from './excelBase'
import { getRankingDisplayLabel } from '@/data/rankingHelp'
import { impactLevels } from '@/data/impactCategories'

/**
 * Export monitoring data to Excel
 * @param {Object} project - Project object
 * @param {Object} screening - Screening object (may be null)
 * @param {Object} assessment - Assessment object
 * @param {Array} monitoringRecords - Monitoring records array
 * @param {Array} categoriesWithIndicators - Categories with indicators from lookups
 */
export async function exportMonitoringToExcel(
  project,
  screening,
  assessment,
  monitoringRecords,
  categoriesWithIndicators
) {
  if (!project || !assessment) {
    throw new Error('Project and assessment data are required')
  }

  const workbook = createWorkbook()
  const worksheet = workbook.addWorksheet('Monitoring')

  let currentRow = 1

  // Header rows
  addAkfHeader(worksheet, currentRow, 'Tool 5')
  currentRow = 3

  // Project & Officer Information
  worksheet.getCell(currentRow, 1).value = 'Officer Name:'
  worksheet.getCell(currentRow, 1).font = { bold: true }
  worksheet.getCell(currentRow, 2).value = extractUserName(assessment?.officer)
  mergeCells(worksheet, currentRow, 2, currentRow, 3)

  worksheet.getCell(currentRow, 4).value = 'Position:'
  worksheet.getCell(currentRow, 4).font = { bold: true }
  worksheet.getCell(currentRow, 5).value = extractUserJobTitle(assessment?.officer)
  mergeCells(worksheet, currentRow, 5, currentRow, 6)
  currentRow++

  worksheet.getCell(currentRow, 1).value = 'Project Title:'
  worksheet.getCell(currentRow, 1).font = { bold: true }
  worksheet.getCell(currentRow, 2).value = safeString(project?.title)
  mergeCells(worksheet, currentRow, 2, currentRow, 3)

  worksheet.getCell(currentRow, 4).value = 'Location:'
  worksheet.getCell(currentRow, 4).font = { bold: true }
  worksheet.getCell(currentRow, 5).value = safeString(project?.location)
  mergeCells(worksheet, currentRow, 5, currentRow, 6)
  currentRow++

  worksheet.getCell(currentRow, 1).value = 'Start Date:'
  worksheet.getCell(currentRow, 1).font = { bold: true }
  worksheet.getCell(currentRow, 2).value = formatDate(project?.start_date)
  mergeCells(worksheet, currentRow, 2, currentRow, 3)

  worksheet.getCell(currentRow, 4).value = 'End Date:'
  worksheet.getCell(currentRow, 4).font = { bold: true }
  worksheet.getCell(currentRow, 5).value = formatDate(project?.end_date)
  mergeCells(worksheet, currentRow, 5, currentRow, 6)
  currentRow++

  worksheet.getCell(currentRow, 1).value = 'Category:'
  worksheet.getCell(currentRow, 1).font = { bold: true }
  worksheet.getCell(currentRow, 2).value = safeString(screening?.category_code || 'N/A')
  mergeCells(worksheet, currentRow, 2, currentRow, 3)
  currentRow++

  // Table headers (Row 8)
  currentRow++
  const headers = [
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

  headers.forEach((header, index) => {
    const cell = worksheet.getCell(currentRow, index + 1)
    cell.value = header
    cell.font = { bold: true }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: EXCEL_STYLES.headerBgColor },
    }
    cell.font.color = { argb: 'FFFFFFFF' }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  })

  worksheet.getRow(currentRow).height = 30
  currentRow++

  // Create a map of records by indicator ID (skip placeholders)
  const recordsMap = new Map()
  monitoringRecords.forEach((record) => {
    // Skip placeholder records
    if (record._id && typeof record._id === 'string' && record._id.startsWith('placeholder_')) {
      return
    }

    const indicatorId = extractId(record.indicator)
    if (indicatorId) {
      recordsMap.set(indicatorId, record)
    }
  })

  // Process each category
  let sequenceNumber = 1

  categoriesWithIndicators.forEach((category) => {
    const categoryCode = category.code || category.id
    const categoryName = category.name || categoryCode

    // Category header
    worksheet.getCell(currentRow, 1).value = `Category ${categoryCode} (${categoryName})`
    worksheet.getCell(currentRow, 1).font = { bold: true }
    mergeCells(worksheet, currentRow, 1, currentRow, 14)
    worksheet.getCell(currentRow, 1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: EXCEL_STYLES.lightBgColor },
    }
    currentRow++

    // Indicators in this category (questionNumber = 1-based index, as in UI)
    const indicators = category.indicators || []
    indicators.forEach((indicator, idx) => {
      const questionNumber = idx + 1
      const indicatorId = indicator._id || indicator.id
      const record = recordsMap.get(indicatorId)

      // Sequence number
      worksheet.getCell(currentRow, 1).value = sequenceNumber++

      // Indicator name
      worksheet.getCell(currentRow, 2).value = safeString(
        indicator.name || indicator.indicator_name
      )

      // Definition
      worksheet.getCell(currentRow, 3).value = safeString(
        indicator.definition || indicator.definition_text
      )

      // Measurement
      worksheet.getCell(currentRow, 4).value = safeString(
        indicator.measurement || indicator.measurement_unit
      )

      // Scores (Baseline, Q1-Q4)
      if (record && record.scores) {
        worksheet.getCell(currentRow, 5).value = safeString(record.scores.baseline || '')
        worksheet.getCell(currentRow, 6).value = safeString(record.scores.Q1 || '')
        worksheet.getCell(currentRow, 7).value = safeString(record.scores.Q2 || '')
        worksheet.getCell(currentRow, 8).value = safeString(record.scores.Q3 || '')
        worksheet.getCell(currentRow, 9).value = safeString(record.scores.Q4 || '')
      }

      // Total
      if (record) {
        worksheet.getCell(currentRow, 10).value = safeString(record.total || '')
      }

      // Score (final_assessment)
      if (record) {
        worksheet.getCell(currentRow, 11).value = safeString(record.final_assessment || '')
      }

      // Ranking (with description in parentheses, e.g. "High (frequently visible)")
      if (record && record.ranking) {
        const rankingDisplay = getRankingDisplayLabel(
          record.ranking,
          categoryCode,
          questionNumber,
          impactLevels
        )
        worksheet.getCell(currentRow, 12).value = safeString(rankingDisplay)
      } else if (record) {
        worksheet.getCell(currentRow, 12).value = ''
      }

      // Responsibility
      if (record) {
        worksheet.getCell(currentRow, 13).value = extractUserName(record.responsible)
      }

      // Note
      if (record) {
        worksheet.getCell(currentRow, 14).value = safeString(record.note || '')
      }

      // Set row height and text wrapping
      worksheet.getRow(currentRow).height = 30
      worksheet.getCell(currentRow, 2).alignment = { wrapText: true, vertical: 'top' }
      worksheet.getCell(currentRow, 3).alignment = { wrapText: true, vertical: 'top' }
      worksheet.getCell(currentRow, 4).alignment = { wrapText: true, vertical: 'top' }
      worksheet.getCell(currentRow, 14).alignment = { wrapText: true, vertical: 'top' }

      currentRow++
    })
  })

  // Apply borders
  const endRow = currentRow - 1
  if (endRow >= 8) {
    applyBorders(worksheet, 8, 1, endRow, 14)
  }

  // Set column widths
  worksheet.getColumn(1).width = 5 // S
  worksheet.getColumn(2).width = 40 // Indicator
  worksheet.getColumn(3).width = 50 // Definition
  worksheet.getColumn(4).width = 40 // Measurement
  worksheet.getColumn(5).width = 12 // Baseline
  worksheet.getColumn(6).width = 12 // Q1
  worksheet.getColumn(7).width = 12 // Q2
  worksheet.getColumn(8).width = 12 // Q3
  worksheet.getColumn(9).width = 12 // Q4
  worksheet.getColumn(10).width = 10 // Total
  worksheet.getColumn(11).width = 10 // Score
  worksheet.getColumn(12).width = 28 // Ranking (e.g. "High (frequently visible)")
  worksheet.getColumn(13).width = 20 // Responsibility
  worksheet.getColumn(14).width = 30 // Note

  // Generate file name and save
  const fileName = generateFileName(project?.title, 5, 'Monitoring')
  await saveWorkbook(workbook, fileName)
}
