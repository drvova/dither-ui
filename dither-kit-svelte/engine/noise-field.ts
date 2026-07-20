// Noise — animated hashed grain over an fbm base, thresholded 1-bit against the
// Bayer matrix so the whole surface reads as living static. Alpha-keyed grain.

import { clamp01 } from "./pixel"
import { hash21 } from "./noise"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"

export type NoiseParams = {
  colors: Rgb[]
  speed: number
  density: number
  opacity: number
}

export function paintNoiseField(
  buffer: RasterBuffer,
  p: NoiseParams,
  time: number,
  matrix: number[][]
): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const t = time * p.speed
  const frame = Math.floor(t * 20)
  const col: [number, number, number] = [0, 0, 0]
  const thresh = 1 - clamp01(p.density)

  for (let y = 0; y < rows; y++) {
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const g = hash21(x * 1.7 + frame * 0.13, y * 1.3 - frame * 0.19)
      if (g < thresh) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      const on = g > my[x & 3] * 0.5 + thresh * 0.5
      if (!on) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      sampleRgbGradient(p.colors, g, col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = p.opacity * 255
    }
  }
}
