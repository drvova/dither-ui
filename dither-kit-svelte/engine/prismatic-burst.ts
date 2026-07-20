// Prismatic-burst field — a rainbow starburst radiating from the centre,
// rendered through the kit's Bayer engine. Sharpened angular rays modulated by a
// radial pulse take an HSV hue from angle + radius, so the burst is a spectrum;
// ordered dithering bands the colours.

import { clamp01 } from "./pixel"
import { hsvToRgb } from "./palette"
import type { RasterBuffer } from "./raster"

const TAU = Math.PI * 2

export type PrismaticBurstParams = {
  rays: number
  speed: number
  spread: number
  saturation: number
  brightness: number
  opacity: number
  dither: number
}

export function paintPrismaticBurst(buffer: RasterBuffer, p: PrismaticBurstParams, time: number, matrix: number[][]): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const aspect = cols / rows
  const t = time * p.speed
  const rays = Math.max(1, Math.round(p.rays))
  const sharp = Math.max(0.2, p.spread)
  const sat = clamp01(p.saturation)

  for (let y = 0; y < rows; y++) {
    const cy = (y + 0.5) / rows - 0.5
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const cx = ((x + 0.5) / cols - 0.5) * aspect
      const r = Math.hypot(cx, cy)
      const ang = (Math.atan2(cy, cx) + TAU) % TAU
      const ray = Math.pow(0.5 + 0.5 * Math.sin(ang * rays + t * 2), sharp)
      const pulse = 0.5 + 0.5 * Math.sin(r * 10 - t * 3)
      const fall = clamp01(1 - r * 1.2)
      const inten = clamp01(ray * fall * (0.5 + 0.5 * pulse))
      if (inten <= 0.03) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      const hue = (ang / TAU) * 360 + r * 180 + t * 40 + (my[x & 3] - 0.5) * p.dither * 30
      const [rr, gg, bb] = hsvToRgb(hue, sat, clamp01(p.brightness * inten))
      const a = inten * clamp01(p.opacity)
      data[i] = rr
      data[i + 1] = gg
      data[i + 2] = bb
      data[i + 3] = a * 255
    }
  }
}
