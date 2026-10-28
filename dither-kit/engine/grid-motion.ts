// Grid-motion field — a scrolling line grid drifting in a direction, rendered
// through the kit's Bayer engine. Cells stay square via the aspect ratio; the
// grid tints across the colors ramp by depth, then ordered-dithered.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"

export type GridMotionParams = {
  colors: Rgb[]
  count: number
  angle: number
  speed: number
  lineWidth: number
  glow: number
  opacity: number
  dither: number
}

/** Distance-to-nearest-gridline intensity for a fractional cell coordinate. */
function lineFn(fr: number, half: number): number {
  const f = fr - Math.floor(fr)
  const d = Math.min(f, 1 - f)
  return d < half ? 1 - d / half : 0
}

export function paintGridMotion(buffer: RasterBuffer, p: GridMotionParams, time: number, matrix: number[][]): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const aspect = cols / rows
  const t = time * p.speed
  const gx = Math.max(2, Math.round(p.count))
  const gy = Math.max(2, Math.round(gx / aspect))
  const half = Math.max(0.01, p.lineWidth)
  const dirx = Math.cos(p.angle)
  const diry = Math.sin(p.angle)
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const v = (y + 0.5) / rows
    const fv = v * gy + diry * t
    const lv = lineFn(fv, half)
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const u = (x + 0.5) / cols
      const lu = lineFn(u * gx + dirx * t, half)
      let inten = clamp01(Math.max(lu, lv) * p.glow)
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
