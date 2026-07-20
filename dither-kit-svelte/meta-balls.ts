// Meta balls — orbiting blobs fused into a metaball iso-surface, tinted across
// the colors ramp and ordered-dithered. Alpha-keyed so only the surface paints.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"

export type MetaBallsParams = {
  colors: Rgb[]
  count: number
  speed: number
  ballSize: number
  glow: number
  opacity: number
  dither: number
}

export function paintMetaBalls(
  buffer: RasterBuffer,
  p: MetaBallsParams,
  time: number,
  matrix: number[][],
  mouse: { x: number; y: number } | null
): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const aspect = cols / rows
  const t = time * p.speed
  const n = Math.max(1, Math.round(p.count))
  const balls: { x: number; y: number; r: number }[] = []
  for (let k = 0; k < n; k++) {
    const ph = k * 2.3994
    balls.push({
      x: 0.5 + 0.34 * Math.cos(t * 0.7 + ph) * Math.cos(ph * 1.3),
      y: 0.5 + 0.34 * Math.sin(t * 0.9 + ph * 1.7),
      r: p.ballSize * (0.06 + 0.03 * Math.sin(t + ph)),
    })
  }
  if (mouse) balls.push({ x: mouse.x, y: mouse.y, r: p.ballSize * 0.1 })
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const v = (y + 0.5) / rows
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const u = (x + 0.5) / cols
      let f = 0
      for (let k = 0; k < balls.length; k++) {
        const dx = (u - balls[k].x) * aspect
        const dy = v - balls[k].y
        f += (balls[k].r * balls[k].r) / (dx * dx + dy * dy + 1e-4)
      }
      let inten = clamp01((f - 1) * p.glow)
      if (p.dither > 0) {
        const th = my[x & 3]
        inten = inten * (1 - p.dither) + (inten > th ? 1 : 0) * p.dither
      }
      const a = clamp01(inten) * p.opacity
      if (a <= 0) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      sampleRgbGradient(p.colors, clamp01((f - 0.6) * 0.5), col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = a * 255
    }
  }
}
