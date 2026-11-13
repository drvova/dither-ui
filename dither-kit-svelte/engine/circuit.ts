// Circuit: a board printed through the kit's Bayer engine. Chips sit on a
// lattice, a dithered package each with its pins and a notch at pin one;
// traces leave their pins and cross the board in straight runs with 45
// degree jogs, never over a node another trace holds, ending in a via (a
// ring) or a pad; and signals run along every trace, a head in the pulse
// ink with a tail that fades through the thresholds. The board is drawn
// from the seed and the size; the signals are a pure function of time, so
// a moment prints the same however it was reached. Framework-free: both kits
// share it verbatim.

import { xorshift32 } from "./pixel"
import type { Rgb } from "./palette"
import type { RasterBuffer } from "./raster"

/** Resolved knobs, colours as rgb. */
export type CircuitParams = {
  /** The traces, chips and vias. */
  ink: Rgb
  /** The signals. */
  pulse: Rgb
  /** How much of the board carries traces, 0-1. */
  density: number
  /** Cells a second a signal travels. */
  speed: number
  /** Cells between lattice nodes. */
  pitch: number
  seed: number
}

type Point = [number, number]
type Chip = { x: number; y: number; w: number; h: number }
/** A trace: its cells in order from its first pin to its end, and how it ends. */
type Trace = { cells: Point[]; end: "via" | "pad"; phase: number; gap: number }
export type Board = { cols: number; rows: number; pitch: number; chips: Chip[]; traces: Trace[] }

/** The eight directions on the lattice, clockwise from east. */
const DIRS: Point[] = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
]

/** The cells of a straight run between two cell points, ends included. */
function run([x0, y0]: Point, [x1, y1]: Point): Point[] {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))
  const out: Point[] = []
  for (let s = 0; s <= steps; s++)
    out.push([x0 + Math.round(((x1 - x0) * s) / (steps || 1)), y0 + Math.round(((y1 - y0) * s) / (steps || 1))])
  return out
}

/** Lay out a board for a `cols` by `rows` raster: the same seed and size
 * give the same board. */
export function circuitBoard(cols: number, rows: number, p: Pick<CircuitParams, "density" | "pitch" | "seed">): Board {
  const pitch = Math.max(2, Math.round(p.pitch))
  const gw = Math.floor((cols - 2) / pitch) + 1
  const gh = Math.floor((rows - 2) / pitch) + 1
  const rand = xorshift32(Math.round(p.seed) || 0x9e3779b9)
  const used = new Uint8Array(gw * gh)
  const free = (x: number, y: number) => x >= 0 && y >= 0 && x < gw && y < gh && !used[y * gw + x]
  const take = (x: number, y: number) => (used[y * gw + x] = 1)
  const at = (gx: number, gy: number): Point => [1 + gx * pitch, 1 + gy * pitch]
  const density = Math.max(0, Math.min(1, p.density))

  // the chips first: packages on the lattice with a node of clearance
  const chips: Chip[] = []
  const chipCount = Math.round((gw * gh * density) / 90)
  for (let k = 0, tries = 0; k < chipCount && tries < 60; tries++) {
    const w = 3 + Math.floor(rand() * 4)
    const h = 2 + Math.floor(rand() * 2)
    const x = 1 + Math.floor(rand() * (gw - w - 2))
    const y = 1 + Math.floor(rand() * (gh - h - 2))
    let clear = x > 0 && y > 0
    for (let j = y - 1; clear && j <= y + h; j++) for (let i = x - 1; i <= x + w; i++) if (!free(i, j)) clear = false
    if (!clear) continue
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) take(i, j)
    chips.push({ x, y, w, h })
    k++
  }

  // a trace from a node heading `dir`: straight runs with 45 degree jogs
  const traces: Trace[] = []
  const route = (sx: number, sy: number, dir: number, length: number, pin?: Point) => {
    if (!free(sx, sy)) return
    const nodes: Point[] = [[sx, sy]]
    take(sx, sy)
    let [x, y] = [sx, sy]
    let d = dir
    for (let s = 0; s < length; s++) {
      // mostly straight; a jog turns 45 degrees and turns back soon after
      if (rand() < 0.22) d = (d + (rand() < 0.5 ? 1 : 7)) % 8
      else if (d % 2 && rand() < 0.5) d = (d + (rand() < 0.5 ? 1 : 7)) % 8
      const [dx, dy] = DIRS[d]
      const nx = x + dx
      const ny = y + dy
      // a diagonal never cuts between two held nodes
      if (!free(nx, ny) || (dx && dy && !free(x + dx, y) && !free(x, y + dy))) break
      take(nx, ny)
      nodes.push([nx, ny])
      x = nx
      y = ny
    }
    if (nodes.length < 3) return
    // a pin's trace starts at the pin, under the package's rim
    if (pin) nodes.unshift(pin)
    const cells: Point[] = []
    for (let k = 1; k < nodes.length; k++) {
      const seg = run(at(...nodes[k - 1]), at(...nodes[k]))
      cells.push(...(k === 1 ? seg : seg.slice(1)))
    }
    traces.push({ cells, end: rand() < 0.7 ? "via" : "pad", phase: rand(), gap: 12 + Math.floor(rand() * 40) })
  }
  // from the chips' pins: out of their long sides
  for (const c of chips)
    for (let i = c.x; i < c.x + c.w; i++) {
      if (rand() < 0.75) route(i, c.y - 1, 6, 4 + Math.floor(rand() * 18), [i, c.y])
      if (rand() < 0.75) route(i, c.y + c.h, 2, 4 + Math.floor(rand() * 18), [i, c.y + c.h - 1])
    }
  // then free runs across the board
  const freeRuns = Math.round((gw * gh * density) / 14)
  for (let k = 0; k < freeRuns; k++)
    route(Math.floor(rand() * gw), Math.floor(rand() * gh), Math.floor(rand() * 4) * 2, 5 + Math.floor(rand() * 20))

  return {
    cols,
    rows,
    pitch,
    chips: chips.map((c) => {
      const [x, y] = at(c.x, c.y)
      return { x: x - 1, y: y - 1, w: (c.w - 1) * pitch + 3, h: (c.h - 1) * pitch + 3 }
    }),
    traces,
  }
}

/** The boards in use, a few at a time (each surface on a page keeps its own). */
const boards = new Map<string, Board>()
const KEEP = 8

/** The board for this raster and these knobs, kept while they hold. */
export function boardFor(cols: number, rows: number, p: CircuitParams): Board {
  const key = `${cols}x${rows}:${p.seed}:${p.density}:${p.pitch}`
  let board = boards.get(key)
  if (board) boards.delete(key)
  else board = circuitBoard(cols, rows, p)
  boards.set(key, board)
  if (boards.size > KEEP) boards.delete(boards.keys().next().value as string)
  return board
}

/** Where a trace's signal head stands at `time`, in cells along it; past
 * its last cell the signal is in its gap, unseen. */
export function signalHead(trace: Trace, time: number, speed: number): number {
  const loop = trace.cells.length + trace.gap
  return (((time * speed + trace.phase * loop) % loop) + loop) % loop
}

/** Cells the signal's tail runs behind its head. */
export const SIGNAL_TAIL = 8

/** Paint one frame of the board into a raster. */
export function paintCircuit(buffer: RasterBuffer, p: CircuitParams, time: number, matrix: number[][]): void {
  const { width: cols, height: rows, data } = buffer
  data.fill(0)
  const board = boardFor(cols, rows, p)
  const put = (x: number, y: number, rgb: Rgb, k = 1) => {
    if (x < 0 || y < 0 || x >= cols || y >= rows) return
    const o = (y * cols + x) * 4
    data[o] = rgb[0] * k
    data[o + 1] = rgb[1] * k
    data[o + 2] = rgb[2] * k
    data[o + 3] = 255
  }
  // the packages: a dithered body, a solid rim, the notch at pin one
  for (const c of board.chips) {
    for (let y = c.y; y < c.y + c.h; y++)
      for (let x = c.x; x < c.x + c.w; x++) {
        const rim = x === c.x || y === c.y || x === c.x + c.w - 1 || y === c.y + c.h - 1
        if (rim) put(x, y, p.ink, 0.8)
        else if (0.28 > matrix[y & 3][x & 3]) put(x, y, p.ink, 0.55)
      }
    put(c.x + 2, c.y + 2, p.ink)
  }
  // the traces, a shade under the ink, and how each ends
  for (const t of board.traces) {
    for (const [x, y] of t.cells) put(x, y, p.ink, 0.55)
    const [ex, ey] = t.cells[t.cells.length - 1]
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) if (t.end === "pad" || dx || dy) put(ex + dx, ey + dy, p.ink)
  }
  // the signals: a head in the pulse ink, a tail fading through the thresholds
  for (const t of board.traces) {
    const head = Math.floor(signalHead(t, time, p.speed))
    for (let k = 0; k <= SIGNAL_TAIL; k++) {
      const i = head - k
      if (i < 0 || i >= t.cells.length) continue
      const [x, y] = t.cells[i]
      const level = 1 - k / (SIGNAL_TAIL + 1)
      if (k === 0 || level > matrix[y & 3][x & 3]) put(x, y, p.pulse)
    }
  }
}
