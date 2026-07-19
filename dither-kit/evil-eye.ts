// Evil-eye field — a glowing eye whose iris tracks the cursor and that blinks,
// rendered through the kit's Bayer engine. A lens mask carves the eye; iris
// rings pulse around a dark pupil. Tinted across the colors ramp by radius.

import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"

export type EvilEyeParams = {
  colors: Rgb[]
  size: number
  speed: number
  pupilSize: number
  glow: number
  opacity: number
  dither: number
  mouseStrength: number
}

export function paintEvilEye(
  buffer: RasterBuffer,
  p: EvilEyeParams,
  time: number,
  matrix: number[][],
  mouse: { x: number; y: number } | null
): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const aspect = cols / rows
  const t = time * p.speed
  const eyeW = Math.max(0.1, p.size)
  const eyeH = eyeW * 0.55
  // Blink: openness dips briefly each cycle.
  const bt = (t * 0.25) % 1
  const openness = bt < 0.05 ? bt / 0.05 : bt > 0.95 ? (1 - bt) / 0.05 : 1
  const irisX = mouse ? (mouse.x - 0.5) * eyeW * 0.45 * p.mouseStrength : 0
  const irisY = mouse ? (mouse.y - 0.5) * eyeH * 0.45 * p.mouseStrength : 0
  const rP = clamp01(p.pupilSize) * 0.7
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const cy = (y + 0.5) / rows - 0.5
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const cx = ((x + 0.5) / cols - 0.5) * aspect
      const nx = cx / eyeW
      const ny = cy / eyeH
      const lid = (1 - nx * nx) * openness
      if (Math.abs(nx) >= 1 || Math.abs(ny) >= lid) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      const ir = Math.hypot((cx - irisX) / eyeH, (cy - irisY) / eyeH)
      let inten: number
      if (ir < rP) inten = 0.05
      else if (ir < 0.85) inten = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(ir * 20 - t * 2))
      else inten = 0.15
      const edge = lid - Math.abs(ny)
      if (edge < 0.12) inten = Math.max(inten, (1 - edge / 0.12) * 0.85)
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
      sampleRgbGradient(p.colors, clamp01(ir), col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = a * 255
    }
  }
}
