// Ferrofluid field — merging fluid blobs whose contour rim glows, rendered
// through the kit's Bayer engine instead of a WebGL shader (zero GPU deps).
// Two fbm layers are domain-warped (turbulence), fused with a smooth max
// (metaball union tuned by fluidity), then the iso-surface's contour band is
// lit, tinted by height, broken up by shimmer and ordered-dithered. One paint
// loop stamps every knob; widen the params, never branch per effect.

import { clamp01 } from "./pixel"
import type { Rgb } from "./palette"
import type { RasterBuffer } from "./raster"
import { fbm, hash21, valueNoise } from "./noise"

/** Soft maximum — merges two density fields into one blob wall; k (fluidity)
 * controls how liquid the merge is (0 = hard union). */
function smax(a: number, b: number, k: number): number {
  if (k <= 0) return Math.max(a, b)
  const h = Math.max(0, k - Math.abs(a - b)) / k
  return Math.max(a, b) + h * h * k * 0.25
}

/** Sample the rim palette at t in [0, 1] — colors spread across the surface by
 * height; a single color makes the whole rim uniform. */
function sampleGradient(colors: Rgb[], t: number, out: [number, number, number]): void {
  const n = colors.length
  const a = colors[0]
  if (n === 1) {
    out[0] = a[0]
    out[1] = a[1]
    out[2] = a[2]
    return
  }
  const f = clamp01(t) * (n - 1)
  const i = Math.floor(f)
  const frac = f - i
  const lo = colors[i]
  const hi = colors[Math.min(i + 1, n - 1)]
  out[0] = lo[0] + (hi[0] - lo[0]) * frac
  out[1] = lo[1] + (hi[1] - lo[1]) * frac
  out[2] = lo[2] + (hi[2] - lo[2]) * frac
}

/** Resolved per-frame knobs (colors as rgb, flow as a unit vector). */
export type FerrofluidParams = {
  colors: Rgb[]
  speed: number
  scale: number
  turbulence: number
  fluidity: number
  rimWidth: number
  sharpness: number
  shimmer: number
  glow: number
  flowX: number
  flowY: number
  opacity: number
  dither: number
  mouseStrength: number
  mouseRadius: number
}

/**
 * Paint one frame of the ferrofluid into a backing buffer.
 * @param time   seconds (the caller has NOT pre-scaled by speed).
 * @param matrix 4x4 Bayer thresholds (seeded or default).
 * @param mouse  eased pointer in 0..1 uv space, or null when interaction is off.
 */
export function paintFerrofluid(
  buffer: RasterBuffer,
  p: FerrofluidParams,
  time: number,
  matrix: number[][],
  mouse: { x: number; y: number } | null
): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const aspect = cols / rows
  const t = time * p.speed
  const freq = 3 / Math.max(0.2, p.scale)
  const fx = p.flowX * t
  const fy = p.flowY * t
  const rimWidth = Math.max(0.01, p.rimWidth)
  const sharp = Math.max(0.1, p.sharpness)
  const mr2 = p.mouseRadius * p.mouseRadius + 1e-4
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const v = (y + 0.5) / rows
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const u = (x + 0.5) / cols
      let sx = u * aspect * freq + fx
      let sy = v * freq + fy
      if (p.turbulence > 0) {
        sx += (valueNoise(sx + 1.7, sy + 9.2 + t * 0.3) - 0.5) * p.turbulence
        sy += (valueNoise(sx + 8.3, sy + 2.8 - t * 0.2) - 0.5) * p.turbulence
      }
      const a = fbm(sx, sy, t * 0.6)
      const b = fbm(sx * 1.3 + 4.1, sy * 1.3 - 2.7, -t * 0.5)
      let field = smax(a, b, p.fluidity)
      if (mouse) {
        const dx = (u - mouse.x) * aspect
        const dy = v - mouse.y
        field += p.mouseStrength * Math.exp(-(dx * dx + dy * dy) / mr2) * 0.5
      }
      const edge = Math.abs(field - 0.5)
      if (edge >= rimWidth) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      let rim = Math.pow(1 - edge / rimWidth, sharp)
      if (p.shimmer > 0) rim *= 1 - p.shimmer * 0.5 * hash21(x + t * 13, y - t * 7)
      rim = clamp01(rim * p.glow)
      if (p.dither > 0) {
        const th = my[x & 3]
        rim = rim * (1 - p.dither) + (rim > th ? 1 : 0) * p.dither
      }
      const alpha = clamp01(rim) * p.opacity
      if (alpha <= 0) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      sampleGradient(p.colors, v, col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = alpha * 255
    }
  }
}
