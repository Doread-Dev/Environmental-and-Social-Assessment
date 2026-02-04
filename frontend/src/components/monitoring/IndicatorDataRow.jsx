/**
 * IndicatorDataRow Component
 * صف واحد للمؤشر مع حقول قابلة للتعديل
 */

import RankingSelect from './RankingSelect'

/**
 * @param {Object} props
 * @param {Object} props.indicator - بيانات المؤشر
 * @param {Object} props.record - سجل المراقبة
 * @param {string} [props.categoryCode] - كود الفئة للمؤشر
 * @param {number} [props.questionNumber] - رقم السؤال داخل الفئة
 * @param {Function} props.onUpdateScore - تحديث قيمة ربع سنوية (quarter, value) => void
 * @param {Function} props.onUpdateField - تحديث حقل (field, value) => void
 * @param {boolean} [props.isEditable] - قابل للتعديل
 */
function IndicatorDataRow({
  indicator,
  record,
  categoryCode,
  questionNumber,
  onUpdateScore,
  onUpdateField,
  isEditable = true,
}) {
  const quarters = ['baseline', 'Q1', 'Q2', 'Q3', 'Q4']

  const handleScoreChange = (quarter, value) => {
    if (onUpdateScore) {
      onUpdateScore(quarter, value)
    }
  }

  const handleFieldChange = (field, value) => {
    if (onUpdateField) {
      onUpdateField(field, value)
    }
  }

  return (
    <tr className="group border-b border-border-default dark:border-border-dark hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
      {/* Indicator Name */}
      <td className="sticky left-0 z-20 px-4 py-3 text-sm text-text-main dark:text-white font-medium whitespace-normal min-w-[280px] max-w-[360px] bg-white dark:bg-[#152a1d] group-hover:bg-white dark:group-hover:bg-[#152a1d]">
        <div className="flex flex-col gap-1">
          <p className="font-medium">{indicator.name}</p>
          {indicator.definition && (
            <p className="text-xs text-text-secondary dark:text-gray-400">{indicator.definition}</p>
          )}
        </div>
      </td>

      {/* Measurement */}
      <td className="px-4 py-3 text-sm text-text-secondary dark:text-gray-400 min-w-[160px]">
        {indicator.measurement || '—'}
      </td>

      {/* Quarter Scores */}
      {quarters.map((quarter) => (
        <td key={quarter} className="px-3 py-3 min-w-[100px]">
          {isEditable ? (
            <input
              type="text"
              value={record.scores[quarter] || ''}
              onChange={(e) => handleScoreChange(quarter, e.target.value)}
              placeholder={quarter === 'baseline' ? 'Baseline' : quarter}
              className="w-full rounded-lg border border-border-default dark:border-border-dark bg-white dark:bg-[#102216] text-text-main dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary px-3 py-2 text-sm text-center"
            />
          ) : (
            <span className="text-sm text-text-main dark:text-white text-center block">
              {record.scores[quarter] || '—'}
            </span>
          )}
        </td>
      ))}

      {/* Total */}
      <td className="px-3 py-3 min-w-[100px]">
        {isEditable ? (
          <input
            type="text"
            value={record.total || ''}
            onChange={(e) => handleFieldChange('total', e.target.value)}
            placeholder="Total"
            className="w-full rounded-lg border border-border-default dark:border-border-dark bg-white dark:bg-[#102216] text-text-main dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary px-3 py-2 text-sm font-medium text-center"
          />
        ) : (
          <span className="text-sm text-text-main dark:text-white font-medium text-center block">
            {record.total || '—'}
          </span>
        )}
      </td>

      {/* Final Assessment */}
      <td className="px-3 py-3 min-w-[160px]">
        {isEditable ? (
          <input
            value={record.final_assessment || ''}
            onChange={(e) => handleFieldChange('final_assessment', e.target.value)}
            placeholder="Final assessment"
            className="w-full rounded-lg border border-border-default dark:border-border-dark bg-white dark:bg-[#102216] text-text-main dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary px-3 py-2 text-sm text-left"
          />
        ) : (
          <span className="text-sm text-text-main dark:text-white">
            {record.final_assessment || '—'}
          </span>
        )}
      </td>

      {/* Ranking */}
      <td className="px-3 py-3 min-w-[160px]">
        {isEditable ? (
          <RankingSelect
            value={record.ranking || 'not_applicable'}
            onChange={(value) => handleFieldChange('ranking', value)}
            categoryCode={categoryCode}
            questionNumber={questionNumber}
          />
        ) : (
          <span className="text-sm text-text-main dark:text-white capitalize text-center block">
            {record.ranking || 'N/A'}
          </span>
        )}
      </td>

      {/* Note */}
      <td className="px-3 py-3 min-w-[180px]">
        {isEditable ? (
          <textarea
            value={record.note || ''}
            onChange={(e) => handleFieldChange('note', e.target.value)}
            placeholder="Additional notes..."
            className="w-full rounded-lg border border-border-default dark:border-border-dark bg-white dark:bg-[#102216] text-text-main dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary px-3 py-2 text-sm"
          />
        ) : (
          <span className="text-sm text-text-secondary dark:text-gray-400">
            {record.note || '—'}
          </span>
        )}
      </td>
    </tr>
  )
}

export default IndicatorDataRow
