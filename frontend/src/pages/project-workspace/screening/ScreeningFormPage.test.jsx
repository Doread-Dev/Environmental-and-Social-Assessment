import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import api from '@/services/api'
import ProjectLayout from '@/components/layout/ProjectLayout'
import ScreeningRouter from './ScreeningRouter'
import { lookupsFixture, mockGet, signIn, workspaceFixture } from '@/test/utils'
import { renderApp } from '@/test/renderApp'

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn() },
}))

function renderForm() {
  mockGet(api, {
    '/auth/me': {
      user: { _id: 'u1', name: 'Rana', role: 'project_manager' },
      permissions: ['edit'],
    },
    '/projects/p1/workspace': workspaceFixture({ allowed_actions: ['screening.create'] }),
    '/screenings/project/p1': null,
    '/lookups': lookupsFixture(),
    '/library': [],
  })
  return renderApp(
    [
      {
        path: '/app/projects/:projectId',
        element: <ProjectLayout />,
        children: [{ path: 'screening', element: <ScreeningRouter /> }],
      },
    ],
    '/app/projects/p1/screening'
  )
}

describe('Screening form: the submit confirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    signIn()
  })

  it('says a reviewer can reject it, without naming a role (phase 14)', async () => {
    renderForm()
    fireEvent.click(await screen.findByText('Category B'))
    fireEvent.change(screen.getByPlaceholderText('Provide justification...'), {
      target: { value: 'Small works' },
    })
    fireEvent.change(screen.getByPlaceholderText(/potential adverse effects/), {
      target: { value: 'Dust' },
    })
    fireEvent.change(screen.getByPlaceholderText(/expected environmental benefits/), {
      target: { value: 'Clean water' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Submit Screening/ }))

    const dialog = await screen.findByRole('dialog', { name: 'Confirm Submission' })
    expect(dialog).toHaveTextContent(
      'Editing will not be possible after submission unless the screening is rejected by a reviewer.'
    )
    expect(dialog.textContent).not.toMatch(/administrator|specialist|manager|focal point/i)
    expect(api.post).not.toHaveBeenCalled()
  })
})
