// Flow 3: an assessment (Tool 2) starts with every question Negligible (D54); the editor changes a
// few, submits (the confirmation counts the changes, D67 c), and a specialist approves it.
import { expect, test } from '../support/test.js'
import { adminApi, createTeam, getAssessment, projectAt } from '../support/api.js'
import { nextResponse, projectPath, signIn } from '../support/ui.js'

test('assessment with defaults → change a few → submit → approve', async ({
  page,
  newUserPage,
}) => {
  const team = await createTeam(await adminApi(), ['program_manager', 'environmental_specialist'])
  const editor = team.program_manager
  const specialist = team.environmental_specialist
  const project = await projectAt('screening', editor.api, specialist.api)
  const lookups = await editor.api.get('/lookups')
  const questionCount = lookups.impact_questions.length

  // Editor: start the assessment and fill the metadata (inputs start empty, D69)
  await signIn(page, editor.email, editor.password)
  await page.goto(projectPath(project._id, 'assessment'))
  await page.getByRole('button', { name: 'Start Environmental Assessment' }).click()
  await expect(
    page.getByRole('heading', { name: 'Environmental Assessment Metadata' })
  ).toBeVisible()
  await expect(page.getByPlaceholder('Describe here...')).toHaveValue('')
  await page.getByPlaceholder('Describe here...').fill('New irrigation canal')
  await page.getByPlaceholder('Describe the activities here...').fill('Digging, lining, gates.')
  await page.getByPlaceholder('Describe the environment here...').fill('Farmland near a river.')
  await page
    .getByPlaceholder('List legal requirements and compliance strategies...')
    .fill('Water use permit.')
  await page.getByRole('button', { name: 'Save and Continue' }).click()
  await expect(page).toHaveURL(projectPath(project._id, 'assessment/methods'))

  // Every question starts Negligible, in the page and in the database
  let assessment = await getAssessment(editor.api, project._id)
  expect(assessment.scores).toHaveLength(questionCount)
  expect(new Set(assessment.scores.map((s) => s.level))).toEqual(new Set(['negligible']))
  expect(assessment.project_activity).toBe('New irrigation canal')

  await page.goto(projectPath(project._id, 'assessment/scoring'))
  await expect(page.locator('main')).toContainText(
    new RegExp(String.raw`${questionCount}\s*Negligible\s*0\s*Low\s*0\s*Medium\s*0\s*High`)
  )
  await expect(page.getByRole('heading', { level: 2, name: 'Negligible Risk' })).toBeVisible()

  // Change three questions: one Low (A), one Medium (B), one High (C)
  const changes = [
    ['A. Air Quality', 'Low'],
    ['B. Water Quality', 'Medium'],
    ['C. The quality and effect of noise', 'High'],
  ]
  for (const [category, level] of changes) {
    const group = page
      .locator('details')
      .filter({ has: page.getByRole('heading', { name: category }) })
    await group.locator('summary').click()
    await group.getByRole('combobox').first().selectOption({ label: level })
  }
  await page
    .getByPlaceholder('Describe the potential negative consequences of the project...')
    .fill('Silt in the river during works.')
  await page
    .getByPlaceholder('Describe the expected positive outcomes and benefits...')
    .fill('Less water lost.')
  await expect(page.getByRole('heading', { level: 2, name: 'High Risk' })).toBeVisible()

  // Submit: the confirmation says how many questions differ from Negligible
  await page.getByRole('button', { name: 'Submit Assessment' }).click()
  const confirm = page.getByRole('dialog', { name: 'Confirm Submission' })
  await expect(confirm).toContainText(
    `You changed 3 of ${questionCount}; the other ${questionCount - 3} stay Negligible.`
  )
  const submitted = nextResponse(page, 'PATCH', '/assessments/:id/submit')
  await confirm.getByRole('button', { name: /Confirm/ }).click()
  expect((await submitted).status()).toBe(200)
  await expect(confirm).toBeHidden()

  // Stored: submitted, the three levels, totals recalculated by the server
  assessment = await getAssessment(editor.api, project._id)
  expect(assessment.status).toBe('submitted')
  expect(assessment.total_project_impact).toBe('high')
  expect(assessment.total_project_score).toMatchObject({
    negligible: questionCount - 3,
    low: 1,
    medium: 1,
    high: 1,
  })
  expect(assessment.potential_negative_impact).toBe('Silt in the river during works.')
  expect(assessment.status_history.map((h) => h.status)).toEqual(['created', 'submitted'])
  // Locked while submitted (409), whoever writes
  const locked = await editor.api.raw('PUT', `/assessments/${assessment._id}`, {
    version: assessment.updatedAt,
    description: 'changed',
  })
  expect(locked.status).toBe(409)

  // Specialist: review → recommendations → approve (in-app confirmation)
  const review = await newUserPage()
  await signIn(review, specialist.email, specialist.password)
  await review.goto(projectPath(project._id, 'assessment'))
  const approve = review.getByRole('button', { name: 'Approve & Complete Assessment' })
  await expect(approve).toBeDisabled()
  await review
    .getByPlaceholder('Enter specific conditions, monitoring requirements, or recommendations...')
    .fill('Plan silt traps in the SEMP.')
  await approve.click()
  const approved = nextResponse(review, 'PATCH', '/assessments/:id/approve')
  await review
    .getByRole('dialog', { name: /Approve the assessment/ })
    .getByRole('button', { name: 'Approve' })
    .click()
  expect((await approved).status()).toBe(200)
  await expect(review.getByRole('button', { name: /Approve & Complete/ })).toHaveCount(0)
  await expect(review.getByText('Plan silt traps in the SEMP.')).toBeVisible()

  assessment = await getAssessment(specialist.api, project._id)
  expect(assessment.status).toBe('approved')
  expect(assessment.recommendations).toBe('Plan silt traps in the SEMP.')
  expect(assessment.approved_by._id).toBe(specialist.user._id)
  expect(assessment.status_history.map((h) => [h.status, h.by?._id])).toEqual([
    ['created', editor.user._id],
    ['submitted', editor.user._id],
    ['approved', specialist.user._id],
  ])
  const workspace = await specialist.api.get(`/projects/${project._id}/workspace`)
  expect(workspace.workflow.steps.assessment.status).toBe('approved')
  expect(workspace.workflow.steps.semp.status).toBe('not_started')
})
