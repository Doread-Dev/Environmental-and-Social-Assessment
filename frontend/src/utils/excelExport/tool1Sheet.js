/**
 * Tool 1 — Environmental Integration Screening Tool, official sheet "Tool 1" (D67 a).
 *
 * Same rows, merges, widths, fonts and fills as the official workbook; values go into the
 * official cells after their label ("Project Title: …"). Only addition: the potential impact
 * text sits in C:E of rows 22/23 (empty in the template) and is merged there so it wraps.
 */

import {
  BLACK,
  OFFICIAL,
  box,
  labelled,
  longDate,
  merge,
  put,
  rowHeight,
  safeString,
  setWidths,
  spanWidth,
  textAlignment,
  userJobTitle,
  userName,
} from './sheetKit'

const WIDTHS = { 1: 12.90625, 2: 21.08984375, 3: 16.453125, 4: 11.26953125, 5: 74.453125 }

const CATEGORIES = [
  { code: 'A', label: 'High potential environmental risk', fill: 'FFFF6137' },
  { code: 'B', label: 'Low to moderate environmental risk', fill: 'FFFF967A' },
  { code: 'C', label: 'Negligible environmental risk', fill: 'FFFFCABC' },
  { code: 'D', label: 'Emergency cases and initiatives', fill: 'FFFCE4D6' },
  { code: 'E', label: 'Not enough information.', fill: null },
  { code: 'F', label: 'Positive Environmental Impact', fill: null },
]

const brandFont = { name: 'Adobe Devanagari', size: 28, bold: true, color: { argb: BLACK } }
const font = (size, bold = true) => ({ name: 'Abadi', size, bold, color: { argb: BLACK } })
const top = (extra = {}) => ({ vertical: 'top', wrapText: true, ...extra })

/**
 * @param {import('exceljs').Workbook} workbook
 * @param {Object} data
 * @param {Object} data.project
 * @param {Object} data.screening
 * @returns {import('exceljs').Worksheet}
 */
export function addTool1Sheet(workbook, { project, screening }) {
  const ws = workbook.addWorksheet('Tool 1', { views: [{ zoomScale: 60 }] })
  setWidths(ws, WIDTHS)

  // Rows 1–3: brand, tool title, summary table title
  merge(ws, 1, 1, 1, 5)
  put(ws, 1, 1, 'AGA KHAN FOUNDATION - SYRIA', {
    font: brandFont,
    alignment: { horizontal: 'left', vertical: 'top' },
  })
  ws.getRow(1).height = 45
  merge(ws, 2, 1, 2, 5)
  put(ws, 2, 1, 'Environmental Assessment - Tool 1', {
    font: brandFont,
    alignment: { horizontal: 'left', vertical: 'top' },
  })
  ws.getRow(2).height = 45
  merge(ws, 3, 1, 3, 5)
  put(ws, 3, 1, 'ENVIRONMENTAL INTEGRATION SCREENING TOOL – SUMMARY TABLE', {
    font: { ...brandFont, size: 20 },
    fillColor: OFFICIAL.green,
    alignment: { horizontal: 'left', vertical: 'top' },
  })
  ws.getRow(3).height = 28

  // Row 4: project title | screening date
  merge(ws, 4, 1, 4, 4)
  const title = safeString(project?.title)
  put(ws, 4, 1, labelled('Project Title:', title, font(14)), {
    fillColor: OFFICIAL.paleGreen,
    alignment: top({ horizontal: 'left' }),
  })
  put(ws, 4, 5, labelled('Screening date:', longDate(screening?.screening_date), font(14)), {
    fillColor: OFFICIAL.paleGreen,
    alignment: top(),
  })
  ws.getRow(4).height = Math.max(
    19.5,
    rowHeight(title, spanWidth(WIDTHS, 1, 4) * 0.6, { lineHeight: 19 })
  )

  // Row 5: officer who conducted the screening
  merge(ws, 5, 1, 5, 5)
  const officer = screening?.officer
  const f14 = font(14)
  put(
    ws,
    5,
    1,
    {
      richText: [
        { text: 'Program officer who conducted this screening:  Name: ', font: f14 },
        { text: userName(officer), font: { ...f14, bold: false } },
        { text: '      Position: ', font: f14 },
        { text: userJobTitle(officer), font: { ...f14, bold: false } },
      ],
    },
    { fillColor: OFFICIAL.yellow, alignment: top({ horizontal: 'left' }) }
  )
  ws.getRow(5).height = 19.5

  // Rows 6–7: project components / activities
  merge(ws, 6, 1, 7, 5)
  const component = safeString(project?.project_component)
  put(ws, 6, 1, labelled('Project Components/Activities:\n', component, f14), {
    alignment: top({ horizontal: 'left' }),
  })
  const componentHeight = rowHeight(`x\n${component}`, spanWidth(WIDTHS, 1, 5) * 0.7, {
    lineHeight: 19,
  })
  ws.getRow(6).height = Math.max(19.5, componentHeight - 15)
  ws.getRow(7).height = 15

  // Row 8: the category chosen and what it means
  const chosen = CATEGORIES.find((c) => c.code === screening?.category_code)
  merge(ws, 8, 1, 8, 2)
  put(
    ws,
    8,
    1,
    labelled('Screening Project Category :', chosen ? `Category ${chosen.code}` : '', f14),
    {
      alignment: top(),
    }
  )
  merge(ws, 8, 3, 8, 5)
  put(ws, 8, 3, labelled('Assessment Result:', chosen?.label ?? '', f14), {
    alignment: top({ horizontal: 'justify' }),
  })
  ws.getRow(8).height = 19.5

  // Row 9: table header
  merge(ws, 9, 1, 9, 2)
  put(ws, 9, 1, 'Indicate the category of risk – A, B, C, D, E or F', {
    font: font(16),
    fillColor: 'FFFF6137',
    alignment: top({ horizontal: 'center' }),
  })
  merge(ws, 9, 3, 9, 5)
  put(ws, 9, 3, 'Notes and explanation', {
    font: font(16),
    fillColor: 'FFFF6137',
    alignment: top({ horizontal: 'center' }),
  })
  ws.getRow(9).height = 46.5

  // Rows 10–21: one pair per category; the reason is written after "Why Category X:"
  CATEGORIES.forEach((category, index) => {
    const row = 10 + index * 2
    const options = category.fill ? { fillColor: category.fill } : {}
    merge(ws, row, 1, row, 2)
    put(ws, row, 1, `Category ${category.code}.`, {
      font: font(14),
      alignment: top({ horizontal: 'center' }),
      ...options,
    })
    merge(ws, row, 3, row, 5)
    put(ws, row, 3, category.label, {
      font: font(12),
      alignment: top({ horizontal: 'center' }),
      ...options,
    })
    ws.getRow(row).height = 19.5

    merge(ws, row + 1, 1, row + 1, 5)
    const reason = category === chosen ? safeString(screening?.category_reason) : ''
    put(ws, row + 1, 1, labelled(`Why Category ${category.code}:`, reason, font(12)), {
      alignment: textAlignment(reason),
      ...options,
    })
    ws.getRow(row + 1).height = Math.max(
      17,
      rowHeight(`Why Category X: ${reason}`, spanWidth(WIDTHS, 1, 5) * 0.8)
    )
  })

  // Rows 22–23: potential impacts (label A:B, text C:E)
  const impacts = [
    [22, 'Potential negative impact', screening?.potential_negative, OFFICIAL.paleYellow],
    [23, 'Potential positive impact', screening?.potential_positive, OFFICIAL.lightYellow],
  ]
  impacts.forEach(([row, label, value, color]) => {
    merge(ws, row, 1, row, 2)
    put(ws, row, 1, label, {
      font: font(14),
      fillColor: color,
      alignment: top({ horizontal: 'left' }),
    })
    merge(ws, row, 3, row, 5)
    const text = safeString(value)
    put(ws, row, 3, text, { font: font(12, false), alignment: textAlignment(text) })
    ws.getRow(row).height = Math.max(19.5, rowHeight(text, spanWidth(WIDTHS, 3, 5) * 0.8))
  })

  // Rows 24–26: approval — filled only once the screening is approved
  const approved = screening?.status === 'approved'
  merge(ws, 24, 1, 24, 5)
  put(ws, 24, 1, 'The Approval and Recommendations by', {
    font: font(16),
    alignment: top({ horizontal: 'center' }),
  })
  ws.getRow(24).height = 23
  merge(ws, 25, 1, 25, 3)
  put(ws, 25, 1, labelled('Name:', approved ? userName(screening?.approved_by) : '', f14), {
    alignment: top({ horizontal: 'justify' }),
  })
  merge(ws, 25, 4, 25, 5)
  put(ws, 25, 4, labelled('Position:', approved ? userJobTitle(screening?.approved_by) : '', f14), {
    alignment: top({ horizontal: 'justify' }),
  })
  ws.getRow(25).height = 19.5
  merge(ws, 26, 1, 26, 5)
  const recommendations = approved ? safeString(screening?.recommendations) : ''
  put(ws, 26, 1, labelled('Recommendations:\n', recommendations, f14), {
    alignment: textAlignment(recommendations, { horizontal: 'justify' }),
  })
  ws.getRow(26).height = Math.max(
    19.5,
    rowHeight(`x\n${recommendations}`, spanWidth(WIDTHS, 1, 5) * 0.8, { lineHeight: 19 })
  )

  box(ws, 4, 1, 26, 5, 'medium')
  return ws
}
