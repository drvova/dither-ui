import { describe, expect, it } from "rstack/test"
import { BAYER4 } from "../src/engine/pixel"
import { createRasterBuffer, type RasterBuffer } from "../src/engine/raster"
import { paintSilk } from "../src/engine/silk"
import { paintPlasma } from "../src/engine/plasma"
import { paintLineWaves } from "../src/engine/line-waves"
import { paintThreads } from "../src/engine/threads"
import { paintDotGrid } from "../src/engine/dot-grid"
import { paintRippleGrid } from "../src/engine/ripple-grid"
import { paintIridescence } from "../src/engine/iridescence"
import { paintPixelSnow } from "../src/engine/pixel-snow"

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
    "silk",
    (b) =>
      paintSilk(
        b,
        { colors: C, scale: 2, speed: 0.5, noiseIntensity: 1, rotation: 0.6, sharpness: 1.5, opacity: 1, dither: 1 },
        2,
        BAYER4,
      ),
    false,
  ],
  ["plasma", (b) => paintPlasma(b, { colors: C, scale: 1, speed: 0.5, opacity: 1, dither: 1 }, 2, BAYER4), true],
  [
    "lineWaves",
    (b) =>
      paintLineWaves(
        b,
        {
          colors: C,
          count: 8,
          amplitude: 0.5,
          frequency: 2,
          speed: 0.5,
          lineWidth: 0.2,
          glow: 1.5,
          opacity: 1,
          dither: 0,
        },
        2,
        BAYER4,
      ),
    false,
  ],
  [
    "threads",
    (b) =>
      paintThreads(
        b,
        {
          colors: C,
          count: 10,
          amplitude: 0.5,
          distortion: 2,
          speed: 0.5,
          lineWidth: 0.2,
          glow: 1.5,
          opacity: 1,
          dither: 0,
        },
        2,
        BAYER4,
      ),
    false,
  ],
  [
    "dotGrid",
    (b) =>
      paintDotGrid(
        b,
        { colors: C, gap: 12, dotSize: 0.5, speed: 0.5, glow: 1.5, opacity: 1, dither: 0, mouseStrength: 1 },
        2,
        BAYER4,
        null,
      ),
    false,
  ],
  [
    "rippleGrid",
    (b) =>
      paintRippleGrid(
        b,
        { colors: C, gap: 12, dotSize: 0.6, frequency: 20, speed: 0.5, glow: 1.5, opacity: 1, dither: 0 },
        2,
        BAYER4,
      ),
    false,
  ],
  [
    "iridescence",
    (b) =>
      paintIridescence(b, { scale: 2, speed: 0.5, saturation: 0.8, brightness: 0.9, opacity: 1, dither: 1 }, 2, BAYER4),
    true,
  ],
  [
    "pixelSnow",
    (b) => paintPixelSnow(b, { colors: C, density: 24, speed: 0.5, opacity: 1, dither: 0 }, 2, BAYER4),
    false,
  ],
]

describe("backgrounds batch", () => {
  for (const [name, fn, opaque] of cases) {
    it(`${name}: deterministic, finite, and paints`, () => {
      const a = run(fn)
      const b = run(fn)
      expect(noNaN(a)).toBe(true)
      expect(Array.from(a)).toEqual(Array.from(b))
      const lit = alphaCount(a)
      expect(lit).toBeGreaterThan(0)
      if (opaque)
        expect(lit).toBe(64 * 48) // opaque fields cover every pixel
      else expect(lit).toBeLessThan(64 * 48) // sparse fields leave gaps
    })
  }
})
