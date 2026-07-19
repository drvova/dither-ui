import { describe, expect, it } from "vitest"
import { BAYER4 } from "../dither-kit/pixel"
import { createRasterBuffer } from "../dither-kit/raster"
import { paintFerrofluid, type FerrofluidParams } from "../dither-kit/ferrofluid"

const base: FerrofluidParams = {
  colors: [
    [255, 0, 0],
    [0, 0, 255],
  ],
  speed: 0.5,
  scale: 1.6,
  turbulence: 1,
  fluidity: 0.1,
  rimWidth: 0.2,
  sharpness: 2.5,
  shimmer: 0,
  glow: 2,
  flowX: 0,
  flowY: -1,
  opacity: 1,
  dither: 0,
  mouseStrength: 1,
  mouseRadius: 0.35,
}

const paint = (p: Partial<FerrofluidParams>, mouse: { x: number; y: number } | null = null) => {
  const buf = createRasterBuffer(64, 48)
  paintFerrofluid(buf, { ...base, ...p }, 2, BAYER4, mouse)
  return buf.data
}

describe("paintFerrofluid", () => {
  it("is deterministic for identical inputs", () => {
    expect(Array.from(paint({}))).toEqual(Array.from(paint({})))
  })

  it("lights a rim somewhere but leaves interiors/gaps transparent", () => {
    const d = paint({})
    let lit = 0
    let clear = 0
    for (let i = 3; i < d.length; i += 4) (d[i] > 0 ? lit++ : clear++)
    expect(lit).toBeGreaterThan(0)
    expect(clear).toBeGreaterThan(0) // a full wall of pixels would mean the rim band failed
  })

  it("tints the rim from colors[0] at top toward colors[last] at bottom", () => {
    const d = paint({})
    const w = 64
    const rowRedBlue = (y: number) => {
      let r = 0
      let b = 0
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4
        if (d[i + 3] === 0) continue
        r += d[i]
        b += d[i + 2]
      }
      return { r, b }
    }
    const top = rowRedBlue(2)
    const bottom = rowRedBlue(45)
    // red-dominant up top, blue-dominant at the bottom (height gradient).
    if (top.r + top.b > 0) expect(top.r).toBeGreaterThanOrEqual(top.b)
    if (bottom.r + bottom.b > 0) expect(bottom.b).toBeGreaterThanOrEqual(bottom.r)
  })

  it("opacity scales the rim alpha down", () => {
    const full = paint({})
    const dim = paint({ opacity: 0.5 })
    let fA = 0
    let dA = 0
    for (let i = 3; i < full.length; i += 4) {
      fA += full[i]
      dA += dim[i]
    }
    expect(dA).toBeLessThan(fA)
  })

  it("the cursor spike changes the field near the pointer", () => {
    const without = paint({})
    const withMouse = paint({}, { x: 0.5, y: 0.5 })
    expect(Array.from(withMouse)).not.toEqual(Array.from(without))
  })
})
