/**
 * LibraryDocumentFormModal
 * Upload a library document (title, description, places, order + one PDF) or edit one (the same
 * fields, the file stays; replacing the PDF is its own action). `manage_library` only.
 */
import { useRef, useState } from 'react'
import { Button, Icon, Input, Modal, Textarea } from '@/components/ui'
import { useAuth, useUnsavedChanges } from '@/contexts'
import { extractErrorMessage } from '@/services/api'
import { acceptAttribute, checkFile, formatBytes, libraryRules } from '@/utils/fileRules'
import { PlacePicker } from './PlacePicker'

/**
 * @param {Object} props
 * @param {Object|null} props.document - The document to edit; null = upload a new one
 * @param {(data: Object) => Promise<any>} props.onSubmit - create (with file) or update
 * @param {boolean} props.isSaving
 * @param {Function} props.onClose
 */
export function LibraryDocumentFormModal({ document, onSubmit, isSaving, onClose }) {
  const isEdit = !!document
  const { uploadRules } = useAuth()
  const rules = libraryRules(uploadRules)
  const fileInput = useRef(null)
  const [title, setTitle] = useState(document?.title ?? '')
  const [description, setDescription] = useState(document?.description ?? '')
  const [order, setOrder] = useState(String(document?.order ?? 0))
  const [places, setPlaces] = useState(document?.places ?? [])
  const [file, setFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const submitting = useRef(false)
  const isDirty =
    title !== (document?.title ?? '') ||
    description !== (document?.description ?? '') ||
    order !== String(document?.order ?? 0) ||
    places.join(',') !== (document?.places ?? []).join(',') ||
    file !== null

  const pickFile = (event) => {
    const picked = event.target.files?.[0] ?? null
    event.target.value = ''
    if (!picked) return
    const refused = checkFile(picked, rules)
    setErrors((e) => ({ ...e, file: refused }))
    setFile(refused ? null : picked)
    // A new document is usually named like its file.
    if (!refused && !title.trim()) setTitle(picked.name.replace(/\.pdf$/i, ''))
  }

  // Validate and upload / save; also the shared guard's "Save" when leaving with changes (D61).
  // One request per click: a double click uploads one document.
  const save = async () => {
    const next = {}
    if (!title.trim()) next.title = 'Title is required'
    if (!/^\d+$/.test(order.trim())) next.order = 'Order is a whole number (0 or more)'
    if (!isEdit && !file) next.file = errors.file || 'Choose a PDF file'
    setErrors(next)
    if (Object.values(next).some(Boolean)) return { success: false }
    if (submitting.current) return { success: false }

    const data = {
      title: title.trim(),
      description: description.trim(),
      places,
      order: Number(order),
    }
    setFormError(null)
    submitting.current = true
    try {
      await onSubmit(isEdit ? data : { ...data, file })
      return { success: true }
    } catch (err) {
      setFormError(extractErrorMessage(err))
      return { success: false }
    } finally {
      submitting.current = false
    }
  }

  useUnsavedChanges(isDirty, save)

  const submit = (event) => {
    event.preventDefault()
    save()
  }

  return (
    <Modal
      isOpen
      onClose={() => !isSaving && onClose()}
      title={isEdit ? 'Edit library document' : 'Upload to the library'}
      size="2xl"
    >
      <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
        {!isEdit && (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text-main dark:text-white">PDF file</span>
            <input
              ref={fileInput}
              type="file"
              accept={acceptAttribute(rules)}
              className="hidden"
              onChange={pickFile}
              data-testid="library-file-input"
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<Icon name="upload_file" />}
                onClick={() => fileInput.current?.click()}
              >
                {file ? 'Choose another PDF' : 'Choose PDF'}
              </Button>
              {file ? (
                <span className="text-sm text-text-main dark:text-white truncate" dir="auto">
                  {file.name} · {formatBytes(file.size)}
                </span>
              ) : (
                <span className="text-xs text-text-secondary dark:text-gray-400">
                  PDF only{rules ? `, up to ${formatBytes(rules.max_bytes)}` : ''}
                </span>
              )}
            </div>
            {errors.file && (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {errors.file}
              </p>
            )}
          </div>
        )}

        <Input
          label="Title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
          maxLength={200}
          dir="auto"
        />
        <Textarea
          label="Description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          helperText="Optional: what the document is for."
          dir="auto"
        />
        <Input
          label="Order"
          type="number"
          min={0}
          step={1}
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          error={errors.order}
          helperText="Lower numbers come first; the same number sorts by title."
          className="sm:max-w-sm"
        />
        <PlacePicker value={places} onChange={setPlaces} disabled={isSaving} />

        {formError && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {formError}
          </p>
        )}

        <Modal.Footer className="mt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSaving}
            leftIcon={<Icon name={isEdit ? 'save' : 'upload'} />}
          >
            {isEdit ? 'Save' : 'Upload'}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  )
}

export default LibraryDocumentFormModal
