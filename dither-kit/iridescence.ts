// Iridescence field — a shifting interference sheen (soap-bubble rainbow)
// rendered opaque through the kit's Bayer engine. fbm perturbs an HSV hue swept
// across the surface; ordered dithering bands the hue into the kit's crunch.

import { clamp01 } from "./pixel"
import { hsvToRgb } from "./palette"
import type { RasterBuffer } from "./raster"
import { fbm } from "./noise"

export type IridescenceParams = {
  scale: number
  speed: number
  saturation: number
  brightness: number
  opacity: number
  dither: number
}

export function paintIridescence(buffer: RasterBuffer, p: IridescenceParams, time: number, matrix: number[][]): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const t = time * p.speed
  const sat = clamp01(p.saturation)
  const bri = clamp01(p.brightness)

  for (let y = 0; y < rows; y++) {
    const v = (y + 0.5) / rows
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const u = (x + 0.5) / cols
      const w = fbm(u * p.scale, v * p.scale, t)
      const h = (u + v) * 180 + w * 360 + t * 40 + (my[x & 3] - 0.5) * p.dither * 40
      const [r, g, b] = hsvToRgb(h, sat, bri)
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
      data[i + 3] = clamp01(p.opacity) * 255
    }
  }
}
