// Liquid-chrome field — molten metal rendered opaque through the kit's Bayer
// engine. Iterative domain warping folds the coordinates into rippled reflective
// bands; a high-contrast sine reads them as chrome. Tinted across the colors
// ramp (default silver), ordered-dithered.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"

export type LiquidChromeParams = {
  colors: Rgb[]
  scale: number
  speed: number
  distortion: number
  opacity: number
  dither: number
}

export function paintLiquidChrome(buffer: RasterBuffer, p: LiquidChromeParams, time: number, matrix: number[][]): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const aspect = cols / rows
  const t = time * p.speed
  const d = p.distortion * 0.35
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const py0 = ((y + 0.5) / rows - 0.5) * p.scale
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      let px = ((x + 0.5) / cols - 0.5) * aspect * p.scale
      let py = py0
      for (let k = 0; k < 3; k++) {
        px += d * Math.sin(py * 3 + t + k)
        py += d * Math.sin(px * 3 + t * 1.1 + k)
      }
      const val = 0.5 + 0.5 * Math.sin((px + py) * 4)
      const idx = clamp01(val + (my[x & 3] - 0.5) * p.dither * 0.3)
      sampleRgbGradient(p.colors, idx, col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = clamp01(p.opacity) * 255
    }
  }
}
