/**
 * useProjectWorkbook Hook
 * "Export project workbook" (D67 b): one Excel file with a sheet per tool that has data, in the
 * official order. Loads only what those sheets need, through the same cached queries as the tool
 * pages (nothing already cached is fetched again), then builds the file in the browser.
 */
import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { screeningService } from '@/services/screeningService'
import { sempService } from '@/services/sempService'
import { monitoringService } from '@/services/monitoringService'
import { extractErrorMessage } from '@/services/api'
import { queryKeys } from '@/services/queryKeys'
import { assessmentQuery } from './useAssessment'
import { lookupsQuery, sortedCategories, withIndicators, withQuestions } from './useLookups'
import { useWorkspace } from './useWorkspace'

/**
 * Which tools have something to export, from the workspace (no extra request)
 * @param {Object} workspace - useWorkspace() result
 */
export function workbookTools({ screening, assessment, counts }) {
  return {
    tool1: !!screening,
    tool2: !!assessment,
    tool3: (counts?.management_activities ?? 0) > 0,
    tool4: (counts?.mitigation_plans ?? 0) > 0,
    tool5: (counts?.monitoring_records ?? 0) > 0,
  }
}

/**
 * @param {string} projectId
 */
export function useProjectWorkbook(projectId) {
  const queryClient = useQueryClient()
  const workspace = useWorkspace(projectId)
  const [isExporting, setIsExporting] = useState(false)
  const tools = workbookTools(workspace)
  const hasData = Object.values(tools).some(Boolean)

  const exportWorkbook = useCallback(async () => {
    if (!hasData) return { success: false, error: 'Nothing to export yet.' }
    const load = (queryKey, queryFn) => queryClient.ensureQueryData({ queryKey, queryFn })
    setIsExporting(true)
    try {
      const [screening, tool2, management, mitigation, records, lookups, excel] = await Promise.all(
        [
          tools.tool1
            ? load(queryKeys.screening(projectId), () => screeningService.getByProject(projectId))
            : null,
          tools.tool2 ? queryClient.ensureQueryData(assessmentQuery(projectId)) : null,
          tools.tool3
            ? load(queryKeys.management(projectId), () =>
                sempService.getManagementActivities(projectId)
              )
            : [],
          tools.tool4
            ? load(queryKeys.mitigation(projectId), () => sempService.getMitigationPlans(projectId))
            : [],
          tools.tool5
            ? load(queryKeys.monitoring(projectId), () => monitoringService.getByProject(projectId))
            : [],
          // Questions (Tool 2) and indicators (Tool 5) come from the lookups
          tools.tool2 || tools.tool5 ? queryClient.ensureQueryData(lookupsQuery) : null,
          import('@/utils/excelExport'),
        ]
      )
      const categories = sortedCategories(lookups)
      const fileName = await excel.exportProjectWorkbook({
        project: workspace.project,
        workflow: workspace.workflow,
        screening,
        assessment: tool2 ?? { assessment: null },
        management,
        mitigation,
        records,
        categoriesWithQuestions: lookups ? withQuestions(categories, lookups.impactQuestions) : [],
        categoriesWithIndicators: lookups ? withIndicators(categories, lookups.indicators) : [],
      })
      return { success: true, fileName }
    } catch (err) {
      return { success: false, error: extractErrorMessage(err) }
    } finally {
      setIsExporting(false)
    }
  }, [
    hasData,
    queryClient,
    projectId,
    tools.tool1,
    tools.tool2,
    tools.tool3,
    tools.tool4,
    tools.tool5,
    workspace.project,
    workspace.workflow,
  ])

  return { exportWorkbook, isExporting, hasData, tools }
}
