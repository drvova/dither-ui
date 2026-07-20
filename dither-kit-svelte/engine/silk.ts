// Silk field — flowing anisotropic sheen bands, rendered through the kit's Bayer
// engine (zero GPU deps). fbm warps a rotated sine sheen into liquid ribbons,
// tinted across the colors ramp, then ordered-dithered.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"
import { fbm } from "./noise"

export type SilkParams = {
  colors: Rgb[]
  scale: number
  speed: number
  noiseIntensity: number
  rotation: number
  sharpness: number
  opacity: number
  dither: number
}

export function paintSilk(buffer: RasterBuffer, p: SilkParams, time: number, matrix: number[][]): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const aspect = cols / rows
  const t = time * p.speed
  const ca = Math.cos(p.rotation)
  const sa = Math.sin(p.rotation)
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const v = (y + 0.5) / rows
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const u = (x + 0.5) / cols
      const px = (u - 0.5) * aspect
      const py = v - 0.5
      const rx = px * ca - py * sa
      const w = (fbm(u * p.scale, v * p.scale, t) - 0.5) * p.noiseIntensity
      const s = Math.pow(0.5 + 0.5 * Math.sin((rx * p.scale * 3 + w * 3 + t) * Math.PI), p.sharpness)
      let inten = clamp01(s)
      if (p.dither > 0) {
        const th = my[x & 3]
        inten = inten * (1 - p.dither) + (inten > th ? 1 : 0) * p.dither
      }
      const a = clamp01(inten) * p.opacity
      if (a <= 0) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      sampleRgbGradient(p.colors, clamp01(s), col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = a * 255
    }
  }
}
