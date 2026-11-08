// Flow 8: the locked v3 buttons (D48, D59, D70) are visible to every role, in their agreed places,
// and inert: focusable, aria-disabled, "Available in v3", no navigation and no request.
import { expect, test } from '../support/test.js'
import { adminApi, createTeam, projectAt } from '../support/api.js'
import { projectPath, signIn } from '../support/ui.js'

/** Checks one locked button: visible, disabled for AT, described, focusable, and inert. */
async function expectLocked(page, button) {
  await expect(button).toBeVisible()
  await expect(button).toHaveAttribute('aria-disabled', 'true')
  await expect(button).toHaveAccessibleDescription(/Available in v3/)
  await button.focus()
  await expect(button).toBeFocused()

  // Only requests caused by the button count: let the page finish its own loading first
  await page.waitForLoadState('networkidle')
  const url = page.url()
  const requests = []
  const onRequest = (req) => requests.push(req.url())
  page.on('request', onRequest)
  await button.click({ force: true })
  await page.keyboard.press('Enter')
  await page.keyboard.press('Space')
  // The page answers other input afterwards, so the clicks were handled: nothing happened
  await expect(page).toHaveURL(url)
  page.off('request', onRequest)
  expect(requests).toEqual([])
}

for (const role of ['project_manager', 'viewer']) {
  test(`locked v3 buttons are visible and inert (${role})`, async ({ page }) => {
    const admin = await adminApi()
    const team = await createTeam(admin, [role, 'environmental_specialist'])
    const owner = role === 'viewer' ? team.environmental_specialist : team[role]
    const project = await projectAt('assessment', owner.api, team.environmental_specialist.api)
    const user = team[role]

    await signIn(page, user.email, user.password)

    // Main sidebar: Organization tools
    await page.goto('/app/dashboard')
    const organization = page.getByRole('group', { name: 'Organization tools' })
    await expectLocked(page, organization.getByRole('button', { name: 'GHG Emissions' }))
    await expectLocked(
      page,
      organization.getByRole('button', { name: 'Environmental Data Collection' })
    )

    // Project sidebar: Project support tools
    await page.goto(projectPath(project._id))
    const support = page.getByRole('group', { name: 'Project support tools' })
    await expectLocked(page, support.getByRole('button', { name: 'Stakeholder Awareness' }))

    // SEMP overview: the SEMP Plan card
    await page.goto(projectPath(project._id, 'semp'))
    await expectLocked(page, page.getByRole('main').getByRole('button', { name: /SEMP Plan/ }))

    // Mobile menu (375 px): the organization tools are there, locked too
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/app/dashboard')
    await page.getByRole('button', { name: 'Toggle menu' }).click()
    const menu = page.getByRole('dialog', { name: 'Mobile navigation' })
    await expectLocked(page, menu.getByRole('button', { name: 'GHG Emissions' }))
    await expectLocked(page, menu.getByRole('button', { name: 'Environmental Data Collection' }))

    // No v3 route exists in the app or the API
    await page.goto('/app/projects/' + project._id + '/semp-plan')
    await expect(page.getByRole('heading', { name: /not found/i })).toBeVisible()
    for (const path of ['/semp-plans', '/stakeholder-awareness', '/organization-ghg']) {
      expect((await user.api.raw('GET', path)).status, path).toBe(404)
    }
  })
}
