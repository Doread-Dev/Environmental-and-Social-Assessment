// Flow 4: Tools 3 and 4 are saved as whole tables (one bulk request per Save, D32); once both
// have described rows, Monitoring (Tool 5) unlocks and quarter data is saved.
import { expect, test } from '../support/test.js'
import { adminApi, createTeam, projectAt } from '../support/api.js'
import { countRequests, nextResponse, projectPath, signIn } from '../support/ui.js'

/** The contenteditable cells of the n-th body row of the Tools 3/4 grid. */
const cells = (page, row) =>
  page.locator('table tbody tr').nth(row).locator('[contenteditable="true"]')

test('Tools 3 & 4 bulk save → Monitoring unlocks → quarter data saved', async ({ page }) => {
  const team = await createTeam(await adminApi(), [
    'environmental_focal_point',
    'environmental_specialist',
  ])
  const editor = team.environmental_focal_point
  const project = await projectAt('assessment', editor.api, team.environmental_specialist.api)
  const sidebar = page.getByRole('complementary')

  await signIn(page, editor.email, editor.password)
  // Monitoring is locked until Tools 3 and 4 are complete: plain text in the project sidebar
  // (the Tools 3/4 pages have no sidebar), no link
  await page.goto(projectPath(project._id, 'overview'))
  await expect(sidebar.getByText('Monitoring – Tool 5')).toBeVisible()
  await expect(sidebar.getByRole('link', { name: 'Monitoring – Tool 5' })).toHaveCount(0)
  await page.goto(projectPath(project._id, 'semp/activities'))

  // Tool 3: two rows, one Save = one request
  await cells(page, 0).nth(0).fill('Excavation')
  await cells(page, 0).nth(1).fill('Dust')
  await cells(page, 0).nth(2).fill('Water spraying')
  await cells(page, 0).nth(3).fill('Daily log')
  await page.locator('table tbody tr').nth(0).getByRole('button', { name: 'External' }).click()
  await page.locator('table tbody tr').nth(0).getByLabel('External party').fill('Contractor')
  await page.getByRole('button', { name: 'Add another row' }).click()
  await cells(page, 1).nth(0).fill('Waste removal')
  await page
    .locator('table tbody tr')
    .nth(1)
    .getByLabel('Responsible user')
    .selectOption({ label: editor.user.name })

  const managementPuts = countRequests(page, 'PUT', '/projects/:id/management')
  const savedTool3 = nextResponse(page, 'PUT', '/projects/:id/management')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  expect((await savedTool3).status()).toBe(200)
  await expect(page.getByRole('button', { name: /Saved/ })).toBeVisible()
  expect(managementPuts).toHaveLength(1)

  const tool3 = await editor.api.call('GET', `/management/project/${project._id}`, undefined, {
    full: true,
  })
  expect(tool3.version).toBe(1)
  expect(
    tool3.data.map((r) => [r.serial_number, r.activity_description, r.responsible_text || null])
  ).toEqual([
    [1, 'Excavation', 'Contractor'],
    [2, 'Waste removal', null],
  ])
  expect(tool3.data[0]).toMatchObject({
    potential_impact: 'Dust',
    monitoring_requirements: 'Daily log',
  })
  expect(tool3.data[1].responsible._id).toBe(editor.user._id)

  // Still locked: Tool 4 is empty
  let workspace = await editor.api.get(`/projects/${project._id}/workspace`)
  expect(workspace.workflow.steps.monitoring.status).toBe('locked')

  // Tool 4: one row
  await page.goto(projectPath(project._id, 'semp/mitigation'))
  await cells(page, 0).nth(0).fill('New pipes')
  await cells(page, 0).nth(1).fill('Noise – low')
  await cells(page, 0).nth(2).fill('Day work only')
  await cells(page, 0).nth(3).fill('Weekly check')
  await cells(page, 0).nth(4).fill('Q1–Q2')
  await page.locator('table tbody tr').nth(0).getByRole('button', { name: 'External' }).click()
  await page.locator('table tbody tr').nth(0).getByLabel('External party').fill('Municipality')
  const savedTool4 = nextResponse(page, 'PUT', '/projects/:id/mitigation')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  expect((await savedTool4).status()).toBe(200)
  await expect(page.getByRole('button', { name: /Saved/ })).toBeVisible()

  const tool4 = await editor.api.get(`/mitigation/project/${project._id}`)
  expect(tool4).toHaveLength(1)
  expect(tool4[0]).toMatchObject({
    serial_number: 1,
    output_description: 'New pipes',
    mitigation_and_enhancement_measures: 'Day work only',
    schedule: 'Q1–Q2',
    responsible_text: 'Municipality',
  })

  // Monitoring unlocks (backend workflow and the sidebar link)
  workspace = await editor.api.get(`/projects/${project._id}/workspace`)
  expect(workspace.workflow.steps.semp.status).toBe('completed')
  expect(workspace.workflow.steps.monitoring.status).toBe('not_started')
  await page.goto(projectPath(project._id, 'overview'))
  await expect(sidebar.getByRole('link', { name: 'Monitoring – Tool 5' })).toBeVisible()

  // Tool 5: baseline and four quarters on the first indicator
  const { indicators } = await editor.api.get('/lookups')
  const indicator = indicators[0]
  await page.goto(projectPath(project._id, 'monitoring/data-entry'))
  const row = page.getByRole('row').filter({ hasText: indicator.name })
  const values = { Baseline: '12', Q1: '10', Q2: '9', Q3: '8', Q4: '7', Total: '34' }
  for (const [name, value] of Object.entries(values)) {
    await row.getByRole('textbox', { name, exact: true }).fill(value)
  }
  await row.getByLabel('Ranking').selectOption({ index: 3 })
  const savedTool5 = nextResponse(page, 'PUT', '/projects/:id/monitoring')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  expect((await savedTool5).status()).toBe(200)

  const records = await editor.api.get(`/monitoring/project/${project._id}`)
  const record = records.find((r) => (r.indicator._id ?? r.indicator) === indicator._id)
  expect(record.scores).toMatchObject({ baseline: '12', Q1: '10', Q2: '9', Q3: '8', Q4: '7' })
  expect(record.total).toBe('34')
  expect(record.ranking).toBeTruthy()
  workspace = await editor.api.get(`/projects/${project._id}/workspace`)
  expect(workspace.workflow.steps.monitoring.status).toBe('completed')
  expect(workspace.workflow.status).toBe('completed')
})
