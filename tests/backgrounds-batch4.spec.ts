import { describe, expect, it } from "vitest"
import { BAYER4 } from "../dither-kit/pixel"
import { createRasterBuffer, type RasterBuffer } from "../dither-kit/raster"
import { paintLetterGlitch } from "../dither-kit/letter-glitch"
import { paintShapeGrid } from "../dither-kit/shape-grid"
import { paintLightning } from "../dither-kit/lightning"
import { paintDarkVeil } from "../dither-kit/dark-veil"
import { paintLiquidChrome } from "../dither-kit/liquid-chrome"
import { paintOrb } from "../dither-kit/orb"
import { paintPrism } from "../dither-kit/prism"
import { paintGalaxy } from "../dither-kit/galaxy"

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
  ["letterGlitch", (b) => paintLetterGlitch(b, { colors: C, columns: 14, speed: 0.5, trailLength: 0.5, glow: 1.5, opacity: 1, dither: 0 }, 2, BAYER4), false],
  ["shapeGrid", (b) => paintShapeGrid(b, { colors: C, gap: 12, speed: 0.5, glow: 1.5, opacity: 1, dither: 0 }, 2, BAYER4), false],
  ["lightning", (b) => paintLightning(b, { colors: C, bolts: 3, speed: 0.5, jitter: 0.3, width: 0.03, glow: 1.5, opacity: 1, dither: 0 }, 2, BAYER4), false],
  ["darkVeil", (b) => paintDarkVeil(b, { colors: C, scale: 3, speed: 0.5, intensity: 2, vignette: 0.6, opacity: 1, dither: 1 }, 2, BAYER4), true],
  ["liquidChrome", (b) => paintLiquidChrome(b, { colors: C, scale: 2, speed: 0.5, distortion: 1, opacity: 1, dither: 1 }, 2, BAYER4), true],
  ["orb", (b) => paintOrb(b, { colors: C, size: 0.5, speed: 0.5, noiseAmount: 1, glow: 1.5, opacity: 1, dither: 0 }, 2, BAYER4), false],
  ["prism", (b) => paintPrism(b, { spread: 0.6, speed: 0.5, saturation: 0.9, brightness: 1, opacity: 1, dither: 0 }, 2, BAYER4), false],
  ["galaxy", (b) => paintGalaxy(b, { colors: C, arms: 3, twist: 8, speed: 0.5, density: 0.6, glow: 1.5, opacity: 1, dither: 0 }, 2, BAYER4), false],
]

describe("backgrounds batch 4", () => {
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
