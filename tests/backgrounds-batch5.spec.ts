import { describe, expect, it } from "vitest"
import { BAYER4 } from "../dither-kit/pixel"
import { createRasterBuffer, type RasterBuffer } from "../dither-kit/raster"
import { paintBalatro } from "../dither-kit/balatro"
import { paintBallpit } from "../dither-kit/ballpit"
import { paintEvilEye } from "../dither-kit/evil-eye"
import { paintHyperspeed } from "../dither-kit/hyperspeed"
import { paintLightfall } from "../dither-kit/lightfall"
import { paintLiquidEther } from "../dither-kit/liquid-ether"
import { paintParticles } from "../dither-kit/particles"
import { paintPixelBlast } from "../dither-kit/pixel-blast"
import { paintPrismaticBurst } from "../dither-kit/prismatic-burst"

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
  ["balatro", (b) => paintBalatro(b, { colors: C, scale: 2, speed: 0.5, spin: 3, contrast: 1, opacity: 1, dither: 1 }, 2, BAYER4), true],
  ["ballpit", (b) => paintBallpit(b, { colors: C, count: 12, speed: 0.5, ballSize: 0.8, glow: 1.5, opacity: 1, dither: 0, mouseStrength: 1 }, 2, BAYER4, null), false],
  ["evilEye", (b) => paintEvilEye(b, { colors: C, size: 0.4, speed: 0.5, pupilSize: 0.4, glow: 1.5, opacity: 1, dither: 0, mouseStrength: 1 }, 2, BAYER4, null), false],
  ["hyperspeed", (b) => paintHyperspeed(b, { colors: C, count: 16, speed: 0.5, streakLength: 0.6, glow: 1.5, opacity: 1, dither: 0 }, 2, BAYER4), false],
  ["lightfall", (b) => paintLightfall(b, { colors: C, count: 12, speed: 0.5, trailLength: 0.6, width: 0.08, glow: 1.5, opacity: 1, dither: 0 }, 2, BAYER4), false],
  ["liquidEther", (b) => paintLiquidEther(b, { colors: C, scale: 2, speed: 0.5, flow: 1, opacity: 1, dither: 1, mouseStrength: 1 }, 2, BAYER4, null), true],
  ["particles", (b) => paintParticles(b, { colors: C, count: 12, speed: 0.5, particleSize: 0.6, glow: 1.5, opacity: 1, dither: 0, mouseStrength: 1 }, 2, BAYER4, null), false],
  ["pixelBlast", (b) => paintPixelBlast(b, { colors: C, waves: 3, speed: 0.5, pixels: 30, glow: 1.5, opacity: 1, dither: 0 }, 2, BAYER4), false],
  ["prismaticBurst", (b) => paintPrismaticBurst(b, { rays: 8, speed: 0.5, spread: 2, saturation: 0.9, brightness: 1, opacity: 1, dither: 0 }, 2, BAYER4), false],
]

describe("backgrounds batch 5", () => {
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
