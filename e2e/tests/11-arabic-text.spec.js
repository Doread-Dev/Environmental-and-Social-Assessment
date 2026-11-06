// Flow 11 (D76 2): Arabic in the project title and location and in free text of Tools 1–4, typed
// in the UI: the API stores it exactly, the UI shows it, and the export has those cells with
// readingOrder 'rtl' (D72).
import { expect, test } from '../support/test.js'
import { adminApi, createTeam, getAssessment, getScreening } from '../support/api.js'
import { cellsWith, download, readWorkbook } from '../support/excel.js'
import { nextResponse, projectPath, signIn } from '../support/ui.js'

const cells = (page, row) =>
  page.locator('table tbody tr').nth(row).locator('[contenteditable="true"]')

test('Arabic text is stored exactly, shown, and exported right-to-left', async ({ page }) => {
  const team = await createTeam(await adminApi(), ['project_manager', 'environmental_specialist'])
  const editor = team.project_manager
  const specialist = team.environmental_specialist
  const suffix = Date.now().toString().slice(-6)
  const AR = {
    title: `إعادة تأهيل شبكة المياه ${suffix}`,
    location: 'حلب – حي السلام',
    reason: 'آثار محدودة ويمكن التخفيف منها.',
    negative: 'غبار وضجيج أثناء الحفر.',
    positive: 'مياه شرب آمنة للسكان.',
    activity: 'تأهيل الشبكة في حي السلام',
    description: 'حفر الخنادق وتركيب الأنابيب الجديدة.',
    setting: 'منطقة سكنية مكتظة قرب مدرسة.',
    legal: 'رخصة الحفر من البلدية.',
    tool3: 'حفر الخنادق في الشوارع السكنية',
    tool3Impact: 'غبار يؤثر على السكان',
    tool4: 'شبكة توزيع مؤهلة بطول ٨ كم',
    tool4Measures: 'رش المياه مرتين يومياً',
  }

  await signIn(page, editor.email, editor.password)

  // Project (title, location) in the create form
  await page.goto('/app/projects/new')
  await page.getByLabel('Project Title').fill(AR.title)
  await page.getByLabel('Project Location').fill(AR.location)
  await page.getByLabel('Start Date').fill('2026-02-01')
  await page.getByLabel('End Date').fill('2026-12-31')
  await page.getByLabel('Project Component / Activity Description').fill('مياه وصرف صحي')
  await page.getByRole('button', { name: 'Save Project' }).click()
  await expect(page).toHaveURL(/\/overview$/)
  const projectId = page.url().match(/projects\/([0-9a-f]{24})/)[1]
  await expect(page.getByRole('heading', { level: 1, name: AR.title })).toBeVisible()
  await expect(page.getByRole('main').getByText(AR.location).first()).toBeVisible()

  // Tool 1: Arabic justification and impacts, submitted from the page
  await page.goto(projectPath(projectId, 'screening'))
  await page.getByRole('radio', { name: /Category B/ }).check()
  await page.getByLabel('Category justification').fill(AR.reason)
  await page.getByLabel('Potential Negative Impacts').fill(AR.negative)
  await page.getByLabel('Potential Positive Impacts').fill(AR.positive)
  await page.getByRole('button', { name: 'Submit Screening' }).click()
  const submitted = nextResponse(page, 'PATCH', '/screenings/:id/submit')
  await page
    .getByRole('dialog', { name: 'Confirm Submission' })
    .getByRole('button', { name: 'Confirm Submit' })
    .click()
  expect((await submitted).status()).toBe(200)
  const screening = await getScreening(editor.api, projectId)
  await specialist.api.call('PATCH', `/screenings/${screening._id}/approve`, {
    recommendations: 'المتابعة إلى الأداة الثانية.',
  })

  // Tool 2: the four metadata fields in Arabic
  await page.goto(projectPath(projectId, 'assessment'))
  await page.getByRole('button', { name: 'Start Environmental Assessment' }).click()
  await page.getByPlaceholder('Describe here...').fill(AR.activity)
  await page.getByPlaceholder('Describe the activities here...').fill(AR.description)
  await page.getByPlaceholder('Describe the environment here...').fill(AR.setting)
  await page.getByPlaceholder('List legal requirements and compliance strategies...').fill(AR.legal)
  const savedMeta = nextResponse(page, 'PUT', '/assessments/:id')
  await page.getByRole('button', { name: 'Save and Continue' }).click()
  expect((await savedMeta).status()).toBe(200)
  let assessment = await getAssessment(editor.api, projectId)
  await editor.api.call('PATCH', `/assessments/${assessment._id}/submit`, {
    version: assessment.updatedAt,
  })
  await specialist.api.call('PATCH', `/assessments/${assessment._id}/approve`, {
    recommendations: 'إعداد خطة الإدارة البيئية.',
  })

  // Tools 3 and 4: Arabic in the grid cells
  await page.goto(projectPath(projectId, 'semp/activities'))
  await cells(page, 0).nth(0).fill(AR.tool3)
  await cells(page, 0).nth(1).fill(AR.tool3Impact)
  const saved3 = nextResponse(page, 'PUT', '/projects/:id/management')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  expect((await saved3).status()).toBe(200)
  await page.goto(projectPath(projectId, 'semp/mitigation'))
  await cells(page, 0).nth(0).fill(AR.tool4)
  await cells(page, 0).nth(2).fill(AR.tool4Measures)
  const saved4 = nextResponse(page, 'PUT', '/projects/:id/mitigation')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  expect((await saved4).status()).toBe(200)

  // The API stores every value exactly as typed
  const workspace = await editor.api.get(`/projects/${projectId}/workspace`)
  expect(workspace.project).toMatchObject({ title: AR.title, location: AR.location })
  expect(await getScreening(editor.api, projectId)).toMatchObject({
    category_reason: AR.reason,
    potential_negative: AR.negative,
    potential_positive: AR.positive,
  })
  assessment = await getAssessment(editor.api, projectId)
  expect(assessment).toMatchObject({
    project_activity: AR.activity,
    description: AR.description,
    environmental_setting: AR.setting,
    legal_requirements: AR.legal,
  })
  const [tool3] = await editor.api.get(`/management/project/${projectId}`)
  expect(tool3).toMatchObject({ activity_description: AR.tool3, potential_impact: AR.tool3Impact })
  const [tool4] = await editor.api.get(`/mitigation/project/${projectId}`)
  expect(tool4).toMatchObject({
    output_description: AR.tool4,
    mitigation_and_enhancement_measures: AR.tool4Measures,
  })

  // The UI shows them (after a fresh load from the server)
  await page.goto(projectPath(projectId, 'screening'))
  for (const text of [AR.reason, AR.negative, AR.positive]) {
    await expect(page.getByRole('main').getByText(text)).toBeVisible()
  }
  await page.goto(projectPath(projectId, 'assessment'))
  for (const text of [AR.activity, AR.description, AR.setting, AR.legal]) {
    await expect(page.getByRole('main').getByText(text).first()).toBeVisible()
  }
  await page.goto(projectPath(projectId, 'semp/activities'))
  await expect(cells(page, 0).nth(0)).toHaveText(AR.tool3)
  await page.goto(projectPath(projectId, 'semp/mitigation'))
  await expect(cells(page, 0).nth(2)).toHaveText(AR.tool4Measures)

  // The workbook: every Arabic value is in a right-to-left cell
  await page.goto(projectPath(projectId, 'overview'))
  await expect(page.getByRole('heading', { level: 1, name: AR.title })).toBeVisible()
  const file = await download(page, () =>
    page.getByRole('button', { name: 'Export project workbook' }).click()
  )
  expect(file.name).toContain(`إعادة_تأهيل_شبكة_المياه_${suffix}`)
  const workbook = await readWorkbook(file.path)
  const expected = {
    'Tool 1 Screening': [AR.title, AR.location, AR.reason, AR.negative, AR.positive],
    'Tool 2 Assessment': [AR.activity, AR.description, AR.setting, AR.legal],
    'Tool 3 Management': [AR.tool3, AR.tool3Impact],
    'Tool 4 Mitigation': [AR.tool4, AR.tool4Measures],
  }
  for (const [sheet, texts] of Object.entries(expected)) {
    const ws = workbook.getWorksheet(sheet)
    for (const text of texts) {
      const found = cellsWith(ws, text)
      expect(found.length, `${sheet}: ${text}`).toBeGreaterThan(0)
      for (const cell of found) {
        expect(cell.alignment?.readingOrder, `${sheet} ${cell.address}: ${text}`).toBe('rtl')
      }
    }
  }
})
