/**
 * Excel exports in this repo's own layouts, complete for each tool (D68), one tool per file or
 * the project workbook (D67 b). Loaded on demand
 * (`await import('@/utils/excelExport')`), so ExcelJS stays in its own chunk.
 */

import { saveBlob } from '../saveBlob'
import { buildProjectWorkbook, buildToolWorkbook } from './workbooks'

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

async function save({ workbook, fileName }) {
  const buffer = await workbook.xlsx.writeBuffer()
  saveBlob(new Blob([buffer], { type: XLSX }), fileName)
  return fileName
}

/**
 * Export one tool in its official sheet.
 * @param {'tool1'|'tool2'|'tool3'|'tool4'|'tool5'} tool
 * @param {Object} data - The tool's data (see workbooks.js)
 * @param {string} status - Label from exportStatus()
 * @returns {Promise<string>} File name
 */
export const exportTool = (tool, data, status) => save(buildToolWorkbook(tool, data, { status }))

/**
 * Export the project workbook: a sheet per tool that has data (D67 b).
 * @param {Object} data - See buildProjectWorkbook()
 * @returns {Promise<string>} File name
 */
export const exportProjectWorkbook = (data) => save(buildProjectWorkbook(data))

export { buildProjectWorkbook, buildToolWorkbook } from './workbooks'
export { exportStatus, projectFileName, toolFileName } from './exportMeta'
