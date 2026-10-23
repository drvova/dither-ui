import { describe, expect, it } from "rstack/test"
import { chartCode } from "../src/entities/chart/model/codegen"
import { createChart, defaultEasing, setChartType } from "../src/entities/chart/model/factory"
import { addRow, addSeries, removeRow, renamePieSlice } from "../src/entities/chart/model/rows"

describe("factory", () => {
  it("seeds rows per family and reseeds on family change", () => {
    const c = createChart("area")
    expect(c.rows.length).toBeGreaterThan(0)
    const cartesianRows = c.rows.length
    setChartType(c, "pie")
    expect(c.rows[0]).toHaveProperty("name")
    expect(c.rows.length).not.toBe(cartesianRows)
  })
  it("keeps a deliberate easing across type change, follows defaults otherwise", () => {
    const c = createChart("area")
    expect(c.easing).toBe("ease-in-out")
    setChartType(c, "bar")
    expect(c.easing).toBe(defaultEasing("bar")) // followed the new default
    const custom = createChart("area")
    custom.easing = [0.3, 0.1, 0.7, 0.9]
    setChartType(custom, "bar")
    expect(custom.easing).toEqual([0.3, 0.1, 0.7, 0.9]) // user choice kept
  })
})

describe("rows ops", () => {
  it("addSeries: unique key, zero-filled values", () => {
    const c = createChart("area")
    const before = c.series.length
    addSeries(c)
    expect(c.series.length).toBe(before + 1)
    const key = c.series.at(-1)!.key
    expect(c.rows.every((r) => r[key] === 0)).toBe(true)
    addSeries(c)
    const keys = c.series.map((s) => s.key)
    expect(new Set(keys).size).toBe(keys.length)
  })
  it("addRow (cartesian): label + zeros", () => {
    const c = createChart("area")
    const n = c.rows.length
    addRow(c)
    expect(c.rows.length).toBe(n + 1)
    expect(c.rows.at(-1)!.desktop).toBe(0)
  })
  it("pie: addRow registers a slice series; removeRow removes it", () => {
    const c = createChart("pie")
    const rows = c.rows.length
    const series = c.series.length
    addRow(c)
    expect(c.rows.length).toBe(rows + 1)
    expect(c.series.length).toBe(series + 1)
    expect(c.series.at(-1)!.key).toBe(c.rows.at(-1)!.name)
    removeRow(c, c.rows.length - 1)
    expect(c.rows.length).toBe(rows)
    expect(c.series.length).toBe(series)
  })
  it("renamePieSlice keeps row.name and series.key synced, guards collisions", () => {
    const c = createChart("pie")
    renamePieSlice(c, 0, "brave")
    expect(c.rows[0].name).toBe("brave")
    expect(c.series[0].key).toBe("brave")
    // renaming row 1 to an existing name gets a suffix
    renamePieSlice(c, 1, "brave")
    expect(c.rows[1].name).not.toBe("brave")
    expect(c.series[1].key).toBe(c.rows[1].name)
  })
})

describe("chartCode", () => {
  it("defaults emit a minimal root tag", () => {
    const code = chartCode(createChart("area"))
    expect(code).toContain('<AreaChart :data="data" :config="config" bloom="low">')
    expect(code).not.toContain(":cell=")
    expect(code).not.toContain("easing=")
  })
  it("non-defaults emit their attributes", () => {
    const c = createChart("bar")
    c.cell = 4
    c.stagger = 0.8
    c.easing = "linear"
    c.barGap = 0.1
    const code = chartCode(c)
    expect(code).toContain(':cell="4"')
    expect(code).toContain(':stagger="0.8"')
    expect(code).toContain('easing="linear"')
    expect(code).toContain(':bar-gap="0.1"')
  })
  it("custom bezier + texture + bloom emit object/array literals", () => {
    const c = createChart("area")
    c.easing = [0.4, 0.68, 0.3, 1]
    c.bloom = { blur: 12, brightness: 1.35, opacity: 0.4, saturate: 1.4 }
    c.series[0].variant = { ramp: 0.3, hatch: 6 }
    const code = chartCode(c)
    expect(code).toContain(':easing="[0.4, 0.68, 0.3, 1]"')
    expect(code).toContain(':bloom="{ blur: 12, brightness: 1.35, opacity: 0.4, saturate: 1.4 }"')
    expect(code).toContain(':variant="{ ramp: 0.3, hatch: 6 }"')
  })
  it("markers render as children with imports", () => {
    const c = createChart("area")
    c.series[0].dots.on = true
    c.series[0].activeDot.on = true
    const code = chartCode(c)
    expect(code).toContain("<Dot />")
    expect(code).toContain("<ActiveDot />")
    expect(code).toContain("</Area>")
    expect(code).toMatch(/import \{ .*Dot.*ActiveDot.* \}/)
  })
  it("edited data flows into the literal", () => {
    const c = createChart("area")
    c.rows[0].desktop = 999
    expect(chartCode(c)).toContain("desktop: 999")
  })
})
