// The charts' print as SVG (`engine/chart-svg.ts`). Each family paints its
// resting frame into a raster and `rasterInks` writes it as paths, one an
// ink; drawn back, the paths are the raster, byte for byte, every cell in
// one group of its owner. A screen around the chart is part of what the
// print reads: a new matrix prints new inks, the same matrix the same.
import { describe, expect, it } from "rstack/test"
import {
  barTargets,
  blankPrint,
  cartesianSurfaces,
  chartName,
  cssEasing,
  type Ink,
  paintBars,
  paintCartesian,
  paintPie,
  paintRadar,
  rasterInks,
  slicePath,
} from "../src/engine/chart-svg"
import { resolveMatrix } from "../src/engine/dither-paint"
import { seedFromColor } from "../src/engine/palette"
import { SCREENS } from "../src/engine/pixel"
import { pieSlices, radarAxes } from "../src/engine/polar"
import { createRasterBuffer, type RasterBuffer } from "../src/engine/raster"
import { buildYScale, computeBands } from "../src/engine/scales"

const COLS = 48
const ROWS = 32

/** Draw inks back into a raster: each run of each path, its ink's bytes. */
function draw(inks: Ink[], cols: number, rows: number): RasterBuffer {
  const out = createRasterBuffer(cols, rows)
  for (const ink of inks) {
    const rgb = [1, 3, 5].map((i) => parseInt(ink.color.slice(i, i + 2), 16))
    const a = Math.round(ink.opacity * 255)
    let x = 0
    let y = 0
    for (const [, cmd, dx, dy, w] of ink.d.matchAll(/([Mm])(-?\d+) (-?[\d.]+)h(\d+)/g)) {
      if (cmd === "M") {
        x = Number(dx)
        y = Number(dy) - 0.5
      } else {
        x += Number(dx)
        y += Number(dy)
      }
      for (let k = 0; k < Number(w); k++) {
        const i = (y * cols + x + k) * 4
        expect(out.data[i + 3]).toBe(0) // no cell is two inks
        out.data.set([...rgb, a], i)
      }
      x += Number(w)
    }
  }
  return out
}

const matrixOf = (screen: { matrix: number[][] }) => (variant: unknown) =>
  variant === "gradient" ? screen.matrix : resolveMatrix(variant as never)

const rows = [4, 7, 5, 9, 6, 8].map((v, i) => ({ month: `m${i}`, a: v, b: 10 - v }))
const cartesian = (screen: { matrix: number[][] }, chartType: "area" | "bar", stackType: "default" | "stacked") => {
  const { bands, max } = computeBands(rows, ["a", "b"], stackType)
  return {
    chartType,
    configKeys: ["a", "b"],
    bands,
    y: buildYScale(max, ROWS * 2),
    plot: { width: COLS * 2, height: ROWS * 2 },
    glowSize: 0.16,
    seriesSpecs: {
      a: { dataKey: "a", kind: chartType, variant: "gradient", strokeVariant: "solid", opacity: 1 },
      b: { dataKey: "b", kind: chartType, variant: "dotted", strokeVariant: "solid", opacity: 0.8 },
    },
    stackType,
    seedOf: (k: string) => seedFromColor(k === "a" ? "blue" : "orange"),
    matrixOf: matrixOf(screen),
    selectedDataKey: null,
    focusDataKey: "b",
    dimOpacity: 0.3,
    dataLength: rows.length,
    barSlot: (i: number, si: number) => ({ x: i * 16 + si * 7, width: 6 }),
  } as never
}
const polar = (screen: { matrix: number[][] }) =>
  ({
    center: { x: COLS, y: ROWS },
    outerRadius: 28,
    innerRadius: 8,
    rimWidth: 1.4,
    falloff: 0.45,
    plot: { width: COLS * 2, height: ROWS * 2 },
    seedOf: (k: string) => seedFromColor(k.length % 2 ? "purple" : "green"),
    variantOf: () => "gradient",
    matrixOf: matrixOf(screen),
    selectedDataKey: null,
    focusDataKey: null,
    dimOpacity: 0.3,
    configKeys: ["a", "b"],
    data: rows,
    pie: pieSlices(rows, "a", "month"),
    radar: { axes: radarAxes(rows, "month"), max: 10 },
  }) as never

/** Each family's print: its raster, its owner map (or none) and its groups. */
const families: Record<
  string,
  (screen: { matrix: number[][] }) => { frame: RasterBuffer; owner?: Int16Array; groups: number }
> = {
  area: (screen) => {
    const s = cartesian(screen, "area", "default")
    const { frame } = blankPrint(COLS, ROWS)
    paintCartesian(frame, s, cartesianSurfaces(s, COLS, ROWS))
    return { frame, groups: 1 }
  },
  "stacked area": (screen) => {
    const s = cartesian(screen, "area", "stacked")
    const { frame } = blankPrint(COLS, ROWS)
    paintCartesian(frame, s, cartesianSurfaces(s, COLS, ROWS))
    return { frame, groups: 1 }
  },
  bar: (screen) => {
    const s = cartesian(screen, "bar", "default")
    const { frame, owner } = blankPrint(COLS, ROWS)
    paintBars(frame, s, barTargets(s, ROWS), owner)
    return { frame, owner, groups: rows.length * 2 }
  },
  "stacked bar": (screen) => {
    const s = cartesian(screen, "bar", "stacked")
    const { frame, owner } = blankPrint(COLS, ROWS)
    paintBars(frame, s, barTargets(s, ROWS), owner)
    return { frame, owner, groups: rows.length * 2 }
  },
  pie: (screen) => {
    const { frame, owner } = blankPrint(COLS, ROWS)
    paintPie(frame, polar(screen), owner)
    return { frame, owner, groups: rows.length }
  },
  radar: (screen) => {
    const { frame } = blankPrint(COLS, ROWS)
    paintRadar(frame, polar(screen))
    return { frame, groups: 1 }
  },
}

describe("a chart's print as SVG inks", () => {
  for (const [family, print] of Object.entries(families)) {
    it(`${family}: the inks draw back the raster, byte for byte, each cell in its owner's group`, () => {
      const { frame, owner, groups } = print({ matrix: SCREENS.bayer })
      const inks = rasterInks(frame, owner, groups)
      expect(inks).toHaveLength(groups)
      const painted = [...frame.data].filter((_, i) => i % 4 === 3 && frame.data[i] > 0).length
      expect(painted).toBeGreaterThan(20)
      expect([...draw(inks.flat(), COLS, ROWS).data]).toEqual([...frame.data])
      if (owner)
        inks.forEach((group, g) => {
          const drawn = draw(group, COLS, ROWS)
          for (let i = 0; i < COLS * ROWS; i++) if (drawn.data[i * 4 + 3]) expect(owner[i]).toBe(g)
        })
    })

    it(`${family}: a new screen prints new inks, the same screen the same`, () => {
      const inksOf = (matrix: number[][]) => {
        const { frame, owner, groups } = print({ matrix })
        return JSON.stringify(rasterInks(frame, owner, groups))
      }
      expect(inksOf(SCREENS.bayer)).toBe(inksOf(SCREENS.bayer))
      expect(inksOf(SCREENS.line)).not.toBe(inksOf(SCREENS.bayer))
    })
  }

  it("names the chart and its series, and writes its easing for CSS", () => {
    expect(chartName("area", ["Revenue", "Expenses"])).toBe("Area chart: Revenue, Expenses")
    expect(chartName("pie", [])).toBe("Pie chart")
    expect(cssEasing("glide")).toBe("cubic-bezier(0.22, 1, 0.36, 1)")
    expect(cssEasing("linear")).toBe("linear")
    expect(cssEasing([0.1, 0.2, 0.3, 0.4])).toBe("cubic-bezier(0.1, 0.2, 0.3, 0.4)")
    expect(cssEasing("spring")).toMatch(/^linear\(/)
  })

  it("outlines a slice, a whole ring and a donut's sector", () => {
    expect(slicePath(0, 0, 0, 10, 0, Math.PI / 2)).toBe("M10.00 0.00A10 10 0 0 1 0.00 10.00L0 0Z")
    expect(slicePath(0, 0, 5, 10, 0, Math.PI / 2)).toMatch(/L0\.00 5\.00A5 5 0 0 0 5\.00 0\.00Z$/)
    expect(slicePath(0, 0, 0, 10, 0, Math.PI * 2).match(/A/g)).toHaveLength(2)
  })
})
