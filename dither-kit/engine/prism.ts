// Prism field — a spectral light fan dispersing from a source above, rendered
// through the kit's Bayer engine. The angle across the fan maps to an HSV hue,
// so the beam splits into a rainbow; ordered dithering bands the spectrum.

import { clamp01 } from "./pixel"
import { hsvToRgb } from "./palette"
import type { RasterBuffer } from "./raster"

export type PrismParams = {
  spread: number
  speed: number
  saturation: number
  brightness: number
  opacity: number
  dither: number
}

export function paintPrism(buffer: RasterBuffer, p: PrismParams, time: number, matrix: number[][]): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const aspect = cols / rows
  const t = time * p.speed
  const spread = Math.max(0.05, p.spread)
  const sat = clamp01(p.saturation)

  for (let y = 0; y < rows; y++) {
    const dy = (y + 0.5) / rows + 0.1
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const dx = ((x + 0.5) / cols - 0.5) * aspect
      const dist = Math.hypot(dx, dy)
      const ang = Math.atan2(dx, dy)
      if (Math.abs(ang) >= spread) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      const fall = clamp01(1 - dist * 0.5)
      const band = 0.55 + 0.45 * Math.sin(ang * 30 + t)
      const inten = clamp01(fall * band)
      if (inten <= 0.03) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      const hue = (ang / spread) * 200 + 260 + t * 30 + (my[x & 3] - 0.5) * p.dither * 30
      const [r, g, b] = hsvToRgb(hue, sat, clamp01(p.brightness * inten))
      const a = inten * clamp01(p.opacity)
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
      data[i + 3] = a * 255
    }
  }
}
