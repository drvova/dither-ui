import { describe, expect, it } from "rstack/test"
import { createArtboard } from "../src/entities/artboard/model/factory"
import { normalizeArtboard } from "../src/entities/artboard/model/normalize"
import type { Artboard } from "../src/entities/artboard/model/types"
import { componentEntry, sanitizeComponentProps } from "../src/entities/widget/model/registry"
import { createWidget } from "../src/entities/widget/model/factory"
import { safeUrl } from "../src/shared/lib/routes"

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

describe("URLs a document carries (href, src)", () => {
  const SCRIPTS = [
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    " javascript:alert(1)",
    "java\tscript:alert(1)",
    "java\nscript:alert(1)",
    "\u0001javascript:alert(1)",
    "vbscript:msgbox(1)",
    "data:text/html,<script>alert(1)</script>",
    "data:image/svg+xml,<svg onload=alert(1)>",
  ]
  it("keeps http(s), mailto, raster data images and relative paths", () => {
    for (const u of [
      "https://dither-ui.com/docs",
      "http://x.test",
      "mailto:a@b.c",
      "/faces.webp",
      "#top",
      "docs/x",
      "?q=1",
    ])
      expect(safeUrl(u)).toBe(true)
    expect(safeUrl("data:image/png;base64,AAAA")).toBe(true)
  })
  it("refuses a script URL however it is spelled", () => {
    for (const u of SCRIPTS) expect(safeUrl(u)).toBe(false)
  })
  it("never lets one into a component's href or src", () => {
    for (const is of ["DitherLink", "DitherExternalLink"]) {
      const entry = componentEntry(is)!
      for (const u of SCRIPTS) expect(sanitizeComponentProps(entry, { href: u }).href).not.toBe(u)
    }
    const thumb = componentEntry("DitherThumbnail")!
    const out = sanitizeComponentProps(thumb, { src: "javascript:alert(1)", href: "javascript:alert(1)" })
    expect(out.src).toBe("/sprites.webp")
    expect(out.href).toBe("https://dither-ui.com/docs")
  })
  it("pins a portal to the page body", () => {
    expect(sanitizeComponentProps(componentEntry("DitherPortal")!, { to: "#app" }).to).toBe("body")
  })
  it("clears a script URL from an image or an avatar's picture", () => {
    const img = crafted((j) => (j.widget = { ...createWidget("image"), src: "javascript:alert(1)" }))
    expect((normalizeArtboard(img).widget as { src: string }).src).toBe("")
    const face = crafted((j) => (j.widget = { ...createWidget("avatar"), imageSrc: "data:text/html,x" }))
    expect((normalizeArtboard(face).widget as { imageSrc: string }).imageSrc).toBe("")
  })
})

describe("normalizeArtboard keeps every shape the editors write", () => {
  it("a custom glow, a seeded or custom texture and a cubic-bezier easing survive a reload", () => {
    const glow = { blur: 6, brightness: 1.8, opacity: 0.5, saturate: 2, blend: "screen" }
    const texture = { ramp: 0.4, density: 0.2, gaps: true, hatch: 4 }
    const a = crafted((j) => {
      j.chart.bloom = glow
      j.chart.easing = [0.2, 1.4, 0.4, 1]
      j.chart.series[0].variant = texture
      if (j.chart.series[1]) j.chart.series[1].variant = 42
    })
    const n = normalizeArtboard(JSON.parse(JSON.stringify(a)))
    expect(n.chart.bloom).toEqual(glow)
    expect(n.chart.easing).toEqual([0.2, 1.4, 0.4, 1])
    expect(n.chart.series[0].variant).toEqual(texture)
    if (n.chart.series[1]) expect(n.chart.series[1].variant).toBe(42)
  })
  it("holds their numbers in range and drops what is not theirs", () => {
    const a = crafted((j) => {
      j.chart.bloom = { blur: 1e9, brightness: "x", opacity: -1, onload: "alert(1)" }
      j.chart.easing = [5, 0, -3, 1]
      j.chart.series[0].variant = { ramp: 9, hatch: 1, evil: "x" }
    })
    const n = normalizeArtboard(a)
    expect(n.chart.bloom).toEqual({ blur: 64, brightness: 1.35, opacity: 0 })
    expect(n.chart.easing).toEqual([1, 0, 0, 1])
    expect(n.chart.series[0].variant).toEqual({ ramp: 2, hatch: 0 })
  })
  it("a widget's custom glow survives too", () => {
    const glow = { blur: 4, brightness: 1.2, opacity: 0.6 }
    const a = crafted((j) => (j.widget = { ...createWidget("button"), bloom: glow }))
    expect((normalizeArtboard(a).widget as { bloom: unknown }).bloom).toEqual(glow)
  })
})
