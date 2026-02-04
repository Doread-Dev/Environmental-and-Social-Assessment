/**
 * SempCTABanner Component
 * Updated to match 16.ESM Plan Overview.html design
 */

export default function SempCTABanner({
  title,
  description,
  buttonText = 'Coming soon',
  // In static HTML this button is just informational "Coming soon" or similar unless we want action
}) {
  return (
    <div className="bg-gradient-to-r from-[#102216] to-background-dark dark:from-primary/20 dark:to-primary/5 rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md border border-border-dark dark:border-primary/20">
      <div className="flex items-start gap-4">
        <div className="flex items-center p-3 bg-primary rounded-full text-white shadow-lg shadow-primary/30 shrink-0">
          <span className="material-symbols-outlined fill text-2xl">bolt</span>
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-white text-lg font-bold">{title}</h3>
          <p className="text-gray-300 dark:text-gray-200 text-sm max-w-xl leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <div className="shrink-0 whitespace-nowrap bg-white/10 dark:bg-black/10 text-text-disabled px-5 py-3 rounded-lg font-bold text-sm backdrop-blur-sm border border-white/10 flex items-center gap-2 cursor-not-allowed transition-colors ">
        {/* Static icon for info/status */}
        <span className="material-symbols-outlined text-lg">date_range</span>
        {buttonText}
      </div>
    </div>
  )
}
