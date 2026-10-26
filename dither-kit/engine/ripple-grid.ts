// Ripple-grid field — a lattice of dots brightened by concentric ripples
// expanding from the centre, rendered through the kit's Bayer engine. Cells are
// kept square via the aspect ratio; dots tint across the colors ramp by ring.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"

export type RippleGridParams = {
  colors: Rgb[]
  gap: number
  dotSize: number
  frequency: number
  speed: number
  glow: number
  opacity: number
  dither: number
}

export function paintRippleGrid(buffer: RasterBuffer, p: RippleGridParams, time: number, matrix: number[][]): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const aspect = cols / rows
  const t = time * p.speed * 2
  const gx = Math.max(2, Math.round(p.gap))
  const gy = Math.max(2, Math.round(gx / aspect))
  const radius = Math.max(0.05, p.dotSize * 0.5)
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const v = (y + 0.5) / rows
    const fv = v * gy
    const cv = Math.floor(fv)
    const dv = fv - (cv + 0.5)
    const ry = (cv + 0.5) / gy - 0.5
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
      const rx = ((cu + 0.5) / gx - 0.5) * aspect
      const r = Math.hypot(rx, ry)
      const ripple = 0.5 + 0.5 * Math.sin(r * p.frequency - t)
      let inten = clamp01((1 - d / radius) * (0.2 + ripple * ripple) * p.glow)
      if (p.dither > 0) {
        const th = my[x & 3]
        inten = inten * (1 - p.dither) + (inten > th ? 1 : 0) * p.dither
      }
      const a = clamp01(inten) * p.opacity
      if (a <= 0) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      sampleRgbGradient(p.colors, clamp01(ripple), col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = a * 255
    }
  }
}
