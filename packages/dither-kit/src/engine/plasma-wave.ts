// Plasma-wave field — directional plasma with wavefronts travelling along an
// axis, rendered opaque through the kit's Bayer engine. Sines along and across
// the flow sum into a value mapped across the colors ramp; ordered-dithered.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"

export type PlasmaWaveParams = {
  colors: Rgb[]
  scale: number
  speed: number
  angle: number
  opacity: number
  dither: number
}

export function paintPlasmaWave(buffer: RasterBuffer, p: PlasmaWaveParams, time: number, matrix: number[][]): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const aspect = cols / rows
  const t = time * p.speed
  const s = p.scale * 6
  const dirx = Math.cos(p.angle)
  const diry = Math.sin(p.angle)
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const cy = (y + 0.5) / rows - 0.5
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const cx = ((x + 0.5) / cols - 0.5) * aspect
      const along = (cx * dirx + cy * diry) * s
      const perp = (-cx * diry + cy * dirx) * s
      const val =
        Math.sin(along - t * 2) +
        Math.sin(perp * 0.5 - t) +
        Math.sin((along + perp) * 0.5 - t * 0.5) +
        Math.sin(Math.hypot(cx, cy) * s - t)
      const idx = clamp01((val + 4) / 8 + (my[x & 3] - 0.5) * p.dither * 0.4)
      sampleRgbGradient(p.colors, idx, col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = clamp01(p.opacity) * 255
    }
  }
}
