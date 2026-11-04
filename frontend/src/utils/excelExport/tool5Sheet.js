/**
 * Tool 5 — Project Environmental Checklist and Evaluation Tool (Monitoring), official sheet
 * "Tool 5" (D52). Ported from the v2 builder and aligned with the official fonts and fills:
 * project block (rows 3–6), two-row table header, eight categories in the official order with
 * their three indicators (numbering restarts in each category). Baseline, quarters, Total and
 * Score are free text (D57); Responsibility = user name or external party (D55).
 */

import { calculateDurationMonths, formatDuration } from '../formatters'
import { getRankingDisplayLabel } from '../rankingHelp'
import { IMPACT_LEVEL_CONFIG } from '../impactLevels'
import {
  BLACK,
  OFFICIAL,
  box,
  idOf,
  longDate,
  merge,
  paint,
  put,
  responsibleText,
  rowHeight,
  safeString,
  setWidths,
  textAlignment,
  userJobTitle,
  userName,
} from './sheetKit'

const N_COLS = 14
const WIDTHS = {
  1: 6.1796875,
  2: 33.81640625,
  3: 59,
  4: 41.26953125,
  5: 10.6328125,
  6: 10.6328125,
  7: 10.6328125,
  8: 10.6328125,
  9: 10.6328125,
  10: 10.6328125,
  11: 10.6328125,
  12: 59.7265625,
  13: 22.1796875,
  14: 19.453125,
}
const CATEGORY_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'J', 'H']
const CATEGORY_NAMES = {
  A: 'Air quality',
  B: 'Water quality',
  C: 'The quality and effect of noise',
  D: 'Solid waste effect ',
  E: 'Radiation effect:',
  F: 'Toxic and Dangerous Materials effect',
  J: 'The Environmental impacts on natural plants, forests, and wildlife',
  H: 'Environmental impacts of land use and management',
}

const brandFont = { name: 'Adobe Devanagari', size: 28, bold: true, color: { argb: BLACK } }
const tnr = (size, bold = true) => ({ name: 'Times New Roman', size, bold, color: { argb: BLACK } })
const bodoni = (size) => ({ name: 'Bodoni MT', size, bold: true, color: { argb: BLACK } })
const calibri = () => ({ name: 'Calibri', size: 11, color: { argb: BLACK } })
const middle = { horizontal: 'center', vertical: 'middle', wrapText: true }

/**
 * @param {import('exceljs').Workbook} workbook
 * @param {Object} data
 * @param {Object} data.project
 * @param {Object} [data.screening] - For the Tool 1 category
 * @param {Object} [data.assessment] - For the officer
 * @param {Array} [data.records] - Monitoring records
 * @param {Array} data.categoriesWithIndicators - useLookups().categoriesWithIndicators
 * @returns {import('exceljs').Worksheet}
 */
export function addTool5Sheet(
  workbook,
  { project, screening, assessment, records = [], categoriesWithIndicators = [] }
) {
  const ws = workbook.addWorksheet('Tool 5')
  setWidths(ws, WIDTHS)

  merge(ws, 1, 1, 1, N_COLS)
  put(ws, 1, 1, 'AGA KHAN FOUNDATION - SYRIA', {
    font: brandFont,
    alignment: { horizontal: 'left' },
  })
  ws.getRow(1).height = 50
  merge(ws, 2, 1, 2, N_COLS)
  put(ws, 2, 1, 'Project Environmental Checklist and Evaluation Tool - 5', {
    font: brandFont,
    alignment: { horizontal: 'left' },
  })
  ws.getRow(2).height = 50

  // Rows 3–6: label A:B, value C:G, label H:K, value L:N
  const start = project?.start_date
  const end = project?.end_date
  const info = [
    ['Name:', userName(assessment?.officer), 'Position:', userJobTitle(assessment?.officer), 49],
    ['Project (Activity) Title:', project?.title, 'Location of component:', project?.location, 48],
    ['Activity Start Date:', longDate(start), 'Activity End Date:', longDate(end), 47],
    [
      'The time frame for Project (Activity):',
      start && end ? formatDuration(calculateDurationMonths(start, end)) : '',
      'Category of Project (Activity) from Tool 1:',
      screening?.category_code,
      48.5,
    ],
  ]
  info.forEach(([label1, value1, label2, value2, height], index) => {
    const row = 3 + index
    const v1 = safeString(value1)
    const v2 = safeString(value2)
    merge(ws, row, 1, row, 2)
    put(ws, row, 1, label1, {
      font: tnr(16),
      fillColor: OFFICIAL.green,
      alignment: { horizontal: 'left', vertical: 'middle', wrapText: true },
    })
    merge(ws, row, 3, row, 7)
    put(ws, row, 3, v1, { font: tnr(16, false), alignment: textAlignment(v1, middle) })
    merge(ws, row, 8, row, 11)
    put(ws, row, 8, label2, {
      font: tnr(16),
      fillColor: OFFICIAL.green,
      alignment: { horizontal: 'left', vertical: 'middle', wrapText: true },
    })
    merge(ws, row, 12, row, N_COLS)
    put(ws, row, 12, v2, { font: tnr(12, false), alignment: textAlignment(v2, middle) })
    ws.getRow(row).height = height
  })

  merge(ws, 7, 1, 7, N_COLS)
  put(ws, 7, 1, 'Enviornmental and Social impact monitoring', {
    font: tnr(16),
    fillColor: OFFICIAL.orange,
    alignment: middle,
  })
  ws.getRow(7).height = 30
  box(ws, 3, 1, 7, N_COLS)

  // Rows 8–9: stacked header
  const header = (row, column, text, font) =>
    put(ws, row, column, text, { font, alignment: middle })
  header(8, 1, 'S', bodoni(18))
  ;['Indicator', 'Definition', 'Measurement'].forEach((text, i) => header(8, 2 + i, text, tnr(18)))
  header(8, 5, 'Final Environmental Assessment ', tnr(18))
  header(8, 12, 'Ranking', tnr(18))
  header(8, 13, 'Responsibility', tnr(18))
  header(8, 14, 'Note', tnr(18))
  ;['Basline', 'Quarter1', 'Quarter2', 'Quarter3', 'Quarter4', 'Total', 'Score'].forEach(
    (text, i) => header(9, 5 + i, text, tnr(14))
  )
  ;[
    [8, 1, 9, 1],
    [8, 2, 9, 2],
    [8, 3, 9, 3],
    [8, 4, 9, 4],
    [8, 5, 8, 11],
    [8, 12, 9, 12],
    [8, 13, 9, 13],
    [8, 14, 9, 14],
  ].forEach(([t, l, b, r]) => merge(ws, t, l, b, r))
  ws.getRow(8).height = 35
  ws.getRow(9).height = 35

  const byIndicator = new Map(
    records
      .filter((record) => !String(record?._id ?? '').startsWith('placeholder_'))
      .map((record) => [idOf(record.indicator), record])
  )

  let row = 9
  CATEGORY_ORDER.forEach((code) => {
    const category = categoriesWithIndicators.find((c) => c?.code === code)
    if (!category) return
    row += 1
    put(ws, row, 1, code, { font: bodoni(18), fillColor: OFFICIAL.greyBrown, alignment: middle })
    merge(ws, row, 2, row, N_COLS)
    put(ws, row, 2, CATEGORY_NAMES[code] ?? safeString(category.name), {
      font: tnr(18),
      fillColor: OFFICIAL.grey,
      alignment: { horizontal: 'left', vertical: 'middle' },
    })
    paint(ws, row, 2, row, N_COLS, OFFICIAL.grey)
    ws.getRow(row).height = 35

    ;(category.indicators ?? []).forEach((indicator, index) => {
      row += 1
      const number = index + 1 // restarts in each category, as in the official sheet
      const record = byIndicator.get(indicator._id)
      put(ws, row, 1, number, { font: bodoni(14), alignment: middle })
      const cells = [
        indicator.name,
        indicator.definition,
        indicator.measurement,
        record?.scores?.baseline,
        record?.scores?.Q1,
        record?.scores?.Q2,
        record?.scores?.Q3,
        record?.scores?.Q4,
        record?.total,
        record?.final_assessment,
        record?.ranking
          ? getRankingDisplayLabel(record.ranking, code, number, IMPACT_LEVEL_CONFIG)
          : '',
        responsibleText(record),
        record?.note,
      ]
      let height = 45
      cells.forEach((value, i) => {
        const column = i + 2
        const text = safeString(value)
        const quarter = column >= 5 && column <= 11
        put(ws, row, column, text, {
          font: calibri(),
          alignment: textAlignment(
            text,
            quarter ? middle : { horizontal: 'left', vertical: 'middle' }
          ),
        })
        height = Math.max(height, rowHeight(text, WIDTHS[column]))
      })
      ws.getRow(row).height = height
    })
  })

  box(ws, 8, 1, row, N_COLS)
  return ws
}
