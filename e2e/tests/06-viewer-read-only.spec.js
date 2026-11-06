// Flow 6: a viewer sees every page of a project but no edit or export control (D28a, D35), and
// every write endpoint the UI uses answers 403 for a viewer token, with nothing written.
import { expect, test } from '../support/test.js'
import {
  adminApi,
  createTeam,
  getAssessment,
  getScreening,
  projectAt,
  tableVersion,
} from '../support/api.js'
import { pdfBuffer } from '../support/files.js'
import { projectPath, signIn } from '../support/ui.js'

test.describe.serial('viewer', () => {
  let team
  let project
  let screening
  let assessment
  let file
  let libraryDoc
  let viewer

  test.beforeAll(async () => {
    const admin = await adminApi()
    team = await createTeam(admin, ['project_manager', 'environmental_specialist', 'viewer'])
    viewer = team.viewer
    const editor = team.project_manager.api
    project = await projectAt('semp', editor, team.environmental_specialist.api)
    const { indicators } = await editor.get('/lookups')
    await editor.call('PUT', `/projects/${project._id}/monitoring`, {
      version: await tableVersion(editor, `/monitoring/project/${project._id}`),
      records: [{ indicator: indicators[0]._id, scores: { baseline: '5', Q1: '4' } }],
    })
    const form = new FormData()
    form.append('area', 'documents')
    form.append('category', 'screening')
    form.append('file', new Blob([pdfBuffer()], { type: 'application/pdf' }), 'viewer-check.pdf')
    file = await editor.call('POST', `/projects/${project._id}/files`, form)
    const libraryForm = new FormData()
    libraryForm.append('title', 'Viewer check guidance')
    libraryForm.append('places', 'management')
    libraryForm.append('file', new Blob([pdfBuffer()], { type: 'application/pdf' }), 'g.pdf')
    libraryDoc = await team.environmental_specialist.api.call('POST', '/library', libraryForm)
    screening = await getScreening(editor, project._id)
    assessment = await getAssessment(editor, project._id)
  })

  test('sees every page of the project, with no edit or export control', async ({ page }) => {
    await signIn(page, viewer.email, viewer.password)
    const main = page.getByRole('main')
    const noButton = async (name) => expect(page.getByRole('button', { name })).toHaveCount(0)

    // Dashboard / projects / library: no create or upload
    await page.goto('/app/projects')
    await expect(main.getByText(project.title)).toBeVisible()
    await noButton(/New Project|Create Project/i)
    await expect(page.getByRole('link', { name: 'Settings' })).toHaveCount(0)
    await page.goto('/app/library')
    await expect(main.getByText('Viewer check guidance')).toBeVisible()
    await noButton('Upload document')
    await noButton(/^Delete /)

    // Overview: no edit, no workbook export
    await page.goto(projectPath(project._id))
    await expect(page.getByRole('heading', { level: 1, name: project.title })).toBeVisible()
    await noButton('Edit Project')
    await noButton('Export project workbook')

    // Screening and assessment: read, no review or export
    await page.goto(projectPath(project._id, 'screening'))
    await expect(main.getByText('Site-specific, reversible impacts.')).toBeVisible()
    await noButton(/Approve|Reject|Export Excel|Submit/)
    await page.goto(projectPath(project._id, 'assessment'))
    await expect(main.getByText('Water network rehabilitation').first()).toBeVisible()
    await noButton(/Approve|Reject|Export Excel|Submit/)

    // Tools 3 and 4: rows shown read-only, no Save / Add / Export; Guidance is reading, so it stays
    await page.goto(projectPath(project._id, 'semp/activities'))
    await expect(main.getByText('Trench excavation')).toBeVisible()
    await expect(page.locator('[contenteditable="true"]')).toHaveCount(0)
    await noButton(/^Save|Add another row|Export Excel/)
    await expect(page.getByRole('button', { name: 'Guidance (1)' })).toBeVisible()
    await page.goto(projectPath(project._id, 'semp/mitigation'))
    await expect(main.getByText('Rehabilitated network')).toBeVisible()
    await expect(page.locator('[contenteditable="true"]')).toHaveCount(0)
    await noButton(/^Save|Add another row|Export Excel/)

    // Monitoring: values shown as text, no inputs, no Save / Export
    await page.goto(projectPath(project._id, 'monitoring/data-entry'))
    const firstRow = page.locator('table tbody tr').first()
    await expect(firstRow.getByRole('cell', { name: '5', exact: true })).toBeVisible()
    await expect(firstRow.getByRole('cell', { name: '4', exact: true })).toBeVisible()
    await expect(page.getByRole('main').getByRole('textbox')).toHaveCount(0)
    await noButton(/^Save|Export Excel/)

    // Documents: open and download, no upload or delete
    await page.goto(projectPath(project._id, 'documents'))
    await expect(page.getByRole('button', { name: 'Open viewer-check.pdf' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Download viewer-check.pdf' })).toBeVisible()
    await noButton(/^Upload to /)
    await noButton(/^Delete /)
  })

  test('reads answer 200; every write endpoint answers 403 and nothing changes', async () => {
    const api = viewer.api
    const id = project._id
    // Reads the pages use
    for (const path of [
      '/dashboard',
      '/projects',
      `/projects/${id}/workspace`,
      `/screenings/project/${id}`,
      `/assessments/project/${id}`,
      `/management/project/${id}`,
      `/mitigation/project/${id}`,
      `/monitoring/project/${id}`,
      `/projects/${id}/files`,
      '/library',
      '/lookups',
      '/users',
    ]) {
      expect((await api.raw('GET', path)).status, `GET ${path}`).toBe(200)
    }
    expect((await api.raw('GET', `/files/${file._id}/download`)).status).toBe(200)
    expect((await api.raw('GET', `/library/${libraryDoc._id}/file`)).status).toBe(200)

    const pdf = () => {
      const form = new FormData()
      form.append('area', 'documents')
      form.append('category', 'other')
      form.append('title', 'x')
      form.append('file', new Blob([pdfBuffer()], { type: 'application/pdf' }), 'x.pdf')
      return form
    }
    const v = { version: 'x' }
    const writes = [
      [
        'POST',
        '/projects',
        { title: 't', location: 'l', start_date: '2026-01-01', end_date: '2026-02-01' },
      ],
      ['PUT', `/projects/${id}`, { ...v, title: 'changed' }],
      ['DELETE', `/projects/${id}`],
      ['PATCH', `/projects/${id}/archive`],
      ['PATCH', `/projects/${id}/restore`],
      ['DELETE', `/projects/${id}/purge`],
      ['PUT', `/projects/${id}/management`, { version: 1, rows: [] }],
      ['PUT', `/projects/${id}/mitigation`, { version: 1, rows: [] }],
      ['PUT', `/projects/${id}/monitoring`, { version: 1, records: [] }],
      ['POST', `/projects/${id}/files`, pdf()],
      ['PATCH', `/files/${file._id}`, { category: 'other' }],
      ['DELETE', `/files/${file._id}`],
      ['POST', '/screenings', { project: id, category_code: 'A', category_reason: 'x' }],
      ['PUT', `/screenings/${screening._id}`, { ...v, category_reason: 'changed' }],
      ['PATCH', `/screenings/${screening._id}/submit`, v],
      ['PATCH', `/screenings/${screening._id}/approve`, { recommendations: 'x' }],
      ['PATCH', `/screenings/${screening._id}/reject`, { reject_reason: 'x' }],
      ['POST', '/assessments', { project: id }],
      ['PUT', `/assessments/${assessment._id}`, { ...v, description: 'changed' }],
      ['PUT', `/assessments/${assessment._id}/methods`, { ...v, methods: [] }],
      ['PUT', `/assessments/${assessment._id}/consultations`, { ...v, consultations: [] }],
      ['POST', `/assessments/${assessment._id}/scores`, { ...v, scores: [] }],
      ['PATCH', `/assessments/${assessment._id}/submit`, v],
      ['PATCH', `/assessments/${assessment._id}/approve`, { recommendations: 'x' }],
      ['PATCH', `/assessments/${assessment._id}/reject`, { reject_reason: 'x' }],
      ['POST', '/library', pdf()],
      ['PATCH', `/library/${libraryDoc._id}`, { title: 'changed' }],
      ['PUT', `/library/${libraryDoc._id}/file`, pdf()],
      ['DELETE', `/library/${libraryDoc._id}`],
      ['POST', '/users', { name: 'x', email: 'x@example.com', role: 'viewer' }],
      ['PUT', `/users/${viewer.user._id}`, { role: 'admin' }],
      ['PATCH', `/users/${viewer.user._id}/deactivate`],
      ['PATCH', `/users/${viewer.user._id}/reactivate`],
      ['POST', `/users/${viewer.user._id}/reset-password`],
    ]
    for (const [method, path, body] of writes) {
      const res = await api.raw(method, path, body)
      expect(res.status, `${method} ${path}`).toBe(403)
    }

    // Nothing changed
    const editor = team.project_manager.api
    const workspace = await editor.get(`/projects/${id}/workspace`)
    expect(workspace.project).toMatchObject({ title: project.title, archived: false })
    expect((await getScreening(editor, id)).status).toBe('approved')
    expect((await getAssessment(editor, id)).status).toBe('approved')
    expect(await editor.get(`/management/project/${id}`)).toHaveLength(1)
    expect(await editor.get(`/projects/${id}/files`)).toHaveLength(1)
    expect((await editor.get('/library')).find((d) => d._id === libraryDoc._id).title).toBe(
      'Viewer check guidance'
    )
    expect((await viewer.api.get('/auth/me')).user.role).toBe('viewer')
  })
})
