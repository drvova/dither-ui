// Pixel-blast field — expanding shockwave rings broken into chunky pixels,
// rendered through the kit's Bayer engine. Several rings pulse outward from the
// centre and fade; a coarse hash grid pixelates them. Tinted by radius.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"
import { hash21 } from "./noise"

export type PixelBlastParams = {
  colors: Rgb[]
  waves: number
  speed: number
  pixels: number
  glow: number
  opacity: number
  dither: number
}

export function paintPixelBlast(buffer: RasterBuffer, p: PixelBlastParams, time: number, matrix: number[][]): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const aspect = cols / rows
  const t = time * p.speed
  const waves = Math.max(1, Math.round(p.waves))
  const pg = Math.max(6, Math.round(p.pixels))
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const cy = (y + 0.5) / rows - 0.5
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const u = (x + 0.5) / cols
      const cx = (u - 0.5) * aspect
      const r = Math.hypot(cx, cy) * 1.4
      let inten = 0
      for (let w = 0; w < waves; w++) {
        const phase = (t + w / waves) % 1
        const ringR = phase * 1.2
        const d = Math.abs(r - ringR)
        const width = 0.05 + phase * 0.12
        if (d < width) inten = Math.max(inten, (1 - d / width) * (1 - phase))
      }
      const spark = hash21(Math.floor(u * pg), Math.floor((cy + 0.5) * pg))
      inten *= spark > 0.3 ? 1 : 0.25
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
