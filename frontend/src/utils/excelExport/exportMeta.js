/**
 * What every export carries so a draft never passes for an approved document (D67 d): the
 * tool's status and the export date, in the file name and in the printed page footer — never
 * inside the official sheet area.
 */

export const TOOLS = {
  tool1: { number: 1, name: 'Tool 1', title: 'Screening' },
  tool2: { number: 2, name: 'Tool 2', title: 'Assessment' },
  tool3: { number: 3, name: 'Tool 3', title: 'Management activities' },
  tool4: { number: 4, name: 'Tool 4', title: 'Mitigation plan' },
  tool5: { number: 5, name: 'Tool 5', title: 'Monitoring' },
}

const REVIEW_LABELS = {
  approved: 'Approved',
  submitted: 'Submitted',
  rejected: 'Rejected',
}

/**
 * Status label of a tool for its export, from the workspace workflow (D30):
 * Tools 1–2 → Draft / Submitted / Approved / Rejected; Tools 3–5 → In progress / Completed.
 * @param {Object} workflow - `workflow` of GET /projects/:id/workspace
 * @param {'tool1'|'tool2'|'tool3'|'tool4'|'tool5'} tool
 * @param {Object} [record] - Screening/assessment, used when no workflow is at hand
 * @returns {string}
 */
export function exportStatus(workflow, tool, record) {
  const steps = workflow?.steps ?? {}
  if (tool === 'tool1' || tool === 'tool2') {
    const status = steps[tool === 'tool1' ? 'screening' : 'assessment']?.status ?? record?.status
    // "in_progress" is the workflow's name for a draft screening/assessment
    return REVIEW_LABELS[status] ?? 'Draft'
  }
  const status =
    tool === 'tool3'
      ? steps.semp?.management_activities?.status
      : tool === 'tool4'
        ? steps.semp?.mitigation_plans?.status
        : steps.monitoring?.status
  return status === 'completed' ? 'Completed' : 'In progress'
}

/** Local date as YYYY-MM-DD */
export function isoDate(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Project title as a file-name part (Latin and Arabic letters, digits, dashes) */
export function fileNamePart(text, fallback = 'Project') {
  const part = String(text ?? '')
    .replace(/[^a-zA-Z0-9\s؀-ۿ-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 50)
    .replace(/^[_-]+|[_-]+$/g, '')
  return part || fallback
}

/**
 * File name of a one-tool export: `Tool2_<project>_Draft_2026-11-04.xlsx`
 * @param {string} tool - tool1..tool5
 * @param {string} projectTitle
 * @param {string} status - Label from exportStatus()
 * @param {Date} [date]
 */
export function toolFileName(tool, projectTitle, status, date = new Date()) {
  const statusPart = status.replace(/\s+(\w)/g, (_, c) => c.toUpperCase())
  return `Tool${TOOLS[tool].number}_${fileNamePart(projectTitle)}_${statusPart}_${isoDate(date)}.xlsx`
}

/** File name of the project workbook (D67 b): `ESMS_<project>_2026-11-04.xlsx` */
export function projectFileName(projectTitle, date = new Date()) {
  return `ESMS_${fileNamePart(projectTitle)}_${isoDate(date)}.xlsx`
}

/**
 * Printed page footer of a sheet: tool and status left, export date centre, page right.
 * `&` starts a code in Excel footers, so it is doubled in the text.
 * @param {import('exceljs').Worksheet} ws
 * @param {string} tool - tool1..tool5
 * @param {string} status
 * @param {Date} [date]
 */
export function setExportFooter(ws, tool, status, date = new Date()) {
  const text = (value) => String(value).replace(/&/g, '&&')
  const footer = `&L${text(`${TOOLS[tool].name} – ${status}`)}&C${text(`Exported ${isoDate(date)}`)}&RPage &P of &N`
  ws.headerFooter.oddFooter = footer
  ws.headerFooter.evenFooter = footer
}
