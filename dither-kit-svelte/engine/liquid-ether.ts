// Liquid-ether field — an ethereal flowing colour fluid rendered opaque through
// the kit's Bayer engine. Coordinates are advected by an fbm flow (and stirred by
// the cursor) before sampling a colour ramp, giving drifting tendrils. Dithered.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"
import { fbm } from "./noise"

export type LiquidEtherParams = {
  colors: Rgb[]
  scale: number
  speed: number
  flow: number
  opacity: number
  dither: number
  mouseStrength: number
}

export function paintLiquidEther(
  buffer: RasterBuffer,
  p: LiquidEtherParams,
  time: number,
  matrix: number[][],
  mouse: { x: number; y: number } | null
): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const aspect = cols / rows
  const t = time * p.speed
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const v = (y + 0.5) / rows
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const u = (x + 0.5) / cols
      let px = u * p.scale
      let py = v * p.scale
      for (let k = 0; k < 2; k++) {
        px += p.flow * 0.3 * fbm(px, py + t * 0.2, t)
        py += p.flow * 0.3 * fbm(px + 5, py, t)
      }
      if (mouse) {
        const dx = (u - mouse.x) * aspect
        const dy = v - mouse.y
        const g = Math.exp(-(dx * dx + dy * dy) / 0.05) * p.mouseStrength
        px += dx * g * 2
        py += dy * g * 2
      }
      const val = fbm(px, py, t * 0.5) * 1.3
      const idx = clamp01(val + (my[x & 3] - 0.5) * p.dither * 0.3)
      sampleRgbGradient(p.colors, idx, col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = clamp01(p.opacity) * 255
    }
  }
}
