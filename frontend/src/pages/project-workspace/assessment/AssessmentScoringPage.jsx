/**
 * AssessmentScoringPage
 * صفحة تسجيل تأثيرات التقييم البيئي
 */

import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAssessment } from '@/hooks'
import { useLookups } from '@/contexts'
import { calculateTotalScore, calculateTotalImpact } from '@/utils/impactCalculations'
import {
  ImpactCategoryAccordion,
  TotalScoreCard,
  TotalImpactCard,
  ImpactSummarySection,
} from '@/components/assessment'
import { Button, LoadingSpinner, StickyFooter, Modal, useToast } from '@/components/ui'

export default function AssessmentScoringPage() {
  const { projectId } = useParams()
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
      } else {
        // Auto-fill all questions with N/A for new assessment
        const allQuestions = categoriesWithQuestions.flatMap((cat) =>
          cat.questions.map((q) => q.id)
        )
        const defaultScores = {}
        allQuestions.forEach((questionId) => {
          defaultScores[questionId] = {
            level: 'not_applicable',
            note: '',
          }
        })
        setScores(defaultScores)
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

  const handleSaveDraft = async () => {
    if (!assessment?._id) {
      toast.warning('Please complete and save the metadata step first.')
      return
    }
    if (!allQuestionIds.length) {
      toast.warning('Scoring questions are still loading. Please try again.')
      return
    }

    const finalScores = allQuestionIds.map((questionId) => {
      const existingScore = scoresArray.find((s) => s.question === questionId)
      if (existingScore && existingScore.level) {
        return existingScore
      }
      return {
        question: questionId,
        level: 'not_applicable',
        note: '',
      }
    })

    const result = await saveImpactScoresDraft(finalScores, negativeImpact, positiveImpact)
    if (!result.success) {
      toast.error(result.error || 'Failed to save draft. Please try again.')
    }
  }

  const handleSubmit = async () => {
    if (!assessment?._id) {
      toast.warning('Please complete and save the metadata step first.')
      return
    }
    // Validate potential impacts are required
    const validationErrors = {}
    if (!negativeImpact?.trim()) {
      validationErrors.negativeImpact = 'Potential negative impact is required'
    } else if (negativeImpact.trim().length < 20) {
      validationErrors.negativeImpact = 'Please provide at least 20 characters'
    }

    if (!positiveImpact?.trim()) {
      validationErrors.positiveImpact = 'Potential positive impact is required'
    } else if (positiveImpact.trim().length < 20) {
      validationErrors.positiveImpact = 'Please provide at least 20 characters'
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
    // Auto-fill unanswered questions with 'not_applicable'
    const finalScores = allQuestionIds.map((questionId) => {
      const existingScore = scoresArray.find((s) => s.question === questionId)
      if (existingScore && existingScore.level) {
        return existingScore
      }
      // Auto-fill with N/A
      return {
        question: questionId,
        level: 'not_applicable',
        note: '',
      }
    })

    const result = await saveImpactScores(finalScores, negativeImpact, positiveImpact)
    if (!result.success) {
      toast.error(result.error || 'Failed to save scores. Please try again.')
      setShowSubmitModal(false)
      return
    }

    const submitResult = await submitAssessment()
    if (submitResult.success) {
      navigate(`/app/projects/${projectId}/assessment/review`)
    } else {
      toast.error(submitResult.error || 'Failed to submit assessment. Please try again.')
    }
    setShowSubmitModal(false)
  }

  const handleBack = () => {
    navigate(`/app/projects/${projectId}/assessment/methods`)
  }

  // Allow editing when rejected or draft, but not when approved or submitted
  // When rejected, user should be able to edit (rejected is not submitted, so it's editable)
  const readOnly = assessment?.status === 'approved' || assessment?.status === 'submitted'

  if (isLoading || lookupsLoading) {
    return (
      <div className="flex w-full items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-text-secondary dark:text-gray-400 text-sm">Loading scoring...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-main dark:text-white">
          Environmental Impact Assessment Scoring
        </h1>
        <p className="text-text-secondary mt-1">
          Evaluate and score environmental impacts across 8 categories (50 questions total)
        </p>
      </div>

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
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-default dark:border-border-dark shadow-sm p-6 flex flex-col lg:flex-row gap-8 items-stretch mb-6">
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
        <button
          onClick={handleBack}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-border-default dark:border-border-dark text-text-main dark:text-white font-medium hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveDraft}
            disabled={isSaving || readOnly}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-border-default dark:border-border-dark text-text-main dark:text-white font-medium hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <LoadingSpinner size="sm" />
                Saving...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">save</span>
                Save as Draft
              </>
            )}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving || readOnly}
            className="flex items-center justify-center gap-2 rounded-lg h-10 px-5 bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {isSaving ? (
              <>
                <LoadingSpinner size="sm" />
                Submitting...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>Submit Assessment</span>
              </>
            )}
          </button>
        </div>
      </StickyFooter>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Confirm Submission"
        description="Are you sure you want to submit the assessment?"
        sub_description="*Editing will not be possible after submission unless the screening is rejected by an administrator."
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
