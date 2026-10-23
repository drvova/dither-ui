import { describe, expect, it } from "rstack/test"
import { buildBandScale, buildYScale, computeBands, indexAtBand, nearestIndex } from "../dither-kit/scales"

const rows = [
  { m: "a", x: 10, y: 5 },
  { m: "b", x: 20, y: 15 },
]

describe("computeBands", () => {
  it("default: every series sits on the floor", () => {
    const { bands, max } = computeBands(rows, ["x", "y"], "default")
    expect(bands.x).toEqual([
      [0, 10],
      [0, 20],
    ])
    expect(bands.y).toEqual([
      [0, 5],
      [0, 15],
    ])
    expect(max).toBe(20)
  })
  it("stacked: series pile up", () => {
    const { bands, max } = computeBands(rows, ["x", "y"], "stacked")
    expect(bands.x[1]).toEqual([0, 20])
    expect(bands.y[1]).toEqual([20, 35])
    expect(max).toBe(35)
  })
  it("percent: normalised to 1", () => {
    const { bands, max } = computeBands(rows, ["x", "y"], "percent")
    expect(max).toBe(1)
    expect(bands.y[0][1]).toBeCloseTo(1, 6)
  })
  it("non-numeric values count as 0 and max floors at 1", () => {
    const { bands, max } = computeBands([{ x: "nope" }], ["x"], "default")
    expect(bands.x[0]).toEqual([0, 0])
    expect(max).toBe(1)
  })
})

describe("band scale geometry", () => {
  it("more gap means thinner bars", () => {
    const tight = buildBandScale(4, 400, 0).bandwidth()
    const loose = buildBandScale(4, 400, 0.6).bandwidth()
    expect(loose).toBeLessThan(tight)
  })
  it("edge padding shifts the first band inward", () => {
    const flush = buildBandScale(4, 400, 0.28, 0)(0) ?? 0
    const inset = buildBandScale(4, 400, 0.28, 1)(0) ?? 0
    expect(inset).toBeGreaterThan(flush)
  })
})

describe("pointer -> index", () => {
  it("nearestIndex clamps to the ends", () => {
    expect(nearestIndex(-50, 5, 400)).toBe(0)
    expect(nearestIndex(9999, 5, 400)).toBe(4)
    expect(nearestIndex(200, 5, 400)).toBe(2)
  })
  it("indexAtBand buckets evenly", () => {
    expect(indexAtBand(0, 4, 400)).toBe(0)
    expect(indexAtBand(399, 4, 400)).toBe(3)
    expect(indexAtBand(150, 4, 400)).toBe(1)
  })
})

describe("y scale", () => {
  it("inverts (0 at the bottom)", () => {
    const y = buildYScale(100, 200)
    expect(y(0)).toBe(200)
    expect(y(100)).toBeLessThan(20) // .nice() may stretch the domain a touch
  })
})
