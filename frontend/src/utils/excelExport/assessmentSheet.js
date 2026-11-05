/**
 * Tool 2: Project Environmental Assessment Form sheet (this repo's layout, D68).
 * Totals and the total impact are the app's (highest level scored, D54/D68).
 */

import {
  addAkfHeader,
  addInfoRows,
  addReviewSection,
  addTextRow,
  applyBorders,
  extractId,
  extractUserJobTitle,
  extractUserName,
  fill,
  formatDate,
  lastStatusDate,
  mergeCells,
  RECORD_STATUS_LABELS,
  rowHeight,
  safeString,
  setText,
  EXCEL_STYLES,
} from './excelBase'
import { assessmentMethods, consultationMethods } from '../assessmentMethods'
import { changedQuestionsSummary, PRIORITY_LEVELS } from '../impactCalculations'

export const ASSESSMENT_SHEET = 'Tool 2 Assessment'

const LEVELS = ['negligible', 'low', 'medium', 'high', 'not_applicable']
const LEVEL_LABELS = {
  negligible: 'Negligible',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  not_applicable: 'Not Applicable',
}
const LEVEL_COLS = [3, 4, 5, 6, 7]
const NOTE_COL = 8

/**
 * @param {import('exceljs').Workbook} workbook
 * @param {Object} data
 * @param {Object} data.project
 * @param {Object} [data.screening]
 * @param {Object} data.assessment
 * @param {Array} [data.methods]
 * @param {Array} [data.consultations]
 * @param {Array} [data.impactScores]
 * @param {Array} [data.categoriesWithQuestions] - useLookups().categoriesWithQuestions
 * @returns {import('exceljs').Worksheet}
 */
export function addAssessmentSheet(
  workbook,
  {
    project,
    screening,
    assessment,
    methods = [],
    consultations = [],
    impactScores = [],
    categoriesWithQuestions = [],
  }
) {
  if (!project || !assessment) throw new Error('Project and assessment data are required')
  const worksheet = workbook.addWorksheet(ASSESSMENT_SHEET)

  const widths = [24.57, 107.86, 12, 12, 12, 12, 12, 30, 15, 15]
  widths.forEach((width, i) => {
    worksheet.getColumn(i + 1).width = width
  })

  addAkfHeader(worksheet, 1, 'Tool 2')
  let currentRow = 3

  // Project, officer and status
  currentRow = addInfoRows(worksheet, currentRow, [
    [
      'Officer Name:',
      extractUserName(assessment.officer),
      'Position:',
      extractUserJobTitle(assessment.officer),
    ],
    ['Location:', project.location, 'Project Title:', project.title],
    ['Start Date:', formatDate(project.start_date), 'End Date:', formatDate(project.end_date)],
    [
      'Category (Tool 1):',
      screening?.category_code || 'N/A',
      'Status:',
      RECORD_STATUS_LABELS[assessment.status],
    ],
    ...(lastStatusDate(assessment, 'submitted')
      ? [['Submitted on:', lastStatusDate(assessment, 'submitted')]]
      : []),
  ])

  // Descriptions
  currentRow++
  ;[
    ['Component Assessed:', assessment.project_activity],
    ['Brief Description:', assessment.description],
    ['Environmental Setting:', assessment.environmental_setting],
    ['Legal Requirements:', assessment.legal_requirements],
  ].forEach(([label, text]) => {
    addTextRow(worksheet, currentRow, label, text)
    currentRow++
  })

  // Methods: YES/NO, label, details
  currentRow++
  sectionTitle(worksheet, currentRow, 'Assessment Methods Used:')
  currentRow++
  const methodsMap = new Map(methods.map((m) => [m.method_type, safeString(m.details)]))
  assessmentMethods.forEach((method) => {
    writeChecklistRow(worksheet, currentRow, methodsMap.has(method.id), method.label, [
      methodsMap.get(method.id) ? `Details: ${methodsMap.get(method.id)}` : '',
    ])
    currentRow++
  })

  // Consultations: YES/NO, label, participants and notes
  currentRow++
  sectionTitle(worksheet, currentRow, 'Community Consultation Methods:')
  currentRow++
  const consultationsMap = new Map(consultations.map((c) => [c.type, c]))
  consultationMethods.forEach((consultation) => {
    const data = consultationsMap.get(consultation.id)
    writeChecklistRow(worksheet, currentRow, !!data, consultation.label, [
      data?.participants ? `Participants: ${data.participants}` : '',
      data?.notes ? `Notes: ${data.notes}` : '',
    ])
    currentRow++
  })

  // Impact scores
  currentRow++
  const headerRow = currentRow
  ;['Category', 'Question', ...LEVELS.map((l) => LEVEL_LABELS[l]), 'Note'].forEach((text, i) => {
    const cell = worksheet.getCell(currentRow, i + 1)
    cell.value = text
    cell.font = { bold: true }
    cell.fill = fill(EXCEL_STYLES.lightBgColor)
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  })
  currentRow++

  const scoresMap = new Map()
  impactScores.forEach((score) => {
    const questionId = extractId(score.question)
    if (questionId) scoresMap.set(questionId, score)
  })
  const counted = Object.fromEntries(LEVELS.map((l) => [l, 0]))
  const questionIds = []

  categoriesWithQuestions.forEach((category) => {
    const categoryCode = category.code || category.id
    worksheet.getCell(currentRow, 1).value =
      `Category ${categoryCode} (${category.name || categoryCode})`
    worksheet.getCell(currentRow, 1).font = { bold: true }
    mergeCells(worksheet, currentRow, 1, currentRow, NOTE_COL)
    worksheet.getCell(currentRow, 1).fill = fill(EXCEL_STYLES.lightBgColor)
    currentRow++

    const categoryCount = Object.fromEntries(LEVELS.map((l) => [l, 0]))
    ;(category.questions || []).forEach((question, index) => {
      const questionId = question._id || question.id
      questionIds.push(questionId)
      const score = scoresMap.get(questionId)
      const text = safeString(question.question || question.question_text || question.text)

      worksheet.getCell(currentRow, 1).value = `${categoryCode}.${index + 1}`
      worksheet.getCell(currentRow, 1).alignment = { vertical: 'top' }
      setText(worksheet, currentRow, 2, text)

      if (score && LEVELS.includes(score.level)) {
        const col = LEVEL_COLS[LEVELS.indexOf(score.level)]
        const cell = worksheet.getCell(currentRow, col)
        cell.value = 'X'
        cell.alignment = { horizontal: 'center', vertical: 'top' }
        cell.fill = fill(EXCEL_STYLES.impactColors[score.level] || 'FFFFFFFF')
        categoryCount[score.level]++
        counted[score.level]++
      }
      setText(worksheet, currentRow, NOTE_COL, score?.note)
      worksheet.getRow(currentRow).height = Math.max(
        18,
        rowHeight(text, 107.86),
        rowHeight(score?.note, 30)
      )
      currentRow++
    })

    // Category total row
    worksheet.getCell(currentRow, 1).value = `Total Score - Category ${categoryCode}`
    LEVELS.forEach((level, i) => {
      worksheet.getCell(currentRow, LEVEL_COLS[i]).value = categoryCount[level]
      worksheet.getCell(currentRow, LEVEL_COLS[i]).alignment = { horizontal: 'center' }
    })
    for (let col = 1; col <= NOTE_COL; col++) {
      worksheet.getCell(currentRow, col).font = { bold: true }
      worksheet.getCell(currentRow, col).fill = fill(EXCEL_STYLES.lightBgColor)
    }
    currentRow++
  })

  // Summary (the app's totals)
  currentRow++
  const summaryStart = currentRow
  const totalScore = assessment.total_project_score || counted
  worksheet.getCell(currentRow, 1).value = 'TOTAL PROJECT SCORE'
  mergeCells(worksheet, currentRow, 1, currentRow, 2)
  LEVELS.forEach((level, i) => {
    worksheet.getCell(currentRow, LEVEL_COLS[i]).value = totalScore[level] || 0
    worksheet.getCell(currentRow, LEVEL_COLS[i]).alignment = { horizontal: 'center' }
  })
  for (let col = 1; col <= NOTE_COL; col++) {
    const cell = worksheet.getCell(currentRow, col)
    cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }
    cell.fill = fill(EXCEL_STYLES.headerBgColor)
  }
  currentRow++

  const scoredCount = questionIds.filter((id) => LEVELS.includes(scoresMap.get(id)?.level)).length
  const total = questionIds.length
  currentRow = addInfoRows(
    worksheet,
    currentRow,
    [
      [
        'All questions scored:',
        `${scoredCount === total && total > 0 ? 'YES' : 'NO'} (${scoredCount} of ${total})`,
      ],
      [
        'Changed from Negligible:',
        changedQuestionsSummary(
          questionIds,
          impactScores.map((s) => ({ question: extractId(s.question), level: s.level }))
        ),
      ],
    ],
    NOTE_COL
  )
  const impact =
    assessment.total_project_impact || PRIORITY_LEVELS.find((level) => counted[level] > 0)
  worksheet.getCell(currentRow, 1).value = 'TOTAL PROJECT IMPACT:'
  worksheet.getCell(currentRow, 1).font = { bold: true, size: 12 }
  worksheet.getCell(currentRow, 2).value = LEVEL_LABELS[impact] || 'Not calculated'
  worksheet.getCell(currentRow, 2).font = { bold: true, size: 12 }
  mergeCells(worksheet, currentRow, 2, currentRow, NOTE_COL)
  currentRow++
  applyBorders(worksheet, headerRow, 1, currentRow - 1, NOTE_COL)
  worksheet.getCell(summaryStart, 1).alignment = { vertical: 'middle' }

  // Potential impacts
  currentRow++
  addTextRow(
    worksheet,
    currentRow,
    'Potential Negative Impact:',
    assessment.potential_negative_impact
  )
  currentRow++
  addTextRow(
    worksheet,
    currentRow,
    'Potential Positive Impact:',
    assessment.potential_positive_impact
  )
  currentRow++

  // Approval (with recommendations) or rejection (with reason)
  const reviewStart = currentRow
  currentRow = addReviewSection(worksheet, currentRow, assessment, 10)

  applyBorders(worksheet, 3, 1, headerRow - 2, 10)
  if (currentRow > reviewStart) applyBorders(worksheet, reviewStart + 1, 1, currentRow - 1, 10)
  return worksheet
}

function sectionTitle(worksheet, row, text) {
  worksheet.getCell(row, 1).value = text
  worksheet.getCell(row, 1).font = { bold: true }
  worksheet.getCell(row, 1).fill = fill(EXCEL_STYLES.lightBgColor)
  mergeCells(worksheet, row, 1, row, 10)
}

// YES/NO in column 1, label in B:E, details in F:J
function writeChecklistRow(worksheet, row, selected, label, details) {
  worksheet.getCell(row, 1).value = selected ? 'YES' : 'NO'
  worksheet.getCell(row, 1).font = { bold: selected }
  worksheet.getCell(row, 1).alignment = { horizontal: 'center', vertical: 'top' }
  worksheet.getCell(row, 2).value = label
  worksheet.getCell(row, 2).alignment = { vertical: 'top', wrapText: true }
  mergeCells(worksheet, row, 2, row, 5)
  const text = details.filter(Boolean).join('\n')
  setText(worksheet, row, 6, text)
  mergeCells(worksheet, row, 6, row, 10)
  worksheet.getRow(row).height = Math.max(18, rowHeight(text, 30))
}
