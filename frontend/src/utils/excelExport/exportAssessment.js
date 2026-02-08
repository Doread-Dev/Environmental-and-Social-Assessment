/**
 * Tool 2: Project Environmental Assessment Form Export
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
import { assessmentMethods, consultationMethods } from '@/data/assessmentMethods'

/**
 * Export assessment data to Excel
 * @param {Object} project - Project object
 * @param {Object} screening - Screening object (may be null)
 * @param {Object} assessment - Assessment object
 * @param {Array} methods - Assessment methods array
 * @param {Array} consultations - Community consultations array
 * @param {Array} impactScores - Impact scores array
 * @param {Array} categoriesWithQuestions - Categories with questions from lookups
 */
export async function exportAssessmentToExcel(
  project,
  screening,
  assessment,
  methods,
  consultations,
  impactScores,
  categoriesWithQuestions
) {
  if (!project || !assessment) {
    throw new Error('Project and assessment data are required')
  }

  const workbook = createWorkbook()
  const worksheet = workbook.addWorksheet('Assessment')

  let currentRow = 1

  // Header rows
  addAkfHeader(worksheet, currentRow, 'Tool 2')
  currentRow = 3

  // Row 3: Project & Officer Information
  worksheet.getCell(currentRow, 1).value = 'Officer Name:'
  worksheet.getCell(currentRow, 1).font = { bold: true }
  worksheet.getCell(currentRow, 2).value = extractUserName(assessment?.officer)
  mergeCells(worksheet, currentRow, 2, currentRow, 3)

  worksheet.getCell(currentRow, 4).value = 'Position:'
  worksheet.getCell(currentRow, 4).font = { bold: true }
  worksheet.getCell(currentRow, 5).value = extractUserJobTitle(assessment?.officer)
  mergeCells(worksheet, currentRow, 5, currentRow, 6)
  currentRow++

  worksheet.getCell(currentRow, 1).value = 'Location:'
  worksheet.getCell(currentRow, 1).font = { bold: true }
  worksheet.getCell(currentRow, 2).value = safeString(project?.location)
  mergeCells(worksheet, currentRow, 2, currentRow, 3)

  worksheet.getCell(currentRow, 4).value = 'Project Title:'
  worksheet.getCell(currentRow, 4).font = { bold: true }
  worksheet.getCell(currentRow, 5).value = safeString(project?.title)
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

  // Descriptions section
  currentRow++
  worksheet.getCell(currentRow, 1).value = 'Component Assessed:'
  worksheet.getCell(currentRow, 1).font = { bold: true }
  worksheet.getCell(currentRow, 2).value = safeString(assessment?.project_activity)
  mergeCells(worksheet, currentRow, 2, currentRow, 10)
  worksheet.getRow(currentRow).height = 30
  worksheet.getCell(currentRow, 2).alignment = { vertical: 'top', wrapText: true }
  currentRow++

  worksheet.getCell(currentRow, 1).value = 'Brief Description:'
  worksheet.getCell(currentRow, 1).font = { bold: true }
  worksheet.getCell(currentRow, 2).value = safeString(assessment?.description)
  mergeCells(worksheet, currentRow, 2, currentRow, 10)
  worksheet.getRow(currentRow).height = 50
  worksheet.getCell(currentRow, 2).alignment = { vertical: 'top', wrapText: true }
  currentRow++

  worksheet.getCell(currentRow, 1).value = 'Environmental Setting:'
  worksheet.getCell(currentRow, 1).font = { bold: true }
  worksheet.getCell(currentRow, 2).value = safeString(assessment?.environmental_setting)
  mergeCells(worksheet, currentRow, 2, currentRow, 10)
  worksheet.getRow(currentRow).height = 40
  worksheet.getCell(currentRow, 2).alignment = { vertical: 'top', wrapText: true }
  currentRow++

  worksheet.getCell(currentRow, 1).value = 'Legal Requirements:'
  worksheet.getCell(currentRow, 1).font = { bold: true }
  worksheet.getCell(currentRow, 2).value = safeString(assessment?.legal_requirements)
  mergeCells(worksheet, currentRow, 2, currentRow, 10)
  worksheet.getRow(currentRow).height = 40
  worksheet.getCell(currentRow, 2).alignment = { vertical: 'top', wrapText: true }
  currentRow++

  // Methods section
  currentRow++
  worksheet.getCell(currentRow, 1).value = 'Assessment Methods Used:'
  worksheet.getCell(currentRow, 1).font = { bold: true }
  mergeCells(worksheet, currentRow, 1, currentRow, 10)
  currentRow++

  // Create a map of selected methods
  const methodsMap = new Map()
  methods.forEach((m) => {
    methodsMap.set(m.method_type, m.details || '')
  })

  assessmentMethods.forEach((method) => {
    const isSelected = methodsMap.has(method.id)
    const details = methodsMap.get(method.id) || ''

    worksheet.getCell(currentRow, 1).value = isSelected ? 'YES' : 'NO'
    worksheet.getCell(currentRow, 2).value = method.label
    mergeCells(worksheet, currentRow, 2, currentRow, 5)

    if (details) {
      worksheet.getCell(currentRow, 6).value = `Details: ${details}`
      mergeCells(worksheet, currentRow, 6, currentRow, 10)
    }

    currentRow++
  })

  // Consultations section
  currentRow++
  worksheet.getCell(currentRow, 1).value = 'Community Consultation Methods:'
  worksheet.getCell(currentRow, 1).font = { bold: true }
  mergeCells(worksheet, currentRow, 1, currentRow, 10)
  currentRow++

  const consultationsMap = new Map()
  consultations.forEach((c) => {
    consultationsMap.set(c.type, {
      participants: c.participants || '',
      notes: c.notes || '',
    })
  })

  consultationMethods.forEach((consultation) => {
    const isSelected = consultationsMap.has(consultation.id)
    const data = consultationsMap.get(consultation.id) || { participants: '', notes: '' }

    worksheet.getCell(currentRow, 1).value = isSelected ? 'YES' : 'NO'
    worksheet.getCell(currentRow, 2).value = consultation.label
    mergeCells(worksheet, currentRow, 2, currentRow, 5)

    if (data.participants) {
      worksheet.getCell(currentRow, 6).value = `Participants: ${data.participants}`
      mergeCells(worksheet, currentRow, 6, currentRow, 10)
    }

    currentRow++
  })

  // Impact Scores Section
  currentRow++
  worksheet.getCell(currentRow, 1).value = 'Category'
  worksheet.getCell(currentRow, 2).value = 'Question'
  worksheet.getCell(currentRow, 3).value = 'Negligible'
  worksheet.getCell(currentRow, 4).value = 'Low'
  worksheet.getCell(currentRow, 5).value = 'Medium'
  worksheet.getCell(currentRow, 6).value = 'High'
  worksheet.getCell(currentRow, 7).value = 'N/A'
  worksheet.getCell(currentRow, 8).value = 'Note'

  // Style header row
  for (let col = 1; col <= 8; col++) {
    const cell = worksheet.getCell(currentRow, col)
    cell.font = { bold: true }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: EXCEL_STYLES.lightBgColor },
    }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  }
  mergeCells(worksheet, currentRow, 2, currentRow, 2) // Question column spans B-E in template, but we'll use B only
  currentRow++

  // Create a map of scores by question ID
  const scoresMap = new Map()
  impactScores.forEach((score) => {
    const questionId = extractId(score.question)
    if (questionId) {
      scoresMap.set(questionId, score)
    }
  })

  // Process each category
  const categoryTotals = {
    negligible: 0,
    low: 0,
    medium: 0,
    high: 0,
    not_applicable: 0,
  }

  categoriesWithQuestions.forEach((category) => {
    const categoryCode = category.code || category.id
    const categoryName = category.name || categoryCode

    // Category header
    worksheet.getCell(currentRow, 1).value = `Category ${categoryCode} (${categoryName})`
    worksheet.getCell(currentRow, 1).font = { bold: true }
    mergeCells(worksheet, currentRow, 1, currentRow, 8)
    worksheet.getCell(currentRow, 1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: EXCEL_STYLES.lightBgColor },
    }
    currentRow++

    // Questions in this category
    const questions = category.questions || []
    let categoryCount = {
      negligible: 0,
      low: 0,
      medium: 0,
      high: 0,
      not_applicable: 0,
    }

    questions.forEach((question, index) => {
      const questionId = question._id || question.id
      const score = scoresMap.get(questionId)

      // Question number and text
      worksheet.getCell(currentRow, 1).value = `${categoryCode}.${index + 1}`
      // Note: In categoriesWithQuestions, the field is "question" not "question_text"
      worksheet.getCell(currentRow, 2).value = safeString(
        question.question || question.question_text || question.text
      )
      mergeCells(worksheet, currentRow, 2, currentRow, 2)

      // Impact level columns
      const levels = ['negligible', 'low', 'medium', 'high', 'not_applicable']
      const levelCols = [3, 4, 5, 6, 7]

      if (score) {
        levels.forEach((level, idx) => {
          const cell = worksheet.getCell(currentRow, levelCols[idx])
          if (score.level === level) {
            cell.value = 'X'
            cell.alignment = { horizontal: 'center' }
            // Apply color based on level
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: EXCEL_STYLES.impactColors[level] || 'FFFFFFFF' },
            }
            categoryCount[level]++
            categoryTotals[level]++
          }
        })

        // Note column
        if (score.note) {
          worksheet.getCell(currentRow, 8).value = safeString(score.note)
        }
      }

      currentRow++
    })

    // Category total row
    worksheet.getCell(currentRow, 1).value = `Total Score - Category ${categoryCode}`
    worksheet.getCell(currentRow, 1).font = { bold: true }
    worksheet.getCell(currentRow, 3).value = categoryCount.negligible
    worksheet.getCell(currentRow, 4).value = categoryCount.low
    worksheet.getCell(currentRow, 5).value = categoryCount.medium
    worksheet.getCell(currentRow, 6).value = categoryCount.high
    worksheet.getCell(currentRow, 7).value = categoryCount.not_applicable

    // Style total row
    for (let col = 1; col <= 8; col++) {
      worksheet.getCell(currentRow, col).font = { bold: true }
      worksheet.getCell(currentRow, col).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: EXCEL_STYLES.lightBgColor },
      }
    }
    currentRow++
  })

  // Summary section
  currentRow++
  worksheet.getCell(currentRow, 1).value = 'TOTAL PROJECT SCORE'
  worksheet.getCell(currentRow, 1).font = { bold: true, size: 12 }
  mergeCells(worksheet, currentRow, 1, currentRow, 2)

  const totalScore = assessment?.total_project_score || categoryTotals
  worksheet.getCell(currentRow, 3).value = totalScore.negligible || 0
  worksheet.getCell(currentRow, 4).value = totalScore.low || 0
  worksheet.getCell(currentRow, 5).value = totalScore.medium || 0
  worksheet.getCell(currentRow, 6).value = totalScore.high || 0
  worksheet.getCell(currentRow, 7).value = totalScore.not_applicable || 0

  // Style summary row
  for (let col = 1; col <= 8; col++) {
    const cell = worksheet.getCell(currentRow, col)
    cell.font = { bold: true, size: 12 }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: EXCEL_STYLES.headerBgColor },
    }
    cell.font.color = { argb: 'FFFFFFFF' }
  }
  currentRow++

  // Completion status
  worksheet.getCell(currentRow, 1).value = 'Is it Complete:'
  worksheet.getCell(currentRow, 1).font = { bold: true }
  worksheet.getCell(currentRow, 2).value = assessment?.status === 'approved' ? 'YES' : 'NO'
  mergeCells(worksheet, currentRow, 2, currentRow, 3)
  currentRow++

  // Total Impact
  worksheet.getCell(currentRow, 1).value = 'TOTAL PROJECT IMPACT:'
  worksheet.getCell(currentRow, 1).font = { bold: true, size: 12 }
  const totalImpact = assessment?.total_project_impact || 'not_applicable'
  worksheet.getCell(currentRow, 2).value = totalImpact.toUpperCase()
  worksheet.getCell(currentRow, 2).font = { bold: true, size: 12 }
  mergeCells(worksheet, currentRow, 2, currentRow, 3)
  currentRow++

  // Potential Impacts
  currentRow++
  worksheet.getCell(currentRow, 1).value = 'Potential Negative Impact:'
  worksheet.getCell(currentRow, 1).font = { bold: true }
  worksheet.getCell(currentRow, 2).value = safeString(assessment?.potential_negative_impact)
  mergeCells(worksheet, currentRow, 2, currentRow, 10)
  worksheet.getRow(currentRow).height = 50
  worksheet.getCell(currentRow, 2).alignment = { vertical: 'top', wrapText: true }
  currentRow++

  worksheet.getCell(currentRow, 1).value = 'Potential Positive Impact:'
  worksheet.getCell(currentRow, 1).font = { bold: true }
  worksheet.getCell(currentRow, 2).value = safeString(assessment?.potential_positive_impact)
  mergeCells(worksheet, currentRow, 2, currentRow, 10)
  worksheet.getRow(currentRow).height = 50
  worksheet.getCell(currentRow, 2).alignment = { vertical: 'top', wrapText: true }
  currentRow++

  // Approval section (only if approved)
  if (assessment?.status === 'approved') {
    currentRow++
    worksheet.getCell(currentRow, 1).value = 'The Approval and Recommendations by:'
    worksheet.getCell(currentRow, 1).font = { bold: true }
    mergeCells(worksheet, currentRow, 1, currentRow, 10)
    currentRow++

    worksheet.getCell(currentRow, 1).value = 'Name:'
    worksheet.getCell(currentRow, 1).font = { bold: true }
    worksheet.getCell(currentRow, 2).value = extractUserName(assessment?.approved_by)
    mergeCells(worksheet, currentRow, 2, currentRow, 4)

    worksheet.getCell(currentRow, 5).value = 'Position:'
    worksheet.getCell(currentRow, 5).font = { bold: true }
    worksheet.getCell(currentRow, 6).value = extractUserJobTitle(assessment?.approved_by)
    mergeCells(worksheet, currentRow, 6, currentRow, 10)
    currentRow++

    worksheet.getCell(currentRow, 1).value = 'Recommendations:'
    worksheet.getCell(currentRow, 1).font = { bold: true }
    worksheet.getCell(currentRow, 2).value = safeString(assessment?.recommendations)
    mergeCells(worksheet, currentRow, 2, currentRow, 10)
    worksheet.getRow(currentRow).height = 40
    worksheet.getCell(currentRow, 2).alignment = { vertical: 'top', wrapText: true }
  }

  // Apply borders
  applyBorders(worksheet, 3, 1, currentRow, 10)

  // Set column widths
  worksheet.getColumn(1).width = 15
  worksheet.getColumn(2).width = 107.86
  worksheet.getColumn(3).width = 12
  worksheet.getColumn(4).width = 12
  worksheet.getColumn(5).width = 12
  worksheet.getColumn(6).width = 12
  worksheet.getColumn(7).width = 12
  worksheet.getColumn(8).width = 30
  worksheet.getColumn(9).width = 15
  worksheet.getColumn(10).width = 15

  // Generate file name and save
  const fileName = generateFileName(project?.title, 2, 'Assessment')
  await saveWorkbook(workbook, fileName)
}
