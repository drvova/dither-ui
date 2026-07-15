import { describe, expect, it } from "vitest"
import { createArtboard } from "../src/entities/artboard/model/factory"
import { normalizeArtboard } from "../src/entities/artboard/model/normalize"
import type { Artboard } from "../src/entities/artboard/model/types"
import { componentEntry, sanitizeComponentProps } from "../src/entities/widget/model/registry"

/** Craft an artboard the way a malicious/tampered project file would. */
const crafted = (mutate: (json: any) => void): Artboard => {
  const json = JSON.parse(JSON.stringify(createArtboard("area")))
  mutate(json)
  return json as Artboard
}

describe("sanitizeComponentProps (the v-bind whitelist)", () => {
  const entry = componentEntry("DitherSwitch")!
  it("drops undeclared keys — innerHTML / event handlers never reach v-bind", () => {
    const out = sanitizeComponentProps(entry, {
      color: "blue",
      innerHTML: "<img src=x onerror=alert(1)>",
      onClick: "alert(1)",
      onVnodeMounted: "x",
      style: "position:fixed",
    })
    expect(Object.keys(out).sort()).toEqual(["color", "disabled"])
  })
  it("coerces wrong types to spec defaults and clamps numbers", () => {
    const slider = componentEntry("DitherSlider")!
    const out = sanitizeComponentProps(slider, {
      color: { evil: true },
      min: "NaN",
      max: 10 ** 9,
      step: -5,
      disabled: "yes",
    })
    expect(out.color).toBe("blue")
    expect(out.min).toBe(0)
    expect(out.step).toBeGreaterThanOrEqual(0.1)
    expect(out.disabled).toBe(false)
  })
  it("select values outside the options fall back", () => {
    const badge = componentEntry("DitherBadge")!
    const out = sanitizeComponentProps(badge, { variant: "onload" })
    expect(out.variant).toBe("gradient")
  })
})

describe("normalizeArtboard as sanitiser", () => {
  it("scrubs __proto__/constructor own-keys everywhere", () => {
    const a = crafted((j) => {
      j.chart.series[0]["__proto__"] = { polluted: true }
      j["constructor"] = { evil: 1 }
    })
    const n = normalizeArtboard(a)
    expect(Object.prototype.hasOwnProperty.call(n.chart.series[0], "__proto__")).toBe(false)
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
  it("replaces wrong-TYPED values, not just missing ones", () => {
    const a = crafted((j) => {
      j.chart.animationDuration = "900; alert(1)"
      j.chart.margins = "not-an-object"
      j.chart.innerRadius = "0.5"
    })
    const n = normalizeArtboard(a)
    expect(n.chart.animationDuration).toBe(900)
    expect(n.chart.margins.top).toBe(10)
    expect(n.chart.innerRadius).toBe(0.5)
  })
  it("forces enum fields onto their allowlists (bloom preset lookup crash)", () => {
    const a = crafted((j) => {
      j.chart.bloom = "evil-preset"
      j.chart.stackType = "hax"
      j.chart.type = "not-a-chart"
    })
    const n = normalizeArtboard(a)
    expect(n.chart.bloom).toBe("low")
    expect(n.chart.stackType).toBe("default")
    expect(n.chart.type).toBe("area")
  })
  it("component widgets: unknown `is` is removed; props are whitelisted", () => {
    const evil = crafted((j) => {
      j.widget = { kind: "component", is: "cssColor", props: {} }
    })
    expect(normalizeArtboard(evil).widget).toBeUndefined()

    const smuggled = crafted((j) => {
      j.widget = {
        kind: "component",
        is: "DitherSwitch",
        props: { innerHTML: "<script>x</script>", color: "pink" },
        slotText: 42,
      }
    })
    const n = normalizeArtboard(smuggled)
    if (n.widget?.kind !== "component") throw new Error("unreachable")
    expect("innerHTML" in n.widget.props).toBe(false)
    expect(n.widget.props.color).toBe("pink")
    expect(n.widget.slotText).toBeNull()
  })
  it("screen cells: unknown components dropped, rows enum-checked", () => {
    const a = crafted((j) => {
      j.widget = {
        kind: "screen",
        gap: "wide",
        padding: 20,
        rows: [
          {
            id: 1,
            align: "onmouseover",
            justify: "between",
            gap: "x",
            cells: [
              { id: "c1", is: "DitherKbd", props: { innerHTML: "x" }, slotText: "ok", grow: "yes" },
              { id: "c2", is: "NotAComponent", props: {} },
              "garbage",
            ],
          },
          null,
        ],
      }
    })
    const n = normalizeArtboard(a)
    if (n.widget?.kind !== "screen") throw new Error("unreachable")
    expect(n.widget.gap).toBe(16)
    expect(n.widget.rows).toHaveLength(1)
    const row = n.widget.rows[0]
    expect(row.align).toBe("center")
    expect(row.justify).toBe("between")
    expect(row.gap).toBe(12)
    expect(row.cells).toHaveLength(1)
    expect(row.cells[0].is).toBe("DitherKbd")
    expect("innerHTML" in row.cells[0].props).toBe(false)
    expect(row.cells[0].grow).toBe(false)
  })
  it("unknown widget kinds are removed entirely", () => {
    const a = crafted((j) => {
      j.widget = { kind: "totally-new-thing", payload: "x" }
    })
    expect(normalizeArtboard(a).widget).toBeUndefined()
  })
})
