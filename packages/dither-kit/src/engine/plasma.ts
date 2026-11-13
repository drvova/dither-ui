// Plasma field — the classic layered-sine plasma, rendered opaque through the
// kit's Bayer engine (zero GPU deps). Four sine fields sum into a value mapped
// across the colors ramp; ordered dithering bands the gradient into the kit's
// crunch instead of a smooth blend.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"

export type PlasmaParams = {
  colors: Rgb[]
  scale: number
  speed: number
  opacity: number
  dither: number
}

export function paintPlasma(buffer: RasterBuffer, p: PlasmaParams, time: number, matrix: number[][]): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const aspect = cols / rows
  const t = time * p.speed
  const s = p.scale * 6
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const v = (y + 0.5) / rows
    const cy = (v - 0.5) * s
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const u = (x + 0.5) / cols
      const cx = (u - 0.5) * aspect * s
      const val =
        Math.sin(cx + t) +
        Math.sin(cy + t * 1.3) +
        Math.sin((cx + cy) * 0.5 + t * 0.7) +
        Math.sin(Math.hypot(cx, cy) + t * 1.1)
      const idx = clamp01((val + 4) / 8 + (my[x & 3] - 0.5) * p.dither * 0.4)
      sampleRgbGradient(p.colors, idx, col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = clamp01(p.opacity) * 255
    }
  }
}
