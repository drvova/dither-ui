import { describe, expect, it } from "rstack/test"
import { widgetCode } from "../src/entities/widget/model/codegen"
import { createWidget } from "../src/entities/widget/model/factory"

const frame = { w: 280, h: 280 }

describe("widget factory", () => {
  it("creates each kind with its discriminant", () => {
    expect(createWidget("avatar").kind).toBe("avatar")
    expect(createWidget("button").kind).toBe("button")
    expect(createWidget("gradient").kind).toBe("gradient")
  })
})

describe("widgetCode", () => {
  it("avatar defaults stay minimal (name + size only)", () => {
    const code = widgetCode(createWidget("avatar"), frame)
    expect(code).toContain("DitherAvatar")
    expect(code).toContain('name="Ada Lovelace"')
    expect(code).toContain(':size="280"')
    expect(code).not.toContain(":grid=")
    expect(code).not.toContain("mirror=")
  })
  it("avatar non-defaults emit", () => {
    const a = createWidget("avatar")
    if (a.kind !== "avatar") throw new Error("unreachable")
    a.grid = 12
    a.density = 0.2
    a.mirror = "vertical"
    a.autoColor = false
    a.color = "#7cbf87"
    const code = widgetCode(a, frame)
    expect(code).toContain(':grid="12"')
    expect(code).toContain(':density="0.2"')
    expect(code).toContain('mirror="vertical"')
    expect(code).toContain('color="#7cbf87"')
  })
  it("button label lands in the slot; custom bloom emits an object", () => {
    const b = createWidget("button")
    if (b.kind !== "button") throw new Error("unreachable")
    b.label = "Deploy"
    b.bloom = { blur: 5, brightness: 1.5, opacity: 0.78, saturate: 1.5 }
    const code = widgetCode(b, frame)
    expect(code).toContain(">Deploy</DitherButton>")
    expect(code).toContain(":bloom='{ blur: 5, brightness: 1.5, opacity: 0.78, saturate: 1.5 }'")
  })
  it("gradient two-tone emits from + to", () => {
    const g = createWidget("gradient")
    if (g.kind !== "gradient") throw new Error("unreachable")
    g.twoTone = true
    g.to = "#ff00aa"
    g.direction = "down"
    const code = widgetCode(g, frame)
    expect(code).toContain('from="blue"')
    expect(code).toContain('to="#ff00aa"')
    expect(code).toContain('direction="down"')
  })
})
