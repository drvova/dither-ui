// The landing's build: the brand itself as a model. Every cell of the
// lockup (`LOCKUP`: the mark, then the wordmark in the pixel face) is a
// block with chamfered front edges and a hairline seam round it, so the
// kit's assembly pass reads each one as a piece and raises the brand cell
// by cell. Written as VRML97 with its own light (a key from the upper left,
// a weak fill, no camera light): fronts, tops, sides and chamfers each take
// their own tone, and the light stays put while the lockup turns.
import { LOCKUP, LOCKUP_SIZE } from "./brand"

/** Each block keeps this share of its cell; the rest is the seam. */
const FILL = 0.86
/** A block's depth, in cells: deep, like extruded signage, so the volume
 * reads at the few cells a block gets on screen. */
const DEPTH = 2.6
/** The chamfer round a block's front face, in cells. */
const BEVEL = 0.13
/** The mark stands proud of the word by this much, in cells. */
const LIFT = 0.7
/** The light, as VRML gives it: the direction it travels, and how strong. */
export const LIGHTS = [
  { direction: [0.38, -0.78, -0.5], intensity: 1 },
  { direction: [-0.8, -0.1, -0.6], intensity: 0.24 },
] as const

/** Every piece the build holds: one per cell of the lockup. */
export const BUILD_PIECES = LOCKUP.length

/** The lockup as lit, chamfered blocks, VRML97 text: x across, y up, the
 * face toward +z. */
export function lockupModel(): string {
  const points: string[] = []
  const faces: string[] = []
  const inset = (1 - FILL) / 2
  const cx = LOCKUP_SIZE.width / 2
  const cy = LOCKUP_SIZE.height / 2
  for (const c of LOCKUP) {
    const x0 = c.x + inset - cx
    const x1 = c.x + 1 - inset - cx
    // Rows count down from the top; y runs up.
    const y0 = cy - (c.y + 1 - inset)
    const y1 = cy - (c.y + inset)
    const front = c.glyph === 0 ? DEPTH / 2 + LIFT : DEPTH / 2
    const back = -DEPTH / 2
    const o = points.length
    // The front face (inset by the chamfer), the ring where the chamfer
    // meets the sides, the back: four corners each, counter-clockwise.
    const ring = (d: number, z: number) => [
      [x0 + d, y0 + d, z],
      [x1 - d, y0 + d, z],
      [x1 - d, y1 - d, z],
      [x0 + d, y1 - d, z],
    ]
    for (const [x, y, z] of [...ring(BEVEL, front), ...ring(0, front - BEVEL), ...ring(0, back)])
      points.push(`${x.toFixed(3)} ${y.toFixed(3)} ${z.toFixed(3)}`)
    const [f0, f1, f2, f3, m0, m1, m2, m3, b0, b1, b2, b3] = Array.from({ length: 12 }, (_, i) => i + o)
    // Outward winding: the face, its four chamfers, the four sides, the back.
    for (const q of [
      [f0, f1, f2, f3],
      [m0, m1, f1, f0],
      [m1, m2, f2, f1],
      [m2, m3, f3, f2],
      [m3, m0, f0, f3],
      [b0, b1, m1, m0],
      [m1, b1, b2, m2],
      [m3, m2, b2, b3],
      [b0, m0, m3, b3],
      [b1, b0, b3, b2],
    ])
      faces.push(`${q.join(" ")} -1`)
  }
  const light = (l: (typeof LIGHTS)[number]) =>
    `DirectionalLight { direction ${l.direction.join(" ")} intensity ${l.intensity} }`
  return [
    "#VRML V2.0 utf8",
    "# dither-ui: the lockup, cell by cell",
    "NavigationInfo { headlight FALSE }",
    ...LIGHTS.map(light),
    "Shape { geometry IndexedFaceSet { solid TRUE",
    `  coord Coordinate { point [ ${points.join(", ")} ] }`,
    `  coordIndex [ ${faces.join(" ")} ] } }`,
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
