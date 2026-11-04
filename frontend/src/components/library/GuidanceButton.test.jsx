import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import api from '@/services/api'
import { GuidanceButton } from './GuidanceButton'
import { fail, lookupsFixture, ok, signIn } from '@/test/utils'
import { renderApp } from '@/test/renderApp'

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn() },
}))

const doc = (id, title, places) => ({
  _id: id,
  title,
  description: `${title} description`,
  places,
  original_name: `${id}.pdf`,
  mime_type: 'application/pdf',
  size: 4096,
})
const LIBRARY = [
  doc('d1', 'Annex 1 — Climate change resilience examples', ['mitigation', 'management']),
  doc('d2', 'Waste guide', ['mitigation']),
  doc('d3', 'Screening checklist', ['screening']),
  doc('d4', 'General policy', []),
]

function mockApi() {
  api.get.mockImplementation((url, config) => {
    if (url === '/auth/me') return ok({ user: { _id: 'v1', role: 'viewer' }, permissions: [] })
    if (url === '/lookups') return ok(lookupsFixture())
    if (url === '/library') {
      const place = config?.params?.place
      return ok(LIBRARY.filter((d) => !place || d.places.includes(place)))
    }
    if (url.startsWith('/library/'))
      return Promise.resolve({ data: new Blob(['%PDF'], { type: 'application/pdf' }) })
    return fail(404, `No mock for GET ${url}`)
  })
}

// A tool page with unsaved input and its Guidance button in the header.
function renderPage(place) {
  return renderApp(
    [
      {
        path: '/',
        element: (
          <div>
            <header>
              <GuidanceButton place={place} />
            </header>
            <main>
              <label>
                Measures
                <input />
              </label>
            </main>
          </div>
        ),
      },
    ],
    '/'
  )
}

const libraryCalls = () => api.get.mock.calls.filter(([url]) => url === '/library')

describe('Guidance button (D64 c)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    signIn({ user: { _id: 'v1', name: 'Viewer', role: 'viewer' } })
    mockApi()
    URL.createObjectURL = vi.fn(() => 'blob:guide')
    URL.revokeObjectURL = vi.fn()
  })

  it('shows the count of documents linked to the place, with one request', async () => {
    renderPage('mitigation')
    expect(await screen.findByRole('button', { name: 'Guidance (2)' })).toBeInTheDocument()
    expect(libraryCalls()).toEqual([['/library', { params: { place: 'mitigation' } }]])
  })

  it('is hidden when no document is linked (n = 0)', async () => {
    renderPage('monitoring')
    await waitFor(() => expect(libraryCalls()).toHaveLength(1))
    expect(screen.queryByRole('button', { name: /Guidance/ })).not.toBeInTheDocument()
  })

  it('renders nothing and loads nothing on a page without a place', async () => {
    renderPage(null)
    await screen.findByLabelText('Measures')
    expect(libraryCalls()).toHaveLength(0)
    expect(screen.queryByRole('button', { name: /Guidance/ })).not.toBeInTheDocument()
  })

  it('opens a panel with the linked documents only, then the viewer, keeping unsaved input', async () => {
    renderPage('mitigation')
    const input = screen.getByLabelText('Measures')
    fireEvent.change(input, { target: { value: 'Raise pump housings' } })

    fireEvent.click(await screen.findByRole('button', { name: 'Guidance (2)' }))
    const panel = screen.getByRole('dialog', { name: 'Guidance' })
    expect(await within(panel).findByText('Mitigation plan – Tool 4')).toBeInTheDocument()
    expect(within(panel).getByText('Annex 1 — Climate change resilience examples')).toBeVisible()
    expect(within(panel).getByText('Waste guide')).toBeVisible()
    expect(within(panel).queryByText('Screening checklist')).not.toBeInTheDocument()
    expect(within(panel).queryByText('General policy')).not.toBeInTheDocument()

    fireEvent.click(within(panel).getByText('Waste guide'))
    const viewer = await screen.findByRole('dialog', { name: 'Waste guide' })
    await waitFor(() => expect(viewer.querySelector('iframe')).toHaveAttribute('src', 'blob:guide'))
    expect(api.get).toHaveBeenCalledWith(
      '/library/d2/file',
      expect.objectContaining({ responseType: 'blob' })
    )

    // Escape closes the viewer only; the panel stays, then closes too.
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Waste guide' })).not.toBeInTheDocument()
    )
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:guide')
    expect(screen.getByRole('dialog', { name: 'Guidance' })).toBeInTheDocument()
    fireEvent.click(within(panel).getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    expect(screen.getByLabelText('Measures')).toHaveValue('Raise pump housings')
  })

  it('a second button for the same place uses the cached list (no new request)', async () => {
    renderApp(
      [
        {
          path: '/',
          element: (
            <>
              <GuidanceButton place="mitigation" />
              <GuidanceButton place="mitigation" />
            </>
          ),
        },
      ],
      '/'
    )
    expect(await screen.findAllByRole('button', { name: 'Guidance (2)' })).toHaveLength(2)
    expect(libraryCalls()).toHaveLength(1)
  })
})
