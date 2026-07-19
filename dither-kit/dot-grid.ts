// Dot-grid field — a lattice of round dots pulsing on fbm, brightened under the
// cursor, rendered through the kit's Bayer engine. Cells are kept square via the
// aspect ratio; dots tint across the colors ramp by row depth.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"
import { fbm } from "./noise"

export type DotGridParams = {
  colors: Rgb[]
  gap: number
  dotSize: number
  speed: number
  glow: number
  opacity: number
  dither: number
  mouseStrength: number
}

export function paintDotGrid(
  buffer: RasterBuffer,
  p: DotGridParams,
  time: number,
  matrix: number[][],
  mouse: { x: number; y: number } | null
): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const aspect = cols / rows
  const t = time * p.speed
  const gx = Math.max(2, Math.round(p.gap))
  const gy = Math.max(2, Math.round(gx / aspect))
  const radius = Math.max(0.05, p.dotSize * 0.5)
  const denom = gy > 1 ? gy - 1 : 1
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const v = (y + 0.5) / rows
    const fv = v * gy
    const cv = Math.floor(fv)
    const dv = fv - (cv + 0.5)
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const u = (x + 0.5) / cols
      const fu = u * gx
      const cu = Math.floor(fu)
      const du = fu - (cu + 0.5)
      const d = Math.hypot(du, dv)
      if (d > radius) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      let bright = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(fbm(cu * 0.25, cv * 0.25, t) * 6.283 + t))
      if (mouse) {
        const mu = (u - mouse.x) * aspect
        const mv = v - mouse.y
        bright += p.mouseStrength * Math.exp(-(mu * mu + mv * mv) / 0.03)
      }
      let inten = clamp01((1 - d / radius) * bright * p.glow)
      if (p.dither > 0) {
        const th = my[x & 3]
        inten = inten * (1 - p.dither) + (inten > th ? 1 : 0) * p.dither
      }
      const a = clamp01(inten) * p.opacity
      if (a <= 0) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      sampleRgbGradient(p.colors, cv / denom, col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = a * 255
    }
  }
}
