/**
 * AssessmentReviewCard Component
 * بطاقة مراجعة التقييم الكامل
 */

import { cn } from '@/utils/cn'
import { Badge } from '@/components/ui'
import { formatDate } from '@/utils/formatters'
import { IMPACT_LEVEL_CONFIG } from '@/contexts/LookupContext'

/**
 * @param {Object} props
 * @param {Object} props.assessment - بيانات التقييم
 * @param {Array} props.methods - طرق التقييم
 * @param {Array} props.consultations - الاستشارات
 * @param {Array} props.impactScores - نتائج التأثير
 */
export default function AssessmentReviewCard({
  assessment,
  methods = [],
  consultations = [],
  impactScores: _impactScores = [],
}) {
  const statusConfig = {
    draft: { label: 'Draft', variant: 'secondary' },
    submitted: { label: 'Pending Approval', variant: 'warning' },
    approved: { label: 'Approved', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'error' },
  }

  const status = statusConfig[assessment?.status] || statusConfig.draft

  return (
    <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-border-default dark:border-border-dark overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50/50 dark:bg-white/5 border-b border-border-default dark:border-border-dark p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text-main dark:text-white">Assessment Review</h2>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Project & Officer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-text-secondary mb-1">Project Activity</p>
            <p className="text-sm font-medium text-text-main dark:text-white">
              {assessment?.project_activity || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-1">Assessment Date</p>
            <p className="text-sm font-medium text-text-main dark:text-white">
              {assessment?.createdAt ? formatDate(assessment.createdAt) : 'N/A'}
            </p>
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-xs text-text-secondary mb-2">Description</p>
          <p className="text-sm text-text-main dark:text-white whitespace-pre-wrap">
            {assessment?.description || 'N/A'}
          </p>
        </div>

        {/* Environmental Setting */}
        {assessment?.environmental_setting && (
          <div>
            <p className="text-xs text-text-secondary mb-2">Environmental Setting</p>
            <p className="text-sm text-text-main dark:text-white whitespace-pre-wrap">
              {assessment.environmental_setting}
            </p>
          </div>
        )}

        {/* Legal Requirements */}
        {assessment?.legal_requirements && (
          <div>
            <p className="text-xs text-text-secondary mb-2">Legal Requirements</p>
            <p className="text-sm text-text-main dark:text-white whitespace-pre-wrap">
              {assessment.legal_requirements}
            </p>
          </div>
        )}

        {/* Methods & Consultation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-bold text-text-main dark:text-white mb-3">
              Assessment Methods
            </h3>
            <ul className="space-y-2">
              {methods.length > 0 ? (
                methods.map((method, idx) => (
                  <li key={idx} className="text-sm text-text-secondary">
                    • {method.method_type}: {method.details}
                  </li>
                ))
              ) : (
                <li className="text-sm text-text-secondary">No methods recorded</li>
              )}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-main dark:text-white mb-3">
              Community Consultations
            </h3>
            <ul className="space-y-2">
              {consultations.length > 0 ? (
                consultations.map((consultation, idx) => (
                  <li key={idx} className="text-sm text-text-secondary">
                    • {consultation.type}: {consultation.participants}
                  </li>
                ))
              ) : (
                <li className="text-sm text-text-secondary">No consultations recorded</li>
              )}
            </ul>
          </div>
        </div>

        {/* Impact Assessment Results */}
        {assessment?.total_project_score && (
          <div>
            <h3 className="text-sm font-bold text-text-main dark:text-white mb-3">
              Overall Assessment Results
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(assessment.total_project_score).map(([level, count]) => {
                const config = IMPACT_LEVEL_CONFIG[level]
                return (
                  <div
                    key={level}
                    className={cn(
                      'p-3 rounded-lg text-center',
                      config?.bgClass || 'bg-gray-100 dark:bg-white/5'
                    )}
                  >
                    <p className={cn('text-2xl font-bold', config?.textClass || 'text-gray-600')}>
                      {count}
                    </p>
                    <p className="text-xs text-text-secondary mt-1">{config?.label || level}</p>
                  </div>
                )
              })}
            </div>
            <div className="mt-4">
              <p className="text-sm font-bold text-text-main dark:text-white">
                Total Impact: {assessment.total_project_impact?.toUpperCase() || 'N/A'}
              </p>
            </div>
          </div>
        )}

        {/* Potential Impacts */}
        {(assessment?.potential_negative_impact || assessment?.potential_positive_impact) && (
          <div>
            <h3 className="text-sm font-bold text-text-main dark:text-white mb-3">
              Potential Impacts Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assessment.potential_negative_impact && (
                <div>
                  <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-2">
                    Negative Impact
                  </p>
                  <p className="text-sm text-text-secondary whitespace-pre-wrap">
                    {assessment.potential_negative_impact}
                  </p>
                </div>
              )}
              {assessment.potential_positive_impact && (
                <div>
                  <p className="text-xs font-bold text-primary mb-2">Positive Impact</p>
                  <p className="text-sm text-text-secondary whitespace-pre-wrap">
                    {assessment.potential_positive_impact}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
