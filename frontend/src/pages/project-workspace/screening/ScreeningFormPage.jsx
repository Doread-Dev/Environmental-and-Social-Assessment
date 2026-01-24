/**
 * ScreeningFormPage
 * صفحة نموذج الفرز البيئي
 * 
 * Layout: ProjectLayout
 * Route: /app/projects/:projectId/screening
 */

import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Alert } from '@/components/ui'
import {
  ScreeningInfoSection,
  RiskCategorySelector,
  ImpactSection,
} from '@/components/screening'
import { useProjectContext, useScreening } from '@/hooks'
import { getScreeningByProjectId, createEmptyScreening } from '@/data'
import { cn } from '@/utils/cn'

/**
 * التحقق من إمكانية التعديل على Screening
 * لا يمكن التعديل إذا كانت الحالة submitted أو approved
 * يمكن التعديل في حالة draft أو rejected
 */
function canEditScreening(screening) {
  if (!screening) return true // لا يوجد screening - يمكن الإنشاء
  return screening.status === 'draft' || screening.status === 'rejected'
}

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

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

function ScreeningFormPage() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const [searchParams] = useSearchParams()
  const { project: contextProject } = useProjectContext()
  const { screening: hookScreening, isLoading: screeningLoading, submit: submitScreening, saveDraft: saveDraftScreening } = useScreening(projectId)

  // Check if we're in edit mode (from rejected status)
  const isEditMode = searchParams.get('edit') === 'true'

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

  // Check if editing is allowed - AFTER loading check
  // Allow editing if: draft, rejected, or in edit mode (from rejected)
  // Note: rejected status is already allowed by canEditScreening, but we check isEditMode for extra safety
  if (existingScreening && !canEditScreening(existingScreening) && !isEditMode) {
    // Redirect to summary if status is submitted or approved (and not in edit mode)
    // ScreeningRouter will handle showing the appropriate page
    navigate(`/app/projects/${projectId}/screening`, { replace: true })
    return null
  }

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
        // After submit, status becomes 'submitted' - redirect to show summary
        // The router will automatically show summary page
        navigate(`/app/projects/${projectId}/screening`, { replace: true })
      } else {
        setSubmitError(result.error || 'Failed to submit screening. Please try again.')
      }
    } catch (error) {
      setSubmitError('Failed to submit screening. Please try again.')
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
          <section className="bg-white dark:bg-[#152a1d] rounded-xl shadow-sm border border-border-default dark:border-[#1f3526] overflow-hidden">
            <div className="px-6 py-4 border-b border-border-default dark:border-[#1f3526] bg-gray-50/50 dark:bg-[#1a3322]/50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-text-main dark:text-white">
                1. Screening Information
              </h3>
              <span className="text-xs text-text-secondary bg-white dark:bg-[#102216] px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
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
          <section className="bg-white dark:bg-[#152a1d] rounded-xl shadow-sm border border-border-default dark:border-[#1f3526] overflow-hidden">
            <div className="px-6 py-4 border-b border-border-default dark:border-[#1f3526] bg-gray-50/50 dark:bg-[#1a3322]/50">
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
          <section className="bg-white dark:bg-[#152a1d] rounded-xl shadow-sm border border-border-default dark:border-[#1f3526] overflow-hidden">
            <div className="px-6 py-4 border-b border-border-default dark:border-[#1f3526] bg-gray-50/50 dark:bg-[#1a3322]/50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-text-main dark:text-white">
                3. Potential Impacts
              </h3>
              <span className="text-xs text-text-secondary bg-white dark:bg-[#102216] px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
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

      {/* Footer - Fixed من السايد بار إلى نهاية الصفحة */}
      <div
        className={cn(
          'fixed bottom-0 h-20',
          'left-0 lg:left-[280px] xl:left-[300px]', // على mobile: left-0، على desktop: بعد السايد بار
          'right-0',
          'bg-surface dark:bg-surface-dark',
          'border-t border-border-default dark:border-gray-700',
          'flex items-center justify-between px-4 sm:px-6 lg:px-8',
          'z-20 shadow-lg'
        )}
      >
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
              'border border-border-default dark:border-gray-600',
              'text-text-main dark:text-white font-medium',
              'hover:bg-background-light dark:hover:bg-gray-800',
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
      </div>
    </div>
  )
}

export default ScreeningFormPage
