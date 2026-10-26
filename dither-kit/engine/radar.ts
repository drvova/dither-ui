// Radar field — a rotating sweep with an afterglow trail over concentric rings,
// rendered through the kit's Bayer engine. The scope is circular (corners stay
// transparent); rings + sweep tint across the colors ramp by radius, dithered.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"

const TAU = Math.PI * 2

export type RadarParams = {
  colors: Rgb[]
  rings: number
  speed: number
  sweepWidth: number
  glow: number
  opacity: number
  dither: number
}

export function paintRadar(buffer: RasterBuffer, p: RadarParams, time: number, matrix: number[][]): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const aspect = cols / rows
  const t = time * p.speed
  const sweep = ((t % TAU) + TAU) % TAU
  const sweepW = Math.max(0.05, p.sweepWidth)
  const rings = Math.max(1, Math.round(p.rings))
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const dy = (y + 0.5) / rows - 0.5
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const dx = ((x + 0.5) / cols - 0.5) * aspect
      const r = Math.hypot(dx, dy) * 2
      if (r > 1) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      const ang = (Math.atan2(dy, dx) + TAU) % TAU
      let delta = (sweep - ang) % TAU
      if (delta < 0) delta += TAU
      const trail = Math.exp(-delta / sweepW)
      const ringF = r * rings
      const rd = Math.abs(ringF - Math.round(ringF))
      const ring = rd < 0.06 ? 1 - rd / 0.06 : 0
      let inten = ring * 0.4 + trail
      if (r > 0.96) inten = Math.max(inten, 0.6)
      inten = clamp01(inten * p.glow)
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
      sampleRgbGradient(p.colors, clamp01(r), col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = a * 255
    }
  }
}
