/**
 * GuidanceButton
 * "Guidance (n)" in the header of a place's page (D64 c): the library documents linked to that
 * place. Hidden when there are none. It opens a side panel, and a document opens in the PDF
 * viewer — both overlays, so the page (and anything typed on it) stays as it is.
 *
 * One cached query per place (useLibrary → queryKeys.library(place)).
 */
import { useState } from 'react'
import { SidePanel } from '@/components/ui'
import { PdfViewer } from '@/components/files'
import { useLibrary, useLookups } from '@/hooks'
import { libraryService } from '@/services/libraryService'
import { formatBytes } from '@/utils/fileRules'
import { cn } from '@/utils/cn'

function GuidancePanel({ place, documents, onClose }) {
  const { placeLabel } = useLookups()
  const [viewing, setViewing] = useState(null)

  return (
    <>
      {/* While a document is open, Escape closes the viewer only (useOverlay). */}
      <SidePanel title="Guidance" subtitle={placeLabel(place)} icon="menu_book" onClose={onClose}>
        <p className="text-sm text-text-secondary dark:text-gray-400 mb-4">
          Organisation guidance for this page. Documents open here, without leaving the page.
        </p>
        <ul className="flex flex-col gap-2">
          {documents.map((doc) => (
            <li key={doc._id}>
              <button
                type="button"
                onClick={() => setViewing(doc)}
                className={cn(
                  'w-full flex items-start gap-3 p-3 rounded-lg text-left',
                  'border border-border-default dark:border-border-dark',
                  'hover:border-primary hover:bg-primary/5 transition-colors'
                )}
              >
                <span
                  className="material-symbols-outlined text-red-600 dark:text-red-400 mt-0.5"
                  aria-hidden="true"
                >
                  picture_as_pdf
                </span>
                <span className="flex-1 min-w-0">
                  <span
                    className="block text-sm font-semibold text-text-main dark:text-white"
                    dir="auto"
                  >
                    {doc.title}
                  </span>
                  {doc.description && (
                    <span
                      className="block text-xs text-text-secondary dark:text-gray-400 mt-0.5 line-clamp-3"
                      dir="auto"
                    >
                      {doc.description}
                    </span>
                  )}
                  <span className="block text-xs text-text-secondary dark:text-gray-400 mt-1">
                    PDF · {formatBytes(doc.size)}
                  </span>
                </span>
                <span
                  className="material-symbols-outlined text-text-secondary dark:text-gray-400"
                  aria-hidden="true"
                >
                  visibility
                </span>
              </button>
            </li>
          ))}
        </ul>
      </SidePanel>
      {viewing && (
        <PdfViewer
          key={viewing._id}
          title={viewing.title}
          fileName={viewing.original_name}
          load={() => libraryService.download(viewing._id)}
          onClose={() => setViewing(null)}
        />
      )}
    </>
  )
}

/**
 * @param {Object} props
 * @param {string|null|undefined} props.place - A place key (config/places.js); none = no button
 */
export function GuidanceButton({ place }) {
  const { documents } = useLibrary({ place, enabled: !!place })
  const [open, setOpen] = useState(false)

  if (!place || documents.length === 0) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Guidance (${documents.length})`}
        aria-haspopup="dialog"
        className={cn(
          'flex items-center gap-1.5 h-9 px-3 sm:px-4 rounded-lg text-sm font-medium shadow-sm',
          'bg-surface dark:bg-surface-dark text-primary',
          'border border-primary/40 hover:border-primary hover:bg-primary/5 transition-colors'
        )}
      >
        <span className="material-symbols-outlined text-lg" aria-hidden="true">
          menu_book
        </span>
        <span className="hidden sm:inline">Guidance</span>
        <span>({documents.length})</span>
      </button>
      {open && <GuidancePanel place={place} documents={documents} onClose={() => setOpen(false)} />}
    </>
  )
}

export default GuidanceButton
