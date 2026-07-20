// Ribbons — a few thick flowing bands along wavy fbm centerlines, shaded bright
// at the core and tinted per ribbon. The pointer bends nearby ribbons toward it.

import { clamp01 } from "./pixel"
import { fbm } from "./noise"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"

export type RibbonsParams = {
  colors: Rgb[]
  count: number
  speed: number
  thickness: number
  amplitude: number
  glow: number
  opacity: number
  dither: number
  mouseStrength: number
}

export function paintRibbons(
  buffer: RasterBuffer,
  p: RibbonsParams,
  time: number,
  matrix: number[][],
  mouse: { x: number; y: number } | null
): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const t = time * p.speed
  const n = Math.max(1, Math.round(p.count))
  const half = Math.max(0.01, p.thickness) * 0.5
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
        let cy = base + p.amplitude * 0.18 * Math.sin(u * 4 + t + k * 1.7)
        cy += (fbm(u * 2 + k, base * 3, t) - 0.5) * p.amplitude * 0.25
        if (mouse) {
          const dxm = u - mouse.x
          const pull = Math.exp(-(dxm * dxm) / 0.02) * p.mouseStrength * 0.12
          cy += (mouse.y - cy) * pull
        }
        const d = Math.abs(v - cy)
        if (d < half) {
          const band = Math.pow(1 - d / half, p.glow)
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
