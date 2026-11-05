import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import api, {
  SESSION_EXPIRED_MESSAGE,
  extractErrorMessage,
  isStaleVersionError,
  setSessionExpiredHandler,
} from './api'

const error = (status, data) => Object.assign(new Error('x'), { response: { status, data } })

describe('extractErrorMessage', () => {
  it('a wrong-role 403 gets the friendly message', () => {
    expect(extractErrorMessage(error(403, { error: 'Forbidden' }))).toBe(
      "You don't have permission to perform this action."
    )
  })

  it('other 403s keep their reason (deactivated account, pending password change)', () => {
    expect(extractErrorMessage(error(403, { error: 'Account is deactivated' }))).toBe(
      'Account is deactivated'
    )
    expect(
      extractErrorMessage(
        error(403, {
          error: 'You must change your password before continuing',
          code: 'PASSWORD_CHANGE_REQUIRED',
        })
      )
    ).toBe('You must change your password before continuing')
  })
})

describe('response interceptor', () => {
  const rejected = api.interceptors.response.handlers[0].rejected
  let original

  beforeEach(() => {
    original = window.location
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { pathname: '/app/dashboard', search: '', href: '/app/dashboard' },
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: original })
  })

  it('sends a pending forced password change (D22) to the change-password screen', async () => {
    const err = error(403, { error: 'x', code: 'PASSWORD_CHANGE_REQUIRED' })
    await expect(rejected(err)).rejects.toBe(err)
    expect(window.location.href).toBe('/change-password')
  })

  it('leaves a wrong-role 403 alone', async () => {
    await expect(rejected(error(403, { error: 'Forbidden' }))).rejects.toBeTruthy()
    expect(window.location.href).toBe('/app/dashboard')
  })
})

describe('stale saves and expired sessions (D62, D73)', () => {
  const rejected = api.interceptors.response.handlers[0].rejected
  let original

  beforeEach(() => {
    original = window.location
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        pathname: '/app/projects/p1/screening',
        search: '',
        href: '/app/projects/p1/screening',
      },
    })
    localStorage.setItem('token', 't')
  })

  afterEach(() => {
    setSessionExpiredHandler(null)
    Object.defineProperty(window, 'location', { configurable: true, value: original })
    localStorage.clear()
  })

  const unauthorized = (url) =>
    Object.assign(error(401, { error: 'Not authorized' }), { config: { url } })

  it('recognises the stale-save 409 by its code', () => {
    expect(isStaleVersionError(error(409, { error: 'x', code: 'STALE_VERSION' }))).toBe(true)
    expect(isStaleVersionError(error(409, { error: 'Tool 2 must be approved' }))).toBe(false)
  })

  it('a 401 while a user is signed in goes to the sign-in dialog: no redirect, session kept', async () => {
    const handler = vi.fn(() => true)
    setSessionExpiredHandler(handler)
    const err = unauthorized('/projects/p1/management')

    await expect(rejected(err)).rejects.toBe(err)

    expect(handler).toHaveBeenCalled()
    expect(err.sessionExpired).toBe(true)
    expect(extractErrorMessage(err)).toBe(SESSION_EXPIRED_MESSAGE)
    expect(window.location.href).toBe('/app/projects/p1/screening')
    expect(localStorage.getItem('token')).toBe('t')
  })

  it('a 401 with no user loaded clears the session and goes to the login page', async () => {
    await expect(rejected(unauthorized('/auth/me'))).rejects.toBeTruthy()
    expect(window.location.href).toBe('/login')
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('a wrong password at sign-in (401 of /auth/login) never counts as an expired session', async () => {
    const handler = vi.fn(() => true)
    setSessionExpiredHandler(handler)
    const err = unauthorized('/auth/login')

    await expect(rejected(err)).rejects.toBe(err)

    expect(handler).not.toHaveBeenCalled()
    expect(err.sessionExpired).toBeUndefined()
    expect(window.location.href).toBe('/app/projects/p1/screening')
  })
})
