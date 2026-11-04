import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { Outlet } from 'react-router-dom'
import api from '@/services/api'
import AnnexOverviewPage from './AnnexOverviewPage'
import { fail, ok, signIn } from '@/test/utils'
import { renderApp } from '@/test/renderApp'

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const USER = { _id: 'u1', name: 'Rana', role: 'project_manager' }
const UPLOAD_RULES = { max_bytes: 1000, extensions: ['pdf', 'docx'] }
const FILES_URL = '/projects/p1/files'
const file = (id, name, category) => ({
  _id: id,
  original_name: name,
  category,
  area: 'annex',
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
    if (url === FILES_URL)
      return serverFiles === 'fail' ? fail(500, 'Server Error') : ok(serverFiles)
    if (url.startsWith('/files/')) return Promise.resolve({ data: new Blob(['%PDF']) })
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
        children: [{ index: true, element: <AnnexOverviewPage /> }],
      },
    ],
    '/'
  )
}

const card = (title) => screen.getByText(title).closest('.flex.flex-col.gap-4')
const listCalls = () => api.get.mock.calls.filter(([url]) => url === FILES_URL).length
const pick = (category, files) =>
  fireEvent.change(screen.getByTestId(`upload-input-${category}`), { target: { files } })
const pdf = (name, size = 10) => new File(['x'.repeat(size)], name, { type: 'application/pdf' })

describe('Annex page (D47)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    serverFiles = [
      file('f1', 'Policy.pdf', 'annex_a'),
      file('f2', 'Logs.docx', 'annex_b'),
      file('f3', 'سجل.pdf', 'annex_b'),
    ]
    vi.spyOn(window, 'confirm').mockReturnValue(false)
  })

  afterEach(() => vi.restoreAllMocks())

  it('shows the 8 annexes with their files and counts', async () => {
    renderPage()
    expect(await screen.findByText('Policy.pdf')).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(8)
    expect(within(card('Annex A — Environmental Policy')).getByText('1 file')).toBeInTheDocument()
    const annexB = card('Annex B — Stakeholder Engagement Logs')
    expect(within(annexB).getByText('2 files')).toBeInTheDocument()
    expect(within(annexB).getByText('سجل.pdf')).toBeInTheDocument()
    expect(within(card('Annex H — Training Materials')).getByText('No files yet.')).toBeVisible()
    expect(screen.getByText('3 files in 8 annexes')).toBeInTheDocument()
    expect(screen.getByText(/Allowed: \.pdf, \.docx — up to 1000 B per file/)).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith(FILES_URL, { params: { area: 'annex' } })
  })

  it('is read-only without files.edit (viewer): download only', async () => {
    renderPage({ actions: [] })
    await screen.findByText('Policy.pdf')
    expect(screen.queryByRole('button', { name: /Upload/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Delete/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download Policy.pdf' })).toBeInTheDocument()
  })

  it('says so on an archived project', async () => {
    renderPage({ actions: [], project: { archived: true } })
    expect(await screen.findByText(/files can be downloaded but not added/)).toBeInTheDocument()
  })

  it('uploads several files one after the other, then refreshes the list once', async () => {
    const order = []
    api.post.mockImplementation((url, form) => {
      order.push(form.get('file').name)
      expect(url).toBe(FILES_URL)
      expect(form.get('area')).toBe('annex')
      expect(form.get('category')).toBe('annex_c')
      return ok(file(`n${order.length}`, form.get('file').name, 'annex_c'))
    })
    renderPage()
    await screen.findByText('Policy.pdf')
    const before = listCalls()

    pick('annex_c', [pdf('one.pdf'), pdf('two.pdf')])

    expect(await screen.findByText('2 files uploaded')).toBeInTheDocument()
    expect(order).toEqual(['one.pdf', 'two.pdf'])
    expect(api.post.mock.calls[0][2]).toMatchObject({
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    await waitFor(() => expect(listCalls()).toBe(before + 1))
  })

  it('refuses a wrong type or a too big file before sending; shows server errors per file', async () => {
    api.post.mockImplementation((_url, form) =>
      form.get('file').name === 'bad.pdf'
        ? fail(400, 'The file content does not match its .pdf extension')
        : ok(file('n1', 'good.pdf', 'annex_a'))
    )
    renderPage()
    await screen.findByText('Policy.pdf')

    pick('annex_a', [
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
    await screen.findByText('Policy.pdf')
    const before = listCalls()
    pick('annex_a', [pdf('virus.exe')])
    expect(await screen.findByText(/virus\.exe: File type not allowed/)).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
    expect(listCalls()).toBe(before)
  })

  it('deletes after the in-app confirmation and refreshes the list', async () => {
    api.delete.mockImplementation(() => {
      serverFiles = serverFiles.filter((f) => f._id !== 'f1')
      return Promise.resolve({ status: 204 })
    })
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Delete Policy.pdf' }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/Policy\.pdf/)).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))

    expect(await screen.findByText('File deleted')).toBeInTheDocument()
    expect(api.delete).toHaveBeenCalledWith('/files/f1')
    await waitFor(() => expect(screen.queryByText('Policy.pdf')).not.toBeInTheDocument())
    expect(window.confirm).not.toHaveBeenCalled()
  })

  it('keeps the dialog open and shows the error when delete fails; Cancel closes it', async () => {
    api.delete.mockImplementation(() => fail(409, 'This project is archived and read-only.'))
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Delete Policy.pdf' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }))

    expect(await screen.findByText(/archived and read-only/)).toBeInTheDocument()
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByText('Policy.pdf')).toBeInTheDocument()
  })

  it('downloads with the token (blob) under the original name', async () => {
    const createObjectURL = vi.fn(() => 'blob:x')
    const revokeObjectURL = vi.fn()
    Object.assign(URL, { createObjectURL, revokeObjectURL })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    renderPage({ actions: [] })

    fireEvent.click(await screen.findByRole('button', { name: 'Download سجل.pdf' }))

    await waitFor(() => expect(click).toHaveBeenCalled())
    expect(api.get).toHaveBeenCalledWith(
      '/files/f3/download',
      expect.objectContaining({ responseType: 'blob' })
    )
    expect(click.mock.instances[0].download).toBe('سجل.pdf')
    expect(createObjectURL).toHaveBeenCalled()
  })

  it('shows the server message when a download fails (blob error body)', async () => {
    renderPage()
    await screen.findByText('Policy.pdf')
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
    fireEvent.click(screen.getByRole('button', { name: 'Download Policy.pdf' }))
    expect(await screen.findByText('The file is missing on the server')).toBeInTheDocument()
  })

  it('shows a load error with a retry', async () => {
    const loaded = serverFiles
    serverFiles = 'fail'
    renderPage()
    expect(await screen.findByText('Could not load the annex files')).toBeInTheDocument()
    expect(screen.getByText('Server Error')).toBeInTheDocument()

    serverFiles = loaded
    fireEvent.click(screen.getByRole('button', { name: /Try again/ }))
    expect(await screen.findByText('Policy.pdf')).toBeInTheDocument()
  })
})
