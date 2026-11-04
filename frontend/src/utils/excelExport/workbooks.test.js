import { describe, expect, it } from 'vitest'
import ExcelJS from 'exceljs'
import { buildProjectWorkbook, buildToolWorkbook } from './workbooks'
import { exportStatus, projectFileName, toolFileName } from './exportMeta'

const DATE = new Date(2026, 10, 4)
const CODES = ['A', 'B', 'C', 'D', 'E', 'F', 'H', 'J']

const project = {
  _id: 'p1',
  title: 'Water network',
  location: 'Aleppo',
  project_component: 'Pipes',
  start_date: '2026-01-01',
  end_date: '2026-12-31',
}
const officer = { _id: 'u1', name: 'Rana', job_title: { title_name: 'Engineer' } }
const approver = { _id: 'u2', name: 'Omar', job_title: { title_name: 'Specialist' } }
const screening = {
  _id: 's1',
  status: 'approved',
  category_code: 'B',
  category_reason: 'Urban works',
  potential_negative: 'غبار وضجيج',
  potential_positive: 'Clean water',
  screening_date: '2026-02-01',
  officer,
  approved_by: approver,
  recommendations: 'Go on',
}
// 8 domains: 5 questions each, 10 for H and J (50, as the seed)
const categoriesWithQuestions = CODES.map((code) => ({
  code,
  name: code,
  questions: Array.from({ length: ['H', 'J'].includes(code) ? 10 : 5 }, (_, i) => ({
    _id: `${code}${i + 1}`,
    question: `Question ${code}${i + 1}`,
  })),
}))
const impactScores = categoriesWithQuestions.flatMap((c) =>
  c.questions.map((q) => ({ question: q._id, level: 'negligible' }))
)
impactScores[0] = { question: 'A1', level: 'high', note: 'Dust' }
impactScores[1] = { question: 'A2', level: 'low' }
const tool2 = {
  assessment: {
    _id: 'a1',
    status: 'draft',
    project_activity: 'Pipes',
    description: 'Replace pipes',
    officer,
  },
  methods: [{ method_type: 'field_visits', details: 'Two visits' }],
  consultations: [{ type: 'village_meetings', participants: '12', notes: '' }],
  impactScores,
}
const management = [
  { _id: 'm1', activity_description: 'Dust control', responsible: officer, responsible_text: '' },
  { _id: 'm2', activity_description: 'Waste', responsible: null, responsible_text: 'المقاول' },
]
const mitigation = [
  { _id: 't1', output_description: 'Fence', responsible: null, responsible_text: 'Municipality' },
]
const categoriesWithIndicators = CODES.map((code) => ({
  code,
  name: code,
  indicators: [1, 2, 3].map((n) => ({
    _id: `i${code}${n}`,
    name: `Indicator ${code}${n}`,
    definition: 'Def',
    measurement: 'Count',
  })),
}))
const records = [
  {
    _id: 'r1',
    indicator: 'iA1',
    scores: { baseline: '0', Q1: '1', Q2: '', Q3: '', Q4: '' },
    total: '1',
    final_assessment: 'Low',
    ranking: 'low',
    responsible: null,
    responsible_text: 'Local council',
    note: '',
  },
]

const workflow = {
  steps: {
    screening: { status: 'approved' },
    assessment: { status: 'in_progress' },
    semp: {
      management_activities: { status: 'completed' },
      mitigation_plans: { status: 'in_progress' },
    },
    monitoring: { status: 'in_progress' },
  },
}

// Write and read back, as Excel would see the file
async function roundTrip(workbook) {
  const copy = new ExcelJS.Workbook()
  await copy.xlsx.load(await workbook.xlsx.writeBuffer())
  return copy
}
const text = (cell) =>
  cell.value?.richText ? cell.value.richText.map((t) => t.text).join('') : cell.value
const merges = (ws) => ws.model.merges

describe('Tool 1 sheet (official layout, D67 a)', () => {
  it('reproduces the official rows and merges and writes the values after the labels', async () => {
    const { workbook, fileName } = buildToolWorkbook(
      'tool1',
      { project, screening },
      { status: 'Approved', date: DATE }
    )
    const ws = (await roundTrip(workbook)).getWorksheet('Tool 1')

    expect(fileName).toBe('Tool1_Water_network_Approved_2026-11-04.xlsx')
    expect(text(ws.getCell('A1'))).toBe('AGA KHAN FOUNDATION - SYRIA')
    expect(text(ws.getCell('A3'))).toBe('ENVIRONMENTAL INTEGRATION SCREENING TOOL – SUMMARY TABLE')
    expect(text(ws.getCell('A4'))).toBe('Project Title: Water network')
    expect(text(ws.getCell('A8'))).toBe('Screening Project Category : Category B')
    expect(text(ws.getCell('A13'))).toBe('Why Category B: Urban works')
    expect(text(ws.getCell('A11'))).toBe('Why Category A:')
    expect(text(ws.getCell('A25'))).toBe('Name: Omar')
    expect(ws.getColumn(5).width).toBeCloseTo(74.45, 1)
    // the 34 official merges, plus C:E of the two potential-impact rows
    for (const range of [
      'A1:E1',
      'A4:D4',
      'A6:E7',
      'A9:B9',
      'C9:E9',
      'A11:E11',
      'A25:C25',
      'D25:E25',
    ]) {
      expect(merges(ws)).toContain(range)
    }
    expect(merges(ws)).toHaveLength(36)
    // Arabic text reads right to left
    expect(ws.getCell('C22').alignment).toMatchObject({ readingOrder: 'rtl', horizontal: 'right' })
    expect(ws.getCell('C23').alignment.readingOrder).toBeUndefined()
  })

  it('leaves the approval empty while the screening is not approved', async () => {
    const { workbook } = buildToolWorkbook(
      'tool1',
      { project, screening: { ...screening, status: 'submitted' } },
      { status: 'Submitted', date: DATE }
    )
    const ws = (await roundTrip(workbook)).getWorksheet('Tool 1')
    expect(text(ws.getCell('A25'))).toBe('Name:')
    expect(text(ws.getCell('A26'))).toBe('Recommendations:\n')
  })
})

describe('Tool 2 sheet', () => {
  it('has the official rows, one X per question, counts and the summary', async () => {
    const { workbook } = buildToolWorkbook(
      'tool2',
      { project, screening, ...tool2, categoriesWithQuestions },
      { status: 'Draft', date: DATE }
    )
    const ws = (await roundTrip(workbook)).getWorksheet('Tool 2')

    expect(text(ws.getCell('A4'))).toBe('Name: Rana')
    expect(text(ws.getCell('A7'))).toBe('Category of Project (Activity) from Tool 1: B')
    expect(ws.getCell('D21').value).toBe('Two visits')
    expect(ws.getCell('I26').value).toBe('Participants: 12')
    // A domain: header row 29, questions 30–34, total 35, K30:K35 one note cell
    expect(text(ws.getCell('A29'))).toBe('A. Air quality')
    expect(ws.getCell('I30').value).toBe('X') // High
    expect(ws.getCell('F30').value).toBeNull()
    expect(ws.getCell('G31').value).toBe('X') // Low
    expect(ws.getCell('K30').value).toBe('1. Dust')
    expect(ws.getCell('F35').value).toMatchObject({ formula: 'COUNTA(F30:F34)' })
    expect(ws.getCell('M30').value).toMatchObject({ formula: 'COUNTA(F30:J30)' })
    expect(ws.getColumn(13).hidden).toBe(true)
    // Official order: J (rows 71–82) before H (83–94), summary from 95, total 104
    expect(text(ws.getCell('A71'))).toMatch(/^J_/)
    expect(text(ws.getCell('A83'))).toBe('H. Environmental impacts of land use and management')
    expect(text(ws.getCell('A104'))).toBe('TOTAL PROJECT SCORE')
    expect(ws.getCell('F104').value).toMatchObject({ formula: 'SUM(F96:F103)', result: 48 })
    expect(ws.getCell('F105').value).toMatchObject({ result: 'YES' })
    expect(ws.getCell('F106').value).toMatchObject({ result: 'High' })
    for (const range of [
      'A1:K1',
      'A9:K10',
      'A21:C21',
      'E21:H21',
      'I21:K21',
      'B30:E30',
      'K30:K35',
      'K96:K106',
      'A116:K117',
    ]) {
      expect(merges(ws)).toContain(range)
    }
    // a draft has no approver
    expect(text(ws.getCell('A114'))).toBe('Name:')
  })
})

describe('Tools 3 and 4 sheets', () => {
  it('Tool 3: header, ten template rows, responsible user or external party (D55)', async () => {
    const { workbook, fileName } = buildToolWorkbook(
      'tool3',
      { project, rows: management },
      { status: 'In progress', date: DATE }
    )
    const ws = (await roundTrip(workbook)).getWorksheet('Tool 3')

    expect(fileName).toBe('Tool3_Water_network_InProgress_2026-11-04.xlsx')
    expect(merges(ws).sort()).toEqual(['A1:G1', 'A2:G2'])
    expect(ws.getRow(3).values.slice(1)).toEqual([
      'S',
      'Activity description',
      'Potential Impact and Significance/Risk- low-med-high',
      'Recommended Action Items',
      'Monitoring requirements',
      'Responsibility',
      'Notes',
    ])
    expect(ws.getCell('B4').value).toBe('Dust control')
    expect(ws.getCell('F4').value).toBe('Rana')
    expect(ws.getCell('F5').value).toBe('المقاول')
    expect(ws.getCell('F5').alignment.readingOrder).toBe('rtl')
    expect(ws.getCell('A13').value).toBe(10)
  })

  it('Tool 4: official header and the external party', async () => {
    const { workbook } = buildToolWorkbook(
      'tool4',
      { project, rows: mitigation },
      { status: 'Completed', date: DATE }
    )
    const ws = (await roundTrip(workbook)).getWorksheet('Tool 4')
    expect(ws.getCell('H3').value).toBe('Notes ')
    expect(ws.getCell('B4').value).toBe('Fence')
    expect(ws.getCell('F4').value).toBe('Municipality')
  })
})

describe('Tool 5 sheet', () => {
  it('project block, stacked header, categories in official order, record values', async () => {
    const { workbook } = buildToolWorkbook(
      'tool5',
      { project, screening, assessment: tool2.assessment, records, categoriesWithIndicators },
      { status: 'In progress', date: DATE }
    )
    const ws = (await roundTrip(workbook)).getWorksheet('Tool 5')
    expect(ws.getCell('C3').value).toBe('Rana')
    expect(ws.getCell('L6').value).toBe('B')
    expect(ws.getCell('E9').value).toBe('Basline')
    for (const range of ['A1:N1', 'E8:K8', 'A8:A9', 'B10:N10']) expect(merges(ws)).toContain(range)
    expect(ws.getCell('A10').value).toBe('A')
    expect(ws.getCell('B11').value).toBe('Indicator A1')
    expect(ws.getCell('F11').value).toBe('1')
    expect(ws.getCell('L11').value).toBe('Low (rarely visible)')
    expect(ws.getCell('M11').value).toBe('Local council')
    // J before H, numbering restarts per category
    expect(ws.getCell('A34').value).toBe('J')
    expect(ws.getCell('A38').value).toBe('H')
    expect(ws.getCell('A39').value).toBe(1)
  })
})

describe('status and date on every export (D67 d)', () => {
  it('labels the status from the workflow', () => {
    expect(exportStatus(workflow, 'tool1')).toBe('Approved')
    expect(exportStatus(workflow, 'tool2')).toBe('Draft')
    expect(exportStatus({ steps: { assessment: { status: 'rejected' } } }, 'tool2')).toBe(
      'Rejected'
    )
    expect(exportStatus(null, 'tool1', { status: 'submitted' })).toBe('Submitted')
    expect(exportStatus(workflow, 'tool3')).toBe('Completed')
    expect(exportStatus(workflow, 'tool4')).toBe('In progress')
    expect(exportStatus(workflow, 'tool5')).toBe('In progress')
  })

  it('puts status and date in the printed footer, not in the sheet', async () => {
    const { workbook } = buildToolWorkbook(
      'tool3',
      { project, rows: [] },
      { status: 'In progress', date: DATE }
    )
    const ws = (await roundTrip(workbook)).getWorksheet('Tool 3')
    expect(ws.headerFooter.oddFooter).toBe(
      '&LTool 3 – In progress&CExported 2026-11-04&RPage &P of &N'
    )
    const cells = []
    ws.eachRow((row) => row.eachCell((cell) => cells.push(String(text(cell)))))
    expect(cells.some((value) => /In progress|2026-11-04/.test(value))).toBe(false)
  })

  it('file names keep Arabic titles and drop unsafe characters', () => {
    expect(toolFileName('tool2', 'مشروع المياه / حلب', 'Draft', DATE)).toBe(
      'Tool2_مشروع_المياه_حلب_Draft_2026-11-04.xlsx'
    )
    expect(projectFileName('', DATE)).toBe('ESMS_Project_2026-11-04.xlsx')
  })
})

describe('project workbook (D67 b)', () => {
  it('has a sheet per tool with data, in the official order, each with its own status', async () => {
    const { workbook, fileName, tools } = buildProjectWorkbook(
      {
        project,
        workflow,
        screening,
        assessment: tool2,
        management,
        mitigation,
        records,
        categoriesWithQuestions,
        categoriesWithIndicators,
      },
      DATE
    )
    const copy = await roundTrip(workbook)

    expect(fileName).toBe('ESMS_Water_network_2026-11-04.xlsx')
    expect(tools).toEqual(['tool1', 'tool2', 'tool3', 'tool4', 'tool5'])
    expect(copy.worksheets.map((ws) => ws.name)).toEqual([
      'Tool 1',
      'Tool 2',
      'Tool 3',
      'Tool 4',
      'Tool 5',
    ])
    expect(copy.getWorksheet('Tool 1').headerFooter.oddFooter).toMatch(/Tool 1 – Approved/)
    expect(copy.getWorksheet('Tool 2').headerFooter.oddFooter).toMatch(/Tool 2 – Draft/)
    expect(copy.getWorksheet('Tool 3').headerFooter.oddFooter).toMatch(/Tool 3 – Completed/)
  })

  it('leaves out tools without data', () => {
    const { tools } = buildProjectWorkbook(
      {
        project,
        workflow,
        screening,
        assessment: { assessment: null },
        management: [],
        mitigation: [],
        records: [],
      },
      DATE
    )
    expect(tools).toEqual(['tool1'])
  })
})
