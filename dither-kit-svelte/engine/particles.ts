// Particles field — a drifting, twinkling point cloud rendered through the kit's
// Bayer engine. Each grid cell owns a particle that wanders on a sine orbit and
// drifts toward the cursor; nearest-particle lookup over the 3x3 neighbourhood.
// Tinted per particle, ordered-dithered.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"
import { hash21 } from "./noise"

const TAU = Math.PI * 2

export type ParticlesParams = {
  colors: Rgb[]
  count: number
  speed: number
  particleSize: number
  glow: number
  opacity: number
  dither: number
  mouseStrength: number
}

export function paintParticles(
  buffer: RasterBuffer,
  p: ParticlesParams,
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
  const radius = Math.max(0.06, p.particleSize * 0.5)
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
          const h = hash21(cu, cv)
          const h2 = hash21(cu + 7, cv + 3)
          let px = cu + 0.5 + 0.35 * Math.sin(t * (0.3 + h) + h * TAU)
          let py = cv + 0.5 + 0.35 * Math.cos(t * (0.3 + h2) + h2 * TAU)
          if (mouse) {
            px += (mx - px) * p.mouseStrength * 0.15
            py += (myp - py) * p.mouseStrength * 0.15
          }
          const dd = Math.hypot(fu - px, fv - py)
          if (dd < radius) {
            const val = (1 - dd / radius) * (0.55 + 0.45 * Math.sin(t * 2 + h * 10))
            if (val > best) {
              best = val
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
