// The brand as cells: the mark, and the lockup it leads with the pixel
// wordmark, and its moment, `choreograph`, pure: cells in, a path per cell
// out, in one of five moves, so each place the brand stands (the hero, the
// plates, the footer) forms it its own way. `BrandGather.vue` plays it.
import { xorshift32 } from "@dither-kit/engine/pixel"
import { layoutPixelText, PIXEL_ROWS } from "./pixel-type"

/** The brand mark as the cells of a 7x7 grid: the diamond within three
 * steps of its centre, the centre its ember core. The header draws it;
 * the lockup leads with it. */
export const MARK_CELLS = Array.from({ length: 49 }, (_, i) => ({ x: i % 7, y: Math.floor(i / 7) }))
  .filter((c) => Math.abs(c.x - 3) + Math.abs(c.y - 3) <= 3)
  .map((c) => ({ ...c, core: c.x === 3 && c.y === 3 }))

const WORD = layoutPixelText("DITHER-UI")
const GAP = 3
/** The brand as one lockup of cells: the mark, three clear columns, then the
 * wordmark in the pixel face, all seven cells tall. The mark's cells come
 * first, in `MARK_CELLS` order; `glyph` counts the mark 0 and the word's
 * letters from 1. */
export const LOCKUP = [
  ...MARK_CELLS.map((c) => ({ ...c, glyph: 0 })),
  ...WORD.cells.map((c) => ({ x: 7 + GAP + c.x, y: c.y, core: false, glyph: c.char + 1 })),
]
export const LOCKUP_SIZE = { width: 7 + GAP + WORD.width, height: PIXEL_ROWS } as const

/** The moment's clock, in ms from the brand coming into view, shared by
 * every move: each is home by `end`, under five seconds (held by
 * `tests/landing-facts.spec.ts`). The gather's phases: each mark cell lifts
 * out of the field between `lift` and `lift + sweep`, the leftmost first,
 * and travels at `pace` cells a second, held to `span`; at `burst.at` the
 * mark flies apart to the right over `span`, the wordmark's cells, carried
 * inside it until then, with it; each cell then travels home over
 * `settle.span`, starting in order across the lockup over `sweep`. */
export const MOMENT = {
  gather: { lift: 500, sweep: 900, pace: 60, span: [700, 1300] },
  burst: { at: 3000, span: 300 },
  settle: { at: 3400, sweep: 500, span: 700 },
  end: 4600,
} as const

export type Waypoint = { t: number; x: number; y: number }

/** The ways the brand forms, one per place it stands:
 * - `gather`: loose cells gather into the mark, which bursts to the right
 *   and settles into the whole brand.
 * - `rain`: the cells hang in one dotted line along the scene's first row
 *   and fall column by column, left to right, each column landing from the
 *   bottom up.
 * - `converge`: the seven rows slide in whole, alternately from the
 *   field's left and right edges, top row first, and interlock.
 * - `strike`: a typewriter: the glyphs wait stacked at the carriage on the
 *   scene's first row, and one by one each slides out to its column and
 *   strikes down into place. */
export const MOVES = ["gather", "rain", "converge", "strike"] as const
export type Move = (typeof MOVES)[number]

/** Where in its field the brand's moment plays, in px from the field's top:
 * how it forms, the rows its cells lie loose in, the rows the gather's
 * burst may throw a cell to, and the seed that places them, the same on
 * every visit. */
export type Scene = {
  move: Move
  seed: number
  loose: readonly [number, number]
  burst: readonly [number, number]
}

/** A scene in a field of `height` px whose lockup stands `top` px down it. */
export type Staging = (height: number, top: number) => Scene

/** Where the brand stands outside the plates (`plate.ts` stages those):
 * the hero's sign-off gathers, loose in the open rows under the statement,
 * its burst kept off the copy above; the footer's brand strikes, from the
 * clear band above it (the footer's top padding, above every line of
 * text). */
export const STAGINGS = {
  hero: (height, top) => ({
    move: "gather",
    seed: 5,
    loose: [top - 24, Math.min(height - 8, top + 160)],
    burst: [top - 24, height],
  }),
  foot: (_height, top) => ({ move: "strike", seed: 9, loose: [4, top - 4], burst: [4, top + 32] }),
} as const satisfies Record<string, Staging>

/** What a move works with: the field, the slots, the grid and the seed. */
type Stage = {
  scene: Scene
  w: number
  h: number
  slots: readonly { x: number; y: number }[]
  cell: number
  rand: () => number
  /** A waypoint for cell `i`, a whole number of cells from its slot. */
  at: (i: number, x: number, y: number, t: number) => Waypoint
  /** The lockup's left edge and width, in px. */
  left: number
  width: number
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const ids = (n: number) => [...Array(n).keys()]
/** A leg's duration: `steps` cells at `pace` cells a second, held to `span`. */
const leg = (steps: number, pace: number, span: readonly [number, number]) =>
  clamp((steps / pace) * 1000, span[0], span[1])

function gather({ scene, w, h, slots, cell, rand, at, left, width }: Stage): Waypoint[][] {
  const { gather, burst, settle } = MOMENT
  const across = (list: number[]) => list.sort((a, b) => slots[a].x - slots[b].x || slots[a].y - slots[b].y)
  const byX = <T extends { x: number }>(ps: T[]) => ps.sort((a, b) => a.x - b.x)

  // The mark's cells lie loose in the scene's rows, and are matched to
  // their slots in the same order across, so paths seldom cross.
  const marks = MARK_CELLS.length
  const [lo, hi] = scene.loose
  const loose = byX(MARK_CELLS.map(() => ({ x: (0.02 + rand() * 0.96) * w, y: lo + rand() * (hi - lo) })))
  const paths: Waypoint[][] = Array.from({ length: slots.length }, () => [])
  across(ids(marks)).forEach((i, k) => {
    const from = at(i, loose[k].x, loose[k].y, 0)
    const steps = Math.max(Math.abs(from.x - slots[i].x), Math.abs(from.y - slots[i].y)) / cell
    const lift = gather.lift + (from.x / w) * gather.sweep
    paths[i] = [from, { ...from, t: lift }, { ...slots[i], t: lift + leg(steps, gather.pace, gather.span) }]
  })
  // The wordmark rides inside the mark: each of its cells shadows one bone
  // cell of the mark, on the same squares at the same moments, unseen.
  const bone = ids(marks).filter((i) => !MARK_CELLS[i].core)
  for (let i = marks; i < slots.length; i++) {
    const host = paths[bone[(i - marks) % bone.length]]
    paths[i] = host.map((p) => at(i, p.x, p.y, p.t))
  }

  // The burst: points thrown to the right of the mark in a widening cone,
  // dealt to the cells in order across, so each settles mostly straight
  // home.
  const core = slots[MARK_CELLS.findIndex((c) => c.core)]
  const thrown = byX(
    slots.map(() => {
      const x = clamp(core.x + rand() * width * 1.15, cell, w - 2 * cell)
      const spread = 0.12 * h + (x - core.x) * 0.3
      // Thrown past the scene's rows, a cell is turned back into them.
      const [top, foot] = [Math.max(cell, scene.burst[0]), Math.min(h, scene.burst[1]) - 2 * cell]
      const y = core.y + (rand() * 2 - 1) * spread
      return { x, y: clamp(y < top ? 2 * top - y : y > foot ? 2 * foot - y : y, top, foot) }
    }),
  )
  across(ids(slots.length)).forEach((i, k) => {
    const out = at(i, thrown[k].x, thrown[k].y, burst.at + burst.span)
    const go = settle.at + ((slots[i].x - left) / width) * settle.sweep
    const held = paths[i][paths[i].length - 1]
    paths[i].push({ ...held, t: burst.at }, out, { ...out, t: go }, { ...slots[i], t: go + settle.span })
  })
  return paths
}

function rain({ scene, slots, cell, at, left, width }: Stage): Waypoint[][] {
  // A column starts falling between 300 and 2700ms, the leftmost first; in
  // it the lowest cell lands first, the next 80ms behind.
  return ids(slots.length).map((i) => {
    const column = slots.filter((s) => s.x === slots[i].x)
    const below = column.filter((s) => s.y > slots[i].y).length
    const start = at(i, slots[i].x, scene.loose[0], 0)
    const go = 300 + ((slots[i].x - left) / width) * 2400 + below * 80
    const fall = leg(Math.abs(slots[i].y - start.y) / cell, 50, [300, 1100])
    return [start, { ...start, t: go }, { ...slots[i], t: go + fall }]
  })
}

function converge({ w, slots, cell, at, left, width }: Stage): Waypoint[][] {
  // Even rows from the left edge, odd rows from the right, each whole; the
  // top row moves at 400ms, each next 300ms after.
  const top = Math.min(...slots.map((s) => s.y))
  return ids(slots.length).map((i) => {
    const row = (slots[i].y - top) / cell
    const shift = row % 2 === 0 ? cell - left : w - 2 * cell - (left + width - cell)
    const start = at(i, slots[i].x + shift, slots[i].y, 0)
    const go = 400 + row * 300
    const slide = leg(Math.abs(start.x - slots[i].x) / cell, 70, [500, 2200])
    return [start, { ...start, t: go }, { ...slots[i], t: go + slide }]
  })
}

function strike({ scene, slots, at, left }: Stage): Waypoint[][] {
  // Each glyph waits at the carriage (the lockup's left edge, on the scene's
  // first row) until its turn, 300ms then every 400ms: 250ms out to its
  // column, then 150ms down onto the line.
  const top = Math.min(...slots.map((s) => s.y))
  return ids(slots.length).map((i) => {
    const glyph = LOCKUP[i].glyph
    const glyphLeft = Math.min(...slots.filter((_, j) => LOCKUP[j].glyph === glyph).map((s) => s.x))
    const start = at(i, slots[i].x - glyphLeft + left, scene.loose[0] + (slots[i].y - top), 0)
    const go = 300 + glyph * 400
    const out = { ...start, x: slots[i].x }
    return [start, { ...start, t: go }, { ...out, t: go + 250 }, { ...slots[i], t: go + 400 }]
  })
}

const PLAY: Record<Move, (stage: Stage) => Waypoint[][]> = { gather, rain, converge, strike }

/** Each lockup cell's path through the scene's move, in px within a field of
 * `box`, for cells that stand at `slots` (the lockup's cells, in order) and
 * a `cell` px grid: every waypoint is a whole number of cells from its slot,
 * so a path stepped one cell at a time never leaves the grid, and every path
 * ends home at `MOMENT.end`. */
export function choreograph(
  scene: Scene,
  box: { width: number; height: number },
  slots: readonly { x: number; y: number }[],
  cell: number,
): Waypoint[][] {
  const at = (i: number, x: number, y: number, t: number): Waypoint => ({
    t,
    x: slots[i].x + Math.round((x - slots[i].x) / cell) * cell,
    y: slots[i].y + Math.round((y - slots[i].y) / cell) * cell,
  })
  const stage: Stage = {
    scene,
    w: box.width,
    h: box.height,
    slots,
    cell,
    rand: xorshift32(scene.seed),
    at,
    left: Math.min(...slots.map((s) => s.x)),
    width: LOCKUP_SIZE.width * cell,
  }
  return PLAY[scene.move](stage).map((path, i) => [...path, { ...slots[i], t: MOMENT.end }])
}
