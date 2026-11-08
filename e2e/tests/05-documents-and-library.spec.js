// Flow 5: project documents (upload, PDF preview, download, delete — D64 d) and a library
// document uploaded by a specialist, linked to Tool 4 and opened from Tool 4's Guidance panel
// without leaving the page (D64 b, c).
import fs from 'node:fs'
import { expect, test } from '../support/test.js'
import { adminApi, auditEntries, createTeam, projectAt, uniq } from '../support/api.js'
import { pdfBuffer, pdfFile } from '../support/files.js'
import { nextResponse, projectPath, signIn } from '../support/ui.js'

test.describe.serial('documents and library', () => {
  let admin
  let team
  let project

  test.beforeAll(async () => {
    admin = await adminApi()
    team = await createTeam(admin, ['project_manager', 'environmental_specialist'])
    project = await projectAt(
      'assessment',
      team.project_manager.api,
      team.environmental_specialist.api
    )
  })

  test('project documents: upload, PDF preview, download, delete', async ({ page }) => {
    const editor = team.project_manager
    const name = `${uniq('site-visit-')}.pdf`
    await signIn(page, editor.email, editor.password)
    await page.goto(projectPath(project._id, 'documents'))

    // Upload to the Screening section
    const section = page.getByRole('region', { name: 'Screening – Tool 1' })
    const uploaded = nextResponse(page, 'POST', '/projects/:id/files')
    await section.getByLabel('Upload files to Screening – Tool 1').setInputFiles(pdfFile(name))
    expect((await uploaded).status()).toBe(201)
    await expect(section.getByText(name)).toBeVisible()

    const files = await editor.api.get(`/projects/${project._id}/files?area=documents`)
    expect(files).toHaveLength(1)
    expect(files[0]).toMatchObject({
      original_name: name,
      category: 'screening',
      mime_type: 'application/pdf',
      size: pdfBuffer(name).length,
    })
    expect(files[0].uploaded_by._id).toBe(editor.user._id)

    // Preview in the in-app viewer (blob: iframe), the page stays
    const before = page.url()
    await section.getByRole('button', { name: `Open ${name}` }).click()
    const viewer = page.getByRole('dialog', { name })
    await expect(viewer.locator('iframe')).toHaveAttribute('src', /^blob:/)
    expect(page.url()).toBe(before)

    // Download from the viewer: the same bytes as uploaded
    const downloading = page.waitForEvent('download')
    await viewer.getByRole('button', { name: `Download ${name}` }).click()
    const download = await downloading
    expect(download.suggestedFilename()).toBe(name)
    const got = fs.readFileSync(await download.path())
    expect(got.equals(pdfBuffer(name))).toBe(true)
    await viewer.getByRole('button', { name: 'Close viewer' }).click()
    await expect(viewer).toBeHidden()

    // Delete after the in-app confirmation
    await section.getByRole('button', { name: `Delete ${name}` }).click()
    const confirm = page.getByRole('dialog', { name: 'Delete file' })
    const deleted = nextResponse(page, 'DELETE', '/files/:id')
    await confirm.getByRole('button', { name: 'Delete' }).click()
    expect((await deleted).status()).toBe(204)
    await expect(section.getByText('No files yet.')).toBeVisible()

    expect(await editor.api.get(`/projects/${project._id}/files?area=documents`)).toHaveLength(0)
    const entry = (await auditEntries(admin, 'action=file.delete')).find(
      (e) => e.target_id === files[0]._id
    )
    expect(entry).toMatchObject({ by_name: editor.user.name, project_title: project.title })
    expect(entry).toMatchObject({ target_type: 'file', target_label: name })
    expect(entry.snapshot).toMatchObject({ name, area: 'documents', category: 'screening' })
  })

  test('a specialist uploads a library PDF for Tool 4; the editor opens it from Guidance', async ({
    page,
    newUserPage,
  }) => {
    const specialist = team.environmental_specialist
    const title = uniq('E2E Tool 4 guidance ')

    // Specialist: Library → Upload document, linked to Tool 4 only
    await signIn(page, specialist.email, specialist.password)
    await page.goto('/app/library')
    await page.getByRole('button', { name: 'Upload document' }).click()
    const form = page.getByRole('dialog', { name: 'Upload to the library' })
    await form.getByTestId('library-file-input').setInputFiles(pdfFile(`${title}.pdf`, title))
    await form.getByLabel('Title').fill(title)
    await form.getByLabel('Description').fill('Examples of mitigation measures.')
    await form.getByRole('checkbox', { name: 'Mitigation plan – Tool 4' }).check()
    const created = nextResponse(page, 'POST', '/library')
    await form.getByRole('button', { name: 'Upload', exact: true }).click()
    expect((await created).status()).toBe(201)
    await expect(form).toBeHidden()
    await expect(page.getByRole('region', { name: 'Library documents' })).toContainText(title)

    const stored = (await specialist.api.get('/library')).find((d) => d.title === title)
    expect(stored).toMatchObject({ places: ['mitigation'], mime_type: 'application/pdf' })
    expect(stored.uploaded_by._id ?? stored.uploaded_by).toBe(specialist.user._id)
    // Only managers may upload: the editor gets 403
    const editor = team.project_manager
    const form403 = new FormData()
    form403.append('title', 'x')
    form403.append('file', new Blob([pdfBuffer()], { type: 'application/pdf' }), 'x.pdf')
    expect((await editor.api.raw('POST', '/library', form403)).status).toBe(403)

    // Editor on Tool 4: Guidance (1) → side panel → the PDF opens over the page
    const tool4 = await newUserPage()
    await signIn(tool4, editor.email, editor.password)
    await tool4.goto(projectPath(project._id, 'semp/mitigation'))
    const url = tool4.url()
    await tool4.getByRole('button', { name: 'Guidance (1)' }).click()
    const panel = tool4.getByRole('dialog', { name: /Guidance/ })
    await panel.getByRole('button', { name: new RegExp(title) }).click()
    const viewer = tool4.getByRole('dialog', { name: title })
    await expect(viewer.locator('iframe')).toHaveAttribute('src', /^blob:/)
    expect(tool4.url()).toBe(url)
    await viewer.getByRole('button', { name: 'Close viewer' }).click()
    await expect(viewer).toBeHidden()
    await expect(
      tool4.getByRole('heading', { name: 'Impact Mitigation & Enhancement Plan' })
    ).toBeVisible()

    // Not linked to Tool 3: no Guidance button there
    await tool4.goto(projectPath(project._id, 'semp/activities'))
    await expect(
      tool4.getByRole('heading', { name: 'Environmental & Social Management' })
    ).toBeVisible()
    await expect(tool4.getByRole('button', { name: /^Guidance/ })).toHaveCount(0)
  })
})
