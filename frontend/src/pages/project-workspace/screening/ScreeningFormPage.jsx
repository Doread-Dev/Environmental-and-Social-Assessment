/**
 * ScreeningFormPage
 * Environmental screening form page
 *
 * Layout: ProjectLayout
 * Route: /app/projects/:projectId/screening
 */

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Alert, StickyFooter, Modal, Button, useToast, LoadingState } from '@/components/ui'
import { ScreeningInfoSection, RiskCategorySelector, ImpactSection } from '@/components/screening'
import { useScreening, useProjectContext } from '@/hooks'
import { useUnsavedChanges } from '@/contexts'
import { cn } from '@/utils/cn'
import { toDateInputValue } from '@/utils/formatters'
import { validateScreeningForm } from '@/utils'

const FIELDS = [
  'screeningDate',
  'categoryCode',
  'categoryReason',
  'potentialNegative',
  'potentialPositive',
]
const sameForm = (a, b) => FIELDS.every((field) => (a[field] ?? '') === (b[field] ?? ''))

function ScreeningFormPage() {
  const { projectId } = useParams()
  const toast = useToast()
  const {
    screening: hookScreening,
    isLoading: screeningLoading,
    submit: submitScreening,
    saveDraft: saveDraftScreening,
  } = useScreening(projectId)
  // Create (not started) or edit (draft/rejected): allowed actions from the backend (D35)
  const { can } = useProjectContext()
  const canSave = can('screening.create') || can('screening.edit')

  // Initialize all hooks BEFORE any conditional returns
  const [formData, setFormData] = useState({
    screeningDate: '',
    categoryCode: null,
    categoryReason: '',
    potentialNegative: '',
    potentialPositive: '',
  })

  // The form as loaded (or last saved): leaving with anything else asks first (D61)
  const [baseline, setBaseline] = useState(null)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [showSubmitModal, setShowSubmitModal] = useState(false)

  useEffect(() => {
    // Initialize form with screening data; a new screening starts with today's date (D63 b),
    // still editable and required
    const source = hookScreening || {
      screening_date: toDateInputValue(),
      category_code: null,
      category_reason: '',
      potential_negative: '',
      potential_positive: '',
    }
    const loaded = {
      screeningDate: source.screening_date
        ? new Date(source.screening_date).toISOString().split('T')[0]
        : '',
      categoryCode: source.category_code || null,
      categoryReason: source.category_reason || '',
      potentialNegative: source.potential_negative || '',
      potentialPositive: source.potential_positive || '',
    }
    setFormData(loaded)
    setBaseline(loaded)
  }, [hookScreening, projectId])

  const isDirty = canSave && baseline !== null && !sameForm(formData, baseline)

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
        screening_date: formData.screeningDate
          ? new Date(formData.screeningDate).toISOString()
          : null,
        category_code: formData.categoryCode,
        category_reason: formData.categoryReason,
        potential_negative: formData.potentialNegative,
        potential_positive: formData.potentialPositive,
      })

      if (result.success) {
        setBaseline(formData)
        toast.success('Draft saved successfully')
      } else if (!result.handled) {
        // A stale save or an expired session is shown by its own dialog (D73)
        toast.error(result.error || 'Failed to save draft. Please try again.')
      }
      return result
    } catch {
      setSubmitError('Failed to save draft. Please try again.')
      return { success: false }
    } finally {
      setIsSavingDraft(false)
    }
  }

  // Leaving with changes (sidebar, Back, browser Back, refresh) asks Save / Discard / Stay (D61);
  // "Save" saves the draft.
  const { navigateAway } = useUnsavedChanges(isDirty, handleSaveDraft)

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
        screening_date: formData.screeningDate
          ? new Date(formData.screeningDate).toISOString()
          : null,
        category_code: formData.categoryCode,
        category_reason: formData.categoryReason,
        potential_negative: formData.potentialNegative,
        potential_positive: formData.potentialPositive,
      })

      if (result.success) {
        // After submit, status becomes 'submitted' - go directly to summary page
        navigateAway(`/app/projects/${projectId}/screening/summary`, { replace: true })
      } else {
        if (!result.handled) {
          setSubmitError(result.error || 'Failed to submit screening. Please try again.')
        }
        setShowSubmitModal(false)
      }
    } catch {
      setSubmitError('Failed to submit screening. Please try again.')
      setShowSubmitModal(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading state FIRST (before any redirects)
  if (screeningLoading) {
    return <LoadingState message="Loading screening..." />
  }

  return (
    <div className="flex flex-col min-h-full relative">
      {/* Content container */}
      <div className="px-8 pb-20 max-w-5xl mx-auto w-full flex-1">
        {/* Page Header */}
        <div className="flex flex-col gap-2 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <span className="material-symbols-outlined" aria-hidden="true">
                assignment
              </span>
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
          <section className="bg-surface dark:bg-card-dark rounded-xl shadow-sm border border-border-default dark:border-border-dark overflow-hidden">
            <div className="px-6 py-4 border-b border-border-default dark:border-border-dark bg-background dark:bg-white/5 flex justify-between items-center">
              <h3 className="font-bold text-lg text-text-main dark:text-white">
                1. Screening Information
              </h3>
              <span className="text-xs text-text-secondary bg-surface dark:bg-background-dark px-2 py-1 rounded border border-border-default dark:border-border-dark">
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
          <section className="bg-surface dark:bg-card-dark rounded-xl shadow-sm border border-border-default dark:border-border-dark overflow-hidden">
            <div className="px-6 py-4 border-b border-border-default dark:border-border-dark bg-background dark:bg-white/5">
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
          <section className="bg-surface dark:bg-card-dark rounded-xl shadow-sm border border-border-default dark:border-border-dark overflow-hidden">
            <div className="px-6 py-4 border-b border-border-default dark:border-border-dark bg-background dark:bg-white/5 flex justify-between items-center">
              <h3 className="font-bold text-lg text-text-main dark:text-white">
                3. Potential Impacts
              </h3>
              <span className="text-xs text-text-secondary bg-surface dark:bg-background-dark px-2 py-1 rounded border border-border-default dark:border-border-dark">
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
          <p>
            By submitting this form, you confirm that all information provided is accurate and
            complete.
          </p>
        </div>
        {canSave && (
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSavingDraft || isSubmitting}
              className={cn(
                'flex items-center gap-2 px-6 py-2.5 rounded-lg',
                'border border-border-default dark:border-border-dark',
                'text-text-main dark:text-white font-medium',
                'hover:bg-background dark:hover:bg-white/5',
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
              <span className="material-symbols-outlined text-sm" aria-hidden="true">
                send
              </span>
              {isSubmitting ? 'Submitting...' : 'Submit Screening'}
            </button>
          </div>
        )}
      </StickyFooter>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Confirm Submission"
        description="Are you sure you want to submit the screening?"
        sub_description="*Editing will not be possible after submission unless the screening is rejected by a reviewer."
      >
        <Modal.Footer>
          <Button
            variant="outline"
            onClick={() => setShowSubmitModal(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirmSubmit} isLoading={isSubmitting} disabled={isSubmitting}>
            Confirm Submit
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default ScreeningFormPage
