// Flow 10 (D76 2): export one tool and the project workbook; the downloaded files open with
// ExcelJS and carry the sheets, the status and date in the file name (D67 d) and the key cells.
import { expect, test } from '../support/test.js'
import { adminApi, createTeam, projectAt, tableVersion, uniq } from '../support/api.js'
import { browserDate, cellsWith, download, readWorkbook, sheetNames } from '../support/excel.js'
import { projectPath, signIn } from '../support/ui.js'

const ALL_SHEETS = [
  'Tool 1 Screening',
  'Tool 2 Assessment',
  'Tool 3 Management',
  'Tool 4 Mitigation',
  'Tool 5 Monitoring',
]

test('one tool and the project workbook export with sheets, status, date and key cells', async ({
  page,
}) => {
  const team = await createTeam(await adminApi(), ['program_manager', 'environmental_specialist'])
  const editor = team.program_manager
  // Letters and digits only, so the file-name part is the title with "_" for spaces
  const title = uniq('Export check ')
  const project = await projectAt('semp', editor.api, team.environmental_specialist.api, {
    project: { title },
  })
  const { indicators } = await editor.api.get('/lookups')
  await editor.api.call('PUT', `/projects/${project._id}/monitoring`, {
    version: await tableVersion(editor.api, `/monitoring/project/${project._id}`),
    records: [
      {
        indicator: indicators[0]._id,
        scores: { baseline: '11', Q1: '9', Q2: '8', Q3: '7', Q4: '6' },
        total: '30',
        responsible_text: 'Water board',
      },
    ],
  })
  const namePart = title.replace(/\s+/g, '_')

  await signIn(page, editor.email, editor.password)
  const today = await browserDate(page)

  // One tool: Tool 1 from the screening page
  await page.goto(projectPath(project._id, 'screening'))
  // The header button sends an event the page listens to: wait until the page is there
  await expect(page.getByText('Proceed to Tool 2.')).toBeVisible()
  const tool1 = await download(page, () =>
    page.getByRole('button', { name: 'Export Excel' }).click()
  )
  expect(tool1.name).toBe(`Tool1_${namePart}_Approved_${today}.xlsx`)
  let workbook = await readWorkbook(tool1.path)
  expect(sheetNames(workbook)).toEqual(['Tool 1 Screening'])
  let sheet = workbook.getWorksheet('Tool 1 Screening')
  expect(cellsWith(sheet, title).length).toBeGreaterThan(0)
  expect(cellsWith(sheet, 'Site-specific, reversible impacts.').length).toBeGreaterThan(0)
  expect(cellsWith(sheet, 'Proceed to Tool 2.').length).toBeGreaterThan(0)
  expect(cellsWith(sheet, team.environmental_specialist.user.name).length).toBeGreaterThan(0)
  expect(sheet.headerFooter.oddFooter).toContain('Tool 1 – Approved')
  expect(sheet.headerFooter.oddFooter).toContain(`Exported ${today}`)

  // One tool: Tool 3 from its page (status from the workflow: Completed)
  await page.goto(projectPath(project._id, 'semp/activities'))
  await expect(page.locator('table tbody')).toContainText('Trench excavation')
  const tool3 = await download(page, () =>
    page.getByRole('button', { name: 'Export Excel' }).click()
  )
  expect(tool3.name).toBe(`Tool3_${namePart}_Completed_${today}.xlsx`)
  workbook = await readWorkbook(tool3.path)
  expect(sheetNames(workbook)).toEqual(['Tool 3 Management'])
  sheet = workbook.getWorksheet('Tool 3 Management')
  expect(cellsWith(sheet, 'Trench excavation').length).toBeGreaterThan(0)
  expect(cellsWith(sheet, 'Contractor (external party)').length).toBeGreaterThan(0)

  // The project workbook from the overview: a sheet per tool, Tool 1 → Tool 5
  await page.goto(projectPath(project._id, 'overview'))
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
  const all = await download(page, () =>
    page.getByRole('button', { name: 'Export project workbook' }).click()
  )
  expect(all.name).toBe(`ESMS_${namePart}_${today}.xlsx`)
  workbook = await readWorkbook(all.path)
  expect(sheetNames(workbook)).toEqual(ALL_SHEETS)
  const key = {
    'Tool 1 Screening': ['Site-specific, reversible impacts.', 'Proceed to Tool 2.'],
    'Tool 2 Assessment': ['Water network rehabilitation', 'Prepare the SEMP.'],
    'Tool 3 Management': ['Trench excavation', 'Water spraying'],
    'Tool 4 Mitigation': ['Rehabilitated network', 'Dust suppression'],
    'Tool 5 Monitoring': [indicators[0].name, 'Water board (external party)'],
  }
  for (const [name, texts] of Object.entries(key)) {
    const ws = workbook.getWorksheet(name)
    expect(cellsWith(ws, title).length, `${name}: project title`).toBeGreaterThan(0)
    for (const text of texts)
      expect(cellsWith(ws, text).length, `${name}: ${text}`).toBeGreaterThan(0)
    expect(ws.headerFooter.oddFooter, `${name}: footer date`).toContain(`Exported ${today}`)
  }
  // Monitoring quarters are exported as entered (free text, D57)
  const monitoring = workbook.getWorksheet('Tool 5 Monitoring')
  const row = cellsWith(monitoring, indicators[0].name)[0].row
  const values = monitoring.getRow(row).values.map((v) => (v == null ? '' : String(v)))
  for (const value of ['11', '9', '8', '7', '6', '30']) expect(values).toContain(value)
  expect(workbook.getWorksheet('Tool 2 Assessment').headerFooter.oddFooter).toContain(
    'Tool 2 – Approved'
  )
  expect(workbook.getWorksheet('Tool 5 Monitoring').headerFooter.oddFooter).toContain(
    'Tool 5 – Completed'
  )
})
