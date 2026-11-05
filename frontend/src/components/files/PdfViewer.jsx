/**
 * PdfViewer
 * Shows a PDF inside the app (D64): library guidance and project documents. The file is fetched
 * with the user's token as a Blob, shown in an iframe on a blob: URL, and the URL is revoked when
 * the viewer closes. Where the browser cannot show PDFs inline (some mobile browsers report
 * navigator.pdfViewerEnabled = false), it offers "Download to view" instead.
 *
 * Mount it only while open (`{doc && <PdfViewer … />}`), keyed by the file, so each file is
 * fetched once per opening. Phase 11: the CSP must allow blob: for frames.
 */
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Alert, Button, Icon, LoadingSpinner, useOverlay } from '@/components/ui'
import { extractErrorMessage } from '@/services/api'
import { canShowPdfInline, saveBlob } from '@/utils/saveBlob'
import { cn } from '@/utils/cn'

/**
 * @param {Object} props
 * @param {string} props.title - Heading (document title)
 * @param {string} props.fileName - Download name (the original file name)
 * @param {() => Promise<Blob>} props.load - Fetches the PDF (with the token)
 * @param {Function} props.onClose
 */
export function PdfViewer({ title, fileName, load, onClose }) {
  const titleId = useId()
  const [state, setState] = useState({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const loadRef = useRef(load)
  const closeButton = useRef(null)
  const inline = canShowPdfInline()
  useOverlay(onClose)

  // Keyboard focus moves into the viewer, so Escape and Tab work in it right away.
  useEffect(() => {
    closeButton.current?.focus()
  }, [])

  useEffect(() => {
    let url = null
    let cancelled = false
    setState({ status: 'loading' })
    loadRef
      .current()
      .then((data) => {
        if (cancelled) return
        // The frame needs the PDF type to render it, whatever the response said.
        const blob =
          data.type === 'application/pdf' ? data : new Blob([data], { type: 'application/pdf' })
        url = URL.createObjectURL(blob)
        setState({ status: 'ready', blob, url })
      })
      .catch((err) => {
        if (!cancelled) setState({ status: 'error', error: extractErrorMessage(err) })
      })
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [attempt])

  const download = () => state.blob && saveBlob(state.blob, fileName)

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-stretch justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/60 animate-fade-in" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative flex flex-col w-full max-w-6xl',
          'bg-surface dark:bg-surface-dark',
          'sm:rounded-2xl shadow-xl overflow-hidden',
          'border border-border-default dark:border-border-dark'
        )}
      >
        <header className="flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-border-default dark:border-border-dark">
          <span className="material-symbols-outlined text-red-600 dark:text-red-400" aria-hidden>
            picture_as_pdf
          </span>
          <div className="flex-1 min-w-0">
            <h2
              id={titleId}
              className="text-base font-bold text-text-main dark:text-white truncate"
              dir="auto"
              title={title}
            >
              {title}
            </h2>
            <p
              className="text-xs text-text-secondary dark:text-gray-400 truncate"
              dir="auto"
              title={fileName}
            >
              {fileName}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Icon name="download" />}
            onClick={download}
            disabled={state.status !== 'ready'}
            aria-label={`Download ${fileName}`}
          >
            <span className="hidden sm:inline">Download</span>
          </Button>
          <button
            ref={closeButton}
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-secondary dark:text-gray-400 hover:text-text-main dark:hover:text-white hover:bg-background dark:hover:bg-background-dark transition-colors"
            aria-label="Close viewer"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              close
            </span>
          </button>
        </header>

        <div className="flex-1 min-h-0 bg-background dark:bg-background-dark">
          {state.status === 'loading' && (
            <div className="h-full flex items-center justify-center gap-3 text-sm text-text-secondary dark:text-gray-400">
              <LoadingSpinner size="md" /> Loading document…
            </div>
          )}
          {state.status === 'error' && (
            <div className="p-6 max-w-lg mx-auto">
              <Alert
                variant="error"
                title="Could not open the document"
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Icon name="refresh" />}
                    onClick={() => setAttempt((n) => n + 1)}
                  >
                    Try again
                  </Button>
                }
              >
                {state.error}
              </Alert>
            </div>
          )}
          {state.status === 'ready' &&
            (inline ? (
              <iframe
                src={state.url}
                title={title}
                className="w-full h-full min-h-[60vh] border-0 bg-surface"
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
                <span
                  className="material-symbols-outlined text-5xl text-text-secondary dark:text-gray-400"
                  aria-hidden="true"
                >
                  picture_as_pdf
                </span>
                <div>
                  <p className="font-bold text-text-main dark:text-white">
                    This browser can&apos;t show PDFs inside the app
                  </p>
                  <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">
                    Download the file to read it in your PDF app.
                  </p>
                </div>
                <Button leftIcon={<Icon name="download" />} onClick={download}>
                  Download to view
                </Button>
              </div>
            ))}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default PdfViewer
