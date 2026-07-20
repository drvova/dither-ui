// Dark-veil field — a moody near-black wash with faint colour wisps and an edge
// vignette, rendered opaque through the kit's Bayer engine. Sparse fbm highlights
// climb the colors ramp; ordered dithering crunches the low-light gradient.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"
import { fbm } from "./noise"

export type DarkVeilParams = {
  colors: Rgb[]
  scale: number
  speed: number
  intensity: number
  vignette: number
  opacity: number
  dither: number
}

export function paintDarkVeil(buffer: RasterBuffer, p: DarkVeilParams, time: number, matrix: number[][]): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const t = time * p.speed
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const v = (y + 0.5) / rows
    const dy = v - 0.5
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const u = (x + 0.5) / cols
      const dx = u - 0.5
      const n = fbm(u * p.scale, v * p.scale, t)
      const wisp = Math.pow(clamp01(n), 3) * p.intensity
      const vig = 1 - p.vignette * clamp01((dx * dx + dy * dy) * 2)
      const idx = clamp01(wisp * vig + (my[x & 3] - 0.5) * p.dither * 0.1)
      sampleRgbGradient(p.colors, idx, col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = clamp01(p.opacity) * 255
    }
  }
}
