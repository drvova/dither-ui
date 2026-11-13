// The landing's build: the brand itself as a model. Every cell of the
// lockup (`LOCKUP`: the mark, then the wordmark in the pixel face) is a
// deep block with chamfered front edges and a hairline seam round it,
// standing on a floor of thin tiles; the kit's assembly pass reads each
// block and each tile as a piece, and since it builds from the bottom up
// the floor lays itself first, then the brand rises on it cell by cell.
// Written as VRML97 with its own light (a key from the upper left, low
// enough that the floor sits in the middle tones and the lockup's faces
// stay brightest, a weak fill, no camera light), so fronts, tops, sides and
// chamfers each take their own tone and the light stays put as it turns.
import { fillOf, type PixelColor } from "dither-kit/engine/pixel.ts"
import { LOCKUP, LOCKUP_SIZE } from "./brand"

/** The kit's ember: the colour the cells fly in with, and the mark's core
 * gives off for good (as the header's mark has it). */
export const BUILD_HEAT: PixelColor = "orange"

/** Each block keeps this share of its cell; the rest is the seam. */
const FILL = 0.86
/** A block's depth, in cells: deep, like extruded signage, so the volume
 * reads at the few cells a block gets on screen. */
const DEPTH = 2.6
/** The chamfer round a block's front face, in cells. */
const BEVEL = 0.13
/** The mark stands proud of the word by this much, in cells. */
const LIFT = 0.7
/** The floor: tiles this many cells square, this thick, reaching this far
 * past the lockup each side and from behind it to in front of it. */
const TILE = 2
const TILE_THICK = 0.3
const FLOOR_MARGIN = 2
const FLOOR_BACK = -4
const FLOOR_FRONT = 6
/** The light, as VRML gives it: the direction it travels, and how strong. */
export const LIGHTS = [
  { direction: [0.35, -0.45, -0.82], intensity: 1 },
  { direction: [-0.8, -0.1, -0.6], intensity: 0.24 },
] as const

/** The cells of the lockup: one block each. */
export const BUILD_CELLS = LOCKUP.length
const FLOOR_X = Math.ceil((LOCKUP_SIZE.width + FLOOR_MARGIN * 2) / TILE)
const FLOOR_Z = Math.ceil((FLOOR_FRONT - FLOOR_BACK) / TILE)
/** The floor's tiles. */
export const FLOOR_TILES = FLOOR_X * FLOOR_Z
/** Every piece the build holds: the blocks and the tiles. */
export const BUILD_PIECES = BUILD_CELLS + FLOOR_TILES

type Box = { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number }

/** A box as quads with outward winding, its +z face chamfered by `bevel`
 * (the face inset, four slanted quads to the sides) when there is one. */
function box(points: string[], faces: string[], b: Box, bevel: number): void {
  const o = points.length
  const ring = (d: number, z: number) => [
    [b.x0 + d, b.y0 + d, z],
    [b.x1 - d, b.y0 + d, z],
    [b.x1 - d, b.y1 - d, z],
    [b.x0 + d, b.y1 - d, z],
  ]
  const rings = bevel > 0 ? [ring(bevel, b.z1), ring(0, b.z1 - bevel), ring(0, b.z0)] : [ring(0, b.z1), ring(0, b.z0)]
  for (const [x, y, z] of rings.flat()) points.push(`${x.toFixed(3)} ${y.toFixed(3)} ${z.toFixed(3)}`)
  const at = (i: number) => i + o
  // m: where the sides start (the chamfer's foot, or the face itself); k: the back.
  const m = bevel > 0 ? 4 : 0
  const k = bevel > 0 ? 8 : 4
  const quads = [
    [0, 1, 2, 3],
    [k, k + 1, m + 1, m],
    [m + 1, k + 1, k + 2, m + 2],
    [m + 3, m + 2, k + 2, k + 3],
    [k, m, m + 3, k + 3],
    [k + 1, k, k + 3, k + 2],
  ]
  if (bevel > 0) quads.push([m, m + 1, 1, 0], [m + 1, m + 2, 2, 1], [m + 2, m + 3, 3, 2], [m + 3, m, 0, 3])
  for (const q of quads) faces.push(`${q.map(at).join(" ")} -1`)
}

/** The lockup on its floor as lit blocks, VRML97 text: x across, y up,
 * the face toward +z. */
export function lockupModel(): string {
  const floor = { points: [] as string[], faces: [] as string[] }
  const lockup = { points: [] as string[], faces: [] as string[] }
  const core = { points: [] as string[], faces: [] as string[] }
  const inset = (1 - FILL) / 2
  const cx = LOCKUP_SIZE.width / 2
  const cy = LOCKUP_SIZE.height / 2
  // The floor first, just under the lockup's foot.
  const top = -cy + inset - 0.12
  const left = -cx - FLOOR_MARGIN
  const gap = (TILE * (1 - FILL)) / 2
  for (let i = 0; i < FLOOR_X; i++)
    for (let j = 0; j < FLOOR_Z; j++)
      box(
        floor.points,
        floor.faces,
        {
          x0: left + i * TILE + gap,
          x1: left + (i + 1) * TILE - gap,
          y0: top - TILE_THICK,
          y1: top,
          z0: FLOOR_BACK + j * TILE + gap,
          z1: FLOOR_BACK + (j + 1) * TILE - gap,
        },
        0,
      )
  for (const c of LOCKUP) {
    // Rows count down from the top; y runs up.
    const into = c.core ? core : lockup
    box(
      into.points,
      into.faces,
      {
        x0: c.x + inset - cx,
        x1: c.x + 1 - inset - cx,
        y0: cy - (c.y + 1 - inset),
        y1: cy - (c.y + inset),
        z0: -DEPTH / 2,
        z1: c.glyph === 0 ? DEPTH / 2 + LIFT : DEPTH / 2,
      },
      BEVEL,
    )
  }
  const light = (l: (typeof LIGHTS)[number]) =>
    `DirectionalLight { direction ${l.direction.join(" ")} intensity ${l.intensity} }`
  // The floor, the lockup, then the mark's core, which gives off the ember
  // (an emissive material): the build lays them in that order, so the core
  // lights last.
  const ember = fillOf(BUILD_HEAT)
    .map((v) => (v / 255).toFixed(3))
    .join(" ")
  const shape = (m: { points: string[]; faces: string[] }, glow = false) =>
    [
      `Shape {${glow ? ` appearance Appearance { material Material { emissiveColor ${ember} } }` : ""} geometry IndexedFaceSet { solid TRUE`,
      `  coord Coordinate { point [ ${m.points.join(", ")} ] }`,
      `  coordIndex [ ${m.faces.join(" ")} ] } }`,
    ].join("\n")
  return [
    "#VRML V2.0 utf8",
    "# dither-ui: the lockup on its floor, cell by cell",
    "NavigationInfo { headlight FALSE }",
    ...LIGHTS.map(light),
    shape(floor),
    shape(lockup),
    shape(core, true),
  ].join("\n")
}

/** The stage's turn and the build at a point of the scroll through it
 * (p 0..1): the build rises over the first stretch, the whole holds and
 * turns in the middle, and it comes apart as the page leaves it. */
export function stageAt(p: number): { build: number; scatter: number; yaw: number } {
  const t = Math.min(1, Math.max(0, p))
  const fit = (a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)))
  return { build: fit(0.04, 0.46), scatter: fit(0.72, 1) * 0.9, yaw: -32 + 64 * t }
}
