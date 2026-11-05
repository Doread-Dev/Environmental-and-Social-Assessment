/**
 * AssessmentScoringPage
 * صفحة تسجيل تأثيرات التقييم البيئي
 */

import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAssessment, useProjectContext } from '@/hooks'
import { useLookups } from '@/hooks'
import { useUnsavedChanges } from '@/contexts'
import {
  calculateTotalScore,
  calculateTotalImpact,
  changedQuestionsSummary,
} from '@/utils/impactCalculations'
import { assessmentSubmitError } from '@/utils/validators'
import {
  ImpactCategoryAccordion,
  TotalScoreCard,
  TotalImpactCard,
  ImpactSummarySection,
} from '@/components/assessment'
import {
  Button,
  LoadingSpinner,
  StickyFooter,
  Modal,
  useToast,
  LoadingState,
  PageHeader,
} from '@/components/ui'

// Scores (by question) and the two impact texts as one comparable string
function snapshot(scores, negativeImpact, positiveImpact) {
  const ordered = Object.keys(scores)
    .sort()
    .map((question) => [question, scores[question]?.level ?? '', scores[question]?.note ?? ''])
  return JSON.stringify([ordered, negativeImpact, positiveImpact])
}

export default function AssessmentScoringPage() {
  const { projectId } = useParams()
  const { can } = useProjectContext()
  const navigate = useNavigate()
  const { categoriesWithQuestions, isLoading: lookupsLoading } = useLookups()
  const {
    assessment,
    impactScores,
    isLoading,
    isSaving,
    saveImpactScores,
    saveImpactScoresDraft,
    submitAssessment,
  } = useAssessment(projectId)

  const [scores, setScores] = useState(() => {
    const scoreMap = {}
    if (impactScores && impactScores.length > 0) {
      impactScores.forEach((score) => {
        scoreMap[score.question] = {
          level: score.level,
          note: score.note || '',
        }
      })
    }
    return scoreMap
  })

  const [negativeImpact, setNegativeImpact] = useState('')
  const [positiveImpact, setPositiveImpact] = useState('')
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  // Scores and impacts as loaded (or last saved): leaving with anything else asks first (D61)
  const [baseline, setBaseline] = useState(null)
  const toast = useToast()

  // Update state when assessment data loads
  useEffect(() => {
    if (assessment && !isLoading) {
      setNegativeImpact(assessment.potential_negative_impact || '')
      setPositiveImpact(assessment.potential_positive_impact || '')

      // Update scores from impactScores
      if (impactScores && impactScores.length > 0) {
        const scoreMap = {}
        impactScores.forEach((score) => {
          const questionId =
            score?.question && typeof score.question === 'object'
              ? score.question._id
              : score.question
          scoreMap[questionId] = {
            level: score.level,
            note: score.note || '',
          }
        })
        setScores(scoreMap)
        setBaseline(
          snapshot(
            scoreMap,
            assessment.potential_negative_impact || '',
            assessment.potential_positive_impact || ''
          )
        )
      } else {
        // Same default as the backend: every question starts as Negligible (D54)
        const allQuestions = categoriesWithQuestions.flatMap((cat) =>
          cat.questions.map((q) => q.id)
        )
        const defaultScores = {}
        allQuestions.forEach((questionId) => {
          defaultScores[questionId] = {
            level: 'negligible',
            note: '',
          }
        })
        setScores(defaultScores)
        setBaseline(
          snapshot(
            defaultScores,
            assessment.potential_negative_impact || '',
            assessment.potential_positive_impact || ''
          )
        )
      }
    }
  }, [assessment, impactScores, isLoading, categoriesWithQuestions])

  const handleScoreChange = (questionId, level) => {
    setScores((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], level, note: prev[questionId]?.note || '' },
    }))
  }

  const handleNoteChange = (questionId, note) => {
    setScores((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], note, level: prev[questionId]?.level || '' },
    }))
  }

  // Convert scores to array format
  const scoresArray = useMemo(() => {
    return Object.entries(scores)
      .map(([question, data]) => ({
        question,
        level: data.level,
        note: data.note,
      }))
      .filter((s) => s.level) // Only include scores with a level
  }, [scores])

  // Calculate total score using utility function
  const totalScore = useMemo(() => calculateTotalScore(scoresArray), [scoresArray])

  // Calculate total impact using priority-based utility function
  const totalImpact = useMemo(() => calculateTotalImpact(totalScore), [totalScore])

  // Validation errors state
  const [errors, setErrors] = useState({})

  // Get all question IDs from impact categories
  const allQuestionIds = useMemo(() => {
    return categoriesWithQuestions.flatMap((cat) => cat.questions.map((q) => q.id))
  }, [categoriesWithQuestions])

  const readOnly = !can('assessment.edit')
  const isDirty =
    !readOnly && baseline !== null && snapshot(scores, negativeImpact, positiveImpact) !== baseline

  const handleSaveDraft = async () => {
    if (!assessment?._id) {
      toast.warning('Please complete and save the metadata step first.')
      return { success: false }
    }
    if (!allQuestionIds.length) {
      toast.warning('Scoring questions are still loading. Please try again.')
      return { success: false }
    }

    const finalScores = allQuestionIds.map((questionId) => {
      const existingScore = scoresArray.find((s) => s.question === questionId)
      if (existingScore && existingScore.level) {
        return existingScore
      }
      return {
        question: questionId,
        level: 'negligible',
        note: '',
      }
    })

    const result = await saveImpactScoresDraft(finalScores, negativeImpact, positiveImpact)
    if (result.success) {
      setBaseline(snapshot(scores, negativeImpact, positiveImpact))
    } else if (!result.handled) {
      // A stale save or an expired session is shown by its own dialog (D73)
      toast.error(result.error || 'Failed to save draft. Please try again.')
    }
    return result
  }

  // Leaving with changes asks Save / Discard / Stay (D61); "Save" saves the draft.
  const { navigateAway } = useUnsavedChanges(isDirty, handleSaveDraft)

  const handleSubmit = async () => {
    if (!assessment?._id) {
      toast.warning('Please complete and save the metadata step first.')
      return
    }
    // The metadata a submit needs (D74 2), worded like the backend's answer
    const metadataError = assessmentSubmitError(assessment)
    if (metadataError) {
      toast.error(metadataError)
      return
    }
    // Validate potential impacts are required
    const validationErrors = {}
    if (!negativeImpact?.trim()) {
      validationErrors.negativeImpact = 'Potential negative impact is required'
    }

    if (!positiveImpact?.trim()) {
      validationErrors.positiveImpact = 'Potential positive impact is required'
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setShowSubmitModal(true)
  }

  const handleConfirmSubmit = async () => {
    if (!allQuestionIds.length) {
      toast.warning('Scoring questions are still loading. Please try again.')
      setShowSubmitModal(false)
      return
    }
    // Unanswered questions keep the backend default, Negligible (D54)
    const finalScores = allQuestionIds.map((questionId) => {
      const existingScore = scoresArray.find((s) => s.question === questionId)
      if (existingScore && existingScore.level) {
        return existingScore
      }
      // Auto-fill with N/A
      return {
        question: questionId,
        level: 'negligible',
        note: '',
      }
    })

    const result = await saveImpactScores(finalScores, negativeImpact, positiveImpact)
    if (!result.success) {
      if (!result.handled) toast.error(result.error || 'Failed to save scores. Please try again.')
      setShowSubmitModal(false)
      return
    }
    setBaseline(snapshot(scores, negativeImpact, positiveImpact))

    const submitResult = await submitAssessment()
    if (submitResult.success) {
      navigateAway(`/app/projects/${projectId}/assessment/review`)
    } else if (!submitResult.handled) {
      toast.error(submitResult.error || 'Failed to submit assessment. Please try again.')
    }
    setShowSubmitModal(false)
  }

  const handleBack = () => {
    navigate(`/app/projects/${projectId}/assessment/methods`)
  }

  if (isLoading || lookupsLoading) {
    return <LoadingState message="Loading scoring..." />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        className="mb-8"
        title="Environmental Impact Assessment Scoring"
        description="Evaluate and score environmental impacts across 8 categories (50 questions total)"
      />

      {/* Impact Categories */}
      <div className="space-y-4 mb-6">
        {categoriesWithQuestions.map((category) => (
          <ImpactCategoryAccordion
            key={category.id}
            category={category}
            scores={scoresArray}
            onScoreChange={handleScoreChange}
            onNoteChange={handleNoteChange}
            defaultOpen={false}
            readOnly={readOnly}
          />
        ))}
      </div>

      {/* Total Score & Impact Cards */}
      <div className="bg-surface dark:bg-surface-dark rounded-xl border border-border-default dark:border-border-dark shadow-sm p-6 flex flex-col lg:flex-row gap-8 items-stretch mb-6">
        <TotalScoreCard scores={totalScore} />
        <div className="w-px bg-border-default dark:bg-border-dark hidden lg:block"></div>
        <TotalImpactCard impact={totalImpact} />
      </div>

      {/* Impact Summary */}
      <div className="mb-20">
        <ImpactSummarySection
          negativeImpact={negativeImpact}
          positiveImpact={positiveImpact}
          onNegativeChange={(val) => {
            setNegativeImpact(val)
            if (errors.negativeImpact) setErrors((prev) => ({ ...prev, negativeImpact: null }))
          }}
          onPositiveChange={(val) => {
            setPositiveImpact(val)
            if (errors.positiveImpact) setErrors((prev) => ({ ...prev, positiveImpact: null }))
          }}
          readOnly={readOnly}
          errors={errors}
        />
      </div>

      {/* Sticky Footer */}
      <StickyFooter>
        <Button variant="secondary" onClick={handleBack} disabled={isSaving}>
          <span className="material-symbols-outlined text-sm" aria-hidden="true">
            arrow_back
          </span>
          Back
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handleSaveDraft} disabled={isSaving || readOnly}>
            {isSaving ? (
              <>
                <LoadingSpinner size="sm" />
                Saving...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm" aria-hidden="true">
                  save
                </span>
                Save as Draft
              </>
            )}
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSaving || readOnly}>
            {isSaving ? (
              <>
                <LoadingSpinner size="sm" />
                Submitting...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  check_circle
                </span>
                <span>Submit Assessment</span>
              </>
            )}
          </Button>
        </div>
      </StickyFooter>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Confirm Submission"
        description={`${changedQuestionsSummary(allQuestionIds, scoresArray)} Submit the assessment?`}
        sub_description="*Editing will not be possible after submission unless the assessment is rejected by a reviewer."
      >
        <Modal.Footer>
          <Button variant="outline" onClick={() => setShowSubmitModal(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleConfirmSubmit} isLoading={isSaving} disabled={isSaving}>
            Confirm Submit
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
