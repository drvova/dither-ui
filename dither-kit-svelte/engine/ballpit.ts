// Ballpit field — a pit of shaded spheres bobbing on a grid, rendered through
// the kit's Bayer engine. Each cell owns one ball that drifts and repels from
// the cursor; sphere shading gives depth. Tinted per ball, ordered-dithered.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"
import { hash21 } from "./noise"

export type BallpitParams = {
  colors: Rgb[]
  count: number
  speed: number
  ballSize: number
  glow: number
  opacity: number
  dither: number
  mouseStrength: number
}

export function paintBallpit(
  buffer: RasterBuffer,
  p: BallpitParams,
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
  const radius = Math.max(0.1, p.ballSize * 0.6)
  const mx = mouse ? mouse.x * gx : 0
  const myp = mouse ? mouse.y * gy : 0
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const fv = ((y + 0.5) / rows) * gy
    const cv0 = Math.floor(fv)
    const mym = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const fu = ((x + 0.5) / cols) * gx
      const cu0 = Math.floor(fu)
      let best = 0
      let bestH = 0
      for (let dj = -1; dj <= 1; dj++) {
        for (let di = -1; di <= 1; di++) {
          const cu = cu0 + di
          const cv = cv0 + dj
          const h = hash21(cu * 1.3, cv * 1.7)
          let bx = cu + 0.5 + 0.3 * Math.sin(t * (0.5 + h) + h * 6.28)
          let by = cv + 0.5 + 0.3 * Math.cos(t * (0.5 + h) + h * 3.14)
          if (mouse) {
            const rx = bx - mx
            const ry = by - myp
            const rd = Math.hypot(rx, ry)
            if (rd < 3 && rd > 0.001) {
              const push = (p.mouseStrength * (3 - rd)) / 3
              bx += (rx / rd) * push
              by += (ry / rd) * push
            }
          }
          const dx = (fu - bx) / radius
          const dy = (fv - by) / radius
          const q = dx * dx + dy * dy
          if (q < 1) {
            const shade = clamp01(0.35 - dx * 0.35 - dy * 0.35 + 0.7 * Math.sqrt(1 - q))
            if (shade > best) {
              best = shade
              bestH = h
            }
          }
        }
      }
      let inten = clamp01(best * p.glow)
      if (inten <= 0) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      if (p.dither > 0) {
        const th = mym[x & 3]
        inten = inten * (1 - p.dither) + (inten > th ? 1 : 0) * p.dither
      }
      const a = clamp01(inten) * p.opacity
      if (a <= 0) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      sampleRgbGradient(p.colors, bestH, col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = a * 255
    }
  }
}
