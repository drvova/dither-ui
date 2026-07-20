// Strands — many thin vertical filaments whose x wanders on fbm, like blown
// hair. Denser than Threads, tinted by depth, alpha-keyed with transparent gaps.

import { clamp01 } from "./pixel"
import { fbm } from "./noise"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"

export type StrandsParams = {
  colors: Rgb[]
  count: number
  speed: number
  sway: number
  lineWidth: number
  glow: number
  opacity: number
  dither: number
}

export function paintStrands(buffer: RasterBuffer, p: StrandsParams, time: number, matrix: number[][]): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const t = time * p.speed
  const n = Math.max(1, Math.round(p.count))
  const half = Math.max(0.001, p.lineWidth) * 0.5
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const v = (y + 0.5) / rows
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const u = (x + 0.5) / cols
      let inten = 0
      let tintK = 0
      for (let k = 0; k < n; k++) {
        const base = (k + 0.5) / n
        const cx = base + (fbm(base * 5, v * 1.5 + k, t) - 0.5) * p.sway
        const d = Math.abs(u - cx)
        if (d < half) {
          const band = Math.pow(1 - d / half, p.glow) * (0.5 + 0.5 * v)
          if (band > inten) {
            inten = band
            tintK = base
          }
        }
      }
      let lit = clamp01(inten)
      if (p.dither > 0) {
        const th = my[x & 3]
        lit = lit * (1 - p.dither) + (lit > th ? 1 : 0) * p.dither
      }
      const a = clamp01(lit) * p.opacity
      if (a <= 0) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      sampleRgbGradient(p.colors, tintK, col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = a * 255
    }
  }
}
