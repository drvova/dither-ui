// Grainient field — a directional colour gradient dusted with animated grain,
// rendered opaque through the kit's Bayer engine. Per-pixel hash noise breaks up
// the ramp; ordered dithering adds the kit's crunch on top.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"
import { hash21 } from "./noise"

export type GrainientParams = {
  colors: Rgb[]
  angle: number
  grain: number
  speed: number
  opacity: number
  dither: number
}

export function paintGrainient(buffer: RasterBuffer, p: GrainientParams, time: number, matrix: number[][]): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const sinA = Math.sin(p.angle)
  const cosA = Math.cos(p.angle)
  const tick = Math.floor(time * p.speed * 30)
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const v = (y + 0.5) / rows
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const u = (x + 0.5) / cols
      const grad = clamp01(0.5 + (u - 0.5) * sinA + (v - 0.5) * cosA)
      const grainVal = (hash21(x + tick * 0.7, y + tick * 1.3) - 0.5) * p.grain
      const idx = clamp01(grad + grainVal + (my[x & 3] - 0.5) * p.dither * 0.15)
      sampleRgbGradient(p.colors, idx, col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = clamp01(p.opacity) * 255
    }
  }
}
