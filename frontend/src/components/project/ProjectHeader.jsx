/**
 * ProjectHeader Component
 * رأس المشروع مع معلومات أساسية
 * مطابق للتصميم الأصلي حرفياً
 * 
 * Features:
 * - عنوان المشروع مع badge الحالة في نفس السطر
 * - الموقع والتاريخ مع bullet separator
 * - أعضاء الفريق (Avatars) مع ring-2
 * - زر Edit Project
 */

import { Badge } from '@/components/ui'
import { formatDateFull } from '@/utils/formatters'
import { cn } from '@/utils/cn'

/**
 * @param {Object} props
 * @param {Object} props.project - بيانات المشروع
 * @param {boolean} props.showEditButton - عرض زر التعديل (default: true)
 * @param {Function} props.onEdit - callback عند النقر على التعديل
 */
function ProjectHeader({ project, showEditButton = true, onEdit, className, ...props }) {
  if (!project) return null

  const location = project.location || ''
  const startDate = project.start_date || project.startDate
  const endDate = project.end_date || project.endDate

  // Format dates
  const dateRange = startDate && endDate 
    ? `${formatDateFull(startDate)} – ${formatDateFull(endDate)}`
    : ''

  // Mock team members (في الإنتاج سيأتي من API)
  const teamMembers = [
    { 
      name: 'Sarah Jenkins', 
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBnJ7KMMEeDrkrClHJvzDA6F8CcyWeJa8Nd_LabfS4-18_aFOo2O2s2yUaT03kx6m4e8QfUO4wYJ7iH2L78msiBa0RTfpYiOVjuhma_yOHR7yEC4zBo4TgGdXENHPk_W195HbHCfn5fg_2LszT0-IsQwAeoseBW1YZ43mf5NLrqgYBKww63_cUbsdw3Wu0q79xyMbsIMkXVoWHvbrHm80q_h9l_oJAVPGap5PVVvuEnzeY7a20xGAmeyAt4oxnP-Qi0MOQq0qJMnneS'
    },
    { 
      name: 'Ahmed Hassan', 
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBYW0-01iKSUKJx86bx_5HDgCP88w5yx5gl0aF2fi0mBp9qBrefO168ijIsMCigiuenLJv214QsfK0oUkwPnPOFT66tVePqAp70CGbIlCP6Uj41SZDE_S1cL7h1YDIRN8r83repPvy3FBtPeZ-DNX3hSsANHcf4HU3vl6JHuWNnYd4eQ3ezqs8MgRLUjoER4nib-E7XquwSkpibYyvdtaq3tQGJDBJO4GDOzPSS9jUKVC9cFoEm-luc46g5cxKfd65sDFcF9JfcN_r1'
    },
    { 
      name: 'Maria Santos', 
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCIE2m9hVs07N0VxPXG1vvQJXvdfzA_t2iqOCWMT-6P060FyHsMMLS_X5KILwiRXTF2TEd2k08T98XQSSx8z_TF_Czkv6tTLdu_G5cZ3Lg3yFJrzq0LkG6hm0hSu84AGsJHmCvJetyfZr8xDnX1tCAmR9MuJVn1AcHf5GCEJcUPbyQ8e4UAlk4m1u-3zcU225ieymf8eSFXa0eTL0004DftKCqAvNRzfIhu_QvNoVaY2cNnuZlBeNN--DS63UfgrwY-BtiPp_t5DsQT'
    },
  ]

  return (
    <div className={cn('flex flex-col md:flex-row justify-between items-start md:items-center gap-6', className)} {...props}>
      {/* Left Section */}
      <div className="flex flex-col gap-2">
        {/* Title with Badge */}
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-text-main dark:text-white">
            {project.title || project.name}
          </h1>
          <Badge variant="success" size="sm" className="bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
            Active
          </Badge>
        </div>

        {/* Location and Date */}
        <div className="flex items-center gap-4 text-text-secondary dark:text-gray-400 text-sm">
          {location && (
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">location_on</span>
              {location}
            </span>
          )}
          {dateRange && (
            <>
              <span className="w-1 h-1 bg-border-default dark:bg-gray-600 rounded-full"></span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                {dateRange}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right Section - Team Avatars and Edit Button */}
      <div className="flex items-center gap-4">
        {/* Team Avatars */}
        <div className="flex -space-x-2 overflow-hidden p-1">
          {teamMembers.slice(0, 3).map((member, index) => (
            <img
              key={index}
              alt={member.name}
              className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-surface-dark object-cover"
              src={member.avatar}
            />
          ))}
          {teamMembers.length > 3 && (
            <div className="h-8 w-8 rounded-full ring-2 ring-white dark:ring-surface-dark bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
              +{teamMembers.length - 3}
            </div>
          )}
        </div>

        {/* Edit Button */}
        {showEditButton && (
          <button
            onClick={onEdit}
              className="bg-white dark:bg-surface-dark border border-border-default dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-white/5 text-text-main dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            Edit Project
          </button>
        )}
      </div>
    </div>
  )
}

export default ProjectHeader
