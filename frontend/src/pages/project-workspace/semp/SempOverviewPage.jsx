/**
 * SempOverviewPage
 * Matches design from: 16.ESM Plan Overview.html
 * Refactored to use updated components.
 */

import { useNavigate, useParams } from 'react-router-dom'
import { useSemp, useAssessment } from '@/hooks'
import { SempToolCard, SempCTABanner } from '@/components/semp'

export default function SempOverviewPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { getTool3Status, getTool4Status, isLoading } = useSemp(projectId)
  const { assessment } = useAssessment(projectId)

  // Navigate handlers
  const handleNavigate = (path) => {
    if (isLocked) return // Prevent navigation if locked
    navigate(`/app/projects/${projectId}/semp/${path}`)
  }

  // Check locks
  const isApproved = assessment?.status === 'approved'
  const isLocked = !isApproved

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-text-secondary dark:text-gray-400 text-sm">Loading SEMP data...</p>
        </div>
      </div>
    )
  }

  const tool3Status = getTool3Status()
  const tool4Status = getTool4Status()

  return (
    <div className="flex-1 overflow-y-auto bg-background dark:bg-background-dark p-6 md:p-10 lg:p-12">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-8 pb-20">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 border-b border-border-default dark:border-border-dark pb-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-text-main dark:text-white text-3xl md:text-4xl font-black tracking-tight font-display">
              Environmental & Social Management Plan
            </h1>
            <p className="text-text-secondary dark:text-gray-400 text-lg font-normal">
              Management, mitigation, and monitoring actions
            </p>
          </div>
        </div>

        {/* Lock Warning */}
        {isLocked && (
          <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-xl p-6 flex flex-col sm:flex-row items-center gap-4 mb-2">
            <div className="size-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center shrink-0 text-orange-600 dark:text-orange-400">
              <span className="material-symbols-outlined text-2xl">lock</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Tools Locked</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                You must complete and get approval for the{' '}
                <strong>Environmental Assessment (Tool 2)</strong> before starting the management
                plans.
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

        {/* Management Tools Section */}
        <section
          className={
            isLocked
              ? 'flex flex-col gap-4 opacity-50 pointer-events-none grayscale'
              : 'flex flex-col gap-4'
          }
        >
          <h2 className="text-lg font-bold text-text-main dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">handyman</span>
            Management Tools
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tool 3 Card */}
            <SempToolCard
              toolNumber={3}
              title="Management Activities"
              description="Plan general environmental and social management activities for the project lifecycle, including stakeholder engagement and capacity building."
              status={tool3Status}
              onAction={() => handleNavigate('activities')}
              pulse={!isLocked && tool3Status === 'not_started'}
            />

            {/* Tool 4 Card */}
            <SempToolCard
              toolNumber={4}
              title="Management & Mitigation"
              description="Develop specific mitigation measures for identified risks. This plan is mandatory for projects with Moderate or High impact levels."
              status={tool4Status}
              onAction={() => handleNavigate('mitigation')}
              pulse={!isLocked && tool4Status === 'not_started' && tool3Status !== 'not_started'}
            />
          </div>
        </section>
        {/* CTA Banner Area */}
        {!isLocked && (
          <div className="mt-auto pt-6">
            <SempCTABanner
              title="Develop the Social and Environmental Management Plan (SEMP)"
              description="Outline management activities and mitigation measures based on assessment findings. High-risk impacts require immediate action planning and prioritization."
            />
          </div>
        )}
      </div>
    </div>
  )
}
