// Flow 1: an admin creates users; a new user must change the temporary password at first sign-in
// (D21, D22).
import { expect, test } from '../support/test.js'
import { ADMIN, USER_PASSWORD } from '../support/env.js'
import { Api, adminApi, auditEntries, uniq } from '../support/api.js'
import { signIn } from '../support/ui.js'

test('admin creates a user, who must change the temporary password at first sign-in', async ({
  page,
  newUserPage,
}) => {
  const admin = await adminApi()
  const name = uniq('E2E new manager ')
  const email = `${uniq('e2e.new.')}@example.com`.toLowerCase()

  // Admin: Settings → Users → Add User
  await signIn(page, ADMIN.email, ADMIN.password)
  await page.goto('/app/settings')
  await page.getByRole('button', { name: 'Add User' }).click()
  const form = page.getByRole('dialog', { name: 'Add User' })
  await form.getByLabel('Name').fill(name)
  await form.getByLabel('Email').fill(email)
  await form.getByLabel('Role').selectOption({ label: 'Project Manager' })
  await form.getByRole('button', { name: 'Create User' }).click()

  // The temporary password is shown once
  const shown = page.getByRole('dialog', { name: 'Temporary password' })
  await expect(shown).toContainText(name)
  const temporary = (await shown.getByTestId('temporary-password').innerText()).trim()
  expect(temporary.length).toBeGreaterThanOrEqual(12)
  await shown.getByRole('button', { name: 'Done' }).click()
  await expect(shown).toBeHidden()
  await expect(page.getByRole('row', { name: new RegExp(email) })).toContainText('Project Manager')

  // Stored: the account with a pending forced change, and the user.create audit entry
  const users = await admin.get('/users')
  const stored = users.find((u) => u.email === email)
  expect(stored).toMatchObject({ name, role: 'project_manager', is_active: true })
  expect(stored.must_change_password).toBe(true)
  const entries = await auditEntries(admin, 'action=user.create')
  const entry = entries.find((e) => e.target_label === name || e.snapshot?.email === email)
  expect(entry).toBeTruthy()
  expect(entry.by_name).toBe(ADMIN.name)
  expect(JSON.stringify(entry)).not.toContain(temporary)

  // Until the change, the API answers only /auth/me and /auth/password
  const temp = await Api.login(email, temporary)
  const blocked = await temp.raw('GET', '/projects')
  expect(blocked.status).toBe(403)
  expect(blocked.body.code).toBe('PASSWORD_CHANGE_REQUIRED')

  // The new user signs in with the temporary password and lands on the forced change
  const userPage = await newUserPage()
  await signIn(userPage, email, temporary)
  await expect(userPage).toHaveURL(/\/change-password$/)
  await expect(userPage.getByRole('heading', { name: 'Change your password' })).toBeVisible()
  // Other pages are not reachable before the change
  await userPage.goto('/app/projects')
  await expect(userPage).toHaveURL(/\/change-password$/)

  await userPage.getByLabel('Current password').fill(temporary)
  await userPage.getByLabel('New password', { exact: false }).first().fill(USER_PASSWORD)
  await userPage.getByLabel('Confirm new password').fill(USER_PASSWORD)
  await userPage.getByRole('button', { name: 'Save and Continue' }).click()
  await expect(userPage).toHaveURL(/\/app\/dashboard$/)
  await expect(userPage.getByRole('button', { name: new RegExp(name) })).toBeVisible()

  // Stored: the change is done, the new password works and the temporary one no longer does
  const signedIn = await Api.login(email, USER_PASSWORD)
  const me = await signedIn.get('/auth/me')
  expect(me.user.must_change_password).toBe(false)
  expect((await signedIn.raw('GET', '/projects')).status).toBe(200)
  const old = await new Api(null).raw('POST', '/auth/login', { email, password: temporary })
  expect(old.status).toBe(401)
})
