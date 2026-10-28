// Shape-grid field — a lattice where each cell holds a hashed shape (square,
// diamond, plus or ring) pulsing on its own phase, rendered through the kit's
// Bayer engine. Cells stay square via aspect; tinted across the colors ramp.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"
import { hash21 } from "./noise"

export type ShapeGridParams = {
  colors: Rgb[]
  gap: number
  speed: number
  glow: number
  opacity: number
  dither: number
}

export function paintShapeGrid(buffer: RasterBuffer, p: ShapeGridParams, time: number, matrix: number[][]): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const aspect = cols / rows
  const t = time * p.speed
  const gx = Math.max(2, Math.round(p.gap))
  const gy = Math.max(2, Math.round(gx / aspect))
  const s = 0.36
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const fv = ((y + 0.5) / rows) * gy
    const cv = Math.floor(fv)
    const dv = fv - (cv + 0.5)
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const fu = ((x + 0.5) / cols) * gx
      const cu = Math.floor(fu)
      const du = fu - (cu + 0.5)
      const h = hash21(cu * 1.3, cv * 1.7)
      const shape = Math.floor(h * 4)
      const adu = Math.abs(du)
      const adv = Math.abs(dv)
      let inside: boolean
      if (shape === 0) inside = Math.max(adu, adv) < s
      else if (shape === 1) inside = adu + adv < s
      else if (shape === 2) inside = (adu < s * 0.32 || adv < s * 0.32) && Math.max(adu, adv) < s
      else {
        const rr = Math.hypot(du, dv)
        inside = rr < s && rr > s * 0.55
      }
      if (!inside) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      const bright = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(h * 10 + t * 2))
      let inten = clamp01(bright * p.glow)
      if (p.dither > 0) {
        const th = my[x & 3]
        inten = inten * (1 - p.dither) + (inten > th ? 1 : 0) * p.dither
      }
      const a = clamp01(inten) * p.opacity
      if (a <= 0) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      sampleRgbGradient(p.colors, h, col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = a * 255
    }
  }
}
