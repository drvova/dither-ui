// Aurora field — glowing polar curtains rendered through the kit's Bayer engine
// (zero GPU deps). A wavy light band hangs near the top, its lower edge driven
// by fbm, broken into vertical curtain rays and tinted across the colors ramp
// by x, then ordered-dithered. One paint loop stamps every knob.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"
import { fbm } from "./noise"

/** Resolved per-frame knobs (colors as rgb). */
export type AuroraParams = {
  colors: Rgb[]
  amplitude: number
  blend: number
  speed: number
  opacity: number
  dither: number
}

/**
 * Paint one frame of the aurora into a backing buffer.
 * @param time   seconds (the caller has NOT pre-scaled by speed).
 * @param matrix 4x4 Bayer thresholds (seeded or default).
 */
export function paintAurora(
  buffer: RasterBuffer,
  p: AuroraParams,
  time: number,
  matrix: number[][]
): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const t = time * p.speed
  const blendLo = 0.0025 + p.blend * 0.02
  const blendHi = 0.02 + p.blend * 0.15
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const v = (y + 0.5) / rows
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const u = (x + 0.5) / cols
      // Wavy lower edge of the curtain, near the top third.
      const edge = 0.28 + p.amplitude * 0.22 * (fbm(u * 2.5 + t * 0.15, 7.3, t * 0.4) - 0.5) * 2
      const d = v - edge
      // Sharp fade above the edge, a longer glowing tail below it.
      let inten = Math.exp(-(d * d) / (d < 0 ? blendLo : blendHi))
      // Vertical curtain rays.
      inten *= 0.55 + 0.45 * fbm(u * 22, v * 3 + t * 0.5, t * 0.2)
      inten = clamp01(inten * 1.4)
      if (inten <= 0) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      if (p.dither > 0) {
        const th = my[x & 3]
        inten = inten * (1 - p.dither) + (inten > th ? 1 : 0) * p.dither
      }
      const alpha = clamp01(inten) * p.opacity
      if (alpha <= 0) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      sampleRgbGradient(p.colors, u, col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = alpha * 255
    }
  }
}
