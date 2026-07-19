import { describe, expect, it } from "vitest"
import { BAYER4 } from "../dither-kit/pixel"
import { createRasterBuffer } from "../dither-kit/raster"
import { paintWaves, type WavesParams } from "../dither-kit/waves"

const base: WavesParams = {
  colors: [
    [255, 0, 0],
    [0, 0, 255],
  ],
  count: 8,
  amplitude: 0.4,
  frequency: 2,
  speed: 0.5,
  lineWidth: 0.2,
  glow: 1.5,
  opacity: 1,
  dither: 0,
  mouseStrength: 0.6,
}

const paint = (p: Partial<WavesParams> = {}, mouse: { x: number; y: number } | null = null) => {
  const buf = createRasterBuffer(64, 48)
  paintWaves(buf, { ...base, ...p }, 2, BAYER4, mouse)
  return buf.data
}

describe("paintWaves", () => {
  it("is deterministic for identical inputs", () => {
    expect(Array.from(paint())).toEqual(Array.from(paint()))
  })

  it("draws thin lit lines with transparent gaps between them", () => {
    const d = paint()
    let lit = 0
    let clear = 0
    for (let i = 3; i < d.length; i += 4) (d[i] > 0 ? lit++ : clear++)
    expect(lit).toBeGreaterThan(0)
    // lines are thin: most of the field is gap.
    expect(clear).toBeGreaterThan(lit)
  })

  it("tints from colors[0] (top lines) toward colors[last] (bottom lines)", () => {
    const d = paint()
    const w = 64
    const bandRedBlue = (y0: number, y1: number) => {
      let r = 0
      let b = 0
      for (let y = y0; y < y1; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4
          if (d[i + 3] === 0) continue
          r += d[i]
          b += d[i + 2]
        }
      }
      return { r, b }
    }
    const top = bandRedBlue(0, 12)
    const bottom = bandRedBlue(36, 48)
    if (top.r + top.b > 0) expect(top.r).toBeGreaterThanOrEqual(top.b)
    if (bottom.r + bottom.b > 0) expect(bottom.b).toBeGreaterThanOrEqual(bottom.r)
  })

  it("the cursor bends the nearest lines (changes the frame)", () => {
    const without = paint()
    const withMouse = paint({}, { x: 0.5, y: 0.5 })
    expect(Array.from(withMouse)).not.toEqual(Array.from(without))
  })
})
