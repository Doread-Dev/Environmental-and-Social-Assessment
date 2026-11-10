/**
 * Workbooks: one tool per file, or the project workbook with a sheet per tool that has data,
 * Tool 1 → Tool 5 (D67 b). The sheets keep this repo's own layouts (D68). Every sheet carries
 * its tool's status and the export date in the printed footer, every file name the status
 * (one tool) or the date (D67 d).
 */

import ExcelJS from 'exceljs'
import { addScreeningSheet } from './screeningSheet'
import { addAssessmentSheet } from './assessmentSheet'
import { addManagementSheet, addMitigationSheet } from './sempSheets'
import { addMonitoringSheet } from './monitoringSheet'
import { exportStatus, projectFileName, setExportFooter, toolFileName } from './exportMeta'

export function createWorkbook(date = new Date()) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'AKF Syria'
  workbook.created = date
  workbook.modified = date
  return workbook
}

// Tools 3–5 have no status of their own: the sheet shows the workflow's
const ADD_SHEET = {
  tool1: (wb, d) => addScreeningSheet(wb, d),
  tool2: (wb, d) => addAssessmentSheet(wb, d),
  tool3: (wb, d, status) => addManagementSheet(wb, { ...d, status }),
  tool4: (wb, d, status) => addMitigationSheet(wb, { ...d, status }),
  tool5: (wb, d, status) => addMonitoringSheet(wb, { ...d, status }),
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
  const ws = ADD_SHEET[tool](workbook, data, status)
  setExportFooter(ws, tool, status, date)
  return { workbook, fileName: toolFileName(tool, data.project?.title, status, date) }
}

/**
 * The project workbook (D67 b): a sheet per tool that has data, Tool 1 → Tool 5.
 * @param {Object} data
 * @param {Object} data.project
 * @param {Object} data.workflow - Workspace workflow (statuses)
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
    const status = exportStatus(workflow, tool, record)
    const ws = ADD_SHEET[tool](workbook, sheetData, status)
    setExportFooter(ws, tool, status, date)
    tools.push(tool)
  })
  return { workbook, fileName: projectFileName(project?.title, date), tools }
}
