// UI steps shared by the specs. Web-first assertions only: no fixed waits.
import { expect } from '@playwright/test'

/** Signs in on the login page, as a user does, and waits until the app has opened. */
export async function signIn(page, email, password) {
  await page.goto('/login')
  await page.getByLabel('Email address').fill(email)
  await page.getByPlaceholder('Enter your password').fill(password)
  await page.getByRole('button', { name: 'Login' }).click()
  await expect(page).toHaveURL(/\/(app|change-password)/)
}

/** Opens an app path with an existing token (skips the login form when a flow is not about it). */
export async function openAs(page, api, path) {
  await page.goto('/login')
  // The app keeps the session as token + user (services/authService.js).
  await page.evaluate(
    ({ token, user }) => {
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
    },
    { token: api.token, user: api.user }
  )
  await page.goto(path)
}

export const projectPath = (projectId, sub = 'overview') => `/app/projects/${projectId}/${sub}`

/**
 * An API path pattern such as '/screenings/:id/submit' (`:id` = any Mongo id), matched against
 * the end of a request path under /api/v1.
 */
export function apiPath(pattern) {
  const source = pattern
    .split(':id')
    .map((part) => part.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'))
    .join('[0-9a-f]{24}')
  return new RegExp(`^/api/v1${source}$`)
}

/** Records the API requests matching `pattern` (see apiPath) and `method` from now on. */
export function countRequests(page, method, pattern) {
  const re = apiPath(pattern)
  const seen = []
  page.on('request', (req) => {
    if (req.method() === method && re.test(new URL(req.url()).pathname)) seen.push(req.url())
  })
  return seen
}

/** Waits for the next API response matching `method` and `pattern` (see apiPath). */
export function nextResponse(page, method, pattern) {
  const re = apiPath(pattern)
  return page.waitForResponse(
    (res) => res.request().method() === method && re.test(new URL(res.url()).pathname)
  )
}
