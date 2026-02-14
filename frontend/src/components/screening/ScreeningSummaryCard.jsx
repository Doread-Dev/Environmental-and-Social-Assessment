/**
 * ScreeningSummaryCard Component
 * بطاقة ملخص الفرز (للعرض في Summary Page)
 *
 * Features:
 * - Header مع حالة الفرز
 * - معلومات المسؤول
 * - مكونات المشروع (tags)
 * - بطاقة فئة الخطر الكبيرة
 * - قائمة التأثيرات السلبية والإيجابية
 */

import { Card, Badge, Icon } from '@/components/ui'
import { ROLE_LABELS } from '@/contexts'
import { getScreeningCategory, screeningStatuses } from '@/utils/screeningDisplay'
import { formatDate } from '@/utils/formatters'
import { cn } from '@/utils/cn'

/**
 * @param {Object} props
 * @param {Object} props.screening - بيانات الفرز
 * @param {Object} props.project - بيانات المشروع
 */
function ScreeningSummaryCard({ screening, project, className, ...props }) {
  if (!screening) return null

  const officer =
    screening?.officer && typeof screening.officer === 'object' ? screening.officer : null

  const categoryInfo = getScreeningCategory(screening.category_code)
  const statusInfo = screeningStatuses[screening.status] || screeningStatuses.draft

  // Parse impacts into list items
  const negativeItems =
    screening.potential_negative
      ?.split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/^[-*]\s*/, '')) || []

  const positiveItems =
    screening.potential_positive
      ?.split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/^[-*]\s*/, '')) || []

  return (
    <div className={cn('space-y-6', className)} {...props}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-main dark:text-white">
            Environmental Integration Screening
          </h2>
          <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">
            Project: {project?.title || 'N/A'}
            {screening.screening_date && (
              <span className="ml-4">
                Screening Date: {formatDate(screening.screening_date, { day: 'numeric' })}
              </span>
            )}
          </p>
        </div>
        <Badge
          variant={
            screening.status === 'approved'
              ? 'success'
              : screening.status === 'rejected'
                ? 'error'
                : 'warning'
          }
          size="lg"
        >
          {statusInfo.label}
        </Badge>
      </div>

      {/* Officer Info & Project Components */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-semibold text-text-secondary dark:text-gray-400 mb-2">
            Program Officer
          </p>
          <p className="text-text-main dark:text-white">{officer?.name || 'N/A'}</p>
          <p className="text-sm text-text-secondary dark:text-gray-400">
            {officer?.job_title?.title_name ||
              (officer?.role ? ROLE_LABELS[officer.role] : null) ||
              'Program Officer'}
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-text-secondary dark:text-gray-400 mb-2">
            Project Components
          </p>
          <div className="flex flex-wrap gap-2">
            {project?.project_component
              ?.split(',')
              .slice(0, 3)
              .map((component, index) => (
                <Badge key={index} variant="default" size="sm">
                  {component.trim()}
                </Badge>
              ))}
          </div>
        </div>
      </div>

      {/* Risk Category Card */}
      {categoryInfo && (
        <Card>
          <Card.Body>
            <div
              className={cn(
                'p-6 rounded-lg border-2',
                categoryInfo.bgColor,
                categoryInfo.borderColor
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn('flex-shrink-0 p-3 rounded-lg', 'bg-white/50 dark:bg-black/20')}>
                  <Icon name="shield" size="xl" className={categoryInfo.textColor} />
                </div>
                <div className="flex-1">
                  <h3 className={cn('text-xl font-bold mb-2', categoryInfo.textColor)}>
                    CATEGORY {screening.category_code}: {categoryInfo.label}
                  </h3>
                  <p className="text-sm text-text-secondary dark:text-gray-400 mb-4">
                    {categoryInfo.description}
                  </p>
                  <div className="border-t border-current/20 pt-4 mt-4">
                    <p className="text-sm font-semibold mb-2">Justification:</p>
                    <p className="text-sm text-text-main dark:text-white">
                      {screening.category_reason}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Impacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Negative Impacts */}
        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <Icon name="warning" size="sm" className="text-red-600 dark:text-red-400" />
              <Card.Title>Potential Negative Impacts</Card.Title>
            </div>
          </Card.Header>
          <Card.Body>
            {negativeItems.length > 0 ? (
              <ul className="space-y-2">
                {negativeItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-600 dark:text-red-400 mt-1">•</span>
                    <span className="text-sm text-text-main dark:text-white">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-text-secondary dark:text-gray-400">None specified</p>
            )}
          </Card.Body>
        </Card>

        {/* Positive Impacts */}
        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <Icon name="check_circle" size="sm" className="text-green-600 dark:text-green-400" />
              <Card.Title>Potential Positive Impacts</Card.Title>
            </div>
          </Card.Header>
          <Card.Body>
            {positiveItems.length > 0 ? (
              <ul className="space-y-2">
                {positiveItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-1">•</span>
                    <span className="text-sm text-text-main dark:text-white">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-text-secondary dark:text-gray-400">None specified</p>
            )}
          </Card.Body>
        </Card>
      </div>
    </div>
  )
}

export default ScreeningSummaryCard
