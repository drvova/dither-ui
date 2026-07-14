import { describe, expect, it } from "vitest"
import { widgetCode } from "../src/entities/widget/model/codegen"
import { createComponent } from "../src/entities/widget/model/factory"
import {
  COMPONENT_REGISTRY,
  componentEntry,
  defaultComponentProps,
} from "../src/entities/widget/model/registry"

const frame = { w: 200, h: 100 }

describe("component registry", () => {
  it("every entry has a unique export name and sane frame", () => {
    const names = COMPONENT_REGISTRY.map((e) => e.is)
    expect(new Set(names).size).toBe(names.length)
    for (const e of COMPONENT_REGISTRY) {
      expect(e.is).toMatch(/^Dither[A-Z]/)
      expect(e.frame.w).toBeGreaterThan(0)
      expect(e.frame.h).toBeGreaterThan(0)
    }
  })
  it("defaults come straight from the specs", () => {
    const entry = componentEntry("DitherSlider")!
    const props = defaultComponentProps(entry)
    expect(props.min).toBe(0)
    expect(props.max).toBe(100)
    expect(props.color).toBe("blue")
  })
  it("createComponent seeds slot + v-model from the entry", () => {
    const sw = createComponent(componentEntry("DitherSwitch")!)
    expect(sw.model).toBe(true)
    expect(sw.slotText).toBeNull()
    const badge = createComponent(componentEntry("DitherBadge")!)
    expect(badge.slotText).toBe("beta")
    expect(badge.model).toBeUndefined()
  })
  it("mapProps turns string lists into option/item shapes", () => {
    const sel = componentEntry("DitherSelect")!
    const mapped = sel.mapProps!({ options: ["Aa", "Bb"] })
    expect(mapped.options).toEqual([
      { value: "aa", label: "Aa" },
      { value: "bb", label: "Bb" },
    ])
  })
})

describe("component codegen", () => {
  it("defaults emit a minimal tag", () => {
    const w = createComponent(componentEntry("DitherSwitch")!)
    const code = widgetCode(w, frame)
    expect(code).toContain('import { DitherSwitch } from "@dither-kit"')
    expect(code).toContain('v-model="value"')
    expect(code).toContain("const value = ref(true)")
    expect(code).not.toContain("color=") // default stays silent
  })
  it("non-defaults emit typed attributes", () => {
    const w = createComponent(componentEntry("DitherSlider")!)
    w.props.color = "#ff00aa"
    w.props.max = 10
    const code = widgetCode(w, frame)
    expect(code).toContain('color="#ff00aa"')
    expect(code).toContain(':max="10"')
  })
  it("list props emit mapped object literals", () => {
    const w = createComponent(componentEntry("DitherSelect")!)
    w.props.options = ["Yes", "No"]
    const code = widgetCode(w, frame)
    expect(code).toContain(`:options='[{"value":"yes","label":"Yes"},{"value":"no","label":"No"}]'`)
  })
  it("slot text lands between the tags", () => {
    const w = createComponent(componentEntry("DitherBadge")!)
    w.slotText = "new"
    expect(widgetCode(w, frame)).toContain(">new</DitherBadge>")
  })
})
