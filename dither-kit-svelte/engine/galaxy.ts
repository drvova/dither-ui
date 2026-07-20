// Galaxy field — a rotating spiral of twinkling stars with a bright core,
// rendered through the kit's Bayer engine. Spiral arms modulate a hashed star
// density on a rotating grid; inner stars rotate faster. Tinted by radius,
// ordered-dithered.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"
import { hash21 } from "./noise"

export type GalaxyParams = {
  colors: Rgb[]
  arms: number
  twist: number
  speed: number
  density: number
  glow: number
  opacity: number
  dither: number
}

export function paintGalaxy(buffer: RasterBuffer, p: GalaxyParams, time: number, matrix: number[][]): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const aspect = cols / rows
  const t = time * p.speed
  const g = 18
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const dy = (y + 0.5) / rows - 0.5
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const dx = ((x + 0.5) / cols - 0.5) * aspect
      const r = Math.hypot(dx, dy) * 2
      const ang = Math.atan2(dy, dx)
      const rot = t * (0.4 + (1 - clamp01(r)) * 1.4)
      const arm = 0.5 + 0.5 * Math.sin(ang * p.arms + rot * p.arms - r * p.twist)
      const armDens = arm * clamp01(1.2 - r) * p.density
      const rx = Math.cos(rot) * dx - Math.sin(rot) * dy
      const ry = Math.sin(rot) * dx + Math.cos(rot) * dy
      const cu = Math.floor(rx * g + 50)
      const cv = Math.floor(ry * g + 50)
      const spark = hash21(cu * 1.3, cv * 1.7)
      const twinkle = 0.5 + 0.5 * Math.sin(spark * 100 + t * 3)
      const star = spark > 1 - armDens ? twinkle : 0
      const core = Math.exp(-r * 4) * 1.6
      // Cutoff the faint core tail so far pixels stay transparent (star gaps).
      let inten = clamp01(core + star * p.glow)
      if (inten <= 0.02) {
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
      sampleRgbGradient(p.colors, clamp01(1 - r), col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = a * 255
    }
  }
}
