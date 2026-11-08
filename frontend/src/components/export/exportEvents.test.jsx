// Phase 12a: the header's Export Excel stays disabled until the open tool page answers the export
// event with its data loaded, so a click is never lost; it is disabled again when the page goes.
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { requestExport, useExportHandler, useExportReady } from './exportEvents'

function Header({ event = 'tool-export', detail }) {
  const ready = useExportReady(event)
  return (
    <button type="button" disabled={!ready} onClick={() => requestExport(event, detail)}>
      Export Excel
    </button>
  )
}

function Page({ onExport, ready = true, event = 'tool-export' }) {
  useExportHandler(event, onExport, ready)
  return <p>page</p>
}

const exportButton = () => screen.getByRole('button', { name: 'Export Excel' })

describe('export events', () => {
  it('is disabled with no page, while the page loads, and again once the page unmounts', () => {
    const onExport = vi.fn()
    const { rerender } = render(<Header />)
    expect(exportButton()).toBeDisabled()

    rerender(
      <>
        <Header />
        <Page onExport={onExport} ready={false} />
      </>
    )
    expect(exportButton()).toBeDisabled()

    rerender(
      <>
        <Header />
        <Page onExport={onExport} />
      </>
    )
    expect(exportButton()).toBeEnabled()

    rerender(<Header />)
    expect(exportButton()).toBeDisabled()
    expect(onExport).not.toHaveBeenCalled()
  })

  it('sends the event with its detail to the latest handler of the page', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = render(
      <>
        <Header detail={{ toolType: 'tool3' }} />
        <Page onExport={first} />
      </>
    )
    rerender(
      <>
        <Header detail={{ toolType: 'tool3' }} />
        <Page onExport={second} />
      </>
    )
    fireEvent.click(exportButton())
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
    expect(second.mock.calls[0][0].detail).toEqual({ toolType: 'tool3' })
  })

  it('is only ready for the event a page answers', () => {
    render(
      <>
        <Header event="screening-export" />
        <Page onExport={vi.fn()} event="assessment-export" />
      </>
    )
    expect(exportButton()).toBeDisabled()
  })

  it('stays disabled with no event (a page without export)', () => {
    render(<Header event={null} />)
    expect(exportButton()).toBeDisabled()
  })
})
