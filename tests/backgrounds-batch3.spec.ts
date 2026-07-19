import { describe, expect, it } from "vitest"
import { BAYER4 } from "../dither-kit/pixel"
import { createRasterBuffer, type RasterBuffer } from "../dither-kit/raster"
import { paintDotField } from "../dither-kit/dot-field"
import { paintColorBends } from "../dither-kit/color-bends"
import { paintGradientBlinds } from "../dither-kit/gradient-blinds"
import { paintGrainient } from "../dither-kit/grainient"
import { paintDitherBg } from "../dither-kit/dither-bg"
import { paintFloatingLines } from "../dither-kit/floating-lines"
import { paintPlasmaWave } from "../dither-kit/plasma-wave"
import { paintRadar } from "../dither-kit/radar"

const C: [number, number, number][] = [
  [255, 0, 0],
  [0, 128, 255],
]
const run = (fn: (b: RasterBuffer) => void) => {
  const buf = createRasterBuffer(64, 48)
  fn(buf)
  return buf.data
}
const alphaCount = (d: Uint8ClampedArray) => {
  let n = 0
  for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++
  return n
}
const noNaN = (d: Uint8ClampedArray) => d.every((v) => Number.isFinite(v))

// [name, painter, expectsOpaque]
const cases: [string, (b: RasterBuffer) => void, boolean][] = [
  ["dotField", (b) => paintDotField(b, { colors: C, gap: 16, speed: 0.5, sizeVariation: 1, glow: 1.5, opacity: 1, dither: 0, mouseStrength: 1 }, 2, BAYER4, null), false],
  ["colorBends", (b) => paintColorBends(b, { colors: C, scale: 2, bend: 0.4, speed: 0.5, opacity: 1, dither: 1 }, 2, BAYER4), true],
  ["gradientBlinds", (b) => paintGradientBlinds(b, { colors: C, count: 6, angle: 0.3, speed: 0.5, gap: 0.15, opacity: 1, dither: 1 }, 2, BAYER4), false],
  ["grainient", (b) => paintGrainient(b, { colors: C, angle: 0.6, grain: 0.4, speed: 0.5, opacity: 1, dither: 1 }, 2, BAYER4), true],
  ["ditherBg", (b) => paintDitherBg(b, { colors: C, scale: 3, speed: 0.5, opacity: 1 }, 2, BAYER4), false],
  ["floatingLines", (b) => paintFloatingLines(b, { colors: C, count: 8, amplitude: 1, speed: 0.5, lineWidth: 0.012, glow: 1.5, opacity: 1, dither: 0 }, 2, BAYER4), false],
  ["plasmaWave", (b) => paintPlasmaWave(b, { colors: C, scale: 1, speed: 0.5, angle: 0.6, opacity: 1, dither: 1 }, 2, BAYER4), true],
  ["radar", (b) => paintRadar(b, { colors: C, rings: 4, speed: 1, sweepWidth: 0.6, glow: 1.5, opacity: 1, dither: 0 }, 2, BAYER4), false],
]

describe("backgrounds batch 3", () => {
  for (const [name, fn, opaque] of cases) {
    it(`${name}: deterministic, finite, and paints`, () => {
      const a = run(fn)
      const b = run(fn)
      expect(noNaN(a)).toBe(true)
      expect(Array.from(a)).toEqual(Array.from(b))
      const lit = alphaCount(a)
      expect(lit).toBeGreaterThan(0)
      if (opaque) expect(lit).toBe(64 * 48)
      else expect(lit).toBeLessThan(64 * 48)
    })
  }
})
