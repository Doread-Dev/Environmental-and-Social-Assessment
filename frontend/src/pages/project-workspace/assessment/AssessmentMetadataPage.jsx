/**
 * AssessmentMetadataPage
 * صفحة البيانات الوصفية للتقييم
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAssessment, useScreening, useProjectContext } from '@/hooks'
import { MetadataInfoSection, MetadataFormSection } from '@/components/assessment'
import { Button, LoadingSpinner } from '@/components/ui'
import { currentUser } from '@/data'

/**
 * التحقق من صحة البيانات الوصفية
 */
function validateMetadata(data) {
  const errors = {}

  if (!data.project_activity?.trim()) {
    errors.project_activity = 'Project activity is required'
  }

  if (!data.description?.trim()) {
    errors.description = 'Description is required'
  } else if (data.description.trim().length < 50) {
    errors.description = 'Description must be at least 50 characters'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

export default function AssessmentMetadataPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { project } = useProjectContext()
  const { screening } = useScreening(projectId)
  const { assessment, isLoading, isSaving, saveMetadata } = useAssessment(projectId)

  const [formData, setFormData] = useState({
    project_activity: assessment?.project_activity || '',
    description: assessment?.description || '',
    environmental_setting: assessment?.environmental_setting || '',
    legal_requirements: assessment?.legal_requirements || ''
  })

  const [errors, setErrors] = useState({})

  // Update formData when assessment loads or changes
  useEffect(() => {
    if (assessment && !isLoading) {
      setFormData({
        project_activity: assessment.project_activity || '',
        description: assessment.description || '',
        environmental_setting: assessment.environmental_setting || '',
        legal_requirements: assessment.legal_requirements || ''
      })
    }
  }, [assessment, isLoading])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
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
      <div className="bg-white dark:bg-[#1a2e22] rounded-xl shadow-sm border border-border-color dark:border-white/5 overflow-hidden mb-20">
        {/* Info Section */}
        <MetadataInfoSection
          officer={currentUser}
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
      <div className="fixed bottom-0 left-0 right-0 lg:left-[280px] h-20 bg-white dark:bg-surface-dark border-t border-border-default dark:border-gray-700 flex items-center justify-between px-8 z-20">
        <button
          onClick={handleBack}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-border-default dark:border-gray-600 text-text-main dark:text-white font-medium hover:bg-background dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Assessment Overview
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving || assessment?.status === 'approved' || assessment?.status === 'submitted'}
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
      </div>
    </div>
  )
}
