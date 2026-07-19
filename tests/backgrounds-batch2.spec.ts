import { describe, expect, it } from "vitest"
import { BAYER4 } from "../dither-kit/pixel"
import { createRasterBuffer, type RasterBuffer } from "../dither-kit/raster"
import { paintBeams } from "../dither-kit/beams"
import { paintGridMotion } from "../dither-kit/grid-motion"
import { paintGridScan } from "../dither-kit/grid-scan"
import { paintGridDistortion } from "../dither-kit/grid-distortion"
import { paintRays } from "../dither-kit/rays"
import { paintLightPillar } from "../dither-kit/light-pillar"
import { paintSoftAurora } from "../dither-kit/soft-aurora"

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

const cases: [string, (b: RasterBuffer) => void][] = [
  ["beams", (b) => paintBeams(b, { colors: C, count: 5, angle: 0.6, speed: 0.5, sharpness: 3, glow: 1.5, opacity: 1, dither: 0 }, 2, BAYER4)],
  ["gridMotion", (b) => paintGridMotion(b, { colors: C, count: 12, angle: 0.4, speed: 0.5, lineWidth: 0.08, glow: 1.5, opacity: 1, dither: 0 }, 2, BAYER4)],
  ["gridScan", (b) => paintGridScan(b, { colors: C, count: 12, speed: 0.5, lineWidth: 0.08, scanWidth: 0.15, glow: 1.5, opacity: 1, dither: 0 }, 2, BAYER4)],
  ["gridDistortion", (b) => paintGridDistortion(b, { colors: C, count: 12, distortion: 1, speed: 0.5, lineWidth: 0.08, glow: 1.5, opacity: 1, dither: 0, mouseStrength: 1 }, 2, BAYER4, null)],
  ["lightRays", (b) => paintRays(b, { colors: C, sourceX: 0.5, sourceY: -0.05, rayCount: 12, speed: 0.5, spread: 1, falloff: 0.8, glow: 1.5, opacity: 1, dither: 0 }, 2, BAYER4)],
  ["sideRays", (b) => paintRays(b, { colors: C, sourceX: -0.05, sourceY: 0.5, rayCount: 10, speed: 0.5, spread: 1, falloff: 0.7, glow: 1.5, opacity: 1, dither: 0 }, 2, BAYER4)],
  ["lightPillar", (b) => paintLightPillar(b, { colors: C, count: 8, speed: 0.5, width: 0.4, glow: 1.5, opacity: 1, dither: 0 }, 2, BAYER4)],
  ["softAurora", (b) => paintSoftAurora(b, { colors: C, bands: 3, amplitude: 1, blend: 0.6, speed: 0.5, opacity: 1, dither: 0 }, 2, BAYER4)],
]

describe("backgrounds batch 2", () => {
  for (const [name, fn] of cases) {
    it(`${name}: deterministic, finite, and paints with gaps`, () => {
      const a = run(fn)
      const b = run(fn)
      expect(noNaN(a)).toBe(true)
      expect(Array.from(a)).toEqual(Array.from(b))
      const lit = alphaCount(a)
      expect(lit).toBeGreaterThan(0)
      expect(lit).toBeLessThan(64 * 48)
    })
  }
})
