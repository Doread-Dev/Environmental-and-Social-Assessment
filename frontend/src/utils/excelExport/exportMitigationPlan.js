/**
 * Tool 4: Environmental and Social Impact Mitigation Plan Export
 */

import {
  createWorkbook,
  addAkfHeader,
  applyBorders,
  mergeCells,
  saveWorkbook,
  generateFileName,
  extractUserName,
  safeString,
  EXCEL_STYLES,
} from './excelBase'

/**
 * Export mitigation plans to Excel
 * @param {Object} project - Project object
 * @param {Array} mitigationPlans - Mitigation plans array
 */
export async function exportMitigationPlanToExcel(project, mitigationPlans) {
  if (!project) {
    throw new Error('Project data is required')
  }

  const workbook = createWorkbook()
  const worksheet = workbook.addWorksheet('Mitigation Plan')

  let currentRow = 1

  // Header rows
  addAkfHeader(worksheet, currentRow, 'Tool 4')
  currentRow = 3

  // Row 3: Title
  worksheet.mergeCells(currentRow, 1, currentRow, 8)
  const titleCell = worksheet.getCell(currentRow, 1)
  titleCell.value =
    'Environmental and social impact assessment and mitigation plan - Tool 4'
  titleCell.font = EXCEL_STYLES.titleFont
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  worksheet.getRow(currentRow).height = 20
  currentRow++

  // Row 4: Table headers
  const headers = [
    'S',
    'Output or Activity description',
    'Potential Impact and Significance/Risk of each- low-med-high Including climate-related risksr',
    'Mitigation and enhancement measures',
    'Monitoring',
    'Responsibility',
    'Schedule',
    'Notes',
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

  // Data rows
  if (mitigationPlans && mitigationPlans.length > 0) {
    mitigationPlans.forEach((plan) => {
      worksheet.getCell(currentRow, 1).value = plan.serial_number || ''
      worksheet.getCell(currentRow, 2).value = safeString(plan.output_description)
      worksheet.getCell(currentRow, 3).value = safeString(
        plan.potential_impact_and_significance
      )
      worksheet.getCell(currentRow, 4).value = safeString(
        plan.mitigation_and_enhancement_measures
      )
      worksheet.getCell(currentRow, 5).value = safeString(plan.monitoring)
      worksheet.getCell(currentRow, 6).value = extractUserName(plan.responsible)
      worksheet.getCell(currentRow, 7).value = safeString(plan.schedule)
      worksheet.getCell(currentRow, 8).value = safeString(plan.notes)

      // Set row height for better readability
      worksheet.getRow(currentRow).height = 30

      // Enable text wrapping for long content
      worksheet.getCell(currentRow, 2).alignment = { wrapText: true, vertical: 'top' }
      worksheet.getCell(currentRow, 3).alignment = { wrapText: true, vertical: 'top' }
      worksheet.getCell(currentRow, 4).alignment = { wrapText: true, vertical: 'top' }
      worksheet.getCell(currentRow, 5).alignment = { wrapText: true, vertical: 'top' }
      worksheet.getCell(currentRow, 7).alignment = { wrapText: true, vertical: 'top' }
      worksheet.getCell(currentRow, 8).alignment = { wrapText: true, vertical: 'top' }

      currentRow++
    })
  }

  // Apply borders
  const endRow = currentRow - 1
  if (endRow >= 4) {
    applyBorders(worksheet, 4, 1, endRow, 8)
  }

  // Set column widths
  worksheet.getColumn(1).width = 5 // S
  worksheet.getColumn(2).width = 40 // Output description
  worksheet.getColumn(3).width = 40 // Potential Impact
  worksheet.getColumn(4).width = 40 // Mitigation measures
  worksheet.getColumn(5).width = 30 // Monitoring
  worksheet.getColumn(6).width = 20 // Responsibility
  worksheet.getColumn(7).width = 20 // Schedule
  worksheet.getColumn(8).width = 30 // Notes

  // Generate file name and save
  const fileName = generateFileName(project?.title, 4, 'MitigationPlan')
  await saveWorkbook(workbook, fileName)
}
