import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { Outlet } from 'react-router-dom'
import api from '@/services/api'
import ProjectDocumentsPage from './ProjectDocumentsPage'
import { fail, lookupsFixture, ok, signIn } from '@/test/utils'
import { renderApp } from '@/test/renderApp'

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const USER = { _id: 'u1', name: 'Rana', role: 'project_manager' }
const UPLOAD_RULES = { max_bytes: 1000, extensions: ['pdf', 'docx'], library_extensions: ['pdf'] }
const FILES_URL = '/projects/p1/files'
const PDF_MIME = 'application/pdf'
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const file = (id, name, category, mime = PDF_MIME) => ({
  _id: id,
  original_name: name,
  category,
  area: 'documents',
  mime_type: mime,
  size: 2048,
  createdAt: '2026-11-01T10:00:00.000Z',
  uploaded_by: { _id: 'u1', name: 'Rana' },
})

let serverFiles

function renderPage({ actions = ['files.edit'], project = {} } = {}) {
  signIn({ user: USER })
  api.get.mockImplementation((url) => {
    if (url === '/auth/me')
      return ok({ user: USER, permissions: ['edit'], upload_rules: UPLOAD_RULES })
    if (url === '/lookups') return ok(lookupsFixture())
    if (url === FILES_URL)
      return serverFiles === 'fail' ? fail(500, 'Server Error') : ok(serverFiles)
    if (url.startsWith('/files/'))
      return Promise.resolve({ data: new Blob(['%PDF'], { type: PDF_MIME }) })
    return fail(404, `No mock for GET ${url}`)
  })
  const context = {
    project: { _id: 'p1', title: 'Water network', archived: false, ...project },
    can: (action) => actions.includes(action),
  }
  return renderApp(
    [
      {
        path: '/',
        element: <Outlet context={context} />,
        children: [{ index: true, element: <ProjectDocumentsPage /> }],
      },
    ],
    '/'
  )
}

const section = (label) => screen.getByRole('region', { name: label })
const listCalls = () => api.get.mock.calls.filter(([url]) => url === FILES_URL).length
const pick = (category, files) =>
  fireEvent.change(screen.getByTestId(`upload-input-${category}`), { target: { files } })
const pdf = (name, size = 10) => new File(['x'.repeat(size)], name, { type: PDF_MIME })

describe('Project documents page (D64 d)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    serverFiles = [
      file('f1', 'Screening form.pdf', 'screening'),
      file('f2', 'Measures.docx', 'mitigation', DOCX_MIME),
      file('f3', 'سجل.pdf', 'mitigation'),
      file('f4', 'Contract.pdf', 'other'),
    ]
    URL.createObjectURL = vi.fn(() => 'blob:doc')
    URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => vi.restoreAllMocks())

  it('has one section per project-workflow place, then Other, with their files', async () => {
    renderPage()
    expect(await screen.findByText('Screening form.pdf')).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Screening – Tool 1',
      'Assessment – Tool 2',
      'Management activities – Tool 3',
      'Mitigation plan – Tool 4',
      'Monitoring – Tool 5',
      'Other',
    ])
    const tool4 = section('Mitigation plan – Tool 4')
    expect(within(tool4).getByText('2 files')).toBeInTheDocument()
    expect(within(tool4).getByText('سجل.pdf')).toBeInTheDocument()
    expect(within(section('Other')).getByText('Contract.pdf')).toBeInTheDocument()
    expect(within(section('Monitoring – Tool 5')).getByText('No files yet.')).toBeVisible()
    // v3 places are not project-document sections
    expect(screen.queryByText('SEMP Plan')).not.toBeInTheDocument()
    expect(screen.getByText('4 files')).toBeInTheDocument()
    expect(screen.getByText(/Allowed: \.pdf, \.docx — up to 1000 B per file/)).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith(FILES_URL, { params: { area: 'documents' } })
  })

  it('opens a PDF in the in-app viewer; an Office file only downloads', async () => {
    renderPage({ actions: [] })
    fireEvent.click(await screen.findByRole('button', { name: 'Open سجل.pdf' }))

    const viewer = await screen.findByRole('dialog', { name: 'سجل.pdf' })
    await waitFor(() => expect(viewer.querySelector('iframe')).toHaveAttribute('src', 'blob:doc'))
    expect(api.get).toHaveBeenCalledWith(
      '/files/f3/download',
      expect.objectContaining({ responseType: 'blob' })
    )
    expect(screen.queryByRole('button', { name: 'Open Measures.docx' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download Measures.docx' })).toBeInTheDocument()

    fireEvent.click(within(viewer).getByRole('button', { name: 'Close viewer' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:doc')
  })

  it('is read-only without files.edit (viewer): open and download only', async () => {
    renderPage({ actions: [] })
    await screen.findByText('Screening form.pdf')
    expect(screen.queryByRole('button', { name: /Upload/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Delete/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download Screening form.pdf' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open Screening form.pdf' })).toBeInTheDocument()
  })

  it('says so on an archived project', async () => {
    renderPage({ actions: [], project: { archived: true } })
    expect(await screen.findByText(/can be opened and downloaded but not added/)).toBeVisible()
  })

  it('uploads several files to a place one after the other, then refreshes once', async () => {
    const order = []
    api.post.mockImplementation((url, form) => {
      order.push(form.get('file').name)
      expect(url).toBe(FILES_URL)
      expect(form.get('area')).toBe('documents')
      expect(form.get('category')).toBe('monitoring')
      return ok(file(`n${order.length}`, form.get('file').name, 'monitoring'))
    })
    renderPage()
    await screen.findByText('Screening form.pdf')
    const before = listCalls()

    pick('monitoring', [pdf('one.pdf'), pdf('two.pdf')])

    expect(await screen.findByText('2 files uploaded')).toBeInTheDocument()
    expect(order).toEqual(['one.pdf', 'two.pdf'])
    expect(api.post.mock.calls[0][2]).toMatchObject({
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    await waitFor(() => expect(listCalls()).toBe(before + 1))
  })

  it('uploads to Other with the category "other"', async () => {
    api.post.mockImplementation((_url, form) => ok(file('n1', 'x.pdf', form.get('category'))))
    renderPage()
    await screen.findByText('Screening form.pdf')
    pick('other', [pdf('x.pdf')])
    expect(await screen.findByText('File uploaded')).toBeInTheDocument()
    expect(api.post.mock.calls[0][1].get('category')).toBe('other')
  })

  it('refuses a wrong type or a too big file before sending; shows server errors per file', async () => {
    api.post.mockImplementation((_url, form) =>
      form.get('file').name === 'bad.pdf'
        ? fail(400, 'The file content does not match its .pdf extension')
        : ok(file('n1', 'good.pdf', 'screening'))
    )
    renderPage()
    await screen.findByText('Screening form.pdf')

    pick('screening', [
      pdf('virus.exe'),
      pdf('huge.pdf', 2000),
      pdf('bad.pdf'),
      pdf('good.pdf'),
      pdf('empty.pdf', 0),
    ])

    expect(await screen.findByText('File uploaded')).toBeInTheDocument()
    expect(screen.getByText(/virus\.exe: File type not allowed/)).toBeInTheDocument()
    expect(screen.getByText(/huge\.pdf: File is too large \(max 1000 B\)/)).toBeInTheDocument()
    expect(screen.getByText(/bad\.pdf: The file content does not match/)).toBeInTheDocument()
    expect(screen.getByText(/empty\.pdf: The file is empty/)).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledTimes(2)
  })

  it('does not refresh when nothing was uploaded', async () => {
    renderPage()
    await screen.findByText('Screening form.pdf')
    const before = listCalls()
    pick('screening', [pdf('virus.exe')])
    expect(await screen.findByText(/virus\.exe: File type not allowed/)).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
    expect(listCalls()).toBe(before)
  })

  it('deletes after the in-app confirmation and refreshes the list', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    api.delete.mockImplementation(() => {
      serverFiles = serverFiles.filter((f) => f._id !== 'f1')
      return Promise.resolve({ status: 204 })
    })
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Delete Screening form.pdf' }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/Screening form\.pdf/)).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))

    expect(await screen.findByText('File deleted')).toBeInTheDocument()
    expect(api.delete).toHaveBeenCalledWith('/files/f1')
    await waitFor(() => expect(screen.queryByText('Screening form.pdf')).not.toBeInTheDocument())
    expect(window.confirm).not.toHaveBeenCalled()
  })

  it('keeps the dialog open and shows the error when delete fails; Cancel closes it', async () => {
    api.delete.mockImplementation(() => fail(409, 'This project is archived and read-only.'))
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Delete Screening form.pdf' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }))

    expect(await screen.findByText(/archived and read-only/)).toBeInTheDocument()
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByText('Screening form.pdf')).toBeInTheDocument()
  })

  it('downloads with the token (blob) under the original name', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    renderPage({ actions: [] })

    fireEvent.click(await screen.findByRole('button', { name: 'Download Measures.docx' }))

    await waitFor(() => expect(click).toHaveBeenCalled())
    expect(api.get).toHaveBeenCalledWith(
      '/files/f2/download',
      expect.objectContaining({ responseType: 'blob' })
    )
    expect(click.mock.instances[0].download).toBe('Measures.docx')
    expect(URL.createObjectURL).toHaveBeenCalled()
  })

  it('shows the server message when a download fails (blob error body)', async () => {
    renderPage()
    await screen.findByText('Screening form.pdf')
    api.get.mockImplementationOnce(() => {
      const err = new Error('Not found')
      err.response = {
        status: 404,
        data: new Blob([
          JSON.stringify({ success: false, error: 'The file is missing on the server' }),
        ]),
      }
      return Promise.reject(err)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Download Measures.docx' }))
    expect(await screen.findByText('The file is missing on the server')).toBeInTheDocument()
  })

  it('shows a load error with a retry', async () => {
    const loaded = serverFiles
    serverFiles = 'fail'
    renderPage()
    expect(await screen.findByText('Could not load the documents')).toBeInTheDocument()
    expect(screen.getByText('Server Error')).toBeInTheDocument()

    serverFiles = loaded
    fireEvent.click(screen.getByRole('button', { name: /Try again/ }))
    expect(await screen.findByText('Screening form.pdf')).toBeInTheDocument()
  })
})
