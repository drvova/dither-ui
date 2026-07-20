// Gradient-blinds field — angled slats each showing a colour-ramp gradient,
// separated by thin transparent gaps, sliding over time. Rendered through the
// kit's Bayer engine; the within-slat gradient is ordered-dithered.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"

export type GradientBlindsParams = {
  colors: Rgb[]
  count: number
  angle: number
  speed: number
  gap: number
  opacity: number
  dither: number
}

export function paintGradientBlinds(buffer: RasterBuffer, p: GradientBlindsParams, time: number, matrix: number[][]): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const aspect = cols / rows
  const t = time * p.speed
  const ca = Math.cos(p.angle)
  const sa = Math.sin(p.angle)
  const gap = clamp01(p.gap) * 0.9
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const v = (y + 0.5) / rows
    const py = v - 0.5
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const u = (x + 0.5) / cols
      const c = (u - 0.5) * aspect * ca + py * sa
      const f = ((c * p.count - t) % 1 + 1) % 1
      if (f < gap) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      const g = clamp01((f - gap) / (1 - gap) + (my[x & 3] - 0.5) * p.dither * 0.12)
      sampleRgbGradient(p.colors, g, col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = clamp01(p.opacity) * 255
    }
  }
}
