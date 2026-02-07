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

import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Icon, Input, Modal, Textarea } from '@/components/ui'
import { formatDateFull } from '@/utils/formatters'
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
 * @param {boolean} props.showEditButton - عرض زر التعديل (default: true)
 * @param {Function} props.onEdit - callback عند النقر على التعديل
 */
function ProjectHeader({ project, showEditButton = true, onEdit, className, ...props }) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    startDate: '',
    endDate: '',
    description: '',
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generalError, setGeneralError] = useState('')

  const location = project?.location || ''
  const startDate = project?.start_date || project?.startDate || ''
  const endDate = project?.end_date || project?.endDate || ''
  const description = project?.project_component || project?.description || ''

  // Format dates
  const dateRange =
    startDate && endDate ? `${formatDateFull(startDate)} – ${formatDateFull(endDate)}` : ''

  useEffect(() => {
    if (!isEditOpen || !project) return
    setFormData({
      title: project.title || project.name || '',
      location: project.location || '',
      startDate: normalizeDateInput(startDate),
      endDate: normalizeDateInput(endDate),
      description,
    })
    setErrors({})
    setGeneralError('')
  }, [description, isEditOpen, project, startDate, endDate])

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

  const handleSave = async (e) => {
    e.preventDefault()
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
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        title: formData.title.trim(),
        location: formData.location.trim(),
        start_date: formData.startDate,
        end_date: formData.endDate,
        project_component: formData.description.trim(),
      }

      if (onEdit) {
        const result = await onEdit(payload)
        if (result && result.success === false) {
          setGeneralError(result.error || 'Failed to update project.')
          return
        }
      }

      setIsEditOpen(false)
    } catch {
      setGeneralError('An error occurred while updating the project. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
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
          <h1 className="text-3xl font-bold text-text-main dark:text-white">
            {project.title || project.name}
          </h1>
          {project._id && (
            <span className="text-xs text-text-secondary dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              ID: {project._id}
            </span>
          )}
          <Badge
            variant="success"
            size="sm"
            className="bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
          >
            Active
          </Badge>
        </div>

        {/* Location and Date */}
        <div className="flex items-center gap-4 text-text-secondary dark:text-gray-400 text-sm">
          {location && (
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">location_on</span>
              {location}
            </span>
          )}
          {dateRange && (
            <>
              <span className="w-1 h-1 bg-border-default dark:bg-border-dark rounded-full"></span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">calendar_month</span>
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
          <button
            onClick={() => setIsEditOpen(true)}
            className="bg-white dark:bg-surface-dark border border-border-default dark:border-border-dark hover:bg-gray-50/50 dark:hover:bg-white/5 text-text-main dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            Edit Project
          </button>
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
