// Laser flow — sharp horizontal beams sweeping across with additive bloom and a
// faint fbm jitter, tinted by beam. Alpha-keyed so only the beams paint.

import { clamp01 } from "./pixel"
import { fbm } from "./noise"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"

export type LaserFlowParams = {
  colors: Rgb[]
  count: number
  speed: number
  beamWidth: number
  glow: number
  opacity: number
  dither: number
}

export function paintLaserFlow(buffer: RasterBuffer, p: LaserFlowParams, time: number, matrix: number[][]): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const t = time * p.speed
  const n = Math.max(1, Math.round(p.count))
  const half = Math.max(0.002, p.beamWidth) * 0.5
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
        // beam center oscillates vertically, plus a small fbm jitter
        const cy = base + 0.16 * Math.sin(t * 0.8 + k * 2.1) + (fbm(u * 3 + k, t, 0) - 0.5) * 0.04
        const d = Math.abs(v - cy)
        const core = d < half ? 1 : 0
        const bloom = Math.exp(-(d * d) / (half * half * 8 * p.glow))
        // brighter toward the sweep head moving along x
        const sweep = 0.6 + 0.4 * Math.sin(u * 6.28 - t * 2 + k)
        const band = clamp01(core + bloom * 0.8) * sweep
        if (band > inten) {
          inten = band
          tintK = base
        }
      }
      let lit = clamp01(inten)
      if (p.dither > 0) {
        const th = my[x & 3]
        lit = lit * (1 - p.dither) + (lit > th ? 1 : 0) * p.dither
      }
      const a = clamp01(lit) * p.opacity
      if (a <= 0.02) {
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
