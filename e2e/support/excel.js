// Reads the Excel files the app exports (ExcelJS, the same library the app writes them with).
import ExcelJS from 'exceljs'

export async function readWorkbook(path) {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(path)
  return workbook
}

export const sheetNames = (workbook) => workbook.worksheets.map((ws) => ws.name)

/** Plain text of a cell (rich text joined). */
export function cellText(cell) {
  const value = cell.value
  if (value == null) return ''
  if (typeof value === 'object' && Array.isArray(value.richText)) {
    return value.richText.map((part) => part.text).join('')
  }
  if (typeof value === 'object' && 'text' in value) return String(value.text)
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

/** Every cell of the sheet whose text contains `text`. */
export function cellsWith(worksheet, text) {
  const found = []
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    row.eachCell({ includeEmpty: false }, (cell) => {
      if (cellText(cell).includes(text)) found.push(cell)
    })
  })
  return found
}

/** The YYYY-MM-DD date the browser puts into export names (its local date, D67 d). */
export function browserDate(page) {
  return page.evaluate(() => {
    const d = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  })
}

/** Clicks `trigger` and returns { name, path } of the file the page saves. */
export async function download(page, trigger) {
  const waiting = page.waitForEvent('download')
  await trigger()
  const file = await waiting
  return { name: file.suggestedFilename(), path: await file.path() }
}
