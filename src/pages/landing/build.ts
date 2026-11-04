// The landing's build: the brand itself as a model. Every cell of the
// lockup (`LOCKUP`: the mark, then the wordmark in the pixel face) is a
// block with a hairline seam round it, so the kit's assembly pass reads
// each one as a piece and raises the brand cell by cell. Written as OBJ,
// the world engine parses it like any model file.
import { LOCKUP, LOCKUP_SIZE } from "./brand"

/** Each block keeps this share of its cell; the rest is the seam. */
const FILL = 0.86
/** A block's depth, in cells. */
const DEPTH = 1.1
/** The mark stands proud of the word by this much, in cells. */
const LIFT = 0.45

/** Every piece the build holds: one per cell of the lockup. */
export const BUILD_PIECES = LOCKUP.length

/** The lockup as blocks, OBJ text: x across, y up, the face toward +z. */
export function lockupObj(): string {
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
    for (const [x, y, z] of [
      [x0, y0, front],
      [x1, y0, front],
      [x1, y1, front],
      [x0, y1, front],
      [x0, y0, back],
      [x1, y0, back],
      [x1, y1, back],
      [x0, y1, back],
    ])
      points.push(`v ${x.toFixed(3)} ${y.toFixed(3)} ${z.toFixed(3)}`)
    const q = (...i: number[]) => faces.push(`f ${i.map((k) => k + o + 1).join(" ")}`)
    // Outward winding: front, back, then the four sides.
    q(0, 1, 2, 3)
    q(5, 4, 7, 6)
    q(4, 0, 3, 7)
    q(1, 5, 6, 2)
    q(3, 2, 6, 7)
    q(4, 5, 1, 0)
  }
  return ["# dither-ui: the lockup, cell by cell", ...points, ...faces].join("\n")
}

/** The stage's turn and the build at a point of the scroll through it
 * (p 0..1): the build rises over the first stretch, the whole holds and
 * turns in the middle, and it comes apart as the page leaves it. */
export function stageAt(p: number): { build: number; scatter: number; yaw: number } {
  const t = Math.min(1, Math.max(0, p))
  const fit = (a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)))
  return { build: fit(0.04, 0.46), scatter: fit(0.72, 1) * 0.9, yaw: -32 + 64 * t }
}
