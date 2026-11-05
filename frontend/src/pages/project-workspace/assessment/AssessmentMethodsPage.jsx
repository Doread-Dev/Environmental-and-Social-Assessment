/**
 * AssessmentMethodsPage
 * صفحة طرق التقييم والاستشارات المجتمعية
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAssessment, useProjectContext } from '@/hooks'
import { useUnsavedChanges } from '@/contexts'
import { MethodChecklistItem, ConsultationChecklistItem } from '@/components/assessment'
import {
  Alert,
  LoadingSpinner,
  StickyFooter,
  LoadingState,
  PageHeader,
  Button,
} from '@/components/ui'
import { assessmentMethods, consultationMethods } from '@/utils/assessmentMethods'

// The checklists as the page holds them, built from the saved lists
const methodsState = (methods) =>
  Object.fromEntries(
    assessmentMethods.map((method) => {
      const existing = methods.find((m) => m.method_type === method.id)
      return [method.id, { checked: !!existing, details: existing?.details || '' }]
    })
  )
const consultationsState = (consultations) =>
  Object.fromEntries(
    consultationMethods.map((consultation) => {
      const existing = consultations.find((c) => c.type === consultation.id)
      return [consultation.id, { checked: !!existing, participants: existing?.participants || '' }]
    })
  )

export default function AssessmentMethodsPage() {
  const { projectId } = useParams()
  const { can } = useProjectContext()
  const navigate = useNavigate()
  const { methods, consultations, isLoading, isSaving, error, saveMethods, saveConsultations } =
    useAssessment(projectId)
  // Editable only while draft/rejected and for editors (allowed actions from the backend)
  const readOnly = !can('assessment.edit')

  const [selectedMethods, setSelectedMethods] = useState(() => methodsState(methods))
  const [selectedConsultations, setSelectedConsultations] = useState(() =>
    consultationsState(consultations)
  )
  // The checklists as loaded (or last saved): leaving with anything else asks first (D61)
  const [baseline, setBaseline] = useState(() =>
    JSON.stringify([methodsState(methods), consultationsState(consultations)])
  )

  // Update state when methods/consultations load
  useEffect(() => {
    if (!isLoading && methods && consultations) {
      setSelectedMethods(methodsState(methods))
      setSelectedConsultations(consultationsState(consultations))
      setBaseline(JSON.stringify([methodsState(methods), consultationsState(consultations)]))
    }
  }, [methods, consultations, isLoading])

  const isDirty = !readOnly && JSON.stringify([selectedMethods, selectedConsultations]) !== baseline

  // Methods, then consultations: each write carries the version the previous one left (D62), so
  // they go one after the other. The first failure stops and is shown with its reason.
  const save = async () => {
    const methodsData = assessmentMethods
      .filter((m) => selectedMethods[m.id]?.checked)
      .map((m) => ({
        method_type: m.id,
        details: selectedMethods[m.id]?.details || '',
      }))
    const consultationsData = consultationMethods
      .filter((c) => selectedConsultations[c.id]?.checked)
      .map((c) => ({
        type: c.id,
        participants: selectedConsultations[c.id]?.participants || '',
        notes: '', // Empty notes field (not shown in UI but required by backend model)
      }))

    const methodsResult = await saveMethods(methodsData)
    if (!methodsResult.success) return methodsResult
    return saveConsultations(consultationsData)
  }

  const { navigateAway } = useUnsavedChanges(isDirty, save)

  if (isLoading) {
    return <LoadingState message="Loading methods..." />
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
    const result = await save()
    if (result.success) navigateAway(`/app/projects/${projectId}/assessment/scoring`)
  }

  const handleBack = () => {
    navigate(`/app/projects/${projectId}/assessment/metadata`)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        className="mb-8"
        title="Assessment Methods & Consultation"
        description="Document the methods used for environmental assessment and community consultation"
      />

      {/* The save failed: the server's reason (a stale save or an expired session has its own
          dialog and is not repeated here) */}
      {error && (
        <Alert variant="error" className="mb-6" role="alert">
          {error}
        </Alert>
      )}

      {/* Methods Section */}
      <div className="bg-surface dark:bg-surface-dark rounded-xl shadow-sm border border-border-default dark:border-border-dark mb-6">
        <div className="p-6 md:p-8 border-b border-border-default dark:border-border-dark">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary" aria-hidden="true">
                science
              </span>
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
      <div className="bg-surface dark:bg-surface-dark rounded-xl shadow-sm border border-border-default dark:border-border-dark mb-20">
        <div className="p-6 md:p-8 border-b border-border-default dark:border-border-dark">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary" aria-hidden="true">
                groups
              </span>
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
        <Button variant="secondary" onClick={handleBack} disabled={isSaving}>
          <span className="material-symbols-outlined text-sm" aria-hidden="true">
            arrow_back
          </span>
          Back
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
