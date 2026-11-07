// The gauge: an instrument dial's geometry and its printed band, Vue-free so
// both kits share it verbatim. The dial sweeps 240 degrees clockwise from
// the lower left to the lower right (screen angles: 0 points right, y down),
// the band between two radii printed cell by cell through the threshold
// matrix: filled up to the needle with its density rising along the sweep,
// the rest a faint track, and past `warn` the zone in the warning ink, as a
// dial marks the range not to run in.

import type { Rgb } from "./palette"
import { clamp01 } from "./pixel"
import { cellCanvas } from "./raster"

/** Where the sweep starts and how far it turns, in degrees. */
export const GAUGE_START = 150
export const GAUGE_SWEEP = 240
/** The band's inner and outer radius, as shares of the dial's radius. */
export const GAUGE_BAND = [0.72, 0.94] as const

/** The needle's angle in degrees for a reading at `ratio` (0..1) of the scale. */
export const gaugeAngle = (ratio: number): number => GAUGE_START + clamp01(ratio) * GAUGE_SWEEP

/** The point at `angle` degrees and `r` (a share of the radius) on a dial of
 * radius 50 centred in a 100 by 100 box, the box the dial's SVG draws in. */
export function gaugePoint(angle: number, r: number): [number, number] {
  const a = (angle * Math.PI) / 180
  return [50 + Math.cos(a) * 50 * r, 50 + Math.sin(a) * 50 * r]
}

/** The ratios of the major ticks: `ticks` intervals, so ticks + 1 marks. */
export function gaugeTicks(ticks: number): number[] {
  const n = Math.max(1, Math.round(ticks))
  return Array.from({ length: n + 1 }, (_, i) => i / n)
}

/** How far along the sweep (0..1) a cell at (dx, dy) from the centre sits,
 * or null outside the sweep's gap at the bottom. */
export function gaugeAlong(dx: number, dy: number): number | null {
  let deg = (Math.atan2(dy, dx) * 180) / Math.PI
  deg = (((deg - GAUGE_START) % 360) + 360) % 360
  return deg <= GAUGE_SWEEP ? deg / GAUGE_SWEEP : null
}

/** Print the band on a `cells` by `cells` grid: filled to `ratio`, the zone
 * past `warn` (null: none) in `warnInk`, the rest a faint track. */
export function paintGauge(
  ctx: CanvasRenderingContext2D,
  cells: number,
  ink: Rgb,
  track: Rgb,
  warnInk: Rgb,
  ratio: number,
  warn: number | null,
  matrix: number[][],
): void {
  const px = cellCanvas(ctx, cells, cells)
  const c = cells / 2
  const [inner, outer] = GAUGE_BAND
  const fill = clamp01(ratio)
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      const dx = x + 0.5 - c
      const dy = y + 0.5 - c
      const r = Math.hypot(dx, dy) / c
      if (r < inner || r > outer) continue
      const t = gaugeAlong(dx, dy)
      if (t === null) continue
      const threshold = matrix[y & 3][x & 3]
      const zone = warn !== null && t >= warn
      if (t <= fill) {
        const density = 0.35 + 0.65 * (t / Math.max(fill, 1e-6))
        const k = 0.3 + density * 0.7
        px.cell(x, y, zone ? warnInk : ink, clamp01(density > threshold ? k : k * 0.4))
      } else if (zone) {
        px.cell(x, y, warnInk, 0.4 > threshold ? 0.45 : 0.12)
      } else {
        px.cell(x, y, track, 0.25 > threshold ? 0.2 : 0.06)
      }
    }
  }
  px.flush()
}
