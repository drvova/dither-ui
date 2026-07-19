// Faulty-terminal field — a CRT glyph wall rendered through the kit's own
// Bayer engine instead of a WebGL shader, so it installs with zero GPU deps.
// A grid of glyph cells is lit by animated value-noise (fbm), then run through
// scanlines, glitch, flicker, chromatic aberration, barrel curvature, a tint
// and ordered dithering. One paint loop stamps every knob; widen the params,
// never branch per effect.

import { clamp01 } from "./pixel"
import type { Rgb } from "./palette"
import type { RasterBuffer } from "./raster"

/** Classic GLSL 2D hash — deterministic value in [0, 1). Cheap and terminal-y. */
function hash21(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123
  return s - Math.floor(s)
}

const smooth = (t: number) => t * t * (3 - 2 * t)

/** Lattice value noise with smoothstep interpolation. */
function valueNoise(x: number, y: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const a = hash21(xi, yi)
  const b = hash21(xi + 1, yi)
  const c = hash21(xi, yi + 1)
  const d = hash21(xi + 1, yi + 1)
  const u = smooth(xf)
  const v = smooth(yf)
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v
}

/** Three-octave fbm, drifted by time so the wall breathes. */
function fbm(x: number, y: number, t: number): number {
  let sum = 0
  let amp = 0.5
  let fx = x
  let fy = y
  let ft = t
  for (let o = 0; o < 3; o++) {
    sum += amp * valueNoise(fx + ft, fy - ft * 0.5)
    fx *= 2
    fy *= 2
    ft *= 1.7
    amp *= 0.5
  }
  return sum
}

/** One glyph cell's lit intensity at grid coord (gx, gy). Cells are sparse
 * (fbm past a threshold) and carry a 3x5 bit glyph that reshuffles on a
 * per-cell clock, so the wall reads as flickering characters, not smooth noise. */
function field(gx: number, gy: number, time: number, noiseAmp: number): number {
  const cellX = Math.floor(gx)
  const cellY = Math.floor(gy)
  let b = fbm(cellX * 0.12, cellY * 0.12, time)
  b = clamp01((b - 0.35) * 2.2) * noiseAmp
  if (b <= 0) return 0
  const sx = Math.floor((gx - cellX) * 3)
  const sy = Math.floor((gy - cellY) * 5)
  const charTick = Math.floor(time * 0.9 + hash21(cellX, cellY) * 12)
  const on = hash21(cellX * 3.1 + sx + charTick * 0.7, cellY * 5.3 + sy) > 0.5 ? 1 : 0.12
  return b * on
}

/** Ordered-dither a channel: 0 dither keeps the smooth value, 1 snaps it to a
 * 1-bit Bayer threshold, between mixes — the kit's crunch as an intensity. */
function channelOut(value: number, threshold: number, dither: number): number {
  const val = value < 0 ? 0 : value > 1 ? 1 : value
  if (dither <= 0) return val
  const bit = val > threshold ? 1 : 0
  return val * (1 - dither) + bit * dither
}

/** Resolved per-frame knobs (colors as rgb, grid split into x/y). */
export type FaultyTerminalParams = {
  scale: number
  gridMulX: number
  gridMulY: number
  digitSize: number
  scanlineIntensity: number
  glitchAmount: number
  flickerAmount: number
  noiseAmp: number
  chromaticAberration: number
  dither: number
  curvature: number
  tint: Rgb
  brightness: number
  mouseStrength: number
}

/**
 * Paint one frame of the terminal wall into a backing buffer.
 * @param time    seconds, already multiplied by the caller's timeScale.
 * @param matrix  4x4 Bayer thresholds (seeded or default).
 * @param mouse   pointer in 0..1 uv space, or null when mouseReact is off.
 * @param fade    0..1 master fade (page-load animation / off state).
 */
export function paintFaultyTerminal(
  buffer: RasterBuffer,
  p: FaultyTerminalParams,
  time: number,
  matrix: number[][],
  mouse: { x: number; y: number } | null,
  fade: number
): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const aspect = cols / rows

  const flick =
    p.flickerAmount > 0
      ? p.flickerAmount * 0.2 * (0.5 + 0.5 * Math.sin(time * 13)) * (0.5 + 0.5 * Math.sin(time * 7.3 + 1.7))
      : 0
  const globalScale = p.brightness * (1 - flick) * clamp01(fade)
  const digit = Math.max(0.05, p.digitSize)
  const gxMul = (p.scale * p.gridMulX) / digit
  const gyMul = (p.scale * p.gridMulY) / digit
  const ca = p.chromaticAberration / cols

  for (let y = 0; y < rows; y++) {
    const v0 = (y + 0.5) / rows
    let glitch = 0
    if (p.glitchAmount > 0 && hash21(Math.floor(y * 0.5) * 1.3, Math.floor(time * 18)) > 0.985) {
      glitch = (hash21(y, Math.floor(time * 18)) - 0.5) * p.glitchAmount * 0.25
    }
    const scan = 1 - p.scanlineIntensity * 0.35 * (0.5 + 0.5 * Math.sin(v0 * rows * 1.6 + time * 3))
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      let cu = ((x + 0.5) / cols - 0.5) * aspect
      let cv = v0 - 0.5
      if (p.curvature !== 0) {
        const k = 1 + (cu * cu + cv * cv) * p.curvature
        cu *= k
        cv *= k
      }
      const u = cu / aspect + 0.5 + glitch
      const v = cv + 0.5
      if (u < 0 || u > 1 || v < 0 || v > 1) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      let mb = 0
      if (mouse) {
        const dx = u - mouse.x
        const dy = v - mouse.y
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d < 0.35) mb = p.mouseStrength * (1 - d / 0.35)
      }
      const s = scan * (1 + mb) * globalScale
      const rVal = field((u - ca) * gxMul, v * gyMul, time, p.noiseAmp)
      const gVal = ca !== 0 ? field(u * gxMul, v * gyMul, time, p.noiseAmp) : rVal
      const bVal = ca !== 0 ? field((u + ca) * gxMul, v * gyMul, time, p.noiseAmp) : rVal
      const th = my[x & 3]
      const r = channelOut(rVal * s, th, p.dither)
      const g = channelOut(gVal * s, th, p.dither)
      const b = channelOut(bVal * s, th, p.dither)
      data[i] = p.tint[0] * r
      data[i + 1] = p.tint[1] * g
      data[i + 2] = p.tint[2] * b
      data[i + 3] = Math.max(r, g, b) * 255
    }
  }
}
