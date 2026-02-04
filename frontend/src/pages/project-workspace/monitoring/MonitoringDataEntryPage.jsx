/**
 * MonitoringDataEntryPage
 * Tool 5 - Monitoring Data Entry
 * صفحة إدخال بيانات المراقبة
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useMonitoring, useAssessment } from '@/hooks'
import { MonitoringDataTable } from '@/components/tables'
import { Alert } from '@/components/ui'
import { impactCategories, impactLevels } from '@/data/impactCategories'
import { cn } from '@/utils/cn'

export default function MonitoringDataEntryPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const categoryParam = searchParams.get('category')
  const { assessment, isLoading: isAssessmentLoading } = useAssessment(projectId)
  const isApproved = assessment?.status === 'approved'
  const isLocked = !isApproved

  const {
    getCategoryData,
    updateQuarterScore,
    updateRecordField,
    saveAllRecords,
    isLoading,
    isSaving,
    error,
  } = useMonitoring(projectId)

  const [expandedCategories, setExpandedCategories] = useState(
    categoryParam ? [categoryParam] : ['A']
  )
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const categoryIconMap = {
    A: { icon: 'air', className: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
    B: { icon: 'water_drop', className: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400' },
    C: { icon: 'graphic_eq', className: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' },
    D: { icon: 'delete', className: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' },
    E: { icon: 'speed', className: 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400' },
    F: { icon: 'science', className: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' },
    J: { icon: 'forest', className: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' },
    H: { icon: 'landscape', className: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400' },
  }

  // Auto-expand category from URL
  useEffect(() => {
    if (categoryParam && !expandedCategories.includes(categoryParam)) {
      setExpandedCategories((prev) => [...prev, categoryParam])
    }
  }, [categoryParam]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleCategory = (code) => {
    setExpandedCategories((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  const handleSave = async () => {
    const result = await saveAllRecords()
    if (result.success) {
      setHasUnsavedChanges(false)
      setJustSaved(true)
    }
  }

  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        return
      }
    }
    navigate(`/app/projects/${projectId}/monitoring`)
  }

  const handleExport = useCallback(() => {
    // Placeholder for export functionality
    alert('Export functionality will be implemented in future phase')
  }, [])

  useEffect(() => {
    const handleExportEvent = () => {
      handleExport()
    }
    window.addEventListener('monitoring-export', handleExportEvent)
    return () => {
      window.removeEventListener('monitoring-export', handleExportEvent)
    }
  }, [handleExport])

  const getSaveButtonContent = () => {
    if (isSaving) {
      return { icon: null, text: 'Saving...', spinner: true }
    }
    if (justSaved && !hasUnsavedChanges) {
      return { icon: 'check', text: 'Saved', spinner: false }
    }
    return { icon: 'save', text: 'Save', spinner: false }
  }

  const saveBtn = getSaveButtonContent()

  if (isLoading || isAssessmentLoading) {
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

  return (
    <div className="flex-1 overflow-y-auto bg-background dark:bg-background-dark">
      <div className="max-w-[1600px] mx-auto flex flex-col gap-8 pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-default dark:border-border-dark pb-6">
          <div>
            <h1 className="text-text-main dark:text-white text-3xl font-black leading-tight tracking-tight">
              Monitoring Data Entry
            </h1>
            <p className="text-primary text-base font-normal mt-1">
              Enter and review cumulative environmental and social monitoring data over time.
            </p>
          </div>
          <div className="gap-2 flex items-center justify-center">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-white dark:bg-surface-dark border border-border-default dark:border-border-dark hover:bg-gray-50/50 dark:hover:bg-white/3 text-text-main dark:text-white text-sm font-bold transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isLocked || isSaving || (justSaved && !hasUnsavedChanges)}
              className={cn(
                'flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-5 gap-2 text-sm font-bold leading-normal tracking-[0.015em] shadow-md transition-all transform',
                isLocked
                  ? 'bg-primary/50 cursor-not-allowed'
                  : isSaving
                  ? 'bg-primary/70 cursor-wait'
                  : justSaved && !hasUnsavedChanges
                    ? 'bg-green-600 hover:bg-green-700 text-white border border-transparent'
                    : 'bg-primary hover:bg-green-500 text-primary-content'
              )}
            >
              {saveBtn.spinner ? (
                <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-lg">{saveBtn.icon}</span>
              )}
              <span className="truncate">{saveBtn.text}</span>
            </button>
          </div>
        </div>


        {/* Error Alert */}
        {error && (
          <Alert variant="error" title="Error">
            {error}
          </Alert>
        )}

        {/* Lock Warning */}
        {isLocked && (
          <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-xl p-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="size-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center shrink-0 text-orange-600 dark:text-orange-400">
              <span className="material-symbols-outlined text-2xl">lock</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Monitoring Locked</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                You must complete and get approval for the <strong>Environmental Assessment (Tool 2)</strong> before entering monitoring data.
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

   

        {/* Categories Accordion */}
        <section
          className={
            isLocked
              ? 'flex flex-col gap-4 opacity-50 pointer-events-none grayscale'
              : 'flex flex-col gap-4'
          }
        >
          {impactCategories.map((category) => {
            const isExpanded = expandedCategories.includes(category.code)
            const categoryData = getCategoryData(category.code)
            const rankingLevels = categoryData
              .map((item) => impactLevels[item.record?.ranking])
              .filter(Boolean)
              .filter((level) => level.key !== 'not_applicable')
            const currentRanking =
              rankingLevels.sort((a, b) => b.value - a.value)[0] || impactLevels.not_applicable
            const rankingStyles = {
              negligible: 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-400',
              low: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
              medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
              high: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
              not_applicable: 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400',
            }
            const iconConfig = categoryIconMap[category.code] || {
              icon: 'analytics',
              className: 'bg-primary/10 text-primary',
            }

            return (
              <div
                key={category.code}
                className="bg-white dark:bg-[#152a1d] rounded-xl shadow-sm border border-border-default dark:border-border-dark overflow-hidden"
              >
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleCategory(category.code)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'size-10 rounded-lg flex items-center justify-center',
                        iconConfig.className
                      )}
                    >
                      <span className="material-symbols-outlined">{iconConfig.icon}</span>
                    </div>
                    <div className="text-left">
                      <h2 className="text-lg font-bold text-text-main dark:text-white">
                        {category.name}
                      </h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-medium text-text-secondary dark:text-gray-400">
                          Current Ranking:
                        </span>
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                            rankingStyles[currentRanking.key]
                          )}
                        >
                          {currentRanking.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'material-symbols-outlined text-2xl text-text-secondary dark:text-gray-400 transition-transform',
                      isExpanded && 'rotate-180'
                    )}
                  >
                    expand_more
                  </span>
                </button>

                {/* Accordion Content */}
                {isExpanded && (
                  <div className="border-t border-border-default dark:border-border-dark">
                    <div className="p-0">
                      <MonitoringDataTable
                        data={categoryData}
                        onUpdateScore={(recordId, quarter, value, indicatorId) => {
                          updateQuarterScore(recordId, quarter, value, indicatorId)
                          setHasUnsavedChanges(true)
                          setJustSaved(false)
                        }}
                        onUpdateField={(recordId, field, value, indicatorId) => {
                          updateRecordField(recordId, field, value, indicatorId)
                          setHasUnsavedChanges(true)
                          setJustSaved(false)
                        }}
                        isEditable={true}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </section>

      </div>
    </div>
  )
}
