// Flow 7: archive and restore (D17), delete blocked once something is approved (D60), delete of a
// draft project, and the admin's permanent delete of an archived project.
import { expect, test } from '../support/test.js'
import { ADMIN } from '../support/env.js'
import {
  adminApi,
  auditEntries,
  createProject,
  createTeam,
  projectAt,
  uniq,
} from '../support/api.js'
import { nextResponse, projectPath, signIn } from '../support/ui.js'

/** Settings → Projects, filtered to one project title; returns its row. */
async function projectRow(page, title, view = 'Active projects') {
  await page.goto('/app/settings')
  await page.getByLabel('Projects shown').selectOption({ label: view })
  await page.getByPlaceholder('Search projects by title or description...').fill(title)
  const row = page.getByRole('row', { name: new RegExp(title) })
  await expect(row).toBeVisible()
  return row
}

async function confirmIn(page, dialog, button, method, pattern) {
  const response = nextResponse(page, method, pattern)
  await page.getByRole('dialog', { name: dialog }).getByRole('button', { name: button }).click()
  return (await response).status()
}

test('archive / restore; delete blocked when something is approved', async ({
  page,
  newUserPage,
}) => {
  const admin = await adminApi()
  const team = await createTeam(admin, ['project_manager', 'environmental_specialist'])
  const editor = team.project_manager
  const specialist = team.environmental_specialist
  const approved = await projectAt('screening', editor.api, specialist.api, {
    project: { title: uniq('E2E approved project ') },
  })
  const draft = await createProject(editor.api, { title: uniq('E2E draft project ') })

  await signIn(page, specialist.email, specialist.password)

  // Approved work: no Delete in the UI, and the API refuses it (409), nothing removed
  let row = await projectRow(page, approved.title)
  await expect(row.getByRole('button', { name: 'Archive' })).toBeVisible()
  await expect(row.getByRole('button', { name: 'Delete' })).toHaveCount(0)
  const refused = await specialist.api.raw('DELETE', `/projects/${approved._id}`)
  expect(refused.status).toBe(409)
  expect((await editor.api.get(`/projects/${approved._id}/workspace`)).project.title).toBe(
    approved.title
  )

  // Archive: read-only everywhere, out of the project list
  await row.getByRole('button', { name: 'Archive' }).click()
  expect(
    await confirmIn(page, 'Archive project', 'Archive', 'PATCH', '/projects/:id/archive')
  ).toBe(200)
  let stored = (await editor.api.get(`/projects/${approved._id}/workspace`)).project
  expect(stored.archived).toBe(true)
  expect(stored.archived_by._id).toBe(specialist.user._id)
  const blocked = await editor.api.raw('PUT', `/projects/${approved._id}`, {
    version: stored.updatedAt,
    title: 'changed',
  })
  expect(blocked.status).toBe(409)
  expect((await editor.api.get('/projects')).some((p) => p._id === approved._id)).toBe(false)
  expect(
    (await editor.api.get('/projects?archived=true')).some((p) => p._id === approved._id)
  ).toBe(true)

  const editorPage = await newUserPage()
  await signIn(editorPage, editor.email, editor.password)
  await editorPage.goto(projectPath(approved._id))
  await expect(editorPage.getByText('Archived project — read only')).toBeVisible()
  await expect(editorPage.getByText(`by ${specialist.user.name}`)).toBeVisible()
  await expect(editorPage.getByRole('button', { name: 'Edit Project' })).toHaveCount(0)
  await editorPage.goto(projectPath(approved._id, 'screening'))
  await expect(editorPage.getByText('Archived project — read only')).toBeVisible()

  // Restore from the archived view
  row = await projectRow(page, approved.title, 'Archived projects')
  await expect(row.getByRole('button', { name: 'Delete permanently' })).toHaveCount(0) // admin only
  await row.getByRole('button', { name: 'Restore' }).click()
  expect(
    await confirmIn(page, 'Restore project', 'Restore', 'PATCH', '/projects/:id/restore')
  ).toBe(200)
  stored = (await editor.api.get(`/projects/${approved._id}/workspace`)).project
  expect(stored.archived).toBe(false)
  await editorPage.reload()
  await expect(editorPage.getByText('Archived project — read only')).toHaveCount(0)
  await editorPage.goto(projectPath(approved._id))
  await expect(editorPage.getByRole('button', { name: 'Edit Project' })).toBeVisible()

  // A draft project can be deleted (with its data), after the confirmation
  row = await projectRow(page, draft.title)
  await row.getByRole('button', { name: 'Delete' }).click()
  expect(await confirmIn(page, 'Delete project', 'Delete', 'DELETE', '/projects/:id')).toBe(204)
  expect((await editor.api.raw('GET', `/projects/${draft._id}/workspace`)).status).toBe(404)

  // Admin: permanent delete of an archived project, approved work included
  await specialist.api.call('PATCH', `/projects/${approved._id}/archive`)
  const adminPage = await newUserPage()
  await signIn(adminPage, ADMIN.email, ADMIN.password)
  row = await projectRow(adminPage, approved.title, 'Archived projects')
  await row.getByRole('button', { name: 'Delete permanently' }).click()
  expect(
    await confirmIn(
      adminPage,
      'Delete permanently',
      'Delete permanently',
      'DELETE',
      '/projects/:id/purge'
    )
  ).toBe(204)
  expect((await admin.raw('GET', `/projects/${approved._id}/workspace`)).status).toBe(404)

  // Audit entries with who and a snapshot
  const byAction = async (action, projectId) =>
    (await auditEntries(admin, `action=${action}`)).find((e) => e.target_id === projectId)
  expect(await byAction('project.archive', approved._id)).toMatchObject({
    by_name: specialist.user.name,
    project_title: approved.title,
  })
  expect(await byAction('project.restore', approved._id)).toMatchObject({
    by_name: specialist.user.name,
  })
  const deleted = await byAction('project.delete', draft._id)
  expect(deleted).toMatchObject({ by_name: specialist.user.name, project_title: draft.title })
  expect(deleted.snapshot).toMatchObject({ title: draft.title, location: draft.location })
  const purged = await byAction('project.purge', approved._id)
  expect(purged).toMatchObject({ by_name: ADMIN.name, project_title: approved.title })
  expect(purged.snapshot).toMatchObject({ title: approved.title })
})
