/**
 * ScreeningSummaryPage
 * صفحة ملخص الفرز والموافقة
 * مطابق للتصميم الأصلي حرفياً
 * 
 * Layout: ProjectLayout
 * Route: /app/projects/:projectId/screening/summary
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProjectContext, useScreening } from '@/hooks'
import { getScreeningWithDetails, mockProjects, getScreeningCategory, screeningStatuses } from '@/data'
import { formatDateShort } from '@/utils/formatters'
import { cn } from '@/utils/cn'

function ScreeningSummaryPage() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const { project: contextProject } = useProjectContext()
  const { screening: hookScreening, isLoading: screeningLoading, approve: approveScreening, reject: rejectScreening } = useScreening(projectId)

  // Get screening with details
  const screeningDetails = hookScreening ? getScreeningWithDetails(projectId) : null
  const project = screeningDetails?.projectDetails || mockProjects.find((p) => p._id === projectId) || contextProject
  const screening = hookScreening || screeningDetails || null

  // Initialize ALL hooks BEFORE any conditional returns
  const [recommendations, setRecommendations] = useState(screening?.recommendations || '')
  const [isProcessing, setIsProcessing] = useState(false)

  // Handlers - must be defined before conditional returns
  const handleExport = useCallback(() => {
    // TODO: Implement Excel export
    console.log('Exporting to Excel...')
    alert('Export functionality will be implemented in future phase')
  }, [])

  const handleEdit = useCallback(() => {
    // Navigate to form with edit mode - router will show form for rejected status
    navigate(`/app/projects/${projectId}/screening?edit=true`)
  }, [navigate, projectId])

  const handleProceedToAssessment = useCallback(() => {
    navigate(`/app/projects/${projectId}/assessment`)
  }, [navigate, projectId])

  const handleApprove = useCallback(async () => {
    setIsProcessing(true)
    try {
      const result = await approveScreening(recommendations)

      if (result.success) {
        // After approval, status becomes 'approved' - router will show summary
        navigate(`/app/projects/${projectId}/screening`, { replace: true })
      } else {
        alert(result.error || 'Failed to approve screening. Please try again.')
      }
    } catch (error) {
      console.error('Failed to approve screening:', error)
      alert('Failed to approve screening. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }, [approveScreening, recommendations, navigate, projectId])

  const handleReject = useCallback(async () => {
    if (!confirm('Are you sure you want to reject this screening?')) return

    setIsProcessing(true)
    try {
      const result = await rejectScreening('Screening rejected by approver')

      if (result.success) {
        // After rejection, status becomes 'rejected' - router will show summary with edit button
        navigate(`/app/projects/${projectId}/screening`, { replace: true })
      } else {
        alert(result.error || 'Failed to reject screening. Please try again.')
      }
    } catch (error) {
      console.error('Failed to reject screening:', error)
      alert('Failed to reject screening. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }, [rejectScreening, navigate, projectId])

  // Expose export handler to parent layout via custom event
  useEffect(() => {
    const status = screening?.status || 'draft'
    if (status === 'submitted' || status === 'approved' || status === 'rejected') {
      const handleExportEvent = () => {
        handleExport()
      }
      window.addEventListener('screening-export', handleExportEvent)
      return () => {
        window.removeEventListener('screening-export', handleExportEvent)
      }
    }
  }, [screening?.status, handleExport])

  // Update recommendations when screening changes
  useEffect(() => {
    if (screening?.recommendations) {
      setRecommendations(screening.recommendations)
    }
  }, [screening?.recommendations])

  // Show loading state - AFTER all hooks
  if (screeningLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-text-secondary dark:text-gray-400 text-sm">Loading screening...</p>
        </div>
      </div>
    )
  }

  if (!screening) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-text-secondary dark:text-gray-400 mb-4">
            No screening data found for this project.
          </p>
          <button
            onClick={() => navigate(`/app/projects/${projectId}/screening`)}
            className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-md transition-colors"
          >
            Start Screening
          </button>
        </div>
      </div>
    )
  }

  // Calculate derived values AFTER conditional returns
  const status = screening.status || 'draft'
  const categoryInfo = getScreeningCategory(screening.category_code)
  
  // Check if user can approve (only admins/managers can approve)
  // TODO: Replace with actual user role check from AuthContext
  const isAdmin = true // Mock: assume user is admin for now
  const canApprove = isAdmin && status === 'submitted'

  // Parse impacts into list items
  const negativeItems = screening.potential_negative
    ?.split('\n')
    .filter((line) => line.trim().startsWith('-'))
    .map((line) => line.trim().substring(1).trim()) || []

  const positiveItems = screening.potential_positive
    ?.split('\n')
    .filter((line) => line.trim().startsWith('-'))
    .map((line) => line.trim().substring(1).trim()) || []

  // Format screening date - لا يظهر في حالة submitted
  const screeningDateFormatted = 
    status !== 'submitted' && screening.screening_date 
      ? formatDateShort(screening.screening_date) 
      : ''

  // Status badge config
  const statusBadgeConfig = {
    submitted: {
      label: 'pending approval',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      textColor: 'text-orange-700 dark:text-orange-400',
      borderColor: 'border-orange-200 dark:border-orange-800',
    },
    approved: {
      label: 'approved',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-700 dark:text-green-400',
      borderColor: 'border-green-200 dark:border-green-800',
    },
    rejected: {
      label: 'rejected',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-700 dark:text-red-400',
      borderColor: 'border-red-200 dark:border-red-800',
    },
    draft: {
      label: 'draft',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      textColor: 'text-gray-700 dark:text-gray-400',
      borderColor: 'border-gray-200 dark:border-gray-700',
    },
  }

  const badgeConfig = statusBadgeConfig[status] || statusBadgeConfig.draft

  // Parse project components (split by comma or use project_component field)
  const projectComponents = project?.project_component
    ?.split(',')
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 3) || []

  return (
    <div className="flex flex-col gap-8">
      {/* Main Container - مطابق للتصميم الأصلي */}
      <form className="flex flex-col gap-8 print-container">
        <div className="max-w-[960px] mx-auto bg-white dark:bg-surface-dark shadow-sm rounded-xl overflow-hidden min-h-[800px] flex flex-col print-container">
        {/* Header Section */}
        <div className="p-8 pb-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-main dark:text-white">
                  Environmental Integration Screening
                </h1>
                <span
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border',
                    badgeConfig.bgColor,
                    badgeConfig.textColor,
                    badgeConfig.borderColor
                  )}
                >
                  {badgeConfig.label}
                </span>
              </div>
              <p className="text-text-secondary dark:text-gray-400 text-sm md:text-base">
                Project: {project?.title || 'N/A'}
              </p>
            </div>
            {screeningDateFormatted && (
              <div className="text-right flex flex-col items-end">
                <span className="text-xs text-text-secondary dark:text-gray-400 uppercase tracking-wider font-semibold">
                  Screening Date
                </span>
                <span className="text-text-main dark:text-white font-medium">{screeningDateFormatted}</span>
              </div>
            )}
          </div>
        </div>

        {/* Officer Info & Project Components Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-200 dark:bg-gray-800">
          {/* Program Officer */}
          <div className="bg-surface dark:bg-surface-dark p-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400 mb-1">
              Program Officer
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 text-sm">person</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-text-main dark:text-white">Jane Doe</p>
                <p className="text-xs text-text-secondary dark:text-gray-400">Senior Field Officer, East Region</p>
              </div>
            </div>
          </div>

          {/* Project Components */}
          <div className="bg-surface dark:bg-surface-dark p-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400 mb-1">
              Project Components
            </h3>
            <div className="flex gap-2 flex-wrap">
              {projectComponents.length > 0 ? (
                projectComponents.map((component, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                  >
                    {component}
                  </span>
                ))
              ) : (
                <span className="text-xs text-text-secondary dark:text-gray-400">No components specified</span>
              )}
            </div>
          </div>
        </div>

        {/* Risk Category Card */}
        {categoryInfo && (
          <div className="p-8">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-black text-white p-8 shadow-md">
              {/* Background Icon */}
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="material-symbols-outlined text-[120px]">security</span>
              </div>

              {/* Main Content */}
              <div className="relative z-10 flex flex-col md:flex-row gap-6 md:items-center">
                {/* Category Circle */}
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-yellow-500/20 border-2 border-yellow-500 flex items-center justify-center text-yellow-500">
                  <span className="text-2xl font-black">{screening.category_code}</span>
                </div>

                {/* Category Info */}
                <div className="flex-1">
                  <h2 className="text-lg font-bold mb-1">
                    Category {screening.category_code}: {categoryInfo.label}
                  </h2>
                  <p className="text-gray-300 dark:text-gray-400 text-sm leading-relaxed max-w-2xl">
                    {categoryInfo.description}
                  </p>
                </div>
              </div>

              {/* Justification Section */}
              {screening.category_reason && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <h4 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">Justification</h4>
                  <p className="text-sm text-gray-200 dark:text-gray-300 italic">"{screening.category_reason}"</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Impacts Grid */}
        <div className="px-8 pb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Negative Impacts */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
              <span className="material-symbols-outlined text-orange-500">warning</span>
              <h3 className="text-base font-bold text-text-main dark:text-white">Potential Negative Impacts</h3>
            </div>
            {negativeItems.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {negativeItems.map((item, index) => (
                  <li
                    key={index}
                    className="flex gap-3 items-start p-3 rounded-lg bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30"
                  >
                    <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0"></div>
                    <span className="text-sm text-text-main dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-text-secondary dark:text-gray-400">None specified</p>
            )}
          </div>

          {/* Positive Impacts */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
              <span className="material-symbols-outlined text-primary">verified</span>
              <h3 className="text-base font-bold text-text-main dark:text-white">Potential Positive Impacts</h3>
            </div>
            {positiveItems.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {positiveItems.map((item, index) => (
                  <li
                    key={index}
                    className="flex gap-3 items-start p-3 rounded-lg bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30"
                  >
                    <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></div>
                    <span className="text-sm text-text-main dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-text-secondary dark:text-gray-400">None specified</p>
            )}
          </div>
        </div>

        {/* Approval Section */}
        <div className="mt-6 px-8">
          <section className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
              <h3 className="font-bold text-lg text-text-main dark:text-white">Approval and Recommendations</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Approved By */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-text-main dark:text-gray-200 mb-2">
                  Approved By <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-text-main dark:text-white text-sm focus:outline-none cursor-not-allowed font-medium"
                  readOnly
                  type="text"
                  value={status === 'approved' ? screening.approverDetails?.name || 'James Director' : ''}
                  disabled
                />
              </div>

              {/* Position */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-text-main dark:text-gray-200 mb-2">
                  Position <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-text-main dark:text-white text-sm focus:outline-none cursor-not-allowed font-medium"
                  readOnly
                  type="text"
                  value={status === 'approved' ? screening.approverDetails?.job_title?.title_name || 'Regional Manager' : ''}
                  disabled
                />
              </div>

              {/* Recommendations */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-text-main dark:text-gray-200 mb-2">
                  Recommendations / Next Steps
                </label>
                <textarea
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark text-text-main dark:text-white focus:ring-primary focus:border-primary px-3 py-2.5 text-sm"
                  placeholder="Enter any specific recommendations for the project team..."
                  rows={3}
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  disabled={status === 'approved' || status === 'rejected' || !canApprove}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-auto bg-gray-50 dark:bg-white/5 border-t border-gray-200 dark:border-gray-800 p-8">
          <div className="flex flex-col gap-6">
            {/* Action Buttons */}
            {status === 'submitted' && canApprove && (
              <div className="flex justify-end gap-4 no-print">
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                  Reject
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">verified</span>
                  {isProcessing ? 'Processing...' : 'Approve & Complete Screening'}
                </button>
              </div>
            )}

            {status === 'approved' && (
              <div className="flex justify-end gap-4 no-print">
                <button
                  type="button"
                  onClick={handleProceedToAssessment}
                  className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-md transition-colors flex items-center gap-2"
                >
                  Proceed to Assessment
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
              </div>
            )}

            {status === 'rejected' && (
              <div className="flex justify-end gap-4 no-print">
                <button
                  type="button"
                  onClick={handleEdit}
                  className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-md transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                  Edit Screening
                </button>
              </div>
            )}
          </div>
        </div>
        </div>
      </form>
    </div>
  )
}

export default ScreeningSummaryPage
