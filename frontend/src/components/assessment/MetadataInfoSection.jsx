/**
 * MetadataInfoSection Component
 * قسم معلومات المشروع والمسؤول (read-only)
 */

import { cn } from '@/utils/cn'
import { formatDate } from '@/utils/formatters'
import { Badge } from '@/components/ui'

/**
 * @param {Object} props
 * @param {Object} props.officer - بيانات المسؤول
 * @param {Object} props.project - بيانات المشروع
 * @param {string} props.screeningCategory - فئة الفرز
 */
export default function MetadataInfoSection({
  officer,
  project,
  screeningCategory,
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        'bg-gray-50 dark:bg-white/5 border-b border-border-color dark:border-white/10 p-6 md:p-8',
        className
      )}
      {...props}
    >
      <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-4">
        Project & Officer Details
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
        <div>
          <p className="text-text-secondary text-xs mb-1">Officer Name</p>
          <p className="text-text-main dark:text-white font-medium">
            {officer?.name || 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-text-secondary text-xs mb-1">Officer Position</p>
          <p className="text-text-main dark:text-white font-medium">
            {officer?.job_title?.title_name || officer?.position || 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-text-secondary text-xs mb-1">Category</p>
          {screeningCategory ? (
            <Badge variant="warning" className="text-xs">
              Category {screeningCategory}
            </Badge>
          ) : (
            <span className="text-text-main dark:text-white font-medium">N/A</span>
          )}
        </div>
        <div>
          <p className="text-text-secondary text-xs mb-1">Project (Activity) Start Date</p>
          <p className="text-text-main dark:text-white font-medium">
            {project?.start_date ? formatDate(project.start_date) : 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-text-secondary text-xs mb-1">Project (Activity) End Date</p>
          <p className="text-text-main dark:text-white font-medium">
            {project?.end_date ? formatDate(project.end_date) : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  )
}
