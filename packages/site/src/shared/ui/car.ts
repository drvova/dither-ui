/** The mascot's car: a wedge speedster of our own (long, low, all angles,
 * open over the cockpit so its driver shows), facing right, drawn on the
 * mascot's cell grid so the two print as one picture. Its body is printed
 * like the mascot's: solid where the light falls, through the Bayer
 * thresholds along its lower flank; an ember stripe runs its length, the
 * brand's diamond sits on its door, an ember tail light and a bone headlight
 * at its ends. Its wheels turn a quarter step a frame while it drives.
 * `tests/car.spec.ts` holds its shape. */

import { MASCOT_W, type MascotCell, type MascotPose, mascotCells } from "./mascot"

export type CarInk = "body" | "ember" | "glass" | "tyre" | "light"
type CarCell = { x: number; y: number; ink: CarInk }

export const CAR_W = 73
export const CAR_H = 21
export const WHEEL_STEPS = 4

/** The body's outline, rear to nose along the top, back under the chin. */
const OUTLINE: [number, number][] = [
  [3, 16.5],
  [3, 8.5],
  [12, 7.6],
  [26, 8.4],
  [26, 9.6],
  [44, 9.6],
  [45, 9.4],
  [70, 13.4],
  [71.8, 14.8],
  [68, 16.5],
]
const WHEELS: [number, number][] = [
  [17, 16.4],
  [57, 16.4],
]
const TYRE = 4.2
const RIM = 2.4
const ARCH = 5.1
/** The door line: the driver shows over it, the stripe runs under it. */
const DOOR = 9.6
const STRIPE = 11
const FLANK = 14

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]

function inside(x: number, y: number): boolean {
  let hit = false
  for (let i = 0, j = OUTLINE.length - 1; i < OUTLINE.length; j = i++) {
    const [xi, yi] = OUTLINE[i]
    const [xj, yj] = OUTLINE[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}

/** The brand's diamond on the door: its four cells round an ember core. */
const BADGE: [number, number, CarInk][] = [
  [35, 12, "light"],
  [34, 13, "light"],
  [35, 13, "ember"],
  [36, 13, "light"],
  [35, 14, "light"],
]

/** The car's cells at a wheel `turn`, each once. */
export function carCells(turn = 0): CarCell[] {
  const cells = new Map<string, CarCell>()
  const put = (x: number, y: number, ink: CarInk) => cells.set(`${x},${y}`, { x, y, ink })
  const step = ((turn % WHEEL_STEPS) + WHEEL_STEPS) % WHEEL_STEPS
  for (let y = 0; y < CAR_H; y++)
    for (let x = 0; x < CAR_W; x++) {
      const cx = x + 0.5
      const cy = y + 0.5
      if (!inside(cx, cy)) continue
      if (WHEELS.some(([wx, wy]) => Math.hypot(cx - wx, cy - wy) < ARCH)) continue
      // the lower flank prints through the thresholds; the rest is solid
      if (y >= FLANK && BAYER[y % 4][x % 4] >= 8) continue
      put(x, y, y === STRIPE && x >= 7 && x <= 68 ? "ember" : "body")
    }
  // the windscreen, raked back from the hood, and its frame's top
  for (let i = 0; i <= 5; i++) put(44 - i, 8 - i, "glass")
  put(38, 2, "body")
  // the wing over the tail on two pylons
  for (let x = 1; x <= 12; x++) put(x, 5, "body")
  for (const x of [4, 10]) for (let y = 6; y <= 7; y++) put(x, y, "body")
  // the lights and the badge
  put(3, 10, "ember")
  put(3, 11, "ember")
  put(69, 13, "light")
  put(70, 13, "light")
  for (const [x, y, ink] of BADGE) put(x, y, ink)
  // the wheels: a tyre ring round a rim, the rim's two spokes turning
  for (const [wx, wy] of WHEELS)
    for (let y = Math.floor(wy - TYRE); y <= Math.ceil(wy + TYRE); y++)
      for (let x = Math.floor(wx - TYRE); x <= Math.ceil(wx + TYRE); x++) {
        const dx = x + 0.5 - wx
        const dy = y + 0.5 - wy
        const r = Math.hypot(dx, dy)
        if (r > TYRE || y >= CAR_H) continue
        if (r > RIM) {
          put(x, y, "tyre")
          continue
        }
        // a spoke at each quarter step: the cells along it are lit
        const a = (Math.atan2(dy, dx) / Math.PI) * 2 // in quarter turns
        const along = (((a - step / 2) % 1) + 1) % 1
        put(x, y, along < 0.25 || along > 0.75 || r < 0.5 ? "light" : "tyre")
      }
  return [...cells.values()]
}

/** Where the driver sits: the mascot's grid placed in the cockpit, its eyes
 * over the door line, the rest behind the door. */
export const SEAT = { x: 28, y: -1 } as const

/** The car with its driver: the mascot's cells (posed, shifted into the
 * seat, those behind the body hidden) under the car's, on one grid from
 * `SEAT.y` up. Every cell once. */
export function drivenCells(turn = 0, pose: MascotPose = "idle"): (CarCell | (MascotCell & { driver: true }))[] {
  const car = carCells(turn)
  const covered = new Set(car.map((c) => `${c.x},${c.y}`))
  const driver = mascotCells(pose)
    .map((c) => ({ ...c, x: c.x + SEAT.x, y: c.y + SEAT.y, driver: true as const }))
    // behind the door and the body: only what stands over the door line shows
    .filter((c) => c.y < DOOR && !covered.has(`${c.x},${c.y}`))
  return [...driver, ...car]
}

/** A row's run of cells of one paint, drawn as one rect. */
type Run = { x: number; y: number; w: number; paint: string }

/** Cells merged into runs: along each row, neighbours of the same `paintOf`
 * become one run, so the picture draws in a fraction of the rects and
 * prints the same pixels. */
export function toRuns<T extends { x: number; y: number }>(cells: readonly T[], paintOf: (c: T) => string): Run[] {
  const sorted = [...cells].sort((a, b) => a.y - b.y || a.x - b.x)
  const runs: Run[] = []
  for (const c of sorted) {
    const paint = paintOf(c)
    const last = runs[runs.length - 1]
    if (last && last.y === c.y && last.x + last.w === c.x && last.paint === paint) last.w++
    else runs.push({ x: c.x, y: c.y, w: 1, paint })
  }
  return runs
}

/** The picture's box in cells: the car's width, from the driver's top to the wheels. */
export const DRIVEN_W = Math.max(CAR_W, SEAT.x + MASCOT_W)
export const DRIVEN_TOP = SEAT.y
export const DRIVEN_H = CAR_H - SEAT.y
