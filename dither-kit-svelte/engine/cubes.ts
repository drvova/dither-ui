// Cubes — a rhombille tiling (hexagons split into three rhombi) reads as a field
// of isometric cubes; each cube's three faces get top/left/right shades and a
// per-cube brightness pulse. Tinted across the colors ramp, ordered-dithered.

import { clamp01 } from "./pixel"
import { fbm } from "./noise"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"

export type CubesParams = {
  colors: Rgb[]
  scale: number
  speed: number
  opacity: number
  dither: number
}

const SQRT3 = Math.sqrt(3)
const FACE = [1, 0.52, 0.3]

// axial hex round (pointy-top)
function hexRound(q: number, r: number): [number, number] {
  const x = q
  const z = r
  const y = -x - z
  let rx = Math.round(x)
  const ry = Math.round(y)
  let rz = Math.round(z)
  const dx = Math.abs(rx - x)
  const dy = Math.abs(ry - y)
  const dz = Math.abs(rz - z)
  // only rx/rz are returned, so the "correct ry" case is a no-op
  if (dx > dy && dx > dz) rx = -ry - rz
  else if (dz > dy) rz = -rx - ry
  return [rx, rz]
}

export function paintCubes(buffer: RasterBuffer, p: CubesParams, time: number, matrix: number[][]): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const aspect = cols / rows
  const t = time * p.speed
  const dens = Math.max(1, p.scale)
  const col: [number, number, number] = [0, 0, 0]

  for (let y = 0; y < rows; y++) {
    const v = (y + 0.5) / rows
    const my = matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const u = (x + 0.5) / cols
      const px = (u - 0.5) * aspect * dens
      const py = (v - 0.5) * dens
      const q = (SQRT3 / 3) * px - (1 / 3) * py
      const r = (2 / 3) * py
      const [Q, R] = hexRound(q, r)
      const cx = SQRT3 * (Q + R / 2)
      const cy = 1.5 * R
      const ang = Math.atan2(py - cy, px - cx) + Math.PI / 6
      const face = (((Math.floor(ang / ((2 * Math.PI) / 3)) % 3) + 3) % 3)
      const shade = FACE[face]
      const pulse = 0.55 + 0.45 * fbm(Q * 0.35, R * 0.35, t)
      let inten = clamp01(shade * pulse)
      if (p.dither > 0) {
        const th = my[x & 3]
        inten = inten * (1 - p.dither) + (inten > th ? 1 : 0) * p.dither
      }
      const a = clamp01(inten) * p.opacity
      if (a <= 0) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
        continue
      }
      sampleRgbGradient(p.colors, clamp01(shade), col)
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = a * 255
    }
  }
}
