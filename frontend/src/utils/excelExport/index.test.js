// Phase 12 (D76 3): exportTool / exportProjectWorkbook build the workbook, save it once as an
// .xlsx blob under the builder's file name and return that name.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { saveBlob } from '../saveBlob'
import { buildProjectWorkbook, buildToolWorkbook } from './workbooks'
import { exportProjectWorkbook, exportTool } from './index'

vi.mock('../saveBlob', () => ({ saveBlob: vi.fn() }))
vi.mock('./workbooks', () => ({ buildToolWorkbook: vi.fn(), buildProjectWorkbook: vi.fn() }))

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const built = (fileName) => ({
  fileName,
  workbook: { xlsx: { writeBuffer: vi.fn(async () => new Uint8Array([80, 75, 3, 4])) } },
})

beforeEach(() => vi.clearAllMocks())

describe('excel exports', () => {
  it('exportTool passes the tool, data and status to the builder and saves the file', async () => {
    buildToolWorkbook.mockReturnValue(built('Tool3_Water_Completed_2026-11-06.xlsx'))
    const data = { project: { title: 'Water' }, rows: [] }

    const name = await exportTool('tool3', data, 'Completed')

    expect(buildToolWorkbook).toHaveBeenCalledWith('tool3', data, { status: 'Completed' })
    expect(name).toBe('Tool3_Water_Completed_2026-11-06.xlsx')
    expect(saveBlob).toHaveBeenCalledTimes(1)
    const [blob, fileName] = saveBlob.mock.calls[0]
    expect(fileName).toBe(name)
    expect(blob.type).toBe(XLSX)
    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(new Uint8Array([80, 75, 3, 4]))
  })

  it('exportProjectWorkbook saves the project workbook', async () => {
    buildProjectWorkbook.mockReturnValue(built('ESMS_Water_2026-11-06.xlsx'))
    const data = { project: { title: 'Water' } }

    const name = await exportProjectWorkbook(data)

    expect(buildProjectWorkbook).toHaveBeenCalledWith(data)
    expect(name).toBe('ESMS_Water_2026-11-06.xlsx')
    expect(saveBlob).toHaveBeenCalledWith(expect.any(Blob), 'ESMS_Water_2026-11-06.xlsx')
  })

  it('saves nothing when the workbook cannot be written', async () => {
    const failing = built('x.xlsx')
    failing.workbook.xlsx.writeBuffer.mockRejectedValue(new Error('disk full'))
    buildToolWorkbook.mockReturnValue(failing)

    await expect(exportTool('tool1', {}, 'Draft')).rejects.toThrow('disk full')
    expect(saveBlob).not.toHaveBeenCalled()
  })
})
