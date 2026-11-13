// Orb field — a glowing pulsing sphere with a wobbling rim, rendered through the
// kit's Bayer engine. fbm perturbs the radius for a plasma edge; a core glow plus
// a rim ring tint across the colors ramp by radius, then ordered-dithered.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"
import { fbm } from "./noise"

export type OrbParams = {
  colors: Rgb[]
  size: number
  speed: number
  noiseAmount: number
  glow: number
  opacity: number
  dither: number
}

export function paintOrb(buffer: RasterBuffer, p: OrbParams, time: number, matrix: number[][]): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const aspect = cols / rows
  const t = time * p.speed
  const pulse = 1 + 0.05 * Math.sin(t * 2)
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const dy = (y + 0.5) / rows - 0.5
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const dx = ((x + 0.5) / cols - 0.5) * aspect
      const r = Math.hypot(dx, dy) * 2
      const ang = Math.atan2(dy, dx)
      const wob = (fbm(Math.cos(ang) * 2 + 5, Math.sin(ang) * 2, t) - 0.5) * p.noiseAmount * 0.15
      const radius = p.size * pulse + wob
      if (r > radius + 0.06) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      const core = clamp01(1 - r / Math.max(0.01, radius))
      const rim = Math.exp(-Math.pow((r - radius) / 0.08, 2))
      let inten = clamp01((core * 0.65 + rim) * p.glow)
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
      sampleRgbGradient(p.colors, clamp01(r / Math.max(0.01, radius)), col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = a * 255
    }
  }
}
