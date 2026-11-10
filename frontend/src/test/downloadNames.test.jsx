// Phase 12: the file endpoints no longer send Content-Disposition (download managers such as IDM
// hijack responses that carry it). Every save path names the file from the record's own
// `original_name` — Arabic names included — and never reads a response header.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react'
import api from '@/services/api'
import { saveBlob } from '@/utils/saveBlob'
import { useProjectFiles } from '@/hooks/useProjectFiles'
import { PdfViewer } from '@/components/files/PdfViewer'
import LibraryPage from '@/pages/library/LibraryPage'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts'
import { createTestQueryClient, lookupsFixture, ok, signIn } from '@/test/utils'
import { renderApp } from '@/test/renderApp'

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))
vi.mock('@/utils/saveBlob', async (importOriginal) => ({
  ...(await importOriginal()),
  saveBlob: vi.fn(),
}))

// A file response as the server now sends it: the bytes, a type, and no Content-Disposition
const fileResponse = () =>
  Promise.resolve({
    data: new Blob(['%PDF-1.4'], { type: 'application/pdf' }),
    headers: { 'content-type': 'application/pdf', 'cache-control': 'private, no-store' },
  })

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  URL.createObjectURL = vi.fn(() => 'blob:file')
  URL.revokeObjectURL = vi.fn()
})

describe('saved file names come from the record, never from a header', () => {
  it('project documents: downloadFile saves under the Arabic original name', async () => {
    api.get.mockImplementation((url) => (url.endsWith('/download') ? fileResponse() : ok([])))
    const queryClient = createTestQueryClient()
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    )
    const { result } = renderHook(() => useProjectFiles('p1'), { wrapper })

    await act(() =>
      result.current.downloadFile({ _id: 'f1', original_name: 'تقرير زيارة الموقع.pdf' })
    )

    expect(api.get).toHaveBeenCalledWith(
      '/files/f1/download',
      expect.objectContaining({ responseType: 'blob' })
    )
    expect(saveBlob).toHaveBeenCalledTimes(1)
    const [blob, name] = saveBlob.mock.calls[0]
    expect(name).toBe('تقرير زيارة الموقع.pdf')
    expect(blob.type).toBe('application/pdf')
  })

  it('library page: Download saves under the Arabic original name', async () => {
    signIn({ user: { _id: 'u1', name: 'Sara', role: 'viewer' } })
    api.get.mockImplementation((url) => {
      if (url === '/auth/me') return ok({ user: { _id: 'u1', role: 'viewer' }, permissions: [] })
      if (url === '/lookups') return ok(lookupsFixture())
      if (url === '/library')
        return ok([
          {
            _id: 'd1',
            title: 'دليل التخفيف',
            description: '',
            places: [],
            order: 0,
            original_name: 'دليل التخفيف ٢٠٢٦.pdf',
            mime_type: 'application/pdf',
            size: 8,
            updatedAt: '2026-11-01T10:00:00.000Z',
          },
        ])
      if (url === '/library/d1/file') return fileResponse()
      return Promise.reject(new Error(`No mock for GET ${url}`))
    })
    renderApp([{ path: '/', element: <LibraryPage /> }], '/')

    fireEvent.click(await screen.findByRole('button', { name: 'Download دليل التخفيف' }))

    await waitFor(() => expect(saveBlob).toHaveBeenCalledTimes(1))
    expect(saveBlob.mock.calls[0][1]).toBe('دليل التخفيف ٢٠٢٦.pdf')
  })

  it('PDF viewer: Download saves under the name it was given (the record name)', async () => {
    render(
      <PdfViewer
        title="دليل"
        fileName="دليل المياه.pdf"
        load={() => fileResponse().then((res) => res.data)}
        onClose={() => {}}
      />
    )
    const viewer = screen.getByRole('dialog', { name: 'دليل' })
    const button = within(viewer).getByRole('button', { name: 'Download دليل المياه.pdf' })
    await waitFor(() => expect(button).toBeEnabled())
    fireEvent.click(button)
    expect(saveBlob).toHaveBeenCalledWith(expect.any(Blob), 'دليل المياه.pdf')
  })
})
