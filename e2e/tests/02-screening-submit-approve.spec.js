// Flow 2: an editor creates a project and its screening (Tool 1) and submits it; a specialist
// approves it with recommendations (D13, D16, D74 5).
import { expect, test } from '../support/test.js'
import { adminApi, createTeam, getScreening, uniq } from '../support/api.js'
import { nextResponse, projectPath, signIn } from '../support/ui.js'

test('editor creates a project and submits its screening; a specialist approves it', async ({
  page,
  newUserPage,
}) => {
  const team = await createTeam(await adminApi(), ['project_manager', 'environmental_specialist'])
  const editor = team.project_manager
  const specialist = team.environmental_specialist
  const title = uniq('E2E screening flow ')

  // Editor: create the project
  await signIn(page, editor.email, editor.password)
  await page.goto('/app/projects/new')
  await page.getByLabel('Project Title').fill(title)
  await page.getByLabel('Project Location').fill('Homs')
  await page.getByLabel('Start Date').fill('2026-03-01')
  await page.getByLabel('End Date').fill('2026-12-31')
  await page.getByLabel('Project Component / Activity Description').fill('Irrigation canals')
  await page.getByRole('button', { name: 'Save Project' }).click()
  await expect(page).toHaveURL(/\/app\/projects\/[0-9a-f]{24}\/overview$/)
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
  const projectId = page.url().match(/projects\/([0-9a-f]{24})/)[1]

  // Screening form: category, justification, impacts; submit after the in-app confirmation
  await page.getByRole('button', { name: 'Open Tool 1' }).click()
  await expect(page).toHaveURL(projectPath(projectId, 'screening'))
  await page.getByRole('radio', { name: /Category B/ }).check()
  await page.getByLabel('Category justification').fill('Small canals, reversible impacts.')
  await page.getByLabel('Potential Negative Impacts').fill('Dust during digging.')
  await page.getByLabel('Potential Positive Impacts').fill('More water for farms.')
  await page.getByRole('button', { name: 'Submit Screening' }).click()
  const confirm = page.getByRole('dialog', { name: 'Confirm Submission' })
  const submitted = nextResponse(page, 'PATCH', '/screenings/:id/submit')
  await confirm.getByRole('button', { name: 'Confirm Submit' }).click()
  expect((await submitted).status()).toBe(200)
  await expect(page.getByText('Pending Approval')).toBeVisible()

  // Stored: submitted by the editor, officer set, history created → submitted
  let screening = await getScreening(editor.api, projectId)
  expect(screening).toMatchObject({
    status: 'submitted',
    category_code: 'B',
    category_reason: 'Small canals, reversible impacts.',
    potential_negative: 'Dust during digging.',
    potential_positive: 'More water for farms.',
  })
  expect(screening.officer._id).toBe(editor.user._id)
  expect(screening.status_history.map((h) => h.status)).toEqual(['created', 'submitted'])
  // The editor cannot approve (no review controls, API 403)
  await expect(page.getByRole('button', { name: /Approve/ })).toHaveCount(0)
  const denied = await editor.api.raw('PATCH', `/screenings/${screening._id}/approve`, {
    recommendations: 'x',
  })
  expect(denied.status).toBe(403)

  // Specialist: approve needs recommendations, then the in-app confirmation
  const review = await newUserPage()
  await signIn(review, specialist.email, specialist.password)
  await review.goto(projectPath(projectId, 'screening'))
  const approve = review.getByRole('button', { name: 'Approve & Complete Screening' })
  await expect(approve).toBeDisabled()
  await review.getByLabel('Recommendations / Next Steps').fill('Go on with Tool 2.')
  await approve.click()
  const dialog = review.getByRole('dialog', { name: /Approve the screening/ })
  const approved = nextResponse(review, 'PATCH', '/screenings/:id/approve')
  await dialog.getByRole('button', { name: 'Approve' }).click()
  expect((await approved).status()).toBe(200)
  await expect(review.getByText('Pending Approval')).toBeHidden()
  await expect(review.getByText('Approved', { exact: true }).first()).toBeVisible()

  // Stored: approved by the specialist with the recommendations; history has all three steps
  screening = await getScreening(specialist.api, projectId)
  expect(screening.status).toBe('approved')
  expect(screening.recommendations).toBe('Go on with Tool 2.')
  expect(screening.approved_by._id).toBe(specialist.user._id)
  expect(screening.status_history.map((h) => [h.status, h.by?._id])).toEqual([
    ['created', editor.user._id],
    ['submitted', editor.user._id],
    ['approved', specialist.user._id],
  ])
  const workspace = await specialist.api.get(`/projects/${projectId}/workspace`)
  expect(workspace.workflow.steps.screening.status).toBe('approved')
  expect(workspace.workflow.steps.assessment.status).toBe('not_started')
})
