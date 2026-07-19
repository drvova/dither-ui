// Waves field — a stack of horizontal contour lines flowing on an fbm field,
// rendered through the kit's Bayer engine (zero GPU deps). Each line is a thin
// glowing band whose height ripples with noise; the pointer bends the nearest
// lines toward it. Tinted across the colors ramp by depth, then ordered-dithered.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"
import { fbm } from "./noise"

/** Resolved per-frame knobs (colors as rgb). */
export type WavesParams = {
  colors: Rgb[]
  count: number
  amplitude: number
  frequency: number
  speed: number
  lineWidth: number
  glow: number
  opacity: number
  dither: number
  mouseStrength: number
}

/**
 * Paint one frame of the waves into a backing buffer.
 * @param time   seconds (the caller has NOT pre-scaled by speed).
 * @param matrix 4x4 Bayer thresholds (seeded or default).
 * @param mouse  pointer in 0..1 uv space, or null when interaction is off.
 */
export function paintWaves(
  buffer: RasterBuffer,
  p: WavesParams,
  time: number,
  matrix: number[][],
  mouse: { x: number; y: number } | null
): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const aspect = cols / rows
  const t = time * p.speed
  const count = Math.max(2, Math.round(p.count))
  const gap = 1 / count
  const half = Math.max(0.004, p.lineWidth * gap)
  const ampG = p.amplitude * gap
  const denom = count > 1 ? count - 1 : 1
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const v = (y + 0.5) / rows
    const kCenter = Math.floor(v * count)
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const u = (x + 0.5) / cols
      let inten = 0
      let litK = kCenter
      for (let k = kCenter - 1; k <= kCenter + 1; k++) {
        if (k < 0 || k >= count) continue
        const base = (k + 0.5) * gap
        let ly = base + ampG * (fbm(u * p.frequency, k * 0.7, t) - 0.5) * 2
        if (mouse) {
          const bx = (u - mouse.x) * aspect
          const by = base - mouse.y
          ly += (mouse.y - base) * p.mouseStrength * Math.exp(-(bx * bx + by * by) / 0.08)
        }
        const d = Math.abs(v - ly)
        if (d < half) {
          const val = 1 - d / half
          if (val > inten) {
            inten = val
            litK = k
          }
        }
      }
      if (inten <= 0) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      inten = clamp01(inten * inten * p.glow)
      if (p.dither > 0) {
        const th = my[x & 3]
        inten = inten * (1 - p.dither) + (inten > th ? 1 : 0) * p.dither
      }
      const alpha = clamp01(inten) * p.opacity
      if (alpha <= 0) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      sampleRgbGradient(p.colors, litK / denom, col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = alpha * 255
    }
  }
}
