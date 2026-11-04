/**
 * Workbooks built from the official sheets (D52, D67): one tool per file, or the project
 * workbook with a sheet per tool that has data, in the official order (Tool 1 → Tool 5).
 * Every sheet carries its tool's status and the export date in the printed footer, every file
 * name the status (one tool) or the date (D67 d).
 */

import ExcelJS from 'exceljs'
import { addTool1Sheet } from './tool1Sheet'
import { addTool2Sheet } from './tool2Sheet'
import { addTool3Sheet, addTool4Sheet } from './tool34Sheets'
import { addTool5Sheet } from './tool5Sheet'
import { exportStatus, projectFileName, setExportFooter, toolFileName } from './exportMeta'

export function createWorkbook(date = new Date()) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'AKF Syria – ESMS'
  workbook.created = date
  workbook.modified = date
  // Excel recalculates the official formulas (Tool 2 counts) when the file opens
  workbook.calcProperties.fullCalcOnLoad = true
  return workbook
}

const ADD_SHEET = {
  tool1: (wb, d) => addTool1Sheet(wb, d),
  tool2: (wb, d) => addTool2Sheet(wb, d),
  tool3: (wb, d) => addTool3Sheet(wb, d.rows),
  tool4: (wb, d) => addTool4Sheet(wb, d.rows),
  tool5: (wb, d) => addTool5Sheet(wb, d),
}

/**
 * One tool in its own file.
 * @param {'tool1'|'tool2'|'tool3'|'tool4'|'tool5'} tool
 * @param {Object} data - What the tool's sheet builder takes (+ `project`)
 * @param {Object} options
 * @param {string} options.status - Label from exportStatus()
 * @param {Date} [options.date]
 * @returns {{ workbook: import('exceljs').Workbook, fileName: string }}
 */
export function buildToolWorkbook(tool, data, { status, date = new Date() }) {
  const workbook = createWorkbook(date)
  const ws = ADD_SHEET[tool](workbook, data)
  setExportFooter(ws, tool, status, date)
  return { workbook, fileName: toolFileName(tool, data.project?.title, status, date) }
}

/**
 * The project workbook (D67 b): a sheet per tool that has data, in the official order.
 * @param {Object} data
 * @param {Object} data.project
 * @param {Object} data.workflow - Workspace workflow (statuses for the footers)
 * @param {Object|null} data.screening
 * @param {Object} data.assessment - { assessment, methods, consultations, impactScores }
 * @param {Array} data.management
 * @param {Array} data.mitigation
 * @param {Array} data.records - Monitoring records
 * @param {Array} data.categoriesWithQuestions
 * @param {Array} data.categoriesWithIndicators
 * @param {Date} [date]
 * @returns {{ workbook: import('exceljs').Workbook, fileName: string, tools: string[] }}
 */
export function buildProjectWorkbook(data, date = new Date()) {
  const { project, workflow, screening, management = [], mitigation = [], records = [] } = data
  const tool2 = data.assessment ?? {}
  const sheets = [
    ['tool1', !!screening, { project, screening }],
    [
      'tool2',
      !!tool2.assessment,
      { project, screening, ...tool2, categoriesWithQuestions: data.categoriesWithQuestions },
    ],
    ['tool3', management.length > 0, { project, rows: management }],
    ['tool4', mitigation.length > 0, { project, rows: mitigation }],
    [
      'tool5',
      records.length > 0,
      {
        project,
        screening,
        assessment: tool2.assessment,
        records,
        categoriesWithIndicators: data.categoriesWithIndicators,
      },
    ],
  ]

  const workbook = createWorkbook(date)
  const tools = []
  sheets.forEach(([tool, hasData, sheetData]) => {
    if (!hasData) return
    const record = tool === 'tool1' ? screening : tool === 'tool2' ? tool2.assessment : null
    const ws = ADD_SHEET[tool](workbook, sheetData)
    setExportFooter(ws, tool, exportStatus(workflow, tool, record), date)
    tools.push(tool)
  })
  return { workbook, fileName: projectFileName(project?.title, date), tools }
}
