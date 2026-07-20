// Soft-aurora field — several overlapping soft curtains accumulating into a
// gentle glow, rendered through the kit's Bayer engine. Wider gaussian falloff
// than Aurora and a low default dither for a hazier look; tinted across the
// colors ramp by height.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"
import { fbm } from "./noise"

export type SoftAuroraParams = {
  colors: Rgb[]
  bands: number
  amplitude: number
  blend: number
  speed: number
  opacity: number
  dither: number
}

export function paintSoftAurora(buffer: RasterBuffer, p: SoftAuroraParams, time: number, matrix: number[][]): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const t = time * p.speed
  const bands = Math.max(1, Math.round(p.bands))
  const spread = 0.01 + p.blend * 0.08
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const v = (y + 0.5) / rows
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const u = (x + 0.5) / cols
      let inten = 0
      for (let b = 0; b < bands; b++) {
        const base = 0.22 + b * (0.5 / bands)
        const edge = base + p.amplitude * 0.15 * (fbm(u * 2 + b * 3, 7 + b, t * 0.4) - 0.5) * 2
        const d = v - edge
        inten += Math.exp(-(d * d) / spread) * 0.6
      }
      inten *= 0.6 + 0.4 * fbm(u * 10, v * 2, t * 0.15)
      // Drop the faint gaussian wash so weak glow stays transparent (gaps).
      inten = inten <= 0.05 ? 0 : clamp01(inten)
      if (inten <= 0) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      if (p.dither > 0) {
        const th = my[x & 3]
        inten = inten * (1 - p.dither) + (inten > th ? 1 : 0) * p.dither
      }
      const a = clamp01(inten) * p.opacity
      if (a <= 0) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      sampleRgbGradient(p.colors, v, col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = a * 255
    }
  }
}
