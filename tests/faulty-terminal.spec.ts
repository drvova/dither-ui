import { describe, expect, it } from "vitest"
import { BAYER4 } from "../dither-kit/pixel"
import { createRasterBuffer } from "../dither-kit/raster"
import { paintFaultyTerminal, type FaultyTerminalParams } from "../dither-kit/faulty-terminal"

const base: FaultyTerminalParams = {
  scale: 1.5,
  gridMulX: 2,
  gridMulY: 1,
  digitSize: 1.2,
  scanlineIntensity: 1,
  glitchAmount: 1,
  flickerAmount: 0,
  noiseAmp: 1,
  chromaticAberration: 0,
  dither: 0,
  curvature: 0,
  tint: [80, 200, 120],
  brightness: 1,
  mouseStrength: 0.5,
}

const paint = (p: Partial<FaultyTerminalParams>, time = 3, fade = 1) => {
  const buf = createRasterBuffer(48, 32)
  paintFaultyTerminal(buf, { ...base, ...p }, time, BAYER4, null, fade)
  return buf.data
}

describe("paintFaultyTerminal", () => {
  it("is deterministic for identical inputs", () => {
    expect(Array.from(paint({}))).toEqual(Array.from(paint({})))
  })

  it("lights some cells and tints them toward the tint color", () => {
    const d = paint({})
    let lit = 0
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) lit++
    expect(lit).toBeGreaterThan(0)
    // Green tint => green channel never below red/blue on any lit pixel.
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue
      expect(d[i + 1]).toBeGreaterThanOrEqual(d[i])
      expect(d[i + 1]).toBeGreaterThanOrEqual(d[i + 2])
    }
  })

  it("fade=0 blanks the wall", () => {
    const d = paint({}, 3, 0)
    expect(d.every((v) => v === 0)).toBe(true)
  })

  it("curvature carves a transparent bezel in the corners", () => {
    const d = paint({ curvature: 0.8, noiseAmp: 2 })
    // top-left pixel alpha
    expect(d[3]).toBe(0)
  })

  it("full dither snaps channels toward 0/255", () => {
    const d = paint({ dither: 1 })
    for (let i = 0; i < d.length; i += 4) {
      // With a solid tint and 1-bit dither, lit green pixels reach full tint.
      if (d[i + 3] > 0) expect(d[i + 1]).toBe(200)
    }
  })
})
