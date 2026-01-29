/**
 * AssessmentScoringPage
 * صفحة تسجيل تأثيرات التقييم البيئي
 */

import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAssessment } from '@/hooks'
import {
  ImpactCategoryAccordion,
  TotalScoreCard,
  TotalImpactCard,
  ImpactSummarySection
} from '@/components/assessment'
import { Button, LoadingSpinner } from '@/components/ui'
import { impactCategories } from '@/data/impactQuestions'

export default function AssessmentScoringPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { assessment, impactScores, isLoading, isSaving, saveImpactScores, saveImpactScoresDraft, submitAssessment } = useAssessment(projectId)

  const [scores, setScores] = useState(() => {
    const scoreMap = {}
    if (impactScores && impactScores.length > 0) {
      impactScores.forEach(score => {
        scoreMap[score.question] = {
          level: score.level,
          note: score.note || ''
        }
      })
    }
    return scoreMap
  })

  const [negativeImpact, setNegativeImpact] = useState('')
  const [positiveImpact, setPositiveImpact] = useState('')

  // Update state when assessment data loads
  useEffect(() => {
    if (assessment && !isLoading) {
      setNegativeImpact(assessment.potential_negative_impact || '')
      setPositiveImpact(assessment.potential_positive_impact || '')
      
      // Update scores from impactScores
      if (impactScores && impactScores.length > 0) {
        const scoreMap = {}
        impactScores.forEach(score => {
          scoreMap[score.question] = {
            level: score.level,
            note: score.note || ''
          }
        })
        setScores(scoreMap)
      }
    }
  }, [assessment, impactScores, isLoading])

  const handleScoreChange = (questionId, level) => {
    setScores(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], level, note: prev[questionId]?.note || '' }
    }))
  }

  const handleNoteChange = (questionId, note) => {
    setScores(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], note, level: prev[questionId]?.level || '' }
    }))
  }

  // Convert scores to array format
  const scoresArray = useMemo(() => {
    return Object.entries(scores).map(([question, data]) => ({
      question,
      level: data.level,
      note: data.note
    })).filter(s => s.level) // Only include scores with a level
  }, [scores])

  // Calculate total score
  const totalScore = useMemo(() => {
    const total = { negligible: 0, low: 0, medium: 0, high: 0, not_applicable: 0 }
    scoresArray.forEach(score => {
      if (score.level && total[score.level] !== undefined) {
        total[score.level]++
      }
    })
    return total
  }, [scoresArray])

  // Calculate total impact (with correct priority: high > medium > low > negligible)
  const totalImpact = useMemo(() => {
    // المستويات المرتبة حسب الأولوية (من الأعلى إلى الأدنى)
    const levelsToCheck = ['high', 'medium', 'low', 'negligible']
    const priority = { high: 4, medium: 3, low: 2, negligible: 1 }
    
    // البحث عن أعلى عدد
    let maxCount = -1
    levelsToCheck.forEach(level => {
      if (totalScore[level] > maxCount) {
        maxCount = totalScore[level]
      }
    })
    
    // إذا كانت كل المستويات = 0
    if (maxCount === 0) {
      return totalScore.not_applicable > 0 ? 'not_applicable' : 'negligible'
    }
    
    // في حالة التعادل، اختر الأعلى حسب الأولوية (high > medium > low > negligible)
    // نبحث بالترتيب من high إلى negligible ونأخذ أول مستوى له نفس maxCount
    for (const level of levelsToCheck) {
      if (totalScore[level] === maxCount) {
        return level
      }
    }
    
    return 'negligible'
  }, [totalScore])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const handleSaveDraft = async () => {
    const result = await saveImpactScoresDraft(scoresArray, negativeImpact, positiveImpact)
    if (result.success) {
      // Stay on the same page after saving draft
    }
  }

  const handleSubmit = async () => {
    const result = await saveImpactScores(scoresArray, negativeImpact, positiveImpact)
    if (result.success) {
      // After saving, submit the assessment
      await submitAssessment()
      navigate(`/app/projects/${projectId}/assessment/review`)
    }
  }

  const handleBack = () => {
    navigate(`/app/projects/${projectId}/assessment/methods`)
  }

  // Allow editing when rejected or draft, but not when approved or submitted
  // When rejected, user should be able to edit (rejected is not submitted, so it's editable)
  const readOnly = assessment?.status === 'approved' || assessment?.status === 'submitted'

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
        {impactCategories.map((category) => (
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
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#dbe6df] dark:border-slate-700 shadow-sm p-6 flex flex-col lg:flex-row gap-8 items-stretch mb-6">
        <TotalScoreCard scores={totalScore} />
        <div className="w-px bg-slate-200 dark:bg-slate-700 hidden lg:block"></div>
        <TotalImpactCard impact={totalImpact} />
      </div>

      {/* Impact Summary */}
      <div className="mb-20">
        <ImpactSummarySection
          negativeImpact={negativeImpact}
          positiveImpact={positiveImpact}
          onNegativeChange={setNegativeImpact}
          onPositiveChange={setPositiveImpact}
          readOnly={readOnly}
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
          Back
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveDraft}
            disabled={isSaving || readOnly}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-border-default dark:border-gray-600 text-text-main dark:text-white font-medium hover:bg-background dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="flex items-center justify-center gap-2 rounded-lg h-10 px-5 bg-primary text-white text-sm font-bold hover:bg-[#0eca4e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
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
      </div>
    </div>
  )
}
