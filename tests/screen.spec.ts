import { describe, expect, it } from "vitest"
import { widgetCode } from "../src/entities/widget/model/codegen"
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
const frame = { w: 380, h: 560 }

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

describe("screen codegen", () => {
  it("emits a flex layout with one ref per v-model cell", () => {
    const s = createScreen()
    addCell(s.rows[0], entry("DitherInput"))
    const sw = addCell(s.rows[0], entry("DitherSwitch"))
    sw.model = false
    const row2 = addScreenRow(s)
    addCell(row2, entry("DitherBadge"))
    const code = widgetCode(s, frame)
    expect(code).toContain('import { DitherBadge, DitherInput, DitherSwitch } from "@dither-kit"')
    expect(code).toContain("const value1 = ref(\"\")")
    expect(code).toContain("const value2 = ref(false)")
    expect(code).toContain('v-model="value1"')
    expect(code).toContain(">beta</DitherBadge>")
    expect(code).toContain('class="flex flex-col" style="gap: 16px; padding: 20px"')
    expect(code).toContain("items-center justify-start")
  })
  it("grow cells get flex-1; non-default props emit", () => {
    const s = createScreen()
    const input = addCell(s.rows[0], entry("DitherInput"))
    input.grow = true
    input.props.placeholder = "Email"
    const code = widgetCode(s, frame)
    expect(code).toContain('class="flex-1"')
    expect(code).toContain('placeholder="Email"')
  })
})
