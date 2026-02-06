/**
 * AssessmentMetadataPage
 * صفحة البيانات الوصفية للتقييم
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAssessment, useScreening, useProjectContext } from '@/hooks'
import { useAuth } from '@/contexts'
import { MetadataInfoSection, MetadataFormSection } from '@/components/assessment'
import { LoadingSpinner, StickyFooter } from '@/components/ui'

/**
 * التحقق من صحة البيانات الوصفية
 */
function validateMetadata(data) {
  const errors = {}

  if (!data.project_activity?.trim()) {
    errors.project_activity = 'Project activity is required'
  } else if (data.project_activity.trim().length < 10) {
    errors.project_activity = 'Project activity must be at least 10 characters'
  }

  if (!data.description?.trim()) {
    errors.description = 'Description is required'
  } else if (data.description.trim().length < 50) {
    errors.description = 'Description must be at least 50 characters'
  }

  if (!data.environmental_setting?.trim()) {
    errors.environmental_setting = 'Environmental setting is required'
  } else if (data.environmental_setting.trim().length < 30) {
    errors.environmental_setting = 'Environmental setting must be at least 30 characters'
  }

  if (!data.legal_requirements?.trim()) {
    errors.legal_requirements = 'Legal requirements are required'
  } else if (data.legal_requirements.trim().length < 20) {
    errors.legal_requirements = 'Legal requirements must be at least 20 characters'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

export default function AssessmentMetadataPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { project } = useProjectContext()
  const { screening } = useScreening(projectId)
  const { assessment, isLoading, isSaving, saveMetadata } = useAssessment(projectId)
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    project_activity: assessment?.project_activity || '',
    description: assessment?.description || '',
    environmental_setting: assessment?.environmental_setting || '',
    legal_requirements: assessment?.legal_requirements || '',
  })

  const [errors, setErrors] = useState({})

  // Update formData when assessment loads or changes
  useEffect(() => {
    if (assessment && !isLoading) {
      setFormData({
        project_activity: assessment.project_activity || '',
        description: assessment.description || '',
        environmental_setting: assessment.environmental_setting || '',
        legal_requirements: assessment.legal_requirements || '',
      })
    }
  }, [assessment, isLoading])

  if (isLoading) {
    return (
      <div className="flex w-full items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-text-secondary dark:text-gray-400 text-sm">Loading metadata...</p>
        </div>
      </div>
    )
  }

  const handleChange = (newData) => {
    setFormData(newData)
    // Clear errors when user starts typing
    if (errors.project_activity && newData.project_activity) {
      setErrors((prev) => ({ ...prev, project_activity: null }))
    }
    if (errors.description && newData.description) {
      setErrors((prev) => ({ ...prev, description: null }))
    }
    if (errors.environmental_setting && newData.environmental_setting) {
      setErrors((prev) => ({ ...prev, environmental_setting: null }))
    }
    if (errors.legal_requirements && newData.legal_requirements) {
      setErrors((prev) => ({ ...prev, legal_requirements: null }))
    }
  }

  const handleSave = async () => {
    const validation = validateMetadata(formData)
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }

    const result = await saveMetadata(formData)
    if (result.success) {
      navigate(`/app/projects/${projectId}/assessment/methods`)
    }
  }

  const handleBack = () => {
    navigate(`/app/projects/${projectId}/assessment`)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-main dark:text-white">
          Environmental Assessment Metadata
        </h1>
        <p className="text-text-secondary mt-1">Assessment Information & Metadata</p>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-border-default dark:border-border-dark overflow-hidden mb-20">
        {/* Info Section */}
        <MetadataInfoSection
          officer={assessment?.officer && typeof assessment.officer === 'object' ? assessment.officer : user}
          currentUser={user}
          project={project}
          screeningCategory={screening?.category_code}
        />

        {/* Form Section */}
        <MetadataFormSection
          formData={formData}
          onChange={handleChange}
          errors={errors}
          readOnly={assessment?.status === 'approved' || assessment?.status === 'submitted'}
        />
      </div>

      {/* Sticky Footer */}
      <StickyFooter>
        <button
          onClick={handleBack}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-border-default dark:border-border-dark text-text-main dark:text-white font-medium hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Assessment Overview
        </button>
        <button
          onClick={handleSave}
          disabled={
            isSaving || assessment?.status === 'approved' || assessment?.status === 'submitted'
          }
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium shadow-md transition-colors transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <LoadingSpinner size="sm" />
              Saving...
            </>
          ) : (
            <>
              Save and Continue
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </>
          )}
        </button>
      </StickyFooter>
    </div>
  )
}
