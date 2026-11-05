/**
 * MonitoringDataEntryPage
 * Tool 5 - Monitoring Data Entry
 * صفحة إدخال بيانات المراقبة
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useMonitoring, useProjectContext, useLookups, useUsers } from '@/hooks'
import { assessmentQuery } from '@/hooks/useAssessment'
import { isStepLocked } from '@/utils/workflowSteps'
import { MonitoringDataTable } from '@/components/tables'
import {
  Alert,
  useToast,
  LoadingState,
  PAGE_TITLE,
  PAGE_DESCRIPTION,
  Button,
} from '@/components/ui'
import { cn } from '@/utils/cn'
export default function MonitoringDataEntryPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const categoryParam = searchParams.get('category')
  const toast = useToast()
  const {
    impactCategories,
    categoriesWithIndicators,
    isLoading: lookupsLoading,
    IMPACT_LEVEL_CONFIG,
  } = useLookups()
  const { activeUsers } = useUsers()
  const queryClient = useQueryClient()
  // Lock and permissions from the backend workflow (workspace, D30/D35)
  const { project, workflow, can } = useProjectContext()
  const isLocked = isStepLocked(workflow, 'monitoring')
  const canEdit = can('monitoring.edit')

  const {
    getCategoryData,
    updateQuarterScore,
    updateRecordField,
    saveAllRecords,
    isLoading,
    isSaving,
    error,
    records,
  } = useMonitoring(projectId)

  const [expandedCategories, setExpandedCategories] = useState(
    categoryParam ? [categoryParam] : ['A']
  )
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const categoryIconMap = {
    A: {
      icon: 'air',
      className: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    },
    B: {
      icon: 'water_drop',
      className: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400',
    },
    C: {
      icon: 'graphic_eq',
      className: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
    },
    D: {
      icon: 'delete',
      className: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    },
    E: {
      icon: 'speed',
      className: 'bg-background dark:bg-white/5 text-text-secondary dark:text-gray-400',
    },
    F: {
      icon: 'science',
      className: 'bg-primary-soft dark:bg-primary/20 text-primary dark:text-green-300',
    },
    J: {
      icon: 'forest',
      className: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    },
    H: {
      icon: 'landscape',
      className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    },
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

  const handleExport = useCallback(async () => {
    try {
      const { exportTool, exportStatus } = await import('@/utils/excelExport')
      // The full assessment (officer) is only needed here: loaded on export, then cached
      const { assessment } = await queryClient.ensureQueryData(assessmentQuery(projectId))
      const fileName = await exportTool(
        'tool5',
        {
          project,
          screening: project.screening,
          assessment,
          records,
          categoriesWithIndicators,
        },
        exportStatus(workflow, 'tool5')
      )
      toast.success(`Downloaded ${fileName}`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export Excel file')
    }
  }, [project, projectId, queryClient, records, categoriesWithIndicators, workflow, toast])

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

  if (isLoading || lookupsLoading) {
    return <LoadingState message="Loading monitoring data..." />
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background dark:bg-background-dark">
      <div className="max-w-[1600px] mx-auto flex flex-col gap-8 pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-default dark:border-border-dark pb-6">
          <div>
            <h1 className={PAGE_TITLE}>Monitoring Data Entry</h1>
            <p className={PAGE_DESCRIPTION}>
              Enter and review cumulative environmental and social monitoring data over time.
            </p>
          </div>
          <div className="gap-2 flex items-center justify-center">
            <Button variant="secondary" type="button" onClick={handleBack}>
              <span className="material-symbols-outlined text-lg" aria-hidden="true">
                arrow_back
              </span>
              <span>Cancel</span>
            </Button>
            {canEdit && (
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={isLocked || isSaving || (justSaved && !hasUnsavedChanges)}
                isLoading={isSaving}
                leftIcon={
                  saveBtn.icon ? (
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">
                      {saveBtn.icon}
                    </span>
                  ) : undefined
                }
              >
                {saveBtn.text}
              </Button>
            )}
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
              <span className="material-symbols-outlined text-2xl" aria-hidden="true">
                lock
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-main dark:text-white mb-1">
                Monitoring Locked
              </h3>
              <p className="text-text-secondary dark:text-gray-400 text-sm">
                You must complete and get approval for the{' '}
                <strong>Environmental Assessment (Tool 2)</strong> before entering monitoring data.
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
              .map((item) => {
                const k = item.record?.ranking
                return IMPACT_LEVEL_CONFIG[k] && { ...IMPACT_LEVEL_CONFIG[k], key: k }
              })
              .filter(Boolean)
              .filter((level) => level.key !== 'not_applicable')
            const defaultRanking = IMPACT_LEVEL_CONFIG.not_applicable && {
              ...IMPACT_LEVEL_CONFIG.not_applicable,
              key: 'not_applicable',
            }
            const currentRanking = rankingLevels.sort((a, b) => b.value - a.value)[0] ||
              defaultRanking || { key: 'not_applicable', label: 'N/A', value: -1 }
            const rankingStyles = {
              negligible: 'bg-background dark:bg-white/5 text-text-main dark:text-gray-400',
              low: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
              medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
              high: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
              not_applicable:
                'bg-background dark:bg-white/5 text-text-secondary dark:text-gray-400',
            }
            const iconConfig = categoryIconMap[category.code] || {
              icon: 'analytics',
              className: 'bg-primary/10 text-primary',
            }

            return (
              <div
                key={category.code}
                className="bg-surface dark:bg-card-dark rounded-xl shadow-sm border border-border-default dark:border-border-dark overflow-hidden"
              >
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleCategory(category.code)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-background dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'size-10 rounded-lg flex items-center justify-center',
                        iconConfig.className
                      )}
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">
                        {iconConfig.icon}
                      </span>
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
                    aria-hidden="true"
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
                        isEditable={canEdit}
                        users={activeUsers ?? []}
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
