/**
 * Tool 3: Environmental and Social Management Activities Export
 */

import {
  createWorkbook,
  addAkfHeader,
  applyBorders,
  mergeCells,
  saveWorkbook,
  generateFileName,
  extractUserName,
  formatRecommendedActions,
  safeString,
  EXCEL_STYLES,
} from './excelBase'

/**
 * Export management activities to Excel
 * @param {Object} project - Project object
 * @param {Array} managementActivities - Management activities array
 */
export async function exportManagementActivitiesToExcel(project, managementActivities) {
  if (!project) {
    throw new Error('Project data is required')
  }

  // Ensure managementActivities is an array
  const activities = Array.isArray(managementActivities) ? managementActivities : []

  // Filter out any invalid activities (null, undefined, or empty objects)
  const validActivities = activities.filter((activity) => {
    return activity && typeof activity === 'object' && activity !== null
  })

  const workbook = createWorkbook()
  const worksheet = workbook.addWorksheet('Management Activities')

  let currentRow = 1

  // Header rows
  addAkfHeader(worksheet, currentRow, 'Tool 3')
  currentRow = 3

  // Row 3: Title
  worksheet.mergeCells(currentRow, 1, currentRow, 7)
  const titleCell = worksheet.getCell(currentRow, 1)
  titleCell.value =
    'Template for environmental and social management activities - Tool 3'
  titleCell.font = EXCEL_STYLES.titleFont
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  worksheet.getRow(currentRow).height = 20
  currentRow++

  // Row 4: Table headers
  const headers = [
    'S',
    'Activity description',
    'Potential Impact and Significance/Risk',
    'Recommended Action Items',
    'Monitoring requirements',
    'Responsibility',
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
  if (validActivities && validActivities.length > 0) {
    validActivities.forEach((activity) => {
      worksheet.getCell(currentRow, 1).value = activity.serial_number || ''
      worksheet.getCell(currentRow, 2).value = safeString(activity.activity_description)
      worksheet.getCell(currentRow, 3).value = safeString(activity.potential_impact)
      worksheet.getCell(currentRow, 4).value = formatRecommendedActions(
        activity.recommended_actions
      )
      worksheet.getCell(currentRow, 5).value = safeString(activity.monitoring_requirements)
      worksheet.getCell(currentRow, 6).value = extractUserName(activity.responsible)
      worksheet.getCell(currentRow, 7).value = safeString(activity.notes)

      // Set row height for better readability
      worksheet.getRow(currentRow).height = 30

      // Enable text wrapping for long content
      worksheet.getCell(currentRow, 2).alignment = { wrapText: true, vertical: 'top' }
      worksheet.getCell(currentRow, 3).alignment = { wrapText: true, vertical: 'top' }
      worksheet.getCell(currentRow, 4).alignment = { wrapText: true, vertical: 'top' }
      worksheet.getCell(currentRow, 5).alignment = { wrapText: true, vertical: 'top' }
      worksheet.getCell(currentRow, 7).alignment = { wrapText: true, vertical: 'top' }

      currentRow++
    })
  }

  // Apply borders
  const endRow = currentRow - 1
  if (endRow >= 4) {
    applyBorders(worksheet, 4, 1, endRow, 7)
  }

  // Set column widths
  worksheet.getColumn(1).width = 5 // S
  worksheet.getColumn(2).width = 40 // Activity description
  worksheet.getColumn(3).width = 40 // Potential Impact
  worksheet.getColumn(4).width = 40 // Recommended Actions
  worksheet.getColumn(5).width = 30 // Monitoring requirements
  worksheet.getColumn(6).width = 20 // Responsibility
  worksheet.getColumn(7).width = 30 // Notes

  // Generate file name and save
  const fileName = generateFileName(project?.title, 3, 'ManagementActivities')
  await saveWorkbook(workbook, fileName)
}
