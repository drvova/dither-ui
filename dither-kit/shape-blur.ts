// Shape blur — a large soft gaussian blob whose radius and position morph on
// fbm, following the pointer. Soft alpha falloff, tinted by radius.

import { clamp01 } from "./pixel"
import { fbm } from "./noise"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"

export type ShapeBlurParams = {
  colors: Rgb[]
  size: number
  speed: number
  softness: number
  opacity: number
  dither: number
  mouseStrength: number
}

export function paintShapeBlur(
  buffer: RasterBuffer,
  p: ShapeBlurParams,
  time: number,
  matrix: number[][],
  mouse: { x: number; y: number } | null
): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const aspect = cols / rows
  const t = time * p.speed
  let bx = 0.5 + (fbm(t * 0.5, 3.1, 0) - 0.5) * 0.5
  let by = 0.5 + (fbm(7.7, t * 0.5, 0) - 0.5) * 0.5
  if (mouse) {
    bx += (mouse.x - bx) * p.mouseStrength
    by += (mouse.y - by) * p.mouseStrength
  }
  const rad = p.size * (0.7 + 0.3 * Math.sin(t))
  const soft = Math.max(0.01, p.softness)
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const v = (y + 0.5) / rows
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const u = (x + 0.5) / cols
      const dx = (u - bx) * aspect
      const dy = v - by
      const d = Math.hypot(dx, dy)
      const wob = (fbm(u * 3, v * 3, t) - 0.5) * 0.15
      let inten = clamp01(1 - (d + wob) / (rad + soft))
      inten = Math.pow(inten, 1.4)
      if (p.dither > 0) {
        const th = my[x & 3]
        inten = inten * (1 - p.dither) + (inten > th ? 1 : 0) * p.dither
      }
      const a = clamp01(inten) * p.opacity
      if (a <= 0.02) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      sampleRgbGradient(p.colors, clamp01(1 - d / (rad + soft)), col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = a * 255
    }
  }
}
