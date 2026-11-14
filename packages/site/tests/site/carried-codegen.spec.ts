// The Studio's code export for a screen, a registry component and a reel.
import { describe, expect, it } from "vitest"
import { createArtboard, normalizeArtboard } from "@/entities/artboard"
import { addCell, addScreenRow, componentEntry, createComponent, createScreen } from "@/entities/widget"
import { widgetCode } from "@/entities/widget/model/codegen"

const entry = (is: string) => componentEntry(is)!
const frame = { w: 380, h: 560 }

describe("screen codegen", () => {
  it("emits a flex layout with one signal per model cell", () => {
    const s = createScreen()
    addCell(s.rows[0], entry("DitherInput"))
    const sw = addCell(s.rows[0], entry("DitherSwitch"))
    sw.model = false
    const row2 = addScreenRow(s)
    addCell(row2, entry("DitherBadge"))
    const code = widgetCode(s, frame)
    expect(code).toContain('import { DitherBadge, DitherInput, DitherSwitch } from "@dither-kit"')
    expect(code).toContain('const [value1, setValue1] = createSignal("")')
    expect(code).toContain("const [value2, setValue2] = createSignal(false)")
    expect(code).toContain("modelValue={value1()} onUpdateModelValue={setValue1}")
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

describe("component codegen", () => {
  it("defaults are written as the canvas binds them, off and empty ones left out", () => {
    const code = widgetCode(createComponent(entry("DitherSwitch")), frame)
    expect(code).toContain('import { DitherSwitch } from "@dither-kit"')
    expect(code).toContain("modelValue={value()} onUpdateModelValue={setValue}")
    expect(code).toContain("const [value, setValue] = createSignal(true)")
    expect(code).toContain('color="blue" label="Notifications"')
    expect(code).not.toContain("disabled") // off at its default: the kit reads it unset
  })

  it("non-defaults emit typed attributes", () => {
    const w = createComponent(entry("DitherSlider"))
    w.props.color = "#ff00aa"
    w.props.max = 10
    const code = widgetCode(w, frame)
    expect(code).toContain('color="#ff00aa"')
    expect(code).toContain("max={10}")
  })

  it("list props emit mapped object literals", () => {
    const w = createComponent(entry("DitherSelect"))
    w.props.options = ["Yes", "No"]
    expect(widgetCode(w, frame)).toContain('options={[{"value":"yes","label":"Yes"}, {"value":"no","label":"No"}]}')
  })

  it("slot text lands between the tags", () => {
    const w = createComponent(entry("DitherBadge"))
    w.slotText = "new"
    expect(widgetCode(w, frame)).toContain(">new</DitherBadge>")
  })
})

describe("a reel's export", () => {
  it("lists its cut as a comment: each clip, its seconds and how it comes in", () => {
    const short = createArtboard("button")
    short.widget = {
      kind: "reel",
      clips: [{ id: "z", seconds: 0.5, transition: { kind: "wipe-up", seconds: 3, cell: 2, seed: 4 } }],
    } as unknown as typeof short.widget
    normalizeArtboard(short)
    if (short.widget?.kind !== "reel") throw new Error("unreachable")
    expect(widgetCode(short.widget, { w: 100, h: 100 })).toContain("z — 0.5s, in by wipe-up over 0.5s")
  })
})
