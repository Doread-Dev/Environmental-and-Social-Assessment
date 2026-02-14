/**
 * MonitoringOverviewPage
 * Tool 5 - Monitoring Overview
 * صفحة نظرة عامة للمراقبة
 */

import { useNavigate, useParams } from 'react-router-dom'
import { MonitoringCategoryCard, MonitoringProgressTimeline } from '@/components/monitoring'
import { useMonitoring, useAssessment, useScreening, useProjectContext } from '@/hooks'
import { useLookups } from '@/contexts'
import { useToast } from '@/components/ui'

export default function MonitoringOverviewPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { isLoading: lookupsLoading, categoriesWithIndicators, IMPACT_LEVEL_CONFIG } = useLookups()
  const { getAllCategoryStats, getCategoryData, isLoading, records } = useMonitoring(projectId)
  const { assessment, isLoading: isAssessmentLoading } = useAssessment(projectId)
  const { screening } = useScreening(projectId)
  const { project } = useProjectContext()

  const isApproved = assessment?.status === 'approved'
  const isLocked = !isApproved

  if (isLoading || isAssessmentLoading || lookupsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-text-secondary dark:text-gray-400 text-sm">
            Loading monitoring data...
          </p>
        </div>
      </div>
    )
  }

  const categoryStats = getAllCategoryStats()
  const quarterKeys = ['baseline', 'Q1', 'Q2', 'Q3', 'Q4']
  const completedQuarters = quarterKeys.reduce((acc, key) => {
    acc[key] = records.some((record) => record.scores?.[key])
    return acc
  }, {})
  const quartersRecorded = ['Q1', 'Q2', 'Q3', 'Q4'].filter((key) => completedQuarters[key]).length
  const completedOrder = ['baseline', 'Q1', 'Q2', 'Q3', 'Q4']
  const lastCompletedIndex = completedOrder.reduce((acc, key, index) => {
    return completedQuarters[key] ? index : acc
  }, -1)
  const nextQuarterIndex = Math.min(lastCompletedIndex + 1, completedOrder.length - 1)
  const currentQuarter = completedOrder[Math.max(0, nextQuarterIndex)]

  return (
    <div className="flex-1 overflow-y-auto bg-background dark:bg-background-dark">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-8 pb-20">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 border-b border-border-default dark:border-border-dark pb-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-text-main dark:text-white text-3xl md:text-4xl font-black tracking-tight font-display">
              Environmental & Social Monitoring
            </h1>
            <p className="text-primary font-medium">Tool 5 – Monitoring and Evaluation</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate(`/app/projects/${projectId}/monitoring/data-entry`)}
              disabled={isLocked}
              className="flex items-center justify-center gap-2 h-10 px-6 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              Enter / Edit Data
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  const { exportMonitoringToExcel } = await import('@/utils/excelExport')
                  await exportMonitoringToExcel(
                    project,
                    screening,
                    assessment,
                    records,
                    categoriesWithIndicators,
                    IMPACT_LEVEL_CONFIG
                  )
                  toast.success('Excel file downloaded successfully!')
                } catch (error) {
                  console.error('Export error:', error)
                  toast.error('Failed to export Excel file')
                }
              }}
              disabled={isLocked}
              className="flex items-center justify-center gap-2 h-10 px-6 rounded-lg border border-primary text-primary hover:bg-primary/10 dark:hover:bg-primary/20 font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-base">download</span>
              Export Excel
            </button>
          </div>
        </div>

        {/* Lock Warning */}
        {isLocked && (
          <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-xl p-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="size-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center shrink-0 text-orange-600 dark:text-orange-400">
              <span className="material-symbols-outlined text-2xl">lock</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Monitoring Locked
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                You must complete and get approval for the{' '}
                <strong>Environmental Assessment (Tool 2)</strong> before starting monitoring.
              </p>
            </div>
            <button
              onClick={() => navigate(`/app/projects/${projectId}/assessment`)}
              className="sm:ml-auto px-4 py-2 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap"
            >
              Go to Assessment
            </button>
          </div>
        )}

        {/* Completion Status */}
        <section
          className={
            isLocked
              ? 'bg-white dark:bg-[#152a1d] rounded-xl p-6 shadow-sm border border-border-default dark:border-border-dark opacity-50 pointer-events-none grayscale'
              : 'bg-white dark:bg-[#152a1d] rounded-xl p-6 shadow-sm border border-border-default dark:border-border-dark'
          }
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <h3 className="text-xl font-bold text-text-main dark:text-white">Completion Status</h3>
            <div className="flex gap-8">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wide mb-1">
                  Baseline Status
                </span>
                {completedQuarters.baseline ? (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-lg">
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    Entered
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-bold text-lg">
                    <span className="material-symbols-outlined text-base">
                      radio_button_unchecked
                    </span>
                    Not Entered
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wide mb-1">
                  Number of quarters recorded
                </span>
                <div className="flex items-center gap-2 text-text-main dark:text-white font-bold text-lg">
                  <span className="material-symbols-outlined text-base text-text-secondary dark:text-gray-400">
                    calendar_today
                  </span>
                  {quartersRecorded}
                </div>
              </div>
            </div>
          </div>
          <MonitoringProgressTimeline
            completedQuarters={completedQuarters}
            currentQuarter={currentQuarter}
            embedded={true}
          />
        </section>

        {/* Categories Grid */}
        <section
          className={
            isLocked
              ? 'flex flex-col gap-6 opacity-50 pointer-events-none grayscale'
              : 'flex flex-col gap-6'
          }
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-main dark:text-white">
              Monitoring Scope Summary
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categoryStats.map((category) => {
              const categoryData = getCategoryData(category.code)
              const rankingCounts = categoryData.reduce((acc, item) => {
                const ranking = item.record?.ranking || 'not_applicable'
                acc[ranking] = (acc[ranking] || 0) + 1
                return acc
              }, {})
              const priority = ['high', 'medium', 'low', 'negligible', 'not_applicable']
              const rankingKey = priority.find((key) => rankingCounts[key] > 0) || 'not_applicable'
              const rankingLabel = IMPACT_LEVEL_CONFIG[rankingKey]?.label || 'N/A'

              return (
                <MonitoringCategoryCard
                  key={category.code}
                  code={category.code}
                  name={category.name}
                  rankingKey={rankingKey}
                  rankingLabel={rankingLabel}
                  projectId={projectId}
                />
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
