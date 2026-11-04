import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { PdfViewer } from './PdfViewer'

const frame = () => document.querySelector('iframe')
const findFrame = () => waitFor(() => expect(frame()).not.toBeNull()).then(frame)
const pdfBlob = () => new Blob(['%PDF-1.4'], { type: 'application/pdf' })

function renderViewer(props = {}) {
  const onClose = vi.fn()
  const load = props.load ?? vi.fn(() => Promise.resolve(pdfBlob()))
  const result = render(
    <PdfViewer title="Annex 1" fileName="annex-1.pdf" load={load} onClose={onClose} {...props} />
  )
  return { ...result, onClose, load }
}

describe('PdfViewer (D64)', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:annex-1')
    URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete navigator.pdfViewerEnabled
  })

  it('fetches the PDF once, shows it in a frame on a blob URL and revokes it on close', async () => {
    const { unmount, load } = renderViewer()

    const iframe = await findFrame()
    expect(iframe).toHaveAttribute('src', 'blob:annex-1')
    expect(iframe).toHaveAttribute('title', 'Annex 1')
    expect(load).toHaveBeenCalledTimes(1)
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1)
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()

    unmount()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:annex-1')
  })

  it('gives the blob the PDF type when the response has none', async () => {
    renderViewer({ load: () => Promise.resolve(new Blob(['%PDF'])) })
    await findFrame()
    expect(URL.createObjectURL.mock.calls[0][0].type).toBe('application/pdf')
  })

  it('closes with the close button or Escape', async () => {
    const { onClose } = renderViewer()
    await findFrame()
    fireEvent.click(screen.getByRole('button', { name: 'Close viewer' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('downloads the loaded file under its name', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    renderViewer()
    await findFrame()
    fireEvent.click(screen.getByRole('button', { name: 'Download annex-1.pdf' }))
    expect(click.mock.instances[0].download).toBe('annex-1.pdf')
  })

  it('shows "Download to view" where the browser cannot show PDFs inline', async () => {
    Object.defineProperty(navigator, 'pdfViewerEnabled', { value: false, configurable: true })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    renderViewer()

    const button = await screen.findByRole('button', { name: /Download to view/ })
    expect(screen.getByText(/can.t show PDFs inside the app/)).toBeInTheDocument()
    expect(frame()).toBeNull()
    fireEvent.click(button)
    expect(click.mock.instances[0].download).toBe('annex-1.pdf')
  })

  it('shows the error and tries again', async () => {
    const err = new Error('x')
    err.response = { status: 404, data: { success: false, error: 'The file is missing' } }
    const load = vi
      .fn()
      .mockImplementationOnce(() => Promise.reject(err))
      .mockImplementationOnce(() => Promise.resolve(pdfBlob()))
    renderViewer({ load })

    expect(await screen.findByText('The file is missing')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download annex-1.pdf' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: /Try again/ }))
    expect(await findFrame()).toBeInTheDocument()
    await waitFor(() => expect(load).toHaveBeenCalledTimes(2))
  })

  it('does not create a URL when closed before the file arrives', async () => {
    let resolve
    const { unmount } = renderViewer({ load: () => new Promise((r) => (resolve = r)) })
    expect(screen.getByText(/Loading document/)).toBeInTheDocument()
    unmount()
    resolve(pdfBlob())
    await Promise.resolve()
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })
})
