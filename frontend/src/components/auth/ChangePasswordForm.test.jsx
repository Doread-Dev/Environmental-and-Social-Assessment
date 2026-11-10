import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import api from '@/services/api'
import { ChangePasswordForm } from './ChangePasswordForm'
import { fail, mockGet, ok, signIn } from '@/test/utils'
import { renderApp } from '@/test/renderApp'

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn(), put: vi.fn() },
}))

const me = {
  user: { _id: 'u1', name: 'Rana', role: 'viewer' },
  permissions: [],
  password_rules: { min_length: 6 },
}

function renderForm(onSuccess = vi.fn()) {
  signIn()
  mockGet(api, { '/auth/me': me })
  renderApp([{ path: '/', element: <ChangePasswordForm onSuccess={onSuccess} /> }], '/')
  return onSuccess
}

const type = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } })
const fill = (current, next, confirm = next) => {
  type(/^Current password/, current)
  type(/^New password/, next)
  type(/^Confirm new password/, confirm)
  fireEvent.click(screen.getByRole('button', { name: /Change Password/ }))
}

describe('ChangePasswordForm (D23)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('shows the minimum length from the backend password rules', async () => {
    renderForm()
    expect(await screen.findByText('At least 6 characters')).toBeInTheDocument()
  })

  it('checks the confirmation and the backend minimum before sending', async () => {
    renderForm()
    await screen.findByText('At least 6 characters')

    fill('old-pass', 'new-pass', 'other-pass')
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument()

    fill('old-pass', '12345')
    expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()

    fill('same-pass', 'same-pass')
    expect(
      screen.getByText('New password must be different from the current password')
    ).toBeInTheDocument()
    expect(api.put).not.toHaveBeenCalled()
  })

  it('sends current + new password and reports success', async () => {
    const onSuccess = renderForm()
    api.put.mockImplementation(() => ok(me))
    await screen.findByText('At least 6 characters')

    fill('old-pass', 'new-pass')

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(api.put).toHaveBeenCalledWith('/auth/password', {
      current_password: 'old-pass',
      new_password: 'new-pass',
    })
  })

  it('shows the backend error, e.g. a wrong current password', async () => {
    const onSuccess = renderForm()
    api.put.mockImplementation(() => fail(400, 'Current password is incorrect'))
    await screen.findByText('At least 6 characters')

    fill('wrong-pass', 'new-pass')

    expect(await screen.findByRole('alert')).toHaveTextContent('Current password is incorrect')
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
