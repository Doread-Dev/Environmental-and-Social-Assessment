/**
 * Tool 2 — Project Environmental Assessment Form, official sheet "Tool 2" (D52).
 *
 * Ported from the v2 builder and aligned with the official sheet: widths (L and M hidden),
 * merges (label A:C / mark D / label E:H / mark I:K in the method grids, one Note cell K per
 * domain), fills and fonts, and the official formulas (per-question check in M, domain counts,
 * summary, total, "Is it Complete"). One difference on purpose: TOTAL PROJECT IMPACT uses the
 * app's rule (the highest level scored, as the backend computes it), not the official sheet's
 * "most frequent level" formula.
 */

import { calculateDurationMonths, formatDuration } from '../formatters'
import {
  BLACK,
  WHITE,
  OFFICIAL,
  box,
  labelled,
  longDate,
  merge,
  paint,
  put,
  rowHeight,
  safeString,
  setWidths,
  spanWidth,
  textAlignment,
  userJobTitle,
  userName,
  idOf,
} from './sheetKit'

const WIDTHS = {
  1: 3.453125,
  2: 15.1796875,
  3: 22.26953125,
  4: 38.453125,
  5: 43.81640625,
  6: 17.6328125,
  7: 17.6328125,
  8: 17.6328125,
  9: 17.6328125,
  10: 17.6328125,
  11: 17.6328125,
  12: 0,
  13: 0,
}
const LAST = 11

export const LEVELS = ['negligible', 'low', 'medium', 'high', 'not_applicable']
const LEVEL_LABELS = ['Negligible', 'Low', 'Medium', 'High', 'Not Applicable']
const FIRST_LEVEL_COL = 6 // F..J
const col = (n) => String.fromCharCode(64 + n)

// Official domain order and headings (J comes before H in the official sheet)
const DOMAIN_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'J', 'H']
const DOMAIN_HEADER = {
  A: 'A. Air quality',
  B: 'B. Water quality',
  C: 'C. The quality and effect of noise',
  D: 'D. Solid waste effect ',
  E: 'E. Radiation effect:',
  F: 'F. Toxic and Dangerous Materials effect',
  J: 'J_The Environmental impacts on natural plants, forests, and wildlife, include the following questions:',
  H: 'H. Environmental impacts of land use and management',
}
const DOMAIN_SUMMARY = {
  A: 'A_Air quality: It includes the following questions:',
  B: 'B_Water quality includes the following questions:',
  C: 'C_The quality and effect of noise, include the following questions:',
  D: 'D_The solid waste effect includes the following questions:',
  E: 'E_The Radiation effect includes the following questions:',
  F: 'F_The Toxic and Dangerous Materials effect includes the following questions:',
  J: 'J_The Environmental impacts on natural plants, forests, and wildlife, include the following questions:',
  H: 'H_Environmental impacts of land use and management, It includes the following questions:',
}

// Method grid (rows 21–24) and consultation grid (rows 26–27): label A:C, mark D, label E:H,
// mark I:K
const METHODS_GRID = [
  ['Field visits', 'field_visits', 'Previous Environmental Assessments', 'previous_assessments'],
  [
    'Available Technical reports',
    'technical_reports',
    'Consultation with specialists: who?',
    'specialist_consultation',
  ],
  ['Project team meeting(s)', 'project_meetings', 'Other methods: list here', 'other'],
  ['AKFS Environmental Guidelines', 'akfs_guidelines', null, null],
]
const CONSULTATION_GRID = [
  [
    'Interviews with community members. who?',
    'community_interviews',
    'Village (sites), meeting(s): if so, who, how many, and where?',
    'village_meetings',
  ],
  [
    'Other community consultation: list here',
    'other_consultation',
    'Consultation with Village (sites) Committees: who?',
    'committee_consultation',
  ],
]

// Highest level scored wins (backend rule, D54)
const PRIORITY = ['high', 'medium', 'low', 'negligible', 'not_applicable']

const brandFont = { name: 'Adobe Devanagari', size: 28, bold: true, color: { argb: BLACK } }
const tnr = (size, bold = true) => ({ name: 'Times New Roman', size, bold, color: { argb: BLACK } })
const narrow = (size, bold = false) => ({
  name: 'Arial Narrow',
  size,
  bold,
  color: { argb: BLACK },
})
const centred = { horizontal: 'center', vertical: 'middle', wrapText: true }

/**
 * @param {import('exceljs').Workbook} workbook
 * @param {Object} data
 * @param {Object} data.project
 * @param {Object} [data.screening]
 * @param {Object} data.assessment
 * @param {Array} [data.methods]
 * @param {Array} [data.consultations]
 * @param {Array} [data.impactScores]
 * @param {Array} data.categoriesWithQuestions - useLookups().categoriesWithQuestions
 * @returns {import('exceljs').Worksheet}
 */
export function addTool2Sheet(
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
  const ws = workbook.addWorksheet('Tool 2')
  setWidths(ws, WIDTHS)
  const fullWidth = spanWidth(WIDTHS, 1, LAST)

  // Rows 1–3: brand, title, section
  merge(ws, 1, 1, 1, LAST)
  put(ws, 1, 1, 'AGA KHAN FOUNDATION - SYRIA', {
    font: brandFont,
    alignment: { horizontal: 'left' },
  })
  ws.getRow(1).height = 50
  merge(ws, 2, 1, 2, LAST)
  put(
    ws,
    2,
    1,
    'Project Environmental Assessment Form (Site-specific Environmental Assessment) - Tool 2',
    {
      font: { ...brandFont, name: 'Traditional Arabic' },
      alignment: { horizontal: 'left', vertical: 'middle', wrapText: true },
    }
  )
  ws.getRow(2).height = 50
  merge(ws, 3, 1, 3, LAST)
  put(ws, 3, 1, 'Project information and project Officer who Conducted this Assessment', {
    font: tnr(16),
    fillColor: OFFICIAL.lightGreen,
    alignment: centred,
  })
  ws.getRow(3).height = 20

  // Rows 4–7: project and officer, "Label: value" in the official cells
  const start = project?.start_date
  const end = project?.end_date
  const timeFrame = start && end ? formatDuration(calculateDurationMonths(start, end)) : ''
  const info = [
    ['Name:', userName(assessment?.officer), 'Position:', userJobTitle(assessment?.officer)],
    ['Location of component:', project?.location, 'Project (Activity) Title:', project?.title],
    ['Activity Started Date:', longDate(start), 'Activity End Date:', longDate(end)],
    [
      'Category of Project (Activity) from Tool 1:',
      screening?.category_code,
      'The time frame for Project (Activity):',
      timeFrame,
    ],
  ]
  info.forEach(([label1, value1, label2, value2], index) => {
    const row = 4 + index
    merge(ws, row, 1, row, 4)
    put(ws, row, 1, labelled(label1, safeString(value1), tnr(12)), {
      fillColor: OFFICIAL.lightGreen,
      alignment: { horizontal: 'left', vertical: 'middle', wrapText: true },
    })
    merge(ws, row, 5, row, LAST)
    put(ws, row, 5, labelled(label2, safeString(value2), tnr(12)), {
      fillColor: OFFICIAL.lightGreen,
      alignment: { horizontal: 'left', vertical: 'middle', wrapText: true },
    })
    ws.getRow(row).height = 20
  })
  box(ws, 3, 1, 7, LAST)

  // Rows 8–19: four labelled text blocks (label row + two merged rows of text)
  const blocks = [
    [8, 'The project (Activity) component being assessed', assessment?.project_activity],
    [
      11,
      'Brief description of the project (activities) being carried out',
      assessment?.description,
    ],
    [
      14,
      'Briefly describe the environmental setting of the project (activities)',
      assessment?.environmental_setting,
    ],
    [
      17,
      "The host country's legal requirements related to the environment or natural resources that apply to the project and how they will be met.",
      assessment?.legal_requirements,
    ],
  ]
  blocks.forEach(([row, label, value]) => {
    merge(ws, row, 1, row, LAST)
    put(ws, row, 1, label, { font: tnr(14), alignment: centred })
    ws.getRow(row).height = 20
    box(ws, row, 1, row, LAST, 'medium')
    writeTextBlock(ws, row + 1, safeString(value), fullWidth)
  })

  // Rows 20–24: assessment methods
  merge(ws, 20, 1, 20, LAST)
  put(ws, 20, 1, 'Environmental assessment methods', {
    font: tnr(14),
    fillColor: OFFICIAL.paleGreen,
    alignment: centred,
  })
  ws.getRow(20).height = 20
  const methodText = new Map(
    methods
      .filter((m) => m?.method_type)
      .map((m) => [m.method_type, safeString(m.details).trim() || '✓'])
  )
  writeGrid(ws, 21, METHODS_GRID, (key) => methodText.get(key) ?? '')

  // Rows 25–27: public consultation methods
  merge(ws, 25, 1, 25, LAST)
  put(
    ws,
    25,
    1,
    'Which public consultation methods were used while preparing the assessment Form',
    {
      font: tnr(14),
      fillColor: OFFICIAL.salmon,
      alignment: centred,
    }
  )
  ws.getRow(25).height = 20
  const consultationText = new Map(
    consultations
      .filter((c) => c?.type)
      .map((c) => {
        const lines = []
        if (safeString(c.participants).trim()) lines.push(`Participants: ${c.participants}`)
        if (safeString(c.notes).trim()) lines.push(safeString(c.notes))
        return [c.type, lines.join('\n') || '✓']
      })
  )
  writeGrid(ws, 26, CONSULTATION_GRID, (key) => consultationText.get(key) ?? '')
  box(ws, 20, 1, 27, LAST)

  // Row 28: impact section
  merge(ws, 28, 1, 28, LAST)
  put(ws, 28, 1, "The type and nature of activities' environmental impact", {
    font: tnr(22),
    fillColor: OFFICIAL.green,
    alignment: centred,
  })
  ws.getRow(28).height = 56.15

  // Question blocks
  const scores = new Map(impactScores.map((score) => [idOf(score.question), score]))
  const totals = []
  let questionCount = 0
  let row = 28
  DOMAIN_ORDER.forEach((code) => {
    const category = categoriesWithQuestions.find((c) => c?.code === code)
    const questions = category?.questions ?? []
    if (!questions.length) return

    row += 1
    writeLevelHeader(ws, row, DOMAIN_HEADER[code] ?? `${code}. ${safeString(category.name)}`)
    const first = row + 1
    const notes = []

    questions.forEach((question, index) => {
      row += 1
      questionCount += 1
      const score = scores.get(question._id ?? question.id)
      const level = LEVELS.includes(score?.level) ? score.level : 'negligible' // D54 default
      put(ws, row, 1, index + 1, {
        font: tnr(12),
        alignment: { horizontal: 'center', vertical: 'middle' },
      })
      merge(ws, row, 2, row, 5)
      const text = safeString(question.question)
      put(ws, row, 2, text, { font: narrow(12), alignment: { vertical: 'middle', wrapText: true } })
      LEVELS.forEach((key, i) => {
        put(ws, row, FIRST_LEVEL_COL + i, key === level ? 'X' : null, {
          font: narrow(11),
          alignment: centred,
        })
      })
      put(ws, row, 13, { formula: `COUNTA(F${row}:J${row})`, result: 1 })
      if (safeString(score?.note).trim()) notes.push(`${index + 1}. ${score.note}`)
      ws.getRow(row).height = Math.max(15.5, rowHeight(text, spanWidth(WIDTHS, 2, 5) * 0.95))
    })
    const last = row

    // Domain total: one count per level column
    row += 1
    merge(ws, row, 1, row, 5)
    put(ws, row, 1, 'Total Score', { font: tnr(16), fillColor: OFFICIAL.grey, alignment: centred })
    const counts = LEVELS.map(
      (key) =>
        questions.filter((q) => {
          const level = scores.get(q._id ?? q.id)?.level
          return (LEVELS.includes(level) ? level : 'negligible') === key
        }).length
    )
    LEVELS.forEach((_, i) => {
      const c = col(FIRST_LEVEL_COL + i)
      put(
        ws,
        row,
        FIRST_LEVEL_COL + i,
        { formula: `COUNTA(${c}${first}:${c}${last})`, result: counts[i] },
        {
          font: tnr(12),
          fillColor: OFFICIAL.grey,
          alignment: centred,
        }
      )
    })
    ws.getRow(row).height = 20.5

    // One Note cell per domain (K, first question → total), as in the official sheet
    merge(ws, first, LAST, row, LAST)
    const noteText = notes.join('\n')
    put(ws, first, LAST, noteText, { font: tnr(11, false), alignment: textAlignment(noteText) })

    box(ws, first - 1, 1, row, LAST)
    totals.push({ code, row, counts })
  })

  // Summary per domain
  row += 1
  writeLevelHeader(ws, row, 'Project Environmental assessment Summary')
  const summaryFirst = row + 1
  totals.forEach(({ code, row: totalRow, counts }) => {
    row += 1
    merge(ws, row, 1, row, 5)
    put(ws, row, 1, DOMAIN_SUMMARY[code], {
      font: tnr(12),
      fillColor: OFFICIAL.paleBlue,
      alignment: { horizontal: 'left', vertical: 'middle', wrapText: true },
    })
    LEVELS.forEach((_, i) => {
      const c = col(FIRST_LEVEL_COL + i)
      put(
        ws,
        row,
        FIRST_LEVEL_COL + i,
        { formula: `${c}${totalRow}`, result: counts[i] },
        {
          font: narrow(14, true),
          fillColor: OFFICIAL.paleBlue,
          alignment: centred,
        }
      )
    })
    ws.getRow(row).height = code === 'J' ? 26.5 : 15.5
  })
  const summaryLast = row
  const grand = LEVELS.map((_, i) => totals.reduce((sum, t) => sum + t.counts[i], 0))

  // TOTAL PROJECT SCORE
  row += 1
  const grandRow = row
  merge(ws, row, 1, row, 5)
  put(ws, row, 1, 'TOTAL PROJECT SCORE', {
    font: tnr(18),
    fillColor: OFFICIAL.darkBlue,
    alignment: centred,
  })
  LEVELS.forEach((_, i) => {
    const c = col(FIRST_LEVEL_COL + i)
    put(
      ws,
      row,
      FIRST_LEVEL_COL + i,
      { formula: `SUM(${c}${summaryFirst}:${c}${summaryLast})`, result: grand[i] },
      {
        font: narrow(14, true),
        fillColor: OFFICIAL.darkBlue,
        alignment: centred,
      }
    )
  })
  ws.getRow(row).height = 20.5

  // Is it Complete
  row += 1
  merge(ws, row, 1, row, 5)
  put(ws, row, 1, 'Is it Complete', {
    font: tnr(18),
    fillColor: OFFICIAL.paleBlue,
    alignment: centred,
  })
  merge(ws, row, 6, row, 10)
  const complete = questionCount > 0 && grand.reduce((a, b) => a + b, 0) === questionCount
  put(
    ws,
    row,
    6,
    {
      formula: `IF(AND(SUM(F${grandRow}:J${grandRow})=${questionCount},COUNTIF(M:M,0)=0),"YES","NO")`,
      result: complete ? 'YES' : 'NO',
    },
    { font: narrow(14, true), fillColor: OFFICIAL.paleBlue, alignment: centred }
  )
  ws.getRow(row).height = 25

  // TOTAL PROJECT IMPACT (highest level scored)
  row += 1
  merge(ws, row, 1, row, 5)
  put(ws, row, 1, 'TOTAL PROJECT IMPACT', {
    font: tnr(18),
    fillColor: OFFICIAL.paleBlue,
    alignment: centred,
  })
  merge(ws, row, 6, row, 10)
  const impactKey = PRIORITY.find((key) => grand[LEVELS.indexOf(key)] > 0) ?? 'negligible'
  const g = (key) => `${col(FIRST_LEVEL_COL + LEVELS.indexOf(key))}${grandRow}`
  put(
    ws,
    row,
    6,
    {
      formula: `IF(${g('high')}>0,"High",IF(${g('medium')}>0,"Medium",IF(${g('low')}>0,"Low",IF(${g('negligible')}>0,"Negligible","Not Applicable"))))`,
      result: LEVEL_LABELS[LEVELS.indexOf(impactKey)],
    },
    { font: narrow(16, true), fillColor: OFFICIAL.paleBlue, alignment: centred }
  )
  ws.getRow(row).height = 27.5
  merge(ws, summaryFirst, LAST, row, LAST) // one Note cell beside the summary
  box(ws, summaryFirst - 1, 1, row, LAST)

  // Potential impacts
  ;[
    ['Potential Negative Impact:', assessment?.potential_negative_impact],
    ['Potential Positive Impact:', assessment?.potential_positive_impact],
  ].forEach(([label, value]) => {
    row += 1
    merge(ws, row, 1, row, LAST)
    put(ws, row, 1, label, {
      font: tnr(14),
      alignment: { horizontal: 'center', vertical: 'middle' },
    })
    ws.getRow(row).height = 17.5
    box(ws, row, 1, row, LAST, 'medium')
    writeTextBlock(ws, row + 1, safeString(value), fullWidth)
    row += 2
  })

  // Approval and recommendations — filled only once the assessment is approved
  const approved = assessment?.status === 'approved'
  row += 1
  merge(ws, row, 1, row, LAST)
  put(ws, row, 1, 'The Approval and Recommendations by', {
    font: tnr(14),
    alignment: { horizontal: 'center', vertical: 'middle' },
  })
  ws.getRow(row).height = 20
  box(ws, row, 1, row, LAST, 'medium')
  row += 1
  merge(ws, row, 1, row, 4)
  put(ws, row, 1, labelled('Name:', approved ? userName(assessment?.approved_by) : '', tnr(14)), {
    alignment: { horizontal: 'left', vertical: 'middle' },
  })
  merge(ws, row, 5, row, LAST)
  put(
    ws,
    row,
    5,
    labelled('Position:', approved ? userJobTitle(assessment?.approved_by) : '', tnr(14)),
    {
      alignment: { horizontal: 'left', vertical: 'middle' },
    }
  )
  ws.getRow(row).height = 20
  box(ws, row, 1, row, LAST)
  row += 1
  merge(ws, row, 1, row, LAST)
  put(ws, row, 1, 'Recommendations:', {
    font: tnr(14),
    alignment: { horizontal: 'left', vertical: 'middle' },
  })
  ws.getRow(row).height = 20
  writeTextBlock(ws, row + 1, approved ? safeString(assessment?.recommendations) : '', fullWidth)

  return ws
}

// Label row of a level table: name in A, level labels in F..J, "Note" in K
function writeLevelHeader(ws, row, label) {
  put(ws, row, 1, label, { font: tnr(14), alignment: { vertical: 'middle' } })
  LEVEL_LABELS.forEach((text, i) => {
    put(ws, row, FIRST_LEVEL_COL + i, text, {
      font: tnr(14),
      alignment: { horizontal: 'center', vertical: 'middle' },
    })
  })
  put(ws, row, LAST, 'Note', {
    font: tnr(14),
    alignment: { horizontal: 'center', vertical: 'middle' },
  })
  paint(ws, row, 1, row, LAST, OFFICIAL.grey)
  box(ws, row, 1, row, LAST, 'medium')
  ws.getRow(row).height = 25
}

// Two merged rows (A:K) holding user text
function writeTextBlock(ws, row, text, width) {
  merge(ws, row, 1, row + 1, LAST)
  put(ws, row, 1, text, {
    font: tnr(11, false),
    alignment: textAlignment(text, { horizontal: 'left' }),
  })
  const height = rowHeight(text, width * 0.9, { min: 30, max: 400 })
  ws.getRow(row).height = height / 2
  ws.getRow(row + 1).height = height / 2
}

// Method / consultation grid rows: label A:C, mark D, label E:H, mark I:K
function writeGrid(ws, firstRow, grid, textFor) {
  grid.forEach(([leftLabel, leftKey, rightLabel, rightKey], index) => {
    const row = firstRow + index
    const left = textFor(leftKey)
    const right = rightKey ? textFor(rightKey) : ''
    merge(ws, row, 1, row, 3)
    put(ws, row, 1, leftLabel, {
      font: tnr(12, false),
      fillColor: WHITE,
      alignment: { horizontal: 'left', vertical: 'middle', wrapText: true },
    })
    put(ws, row, 4, left, {
      font: tnr(11, false),
      alignment: textAlignment(left, { vertical: 'middle' }),
    })
    merge(ws, row, 5, row, 8)
    put(ws, row, 5, rightLabel ?? '', {
      font: tnr(12, false),
      fillColor: WHITE,
      alignment: { horizontal: 'left', vertical: 'middle', wrapText: true },
    })
    merge(ws, row, 9, row, LAST)
    put(ws, row, 9, right, {
      font: tnr(11, false),
      alignment: textAlignment(right, { vertical: 'middle' }),
    })
    ws.getRow(row).height = Math.max(
      20,
      rowHeight(left, WIDTHS[4]),
      rowHeight(right, spanWidth(WIDTHS, 9, LAST))
    )
  })
}
