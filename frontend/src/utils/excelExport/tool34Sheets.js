/**
 * Tool 3 (Management activities) and Tool 4 (Mitigation plan), official sheets "Tool 3" and
 * "Tool 4" (D52). Ported from the v2 builder: brand and title rows, header row, widths, and at
 * least the ten numbered template rows. Responsibility = user name or external party (D55).
 */

import {
  BLACK,
  OFFICIAL,
  box,
  merge,
  put,
  responsibleText,
  rowHeight,
  safeString,
  setWidths,
  textAlignment,
} from './sheetKit'

const TEMPLATE_ROWS = 10
const HEADER_ROW = 3

const recommendedActions = (actions) =>
  Array.isArray(actions) ? actions.filter(Boolean).join('\n') : safeString(actions)

const TOOL3 = {
  sheet: 'Tool 3',
  title: 'Template for environmental and social management activities - Tool 3',
  titleSize: 28,
  headerFill: OFFICIAL.headerGreen,
  serialBold: true,
  headers: [
    'S',
    'Activity description',
    'Potential Impact and Significance/Risk- low-med-high',
    'Recommended Action Items',
    'Monitoring requirements',
    'Responsibility',
    'Notes',
  ],
  widths: {
    1: 5.54296875,
    2: 23.08984375,
    3: 43.90625,
    4: 32.7265625,
    5: 31.08984375,
    6: 16.36328125,
  },
  fields: (row) => [
    row.activity_description,
    row.potential_impact,
    recommendedActions(row.recommended_actions),
    row.monitoring_requirements,
    responsibleText(row),
    row.notes,
  ],
}

const TOOL4 = {
  sheet: 'Tool 4',
  title:
    'Environmental and social impact assessment, management, and mitigation plan template - Tool 4',
  titleSize: 24,
  headerFill: OFFICIAL.blue,
  serialBold: false,
  headers: [
    'S',
    'Output or Activity description',
    'Potential Impact and Significance/Risk of each- low-med-high Including climate-related risks',
    'Mitigation and enhancement measures',
    'Monitoring',
    'Responsibility',
    'Schedule',
    'Notes ',
  ],
  widths: {
    1: 2.81640625,
    2: 22,
    3: 65.1796875,
    4: 31.1796875,
    5: 13.08984375,
    6: 17,
    7: 10.7265625,
  },
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

const brandFont = { name: 'Adobe Devanagari', size: 28, bold: true, color: { argb: BLACK } }
const bodyFont = (bold = false) => ({ name: 'Calibri', size: 11, bold, color: { argb: BLACK } })

function addTableSheet(workbook, config, rows) {
  const ws = workbook.addWorksheet(config.sheet)
  setWidths(ws, config.widths)
  const cols = config.headers.length

  merge(ws, 1, 1, 1, cols)
  put(ws, 1, 1, 'AGA KHAN FOUNDATION - SYRIA', {
    font: brandFont,
    alignment: { horizontal: 'left' },
  })
  ws.getRow(1).height = 45
  merge(ws, 2, 1, 2, cols)
  put(ws, 2, 1, config.title, {
    font: { ...brandFont, size: config.titleSize },
    alignment: { horizontal: 'left' },
  })
  ws.getRow(2).height = 45

  config.headers.forEach((header, index) => {
    put(ws, HEADER_ROW, index + 1, header, {
      font: { name: 'Amasis MT Pro', size: 12, bold: true, color: { argb: BLACK } },
      fillColor: config.headerFill,
      alignment: {
        horizontal: index === 0 ? 'center' : undefined,
        vertical: 'middle',
        wrapText: true,
      },
    })
  })
  ws.getRow(HEADER_ROW).height = 31

  const data = (rows ?? []).filter((row) => row && typeof row === 'object')
  const count = Math.max(TEMPLATE_ROWS, data.length)
  for (let i = 0; i < count; i++) {
    const r = HEADER_ROW + 1 + i
    put(ws, r, 1, i + 1, {
      font: bodyFont(config.serialBold),
      alignment: { horizontal: 'center', vertical: 'top' },
    })
    const item = data[i]
    if (!item) continue
    let height = 15
    config.fields(item).forEach((value, index) => {
      const text = safeString(value)
      put(ws, r, index + 2, text, { font: bodyFont(), alignment: textAlignment(text) })
      height = Math.max(height, rowHeight(text, config.widths[index + 2] ?? 8.73))
    })
    ws.getRow(r).height = height
  }

  box(ws, HEADER_ROW, 1, HEADER_ROW + count, cols)
  return ws
}

/**
 * @param {import('exceljs').Workbook} workbook
 * @param {Array} rows - Management activities
 */
export const addTool3Sheet = (workbook, rows) => addTableSheet(workbook, TOOL3, rows)

/**
 * @param {import('exceljs').Workbook} workbook
 * @param {Array} rows - Mitigation plan rows
 */
export const addTool4Sheet = (workbook, rows) => addTableSheet(workbook, TOOL4, rows)
