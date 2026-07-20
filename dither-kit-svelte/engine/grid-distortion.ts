// Grid-distortion field — a line grid warped by an fbm flow and the cursor,
// rendered through the kit's Bayer engine. Coordinates are displaced before the
// grid is sampled; tinted across the colors ramp by warped depth, dithered.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"
import { fbm } from "./noise"

export type GridDistortionParams = {
  colors: Rgb[]
  count: number
  distortion: number
  speed: number
  lineWidth: number
  glow: number
  opacity: number
  dither: number
  mouseStrength: number
}

function lineFn(fr: number, half: number): number {
  const f = fr - Math.floor(fr)
  const d = Math.min(f, 1 - f)
  return d < half ? 1 - d / half : 0
}

export function paintGridDistortion(
  buffer: RasterBuffer,
  p: GridDistortionParams,
  time: number,
  matrix: number[][],
  mouse: { x: number; y: number } | null
): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const aspect = cols / rows
  const t = time * p.speed
  const gx = Math.max(2, Math.round(p.count))
  const gy = Math.max(2, Math.round(gx / aspect))
  const half = Math.max(0.01, p.lineWidth)
  const amp = p.distortion * 0.1
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const v = (y + 0.5) / rows
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const u = (x + 0.5) / cols
      let wu = u + (fbm(u * 2, v * 2, t) - 0.5) * amp
      let wv = v + (fbm(u * 2 + 5, v * 2 + 9, t) - 0.5) * amp
      if (mouse) {
        const dx = (u - mouse.x) * aspect
        const dy = v - mouse.y
        const g = Math.exp(-(dx * dx + dy * dy) / 0.05) * p.mouseStrength * 0.15
        wu += (mouse.x - u) * g
        wv += (mouse.y - v) * g
      }
      let inten = clamp01(Math.max(lineFn(wu * gx, half), lineFn(wv * gy, half)) * p.glow)
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
      sampleRgbGradient(p.colors, clamp01(wv), col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = a * 255
    }
  }
}
