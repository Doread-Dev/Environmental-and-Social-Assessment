/**
 * AssessmentReviewPage
 * صفحة مراجعة واعتماد التقييم
 * مطابق للتصميم الأصلي حرفياً
 */

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAssessment, useScreening, useProjectContext } from '@/hooks'
import { useLookups, useAuth, ROLE_LABELS, IMPACT_LEVEL_CONFIG } from '@/contexts'
import { Button, Textarea, useToast } from '@/components/ui'
import { cn } from '@/utils/cn'
import { formatDateRange } from '@/utils/formatters'
import { getCategoryHighestLevel } from '@/utils/impactCalculations'
import { assessmentMethods, consultationMethods } from '@/utils/assessmentMethods'
export default function AssessmentReviewPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { project } = useProjectContext()
  const { categoriesWithQuestions, isLoading: lookupsLoading } = useLookups()
  const { user, canApprove } = useAuth()
  const { screening } = useScreening(projectId)
  const {
    assessment,
    methods,
    consultations,
    impactScores,
    isLoading,
    isSaving,
    approveAssessment,
    rejectAssessment,
  } = useAssessment(projectId)

  const toast = useToast()
  const [recommendations, setRecommendations] = useState(assessment?.recommendations || '')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [rejectReasonInput, setRejectReasonInput] = useState('')

  // Export handler - must be defined before any conditional returns
  const handleExport = useCallback(async () => {
    try {
      const { exportAssessmentToExcel } = await import('@/utils/excelExport')
      await exportAssessmentToExcel(
        project,
        screening,
        assessment,
        methods,
        consultations,
        impactScores,
        categoriesWithQuestions
      )
      toast.success('Excel file downloaded successfully!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export Excel file')
    }
  }, [project, screening, assessment, methods, consultations, impactScores, categoriesWithQuestions, toast])

  // Expose export handler to parent layout via custom event
  useEffect(() => {
    const status = assessment?.status || 'draft'
    if (status === 'submitted' || status === 'approved' || status === 'rejected') {
      const handleExportEvent = () => {
        handleExport()
      }
      window.addEventListener('assessment-export', handleExportEvent)
      return () => {
        window.removeEventListener('assessment-export', handleExportEvent)
      }
    }
  }, [assessment?.status, handleExport])

  // Calculate total score from impactScores directly (real-time calculation)
  const totalScore = useMemo(() => {
    const score = {
      negligible: 0,
      low: 0,
      medium: 0,
      high: 0,
      not_applicable: 0,
    }

    impactScores.forEach((s) => {
      if (s.level && score[s.level] !== undefined) {
        score[s.level]++
      }
    })

    return score
  }, [impactScores])

  // Calculate total project impact using priority-based algorithm (editPlan3)
  const calculatedTotalImpact = useMemo(() => {
    const priorityLevels = ['high', 'medium', 'low', 'negligible', 'not applicable']

    for (const level of priorityLevels) {
      if (totalScore[level] > 0) {
        return level
      }
    }

    return 'not applicable'
  }, [totalScore])

  // Calculate percentages for progress bars
  const totalAnswered =
    totalScore.negligible +
    totalScore.low +
    totalScore.medium +
    totalScore.high +
    totalScore.not_applicable
  const negligiblePercent = totalAnswered > 0 ? (totalScore.negligible / totalAnswered) * 100 : 0
  const lowPercent = totalAnswered > 0 ? (totalScore.low / totalAnswered) * 100 : 0
  const mediumPercent = totalAnswered > 0 ? (totalScore.medium / totalAnswered) * 100 : 0
  const highPercent = totalAnswered > 0 ? (totalScore.high / totalAnswered) * 100 : 0
  const notApplicablePercent =
    totalAnswered > 0 ? (totalScore.not_applicable / totalAnswered) * 100 : 0

  // Impact messages based on level
  const impactMessages = {
    negligible: 'Minimal environmental impact expected',
    low: 'Low environmental impact expected',
    medium: 'Moderate environmental impact expected',
    high: 'Requires immediate mitigation plan',
    'not applicable': 'Not applicable to this project',
  }

  const officer =
    assessment?.officer && typeof assessment.officer === 'object' ? assessment.officer : null
  const approver =
    assessment?.approved_by && typeof assessment.approved_by === 'object'
      ? assessment.approved_by
      : null
  const rejector =
    assessment?.reject_by && typeof assessment.reject_by === 'object' ? assessment.reject_by : null

  if (isLoading || lookupsLoading) {
    return (
      <div className="flex w-full items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-text-secondary dark:text-gray-400 text-sm">Loading review...</p>
        </div>
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-default dark:border-border-dark p-8 text-center">
          <p className="text-text-secondary">No assessment found</p>
          <Button
            onClick={() => navigate(`/app/projects/${projectId}/assessment`)}
            className="mt-4"
          >
            Go to Assessment Gateway
          </Button>
        </div>
      </div>
    )
  }

  const handleApprove = async () => {
    if (!recommendations.trim()) {
      toast.warning('Please provide recommendations before approving')
      return
    }
    const result = await approveAssessment(recommendations)
    if (result.success) {
      // Stay on the same page to show approved status
    }
  }

  const handleRejectClick = () => {
    setShowRejectInput(true)
  }

  const handleConfirmReject = async () => {
    const result = await rejectAssessment(rejectReasonInput)
    if (result.success) {
      setShowRejectInput(false)
      setRejectReasonInput('')
      // Stay on the same page to show rejected status
    }
  }

  const handleCancelReject = () => {
    setShowRejectInput(false)
    setRejectReasonInput('')
  }

  const handleEdit = () => {
    navigate(`/app/projects/${projectId}/assessment/metadata`)
  }

  const handleProceedToSemp = () => {
    navigate(`/app/projects/${projectId}/semp`)
  }

  const canApproveAssessment = canApprove && assessment?.status === 'submitted'

  // Status badge config
  const statusConfig = {
    draft: {
      label: 'Draft',
      className:
        'bg-gray-50/50 text-text-main dark:bg-white/5 dark:text-gray-300 border-border-default dark:border-border-dark',
    },
    submitted: {
      label: 'Pending Approval',
      className:
        'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 border-amber-200 dark:border-amber-800',
    },
    approved: {
      label: 'Approved',
      className:
        'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200 border-green-200 dark:border-green-800',
    },
    rejected: {
      label: 'Rejected',
      className:
        'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200 border-red-200 dark:border-red-800',
    },
  }

  const status = statusConfig[assessment.status] || statusConfig.draft

  // Get method labels
  const getMethodLabel = (methodType) => {
    const method = assessmentMethods.find((m) => m.id === methodType)
    return method?.label || methodType
  }

  // Get consultation labels
  const getConsultationLabel = (consultationType) => {
    const consultation = consultationMethods.find((c) => c.id === consultationType)
    return consultation?.label || consultationType
  }

  return (
    <div className="p-4 md:p-8 max-w-[1000px] mx-auto">
      {/* Main Card */}
      <div className="bg-white dark:bg-[#1a2e22] shadow-sm rounded-xl min-h-full flex flex-col border border-border-default dark:border-border-dark overflow-hidden mb-10">
        {/* Header */}
        <header className="p-8 pb-6 border-b border-border-default dark:border-border-dark">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-text-main dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-tight">
                Environmental Assessment
              </h1>
              <p className="text-text-secondary text-lg font-normal">Review & Approval Stage</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className={cn(
                  'inline-flex items-center justify-center px-4 py-1.5 rounded-full text-sm font-bold border',
                  status.className
                )}
              >
                {assessment.status === 'submitted' && (
                  <span className="size-2 rounded-full bg-amber-500 mr-2 animate-pulse"></span>
                )}
                {status.label}
              </span>
            </div>
          </div>
        </header>

        {/* Project & Officer Information */}
        <section className="p-8 border-b border-border-default dark:border-border-dark">
          <h3 className="text-text-main dark:text-white text-lg font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">badge</span>
            Project & Officer Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="flex flex-col gap-1">
              <p className="text-text-secondary text-xs font-bold uppercase tracking-wider">
                Officer Name
              </p>
              <p className="text-text-main dark:text-gray-200 text-sm font-medium">
                {officer?.name || 'N/A'}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-text-secondary text-xs font-bold uppercase tracking-wider">
                Officer Position
              </p>
              <p className="text-text-main dark:text-gray-200 text-sm font-medium">
                {officer?.job_title?.title_name ||
                  (officer?.role ? ROLE_LABELS[officer.role] : null) ||
                  'N/A'}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-text-secondary text-xs font-bold uppercase tracking-wider">
                Activity Title
              </p>
              <p className="text-text-main dark:text-gray-200 text-sm font-medium">
                {assessment.project_activity || 'N/A'}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-text-secondary text-xs font-bold uppercase tracking-wider">
                Location
              </p>
              <p className="text-text-main dark:text-gray-200 text-sm font-medium">
                {project?.location || 'N/A'}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-text-secondary text-xs font-bold uppercase tracking-wider">
                Activity Timeline
              </p>
              <p className="text-text-main dark:text-gray-200 text-sm font-medium">
                {project?.start_date && project?.end_date
                  ? formatDateRange(project.start_date, project.end_date)
                  : 'N/A'}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-text-secondary text-xs font-bold uppercase tracking-wider">
                Screening Category
              </p>
              <div className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 text-xs font-bold px-2 py-0.5 rounded">
                  Category {screening?.category_code || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Project Description */}
        <section className="p-8 border-b border-border-default dark:border-border-dark bg-gray-50/50 dark:bg-white/5">
          <h3 className="text-text-main dark:text-white text-lg font-bold mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">info</span>
            Project Description
          </h3>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
              <p className="text-text-secondary text-sm font-medium">Component Assessed</p>
              <p className="text-text-main dark:text-gray-200 text-sm leading-relaxed">
                {assessment.project_activity || 'N/A'}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
              <p className="text-text-secondary text-sm font-medium">Brief Description</p>
              <p className="text-text-main dark:text-gray-200 text-sm leading-relaxed">
                {assessment.description || 'N/A'}
              </p>
            </div>
            {assessment.environmental_setting && (
              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
                <p className="text-text-secondary text-sm font-medium">Environmental Setting</p>
                <p className="text-text-main dark:text-gray-200 text-sm leading-relaxed">
                  {assessment.environmental_setting}
                </p>
              </div>
            )}
            {assessment.legal_requirements && (
              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
                <p className="text-text-secondary text-sm font-medium">Compliance Approach</p>
                <p className="text-text-main dark:text-gray-200 text-sm leading-relaxed">
                  {assessment.legal_requirements}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Methods & Consultation */}
        <section className="p-8 border-b border-border-default dark:border-border-dark">
          <h3 className="text-text-main dark:text-white text-lg font-bold mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">groups</span>
            Methods & Consultation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Assessment Methods */}
            <div>
              <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-3">
                Assessment Methods Used
              </p>
              <ul className="flex flex-col gap-4">
                {methods.length > 0 ? (
                  methods.map((method, idx) => (
                    <li key={idx} className="flex flex-col gap-2">
                      <div className="flex items-center gap-3 text-sm text-text-main dark:text-gray-200">
                        <span
                          className="material-symbols-outlined text-primary"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          check_box
                        </span>
                        {getMethodLabel(method.method_type)}
                      </div>
                      {method.details && (
                        <input
                          className="ml-9 w-[calc(100%-2.25rem)] bg-gray-50/50 dark:bg-white/5 border border-border-default dark:border-border-dark rounded px-3 py-1.5 text-xs text-text-main dark:text-gray-200 focus:outline-none cursor-default"
                          readOnly
                          type="text"
                          value={method.details}
                        />
                      )}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-text-secondary">No methods recorded</li>
                )}
              </ul>
            </div>

            {/* Consultations */}
            <div>
              <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-3">
                Consultations Conducted
              </p>
              <ul className="flex flex-col gap-4">
                {consultations.length > 0 ? (
                  consultations.map((consultation, idx) => (
                    <li key={idx} className="flex flex-col gap-2">
                      <div className="flex items-center gap-3 text-sm text-text-main dark:text-gray-200">
                        <span
                          className="material-symbols-outlined text-primary"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          check_box
                        </span>
                        <span className="font-medium">
                          {getConsultationLabel(consultation.type)}
                        </span>
                      </div>
                      {consultation.participants && (
                        <input
                          className="ml-9 w-[calc(100%-2.25rem)] bg-gray-50/50 dark:bg-white/5 border border-border-default dark:border-border-dark rounded px-3 py-1.5 text-xs text-text-main dark:text-gray-200 focus:outline-none cursor-default"
                          readOnly
                          type="text"
                          value={consultation.participants}
                        />
                      )}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-text-secondary">No consultations recorded</li>
                )}
              </ul>
            </div>
          </div>
        </section>

        {/* Detailed Impact Assessment */}
        <section className="p-8 border-b border-border-default dark:border-border-dark">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-text-main dark:text-white text-lg font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">analytics</span>
              Detailed Impact Assessment
            </h3>
            <span className="text-xs text-text-secondary bg-gray-50 dark:bg-white/5 px-3 py-1 rounded-full border border-border-default dark:border-border-dark">
              Read Only Mode
            </span>
          </div>

          {/* Impact Categories */}
          <div className="space-y-8">
            {categoriesWithQuestions.map((category) => {
              const highestLevel = getCategoryHighestLevel(impactScores, category.questions)
              const config = IMPACT_LEVEL_CONFIG[highestLevel]

              // Check if all questions are negligible or not_applicable
              const allNegligibleOrNA = category.questions.every((q) => {
                const score = impactScores.find((s) => s.question === q.id)
                return !score || score.level === 'negligible' || score.level === 'not_applicable'
              })

              return (
                <div
                  key={category.id}
                  className="mb-8 border border-border-default dark:border-border-dark rounded-lg overflow-hidden"
                >
                  {/* Category Header */}
                  <div className="bg-gray-50/50 dark:bg-white/5 px-4 py-3 flex justify-between items-center border-b border-border-default dark:border-border-dark">
                    <h4 className="font-bold text-text-main dark:text-white text-sm">
                      {category.code}. {category.name}
                    </h4>
                    <span
                      className={cn(
                        'text-xs font-bold px-2 py-0.5 rounded border',
                        config?.bgClass || 'bg-gray-200 dark:bg-white/5',
                        config?.textClass || 'text-gray-700 dark:text-gray-300',
                        config?.textClass?.includes('yellow') &&
                          'border-yellow-200 dark:border-yellow-900/40',
                        config?.textClass?.includes('orange') &&
                          'border-orange-200 dark:border-orange-900/40',
                        config?.textClass?.includes('gray') &&
                          'border-border-default dark:border-border-dark'
                      )}
                    >
                      {config?.label || 'Negligible'}
                    </span>
                  </div>

                  {/* Questions */}
                  {allNegligibleOrNA ? (
                    <div className="p-4 bg-white dark:bg-[#1a2e22] text-center text-sm text-text-secondary italic">
                      All questions marked as Negligible or Not Applicable. No issues identified.
                    </div>
                  ) : (
                    <div className="divide-y divide-border-default dark:divide-border-dark">
                      {category.questions.map((question, qIdx) => {
                        const questionScore = impactScores.find((s) => s.question === question.id)
                        const scoreConfig = questionScore?.level
                          ? IMPACT_LEVEL_CONFIG[questionScore.level]
                          : null

                        return (
                          <div
                            key={question.id}
                            className={cn(
                              'grid grid-cols-1 md:grid-cols-[1fr_150px_1fr] gap-4 p-4',
                              qIdx % 2 === 0
                                ? 'bg-white dark:bg-[#1a2e22]'
                                : 'bg-gray-50/50 dark:bg-white/5'
                            )}
                          >
                            <p className="text-sm text-text-main dark:text-gray-200">
                              {question.question}
                            </p>
                            <div>
                              {questionScore?.level ? (
                                <span
                                  className={cn(
                                    'inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium',
                                    scoreConfig?.bgClass || 'bg-gray-100 dark:bg-white/5',
                                    scoreConfig?.textClass || 'text-gray-600 dark:text-gray-400'
                                  )}
                                >
                                  {scoreConfig?.label || questionScore.level}
                                </span>
                              ) : (
                                <span className="text-xs text-text-secondary">Not Set</span>
                              )}
                            </div>
                            <p className="text-xs text-text-secondary">
                              {questionScore?.note || '-'}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Overall Assessment Results */}
        <section className="p-8 bg-gray-50/50 dark:bg-white/5 border-b border-border-default dark:border-border-dark">
          <h3 className="text-text-main dark:text-white text-lg font-bold mb-6 text-center">
            Overall Assessment Results
          </h3>
          <div className="flex flex-col md:flex-row justify-center items-stretch gap-6">
            {/* Total Project Score */}
            <div className="bg-white dark:bg-[#1a2e22] rounded-xl p-6 shadow-sm border border-border-default dark:border-border-dark flex-1 flex flex-col items-center justify-start text-center max-w-sm">
              <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2">
                Total Project Score
              </p>
              <div className="w-full space-y-2.5 bg-gray-50/50 dark:bg-white/5 p-4 rounded-lg">
                {/* Not Applicable */}
                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-gray-600 dark:text-gray-500 font-medium">
                    Not Applicable
                  </span>
                  <span className="font-bold text-text-main dark:text-white">
                    {totalScore.not_applicable} pts
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 dark:bg-border-dark rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-300 dark:bg-gray-600"
                    style={{ width: `${notApplicablePercent}%` }}
                  ></div>
                </div>

                {/* Negligible Impact */}
                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-gray-700 dark:text-gray-400 font-medium">
                    Negligible Impact
                  </span>
                  <span className="font-bold text-text-main dark:text-white">
                    {totalScore.negligible} pts
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 dark:bg-border-dark rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-400"
                    style={{ width: `${negligiblePercent}%` }}
                  ></div>
                </div>

                {/* Low Impact */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-green-700 dark:text-green-500 font-medium">Low Impact</span>
                  <span className="font-bold text-text-main dark:text-white">
                    {totalScore.low} pts
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 dark:bg-border-dark rounded-full overflow-hidden">
                  <div className="h-full bg-green-400" style={{ width: `${lowPercent}%` }}></div>
                </div>

                {/* Medium Impact */}
                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-orange-700 dark:text-orange-500 font-medium">
                    Medium Impact
                  </span>
                  <span className="font-bold text-text-main dark:text-white">
                    {totalScore.medium} pts
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 dark:bg-border-dark rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-400"
                    style={{ width: `${mediumPercent}%` }}
                  ></div>
                </div>

                {/* High Impact */}
                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-red-700 dark:text-red-500 font-medium">High Impact</span>
                  <span className="font-bold text-text-main dark:text-white">
                    {totalScore.high} pts
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 dark:bg-border-dark rounded-full overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: `${highPercent}%` }}></div>
                </div>
              </div>
            </div>

            {/* Total Project Impact */}
            <div className="bg-white dark:bg-[#1a2e22] rounded-xl p-6 shadow-sm border border-border-default dark:border-border-dark flex-1 flex flex-col items-center justify-center text-center max-w-sm relative overflow-hidden">
              <div
                className={cn(
                  'absolute top-0 left-0 w-full h-1.5',
                  calculatedTotalImpact === 'high'
                    ? 'bg-red-500'
                    : calculatedTotalImpact === 'medium'
                      ? 'bg-orange-500'
                      : calculatedTotalImpact === 'low'
                        ? 'bg-green-400'
                        : 'bg-gray-400'
                )}
              ></div>
              <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-4">
                Total Project Impact
              </p>
              <div
                className={cn(
                  'text-4xl font-black mb-3 tracking-tight',
                  calculatedTotalImpact === 'high'
                    ? 'text-red-600 dark:text-red-400'
                    : calculatedTotalImpact === 'medium'
                      ? 'text-orange-600 dark:text-orange-400'
                      : calculatedTotalImpact === 'low'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-600 dark:text-gray-400'
                )}
              >
                {calculatedTotalImpact?.toUpperCase() || 'N/A'}
              </div>
              <p className="text-xs text-text-secondary max-w-[200px]">
                {impactMessages[calculatedTotalImpact] || 'Impact assessment in progress'}
              </p>
            </div>
          </div>
        </section>

        {/* Potential Impacts Summary */}
        <section className="p-8 border-b border-border-default dark:border-border-dark">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Negative Impact */}
            {assessment.potential_negative_impact && (
              <div className="p-5 rounded-lg border border-red-100 bg-red-50/50 dark:bg-red-900/10 dark:border-red-900/30">
                <h4 className="text-red-800 dark:text-red-200 font-bold mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-600 dark:text-red-400">
                    warning
                  </span>
                  Potential Negative Impacts
                </h4>
                <p className="text-sm text-text-main dark:text-gray-300 leading-relaxed">
                  {assessment.potential_negative_impact}
                </p>
              </div>
            )}

            {/* Positive Impact */}
            {assessment.potential_positive_impact && (
              <div className="p-5 rounded-lg border border-green-100 bg-green-50/50 dark:bg-green-900/10 dark:border-green-900/30">
                <h4 className="text-green-800 dark:text-green-200 font-bold mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-600 dark:text-green-400">
                    eco
                  </span>
                  Potential Positive Impacts
                </h4>
                <p className="text-sm text-text-main dark:text-gray-300 leading-relaxed">
                  {assessment.potential_positive_impact}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Approval & Recommendations */}
        <section className="p-8 bg-gray-50/50 dark:bg-white/5">
          <div className="bg-white dark:bg-[#1a2e22] rounded-xl border border-border-default dark:border-border-dark shadow-sm p-6 md:p-8">
            <h3 className="text-text-main dark:text-white text-xl font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">verified_user</span>
              Approval & Recommendations
            </h3>

            {/* Approved/Rejected Status */}
            {assessment.status === 'approved' && approver && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex flex-col gap-2">
                  <label className="text-text-secondary text-xs font-bold uppercase tracking-wider">
                    Approved By
                  </label>
                  <input
                    className="w-full bg-gray-50/50 dark:bg-white/5 border border-border-default dark:border-border-dark rounded-lg px-4 py-2.5 text-text-main dark:text-white text-sm focus:outline-none cursor-not-allowed font-medium"
                    readOnly
                    type="text"
                    value={approver.name}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-text-secondary text-xs font-bold uppercase tracking-wider">
                    Position
                  </label>
                  <input
                    className="w-full bg-gray-50/50 dark:bg-white/5 border border-border-default dark:border-border-dark rounded-lg px-4 py-2.5 text-text-main dark:text-white text-sm focus:outline-none cursor-not-allowed font-medium"
                    readOnly
                    type="text"
                    value={
                      approver.job_title?.title_name ||
                      (approver.role ? ROLE_LABELS[approver.role] : null) ||
                      'N/A'
                    }
                  />
                </div>
              </div>
            )}

            {assessment.status === 'rejected' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-text-secondary text-xs font-bold uppercase tracking-wider">
                      Rejected By
                    </label>
                    <input
                      className="w-full bg-gray-50/50 dark:bg-white/5 border border-border-default dark:border-border-dark rounded-lg px-4 py-2.5 text-text-main dark:text-white text-sm focus:outline-none cursor-not-allowed font-medium"
                      readOnly
                      type="text"
                      value={rejector?.name || 'N/A'}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-text-secondary text-xs font-bold uppercase tracking-wider">
                      Position
                    </label>
                    <input
                      className="w-full bg-gray-50/50 dark:bg-white/5 border border-border-default dark:border-border-dark rounded-lg px-4 py-2.5 text-text-main dark:text-white text-sm focus:outline-none cursor-not-allowed font-medium"
                      readOnly
                      type="text"
                      value={
                        rejector?.job_title?.title_name ||
                        (rejector?.role ? ROLE_LABELS[rejector.role] : null) ||
                        'N/A'
                      }
                    />
                  </div>
                </div>
                {assessment.reject_reason && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
                      Reason for Rejection:
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-400 whitespace-pre-wrap">
                      {assessment.reject_reason}
                    </p>
                  </div>
                )}
                <div className="flex justify-end gap-4 pt-4 border-t border-border-default dark:border-border-dark">
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-md transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">edit</span>
                    Edit Assessment
                  </button>
                </div>
              </>
            )}

            {/* Recommendations Textarea */}
            {assessment.status === 'submitted' && canApproveAssessment && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-text-secondary text-xs font-bold uppercase tracking-wider">
                      Approved By
                    </label>
                    <input
                      className="w-full bg-gray-50/50 dark:bg-white/5 border border-border-default dark:border-border-dark rounded-lg px-4 py-2.5 text-text-main dark:text-white text-sm focus:outline-none cursor-not-allowed font-medium"
                      readOnly
                      type="text"
                      value={user?.name || 'N/A'}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-text-secondary text-xs font-bold uppercase tracking-wider">
                      Position
                    </label>
                    <input
                      className="w-full bg-gray-50/50 dark:bg-white/5 border border-border-default dark:border-border-dark rounded-lg px-4 py-2.5 text-text-main dark:text-white text-sm focus:outline-none cursor-not-allowed font-medium"
                      readOnly
                      type="text"
                      value={
                        user?.job_title?.title_name ||
                        (user?.role ? ROLE_LABELS[user.role] : null) ||
                        'N/A'
                      }
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 mb-8">
                  <label
                    className="text-text-main dark:text-white text-sm font-bold"
                    htmlFor="recommendations"
                  >
                    Reviewer Recommendations <span className="text-red-500 font-normal">*</span>
                    <span className="text-text-secondary font-normal">
                      {' '}
                      (Required for approval)
                    </span>
                  </label>
                  <Textarea
                    id="recommendations"
                    value={recommendations}
                    onChange={(e) => setRecommendations(e.target.value)}
                    placeholder="Enter specific conditions, monitoring requirements, or recommendations..."
                    rows={4}
                    className={cn(
                      'text-sm',
                      !recommendations.trim() &&
                        'border-red-300 focus:border-red-500 focus:ring-red-500'
                    )}
                  />
                  {!recommendations.trim() && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">error</span>
                      Recommendations are required to approve the assessment
                    </p>
                  )}
                </div>
                {/* Reject Reason Input (shown when rejecting) */}
                {showRejectInput && (
                  <div className="space-y-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800 mb-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-red-600 dark:text-red-400 text-sm font-bold">
                        Reason for Rejection
                      </label>
                      <Textarea
                        value={rejectReasonInput}
                        onChange={(e) => setRejectReasonInput(e.target.value)}
                        placeholder="Please provide a reason for rejecting this assessment..."
                        rows={3}
                        className="text-sm"
                      />
                      <p className="text-xs text-text-secondary">
                        Explain why this assessment is being rejected (optional but recommended)
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleCancelReject}
                        disabled={isSaving}
                        className="flex-1 px-6 py-2.5 rounded-lg border border-border-default dark:border-border-dark hover:bg-gray-50/50 dark:hover:bg-white/5 text-text-main dark:text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-lg">close</span>
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmReject}
                        disabled={isSaving}
                        className="flex-1 px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-lg">check</span>
                        {isSaving ? 'Rejecting...' : 'Confirm Rejection'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {!showRejectInput && (
                  <div className="flex flex-col-reverse md:flex-row items-center justify-end gap-4 pt-4 border-border-default dark:border-border-dark">
                    <button
                      type="button"
                      onClick={handleRejectClick}
                      disabled={isSaving}
                      className="px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-lg">close</span>
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={isSaving || !recommendations.trim()}
                      className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-md transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-lg">verified</span>
                      {isSaving ? 'Processing...' : 'Approve & Complete Assessment'}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Approved Status */}
            {assessment.status === 'approved' && (
              <div className="flex flex-col-reverse md:flex-row items-center justify-end gap-4 pt-4 border-t border-border-default dark:border-border-dark">
                {assessment.recommendations && (
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text-main dark:text-white mb-2">
                      Recommendations:
                    </p>
                    <p className="text-sm text-text-secondary whitespace-pre-wrap">
                      {assessment.recommendations}
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleProceedToSemp}
                  className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-md transition-colors flex items-center gap-2"
                >
                  Proceed to SEMP
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
