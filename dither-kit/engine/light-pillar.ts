// Light-pillar field — vertical light columns shimmering upward, rendered
// through the kit's Bayer engine. fbm nudges the column positions; a sharpened
// sine makes the pillars, brighter at the base. Tinted across the colors ramp
// by column, then ordered-dithered.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"
import { fbm } from "./noise"

const TAU = Math.PI * 2

export type LightPillarParams = {
  colors: Rgb[]
  count: number
  speed: number
  width: number
  glow: number
  opacity: number
  dither: number
}

export function paintLightPillar(buffer: RasterBuffer, p: LightPillarParams, time: number, matrix: number[][]): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const t = time * p.speed
  const sharp = 2 / Math.max(0.1, p.width)
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const v = (y + 0.5) / rows
    const baseLift = 0.35 + 0.65 * v
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const u = (x + 0.5) / cols
      const uu = u + (fbm(u * 3, v * 0.5, t) - 0.5) * 0.05
      const band = Math.pow(0.5 + 0.5 * Math.sin(uu * p.count * TAU + t * 0.3), sharp)
      let inten = clamp01(band * baseLift * p.glow)
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
      sampleRgbGradient(p.colors, u, col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = a * 255
    }
  }
}
