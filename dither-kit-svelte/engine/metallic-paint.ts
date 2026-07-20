// Metallic paint — iterative domain-warped reflective bands, fully opaque, the
// liquid-chrome family. Tinted across the colors ramp and ordered-dithered.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"

export type MetallicPaintParams = {
  colors: Rgb[]
  scale: number
  speed: number
  distortion: number
  opacity: number
  dither: number
}

export function paintMetallicPaint(
  buffer: RasterBuffer,
  p: MetallicPaintParams,
  time: number,
  matrix: number[][]
): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const aspect = cols / rows
  const t = time * p.speed
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const v = (y + 0.5) / rows
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const u = (x + 0.5) / cols
      let fx = (u - 0.5) * aspect * p.scale
      let fy = (v - 0.5) * p.scale
      // iterative sine domain warp -> reflective ripples
      for (let k = 0; k < 4; k++) {
        fx += p.distortion * Math.sin(fy * 1.5 + t + k) * 0.5
        fy += p.distortion * Math.cos(fx * 1.5 - t + k) * 0.5
      }
      const sheen = 0.5 + 0.5 * Math.sin((fx + fy) * 1.5 + t)
      let g = clamp01(Math.pow(sheen, 1.3))
      if (p.dither > 0) {
        const th = my[x & 3]
        g = g * (1 - p.dither) + (g > th ? 1 : 0) * p.dither
      }
      sampleRgbGradient(p.colors, g, col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = p.opacity * 255
    }
  }
}
