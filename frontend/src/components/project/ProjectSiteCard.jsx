/**
 * ProjectSiteCard Component
 * بطاقة موقع المشروع مع الخريطة
 * مطابق للتصميم الأصلي حرفياً
 * 
 * Features:
 * - خريطة في الأعلى (h-32)
 * - زر expand في الزاوية اليمنى العلوية
 * - معلومات الموقع في الأسفل
 */

import { cn } from '@/utils/cn'

/**
 * @param {Object} props
 * @param {string} props.location - اسم الموقع
 * @param {string} props.areaName - اسم المنطقة
 * @param {string} props.areaSize - مساحة المنطقة
 * @param {string} props.mapImageUrl - رابط صورة الخريطة
 * @param {Function} props.onExpand - callback عند توسيع الخريطة
 */
function ProjectSiteCard({
  location,
  areaName,
  areaSize,
  mapImageUrl,
  onExpand,
  className,
  ...props
}) {
  // Default map image (from original design)
  const defaultMapUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKNswRifGe553I-4ZkFsJp3RO9QCXaCSg0YD1ROiW5ZtRoeFxiuvbn-V1dJMisN1gkPPzhF1-zdsgiHhketRNEh1C7nnLtsKm2Kd2F2oauZkGuYEBZchhwR-nU3v3c8kSwrBLSCAUizFR75EWB92cP0aqkZ48yYQAGcBBWRfVcT4fVVKICKMcwUTgRqrqNxdvtIQCEzjCgtPfgzpiGjku0VhqDpe-00-tXlW7xf74oP9HZLaZVrWImehUjA0XgOKV1_LUuDE8sF5I8'

  return (
    <div
      className={cn(
        'bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-border-default dark:border-border-dark overflow-hidden flex flex-col',
        className
      )}
      {...props}
    >
      {/* Map Image */}
      <div className="h-32 bg-gray-200 relative">
        <div
          className="w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${mapImageUrl || defaultMapUrl})` }}
        ></div>
        {onExpand && (
          <div
            onClick={onExpand}
            className="absolute top-2 right-2 bg-white/90 dark:bg-black/50 p-1 rounded shadow-sm cursor-pointer hover:bg-white transition-colors"
          >
            <span className="material-symbols-outlined text-text-main dark:text-gray-200 text-sm">open_in_full</span>
          </div>
        )}
      </div>

      {/* Location Info */}
      <div className="p-4">
        <h4 className="text-sm font-bold text-text-main dark:text-white mb-1">Project Site Area</h4>
        {areaName && (
          <p className="text-xs text-text-secondary dark:text-gray-400 mb-3">{areaName}</p>
        )}
        {areaSize && (
          <div className="flex items-center gap-2 text-xs text-text-secondary dark:text-gray-400">
            <span className="material-symbols-outlined text-[16px]">straighten</span>
            <span>{areaSize}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectSiteCard
