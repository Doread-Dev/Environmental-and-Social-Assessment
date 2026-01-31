/**
 * ScreeningFormPage
 * صفحة نموذج الفرز البيئي
 * 
 * Layout: ProjectLayout
 * Route: /app/projects/:projectId/screening
 */

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert, StickyFooter, Modal, Button } from '@/components/ui'
import {
  ScreeningInfoSection,
  RiskCategorySelector,
  ImpactSection,
} from '@/components/screening'
import { useScreening } from '@/hooks'
import { getScreeningByProjectId, createEmptyScreening } from '@/data'
import { cn } from '@/utils/cn'

/**
 * التحقق من صحة النموذج
 */
function validateScreeningForm(data) {
  const errors = {}

  if (!data.screeningDate) {
    errors.screeningDate = 'Screening date is required'
  }

  if (!data.categoryCode) {
    errors.categoryCode = 'Risk category selection is required'
  }

  if (!data.categoryReason?.trim()) {
    errors.categoryReason = 'Category justification is required'
  } else if (data.categoryReason.trim().length < 50) {
    errors.categoryReason = 'Justification must be at least 50 characters'
  }

  if (!data.potentialNegative?.trim()) {
    errors.potentialNegative = 'Potential negative impacts are required'
  } else if (data.potentialNegative.trim().length < 20) {
    errors.potentialNegative = 'Please provide at least 20 characters'
  }

  if (!data.potentialPositive?.trim()) {
    errors.potentialPositive = 'Potential positive impacts are required'
  } else if (data.potentialPositive.trim().length < 20) {
    errors.potentialPositive = 'Please provide at least 20 characters'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

function ScreeningFormPage() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const { screening: hookScreening, isLoading: screeningLoading, submit: submitScreening, saveDraft: saveDraftScreening } = useScreening(projectId)

  // Load existing screening or create empty one
  const existingScreening = hookScreening || getScreeningByProjectId(projectId)
  const initialData = existingScreening || createEmptyScreening(projectId)

  // Initialize all hooks BEFORE any conditional returns
  const [formData, setFormData] = useState({
    screeningDate: initialData.screening_date
      ? new Date(initialData.screening_date).toISOString().split('T')[0]
      : '',
    categoryCode: initialData.category_code || null,
    categoryReason: initialData.category_reason || '',
    potentialNegative: initialData.potential_negative || '',
    potentialPositive: initialData.potential_positive || '',
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [showSubmitModal, setShowSubmitModal] = useState(false)

  // Show loading state FIRST (before any redirects)
  if (screeningLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-text-secondary dark:text-gray-400 text-sm">Loading screening...</p>
        </div>
      </div>
    )
  }

  // NOTE: We don't redirect here anymore - ScreeningRouter handles the routing logic
  // This component is ONLY rendered by ScreeningRouter when editing is allowed
  // So we don't need to check canEditScreening here

  // Handlers
  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, screeningDate: date }))
    if (errors.screeningDate) {
      setErrors((prev) => ({ ...prev, screeningDate: null }))
    }
  }

  const handleCategoryChange = (category) => {
    setFormData((prev) => ({ ...prev, categoryCode: category }))
    if (errors.categoryCode) {
      setErrors((prev) => ({ ...prev, categoryCode: null }))
    }
  }

  const handleJustificationChange = (reason) => {
    setFormData((prev) => ({ ...prev, categoryReason: reason }))
    if (errors.categoryReason) {
      setErrors((prev) => ({ ...prev, categoryReason: null }))
    }
  }

  const handleNegativeChange = (negative) => {
    setFormData((prev) => ({ ...prev, potentialNegative: negative }))
    if (errors.potentialNegative) {
      setErrors((prev) => ({ ...prev, potentialNegative: null }))
    }
  }

  const handlePositiveChange = (positive) => {
    setFormData((prev) => ({ ...prev, potentialPositive: positive }))
    if (errors.potentialPositive) {
      setErrors((prev) => ({ ...prev, potentialPositive: null }))
    }
  }

  const handleSaveDraft = async () => {
    setIsSavingDraft(true)
    setSubmitError(null)

    try {
      const result = await saveDraftScreening({
        screening_date: formData.screeningDate ? new Date(formData.screeningDate).toISOString() : null,
        category_code: formData.categoryCode,
        category_reason: formData.categoryReason,
        potential_negative: formData.potentialNegative,
        potential_positive: formData.potentialPositive,
      })

      if (result.success) {
        // Show success message
        alert('Draft saved successfully')
      } else {
        setSubmitError(result.error || 'Failed to save draft. Please try again.')
      }
    } catch (error) {
      setSubmitError('Failed to save draft. Please try again.')
    } finally {
      setIsSavingDraft(false)
    }
  }

  const handleSubmit = async () => {
    setSubmitError(null)

    // Validate form
    const validation = validateScreeningForm(formData)
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }

    setShowSubmitModal(true)
  }

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true)

    try {
      const result = await submitScreening({
        screening_date: formData.screeningDate ? new Date(formData.screeningDate).toISOString() : null,
        category_code: formData.categoryCode,
        category_reason: formData.categoryReason,
        potential_negative: formData.potentialNegative,
        potential_positive: formData.potentialPositive,
      })

      if (result.success) {
        // After submit, status becomes 'submitted' - go directly to summary page
        navigate(`/app/projects/${projectId}/screening/summary`, { replace: true })
      } else {
        setSubmitError(result.error || 'Failed to submit screening. Please try again.')
        setShowSubmitModal(false)
      }
    } catch (error) {
      setSubmitError('Failed to submit screening. Please try again.')
      setShowSubmitModal(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full relative">
      {/* Container للمحتوى - مطابق للتصميم الأصلي */}
      <div className="px-8 pb-20 max-w-5xl mx-auto w-full flex-1">
        {/* Page Header - مطابق للتصميم الأصلي */}
        <div className="flex flex-col gap-2 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <span className="material-symbols-outlined">assignment</span>
            </div>
            <h2 className="text-text-main dark:text-white text-2xl font-bold">
              Environmental Integration Screening
            </h2>
          </div>
          <p className="text-text-secondary pl-[52px]">Tool 1 – Screening Assessment</p>
        </div>

        {/* Error Alert */}
        {submitError && (
          <Alert variant="error" dismissible onDismiss={() => setSubmitError(null)}>
            {submitError}
          </Alert>
        )}

        {/* Form Sections */}
        <form className="flex flex-col gap-8">
          {/* Section 1: Screening Information */}
          <section className="bg-white dark:bg-[#152a1d] rounded-xl shadow-sm border border-border-default dark:border-border-dark overflow-hidden">
            <div className="px-6 py-4 border-b border-border-default dark:border-border-dark bg-gray-50/50 dark:bg-white/5 flex justify-between items-center">
              <h3 className="font-bold text-lg text-text-main dark:text-white">
                1. Screening Information
              </h3>
              <span className="text-xs text-text-secondary bg-white dark:bg-[#102216] px-2 py-1 rounded border border-gray-200 dark:border-border-dark">
                Required
              </span>
            </div>
            <div className="p-6">
              <ScreeningInfoSection
                screeningDate={formData.screeningDate}
                onDateChange={handleDateChange}
                error={errors.screeningDate}
              />
            </div>
          </section>

          {/* Section 2: Risk Category */}
          <section className="bg-white dark:bg-[#152a1d] rounded-xl shadow-sm border border-border-default dark:border-border-dark overflow-hidden">
            <div className="px-6 py-4 border-b border-border-default dark:border-border-dark bg-gray-50/50 dark:bg-white/5">
              <h3 className="font-bold text-lg text-text-main dark:text-white">
                2. Project Risk Category
              </h3>
            </div>
            <div className="p-6">
              <RiskCategorySelector
                selectedCategory={formData.categoryCode}
                onCategoryChange={handleCategoryChange}
                justification={formData.categoryReason}
                onJustificationChange={handleJustificationChange}
                error={errors}
              />
            </div>
          </section>

          {/* Section 3: Potential Impacts */}
          <section className="bg-white dark:bg-[#152a1d] rounded-xl shadow-sm border border-border-default dark:border-border-dark overflow-hidden">
            <div className="px-6 py-4 border-b border-border-default dark:border-border-dark bg-gray-50/50 dark:bg-white/5 flex justify-between items-center">
              <h3 className="font-bold text-lg text-text-main dark:text-white">
                3. Potential Impacts
              </h3>
              <span className="text-xs text-text-secondary bg-white dark:bg-[#102216] px-2 py-1 rounded border border-gray-200 dark:border-border-dark">
                Required
              </span>
            </div>
            <div className="p-6">
              <ImpactSection
                negativeImpacts={formData.potentialNegative}
                positiveImpacts={formData.potentialPositive}
                onNegativeChange={handleNegativeChange}
                onPositiveChange={handlePositiveChange}
                errors={errors}
              />
            </div>
          </section>
        </form>
      </div>

      {/* Footer - Uses CSS variable for sidebar width */}
      <StickyFooter>
        <div className="text-xs text-text-secondary">
          <p>By submitting this form, you confirm that all information provided is accurate and complete.</p>
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSavingDraft || isSubmitting}
            className={cn(
              'flex items-center gap-2 px-6 py-2.5 rounded-lg',
              'border border-border-default dark:border-border-dark',
              'text-text-main dark:text-white font-medium',
              'hover:bg-gray-50/50 dark:hover:bg-white/5',
              'transition-colors',
              (isSavingDraft || isSubmitting) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isSavingDraft ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isSavingDraft}
            className={cn(
              'flex items-center gap-2 px-6 py-2.5 rounded-lg',
              'bg-primary hover:bg-primary-hover text-white font-medium',
              'shadow-md transition-colors transform active:scale-95',
              (isSubmitting || isSavingDraft) && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span className="material-symbols-outlined text-sm">send</span>
            {isSubmitting ? 'Submitting...' : 'Submit Screening'}
          </button>
        </div>
      </StickyFooter>


      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Confirm Submission"
        description="Are you sure you want to submit the screening?"
        sub_description="*Editing will not be possible after submission unless the screening is rejected by an administrator."
      >
        <Modal.Footer>
          <Button
            variant="outline"
            onClick={() => setShowSubmitModal(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSubmit}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            Confirm Submit
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default ScreeningFormPage
