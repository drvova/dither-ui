// Object File Format (`../models.ts`).

import { addMesh, emptyWorld, finishWorld, type World } from "../world-scene"
import { GREY } from "./shared"

/** Object File Format: counts, vertices, faces with optional colour. */
export function parseOff(text: string): World {
  const toks = text
    .split("\n")
    .map((l) => l.replace(/#.*/, "").trim())
    .filter(Boolean)
    .join(" ")
    .split(/\s+/)
  let i = 0
  if (/OFF$/.test(toks[0] ?? "")) i++
  const nv = +toks[i++] || 0
  const nf = +toks[i++] || 0
  i++
  const points: number[] = []
  for (let v = 0; v < nv && i + 2 < toks.length; v++) {
    points.push(+toks[i], +toks[i + 1], +toks[i + 2])
    i += 3
  }
  const faces: number[][] = []
  const colors: number[] = []
  let hasColor = false
  for (let f = 0; f < nf && i < toks.length; f++) {
    const n = Math.min(+toks[i++] || 0, toks.length - i)
    const face: number[] = []
    for (let k = 0; k < n; k++) face.push(+toks[i++])
    // Trailing colour: 3-4 ints (0-255) or floats (0-1) before the next count.
    const rest: number[] = []
    while (
      rest.length < 4 &&
      i < toks.length &&
      f + 1 < nf &&
      !Number.isNaN(+toks[i]) &&
      !(rest.length >= 3 && Number.isInteger(+toks[i]) && +toks[i] === +toks[i] && isCountAhead(toks, i))
    )
      rest.push(+toks[i++])
    if (f + 1 === nf) while (rest.length < 4 && i < toks.length && !Number.isNaN(+toks[i])) rest.push(+toks[i++])
    if (face.length >= 3) {
      faces.push(face)
      if (rest.length >= 3) {
        hasColor = true
        const scale = rest.some((v) => v > 1) ? 1 / 255 : 1
        colors.push(rest[0] * scale, rest[1] * scale, rest[2] * scale)
      } else colors.push(0.8, 0.8, 0.8)
    }
  }
  const world = emptyWorld()
  addMesh(world, { points, faces, colors: hasColor ? colors : undefined }, null, GREY, false)
  return finishWorld(world)
}

/** OFF ambiguity: after a face, is `toks[i]` the next face's vertex count
 * (an integer followed by that many integer indices)? */
function isCountAhead(toks: string[], i: number): boolean {
  const n = +toks[i]
  if (!Number.isInteger(n) || n < 3 || i + n >= toks.length) return false
  for (let k = 1; k <= n; k++) if (!Number.isInteger(+toks[i + k]) || +toks[i + k] < 0) return false
  return true
}
