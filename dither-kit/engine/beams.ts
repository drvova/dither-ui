// Beams field — parallel light beams sweeping at an angle, rendered through the
// kit's Bayer engine. A rotated coordinate is banded by a sharpened sine that
// scrolls over time; tinted across the colors ramp by beam position, dithered.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"

const TAU = Math.PI * 2

export type BeamsParams = {
  colors: Rgb[]
  count: number
  angle: number
  speed: number
  sharpness: number
  glow: number
  opacity: number
  dither: number
}

export function paintBeams(buffer: RasterBuffer, p: BeamsParams, time: number, matrix: number[][]): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const aspect = cols / rows
  const t = time * p.speed
  const ca = Math.cos(p.angle)
  const sa = Math.sin(p.angle)
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const v = (y + 0.5) / rows
    const py = v - 0.5
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const u = (x + 0.5) / cols
      const px = (u - 0.5) * aspect
      const coord = px * ca + py * sa
      let inten = clamp01(Math.pow(0.5 + 0.5 * Math.sin((coord * p.count - t) * TAU), p.sharpness) * p.glow)
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
      sampleRgbGradient(p.colors, ((coord % 1) + 1) % 1, col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = a * 255
    }
  }
}
