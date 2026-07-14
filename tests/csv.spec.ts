import { describe, expect, it } from "vitest"
import { importCsv, parseCsv } from "../src/entities/chart/model/csv"
import { createChart } from "../src/entities/chart/model/factory"

describe("parseCsv", () => {
  it("parses headers + records", () => {
    const p = parseCsv("month,Desktop,Mobile\nJan,10,20\nFeb,30,40")
    expect(p?.headers).toEqual(["month", "Desktop", "Mobile"])
    expect(p?.records).toEqual([["Jan", "10", "20"], ["Feb", "30", "40"]])
  })
  it("handles quoted fields with commas", () => {
    const p = parseCsv('label,v\n"Jan, 2026",5')
    expect(p?.records[0]).toEqual(["Jan, 2026", "5"])
  })
  it("rejects empty / single-column input", () => {
    expect(parseCsv("")).toBeNull()
    expect(parseCsv("only-header")).toBeNull()
    expect(parseCsv("a\n1\n2")).toBeNull()
  })
})

describe("importCsv (cartesian)", () => {
  it("replaces rows + series from columns", () => {
    const c = createChart("area")
    const ok = importCsv(c, "month,Revenue,Cost\nJan,100,60\nFeb,120,70")
    expect(ok).toBe(true)
    expect(c.rows).toEqual([
      { month: "Jan", revenue: 100, cost: 60 },
      { month: "Feb", revenue: 120, cost: 70 },
    ])
    expect(c.series.map((s) => s.key)).toEqual(["revenue", "cost"])
    expect(c.series[0].label).toBe("Revenue")
  })
  it("keeps settings for series whose key matches", () => {
    const c = createChart("area")
    c.series[0].color = "#123456" // desktop
    importCsv(c, "month,Desktop\nJan,5")
    expect(c.series[0].key).toBe("desktop")
    expect(c.series[0].color).toBe("#123456")
  })
  it("non-numeric cells become 0", () => {
    const c = createChart("area")
    importCsv(c, "m,v\na,xyz")
    expect(c.rows[0].v).toBe(0)
  })
})

describe("importCsv (pie)", () => {
  it("one slice per row from the first value column", () => {
    const c = createChart("pie")
    importCsv(c, "browser,share\nChrome,63\nSafari,19")
    expect(c.rows).toEqual([
      { name: "chrome", value: 63 },
      { name: "safari", value: 19 },
    ])
    expect(c.series.map((s) => s.key)).toEqual(["chrome", "safari"])
  })
})
