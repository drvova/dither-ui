// Grid-scan field — a faint static line grid with a bright bar sweeping down it,
// rendered through the kit's Bayer engine. The scan boosts gridline intensity as
// it passes; tinted across the colors ramp by depth, then ordered-dithered.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"

export type GridScanParams = {
  colors: Rgb[]
  count: number
  speed: number
  lineWidth: number
  scanWidth: number
  glow: number
  opacity: number
  dither: number
}

function lineFn(fr: number, half: number): number {
  const f = fr - Math.floor(fr)
  const d = Math.min(f, 1 - f)
  return d < half ? 1 - d / half : 0
}

export function paintGridScan(buffer: RasterBuffer, p: GridScanParams, time: number, matrix: number[][]): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const aspect = cols / rows
  const t = time * p.speed
  const gx = Math.max(2, Math.round(p.count))
  const gy = Math.max(2, Math.round(gx / aspect))
  const half = Math.max(0.01, p.lineWidth)
  const scanW = Math.max(0.02, p.scanWidth)
  const scan = ((t * 0.3) % 1 + 1) % 1
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const v = (y + 0.5) / rows
    const lv = lineFn(v * gy, half)
    const dscan = v - scan
    const boost = Math.exp(-(dscan * dscan) / (scanW * scanW))
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const u = (x + 0.5) / cols
      const grid = Math.max(lineFn(u * gx, half), lv)
      let inten = clamp01(grid * (0.15 + 1.3 * boost) * p.glow)
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
