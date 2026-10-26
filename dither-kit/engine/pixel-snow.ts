// Pixel-snow field — sparse flakes drifting down a hashed grid, rendered through
// the kit's Bayer engine. Each cell hashes to a flake or empty; flakes fall as
// time advances the vertical grid coordinate. Tinted across the colors ramp by
// depth, then ordered-dithered.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"
import { hash21 } from "./noise"

export type PixelSnowParams = {
  colors: Rgb[]
  density: number
  speed: number
  opacity: number
  dither: number
}

export function paintPixelSnow(buffer: RasterBuffer, p: PixelSnowParams, time: number, matrix: number[][]): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const aspect = cols / rows
  const t = time * p.speed
  const gx = Math.max(4, Math.round(p.density))
  const gy = Math.max(4, Math.round(gx / aspect))
  const radius = 0.3
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const v = (y + 0.5) / rows
    const yy = v * gy + t * 3
    const cv = Math.floor(yy)
    const dv = yy - (cv + 0.5)
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const u = (x + 0.5) / cols
      const fu = u * gx
      const cu = Math.floor(fu)
      // Horizontal drift so columns don't fall in lockstep.
      const jitter = (hash21(cu * 2.3, 7.1) - 0.5) * 0.6
      const du = fu - (cu + 0.5) - jitter
      if (hash21(cu * 1.7 + 0.5, cv * 1.3 + 0.5) < 0.82) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      const d = Math.hypot(du, dv)
      if (d > radius) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      let inten = clamp01((1 - d / radius) * (0.6 + 0.4 * hash21(cu * 0.3, cv * 0.9)))
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
