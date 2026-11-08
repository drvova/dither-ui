// Heat trail: the pointer prints. Where it passes it lays down the kit's diamond
// in cells, hot; each cell then cools, its ink stepping down the ramp from
// the hottest to the coolest while the Bayer thresholds thin it out, until
// nothing is left and the ground is still again. The field is heat per
// cell: a stroke stamps along its path (never a dotted line however fast
// the hand), and time only ever takes heat away, at one rate, so a cooled
// field is exactly empty. Vue-free: both kits share it verbatim.

import type { Rgb } from "./palette"
import type { RasterBuffer } from "./raster"

/** Resolved knobs, colours as rgb. */
export type TrailParams = {
  /** The ramp, coolest first, hottest last: a fresh cell takes the last. */
  inks: readonly Rgb[]
  /** Seconds a cell takes to cool from fresh to nothing. */
  cool: number
  /** The diamond's radius in cells. */
  size: number
}

/** The field: heat per cell, 0-1, and the stroke's last point. */
export type Trail = {
  cols: number
  rows: number
  heat: Float32Array
  /** The previous point of the stroke in cells, or null between strokes. */
  last: [number, number] | null
  /** Whether any cell still holds heat. */
  hot: boolean
}

export function createTrail(cols: number, rows: number): Trail {
  return { cols, rows, heat: new Float32Array(cols * rows), last: null, hot: false }
}

/** The same field at a new size: what it held is let go. */
export function fitTrail(t: Trail, cols: number, rows: number): Trail {
  return t.cols === cols && t.rows === rows ? t : createTrail(cols, rows)
}

/** How much cooler a fresh diamond's rim is than its heart. Every cell
 * loses heat at one rate, so the rim goes first: a stroke is the full
 * diamond only at the hand and tapers to its heart's one cell before it
 * dissolves, a comet rather than a rope of one width. */
export const RIM_COOL = 0.6

/** Stamp the diamond at a cell: hottest at its heart, `RIM_COOL` cooler at
 * its rim, never cooling what is already hotter. */
function stamp(t: Trail, cx: number, cy: number, size: number) {
  const r = Math.max(0, Math.round(size))
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) {
      const d = Math.abs(dx) + Math.abs(dy)
      if (d > r) continue
      const x = cx + dx
      const y = cy + dy
      if (x < 0 || y < 0 || x >= t.cols || y >= t.rows) continue
      const i = y * t.cols + x
      const h = 1 - (RIM_COOL * d) / (r + 1)
      if (h > t.heat[i]) t.heat[i] = h
    }
  t.hot = true
}

/** The pointer at (`u`, `v`), a fraction of the field each: stamp from the
 * stroke's last point to here, one cell at a time. */
export function trailTo(t: Trail, u: number, v: number, size: number): void {
  const x = Math.round(u * (t.cols - 1))
  const y = Math.round(v * (t.rows - 1))
  const [x0, y0] = t.last ?? [x, y]
  const steps = Math.max(Math.abs(x - x0), Math.abs(y - y0), 1)
  for (let s = 1; s <= steps; s++)
    stamp(t, Math.round(x0 + ((x - x0) * s) / steps), Math.round(y0 + ((y - y0) * s) / steps), size)
  t.last = [x, y]
}

/** The stroke ends (the pointer left or lifted): the next starts afresh. */
export function trailLift(t: Trail): void {
  t.last = null
}

/** The page moved `rows` cells under a field pinned to the viewport: the
 * print goes with it (up for a positive count, as a scroll down moves it),
 * and what leaves the field is let go. */
export function scrollTrail(t: Trail, rows: number): void {
  if (!rows) return
  const { cols, rows: n, heat } = t
  if (Math.abs(rows) >= n) heat.fill(0)
  else if (rows > 0) {
    heat.copyWithin(0, rows * cols)
    heat.fill(0, (n - rows) * cols)
  } else {
    heat.copyWithin(-rows * cols, 0, (n + rows) * cols)
    heat.fill(0, 0, -rows * cols)
  }
  if (t.last) t.last = [t.last[0], t.last[1] - rows]
}

/** Let `dt` seconds go by: every cell loses the same heat. Says whether
 * any heat is left. */
export function coolTrail(t: Trail, dt: number, cool: number): boolean {
  const loss = dt / Math.max(0.05, cool)
  let hot = false
  const h = t.heat
  for (let i = 0; i < h.length; i++) {
    if (h[i] <= 0) continue
    h[i] = Math.max(0, h[i] - loss)
    if (h[i] > 0) hot = true
  }
  t.hot = hot
  return hot
}

/** Print the field: a cell shows while its heat clears its threshold, in
 * the ink of its heat. */
export function paintTrail(buffer: RasterBuffer, t: Trail, p: TrailParams, matrix: number[][]): void {
  const { width: cols, height: rows, data } = buffer
  data.fill(0)
  if (!t.hot || t.cols !== cols || t.rows !== rows || !p.inks.length) return
  const n = p.inks.length
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const h = t.heat[y * cols + x]
      if (h <= matrix[y & 3][x & 3]) continue
      const rgb = p.inks[Math.min(n - 1, Math.floor(h * n))]
      const o = (y * cols + x) * 4
      data[o] = rgb[0]
      data[o + 1] = rgb[1]
      data[o + 2] = rgb[2]
      data[o + 3] = 255
    }
}
