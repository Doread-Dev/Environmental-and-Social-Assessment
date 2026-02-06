/**
 * MonitoringDataTable Component
 * جدول بيانات المراقبة (مطابق لـ MASTER_PLAN)
 */

import IndicatorDataRow from '@/components/monitoring/IndicatorDataRow'

/**
 * @param {Object} props
 * @param {Array} props.data - بيانات المؤشرات مع السجلات [{indicator, record}]
 * @param {Function} props.onUpdateScore - تحديث قيمة ربع سنوية (recordId, quarter, value) => void
 * @param {Function} props.onUpdateField - تحديث حقل (recordId, field, value) => void
 * @param {boolean} [props.isEditable] - قابل للتعديل
 * @param {string} [props.categoryCode] - كود الفئة
 * @param {string} [props.categoryName] - اسم الفئة
 * @param {Array} [props.users] - قائمة المستخدمين للعمود Responsibility
 */
function MonitoringDataTable({
  data = [],
  onUpdateScore,
  onUpdateField,
  isEditable = true,
  categoryCode,
  categoryName,
  users = [],
}) {
  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-[#152a1d] rounded-xl shadow-sm border border-border-default dark:border-border-dark p-8">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-text-secondary dark:text-gray-500 mb-3 block">
            inventory_2
          </span>
          <p className="text-text-secondary dark:text-gray-400">
            No monitoring indicators found for this category
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#152a1d] rounded-b-xl rounded-t-none shadow-sm border border-border-default dark:border-border-dark overflow-hidden">
      {/* Header */}
      {(categoryCode || categoryName) && (
        <div className="px-6 py-4 border-b border-border-default dark:border-border-dark bg-gray-50/50 dark:bg-white/5">
          <div className="flex items-center gap-3">
            {categoryCode && (
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                {categoryCode}
              </div>
            )}
            <h3 className="font-bold text-base text-text-main dark:text-white">{categoryName}</h3>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="monitoring-table-container w-full">
        <table className="w-full monitoring-table">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-border-default dark:border-border-dark">
              <th className="sticky left-0 z-30 px-4 py-3 text-left text-xs font-bold text-text-main dark:text-white uppercase tracking-wider bg-gray-50/50 dark:bg-white/5 min-w-[280px]">
                Indicator Definition
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-text-main dark:text-white uppercase tracking-wider min-w-[160px]">
                Measurement
              </th>
              <th className="px-3 py-3 text-center text-xs font-bold text-text-main dark:text-white uppercase tracking-wider min-w-[100px]">
                Baseline
              </th>
              <th className="px-3 py-3 text-center text-xs font-bold text-text-main dark:text-white uppercase tracking-wider min-w-[100px]">
                Q1
              </th>
              <th className="px-3 py-3 text-center text-xs font-bold text-text-main dark:text-white uppercase tracking-wider min-w-[100px]">
                Q2
              </th>
              <th className="px-3 py-3 text-center text-xs font-bold text-text-main dark:text-white uppercase tracking-wider min-w-[100px]">
                Q3
              </th>
              <th className="px-3 py-3 text-center text-xs font-bold text-text-main dark:text-white uppercase tracking-wider min-w-[100px]">
                Q4
              </th>
              <th className="px-3 py-3 text-center text-xs font-bold text-text-main dark:text-white uppercase tracking-wider min-w-[100px]">
                Total
              </th>
              <th className="px-3 py-3 text-left text-xs font-bold text-text-main dark:text-white uppercase tracking-wider min-w-[200px]">
                Final Assessment
              </th>
              <th className="px-3 py-3 text-center text-xs font-bold text-text-main dark:text-white uppercase tracking-wider min-w-[160px]">
                Ranking
              </th>
              <th className="px-3 py-3 text-center text-xs font-bold text-text-main dark:text-white uppercase tracking-wider min-w-[160px]">
                Responsibility
              </th>
              <th className="px-3 py-3 text-left text-xs font-bold text-text-main dark:text-white uppercase tracking-wider min-w-[180px]">
                Note
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => {
              // Use _id (MongoDB ObjectId) as primary, fallback to id for compatibility
              const indicatorId = item.indicator._id || item.indicator.id

              return (
              <IndicatorDataRow
                  key={indicatorId}
                indicator={item.indicator}
                record={item.record}
                categoryCode={item.indicator.categoryCode || item.indicator.code}
                questionNumber={index + 1}
                onUpdateScore={(quarter, value) => {
                  if (onUpdateScore) {
                    onUpdateScore(item.record._id, quarter, value, indicatorId)
                  }
                }}
                onUpdateField={(field, value) => {
                  if (onUpdateField) {
                    onUpdateField(item.record._id, field, value, indicatorId)
                  }
                }}
                isEditable={isEditable}
                users={users}
              />
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default MonitoringDataTable
