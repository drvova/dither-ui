// The wipe engine: ordered-dither reveal masks for any DOM. A threshold sweep
// through a Bayer (or seeded) matrix turns `progress` into a CSS mask image:
// a cell shows once the sweep passes its threshold, so a dissolve resolves
// cell by cell in the kit's own pattern, and a directional wipe moves a solid
// front with a dithered band behind it. Pure strings from pure numbers — the
// same progress gives the same mask, which is what a seeked frame needs.

import { pixelMatrixFromSeed } from "./pixel"

/** Where the front travels: "right" reveals from the left edge, "down" from the top; "none" dissolves in place. */
export type WipeDirection = "none" | "right" | "left" | "down" | "up"

export type WipeOptions = {
  /** Cell size in CSS px. */
  cell?: number
  /** Threshold matrix; default the 8x8 Bayer, or the kit's seeded 4x4 with `seed`. */
  matrix?: number[][]
  seed?: number
  direction?: WipeDirection
  /** Directional wipes: the dithered band's width in cells. */
  band?: number
  /** Directional wipes: the element's size in CSS px (a dissolve without it). */
  width?: number
  height?: number
}

/** Values for `mask-image` / `mask-size` / `mask-repeat` / `mask-position`
 * (and their `-webkit-` spellings). `wipeStyle` returns null when the
 * content is fully shown — remove the mask then. */
export type WipeStyle = { image: string; size: string; repeat: string; position: string }

/** Recursive Bayer matrix of size n (1, 2, 4, 8, 16 …), thresholds (v + 0.5) / n². */
export function bayerMatrix(n: number): number[][] {
  let m = [[0]]
  let size = 1
  while (size < n) {
    const next: number[][] = []
    for (let y = 0; y < size * 2; y++) {
      next.push([])
      for (let x = 0; x < size * 2; x++) {
        const quadrant = (y >= size ? 2 : 0) + (x >= size ? 1 : 0)
        next[y].push(4 * m[y % size][x % size] + [0, 2, 3, 1][quadrant])
      }
    }
    m = next
    size *= 2
  }
  const total = size * size
  return m.map((row) => row.map((v) => (v + 0.5) / total))
}

export const BAYER8 = bayerMatrix(8)

const NS = "http://www.w3.org/2000/svg"
const cache = new Map<string, string>()
function remember(key: string, svg: string): string {
  if (cache.size > 512) cache.clear()
  cache.set(key, svg)
  return svg
}
const url = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
const EMPTY = url(`<svg xmlns="${NS}" width="1" height="1"></svg>`)

/** Rects for every cell whose threshold is below `level`. */
function cells(matrix: number[][], level: number, cell: number): string {
  let out = ""
  for (let y = 0; y < matrix.length; y++)
    for (let x = 0; x < matrix[y].length; x++)
      if (matrix[y][x] < level) out += `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}"/>`
  return out
}

/** The mask for `progress` (0 hidden → 1 shown). */
export function wipeStyle(progress: number, opts: WipeOptions = {}): WipeStyle | null {
  const p = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 1
  const cell = Math.max(1, Math.round(opts.cell ?? 4))
  const matrix = opts.matrix ?? (opts.seed !== undefined ? pixelMatrixFromSeed(opts.seed) : BAYER8)
  const n = matrix.length
  const tile = n * cell
  const direction = opts.direction ?? "none"
  const width = Math.round(opts.width ?? 0)
  const height = Math.round(opts.height ?? 0)
  if (direction === "none" || width <= 0 || height <= 0) {
    // A dissolve: the tile repeats; cell k of n² shows at step k.
    const steps = n * n
    const k = Math.floor(p * steps + 1e-9)
    if (k >= steps) return null
    if (k <= 0) return { image: EMPTY, size: "100% 100%", repeat: "no-repeat", position: "0 0" }
    const key = `d:${cell}:${n}:${opts.seed ?? ""}:${k}`
    const svg = cache.get(key) ?? remember(key, `<svg xmlns="${NS}" width="${tile}" height="${tile}" shape-rendering="crispEdges">${cells(matrix, (k + 0.5) / steps, cell)}</svg>`)
    return { image: url(svg), size: `${tile}px ${tile}px`, repeat: "repeat", position: "0 0" }
  }
  // A directional wipe: a solid front, then a band of four dither densities.
  const horizontal = direction === "right" || direction === "left"
  const length = horizontal ? width : height
  const band = Math.max(0, Math.round(opts.band ?? 12)) * cell
  const edge = Math.round((p * (length + band) - band) / cell) * cell
  // Fully shown at 1 whatever the box's size modulo the cell.
  if (p >= 1 || edge >= length) return null
  if (edge + band <= 0) return { image: EMPTY, size: "100% 100%", repeat: "no-repeat", position: "0 0" }
  const key = `w:${cell}:${n}:${opts.seed ?? ""}:${direction}:${width}:${height}:${band}:${edge}`
  let svg = cache.get(key)
  if (!svg) {
    const levels = [0.8, 0.6, 0.4, 0.2]
    const sub = band / levels.length
    let defs = ""
    let body = ""
    const rect = (a: number, len: number, fill: string) => {
      if (len <= 0) return ""
      const from = direction === "right" || direction === "down" ? a : length - a - len
      return horizontal ? `<rect x="${from}" y="0" width="${len}" height="${height}" fill="${fill}"/>` : `<rect x="0" y="${from}" width="${width}" height="${len}" fill="${fill}"/>`
    }
    body += rect(0, Math.max(0, edge), "#000")
    levels.forEach((level, i) => {
      defs += `<pattern id="p${i}" width="${tile}" height="${tile}" patternUnits="userSpaceOnUse">${cells(matrix, level, cell)}</pattern>`
      body += rect(edge + i * sub, sub, `url(#p${i})`)
    })
    svg = remember(key, `<svg xmlns="${NS}" width="${width}" height="${height}" shape-rendering="crispEdges"><defs>${defs}</defs>${body}</svg>`)
  }
  return { image: url(svg), size: `${width}px ${height}px`, repeat: "no-repeat", position: "0 0" }
}
