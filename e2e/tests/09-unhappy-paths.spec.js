// Flow 9: the unhappy paths agreed in phase 10a (D61, D62, D73).
import { expect, test } from '../support/test.js'
import {
  MANAGEMENT_ROW,
  adminApi,
  createTeam,
  expiredToken,
  getScreening,
  projectAt,
  screeningDraft,
  saveManagement,
} from '../support/api.js'
import { countRequests, nextResponse, projectPath, signIn } from '../support/ui.js'

const cells = (page, row) =>
  page.locator('table tbody tr').nth(row).locator('[contenteditable="true"]')

/** Whether a refresh / tab close would ask now (the page's beforeunload handler). */
const refreshAsks = (page) =>
  page.evaluate(() => {
    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    return event.defaultPrevented
  })

test.describe.serial('unhappy paths', () => {
  let team
  let editor
  let specialist

  test.beforeAll(async () => {
    team = await createTeam(await adminApi(), ['project_manager', 'environmental_specialist'])
    editor = team.project_manager
    specialist = team.environmental_specialist
  })

  test('leaving an edited page asks Save / Discard / Stay; refresh asks only while dirty', async ({
    page,
  }) => {
    const project = await projectAt('project', editor.api, specialist.api)
    await screeningDraft(editor.api, project._id, { potential_negative: 'First text' })
    await signIn(page, editor.email, editor.password)
    const screeningUrl = projectPath(project._id, 'screening')
    const dialog = page.getByRole('dialog', { name: 'Unsaved changes' })
    const sidebar = page.getByRole('complementary')
    const overviewLink = sidebar.getByRole('link', { name: 'Project Overview' })
    // Arrive through an in-app link, so the browser's Back stays inside the app
    await page.goto(projectPath(project._id, 'overview'))
    await sidebar.getByRole('link', { name: 'Screening – Tool 1' }).click()
    await expect(page).toHaveURL(screeningUrl)
    const negative = page.getByLabel('Potential Negative Impacts')
    await expect(negative).toHaveValue('First text')

    // Clean: nothing asks
    expect(await refreshAsks(page)).toBe(false)

    // Stay keeps the input
    await negative.fill('Edited once')
    expect(await refreshAsks(page)).toBe(true)
    await overviewLink.click()
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Stay' }).click()
    await expect(dialog).toBeHidden()
    await expect(page).toHaveURL(screeningUrl)
    await expect(negative).toHaveValue('Edited once')

    // Browser Back asks too; Discard leaves without saving
    await page.goBack()
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Discard changes' }).click()
    await expect(page).not.toHaveURL(screeningUrl)
    expect((await getScreening(editor.api, project._id)).potential_negative).toBe('First text')

    // Save saves and leaves
    await page.goto(screeningUrl)
    await negative.fill('Saved on leaving')
    await overviewLink.click()
    const saved = nextResponse(page, 'PUT', '/screenings/:id')
    await dialog.getByRole('button', { name: 'Save' }).click()
    expect((await saved).status()).toBe(200)
    await expect(page).toHaveURL(projectPath(project._id, 'overview'))
    expect((await getScreening(editor.api, project._id)).potential_negative).toBe(
      'Saved on leaving'
    )

    // Sign out asks while dirty; Stay keeps the user signed in on the page
    await page.goto(screeningUrl)
    await negative.fill('Before sign out')
    await sidebar.getByRole('button', { name: new RegExp(editor.user.name) }).click()
    await page.getByRole('button', { name: 'Sign Out' }).click()
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Stay' }).click()
    await expect(page).toHaveURL(screeningUrl)
    await expect(negative).toHaveValue('Before sign out')
    // ... and Discard signs out
    await sidebar.getByRole('button', { name: new RegExp(editor.user.name) }).click()
    await page.getByRole('button', { name: 'Sign Out' }).click()
    await dialog.getByRole('button', { name: 'Discard changes' }).click()
    await expect(page).toHaveURL(/\/login$/)
    expect((await getScreening(editor.api, project._id)).potential_negative).toBe(
      'Saved on leaving'
    )
  })

  test('two tabs on one Tool 3 table and one screening: the second save is refused', async ({
    page,
    newUserPage,
  }) => {
    const project = await projectAt('assessment', editor.api, specialist.api)
    await saveManagement(editor.api, project._id, [MANAGEMENT_ROW])
    const url = projectPath(project._id, 'semp/activities')
    await signIn(page, editor.email, editor.password)
    const second = await newUserPage()
    await signIn(second, specialist.email, specialist.password)
    await page.goto(url)
    await second.goto(url)
    await expect(cells(page, 0).first()).toHaveText('Trench excavation')
    await expect(cells(second, 0).first()).toHaveText('Trench excavation')

    // Tab 1 saves first
    await cells(page, 0).first().fill('Tab one text')
    const first = nextResponse(page, 'PUT', '/projects/:id/management')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    expect((await first).status()).toBe(200)

    // Tab 2 saves on the old version: refused, nothing overwritten
    await cells(second, 0).first().fill('Tab two text')
    const stale = nextResponse(second, 'PUT', '/projects/:id/management')
    await second.getByRole('button', { name: 'Save', exact: true }).click()
    const staleResponse = await stale
    expect(staleResponse.status()).toBe(409)
    expect((await staleResponse.json()).code).toBe('STALE_VERSION')
    const conflict = second.getByRole('dialog', { name: 'Someone else changed this' })
    await expect(conflict).toBeVisible()
    let rows = await editor.api.get(`/management/project/${project._id}`)
    expect(rows.map((r) => r.activity_description)).toEqual(['Tab one text'])

    // Reload shows tab 1's rows; the next save works
    await conflict.getByRole('button', { name: 'Reload' }).click()
    await expect(conflict).toBeHidden()
    await expect(cells(second, 0).first()).toHaveText('Tab one text')
    await cells(second, 0).first().fill('Tab two after reload')
    const retry = nextResponse(second, 'PUT', '/projects/:id/management')
    await second.getByRole('button', { name: 'Save', exact: true }).click()
    expect((await retry).status()).toBe(200)
    rows = await editor.api.get(`/management/project/${project._id}`)
    expect(rows.map((r) => r.activity_description)).toEqual(['Tab two after reload'])

    // Screening: same rule (record version = updatedAt)
    const other = await projectAt('project', editor.api, specialist.api)
    await screeningDraft(editor.api, other._id, { potential_positive: 'Start' })
    const screeningUrl = projectPath(other._id, 'screening')
    await page.goto(screeningUrl)
    await second.goto(screeningUrl)
    await expect(second.getByLabel('Potential Positive Impacts')).toHaveValue('Start')
    await page.getByLabel('Potential Positive Impacts').fill('Saved by tab one')
    const s1 = nextResponse(page, 'PUT', '/screenings/:id')
    await page.getByRole('button', { name: 'Save as Draft' }).click()
    expect((await s1).status()).toBe(200)
    await second.getByLabel('Potential Positive Impacts').fill('Saved by tab two')
    const s2 = nextResponse(second, 'PUT', '/screenings/:id')
    await second.getByRole('button', { name: 'Save as Draft' }).click()
    expect((await s2).status()).toBe(409)
    await expect(second.getByRole('dialog', { name: 'Someone else changed this' })).toBeVisible()
    expect((await getScreening(editor.api, other._id)).potential_positive).toBe('Saved by tab one')
    // Keep editing keeps the typed text
    await second.getByRole('button', { name: 'Keep editing' }).click()
    await expect(second.getByLabel('Potential Positive Impacts')).toHaveValue('Saved by tab two')
  })

  test('an expired session mid-edit opens the sign-in dialog; the input is kept and saved', async ({
    page,
  }) => {
    const project = await projectAt('project', editor.api, specialist.api)
    await screeningDraft(editor.api, project._id)
    await signIn(page, editor.email, editor.password)
    const url = projectPath(project._id, 'screening')
    await page.goto(url)
    await page.getByLabel('Potential Negative Impacts').fill('Typed before expiry')

    // The token expires behind the page
    await page.evaluate(
      (token) => localStorage.setItem('token', token),
      expiredToken(editor.user._id, 'project_manager')
    )
    const refused = nextResponse(page, 'PUT', '/screenings/:id')
    await page.getByRole('button', { name: 'Save as Draft' }).click()
    expect((await refused).status()).toBe(401)
    const dialog = page.getByRole('dialog', { name: 'Your session has expired' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel('Email')).toHaveValue(editor.email)
    await expect(page).toHaveURL(url)
    await expect(page.getByLabel('Potential Negative Impacts')).toHaveValue('Typed before expiry')
    expect((await getScreening(editor.api, project._id)).potential_negative).toBe(
      'Dust and noise during works.'
    )

    // Sign in on the page, then Save again (no automatic retry)
    await dialog.getByLabel('Password').fill(editor.password)
    await dialog.getByRole('button', { name: 'Sign in', exact: true }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByLabel('Potential Negative Impacts')).toHaveValue('Typed before expiry')
    const saved = nextResponse(page, 'PUT', '/screenings/:id')
    await page.getByRole('button', { name: 'Save as Draft' }).click()
    expect((await saved).status()).toBe(200)
    expect((await getScreening(editor.api, project._id)).potential_negative).toBe(
      'Typed before expiry'
    )

    // "Sign in as someone else" ends on the login page
    await page.evaluate(
      (token) => localStorage.setItem('token', token),
      expiredToken(editor.user._id, 'project_manager')
    )
    await page.getByLabel('Potential Positive Impacts').fill('Another change')
    await page.getByRole('button', { name: 'Save as Draft' }).click()
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Sign in as someone else' }).click()
    await expect(page).toHaveURL(/\/login$/)
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull()
  })

  test('an unknown project id in a Tools 3/4 URL shows "Project not found" with one request', async ({
    page,
  }) => {
    await signIn(page, editor.email, editor.password)
    const unknown = '0123456789abcdef01234567'
    for (const sub of ['semp/activities', 'semp/mitigation']) {
      const workspaceRequests = countRequests(page, 'GET', '/projects/:id/workspace')
      await page.goto(projectPath(unknown, sub))
      await expect(page.getByText('Project not found')).toBeVisible()
      await page.waitForLoadState('networkidle')
      expect(workspaceRequests, sub).toHaveLength(1)
    }
  })

  test('a double click on Save sends one request', async ({ page }) => {
    const project = await projectAt('assessment', editor.api, specialist.api)
    await saveManagement(editor.api, project._id, [MANAGEMENT_ROW])
    await signIn(page, editor.email, editor.password)

    await page.goto(projectPath(project._id, 'semp/activities'))
    await cells(page, 0).first().fill('Double click')
    const puts = countRequests(page, 'PUT', '/projects/:id/management')
    const saved = nextResponse(page, 'PUT', '/projects/:id/management')
    await page.getByRole('button', { name: 'Save', exact: true }).dblclick()
    expect((await saved).status()).toBe(200)
    await expect(page.getByRole('button', { name: /Saved/ })).toBeVisible()
    await page.waitForLoadState('networkidle')
    expect(puts).toHaveLength(1)
    const tool3 = await editor.api.call('GET', `/management/project/${project._id}`, undefined, {
      full: true,
    })
    expect(tool3.version).toBe(2)
    expect(tool3.data.map((r) => r.activity_description)).toEqual(['Double click'])

    // Same on the screening draft
    const other = await projectAt('project', editor.api, specialist.api)
    await screeningDraft(editor.api, other._id)
    await page.goto(projectPath(other._id, 'screening'))
    await page.getByLabel('Potential Positive Impacts').fill('Double click draft')
    const screeningPuts = countRequests(page, 'PUT', '/screenings/:id')
    const draftSaved = nextResponse(page, 'PUT', '/screenings/:id')
    await page.getByRole('button', { name: 'Save as Draft' }).dblclick()
    expect((await draftSaved).status()).toBe(200)
    await page.waitForLoadState('networkidle')
    expect(screeningPuts).toHaveLength(1)
  })
})
