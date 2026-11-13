/** The mascot: the brand's diamond come alive. Its body is the mark's
 * diamond grown to five steps (|x - 5| + |y - 7| <= 5 on an 11 by 15 grid,
 * the last row its ground),
 * printed through the kit's 4x4 Bayer thresholds so it shades like every
 * kit surface (light from the top left, the lower right in the dither);
 * two eyes are holes in it, its heart is the mark's ember core, its
 * antennae end in ember and it stands on two feet. Flying, its antennae fold
 * into a rotor over its head that spins it about, its feet hanging. One table
 * drives every place it appears: the site header, the Studio's empty states,
 * its tour and the film.
 * `tests/mascot.spec.ts` holds its shape. */

export type MascotPose = "idle" | "blink" | "hop" | "wave" | "fly"
export type MascotInk = "body" | "ember"
export type MascotCell = { x: number; y: number; ink: MascotInk }

export const MASCOT_W = 11
export const MASCOT_H = 15
const CX = 5
const CY = 7
const R = 5

/** The kit's Bayer thresholds (dither-kit/engine/pixel.ts BAYER4), ranks
 * 0..15. */
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]

/** The shaded flank: the cells two steps or more past the diagonal towards
 * the lower right, printed at half tone; the rest of the body is solid, so
 * the eyes read at any size. */
const SHADE = 8
const shaded = (x: number, y: number) => x - CX + (y - CY) >= 2

/** Its eye, a hole in the body, and its optic, the other eye, a lens of
 * ember that never shuts: the diamond come alive, part machine. */
export const EYE = [3, 6] as const
export const OPTIC = [7, 6] as const
const CORE = [5, 8] as const

function body(pose: MascotPose): MascotCell[] {
  const cells: MascotCell[] = []
  const blink = pose === "blink"
  for (let y = 0; y < MASCOT_H; y++)
    for (let x = 0; x < MASCOT_W; x++) {
      if (Math.abs(x - CX) + Math.abs(y - CY) > R) continue
      const eye = x === EYE[0] && y === EYE[1]
      if (eye && !blink) continue
      if ((x === CORE[0] && y === CORE[1]) || (x === OPTIC[0] && y === OPTIC[1])) {
        cells.push({ x, y, ink: "ember" })
        continue
      }
      // the edge stays solid; inside the shaded flank, cells under the
      // threshold's half drop out
      const edge = Math.abs(x - CX) + Math.abs(y - CY) === R
      if (!edge && !eye && shaded(x, y) && BAYER[y % 4][x % 4] >= SHADE) continue
      cells.push({ x, y, ink: "body" })
    }
  return cells
}

/** The antennae: from the crown up and out, ember at the tips; waving, the
 * right one leans out a cell. */
function antennae(pose: MascotPose): MascotCell[] {
  const right =
    pose === "wave"
      ? [
          [7, 1],
          [9, 0],
        ]
      : [
          [6, 1],
          [7, 0],
        ]
  return [
    { x: 4, y: 1, ink: "body" },
    { x: 3, y: 0, ink: "ember" },
    { x: right[0][0], y: right[0][1], ink: "body" },
    { x: right[1][0], y: right[1][1], ink: "ember" },
  ]
}

/** The rotor, the antennae folded into one blade over a stem, seen from the
 * side as it turns: its half span at each step of a turn (full, half, edge
 * on, half), ember at the blade's ends. */
const ROTOR = [4, 2, 0, 2] as const
export const MASCOT_ROTOR_STEPS = ROTOR.length

function rotor(turn: number): MascotCell[] {
  const half = ROTOR[((turn % ROTOR.length) + ROTOR.length) % ROTOR.length]
  const cells: MascotCell[] = [{ x: CX, y: 1, ink: "body" }]
  for (let x = CX - half; x <= CX + half; x++)
    cells.push({ x, y: 0, ink: Math.abs(x - CX) === half ? "ember" : "body" })
  return cells
}

/** The feet under the body's lowest cells; hopping, it is off the ground by
 * a cell, its feet tucked; flying, they hang. */
const feet = (pose: MascotPose): MascotCell[] =>
  pose === "hop"
    ? []
    : [
        { x: 4, y: 13, ink: "body" },
        { x: 6, y: 13, ink: "body" },
      ]

/** The mascot's cells in a pose, each once. Standing, it is a row down,
 * its feet on the ground row; hopping or flying, it is a row up off the
 * ground. `turn` steps the rotor while it flies. */
export function mascotCells(pose: MascotPose = "idle", turn = 0): MascotCell[] {
  const drop = pose === "hop" || pose === "fly" ? 0 : 1
  const top = pose === "fly" ? rotor(turn) : antennae(pose)
  return [...top, ...body(pose), ...feet(pose)].map((c) => ({ ...c, y: c.y + drop }))
}
