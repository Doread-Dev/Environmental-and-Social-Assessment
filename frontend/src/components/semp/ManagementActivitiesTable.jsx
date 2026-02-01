/**
 * ManagementActivitiesTable
 * Updated: Fixed text direction and floating delete button position
 */

import { useState, useRef } from 'react'
import { cn } from '@/utils/cn'
import EditableCell from './EditableCell'
import ResponsibleSelect from './ResponsibleSelect'
import { mockUsers } from '@/data'

export default function ManagementActivitiesTable({
  activities,
  onUpdate,
  onDelete,
  onAddRow,
  users = mockUsers,
  readOnly = false
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
      height: rect.height
    })
    setHoveredRowId(rowId)
  }

  const handleMouseLeaveContainer = () => {
    setHoveredRowId(null)
  }

  return (
    <div 
      className="relative flex-1 flex flex-col w-full h-full pr-12" // Added padding-right to make space for the button
      ref={tableContainerRef}
      onMouseLeave={handleMouseLeaveContainer}
    >
      
      {/* Floating Delete Button */}
      {hoveredRowId && hoveredRowRect && !readOnly && (
        <button
          onClick={() => onDelete(hoveredRowId)}
          className="absolute z-50 right-2 flex items-center justify-center size-8 rounded-full bg-red-100 text-red-500 hover:bg-red-200 hover:text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 shadow-sm border border-red-200 dark:border-red-800 transition-all active:scale-95"
          style={{
            top: hoveredRowRect.top + (hoveredRowRect.height / 2) - 16 // Center vertically
          }}
          title="Delete Row"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      )}

      <div className="border border-border-default dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark shadow-sm flex flex-col overflow-hidden w-full h-full"> 
        
        {/* Scrollable Table Area */}
        <div className="flex-1 overflow-auto excel-scroll w-full">
          <table className="w-full border-collapse table-fixed min-w-[1200px]">
            <thead className="sticky top-0 z-30 shadow-sm bg-gray-100 dark:bg-[#15231a]">
              <tr className="border-b border-border-default dark:border-border-dark">
                <th className="w-12 px-2 py-3 text-xs font-bold text-text-secondary dark:text-gray-300 uppercase tracking-wider text-center border-r border-border-default dark:border-border-dark relative group">#</th>
                <th className="w-[30%] px-3 py-3 text-xs font-bold text-text-secondary dark:text-gray-300 uppercase tracking-wider text-center border-r border-border-default dark:border-border-dark relative group">Activity Description</th>
                <th className="w-[20%] px-3 py-3 text-xs font-bold text-text-secondary dark:text-gray-300 uppercase tracking-wider text-center border-r border-border-default dark:border-border-dark relative group">Potential Impact / Risk</th>
                <th className="w-[20%] px-3 py-3 text-xs font-bold text-text-secondary dark:text-gray-300 uppercase tracking-wider text-center border-r border-border-default dark:border-border-dark relative group">Recommended Action Items</th>
                <th className="w-[15%] px-3 py-3 text-xs font-bold text-text-secondary dark:text-gray-300 uppercase tracking-wider text-center border-r border-border-default dark:border-border-dark relative group">Monitoring Requirements</th>
                <th className="w-[150px] px-3 py-3 text-xs font-bold text-text-secondary dark:text-gray-300 uppercase tracking-wider text-center border-r border-border-default dark:border-border-dark relative group">Responsibility</th>
                <th className="w-[150px] px-3 py-3 text-xs font-bold text-text-secondary dark:text-gray-300 uppercase tracking-wider text-center border-r border-border-default dark:border-border-dark relative group">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default dark:divide-border-dark bg-white dark:bg-surface-dark">
              {activities.map((activity, index) => (
                <tr 
                  key={activity._id}
                  className="group transition-colors hover:bg-gray-50/30 dark:hover:bg-white/5"
                  onMouseEnter={(e) => handleMouseEnterRow(e, activity._id)}
                >
                  {/* Serial Number */}
                  <td className="bg-gray-50 dark:bg-[#0d1b12] text-center text-xs text-text-secondary dark:text-gray-400 font-medium border-r border-border-default dark:border-border-dark select-none relative">
                    {index + 1}
                  </td>

                  {/* Activity Description */}
                  <td className="p-0 border-r border-border-default dark:border-border-dark relative h-full">
                    <EditableCell
                      value={activity.activity_description}
                      onChange={(val) => onUpdate(activity._id, 'activity_description', val)}
                      placeholder=""
                      readOnly={readOnly}
                      multiline
                      className="excel-cell text-sm text-text-main dark:text-gray-100"
                    />
                  </td>

                  {/* Potential Impact */}
                  <td className="p-0 border-r border-border-default dark:border-border-dark relative h-full">
                    <EditableCell
                      value={activity.potential_impact}
                      onChange={(val) => onUpdate(activity._id, 'potential_impact', val)}
                      placeholder=""
                      readOnly={readOnly}
                      multiline
                      className="excel-cell text-sm text-text-main dark:text-gray-100"
                    />
                  </td>

                  {/* Recommended Actions */}
                  <td className="p-0 border-r border-border-default dark:border-border-dark relative h-full">
                    <EditableCell
                      value={activity.recommended_actions}
                      onChange={(val) => onUpdate(activity._id, 'recommended_actions', val)}
                      placeholder=""
                      readOnly={readOnly}
                      multiline
                      className="excel-cell text-sm text-text-main dark:text-gray-100"
                    />
                  </td>

                  {/* Monitoring Requirements */}
                  <td className="p-0 border-r border-border-default dark:border-border-dark relative h-full">
                    <EditableCell
                      value={activity.monitoring_requirements}
                      onChange={(val) => onUpdate(activity._id, 'monitoring_requirements', val)}
                      placeholder=""
                      readOnly={readOnly}
                      multiline
                      className="excel-cell text-sm text-text-main dark:text-gray-100"
                    />
                  </td>

                  {/* Responsibility */}
                  <td className="p-0 border-r border-border-default dark:border-border-dark relative h-full">
                    <ResponsibleSelect
                      value={activity.responsible}
                      onChange={(val) => onUpdate(activity._id, 'responsible', val)}
                      users={users}
                      readOnly={readOnly}
                      className="excel-cell text-sm text-text-main dark:text-gray-100 bg-transparent w-full h-full text-center"
                    />
                  </td>

                  {/* Notes */}
                  <td className="p-0 border-r border-border-default dark:border-border-dark relative h-full">
                    <EditableCell
                      value={activity.notes}
                      onChange={(val) => onUpdate(activity._id, 'notes', val)}
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
          <div className="bg-gray-50 dark:bg-[#15231a] border-t border-border-default dark:border-border-dark p-2 w-full z-20 shrink-0">
            <button
              onClick={onAddRow}
              className="w-full py-2 bg-white dark:bg-white/5 border border-dashed border-border-default dark:border-border-dark rounded text-primary text-sm font-bold hover:bg-green-50 dark:hover:bg-green-900/10 hover:border-primary transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-xl">add</span>
              Add another row
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
