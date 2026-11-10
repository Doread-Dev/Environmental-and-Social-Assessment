/**
 * IndicatorDataRow Component
 * One indicator row with editable fields
 */

import RankingSelect from './RankingSelect'
import ResponsibleSelect from '@/components/semp/ResponsibleSelect'
import { Input, Textarea } from '@/components/ui'

/**
 * @param {Object} props
 * @param {Object} props.indicator - The indicator
 * @param {Object} props.record - The monitoring record
 * @param {string} [props.categoryCode] - The indicator's category code
 * @param {number} [props.questionNumber] - Question number within the category
 * @param {Function} props.onUpdateScore - Sets a quarter's value (quarter, value) => void
 * @param {Function} props.onUpdateField - Sets a field (field, value) => void
 * @param {boolean} [props.isEditable] - Editable
 * @param {Array} [props.users] - Users for the Responsibility column
 */
function IndicatorDataRow({
  indicator,
  record,
  categoryCode,
  questionNumber,
  onUpdateScore,
  onUpdateField,
  isEditable = true,
  users = [],
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
    <tr className="group border-b border-border-default dark:border-border-dark hover:bg-background dark:hover:bg-white/5 transition-colors">
      {/* Indicator Name */}
      <td className="sticky left-0 z-20 px-4 py-3 text-sm text-text-main dark:text-white font-medium whitespace-normal min-w-[280px] max-w-[360px] bg-surface dark:bg-card-dark group-hover:bg-white dark:group-hover:bg-card-dark">
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
            <Input
              size="sm"
              type="text"
              value={record.scores[quarter] || ''}
              onChange={(e) => handleScoreChange(quarter, e.target.value)}
              placeholder={quarter === 'baseline' ? 'Baseline' : quarter}
              aria-label={quarter === 'baseline' ? 'Baseline' : quarter}
              inputClassName="text-center"
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
          <Input
            size="sm"
            type="text"
            value={record.total || ''}
            onChange={(e) => handleFieldChange('total', e.target.value)}
            placeholder="Total"
            aria-label="Total"
            inputClassName="font-medium text-center"
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
          <Input
            size="sm"
            value={record.final_assessment || ''}
            onChange={(e) => handleFieldChange('final_assessment', e.target.value)}
            placeholder="Final assessment"
            aria-label="Final assessment"
            inputClassName="text-left"
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
            value={record.ranking || ''}
            onChange={(value) => handleFieldChange('ranking', value)}
            categoryCode={categoryCode}
            questionNumber={questionNumber}
          />
        ) : (
          <span className="text-sm text-text-main dark:text-white capitalize text-center block">
            {record.ranking || '—'}
          </span>
        )}
      </td>

      {/* Responsibility */}
      <td className="px-3 py-3 min-w-[160px]">
        <ResponsibleSelect
          value={record.responsible}
          valueText={record.responsible_text}
          onChange={({ responsible, responsible_text }) => {
            handleFieldChange('responsible', responsible)
            handleFieldChange('responsible_text', responsible_text)
          }}
          users={users}
          readOnly={!isEditable}
          className="w-full"
        />
      </td>

      {/* Note */}
      <td className="px-3 py-3 min-w-[180px]">
        {isEditable ? (
          <Textarea
            rows={2}
            value={record.note || ''}
            onChange={(e) => handleFieldChange('note', e.target.value)}
            placeholder="Additional notes..."
            aria-label="Note"
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
