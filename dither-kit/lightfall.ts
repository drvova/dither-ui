// Lightfall field — soft columns of light drifting downward with long fading
// trails, rendered through the kit's Bayer engine. Each column drops a hashed
// head; the trail fades upward. Tinted across the colors ramp by depth.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"
import { hash21 } from "./noise"

export type LightfallParams = {
  colors: Rgb[]
  count: number
  speed: number
  trailLength: number
  width: number
  glow: number
  opacity: number
  dither: number
}

export function paintLightfall(buffer: RasterBuffer, p: LightfallParams, time: number, matrix: number[][]): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const t = time * p.speed
  const gx = Math.max(2, Math.round(p.count))
  const trail = Math.max(0.05, p.trailLength)
  const w2 = Math.max(0.02, p.width) * Math.max(0.02, p.width) * 4
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const v = (y + 0.5) / rows
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const fu = ((x + 0.5) / cols) * gx
      const cu = Math.floor(fu)
      const jitter = (hash21(cu, 2) - 0.5) * 0.5
      const du = fu - (cu + 0.5) - jitter
      const colClose = Math.exp(-(du * du) / w2)
      const h = hash21(cu, 5)
      const head = (t * (0.6 + h) + h * 2) % 1.4
      const behind = head - v
      const t2 = behind >= 0 && behind < trail ? 1 - behind / trail : 0
      let inten = clamp01(colClose * t2 * p.glow)
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
