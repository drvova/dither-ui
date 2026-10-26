// Lightning field — jagged fbm-displaced bolts that flicker in bursts, rendered
// through the kit's Bayer engine. Each bolt is a thin glowing line wandering
// vertically; the flicker never fully vanishes. Tinted across the ramp by depth.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"
import { fbm, hash21 } from "./noise"

export type LightningParams = {
  colors: Rgb[]
  bolts: number
  speed: number
  jitter: number
  width: number
  glow: number
  opacity: number
  dither: number
}

export function paintLightning(buffer: RasterBuffer, p: LightningParams, time: number, matrix: number[][]): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const t = time * p.speed
  const bolts = Math.max(1, Math.round(p.bolts))
  const flick = 0.2 + 0.8 * Math.pow(hash21(Math.floor(t * 8), 0), 2)
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const v = (y + 0.5) / rows
    const w = Math.max(0.005, p.width) * (0.5 + 0.5 * v)
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const u = (x + 0.5) / cols
      let inten = 0
      for (let b = 0; b < bolts; b++) {
        const seed = b * 13.7 + 1
        const boltX = 0.5 + (fbm(v * 4 + seed, seed, t * 0.15) - 0.5) * 2 * p.jitter
        const d = u - boltX
        const g = Math.exp(-(d * d) / (w * w))
        if (g > inten) inten = g
      }
      inten = clamp01(inten * flick * p.glow)
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
