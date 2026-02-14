/**
 * Tool 1: Environmental Integration Screening Tool Export
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
  formatDate,
  safeString,
  EXCEL_STYLES,
} from './excelBase'

/**
 * Export screening data to Excel
 * @param {Object} project - Project object
 * @param {Object} screening - Screening object
 */
export async function exportScreeningToExcel(project, screening) {
  if (!project || !screening) {
    throw new Error('Project and screening data are required')
  }

  const workbook = createWorkbook()
  const worksheet = workbook.addWorksheet('Screening')

  let currentRow = 1

  // Header rows
  addAkfHeader(worksheet, currentRow, 'Tool 1')
  currentRow = 3

  // Row 3: Title
  worksheet.mergeCells(currentRow, 1, currentRow, 10)
  const titleCell = worksheet.getCell(currentRow, 1)
  titleCell.value = 'ENVIRONMENTAL INTEGRATION SCREENING TOOL – SUMMARY TABLE'
  titleCell.font = EXCEL_STYLES.titleFont
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  worksheet.getRow(currentRow).height = 20
  currentRow++

  // Row 4: Project Title and Screening Date
  worksheet.getCell(currentRow, 1).value = 'Project Title:'
  worksheet.getCell(currentRow, 1).font = { bold: true }
  worksheet.getCell(currentRow, 2).value = safeString(project?.title)
  mergeCells(worksheet, currentRow, 2, currentRow, 3)

  worksheet.getCell(currentRow, 4).value = 'Screening Date:'
  worksheet.getCell(currentRow, 4).font = { bold: true }
  worksheet.getCell(currentRow, 5).value = formatDate(screening?.screening_date)
  mergeCells(worksheet, currentRow, 5, currentRow, 10)
  currentRow++

  // Row 5: Program Officer
  worksheet.getCell(currentRow, 1).value = 'Program Officer:'
  worksheet.getCell(currentRow, 1).font = { bold: true }
  worksheet.getCell(currentRow, 2).value = extractUserName(screening?.officer)
  mergeCells(worksheet, currentRow, 2, currentRow, 3)

  worksheet.getCell(currentRow, 4).value = 'Position:'
  worksheet.getCell(currentRow, 4).font = { bold: true }
  worksheet.getCell(currentRow, 5).value = extractUserJobTitle(screening?.officer)
  mergeCells(worksheet, currentRow, 5, currentRow, 10)
  currentRow++

  // Row 6: Project Components
  worksheet.getCell(currentRow, 1).value = 'Project Components/Activities:'
  worksheet.getCell(currentRow, 1).font = { bold: true }
  const componentValue =
    project?.project_component || project?.description || ''
  worksheet.getCell(currentRow, 2).value = safeString(componentValue)
  mergeCells(worksheet, currentRow, 2, currentRow, 10)
  currentRow++

  // Row 8: Category headers
  worksheet.getCell(currentRow, 1).value = 'Screening Project Category:'
  worksheet.getCell(currentRow, 1).font = { bold: true }
  

  worksheet.getCell(currentRow, 2).value = 'Assessment Result:'
  worksheet.getCell(currentRow, 2).font = { bold: true }
  mergeCells(worksheet, currentRow, 2, currentRow, 10)
  currentRow++

  // Row 9: Category explanation header
  worksheet.getCell(currentRow, 1).value = 'Indicate the category that best describes the project:'
  worksheet.getCell(currentRow, 1).font = { bold: true, italic: true }
  mergeCells(worksheet, currentRow, 1, currentRow, 10)
  currentRow++

  // Category rows (A-F)
  const categories = [
    {
      code: 'A',
      description:
        'High potential environmental risk',
    },
    {
      code: 'B',
      description:
        'Low to moderate environmental risk',
    },
    {
      code: 'C',
      description:
        'Negligible environmental risk',
    },
    {
      code: 'D',
      description:
        'Emergency cases and initiatives',
    },
    {
      code: 'E',
      description:
        'Not enough information.',
    },
    {
      code: 'F',
      description:
        'Positive Environmental Impact',
    },
  ]

  const selectedCategory = screening?.category_code

  categories.forEach((cat) => {
    const isSelected = cat.code === selectedCategory

    // Category code column
    worksheet.getCell(currentRow, 1).value = `Category ${cat.code}:`
    worksheet.getCell(currentRow, 1).font = { bold: true }
    if (isSelected) {
      worksheet.getCell(currentRow, 1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: EXCEL_STYLES.lightBgColor },
      }
    }

    // Description column
    worksheet.getCell(currentRow, 2).value = cat.description
    mergeCells(worksheet, currentRow, 2, currentRow, 10)
    if (isSelected) {
      worksheet.getCell(currentRow, 2).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: EXCEL_STYLES.lightBgColor },
      }
    }

    // Add reason if selected
    if (isSelected && screening?.category_reason) {
      currentRow++
      worksheet.getCell(currentRow, 2).value = `Why: ${safeString(screening.category_reason)}`
      mergeCells(worksheet, currentRow, 2, currentRow, 10)
      worksheet.getCell(currentRow, 2).font = { italic: true }
      if (isSelected) {
        worksheet.getCell(currentRow, 2).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: EXCEL_STYLES.lightBgColor },
        }
      }
    }

    currentRow++
  })

  // Potential Negative Impact
  worksheet.getCell(currentRow, 1).value = 'Potential Negative Impact:'
  worksheet.getCell(currentRow, 1).font = { bold: true }
  worksheet.getCell(currentRow, 2).value = safeString(screening?.potential_negative)
  mergeCells(worksheet, currentRow, 2, currentRow, 10)
  worksheet.getRow(currentRow).height = 40
  worksheet.getCell(currentRow, 2).alignment = { vertical: 'top', wrapText: true }
  currentRow++

  // Potential Positive Impact
  worksheet.getCell(currentRow, 1).value = 'Potential Positive Impact:'
  worksheet.getCell(currentRow, 1).font = { bold: true }
  worksheet.getCell(currentRow, 2).value = safeString(screening?.potential_positive)
  mergeCells(worksheet, currentRow, 2, currentRow, 10)
  worksheet.getRow(currentRow).height = 40
  worksheet.getCell(currentRow, 2).alignment = { vertical: 'top', wrapText: true }
  currentRow++

  // Approval section (only if approved)
  if (screening?.status === 'approved') {
    worksheet.getCell(currentRow, 1).value = 'The Approval and Recommendations by:'
    worksheet.getCell(currentRow, 1).font = { bold: true }
    mergeCells(worksheet, currentRow, 1, currentRow, 10)
    currentRow++

    worksheet.getCell(currentRow, 1).value = 'Name:'
    worksheet.getCell(currentRow, 1).font = { bold: true }
    worksheet.getCell(currentRow, 2).value = extractUserName(screening?.approved_by)
    mergeCells(worksheet, currentRow, 2, currentRow, 4)

    worksheet.getCell(currentRow, 5).value = 'Position:'
    worksheet.getCell(currentRow, 5).font = { bold: true }
    worksheet.getCell(currentRow, 6).value = extractUserJobTitle(screening?.approved_by)
    mergeCells(worksheet, currentRow, 6, currentRow, 10)
    currentRow++

    worksheet.getCell(currentRow, 1).value = 'Recommendations:'
    worksheet.getCell(currentRow, 1).font = { bold: true }
    worksheet.getCell(currentRow, 2).value = safeString(screening?.recommendations)
    mergeCells(worksheet, currentRow, 2, currentRow, 10)
    worksheet.getRow(currentRow).height = 40
    worksheet.getCell(currentRow, 2).alignment = { vertical: 'top', wrapText: true }
  }

  // Apply borders to data cells
  applyBorders(worksheet, 4, 1, currentRow, 10)

  // Set column widths
  worksheet.getColumn(1).width = 28.57
  worksheet.getColumn(2).width = 50
  for (let i = 3; i <= 10; i++) {
    worksheet.getColumn(i).width = 15
  }

  // Generate file name and save
  const fileName = generateFileName(project?.title, 1, 'Screening')
  await saveWorkbook(workbook, fileName)
}
