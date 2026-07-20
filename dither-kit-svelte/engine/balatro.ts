// Balatro field — a swirling psychedelic paint vortex rendered opaque through
// the kit's Bayer engine. Polar coordinates are twisted by a radius-dependent
// spin, then layered sines paint the swirl; mapped across the colors ramp and
// ordered-dithered.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"

export type BalatroParams = {
  colors: Rgb[]
  scale: number
  speed: number
  spin: number
  contrast: number
  opacity: number
  dither: number
}

export function paintBalatro(buffer: RasterBuffer, p: BalatroParams, time: number, matrix: number[][]): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const aspect = cols / rows
  const t = time * p.speed
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const cy = (y + 0.5) / rows - 0.5
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const cx = ((x + 0.5) / cols - 0.5) * aspect
      const r = Math.hypot(cx, cy)
      const ang = Math.atan2(cy, cx)
      const sw = ang + r * p.spin - t
      const sx = Math.cos(sw) * r * p.scale
      const sy = Math.sin(sw) * r * p.scale
      let val = 0
      for (let k = 0; k < 4; k++) {
        val += Math.sin(sx * (k + 1) * 2 + t + k) + Math.sin(sy * (k + 1) * 2 - t * 0.7 + k)
      }
      const v01 = 0.5 + 0.5 * Math.sin(val * p.contrast)
      const idx = clamp01(v01 + (my[x & 3] - 0.5) * p.dither * 0.3)
      sampleRgbGradient(p.colors, idx, col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = clamp01(p.opacity) * 255
    }
  }
}
