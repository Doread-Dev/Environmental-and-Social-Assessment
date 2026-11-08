/**
 * ProjectHeader Component
 * رأس المشروع مع معلومات أساسية
 * مطابق للتصميم الأصلي حرفياً
 *
 * Features:
 * - عنوان المشروع مع badge الحالة في نفس السطر
 * - الموقع والتاريخ مع bullet separator
 * - أعضاء الفريق (Avatars) مع ring-2
 * - زر Edit Project
 */

import { useState } from 'react'
import { useUnsavedChanges } from '@/contexts'
import {
  Alert,
  Button,
  Icon,
  Input,
  Modal,
  PAGE_TITLE,
  StatusBadge,
  Textarea,
} from '@/components/ui'
import { formatDate } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import { validateProjectForm } from '@/utils/validators'

const normalizeDateInput = (value) => {
  if (!value) return ''
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

/**
 * @param {Object} props
 * @param {Object} props.project - بيانات المشروع
 * @param {string} [props.status] - Overall workflow status (workflow.status) shown as a badge
 * @param {boolean} props.showEditButton - عرض زر التعديل (default: true)
 * @param {Function} props.onEdit - callback عند النقر على التعديل
 */
const FORM_FIELDS = ['title', 'location', 'startDate', 'endDate', 'description']
const EMPTY_FORM = { title: '', location: '', startDate: '', endDate: '', description: '' }

// The edit form as the project is now
const formFromProject = (project) => ({
  title: project.title || project.name || '',
  location: project.location || '',
  startDate: normalizeDateInput(project.start_date || project.startDate || ''),
  endDate: normalizeDateInput(project.end_date || project.endDate || ''),
  description: project.project_component || project.description || '',
})

function ProjectHeader({ project, status, showEditButton = true, onEdit, className, ...props }) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)
  // The form and the project version when the dialog opened (D62): a refresh of the project in
  // the background never replaces what is being typed, and a change by someone else meanwhile
  // is caught at save (409)
  const [opened, setOpened] = useState({ form: EMPTY_FORM, version: null })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generalError, setGeneralError] = useState('')

  const location = project?.location || ''
  const startDate = project?.start_date || project?.startDate || ''
  const endDate = project?.end_date || project?.endDate || ''

  // Format dates
  const dateRange = startDate && endDate ? `${formatDate(startDate)} – ${formatDate(endDate)}` : ''

  const isDirty = isEditOpen && FORM_FIELDS.some((field) => formData[field] !== opened.form[field])

  const openEdit = () => {
    const form = formFromProject(project)
    setFormData(form)
    setOpened({ form, version: project.updatedAt })
    setErrors({})
    setGeneralError('')
    setIsEditOpen(true)
  }

  // Validate and save; also the shared guard's "Save" when leaving with the dialog open (D61)
  const saveEdit = async () => {
    setGeneralError('')

    const validation = validateProjectForm({
      title: formData.title,
      location: formData.location,
      startDate: formData.startDate,
      endDate: formData.endDate,
      description: formData.description,
    })

    if (!validation.valid) {
      setErrors(validation.errors)
      return { success: false }
    }

    setIsSubmitting(true)

    try {
      const payload = {
        title: formData.title.trim(),
        location: formData.location.trim(),
        start_date: formData.startDate,
        end_date: formData.endDate,
        project_component: formData.description.trim(),
        version: opened.version,
      }

      if (onEdit) {
        const result = await onEdit(payload)
        if (result && result.success === false) {
          // A stale save or an expired session is shown by its own dialog (D73)
          if (!result.handled) setGeneralError(result.error || 'Failed to update project.')
          return result
        }
      }

      setIsEditOpen(false)
      return { success: true }
    } catch {
      setGeneralError('An error occurred while updating the project. Please try again.')
      return { success: false }
    } finally {
      setIsSubmitting(false)
    }
  }

  useUnsavedChanges(isDirty, saveEdit)

  // Early return after hooks
  if (!project) return null

  const handleChange = (field) => (e) => {
    const value = e.target.value
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }))
    }
    setGeneralError('')
  }

  const handleCloseEdit = () => {
    if (isSubmitting) return
    setIsEditOpen(false)
  }

  const handleSave = (e) => {
    e.preventDefault()
    saveEdit()
  }

  // Mock team members (في الإنتاج سيأتي من API)
  const _teamMembers = [
    {
      name: 'Sarah Jenkins',
      avatar: null,
    },
    {
      name: 'Ahmed Hassan',
      avatar: null,
    },
    {
      name: 'Maria Santos',
      avatar: null,
    },
  ]

  return (
    <div
      className={cn(
        'flex flex-col md:flex-row justify-between items-start md:items-center gap-6',
        className
      )}
      {...props}
    >
      {/* Left Section */}
      <div className="flex flex-col gap-2">
        {/* Title with Badge */}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 dir="auto" className={PAGE_TITLE}>
            {project.title || project.name}
          </h1>
          {project._id && (
            <span className="text-xs text-text-secondary dark:text-gray-400 font-mono bg-background dark:bg-white/10 px-2 py-1 rounded">
              ID: {project._id}
            </span>
          )}
          {/* Archived projects say so; otherwise the overall workflow status (D30) */}
          <StatusBadge size="sm" status={project.archived ? 'archived' : status || 'draft'} />
        </div>

        {/* Location and Date */}
        <div className="flex items-center gap-4 text-text-secondary dark:text-gray-400 text-sm">
          {location && (
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                location_on
              </span>
              <span dir="auto">{location}</span>
            </span>
          )}
          {dateRange && (
            <>
              <span className="w-1 h-1 bg-border-default dark:bg-border-dark rounded-full"></span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  calendar_month
                </span>
                {dateRange}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right Section - Edit Button */}
      <div className="flex items-center gap-4">
        {/* Edit Button */}
        {showEditButton && (
          <Button variant="secondary" onClick={openEdit}>
            Edit Project
          </Button>
        )}
      </div>

      <Modal
        isOpen={isEditOpen}
        onClose={handleCloseEdit}
        title="Edit Project"
        description="Update the project details. All fields are required."
        size="lg"
      >
        {generalError && (
          <Alert variant="error" className="mb-4" dismissible onDismiss={() => setGeneralError('')}>
            {generalError}
          </Alert>
        )}
        <form onSubmit={handleSave} className="flex flex-col gap-6">
          <Input
            label="Project Title"
            placeholder="e.g., Clean Water Initiative Phase II"
            value={formData.title}
            onChange={handleChange('title')}
            error={errors.title}
            required
            disabled={isSubmitting}
          />
          <Input
            label="Project Location"
            placeholder="Enter city, region, or coordinates"
            value={formData.location}
            onChange={handleChange('location')}
            leftIcon={<Icon name="location_on" />}
            error={errors.location}
            required
            disabled={isSubmitting}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={normalizeDateInput(formData.startDate)}
              onChange={handleChange('startDate')}
              error={errors.startDate}
              required
              disabled={isSubmitting}
            />
            <Input
              label="End Date (Estimated)"
              type="date"
              value={normalizeDateInput(formData.endDate)}
              onChange={handleChange('endDate')}
              error={errors.endDate}
              required
              disabled={isSubmitting}
            />
          </div>
          <Textarea
            label="Project Component / Activity Description"
            placeholder="Briefly describe the main activities, infrastructure components, or interventions..."
            value={formData.description}
            onChange={handleChange('description')}
            error={errors.description}
            rows={5}
            required
            disabled={isSubmitting}
          />
          <Modal.Footer>
            <Button type="button" variant="ghost" onClick={handleCloseEdit} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              leftIcon={<Icon name="save" />}
            >
              Save Changes
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  )
}

export default ProjectHeader
