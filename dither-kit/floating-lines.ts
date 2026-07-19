// Floating-lines field — a few thin horizontal lines bobbing and drifting
// independently, rendered through the kit's Bayer engine. Each line has its own
// phase; tinted across the colors ramp by line, then ordered-dithered.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"

export type FloatingLinesParams = {
  colors: Rgb[]
  count: number
  amplitude: number
  speed: number
  lineWidth: number
  glow: number
  opacity: number
  dither: number
}

export function paintFloatingLines(buffer: RasterBuffer, p: FloatingLinesParams, time: number, matrix: number[][]): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const t = time * p.speed
  const count = Math.max(1, Math.round(p.count))
  const denom = count > 1 ? count - 1 : 1
  const half = Math.max(0.004, p.lineWidth)
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const v = (y + 0.5) / rows
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const u = (x + 0.5) / cols
      let inten = 0
      let litK = 0
      for (let k = 0; k < count; k++) {
        const base = (k + 0.5) / count
        const ly = base + p.amplitude * 0.09 * Math.sin(t + k * 1.7 + u * 3)
        const d = Math.abs(v - ly)
        if (d < half) {
          const val = 1 - d / half
          if (val > inten) {
            inten = val
            litK = k
          }
        }
      }
      if (inten <= 0) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      inten = clamp01(inten * inten * p.glow)
      if (p.dither > 0) {
        const th = my[x & 3]
        inten = inten * (1 - p.dither) + (inten > th ? 1 : 0) * p.dither
      }
      const a = clamp01(inten) * p.opacity
      if (a <= 0) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      sampleRgbGradient(p.colors, litK / denom, col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = a * 255
    }
  }
}
