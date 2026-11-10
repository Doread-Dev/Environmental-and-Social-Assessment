/**
 * LibraryPage
 * The reference library (D64 b, c): organisation guidance, the same for every project. Every role
 * lists, searches, filters by place and opens documents; with `manage_library` (admin and
 * environmental specialist) also uploads, edits, re-links, replaces the PDF and deletes.
 * Layout: MainLayout · Route: ROUTES.LIBRARY
 *
 * One request for the whole list (useLibrary()); search and the place filter work on it here.
 */
import { useMemo, useRef, useState } from 'react'
import {
  Button,
  Card,
  Icon,
  Input,
  Select,
  useToast,
  PAGE_TITLE,
  PAGE_DESCRIPTION,
  LoadingState,
  ErrorState,
} from '@/components/ui'
import { ConfirmDeleteModal, PdfViewer } from '@/components/files'
import { GENERAL_LABEL, LibraryDocumentFormModal, PlaceBadges } from '@/components/library'
import { useLibrary, useLibraryManagement, useLookups } from '@/hooks'
import { useAuth } from '@/contexts'
import { extractErrorMessage } from '@/services/api'
import { libraryService } from '@/services/libraryService'
import { saveBlob } from '@/utils/saveBlob'
import { acceptAttribute, checkFile, formatBytes, libraryRules } from '@/utils/fileRules'
import { formatDate } from '@/utils/formatters'

const ALL = ''
const GENERAL = '__general'

const matches = (doc, text) =>
  !text ||
  doc.title.toLowerCase().includes(text) ||
  (doc.description ?? '').toLowerCase().includes(text)

function DocumentCard({
  doc,
  canManage,
  isReplacing,
  onOpen,
  onDownload,
  onEdit,
  onReplace,
  onDelete,
}) {
  return (
    <Card>
      <Card.Body>
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <button
            type="button"
            onClick={() => onOpen(doc)}
            className="flex items-start gap-3 flex-1 min-w-0 text-left group"
          >
            <span className="flex items-center justify-center size-11 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex-shrink-0">
              <span className="material-symbols-outlined" aria-hidden="true">
                picture_as_pdf
              </span>
            </span>
            <span className="flex-1 min-w-0">
              <span
                className="block font-bold text-text-main dark:text-white group-hover:text-primary transition-colors"
                dir="auto"
              >
                {doc.title}
              </span>
              {doc.description && (
                <span
                  className="block text-sm text-text-secondary dark:text-gray-400 mt-0.5"
                  dir="auto"
                >
                  {doc.description}
                </span>
              )}
              <span className="block text-xs text-text-secondary dark:text-gray-400 mt-1.5">
                <span dir="auto">{doc.original_name}</span> · {formatBytes(doc.size)} · updated{' '}
                {formatDate(doc.updatedAt)}
              </span>
            </span>
          </button>
          <div className="flex items-center gap-1 flex-wrap sm:flex-nowrap">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Icon name="visibility" />}
              onClick={() => onOpen(doc)}
            >
              Open
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDownload(doc)}
              aria-label={`Download ${doc.title}`}
            >
              <Icon name="download" />
            </Button>
            {canManage && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(doc)}
                  aria-label={`Edit ${doc.title}`}
                >
                  <Icon name="edit" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  isLoading={isReplacing}
                  onClick={() => onReplace(doc)}
                  aria-label={`Replace the PDF of ${doc.title}`}
                >
                  {!isReplacing && <Icon name="upload_file" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(doc)}
                  aria-label={`Delete ${doc.title}`}
                >
                  <Icon name="delete" />
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="mt-3 sm:pl-14">
          <PlaceBadges keys={doc.places} />
        </div>
      </Card.Body>
    </Card>
  )
}

export default function LibraryPage() {
  const toast = useToast()
  const { canManageLibrary, uploadRules } = useAuth()
  const { documents, isLoading, error, retry } = useLibrary()
  const { placesByGroup } = useLookups()
  const manage = useLibraryManagement()
  const replaceInput = useRef(null)

  const [search, setSearch] = useState('')
  const [place, setPlace] = useState(ALL)
  const [form, setForm] = useState(null) // { document: null | doc }
  const [viewing, setViewing] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [toReplace, setToReplace] = useState(null)

  const shown = useMemo(() => {
    const text = search.trim().toLowerCase()
    return documents.filter(
      (doc) =>
        matches(doc, text) &&
        (place === ALL ||
          (place === GENERAL ? doc.places.length === 0 : doc.places.includes(place)))
    )
  }, [documents, search, place])

  const handleSubmit = async (data) => {
    if (form.document) {
      await manage.updateDocument(form.document._id, data)
      toast.success('Library document saved')
    } else {
      await manage.createDocument(data)
      toast.success('Uploaded to the library')
    }
    setForm(null)
  }

  const handleDownload = async (doc) => {
    try {
      saveBlob(await libraryService.download(doc._id), doc.original_name)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const startReplace = (doc) => {
    setToReplace(doc)
    replaceInput.current?.click()
  }

  const handleReplace = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !toReplace) return
    const refused = checkFile(file, libraryRules(uploadRules))
    if (refused) {
      toast.error(refused)
      return
    }
    try {
      await manage.replaceFile(toReplace._id, file)
      toast.success(`PDF replaced: ${toReplace.title}`)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setToReplace(null)
    }
  }

  const handleDelete = async () => {
    try {
      await manage.removeDocument(toDelete._id)
      toast.success('Library document deleted')
      setToDelete(null)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const filtered = search.trim() !== '' || place !== ALL

  return (
    <div className="min-h-full bg-background dark:bg-background-dark">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-3xl text-primary" aria-hidden="true">
                menu_book
              </span>
              <h1 className={PAGE_TITLE}>Library</h1>
            </div>
            <p className={PAGE_DESCRIPTION}>
              Organisation guidance, the same for every project. Documents linked to a tool also
              open from its Guidance button.
            </p>
          </div>
          {canManageLibrary && (
            <Button leftIcon={<Icon name="upload" />} onClick={() => setForm({ document: null })}>
              Upload document
            </Button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            className="flex-1"
            leftIcon={<Icon name="search" />}
            placeholder="Search title or description"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search the library"
          />
          <Select
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            aria-label="Place filter"
            className="sm:w-72"
          >
            <option value={ALL}>All places</option>
            <option value={GENERAL}>{GENERAL_LABEL}</option>
            {placesByGroup.map((group) => (
              <optgroup key={group.key} label={group.label}>
                {group.places.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                    {p.locked ? ' (v3)' : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </div>

        {isLoading ? (
          <LoadingState message="Loading library..." variant="section" />
        ) : error ? (
          <ErrorState
            variant="section"
            title="Could not load the library"
            message={error}
            onRetry={retry}
          />
        ) : shown.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border-default dark:border-border-dark rounded-xl">
            <span
              className="material-symbols-outlined text-4xl text-text-secondary dark:text-gray-400"
              aria-hidden="true"
            >
              {filtered ? 'search_off' : 'menu_book'}
            </span>
            <p className="mt-2 font-medium text-text-main dark:text-white">
              {filtered ? 'No documents match' : 'The library is empty'}
            </p>
            <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">
              {filtered
                ? 'Try another search or place.'
                : canManageLibrary
                  ? 'Upload the first guidance document.'
                  : 'Guidance documents appear here once they are uploaded.'}
            </p>
          </div>
        ) : (
          <section className="flex flex-col gap-3" aria-label="Library documents">
            <p className="text-sm text-text-secondary dark:text-gray-400">
              {shown.length} {shown.length === 1 ? 'document' : 'documents'}
              {filtered && ` of ${documents.length}`}
            </p>
            {shown.map((doc) => (
              <DocumentCard
                key={doc._id}
                doc={doc}
                canManage={canManageLibrary}
                isReplacing={manage.replacingId === doc._id}
                onOpen={setViewing}
                onDownload={handleDownload}
                onEdit={(d) => setForm({ document: d })}
                onReplace={startReplace}
                onDelete={setToDelete}
              />
            ))}
          </section>
        )}
      </div>

      {canManageLibrary && (
        <input
          ref={replaceInput}
          type="file"
          accept={acceptAttribute(libraryRules(uploadRules))}
          className="hidden"
          onChange={handleReplace}
          data-testid="replace-file-input"
        />
      )}
      {form && (
        <LibraryDocumentFormModal
          document={form.document}
          onSubmit={handleSubmit}
          isSaving={manage.isSaving}
          onClose={() => setForm(null)}
        />
      )}
      {viewing && (
        <PdfViewer
          key={viewing._id}
          title={viewing.title}
          fileName={viewing.original_name}
          load={() => libraryService.download(viewing._id)}
          onClose={() => setViewing(null)}
        />
      )}
      {toDelete && (
        <ConfirmDeleteModal
          title="Delete library document"
          name={toDelete.title}
          note="It disappears from the library and from every Guidance button, for everyone. This cannot be undone."
          isDeleting={manage.isRemoving}
          onConfirm={handleDelete}
          onClose={() => !manage.isRemoving && setToDelete(null)}
        />
      )}
    </div>
  )
}
