// Flow 5a: critical actions (D65) — a file delete, a project archive and a user deactivation —
// appear in Settings → Activity log for the admin, with who did them and a snapshot; other roles
// cannot open the log.
import { expect, test } from '../support/test.js'
import { ADMIN } from '../support/env.js'
import {
  adminApi,
  auditEntries,
  createProject,
  createTeam,
  createUser,
  uniq,
} from '../support/api.js'
import { pdfBuffer } from '../support/files.js'
import { nextResponse, signIn } from '../support/ui.js'

test('file delete, archive and deactivation are in the activity log (admin only)', async ({
  page,
  newUserPage,
}) => {
  const admin = await adminApi()
  const team = await createTeam(admin, ['project_manager', 'environmental_specialist'])
  const editor = team.project_manager
  const specialist = team.environmental_specialist

  // 1. Editor deletes a project file (through the API; the UI delete is flow 5)
  const project = await createProject(editor.api, { title: uniq('E2E log project ') })
  const fileName = `${uniq('log-file-')}.pdf`
  const form = new FormData()
  form.append('area', 'documents')
  form.append('category', 'other')
  form.append('file', new Blob([pdfBuffer()], { type: 'application/pdf' }), fileName)
  const file = await editor.api.call('POST', `/projects/${project._id}/files`, form)
  await editor.api.call('DELETE', `/files/${file._id}`)

  // 2. Specialist archives the project in Settings → Projects (in-app confirmation)
  const specialistPage = await newUserPage()
  await signIn(specialistPage, specialist.email, specialist.password)
  await specialistPage.goto('/app/settings')
  await specialistPage
    .getByPlaceholder('Search projects by title or description...')
    .fill(project.title)
  const projectRow = specialistPage.getByRole('row', { name: new RegExp(project.title) })
  await projectRow.getByRole('button', { name: 'Archive' }).click()
  const archived = nextResponse(specialistPage, 'PATCH', '/projects/:id/archive')
  await specialistPage
    .getByRole('dialog', { name: 'Archive project' })
    .getByRole('button', { name: 'Archive' })
    .click()
  expect((await archived).status()).toBe(200)

  // The specialist cannot open the log: no tab, the route sends back to Settings, the API is 403
  await expect(specialistPage.getByRole('link', { name: 'Activity log' })).toHaveCount(0)
  await specialistPage.goto('/app/settings/activity-log')
  await expect(specialistPage).toHaveURL(/\/app\/settings$/)
  expect((await specialist.api.raw('GET', '/audit-logs')).status).toBe(403)
  expect((await editor.api.raw('GET', '/audit-logs')).status).toBe(403)

  // 3. Admin deactivates a user in Settings → Users
  const leaver = await createUser(admin, 'viewer')
  await signIn(page, ADMIN.email, ADMIN.password)
  await page.goto('/app/settings')
  await page.getByRole('button', { name: `Deactivate ${leaver.user.name}` }).click()
  const deactivated = nextResponse(page, 'PATCH', '/users/:id/deactivate')
  await page
    .getByRole('dialog', { name: 'Deactivate user' })
    .getByRole('button', { name: 'Deactivate' })
    .click()
  expect((await deactivated).status()).toBe(200)

  // Stored entries: who, target and snapshot
  const [deactivation] = await auditEntries(admin, 'action=user.deactivate')
  expect(deactivation).toMatchObject({
    by_name: ADMIN.name,
    by_role: 'admin',
    target_type: 'user',
    target_label: leaver.user.name,
  })
  expect(deactivation.snapshot).toMatchObject({ email: leaver.email })
  const [archive] = await auditEntries(admin, 'action=project.archive')
  expect(archive).toMatchObject({
    by_name: specialist.user.name,
    by_role: 'environmental_specialist',
    project_title: project.title,
  })
  const [fileDelete] = await auditEntries(admin, 'action=file.delete')
  expect(fileDelete).toMatchObject({
    by_name: editor.user.name,
    project_title: project.title,
    target_label: fileName,
  })
  expect(fileDelete.snapshot).toMatchObject({ name: fileName, category: 'other' })

  // Admin: Settings → Activity log shows the three, newest first, with details
  await page.getByRole('link', { name: 'Activity log' }).click()
  await expect(page).toHaveURL(/\/app\/settings\/activity-log$/)
  const rows = page
    .locator('table tbody tr')
    .filter({ has: page.getByRole('button', { name: /details/ }) })
  // Newest first: the deactivation was the last of the three
  await expect(rows.first()).toContainText('User deactivated')
  const deactivationRow = rows.filter({ hasText: 'User deactivated' }).filter({
    hasText: leaver.user.name,
  })
  await expect(deactivationRow).toContainText(ADMIN.name)
  const archiveRow = rows.filter({ hasText: 'Project archived' }).filter({ hasText: project.title })
  await expect(archiveRow).toContainText(specialist.user.name)
  const fileRow = rows.filter({ hasText: 'File deleted' }).filter({ hasText: fileName })
  await expect(fileRow).toContainText(editor.user.name)
  await expect(fileRow).toContainText(project.title)

  // The snapshot of the file delete opens in the row below
  await fileRow.getByRole('button', { name: 'Show details' }).click()
  await expect(fileRow.getByRole('button', { name: 'Hide details' })).toBeVisible()
  const details = fileRow.locator('xpath=following-sibling::tr[1]')
  await expect(details).toContainText(fileName)
  await expect(details).toContainText(editor.user.name)

  // Filtering by action keeps only that kind
  await page.getByLabel('Action filter').selectOption({ label: 'User deactivated' })
  await expect(page.locator('table tbody')).not.toContainText('File deleted')
  await expect(rows.first()).toContainText('User deactivated')
})
