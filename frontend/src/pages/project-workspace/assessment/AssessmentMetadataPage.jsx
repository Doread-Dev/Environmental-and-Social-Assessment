/**
 * AssessmentMetadataPage
 * صفحة البيانات الوصفية للتقييم
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAssessment, useScreening, useProjectContext } from '@/hooks'
import { useAuth, useUnsavedChanges } from '@/contexts'
import { MetadataInfoSection, MetadataFormSection } from '@/components/assessment'
import {
  Alert,
  LoadingSpinner,
  StickyFooter,
  LoadingState,
  PageHeader,
  Button,
} from '@/components/ui'
import { validateAssessmentMetadata } from '@/utils'

const FIELDS = ['project_activity', 'description', 'environmental_setting', 'legal_requirements']
const fromAssessment = (assessment) =>
  Object.fromEntries(FIELDS.map((field) => [field, assessment?.[field] || '']))
const sameForm = (a, b) => FIELDS.every((field) => a[field] === b[field])

export default function AssessmentMetadataPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { project, can } = useProjectContext()
  // Editable only while draft/rejected and for editors (allowed actions from the backend)
  const readOnly = !can('assessment.edit')
  const { screening } = useScreening(projectId)
  const { assessment, isLoading, isSaving, error, saveMetadata } = useAssessment(projectId)
  const { user } = useAuth()

  const [formData, setFormData] = useState(() => fromAssessment(assessment))
  // The form as loaded (or last saved): leaving with anything else asks first (D61)
  const [baseline, setBaseline] = useState(() => fromAssessment(assessment))

  const [errors, setErrors] = useState({})

  // Update formData when assessment loads or changes
  useEffect(() => {
    if (assessment && !isLoading) {
      setFormData(fromAssessment(assessment))
      setBaseline(fromAssessment(assessment))
    }
  }, [assessment, isLoading])

  const isDirty = !readOnly && !sameForm(formData, baseline)

  // Validate and save; the shared guard's "Save" uses it too (it then leaves where the user was
  // going, not to the next step)
  const save = async () => {
    const validation = validateAssessmentMetadata(formData)
    if (!validation.valid) {
      setErrors(validation.errors)
      return { success: false }
    }
    const result = await saveMetadata(formData)
    if (result.success) setBaseline(formData)
    return result
  }

  const { navigateAway } = useUnsavedChanges(isDirty, save)

  if (isLoading) {
    return <LoadingState message="Loading metadata..." />
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
    const result = await save()
    if (result.success) {
      navigateAway(`/app/projects/${projectId}/assessment/methods`)
    }
  }

  const handleBack = () => {
    navigate(`/app/projects/${projectId}/assessment`)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        className="mb-8"
        title="Environmental Assessment Metadata"
        description="Assessment Information & Metadata"
      />

      {/* The save failed: the server's reason (a stale save or an expired session has its own
          dialog and is not repeated here) */}
      {error && (
        <Alert variant="error" className="mb-6" role="alert">
          {error}
        </Alert>
      )}

      {/* Form Card */}
      <div className="bg-surface dark:bg-surface-dark rounded-xl shadow-sm border border-border-default dark:border-border-dark overflow-hidden mb-20">
        {/* Info Section */}
        <MetadataInfoSection
          officer={
            assessment?.officer && typeof assessment.officer === 'object'
              ? assessment.officer
              : user
          }
          currentUser={user}
          project={project}
          screeningCategory={screening?.category_code}
        />

        {/* Form Section */}
        <MetadataFormSection
          formData={formData}
          onChange={handleChange}
          errors={errors}
          readOnly={readOnly}
        />
      </div>

      {/* Sticky Footer */}
      <StickyFooter>
        <Button variant="secondary" onClick={handleBack} disabled={isSaving}>
          <span className="material-symbols-outlined text-sm" aria-hidden="true">
            arrow_back
          </span>
          Back to Assessment Overview
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={isSaving || readOnly}>
          {isSaving ? (
            <>
              <LoadingSpinner size="sm" />
              Saving...
            </>
          ) : (
            <>
              Save and Continue
              <span className="material-symbols-outlined text-sm" aria-hidden="true">
                arrow_forward
              </span>
            </>
          )}
        </Button>
      </StickyFooter>
    </div>
  )
}
