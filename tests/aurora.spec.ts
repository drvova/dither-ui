import { describe, expect, it } from "vitest"
import { BAYER4 } from "../dither-kit/pixel"
import { createRasterBuffer } from "../dither-kit/raster"
import { paintAurora, type AuroraParams } from "../dither-kit/aurora"

const base: AuroraParams = {
  colors: [
    [255, 0, 0],
    [0, 0, 255],
  ],
  amplitude: 1,
  blend: 0.5,
  speed: 0.5,
  opacity: 1,
  dither: 0,
}

const paint = (p: Partial<AuroraParams> = {}) => {
  const buf = createRasterBuffer(64, 48)
  paintAurora(buf, { ...base, ...p }, 3, BAYER4)
  return buf.data
}

describe("paintAurora", () => {
  it("is deterministic for identical inputs", () => {
    expect(Array.from(paint())).toEqual(Array.from(paint()))
  })

  it("lights the curtain but leaves gaps transparent", () => {
    const d = paint()
    let lit = 0
    let clear = 0
    for (let i = 3; i < d.length; i += 4) (d[i] > 0 ? lit++ : clear++)
    expect(lit).toBeGreaterThan(0)
    expect(clear).toBeGreaterThan(0)
  })

  it("tints across width: colors[0] left, colors[last] right", () => {
    const d = paint()
    const w = 64
    const colRedBlue = (x: number) => {
      let r = 0
      let b = 0
      for (let y = 0; y < 48; y++) {
        const i = (y * w + x) * 4
        if (d[i + 3] === 0) continue
        r += d[i]
        b += d[i + 2]
      }
      return { r, b }
    }
    const left = colRedBlue(2)
    const right = colRedBlue(61)
    if (left.r + left.b > 0) expect(left.r).toBeGreaterThanOrEqual(left.b)
    if (right.r + right.b > 0) expect(right.b).toBeGreaterThanOrEqual(right.r)
  })

  it("opacity scales the alpha down", () => {
    const full = paint()
    const dim = paint({ opacity: 0.5 })
    let fA = 0
    let dA = 0
    for (let i = 3; i < full.length; i += 4) {
      fA += full[i]
      dA += dim[i]
    }
    expect(dA).toBeLessThan(fA)
  })
})
