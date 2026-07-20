// Letter-glitch field — matrix-style glyph rain rendered through the kit's Bayer
// engine. Each column drops a bright head with a trailing fade; every cell holds
// a hashed 3x5 glyph. Tinted across the colors ramp by brightness, dithered.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"
import { hash21 } from "./noise"

export type LetterGlitchParams = {
  colors: Rgb[]
  columns: number
  speed: number
  trailLength: number
  glow: number
  opacity: number
  dither: number
}

export function paintLetterGlitch(buffer: RasterBuffer, p: LetterGlitchParams, time: number, matrix: number[][]): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const aspect = cols / rows
  const t = time * p.speed
  const gx = Math.max(2, Math.round(p.columns))
  const gy = Math.max(2, Math.round(gx / aspect))
  const trail = Math.max(0.05, p.trailLength) * gy
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const fv = ((y + 0.5) / rows) * gy
    const cellY = Math.floor(fv)
    const sy = Math.floor((fv - cellY) * 5)
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const fu = ((x + 0.5) / cols) * gx
      const cellX = Math.floor(fu)
      const speedVar = 0.7 + hash21(cellX, 7) * 0.8
      const phase = ((t * speedVar + hash21(cellX, 3) * 3) % 2)
      const headCell = phase * gy
      const below = headCell - cellY
      let bright = below >= 0 && below < trail ? 1 - below / trail : 0
      if (bright <= 0) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      const sx = Math.floor((fu - cellX) * 3)
      const on = hash21(cellX * 3.1 + sx, cellY * 5.3 + sy) > 0.45 ? 1 : 0.12
      bright *= 0.3 + 0.7 * on
      let inten = clamp01(bright * p.glow)
      if (p.dither > 0) {
        const th = my[x & 3]
        inten = inten * (1 - p.dither) + (inten > th ? 1 : 0) * p.dither
      }
      const a = clamp01(inten) * p.opacity
      if (a <= 0) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      sampleRgbGradient(p.colors, clamp01(bright), col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = a * 255
    }
  }
}
