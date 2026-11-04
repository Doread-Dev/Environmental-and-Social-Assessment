import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import api from '@/services/api'
import LibraryPage from './LibraryPage'
import { fail, lookupsFixture, ok, signIn } from '@/test/utils'
import { renderApp } from '@/test/renderApp'

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const UPLOAD_RULES = { max_bytes: 1000, extensions: ['pdf', 'docx'], library_extensions: ['pdf'] }
const doc = (id, title, places, extra = {}) => ({
  _id: id,
  title,
  description: '',
  places,
  order: 0,
  original_name: `${id}.pdf`,
  mime_type: 'application/pdf',
  size: 2048,
  updatedAt: '2026-11-01T10:00:00.000Z',
  ...extra,
})

let library

function renderPage({ permissions = [] } = {}) {
  signIn({ user: { _id: 'u1', name: 'Sara', role: 'viewer' } })
  api.get.mockImplementation((url) => {
    if (url === '/auth/me')
      return ok({ user: { _id: 'u1', role: 'viewer' }, permissions, upload_rules: UPLOAD_RULES })
    if (url === '/lookups') return ok(lookupsFixture())
    if (url === '/library') return library === 'fail' ? fail(500, 'Server Error') : ok(library)
    if (url.startsWith('/library/'))
      return Promise.resolve({ data: new Blob(['%PDF'], { type: 'application/pdf' }) })
    return fail(404, `No mock for GET ${url}`)
  })
  return renderApp([{ path: '/', element: <LibraryPage /> }], '/')
}

const card = (title) =>
  screen.getByText(title).closest('.flex.flex-col.sm\\:flex-row').parentElement
const libraryCalls = () => api.get.mock.calls.filter(([url]) => url === '/library').length
const pdf = (name, size = 10) => new File(['x'.repeat(size)], name, { type: 'application/pdf' })

describe('Library page (D64 b, c)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    library = [
      doc('d1', 'Annex 1 — Climate change resilience examples', ['mitigation', 'management'], {
        description: 'Examples per sector',
      }),
      doc('d2', 'Screening checklist', ['screening']),
      doc('d3', 'General policy', []),
      doc('d4', 'GHG factors', ['ghg_emissions']),
    ]
    URL.createObjectURL = vi.fn(() => 'blob:lib')
    URL.revokeObjectURL = vi.fn()
  })

  it('lists every document with its places for every role, in one request', async () => {
    renderPage()
    expect(await screen.findByText('Screening checklist')).toBeInTheDocument()
    expect(screen.getByText('4 documents')).toBeInTheDocument()
    const annex = within(card('Annex 1 — Climate change resilience examples'))
    expect(annex.getByText('Mitigation plan – Tool 4')).toBeVisible()
    expect(annex.getByText('Management activities – Tool 3')).toBeVisible()
    expect(within(card('General policy')).getByText('General — Library only')).toBeVisible()
    expect(within(card('GHG factors')).getByText(/GHG Emissions · v3/)).toBeVisible()
    expect(libraryCalls()).toBe(1)
    expect(api.get).toHaveBeenCalledWith('/library', { params: undefined })
  })

  it('viewer: opens and downloads, no management controls', async () => {
    renderPage({ permissions: [] })
    await screen.findByText('Screening checklist')
    expect(screen.queryByRole('button', { name: /Upload document/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Edit / })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Replace the PDF/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Delete / })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download Screening checklist' })).toBeVisible()

    fireEvent.click(within(card('Screening checklist')).getByRole('button', { name: /Open/ }))
    const viewer = await screen.findByRole('dialog', { name: 'Screening checklist' })
    await waitFor(() => expect(viewer.querySelector('iframe')).toHaveAttribute('src', 'blob:lib'))
    expect(api.get).toHaveBeenCalledWith(
      '/library/d2/file',
      expect.objectContaining({ responseType: 'blob' })
    )
  })

  it('an editor without manage_library sees no management controls either', async () => {
    renderPage({ permissions: ['create_project', 'edit', 'export'] })
    await screen.findByText('Screening checklist')
    expect(screen.queryByRole('button', { name: /Upload document/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Delete / })).not.toBeInTheDocument()
  })

  it('with manage_library: upload, edit, replace and delete controls', async () => {
    renderPage({ permissions: ['manage_library'] })
    await screen.findByText('Screening checklist')
    expect(screen.getByRole('button', { name: /Upload document/ })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Edit Screening checklist' })).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Replace the PDF of Screening checklist' })
    ).toBeVisible()
    expect(screen.getByRole('button', { name: 'Delete Screening checklist' })).toBeVisible()
  })

  it('searches title and description, and filters by place or general', async () => {
    renderPage()
    await screen.findByText('Screening checklist')

    fireEvent.change(screen.getByLabelText('Search the library'), {
      target: { value: 'sector' },
    })
    expect(screen.getByText('1 document of 4')).toBeInTheDocument()
    expect(screen.getByText('Annex 1 — Climate change resilience examples')).toBeVisible()

    fireEvent.change(screen.getByLabelText('Search the library'), { target: { value: '' } })
    const filter = screen.getByLabelText('Place filter')
    fireEvent.change(filter, { target: { value: 'management' } })
    expect(screen.getByText('1 document of 4')).toBeInTheDocument()
    fireEvent.change(filter, { target: { value: '__general' } })
    expect(screen.getByText('General policy')).toBeVisible()
    expect(screen.queryByText('Screening checklist')).not.toBeInTheDocument()
    fireEvent.change(filter, { target: { value: 'monitoring' } })
    expect(screen.getByText('No documents match')).toBeInTheDocument()
    // The filter offers the v3 places, marked
    expect(within(filter).getByRole('option', { name: 'SEMP Plan (v3)' })).toBeInTheDocument()
    expect(libraryCalls()).toBe(1)
  })

  it('uploads a PDF with title, places and order, then refreshes the list', async () => {
    api.post.mockImplementation((url, form) => {
      library = [...library, doc('d5', form.get('title'), form.get('places').split(','))]
      return ok(library.at(-1))
    })
    renderPage({ permissions: ['manage_library'] })
    await screen.findByText('Screening checklist')
    fireEvent.click(screen.getByRole('button', { name: /Upload document/ }))

    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByTestId('library-file-input'), {
      target: { files: [pdf('Annex 2.pdf')] },
    })
    expect(within(dialog).getByLabelText(/Title/)).toHaveValue('Annex 2')
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Mitigation plan – Tool 4' }))
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'SEMP Plan (v3)' }))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Upload' }))

    expect(await screen.findByText('Uploaded to the library')).toBeInTheDocument()
    const [url, form, config] = api.post.mock.calls[0]
    expect(url).toBe('/library')
    expect(form.get('title')).toBe('Annex 2')
    expect(form.get('places')).toBe('mitigation,semp_plan')
    expect(form.get('order')).toBe('0')
    expect(form.get('file').name).toBe('Annex 2.pdf')
    expect(config.headers).toEqual({ 'Content-Type': 'multipart/form-data' })
    expect(await screen.findByText('Annex 2')).toBeInTheDocument()
    expect(libraryCalls()).toBe(2)
  })

  it('refuses a non-PDF or a missing file before sending', async () => {
    renderPage({ permissions: ['manage_library'] })
    await screen.findByText('Screening checklist')
    fireEvent.click(screen.getByRole('button', { name: /Upload document/ }))
    const dialog = screen.getByRole('dialog')

    fireEvent.click(within(dialog).getByRole('button', { name: 'Upload' }))
    expect(within(dialog).getByText('Choose a PDF file')).toBeInTheDocument()
    expect(within(dialog).getByText('Title is required')).toBeInTheDocument()

    fireEvent.change(within(dialog).getByTestId('library-file-input'), {
      target: { files: [new File(['x'], 'plan.docx')] },
    })
    expect(within(dialog).getByText(/File type not allowed. Allowed: \.pdf$/)).toBeVisible()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('shows the server error in the form and keeps it open', async () => {
    api.post.mockImplementation(() => fail(400, 'Unknown place: tool4'))
    renderPage({ permissions: ['manage_library'] })
    await screen.findByText('Screening checklist')
    fireEvent.click(screen.getByRole('button', { name: /Upload document/ }))
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByTestId('library-file-input'), {
      target: { files: [pdf('a.pdf')] },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Upload' }))
    expect(await within(dialog).findByText('Unknown place: tool4')).toBeInTheDocument()
  })

  it('edits title and places (re-link) without a file', async () => {
    api.patch.mockImplementation((url, data) => ok({ ...library[1], ...data }))
    renderPage({ permissions: ['manage_library'] })
    fireEvent.click(await screen.findByRole('button', { name: 'Edit Screening checklist' }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).queryByTestId('library-file-input')).not.toBeInTheDocument()
    expect(within(dialog).getByRole('checkbox', { name: 'Screening – Tool 1' })).toBeChecked()
    fireEvent.change(within(dialog).getByLabelText(/Title/), { target: { value: 'Checklist' } })
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Screening – Tool 1' }))
    fireEvent.change(within(dialog).getByLabelText(/Order/), { target: { value: '2' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Library document saved')).toBeInTheDocument()
    expect(api.patch).toHaveBeenCalledWith('/library/d2', {
      title: 'Checklist',
      description: '',
      places: [],
      order: 2,
    })
  })

  it('replaces the PDF of a document', async () => {
    api.put.mockImplementation(() => ok(library[0]))
    renderPage({ permissions: ['manage_library'] })
    fireEvent.click(
      await screen.findByRole('button', { name: 'Replace the PDF of Screening checklist' })
    )
    fireEvent.change(screen.getByTestId('replace-file-input'), {
      target: { files: [pdf('v2.pdf')] },
    })

    expect(await screen.findByText('PDF replaced: Screening checklist')).toBeInTheDocument()
    const [url, form] = api.put.mock.calls[0]
    expect(url).toBe('/library/d2/file')
    expect(form.get('file').name).toBe('v2.pdf')
  })

  it('refuses a non-PDF replacement before sending', async () => {
    renderPage({ permissions: ['manage_library'] })
    fireEvent.click(
      await screen.findByRole('button', { name: 'Replace the PDF of Screening checklist' })
    )
    fireEvent.change(screen.getByTestId('replace-file-input'), {
      target: { files: [new File(['x'], 'v2.docx')] },
    })
    expect(await screen.findByText(/File type not allowed/)).toBeInTheDocument()
    expect(api.put).not.toHaveBeenCalled()
  })

  it('deletes after the in-app confirmation', async () => {
    api.delete.mockImplementation(() => {
      library = library.filter((d) => d._id !== 'd3')
      return Promise.resolve({ status: 204 })
    })
    renderPage({ permissions: ['manage_library'] })
    fireEvent.click(await screen.findByRole('button', { name: 'Delete General policy' }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/every Guidance button/)).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))

    expect(await screen.findByText('Library document deleted')).toBeInTheDocument()
    expect(api.delete).toHaveBeenCalledWith('/library/d3')
    await waitFor(() => expect(screen.queryByText('General policy')).not.toBeInTheDocument())
  })

  it('shows an empty library', async () => {
    library = []
    renderPage({ permissions: ['manage_library'] })
    expect(await screen.findByText('The library is empty')).toBeInTheDocument()
    expect(screen.getByText('Upload the first guidance document.')).toBeInTheDocument()
  })

  it('shows a load error with a retry', async () => {
    const loaded = library
    library = 'fail'
    renderPage()
    expect(await screen.findByText('Could not load the library')).toBeInTheDocument()
    library = loaded
    fireEvent.click(screen.getByRole('button', { name: /Try again/ }))
    expect(await screen.findByText('Screening checklist')).toBeInTheDocument()
  })
})
