// The wipe engine: ordered-dither reveal masks for any DOM. A threshold sweep
// through a Bayer (or seeded) matrix turns `progress` into a CSS mask image:
// a cell shows once the sweep passes its threshold, so a dissolve resolves
// cell by cell in the kit's own pattern, a directional wipe moves a solid
// front with a dithered band behind it, and an iris grows that front as a
// circle. `invert` gives the complement, the outgoing side of a transition.
// Pure strings from pure numbers — the same progress gives the same mask,
// which is what a seeked frame needs.

import { pixelMatrixFromSeed } from "./pixel"

/** Where the front travels: "right" reveals from the left edge, "down" from the top, "iris" grows a circle from `origin`; "none" dissolves in place. */
export type WipeDirection = "none" | "right" | "left" | "down" | "up" | "iris"

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
  /** The iris's centre in CSS px from the box's top left; default the centre. */
  origin?: { x: number; y: number }
  /** Show what the mask at this progress hides: the outgoing side, so the
   * two masks of one progress tile the box with no cell in both. */
  invert?: boolean
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
const EMPTY: WipeStyle = {
  image: url(`<svg xmlns="${NS}" width="1" height="1"></svg>`),
  size: "100% 100%",
  repeat: "no-repeat",
  position: "0 0",
}

/** Rects for every cell whose threshold is below `level` (at or above it, inverted). */
function cells(matrix: number[][], level: number, cell: number, invert: boolean): string {
  let out = ""
  for (let y = 0; y < matrix.length; y++)
    for (let x = 0; x < matrix[y].length; x++)
      if (matrix[y][x] < level !== invert)
        out += `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}"/>`
  return out
}

/** The mask for `progress` (0 hidden → 1 shown; inverted, 0 shown → 1 hidden). */
export function wipeStyle(progress: number, opts: WipeOptions = {}): WipeStyle | null {
  const p = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 1
  const cell = Math.max(1, Math.round(opts.cell ?? 4))
  const matrix = opts.matrix ?? (opts.seed !== undefined ? pixelMatrixFromSeed(opts.seed) : BAYER8)
  const n = matrix.length
  const tile = n * cell
  const direction = opts.direction ?? "none"
  const invert = opts.invert === true
  const width = Math.round(opts.width ?? 0)
  const height = Math.round(opts.height ?? 0)
  // Every cell shown is no mask; none shown is the empty one.
  const all = invert ? EMPTY : null
  const none = invert ? null : EMPTY
  if (direction === "none" || width <= 0 || height <= 0) {
    // A dissolve: the tile repeats; cell k of n² shows at step k.
    const steps = n * n
    const k = Math.floor(p * steps + 1e-9)
    if (k >= steps) return all
    if (k <= 0) return none
    const key = `d:${cell}:${n}:${opts.seed ?? ""}:${invert}:${k}`
    const svg =
      cache.get(key) ??
      remember(
        key,
        `<svg xmlns="${NS}" width="${tile}" height="${tile}" shape-rendering="crispEdges">${cells(matrix, (k + 0.5) / steps, cell, invert)}</svg>`,
      )
    return { image: url(svg), size: `${tile}px ${tile}px`, repeat: "repeat", position: "0 0" }
  }
  // A front: solid inside it, then a band of four dither densities. A line
  // across the box for a direction, a circle around `origin` for the iris.
  const iris = direction === "iris"
  const horizontal = direction === "right" || direction === "left"
  const ox = Math.round(opts.origin?.x ?? width / 2)
  const oy = Math.round(opts.origin?.y ?? height / 2)
  const length = iris
    ? Math.ceil(Math.hypot(Math.max(ox, width - ox), Math.max(oy, height - oy)))
    : horizontal
      ? width
      : height
  const band = Math.max(0, Math.round(opts.band ?? 12)) * cell
  const edge = Math.round((p * (length + band) - band) / cell) * cell
  // Fully shown at 1 whatever the box's size modulo the cell.
  if (p >= 1 || edge >= length) return all
  if (edge + band <= 0) return none
  const key = `w:${cell}:${n}:${opts.seed ?? ""}:${direction}:${width}:${height}:${ox}:${oy}:${band}:${invert}:${edge}`
  let svg = cache.get(key)
  if (!svg) {
    const levels = [0.8, 0.6, 0.4, 0.2]
    const sub = band / levels.length
    // A run from `a` along the front's travel, `len` long.
    const run = (a: number, len: number, fill: string) => {
      const from = Math.max(0, a)
      const to = a + len
      if (to <= from) return ""
      if (iris) {
        const r = (from + to) / 2
        return `<circle cx="${ox}" cy="${oy}" r="${r}" fill="none" stroke="${fill}" stroke-width="${to - from}"/>`
      }
      const at = direction === "right" || direction === "down" ? from : length - to
      return horizontal
        ? `<rect x="${at}" y="0" width="${to - from}" height="${height}" fill="${fill}"/>`
        : `<rect x="0" y="${at}" width="${width}" height="${to - from}" fill="${fill}"/>`
    }
    // The solid side: inside the front, or (inverted) beyond its band.
    const beyond = edge + band
    let body = ""
    if (!invert)
      body += iris ? (edge > 0 ? `<circle cx="${ox}" cy="${oy}" r="${edge}" fill="#000"/>` : "") : run(0, edge, "#000")
    else if (iris)
      body +=
        beyond > 0
          ? `<path fill-rule="evenodd" fill="#000" d="M0 0H${width}V${height}H0Z M${ox - beyond} ${oy}a${beyond} ${beyond} 0 1 0 ${2 * beyond} 0a${beyond} ${beyond} 0 1 0 ${-2 * beyond} 0Z"/>`
          : `<rect width="${width}" height="${height}" fill="#000"/>`
    else body += run(beyond, length - beyond, "#000")
    let defs = ""
    levels.forEach((level, i) => {
      defs += `<pattern id="p${i}" width="${tile}" height="${tile}" patternUnits="userSpaceOnUse">${cells(matrix, level, cell, invert)}</pattern>`
      body += run(edge + i * sub, sub, `url(#p${i})`)
    })
    svg = remember(
      key,
      `<svg xmlns="${NS}" width="${width}" height="${height}" shape-rendering="crispEdges"><defs>${defs}</defs>${body}</svg>`,
    )
  }
  return { image: url(svg), size: `${width}px ${height}px`, repeat: "no-repeat", position: "0 0" }
}
