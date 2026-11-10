/**
 * MitigationPlanTable
 * Updated: Fixed text direction and floating delete button position
 */

import { useState, useRef } from 'react'
import EditableCell from './EditableCell'
import ResponsibleSelect from './ResponsibleSelect'

export default function MitigationPlanTable({
  plans,
  onUpdate,
  onDelete,
  onAddRow,
  users = [],
  readOnly = false,
}) {
  const [hoveredRowId, setHoveredRowId] = useState(null)
  const [hoveredRowRect, setHoveredRowRect] = useState(null)
  const tableContainerRef = useRef(null)

  const handleMouseEnterRow = (e, rowId) => {
    if (readOnly) return
    const rect = e.currentTarget.getBoundingClientRect()
    const containerRect = tableContainerRef.current.getBoundingClientRect()

    // Calculate relative position
    setHoveredRowRect({
      top: rect.top - containerRect.top,
      height: rect.height,
    })
    setHoveredRowId(rowId)
  }

  const handleMouseLeaveContainer = () => {
    setHoveredRowId(null)
  }

  return (
    <div
      className="relative flex-1 flex flex-col w-full h-full pr-12" // Added padding-right
      ref={tableContainerRef}
      onMouseLeave={handleMouseLeaveContainer}
    >
      {/* Floating Delete Button */}
      {hoveredRowId && hoveredRowRect && !readOnly && (
        <button
          onClick={() => onDelete(hoveredRowId)}
          className="absolute z-50 right-2 flex items-center justify-center size-8 rounded-full bg-red-100 text-red-500 hover:bg-red-200 hover:text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 shadow-sm border border-red-200 dark:border-red-800 transition-all active:scale-95"
          style={{
            top: hoveredRowRect.top + hoveredRowRect.height / 2 - 16, // Center vertically
          }}
          title="Delete Row"
        >
          <span className="material-symbols-outlined text-lg" aria-hidden="true">
            close
          </span>
        </button>
      )}

      <div className="border border-border-default dark:border-border-dark rounded-lg bg-surface dark:bg-surface-dark shadow-sm flex flex-col overflow-hidden w-full h-full">
        {/* Scrollable Table Area */}
        <div className="flex-1 overflow-auto excel-scroll w-full">
          <table className="w-full border-collapse table-fixed min-w-[1400px]">
            <thead className="sticky top-0 z-30 shadow-sm bg-background dark:bg-card-dark">
              <tr className="border-b border-border-default dark:border-border-dark">
                <th className="w-12 px-2 py-3 text-xs font-bold text-text-secondary dark:text-gray-300 uppercase tracking-wider text-center border-r border-border-default dark:border-border-dark relative group">
                  #
                </th>
                <th className="w-[20%] px-3 py-3 text-xs font-bold text-text-secondary dark:text-gray-300 uppercase tracking-wider text-center border-r border-border-default dark:border-border-dark relative group">
                  Output / Activity Description
                </th>
                <th className="w-[20%] px-3 py-3 text-xs font-bold text-text-secondary dark:text-gray-300 uppercase tracking-wider text-center border-r border-border-default dark:border-border-dark relative group">
                  Potential Impact - Significance/Risk
                </th>
                <th className="w-[20%] px-3 py-3 text-xs font-bold text-text-secondary dark:text-gray-300 uppercase tracking-wider text-center border-r border-border-default dark:border-border-dark relative group">
                  Mitigation & Enhancement measures
                </th>
                <th className="w-[15%] px-3 py-3 text-xs font-bold text-text-secondary dark:text-gray-300 uppercase tracking-wider text-center border-r border-border-default dark:border-border-dark relative group">
                  Monitoring
                </th>
                <th className="w-[190px] px-3 py-3 text-xs font-bold text-text-secondary dark:text-gray-300 uppercase tracking-wider text-center border-r border-border-default dark:border-border-dark relative group">
                  Responsibility
                </th>
                <th className="w-[150px] px-3 py-3 text-xs font-bold text-text-secondary dark:text-gray-300 uppercase tracking-wider text-center border-r border-border-default dark:border-border-dark relative group">
                  Schedule
                </th>
                <th className="w-[150px] px-3 py-3 text-xs font-bold text-text-secondary dark:text-gray-300 uppercase tracking-wider text-center border-r border-border-default dark:border-border-dark relative group">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default dark:divide-border-dark bg-surface dark:bg-surface-dark">
              {plans.map((plan, index) => (
                <tr
                  key={plan._id}
                  className="group transition-colors hover:bg-background dark:hover:bg-white/5"
                  onMouseEnter={(e) => handleMouseEnterRow(e, plan._id)}
                >
                  {/* Serial Number */}
                  <td className="bg-background dark:bg-background-dark text-center text-xs text-text-secondary dark:text-gray-400 font-medium border-r border-border-default dark:border-border-dark select-none relative">
                    {index + 1}
                  </td>

                  {/* Output Description */}
                  <td className="p-0 border-r border-border-default dark:border-border-dark relative h-full">
                    <EditableCell
                      value={plan.output_description}
                      onChange={(val) => onUpdate(plan._id, 'output_description', val)}
                      placeholder=""
                      readOnly={readOnly}
                      multiline
                      className="excel-cell text-sm text-text-main dark:text-white"
                    />
                  </td>

                  {/* Potential Impact */}
                  <td className="p-0 border-r border-border-default dark:border-border-dark relative h-full">
                    <EditableCell
                      value={plan.potential_impact_and_significance}
                      onChange={(val) =>
                        onUpdate(plan._id, 'potential_impact_and_significance', val)
                      }
                      placeholder=""
                      readOnly={readOnly}
                      multiline
                      className="excel-cell text-sm text-text-main dark:text-white"
                    />
                  </td>

                  {/* Mitigation Measures */}
                  <td className="p-0 border-r border-border-default dark:border-border-dark relative h-full">
                    <EditableCell
                      value={plan.mitigation_and_enhancement_measures}
                      onChange={(val) =>
                        onUpdate(plan._id, 'mitigation_and_enhancement_measures', val)
                      }
                      placeholder=""
                      readOnly={readOnly}
                      multiline
                      className="excel-cell text-sm text-text-main dark:text-white"
                    />
                  </td>

                  {/* Monitoring */}
                  <td className="p-0 border-r border-border-default dark:border-border-dark relative h-full">
                    <EditableCell
                      value={plan.monitoring}
                      onChange={(val) => onUpdate(plan._id, 'monitoring', val)}
                      placeholder=""
                      readOnly={readOnly}
                      multiline
                      className="excel-cell text-sm text-text-main dark:text-white"
                    />
                  </td>

                  {/* Responsibility */}
                  <td className="p-0 border-r border-border-default dark:border-border-dark relative h-full">
                    <ResponsibleSelect
                      value={plan.responsible}
                      valueText={plan.responsible_text}
                      onChange={({ responsible, responsible_text }) => {
                        onUpdate(plan._id, 'responsible', responsible)
                        onUpdate(plan._id, 'responsible_text', responsible_text)
                      }}
                      users={users}
                      readOnly={readOnly}
                      className="excel-cell text-sm text-text-main dark:text-white bg-transparent w-full h-full text-center"
                    />
                  </td>

                  {/* Schedule */}
                  <td className="p-0 border-r border-border-default dark:border-border-dark relative h-full">
                    <EditableCell
                      value={plan.schedule}
                      onChange={(val) => onUpdate(plan._id, 'schedule', val)}
                      placeholder=""
                      readOnly={readOnly}
                      className="excel-cell text-sm text-text-main dark:text-white"
                    />
                  </td>

                  {/* Notes */}
                  <td className="p-0 border-r border-border-default dark:border-border-dark relative h-full">
                    <EditableCell
                      value={plan.notes}
                      onChange={(val) => onUpdate(plan._id, 'notes', val)}
                      placeholder=""
                      readOnly={readOnly}
                      multiline
                      className="excel-cell text-xs italic text-text-secondary dark:text-gray-400"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Row Button Area */}
        {!readOnly && (
          <div className="bg-background dark:bg-card-dark border-t border-border-default dark:border-border-dark p-2 w-full z-20 shrink-0">
            <button
              onClick={onAddRow}
              className="w-full py-2 bg-surface dark:bg-white/5 border border-dashed border-border-default dark:border-border-dark rounded text-primary text-sm font-bold hover:bg-green-50 dark:hover:bg-green-900/10 hover:border-primary transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-xl" aria-hidden="true">
                add
              </span>
              Add another row
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
