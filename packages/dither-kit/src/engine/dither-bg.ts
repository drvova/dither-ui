// Dither field — the kit's signature reduced to its purest form: an animated fbm
// cloud thresholded 1-bit against the Bayer matrix, so the whole surface IS the
// ordered dither. Lit cells tint across the colors ramp; the rest is transparent.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"
import { fbm } from "./noise"

export type DitherBgParams = {
  colors: Rgb[]
  scale: number
  speed: number
  opacity: number
}

export function paintDitherBg(buffer: RasterBuffer, p: DitherBgParams, time: number, matrix: number[][]): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const t = time * p.speed
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const v = (y + 0.5) / rows
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const u = (x + 0.5) / cols
      const val = fbm(u * p.scale, v * p.scale, t) * 1.4
      if (val <= my[x & 3]) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      sampleRgbGradient(p.colors, clamp01(val), col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = clamp01(p.opacity) * 255
    }
  }
}
