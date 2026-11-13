import { describe, expect, it } from "rstack/test"
import { componentEntry } from "../src/entities/widget/model/registry"
import {
  addCell,
  addScreenRow,
  createScreen,
  findCell,
  moveCell,
  moveScreenRow,
  removeCell,
  removeScreenRow,
} from "../src/entities/widget/model/screen"

const entry = (is: string) => componentEntry(is)!

describe("screen model ops", () => {
  it("creates with one empty row and grows", () => {
    const s = createScreen()
    expect(s.rows).toHaveLength(1)
    addScreenRow(s)
    expect(s.rows).toHaveLength(2)
  })
  it("adds/removes/finds cells", () => {
    const s = createScreen()
    const cell = addCell(s.rows[0], entry("DitherSwitch"))
    expect(findCell(s, cell.id)?.cell.is).toBe("DitherSwitch")
    removeCell(s, cell.id)
    expect(findCell(s, cell.id)).toBeUndefined()
  })
  it("reorders cells and rows with bounds guarding", () => {
    const s = createScreen()
    const a = addCell(s.rows[0], entry("DitherKbd"))
    const b = addCell(s.rows[0], entry("DitherBadge"))
    moveCell(s.rows[0], b.id, -1)
    expect(s.rows[0].cells.map((c) => c.id)).toEqual([b.id, a.id])
    moveCell(s.rows[0], b.id, -1) // already first — no-op
    expect(s.rows[0].cells[0].id).toBe(b.id)
    const r2 = addScreenRow(s)
    moveScreenRow(s, r2.id, -1)
    expect(s.rows[0].id).toBe(r2.id)
    removeScreenRow(s, r2.id)
    expect(s.rows).toHaveLength(1)
  })
})
