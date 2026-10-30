// The poster: the palette printed as tone, the way the kit prints everything.
// The surface is cut into columns and each column into tiles; a tile is one
// ink run along a tone ramp through a screen into a second ink (or the
// ground), so neighbouring fields dissolve into each other cell by cell.
// Over them sits the kit's mark, a diamond, printed as their negative:
// inside it every ramp turns over, and its screen slides with the clock. A
// seed lays out the columns, the tiles, their inks and ramps and the mark,
// so the same seed at the same moment gives the same raster.

import { SCREENS, type ScreenKind, xorshift32 } from "./pixel"
import type { Rgb } from "./palette"
import type { RasterBuffer } from "./raster"

export type PosterParams = {
  /** The inks the tiles are printed in (two or more). */
  inks: Rgb[]
  /** What a tile's open screen cells show where it has no second ink: a paper colour, or clear. */
  ground: Rgb | null
  /** The screen every tone is printed through. */
  screen: ScreenKind
  /** How fast the screen slides inside the mark, in cells per second. */
  speed: number
}

/** A tile: its box as fractions of the surface, its ink, what its open cells
 * show (an ink, or -1: the ground) and its tone: the ink's density `from` at
 * the tile's start to `to` at its end, down (`y`) or across (`x`). */
export type PosterTile = {
  x0: number
  x1: number
  y0: number
  y1: number
  ink: number
  under: number
  from: number
  to: number
  axis: "x" | "y"
}
/** The mark's centre as fractions of the width and height, its half
 * diagonal as a fraction of the height. */
export type PosterLayout = { tiles: PosterTile[]; mark: { x: number; y: number; r: number } }

/** `count` seeded weights summing to 1, as cut points from 0 to 1. */
function cuts(rand: () => number, count: number): number[] {
  const weights = Array.from({ length: count }, () => 0.6 + rand() * 1.4)
  const total = weights.reduce((a, b) => a + b, 0)
  let at = 0
  return [0, ...weights.map((w, i) => (i === count - 1 ? 1 : (at += w / total)))]
}

/** The composition a seed prints, for `inkCount` inks. */
export function posterLayout(seed: number, inkCount: number): PosterLayout {
  const rand = xorshift32(Math.round(seed) ^ 0x2545f491)
  const inks = Math.max(1, inkCount)
  const other = (not: number) => (inks < 2 ? not : (not + 1 + Math.floor(rand() * (inks - 1))) % inks)
  const columns = cuts(rand, 3 + Math.floor(rand() * 2))
  const tiles: PosterTile[] = []
  let left: number[] = []
  for (let c = 0; c + 1 < columns.length; c++) {
    const rows = cuts(rand, 1 + Math.floor(rand() * 2))
    const column: number[] = []
    for (let r = 0; r + 1 < rows.length; r++) {
      // Never the ink above it, nor (with three inks or more) the ink beside it.
      const above = r ? column[r - 1] : -1
      const beside = left.length ? left[Math.min(r, left.length - 1)] : -1
      let ink = Math.floor(rand() * inks)
      for (let k = 0; k < inks && (ink === above || (ink === beside && inks > 2)); k++) ink = (ink + 1) % inks
      column.push(ink)
      // Most tiles run a ramp; some are solid; a ramp starts dark or light.
      const solid = rand() < 0.3
      const low = 0.1 + rand() * 0.25
      const fall = rand() < 0.5
      tiles.push({
        x0: columns[c],
        x1: columns[c + 1],
        y0: rows[r],
        y1: rows[r + 1],
        ink,
        under: rand() < 0.45 ? -1 : other(ink),
        from: solid || fall ? 1 : low,
        to: solid || !fall ? 1 : low,
        axis: rand() < 0.7 ? "y" : "x",
      })
    }
    left = column
  }
  return { tiles, mark: { x: 0.5 + rand() * 0.2, y: 0.42 + rand() * 0.16, r: 0.32 + rand() * 0.12 } }
}

/** One frame of the poster at `time` seconds. */
export function paintPoster(buffer: RasterBuffer, layout: PosterLayout, p: PosterParams, time: number): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const screen = SCREENS[p.screen] ?? SCREENS.bayer
  const drift = Math.floor(time * p.speed)
  const cx = layout.mark.x * cols
  const cy = layout.mark.y * rows
  const r = Math.max(1, layout.mark.r * rows)
  const ink = (i: number) => p.inks[((i % p.inks.length) + p.inks.length) % p.inks.length]
  // The tiles each column holds, top to bottom, and the column under each x.
  const columns = [...new Set(layout.tiles.map((t) => t.x0))].sort((a, b) => a - b)
  const stacks = columns.map((x0) => layout.tiles.filter((t) => t.x0 === x0).sort((a, b) => a.y0 - b.y0))
  const columnOf = new Int32Array(cols)
  for (let x = 0, c = 0; x < cols; x++) {
    const fx = (x + 0.5) / cols
    while (c < stacks.length - 1 && fx >= stacks[c][0].x1) c++
    columnOf[x] = c
  }
  const at = new Array<PosterTile>(stacks.length)
  const step = new Int32Array(stacks.length)
  for (let y = 0; y < rows; y++) {
    const fy = (y + 0.5) / rows
    for (let c = 0; c < stacks.length; c++) {
      while (step[c] < stacks[c].length - 1 && fy >= stacks[c][step[c]].y1) step[c]++
      at[c] = stacks[c][step[c]]
    }
    const sy = screen[y & 3]
    const ay = Math.abs(y + 0.5 - cy)
    for (let x = 0; x < cols; x++) {
      const t = at[columnOf[x]]
      const along = t.axis === "y" ? (fy - t.y0) / (t.y1 - t.y0) : ((x + 0.5) / cols - t.x0) / (t.x1 - t.x0)
      const tone = t.from + (t.to - t.from) * along
      const inside = Math.abs(x + 0.5 - cx) + ay < r
      const lit = inside ? 1 - tone > sy[(x + drift) & 3] : tone > sy[x & 3]
      const c = lit ? ink(t.ink) : t.under < 0 ? p.ground : ink(t.under)
      const i = (y * cols + x) * 4
      if (c) {
        data[i] = c[0]
        data[i + 1] = c[1]
        data[i + 2] = c[2]
        data[i + 3] = 255
      } else data[i + 3] = 0
    }
  }
}
