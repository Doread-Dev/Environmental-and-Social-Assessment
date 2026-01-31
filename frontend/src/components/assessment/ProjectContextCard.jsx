/**
 * ProjectContextCard Component
 * بطاقة سياق المشروع في الشريط الجانبي
 */

import { cn } from '@/utils/cn'
import { formatDate } from '@/utils/formatters'

/**
 * @param {Object} props
 * @param {Object} props.project - بيانات المشروع
 * @param {Object} props.screening - بيانات الفرز
 * @param {string} props.mapImage - صورة الخريطة
 */
export default function ProjectContextCard({
  project,
  screening,
  mapImage,
  className,
  ...props
}) {
  // Default map image
  const defaultMapUrl =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA3PLvg1KO7dlEosUayyEmmgHo4dTFMXGfq2ssXneKSxcbeNVtxLYyHV05WG2eMJAMnna490Cgoz_TmoMpQKOX1xNbpC1q0lb0SlgS2ZWR65-7sR4AesYd9XVMUr72-hRBwaXk4-jVWHAa60xp8QsdYBrTcPg5Myr37ZlyTXtwHzGnyFzmp96BMg2MsvQFS_yMetAPnqIfRtWYjV1MgJrwsn7snhEbD4efy5H5KoyQNf6Iqm4qUNdV6mwe55Ty1whB_dPf_JaNSTNDJ'

  // Get approver name from screening
  const approverName = screening?.approved_by?.name || 'N/A'

  return (
    <div
      className={cn(
        'bg-white dark:bg-surface-dark rounded-xl border border-border-default dark:border-border-dark p-5 shadow-sm',
        className
      )}
      {...props}
    >
      <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">
        Project Context
      </h3>

      {/* Map Image */}
      <div className="aspect-video w-full rounded-lg bg-gray-100 mb-4 overflow-hidden relative">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${mapImage || defaultMapUrl})` }}
        ></div>
      </div>

      {/* Project Info */}
      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-border-default dark:border-border-dark">
          <span className="text-sm text-text-secondary">Project Title</span>
          <span className="text-sm font-medium text-text-main dark:text-white">
            {project?.title || 'N/A'}
          </span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-border-default dark:border-border-dark">
          <span className="text-sm text-text-secondary">Location</span>
          <span className="text-sm font-medium text-text-main dark:text-white">
            {project?.location || 'N/A'}
          </span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-border-default dark:border-border-dark">
          <span className="text-sm text-text-secondary">Start Date</span>
          <span className="text-sm font-medium text-text-main dark:text-white">
            {project?.start_date ? formatDate(project.start_date) : 'N/A'}
          </span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-border-default dark:border-border-dark">
          <span className="text-sm text-text-secondary">End Date</span>
          <span className="text-sm font-medium text-text-main dark:text-white">
            {project?.end_date ? formatDate(project.end_date) : 'N/A'}
          </span>
        </div>

        <div className="flex flex-col justify-center items-start gap-2">
          <span className="text-sm text-text-secondary">Screening Approved By</span>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center font-bold">
              {approverName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-text-main dark:text-white">
              {approverName}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
