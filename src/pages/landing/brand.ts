// The brand as cells: the mark, and the lockup it leads with the pixel
// wordmark, and its one moment, `choreograph`, pure: cells in, a path per
// cell out. `BrandGather.vue` plays it wherever the brand stands in a field
// (the plates, the hero).
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
 * footer's pixel wordmark, all seven cells tall. The mark's cells come
 * first, in `MARK_CELLS` order. */
export const LOCKUP = [...MARK_CELLS, ...WORD.cells.map((c) => ({ x: 7 + GAP + c.x, y: c.y, core: false }))]
export const LOCKUP_SIZE = { width: 7 + GAP + WORD.width, height: PIXEL_ROWS } as const

/** The moment's clock, in ms from the brand coming into view. Gather: each
 * mark cell lifts out of the field between `lift` and `lift + sweep`, the
 * leftmost first, and travels at `pace` cells a second, held to `span`.
 * Burst: at `at` the mark flies apart to the right over `span`, the
 * wordmark's cells, carried inside it until then, with it. Settle: each
 * cell travels home over `span`, starting in order across the lockup over
 * `sweep`. Under five seconds, held by `tests/landing-facts.spec.ts`. */
export const MOMENT = {
  gather: { lift: 500, sweep: 900, pace: 60, span: [700, 1300] },
  burst: { at: 3000, span: 300 },
  settle: { at: 3400, sweep: 500, span: 700 },
  end: 4600,
} as const

export type Waypoint = { t: number; x: number; y: number }

/** Where in its field the brand's moment plays, in px from the field's top:
 * the rows the mark's cells lie loose in, the rows the burst may throw a
 * cell to, and the seed that places them, the same on every visit. */
export type Scene = { seed: number; loose: readonly [number, number]; burst: readonly [number, number] }

/** Each lockup cell's path through the moment, in px within a field of
 * `box`, for cells that stand at `slots` (the lockup's cells, in order) and
 * a `cell` px grid: every waypoint is a whole number of cells from its slot,
 * so a path stepped one cell at a time never leaves the grid. */
export function choreograph(
  scene: Scene,
  box: { width: number; height: number },
  slots: readonly { x: number; y: number }[],
  cell: number,
): Waypoint[][] {
  const { gather, burst, settle, end } = MOMENT
  const { width: w, height: h } = box
  const rand = xorshift32(scene.seed)
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
  const at = (i: number, x: number, y: number, t: number): Waypoint => ({
    t,
    x: slots[i].x + Math.round((x - slots[i].x) / cell) * cell,
    y: slots[i].y + Math.round((y - slots[i].y) / cell) * cell,
  })
  const across = (ids: number[]) => ids.sort((a, b) => slots[a].x - slots[b].x || slots[a].y - slots[b].y)
  const byX = <T extends { x: number }>(ps: T[]) => ps.sort((a, b) => a.x - b.x)

  // The mark's cells lie loose in the scene's rows, and are matched to
  // their slots in the same order across, so paths seldom cross.
  const marks = MARK_CELLS.length
  const [lo, hi] = scene.loose
  const loose = byX(MARK_CELLS.map(() => ({ x: (0.02 + rand() * 0.96) * w, y: lo + rand() * (hi - lo) })))
  const paths: Waypoint[][] = Array.from({ length: slots.length }, () => [])
  across([...Array(marks).keys()]).forEach((i, k) => {
    const from = at(i, loose[k].x, loose[k].y, 0)
    const steps = Math.max(Math.abs(from.x - slots[i].x), Math.abs(from.y - slots[i].y)) / cell
    const lift = gather.lift + (from.x / w) * gather.sweep
    const home = lift + clamp((steps / gather.pace) * 1000, gather.span[0], gather.span[1])
    paths[i] = [from, { ...from, t: lift }, { ...slots[i], t: home }]
  })
  // The wordmark rides inside the mark: each of its cells shadows one bone
  // cell of the mark, on the same squares at the same moments, unseen.
  const bone = [...Array(marks).keys()].filter((i) => !MARK_CELLS[i].core)
  for (let i = marks; i < slots.length; i++) {
    const host = paths[bone[(i - marks) % bone.length]]
    paths[i] = host.map((p) => at(i, p.x, p.y, p.t))
  }

  // The burst: points thrown to the right of the mark in a widening cone,
  // dealt to the cells in order across, so each settles mostly straight
  // home.
  const core = slots[MARK_CELLS.findIndex((c) => c.core)]
  const reach = LOCKUP_SIZE.width * cell * 1.15
  const thrown = byX(
    slots.map(() => {
      const x = clamp(core.x + rand() * reach, cell, w - 2 * cell)
      const spread = 0.12 * h + (x - core.x) * 0.3
      // Thrown past the scene's rows, a cell is turned back into them.
      const [top, foot] = [Math.max(cell, scene.burst[0]), Math.min(h, scene.burst[1]) - 2 * cell]
      const y = core.y + (rand() * 2 - 1) * spread
      return { x, y: clamp(y < top ? 2 * top - y : y > foot ? 2 * foot - y : y, top, foot) }
    }),
  )
  const left = Math.min(...slots.map((s) => s.x))
  across([...slots.keys()]).forEach((i, k) => {
    const out = at(i, thrown[k].x, thrown[k].y, burst.at + burst.span)
    const go = settle.at + ((slots[i].x - left) / (LOCKUP_SIZE.width * cell)) * settle.sweep
    const held = paths[i][paths[i].length - 1]
    paths[i].push({ ...held, t: burst.at }, out, { ...out, t: go }, { ...slots[i], t: go + settle.span })
    paths[i].push({ ...slots[i], t: end })
  })
  return paths
}
