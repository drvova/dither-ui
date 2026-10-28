// Color-bends field — smooth colour bands undulating on an fbm warp, rendered
// opaque through the kit's Bayer engine. The ramp index is bent by noise so the
// bands ripple; ordered dithering crunches the gradient into the kit's texture.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"
import { fbm } from "./noise"

export type ColorBendsParams = {
  colors: Rgb[]
  scale: number
  bend: number
  speed: number
  opacity: number
  dither: number
}

export function paintColorBends(buffer: RasterBuffer, p: ColorBendsParams, time: number, matrix: number[][]): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const t = time * p.speed
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const v = (y + 0.5) / rows
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const u = (x + 0.5) / cols
      const warp = (fbm(u * p.scale, v * p.scale, t) - 0.5) * p.bend
      const idx = clamp01(v + warp + (my[x & 3] - 0.5) * p.dither * 0.15)
      sampleRgbGradient(p.colors, idx, col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = clamp01(p.opacity) * 255
    }
  }
}
