import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import api, { extractErrorMessage } from './api'

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
