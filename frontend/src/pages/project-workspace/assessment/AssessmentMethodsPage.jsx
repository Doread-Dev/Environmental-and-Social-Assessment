/**
 * AssessmentMethodsPage
 * صفحة طرق التقييم والاستشارات المجتمعية
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAssessment } from '@/hooks'
import { MethodChecklistItem, ConsultationChecklistItem } from '@/components/assessment'
import { LoadingSpinner, StickyFooter, useToast } from '@/components/ui'
import { assessmentMethods, consultationMethods } from '@/data'

export default function AssessmentMethodsPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const {
    assessment,
    methods,
    consultations,
    isLoading,
    isSaving,
    saveMethods,
    saveConsultations,
  } = useAssessment(projectId)

  // State for methods
  const [selectedMethods, setSelectedMethods] = useState(() => {
    const state = {}
    assessmentMethods.forEach((method) => {
      const existing = methods.find((m) => m.method_type === method.id)
      state[method.id] = {
        checked: !!existing,
        details: existing?.details || '',
      }
    })
    return state
  })

  // State for consultations
  const [selectedConsultations, setSelectedConsultations] = useState(() => {
    const state = {}
    consultationMethods.forEach((consultation) => {
      const existing = consultations.find((c) => c.type === consultation.id)
      state[consultation.id] = {
        checked: !!existing,
        participants: existing?.participants || '',
      }
    })
    return state
  })

  // Update state when methods/consultations load
  useEffect(() => {
    if (!isLoading && methods && consultations) {
      // Update methods
      const methodsState = {}
      assessmentMethods.forEach((method) => {
        const existing = methods.find((m) => m.method_type === method.id)
        methodsState[method.id] = {
          checked: !!existing,
          details: existing?.details || '',
        }
      })
      setSelectedMethods(methodsState)

      // Update consultations
      const consultationsState = {}
      consultationMethods.forEach((consultation) => {
        const existing = consultations.find((c) => c.type === consultation.id)
        consultationsState[consultation.id] = {
          checked: !!existing,
          participants: existing?.participants || '',
        }
      })
      setSelectedConsultations(consultationsState)
    }
  }, [methods, consultations, isLoading])

  if (isLoading) {
    return (
      <div className="flex w-full items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-text-secondary dark:text-gray-400 text-sm">Loading methods...</p>
        </div>
      </div>
    )
  }

  const handleMethodChange = (methodId, checked) => {
    setSelectedMethods((prev) => ({
      ...prev,
      [methodId]: { ...prev[methodId], checked },
    }))
  }

  const handleMethodDetailsChange = (methodId, details) => {
    setSelectedMethods((prev) => ({
      ...prev,
      [methodId]: { ...prev[methodId], details },
    }))
  }

  const handleConsultationChange = (consultationId, checked) => {
    setSelectedConsultations((prev) => ({
      ...prev,
      [consultationId]: { ...prev[consultationId], checked },
    }))
  }

  const handleConsultationParticipantsChange = (consultationId, participants) => {
    setSelectedConsultations((prev) => ({
      ...prev,
      [consultationId]: { ...prev[consultationId], participants },
    }))
  }

  const handleSave = async () => {
    // Prepare methods data
    const methodsData = assessmentMethods
      .filter((m) => selectedMethods[m.id]?.checked)
      .map((m) => ({
        method_type: m.id,
        details: selectedMethods[m.id]?.details || '',
      }))

    // Prepare consultations data
    const consultationsData = consultationMethods
      .filter((c) => selectedConsultations[c.id]?.checked)
      .map((c) => ({
        type: c.id,
        participants: selectedConsultations[c.id]?.participants || '',
        notes: '', // Empty notes field (not shown in UI but required by backend model)
      }))

    // Save both with proper error handling
    const [methodsResult, consultationsResult] = await Promise.allSettled([
      saveMethods(methodsData),
      saveConsultations(consultationsData),
    ])

    // Check for failures
    const errors = []
    if (methodsResult.status === 'rejected' || !methodsResult.value?.success) {
      errors.push('Failed to save methods')
    }
    if (consultationsResult.status === 'rejected' || !consultationsResult.value?.success) {
      errors.push('Failed to save consultations')
    }

    if (errors.length > 0) {
      toast.error(errors.join('. ') + '. Please try again.')
      return
    }

    navigate(`/app/projects/${projectId}/assessment/scoring`)
  }

  const handleBack = () => {
    navigate(`/app/projects/${projectId}/assessment/metadata`)
  }

  // Allow editing when rejected or draft, but not when approved or submitted
  // When rejected, user should be able to edit (rejected is not submitted, so it's editable)
  const readOnly = assessment?.status === 'approved' || assessment?.status === 'submitted'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-main dark:text-white">
          Assessment Methods & Consultation
        </h1>
        <p className="text-text-secondary mt-1">
          Document the methods used for environmental assessment and community consultation
        </p>
      </div>

      {/* Methods Section */}
      <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-border-default dark:border-border-dark mb-6">
        <div className="p-6 md:p-8 border-b border-border-default dark:border-border-dark">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">science</span>
            </div>
            <h2 className="text-lg font-bold text-text-main dark:text-white">
              Environmental Assessment Methods
            </h2>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-2">
          {assessmentMethods.map((method) => (
            <MethodChecklistItem
              key={method.id}
              method={method}
              checked={selectedMethods[method.id]?.checked || false}
              details={selectedMethods[method.id]?.details || ''}
              onCheckedChange={(checked) => handleMethodChange(method.id, checked)}
              onDetailsChange={(details) => handleMethodDetailsChange(method.id, details)}
              readOnly={readOnly}
            />
          ))}
        </div>
      </div>

      {/* Consultation Section */}
      <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-border-default dark:border-border-dark mb-20">
        <div className="p-6 md:p-8 border-b border-border-default dark:border-border-dark">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">groups</span>
            </div>
            <h2 className="text-lg font-bold text-text-main dark:text-white">
              Public and Community Consultation
            </h2>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-4">
          {consultationMethods.map((consultation) => (
            <ConsultationChecklistItem
              key={consultation.id}
              consultation={consultation}
              checked={selectedConsultations[consultation.id]?.checked || false}
              participants={selectedConsultations[consultation.id]?.participants || ''}
              onCheckedChange={(checked) => handleConsultationChange(consultation.id, checked)}
              onParticipantsChange={(participants) =>
                handleConsultationParticipantsChange(consultation.id, participants)
              }
              readOnly={readOnly}
            />
          ))}
        </div>
      </div>

      {/* Sticky Footer */}
      {/* Sticky Footer */}
      <StickyFooter>
        <button
          onClick={handleBack}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-border-default dark:border-border-dark text-text-main dark:text-white font-medium hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving || readOnly}
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
