import { describe, expect, it } from "rstack/test"
import { BAYER4 } from "../dither-kit/engine/pixel"
import { createRasterBuffer, type RasterBuffer } from "../dither-kit/engine/raster"
import { paintMetaBalls } from "../dither-kit/engine/meta-balls"
import { paintMetallicPaint } from "../dither-kit/engine/metallic-paint"
import { paintNoiseField } from "../dither-kit/engine/noise-field"
import { paintCubes } from "../dither-kit/engine/cubes"
import { paintRibbons } from "../dither-kit/engine/ribbons"
import { paintShapeBlur } from "../dither-kit/engine/shape-blur"
import { paintStrands } from "../dither-kit/engine/strands"
import { paintLaserFlow } from "../dither-kit/engine/laser-flow"

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
  [
    "metaBalls",
    (b) =>
      paintMetaBalls(
        b,
        { colors: C, count: 6, speed: 1, ballSize: 1, glow: 1.5, opacity: 1, dither: 1 },
        2,
        BAYER4,
        null,
      ),
    false,
  ],
  [
    "metallicPaint",
    (b) =>
      paintMetallicPaint(b, { colors: C, scale: 3, speed: 0.4, distortion: 0.6, opacity: 1, dither: 1 }, 2, BAYER4),
    true,
  ],
  ["noise", (b) => paintNoiseField(b, { colors: C, speed: 1, density: 0.5, opacity: 1 }, 2, BAYER4), false],
  ["cubes", (b) => paintCubes(b, { colors: C, scale: 6, speed: 0.4, opacity: 1, dither: 1 }, 2, BAYER4), false],
  [
    "ribbons",
    (b) =>
      paintRibbons(
        b,
        {
          colors: C,
          count: 5,
          speed: 0.5,
          thickness: 0.12,
          amplitude: 1,
          glow: 1.2,
          opacity: 1,
          dither: 1,
          mouseStrength: 1,
        },
        2,
        BAYER4,
        null,
      ),
    false,
  ],
  [
    "shapeBlur",
    (b) =>
      paintShapeBlur(
        b,
        { colors: C, size: 0.4, speed: 0.6, softness: 0.3, opacity: 1, dither: 0.6, mouseStrength: 0.5 },
        2,
        BAYER4,
        null,
      ),
    false,
  ],
  [
    "strands",
    (b) =>
      paintStrands(
        b,
        { colors: C, count: 40, speed: 0.4, sway: 0.15, lineWidth: 0.02, glow: 1, opacity: 1, dither: 0 },
        2,
        BAYER4,
      ),
    false,
  ],
  [
    "laserFlow",
    (b) =>
      paintLaserFlow(
        b,
        { colors: C, count: 4, speed: 0.6, beamWidth: 0.03, glow: 1, opacity: 1, dither: 0 },
        2,
        BAYER4,
      ),
    false,
  ],
]

describe("animations canvas", () => {
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
