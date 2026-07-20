// Rays field — god rays fanning from a source point, rendered through the kit's
// Bayer engine. The angle to the source is banded by a sharpened sine jittered
// with fbm, faded by distance; tinted across the colors ramp by distance,
// dithered. Shared by LightRays (source above) and SideRays (source at a side).

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"
import { fbm } from "./noise"

export type RaysParams = {
  colors: Rgb[]
  sourceX: number
  sourceY: number
  rayCount: number
  speed: number
  spread: number
  falloff: number
  glow: number
  opacity: number
  dither: number
}

export function paintRays(buffer: RasterBuffer, p: RaysParams, time: number, matrix: number[][]): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const aspect = cols / rows
  const t = time * p.speed
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const v = (y + 0.5) / rows
    const dy = v - p.sourceY
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const u = (x + 0.5) / cols
      const dx = (u - p.sourceX) * aspect
      const dist = Math.hypot(dx, dy)
      const ang = Math.atan2(dy, dx)
      const s = Math.pow(0.5 + 0.5 * Math.sin(ang * p.rayCount + t + (fbm(ang * 2, dist * 2, t) - 0.5) * p.spread), 2)
      const fall = clamp01(1 - dist * p.falloff)
      let inten = clamp01(s * fall * p.glow)
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
      sampleRgbGradient(p.colors, clamp01(dist), col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = a * 255
    }
  }
}
