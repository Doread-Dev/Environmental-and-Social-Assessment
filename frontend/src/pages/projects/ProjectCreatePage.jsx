import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Breadcrumb, Card, Input, Textarea, Button, Alert, Icon } from '@/components/ui'
import { validateProjectForm } from '@/utils/validators'
import { ROUTES } from '@/routes/routes.config'

/**
 * ProjectCreatePage - صفحة إنشاء مشروع جديد
 * Layout: MainLayout
 */
function ProjectCreatePage() {
  const navigate = useNavigate()

  // State
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

  // Handlers
  const handleChange = (field) => (e) => {
    const value = e.target.value
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }))
    }
    setGeneralError('')
  }

  const handleCancel = () => {
    navigate(ROUTES.PROJECTS)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGeneralError('')

    // Validation
    const validation = validateProjectForm({
      title: formData.title,
      location: formData.location,
      startDate: formData.startDate,
      endDate: formData.endDate,
    })

    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }

    setIsSubmitting(true)

    try {
      // Mock API call - في الإنتاج سيتم استدعاء API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock: إنشاء مشروع جديد
      const newProject = {
        _id: `new-${Date.now()}`,
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Navigate to project overview (في الإنتاج سيتم استخدام ID الحقيقي)
      // navigate(getProjectRoute(newProject._id, ROUTES.PROJECT_OVERVIEW))

      // For now, navigate to projects list
      navigate(ROUTES.PROJECTS)
    } catch {
      setGeneralError('An error occurred while creating the project. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Home', path: ROUTES.DASHBOARD },
    { label: 'Projects', path: ROUTES.PROJECTS },
    { label: 'Create New', path: ROUTES.PROJECT_NEW },
  ]

  return (
    <div className="flex flex-col gap-8 max-w-[960px] mx-auto w-full">
      {/* Breadcrumbs */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-text-main dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-tight">
            Create New Project
          </h1>
          <p className="text-text-secondary dark:text-gray-400 text-base font-normal">
            Enter the initial details to register the project in the ESMS.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="overflow-hidden">
        {/* Info Banner */}
        <div className="bg-primary/10 border-l-4 border-primary p-4 m-6 mb-2 rounded-r-md flex items-start gap-3">
          <Icon name="info" className="text-primary shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <span className="text-text-main dark:text-white font-semibold text-sm">
              Process Information
            </span>
            <p className="text-text-secondary dark:text-gray-400 text-sm leading-relaxed mt-1">
              Environmental screening and impact assessment workflows will be generated
              automatically after saving this basic profile. Please ensure the location and
              description are accurate.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {generalError && (
          <div className="px-6">
            <Alert
              variant="error"
              className="mb-4"
              dismissible
              onDismiss={() => setGeneralError('')}
            >
              {generalError}
            </Alert>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 flex flex-col gap-8 pb-0">
          {/* Project Details Section */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1 pb-2 border-b border-border-default dark:border-border-dark">
              <h3 className="text-text-main dark:text-white font-bold text-lg">Project Details</h3>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Project Title */}
              <Input
                label="Project Title"
                placeholder="e.g., Clean Water Initiative Phase II"
                value={formData.title}
                onChange={handleChange('title')}
                error={errors.title}
                required
                disabled={isSubmitting}
              />

              {/* Project Location */}
              <div className="flex flex-col gap-2">
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
                <span className="text-xs text-text-secondary dark:text-gray-400">
                  Specific location allows for automated GIS risk overlay later.
                </span>
              </div>
            </div>
          </div>

          {/* Timeline Section */}
          <div className="grid grid-cols-1 gap-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1 pb-2 border-b border-border-default dark:border-border-dark">
                <h3 className="text-text-main dark:text-white font-bold text-lg">Timeline</h3>
              </div>

              <div className="flex flex-col gap-4">
                {/* Start Date */}
                <Input
                  label="Start Date"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange('startDate')}
                  error={errors.startDate}
                  required
                  disabled={isSubmitting}
                />

                {/* End Date */}
                <Input
                  label="End Date (Estimated)"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange('endDate')}
                  error={errors.endDate}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1 pb-2 border-b border-border-default dark:border-border-dark">
              <h3 className="text-text-main dark:text-white font-bold text-lg">Description</h3>
            </div>

            <Textarea
              label="Project Component / Activity Description"
              placeholder="Briefly describe the main activities, infrastructure components, or interventions..."
              value={formData.description}
              onChange={handleChange('description')}
              rows={6}
              disabled={isSubmitting}
            />
          </div>

          {/* Actions Footer */}
          <div className="border-t border-border-default dark:border-border-dark bg-background/50 dark:bg-background-dark/30 p-6 -mx-6 md:-mx-8 -mb-6 md:-mb-8 mt-4 flex flex-col-reverse sm:flex-row justify-end gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              leftIcon={<Icon name="save" />}
              className="min-w-[160px]"
            >
              Save Project
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default ProjectCreatePage
