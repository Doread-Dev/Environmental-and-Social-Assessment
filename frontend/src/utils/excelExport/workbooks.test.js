import { describe, expect, it } from 'vitest'
import ExcelJS from 'exceljs'
import { buildProjectWorkbook, buildToolWorkbook } from './workbooks'
import { exportStatus, projectFileName, toolFileName } from './exportMeta'

const DATE = new Date(2026, 10, 4)
const CODES = ['A', 'B', 'C', 'D', 'E', 'F', 'H', 'J']

// Every value is unique, so the completeness checks can find each one in the sheet
const project = {
  _id: 'p1',
  title: 'Water network',
  location: 'Aleppo district',
  project_component: 'Pipe replacement component',
  start_date: '2026-01-15',
  end_date: '2026-12-31',
}
const officer = { _id: 'u1', name: 'Rana Officer', job_title: { title_name: 'Field Engineer' } }
const approver = { _id: 'u2', name: 'Omar Approver', job_title: { title_name: 'Env Specialist' } }
const history = (status) => [
  { status: 'created', at: '2026-02-01T08:00:00Z' },
  { status: 'submitted', at: '2026-02-02T08:00:00Z' },
  { status, at: '2026-02-03T08:00:00Z' },
]

const screening = {
  _id: 's1',
  status: 'approved',
  category_code: 'B',
  category_reason: 'Urban works near homes',
  potential_negative: 'غبار وضجيج',
  potential_positive: 'Clean water supply',
  screening_date: '2026-02-01',
  officer,
  approved_by: approver,
  recommendations: 'Proceed with dust control',
  status_history: history('approved'),
}
const rejectedScreening = {
  ...screening,
  status: 'rejected',
  approved_by: undefined,
  recommendations: undefined,
  reject_by: approver,
  reject_reason: 'Category reason too short',
  status_history: history('rejected'),
}

const categoriesWithQuestions = CODES.map((code) => ({
  code,
  name: `Domain ${code}`,
  questions: Array.from({ length: ['H', 'J'].includes(code) ? 10 : 5 }, (_, i) => ({
    _id: `${code}${i + 1}`,
    question: `Question ${code}${i + 1}`,
  })),
}))
const impactScores = categoriesWithQuestions.flatMap((c) =>
  c.questions.map((q) => ({ question: q._id, level: 'negligible' }))
)
impactScores[0] = { question: 'A1', level: 'high', note: 'Dust from trucks' }
impactScores[1] = { question: { _id: 'A2' }, level: 'low', note: 'ملاحظة' }
const tool2 = {
  assessment: {
    _id: 'a1',
    status: 'approved',
    project_activity: 'Activity assessed',
    description: 'Replace old pipes',
    environmental_setting: 'Dense urban setting',
    legal_requirements: 'Local water law',
    potential_negative_impact: 'Noise during works',
    potential_positive_impact: 'Fewer leaks',
    total_project_score: { negligible: 48, low: 1, medium: 0, high: 1, not_applicable: 0 },
    total_project_impact: 'high',
    officer,
    approved_by: approver,
    recommendations: 'Prepare SEMP',
    status_history: history('approved'),
  },
  methods: [
    { method_type: 'field_visits', details: 'Two visits in March' },
    { method_type: 'other', details: 'Drone survey' },
  ],
  consultations: [
    { type: 'village_meetings', participants: '12 residents', notes: 'Held at the school' },
  ],
  impactScores,
}

const management = [
  {
    _id: 'm1',
    serial_number: 1,
    activity_description: 'Dust control',
    potential_impact: 'Medium dust',
    recommended_actions: ['Water spraying', 'Covered trucks'],
    monitoring_requirements: 'Daily log',
    responsible: officer,
    responsible_text: '',
    notes: 'Check weekly',
  },
  {
    _id: 'm2',
    serial_number: 2,
    activity_description: 'Waste removal',
    responsible: null,
    responsible_text: 'المقاول',
  },
]
const mitigation = [
  {
    _id: 't1',
    serial_number: 1,
    output_description: 'Fence the site',
    potential_impact_and_significance: 'Injury risk - high',
    mitigation_and_enhancement_measures: 'Fencing and signs',
    monitoring: 'Weekly walk',
    schedule: 'Month 1',
    responsible: null,
    responsible_text: 'Municipality',
    notes: 'Signs in Arabic',
  },
]
const categoriesWithIndicators = CODES.map((code) => ({
  code,
  name: `Domain ${code}`,
  indicators: [1, 2, 3].map((n) => ({
    _id: `i${code}${n}`,
    name: `Indicator ${code}${n}`,
    definition: `Definition ${code}${n}`,
    measurement: `Measurement ${code}${n}`,
  })),
}))
const records = [
  {
    _id: 'r1',
    indicator: 'iA1',
    scores: { baseline: 'base-0', Q1: 'q1-val', Q2: 'q2-val', Q3: 'q3-val', Q4: 'q4-val' },
    total: 'total-val',
    final_assessment: 'score-val',
    ranking: 'low',
    responsible: null,
    responsible_text: 'Local council',
    note: 'Monitoring note',
  },
  { _id: 'placeholder_iA2', indicator: 'iA2', note: 'unsaved' },
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
const cellText = (cell) =>
  cell.value?.richText ? cell.value.richText.map((t) => t.text).join('') : String(cell.value ?? '')
// "label | value | …" for every row, so a check sees a value next to its label
function rowsOf(ws) {
  const rows = []
  ws.eachRow((row) => {
    const values = []
    row.eachCell((cell) => {
      if (cell.isMerged && cell.master !== cell) return
      const text = cellText(cell)
      if (text) values.push(text)
    })
    rows.push(values.join(' | '))
  })
  return rows
}
const hasRow = (rows, ...parts) => rows.some((row) => parts.every((part) => row.includes(part)))

async function sheetOf(tool, data, status) {
  const { workbook, fileName } = buildToolWorkbook(tool, data, { status, date: DATE })
  const copy = await roundTrip(workbook)
  return { ws: copy.worksheets[0], fileName }
}

describe('completeness: every field the app holds for the tool is in its sheet, labelled (D68)', () => {
  it('Tool 1: project, officer, dates, status, category + reason, impacts, approval', async () => {
    const rows = rowsOf((await sheetOf('tool1', { project, screening }, 'Approved')).ws)

    expect(
      hasRow(rows, 'Project Title:', 'Water network', 'Screening Date:', 'February 1, 2026')
    ).toBe(true)
    expect(hasRow(rows, 'Location:', 'Aleppo district', 'Status:', 'Approved')).toBe(true)
    expect(hasRow(rows, 'Program Officer:', 'Rana Officer', 'Position:', 'Field Engineer')).toBe(
      true
    )
    expect(hasRow(rows, 'Project Start Date:', 'January 15, 2026', 'Project End Date:')).toBe(true)
    expect(hasRow(rows, 'Submitted on:', 'February 2, 2026')).toBe(true)
    expect(hasRow(rows, 'Project Components/Activities:', 'Pipe replacement component')).toBe(true)
    expect(hasRow(rows, 'Screening Project Category:', 'Category B')).toBe(true)
    expect(hasRow(rows, 'Category B: ✓ selected')).toBe(true)
    expect(hasRow(rows, 'Why Category B:', 'Urban works near homes')).toBe(true)
    expect(hasRow(rows, 'Potential Negative Impact:', 'غبار وضجيج')).toBe(true)
    expect(hasRow(rows, 'Potential Positive Impact:', 'Clean water supply')).toBe(true)
    expect(hasRow(rows, 'Name:', 'Omar Approver', 'Position:', 'Env Specialist')).toBe(true)
    expect(hasRow(rows, 'Approved on:', 'February 3, 2026')).toBe(true)
    expect(hasRow(rows, 'Recommendations:', 'Proceed with dust control')).toBe(true)
  })

  it('Tool 1 rejected: who rejected, when and why; no approval', async () => {
    const rows = rowsOf(
      (await sheetOf('tool1', { project, screening: rejectedScreening }, 'Rejected')).ws
    )
    expect(hasRow(rows, 'Rejected by:')).toBe(true)
    expect(hasRow(rows, 'Name:', 'Omar Approver')).toBe(true)
    expect(hasRow(rows, 'Rejected on:', 'February 3, 2026')).toBe(true)
    expect(hasRow(rows, 'Reason for rejection:', 'Category reason too short')).toBe(true)
    expect(hasRow(rows, 'Recommendations:')).toBe(false)
  })

  it('Tool 1 submitted: no review section', async () => {
    const submitted = { ...screening, status: 'submitted', approved_by: undefined }
    const rows = rowsOf((await sheetOf('tool1', { project, screening: submitted }, 'Submitted')).ws)
    expect(hasRow(rows, 'Status:', 'Submitted')).toBe(true)
    expect(hasRow(rows, 'The Approval and Recommendations by:')).toBe(false)
  })

  it('Tool 2: officer, status, texts, methods, consultations, scores + notes, totals, approval', async () => {
    const rows = rowsOf(
      (
        await sheetOf(
          'tool2',
          { project, screening, ...tool2, categoriesWithQuestions },
          'Approved'
        )
      ).ws
    )

    expect(hasRow(rows, 'Officer Name:', 'Rana Officer', 'Position:', 'Field Engineer')).toBe(true)
    expect(hasRow(rows, 'Location:', 'Aleppo district', 'Project Title:', 'Water network')).toBe(
      true
    )
    expect(hasRow(rows, 'Start Date:', 'January 15, 2026', 'End Date:', 'December 31, 2026')).toBe(
      true
    )
    expect(hasRow(rows, 'Category (Tool 1):', 'B', 'Status:', 'Approved')).toBe(true)
    expect(hasRow(rows, 'Submitted on:', 'February 2, 2026')).toBe(true)
    expect(hasRow(rows, 'Component Assessed:', 'Activity assessed')).toBe(true)
    expect(hasRow(rows, 'Brief Description:', 'Replace old pipes')).toBe(true)
    expect(hasRow(rows, 'Environmental Setting:', 'Dense urban setting')).toBe(true)
    expect(hasRow(rows, 'Legal Requirements:', 'Local water law')).toBe(true)
    expect(hasRow(rows, 'YES', 'Field visits', 'Details: Two visits in March')).toBe(true)
    expect(hasRow(rows, 'YES', 'Details: Drone survey')).toBe(true)
    expect(hasRow(rows, 'NO', 'Available technical reports')).toBe(true)
    expect(
      hasRow(
        rows,
        'YES',
        'Village or site meetings',
        'Participants: 12 residents',
        'Notes: Held at the school'
      )
    ).toBe(true)
    expect(hasRow(rows, 'A.1', 'Question A1', 'X', 'Dust from trucks')).toBe(true)
    expect(hasRow(rows, 'A.2', 'Question A2', 'X', 'ملاحظة')).toBe(true)
    expect(rows).toContain('Total Score - Category A | 3 | 1 | 0 | 1 | 0')
    expect(rows).toContain('TOTAL PROJECT SCORE | 48 | 1 | 0 | 1 | 0')
    expect(hasRow(rows, 'All questions scored:', 'YES (50 of 50)')).toBe(true)
    expect(
      hasRow(rows, 'Changed from Negligible:', 'You changed 2 of 50; the other 48 stay Negligible.')
    ).toBe(true)
    expect(hasRow(rows, 'TOTAL PROJECT IMPACT:', 'High')).toBe(true)
    expect(hasRow(rows, 'Potential Negative Impact:', 'Noise during works')).toBe(true)
    expect(hasRow(rows, 'Potential Positive Impact:', 'Fewer leaks')).toBe(true)
    expect(hasRow(rows, 'Approved on:', 'February 3, 2026')).toBe(true)
    expect(hasRow(rows, 'Recommendations:', 'Prepare SEMP')).toBe(true)
  })

  it('Tool 3: every column of every saved row, responsible user or external party', async () => {
    const rows = rowsOf((await sheetOf('tool3', { project, rows: management }, 'Completed')).ws)

    expect(hasRow(rows, 'Project Title:', 'Water network', 'Location:', 'Aleppo district')).toBe(
      true
    )
    expect(hasRow(rows, 'Status:', 'Completed')).toBe(true)
    expect(
      hasRow(
        rows,
        'Dust control',
        'Medium dust',
        'Water spraying\nCovered trucks',
        'Daily log',
        'Rana Officer',
        'Check weekly'
      )
    ).toBe(true)
    expect(hasRow(rows, '2', 'Waste removal', 'المقاول (external party)')).toBe(true)
  })

  it('Tool 4: every column, schedule and the external party', async () => {
    const rows = rowsOf((await sheetOf('tool4', { project, rows: mitigation }, 'In progress')).ws)
    expect(
      hasRow(
        rows,
        'Fence the site',
        'Injury risk - high',
        'Fencing and signs',
        'Weekly walk',
        'Municipality (external party)',
        'Month 1',
        'Signs in Arabic'
      )
    ).toBe(true)
    expect(hasRow(rows, 'Status:', 'In progress')).toBe(true)
  })

  it('Tool 5: every indicator with baseline, quarters, total, final assessment, ranking, responsible, note', async () => {
    const rows = rowsOf(
      (
        await sheetOf(
          'tool5',
          { project, screening, assessment: tool2.assessment, records, categoriesWithIndicators },
          'In progress'
        )
      ).ws
    )
    expect(hasRow(rows, 'Officer Name:', 'Rana Officer', 'Position:', 'Field Engineer')).toBe(true)
    expect(hasRow(rows, 'Project Title:', 'Water network', 'Location:', 'Aleppo district')).toBe(
      true
    )
    expect(hasRow(rows, 'Category (Tool 1):', 'B', 'Status:', 'In progress')).toBe(true)
    // The column holding final_assessment is labelled as on the Tool 5 page, not "Score"
    expect(hasRow(rows, 'Total', 'Final Assessment', 'Ranking')).toBe(true)
    expect(rows.some((row) => /\| Score \|/.test(row))).toBe(false)
    expect(
      hasRow(
        rows,
        'Indicator A1',
        'Definition A1',
        'Measurement A1',
        'base-0',
        'q1-val',
        'q2-val',
        'q3-val',
        'q4-val',
        'total-val',
        'score-val',
        'Low (rarely visible)',
        'Local council (external party)',
        'Monitoring note'
      )
    ).toBe(true)
    // all 24 indicators listed; an unsaved placeholder adds nothing
    expect(rows.filter((row) => /Indicator [A-J][1-3]/.test(row)).length).toBe(24)
    expect(rows.some((row) => row.includes('unsaved'))).toBe(false)
  })
})

describe('layout', () => {
  it('sheets are named by tool, start with the AKF header and keep the table headers', async () => {
    const { ws } = await sheetOf('tool3', { project, rows: management }, 'Completed')
    expect(ws.name).toBe('Tool 3 Management')
    expect(cellText(ws.getCell('A1'))).toBe('AGA KHAN FOUNDATION - SYRIA')
    expect(cellText(ws.getCell('A2'))).toBe('Environmental Assessment - Tool 3')
    expect(rowsOf(ws)).toContain(
      'S | Activity description | Potential Impact and Significance/Risk | Recommended Action Items | Monitoring requirements | Responsibility | Notes'
    )
  })

  it('Arabic text reads right to left; Latin text keeps the default', async () => {
    const { ws } = await sheetOf('tool3', { project, rows: management }, 'Completed')
    const find = (text) => {
      let found
      ws.eachRow((row) =>
        row.eachCell((cell) => {
          if (cellText(cell) === text) found = cell
        })
      )
      return found
    }
    expect(find('المقاول (external party)').alignment).toMatchObject({
      readingOrder: 'rtl',
      horizontal: 'right',
    })
    expect(find('Dust control').alignment.readingOrder).toBeUndefined()
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

  it('puts status and date in the printed footer and the file name', async () => {
    const { ws, fileName } = await sheetOf(
      'tool2',
      { project, screening, ...tool2, categoriesWithQuestions },
      'Draft'
    )
    expect(fileName).toBe('Tool2_Water_network_Draft_2026-11-04.xlsx')
    expect(ws.headerFooter.oddFooter).toBe('&LTool 2 – Draft&CExported 2026-11-04&RPage &P of &N')
  })

  it('file names keep Arabic titles and drop unsafe characters', () => {
    expect(toolFileName('tool2', 'مشروع المياه / حلب', 'Draft', DATE)).toBe(
      'Tool2_مشروع_المياه_حلب_Draft_2026-11-04.xlsx'
    )
    expect(toolFileName('tool3', 'X', 'In progress', DATE)).toBe(
      'Tool3_X_InProgress_2026-11-04.xlsx'
    )
    expect(projectFileName('', DATE)).toBe('ESMS_Project_2026-11-04.xlsx')
  })
})

describe('project workbook (D67 b)', () => {
  it('has a sheet per tool with data, Tool 1 → Tool 5, each footer with its own status', async () => {
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
      'Tool 1 Screening',
      'Tool 2 Assessment',
      'Tool 3 Management',
      'Tool 4 Mitigation',
      'Tool 5 Monitoring',
    ])
    const footer = (name) => copy.getWorksheet(name).headerFooter.oddFooter
    expect(footer('Tool 1 Screening')).toMatch(/Tool 1 – Approved/)
    expect(footer('Tool 2 Assessment')).toMatch(/Tool 2 – Draft/)
    expect(footer('Tool 3 Management')).toMatch(/Tool 3 – Completed/)
    expect(footer('Tool 4 Mitigation')).toMatch(/Tool 4 – In progress/)
    expect(footer('Tool 5 Monitoring')).toMatch(/Tool 5 – In progress/)
    // Tools 3–5 show the same status in their project block
    expect(hasRow(rowsOf(copy.getWorksheet('Tool 3 Management')), 'Status:', 'Completed')).toBe(
      true
    )
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
