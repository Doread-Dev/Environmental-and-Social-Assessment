/**
 * ProjectMetricCard Component
 * بطاقة مقياس المشروع (Risk Level, Activities, Timeframe)
 * مطابق للتصميم الأصلي حرفياً
 * 
 * Features:
 * - الأيقونة في الأعلى مع label صغير
 * - القيمة كبيرة (text-2xl)
 * - subtitle صغير
 */

import { cn } from '@/utils/cn'

/**
 * @param {Object} props
 * @param {string} props.title - عنوان المقياس
 * @param {string|number} props.value - القيمة
 * @param {string} props.subtitle - نص فرعي
 * @param {string} props.icon - اسم الأيقونة
 * @param {string} props.iconBgColor - لون خلفية الأيقونة
 * @param {string} props.iconColor - لون الأيقونة
 */
function ProjectMetricCard({
  title,
  value,
  subtitle,
  icon,
  iconBgColor = 'bg-primary/10',
  iconColor = 'text-primary',
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-surface-dark p-5 rounded-xl border border-border-default dark:border-gray-800 shadow-sm flex flex-col gap-3',
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between">
        {/* Icon */}
        {icon && (
          <div className={cn('p-2 rounded-lg', iconBgColor)}>
            <span className={cn('material-symbols-outlined', iconColor)}>{icon}</span>
          </div>
        )}
        {/* Title Label */}
        <span className="text-xs font-medium text-text-secondary dark:text-gray-400">{title}</span>
      </div>

      {/* Value and Subtitle */}
      <div>
        <h4 className="text-2xl font-bold text-text-main dark:text-white">{value}</h4>
        {subtitle && (
          <p className="text-sm text-text-secondary dark:text-gray-400">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

export default ProjectMetricCard
