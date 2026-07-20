// Hyperspeed field — a warp-drive starfield streaking radially from the centre,
// rendered through the kit's Bayer engine. Angular lanes carry hashed star heads
// that rush outward with a trailing tail; brighter toward the edge. Tinted by
// radius, ordered-dithered.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"
import { hash21 } from "./noise"

const TAU = Math.PI * 2

export type HyperspeedParams = {
  colors: Rgb[]
  count: number
  speed: number
  streakLength: number
  glow: number
  opacity: number
  dither: number
}

export function paintHyperspeed(buffer: RasterBuffer, p: HyperspeedParams, time: number, matrix: number[][]): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const aspect = cols / rows
  const t = time * p.speed
  const count = Math.max(4, Math.round(p.count))
  const streak = Math.max(0.05, p.streakLength)
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const cy = (y + 0.5) / rows - 0.5
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const cx = ((x + 0.5) / cols - 0.5) * aspect
      const r = Math.hypot(cx, cy)
      const ang = (Math.atan2(cy, cx) + TAU) % TAU
      const lane = Math.floor((ang / TAU) * count)
      const laneCenter = ((lane + 0.5) / count) * TAU
      let angD = Math.abs(ang - laneCenter)
      if (angD > Math.PI) angD = TAU - angD
      const laneClose = Math.exp(-angD * angD * count * count * 0.6)
      const h = hash21(lane, 1)
      const head = (t * (0.5 + h) + h * 3) % 1.3
      const behind = head - r
      const trail = behind >= 0 && behind < streak ? 1 - behind / streak : 0
      let inten = clamp01(laneClose * trail * (0.3 + r) * p.glow)
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
      sampleRgbGradient(p.colors, clamp01(r * 1.6), col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = a * 255
    }
  }
}
