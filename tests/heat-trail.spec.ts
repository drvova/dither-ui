// The heat trail: the pointer prints the kit's diamond, hot, along its whole
// path however fast the hand; time only takes heat away, one rate for every
// cell, so the trail thins out through the thresholds, steps its ink down
// the ramp, and a cooled field prints nothing at all.
import { describe, expect, it } from "rstack/test"
import {
  coolTrail,
  createTrail,
  fitTrail,
  paintTrail,
  trailLift,
  trailTo,
  type TrailParams,
} from "@dither-kit/engine/heat-trail"
import { BAYER4 } from "@dither-kit/engine/pixel"
import { createRasterBuffer } from "@dither-kit/engine/raster"

const COOL: [number, number, number] = [47, 111, 208]
const HOT: [number, number, number] = [255, 150, 50]
const P: TrailParams = { inks: [COOL, [166, 171, 177], [228, 225, 216], HOT], cool: 1, size: 3 }
const lit = (t: ReturnType<typeof createTrail>) => t.heat.filter((h) => h > 0).length
const at = (t: ReturnType<typeof createTrail>, x: number, y: number) => t.heat[y * t.cols + x]

describe("a stroke", () => {
  it("stamps the diamond, hottest at its heart", () => {
    const t = createTrail(41, 41)
    trailTo(t, 0.5, 0.5, 3)
    expect(at(t, 20, 20)).toBe(1)
    expect(at(t, 23, 20)).toBeGreaterThan(0)
    expect(at(t, 23, 20)).toBeLessThan(1)
    // a diamond: the corner of its box stays cold
    expect(at(t, 23, 23)).toBe(0)
    expect(lit(t)).toBe(25)
    expect(t.hot).toBe(true)
  })

  it("leaves no gap however far the hand jumps between events", () => {
    const t = createTrail(101, 21)
    trailTo(t, 0, 0.5, 1)
    trailTo(t, 1, 0.5, 1)
    for (let x = 0; x <= 100; x++) expect(at(t, x, 10), `cell ${x}`).toBe(1)
  })

  it("starts afresh after a lift, never joining two strokes", () => {
    const t = createTrail(101, 21)
    trailTo(t, 0, 0.5, 0)
    trailLift(t)
    trailTo(t, 1, 0.5, 0)
    expect(lit(t)).toBe(2)
  })
})

describe("cooling", () => {
  it("takes the same heat from every cell until the field is empty", () => {
    const t = createTrail(41, 41)
    trailTo(t, 0.5, 0.5, 3)
    const rim = at(t, 23, 20)
    expect(coolTrail(t, 0.25, 1)).toBe(true)
    expect(at(t, 20, 20)).toBeCloseTo(0.75)
    expect(at(t, 23, 20)).toBeCloseTo(rim - 0.25)
    expect(coolTrail(t, 1, 1)).toBe(false)
    expect(lit(t)).toBe(0)
    expect(t.hot).toBe(false)
  })

  it("lets a resized field go", () => {
    const t = createTrail(10, 10)
    expect(fitTrail(t, 10, 10)).toBe(t)
    expect(fitTrail(t, 12, 10).cols).toBe(12)
  })
})

describe("the print", () => {
  const print = (t: ReturnType<typeof createTrail>) => {
    const b = createRasterBuffer(t.cols, t.rows)
    paintTrail(b, t, P, BAYER4)
    return b.data
  }
  const shown = (d: Uint8ClampedArray) => d.filter((_, i) => i % 4 === 3 && d[i] === 255).length
  const colour = (d: Uint8ClampedArray, x: number, y: number, cols: number) =>
    [...d.slice((y * cols + x) * 4, (y * cols + x) * 4 + 3)] as number[]

  it("lands hot, then thins out through the thresholds and cools down the ramp", () => {
    const t = createTrail(41, 41)
    trailTo(t, 0.5, 0.5, 6)
    const fresh = print(t)
    expect(colour(fresh, 20, 20, 41)).toEqual(HOT)
    let last = shown(fresh)
    for (let k = 0; k < 9; k++) {
      coolTrail(t, 0.1, 1)
      const n = shown(print(t))
      expect(n).toBeLessThanOrEqual(last)
      last = n
    }
    // nearly cold: what is left of the heart is in the coolest ink, sparse
    const d = print(t)
    const inks = new Set<string>()
    for (let i = 0; i < d.length; i += 4) if (d[i + 3]) inks.add(`${d[i]},${d[i + 1]},${d[i + 2]}`)
    expect([...inks]).toEqual([COOL.join(",")])
    expect(last).toBeLessThan(shown(fresh) / 4)
  })

  it("prints nothing once cold", () => {
    const t = createTrail(41, 41)
    trailTo(t, 0.5, 0.5, 3)
    coolTrail(t, 2, 1)
    expect(shown(print(t))).toBe(0)
  })
})
