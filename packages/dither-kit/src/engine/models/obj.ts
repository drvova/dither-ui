// Wavefront OBJ and its MTL colours (`../models.ts`).

import { addMesh, emptyWorld, finishWorld, type World } from "../world-scene"
import type { Rgb } from "../palette"
import { average, GREY } from "./shared"

/** `newmtl` → diffuse colour (Kd) from MTL text. */
export function parseMtl(text: string): Record<string, Rgb> {
  const out: Record<string, Rgb> = {}
  let current = ""
  for (const raw of text.split("\n")) {
    const parts = raw.trim().split(/\s+/)
    if (parts[0] === "newmtl") current = parts.slice(1).join(" ")
    else if (parts[0] === "Kd" && current && parts.length >= 4)
      out[current] = [+parts[1] * 255, +parts[2] * 255, +parts[3] * 255]
  }
  return out
}

/** Wavefront OBJ: v/f (slashes, negative indices, polygons), l polylines,
 * p points, usemtl groups coloured from `materials` (an MTL's Kd table),
 * vertex colours (`v x y z r g b`) averaged per face. */
export function parseObj(text: string, materials: Record<string, Rgb> = {}): World {
  const points: number[] = []
  const uvs: number[] = []
  const vcol: number[] = []
  let hasVcol = false
  type Group = { material: string; faces: number[][]; faceUvs: number[][]; lines: number[][]; pts: number[] }
  const groups: Group[] = []
  let g: Group = { material: "", faces: [], faceUvs: [], lines: [], pts: [] }
  groups.push(g)
  const idx = (tok: string, count: number) => {
    const i = parseInt(tok, 10)
    return Number.isNaN(i) ? -1 : i < 0 ? count + i : i - 1
  }
  /** The `vt` of a `v/vt/vn` corner, -1 without one. */
  const uvIdx = (tok: string) => {
    const part = tok.split("/")[1]
    return part ? idx(part, uvs.length / 2) : -1
  }
  for (const raw of text.split("\n")) {
    const line = raw.trim()
    if (!line || line[0] === "#") continue
    const parts = line.split(/\s+/)
    const count = points.length / 3
    switch (parts[0]) {
      case "v":
        if (parts.length >= 4) {
          points.push(+parts[1], +parts[2], +parts[3])
          if (parts.length >= 7) {
            vcol.push(+parts[4], +parts[5], +parts[6])
            hasVcol = true
          } else vcol.push(0.8, 0.8, 0.8)
        }
        break
      case "vt":
        // OBJ's t runs upward; the kit's runs down from the top-left.
        if (parts.length >= 3) uvs.push(+parts[1], 1 - +parts[2])
        break
      case "f": {
        const face: number[] = []
        const corners: number[] = []
        for (let k = 1; k < parts.length; k++) {
          face.push(idx(parts[k], count))
          corners.push(uvIdx(parts[k]))
        }
        if (face.length >= 3) {
          g.faces.push(face)
          g.faceUvs.push(corners)
        }
        break
      }
      case "l": {
        const poly: number[] = []
        for (let k = 1; k < parts.length; k++) poly.push(idx(parts[k], count))
        if (poly.length >= 2) g.lines.push(poly)
        break
      }
      case "p":
        for (let k = 1; k < parts.length; k++) g.pts.push(idx(parts[k], count))
        break
      case "usemtl":
        g = { material: parts.slice(1).join(" "), faces: [], faceUvs: [], lines: [], pts: [] }
        groups.push(g)
        break
    }
  }
  const world = emptyWorld()
  for (const grp of groups) {
    const color = materials[grp.material] ?? GREY
    if (grp.faces.length) {
      const colors = hasVcol ? grp.faces.flatMap((f) => average(vcol, f)) : undefined
      addMesh(
        world,
        {
          points,
          faces: grp.faces,
          colors,
          uvs: uvs.length ? uvs : undefined,
          faceUvs: uvs.length ? grp.faceUvs : undefined,
        },
        null,
        color,
        true,
      )
    }
    if (grp.lines.length) addMesh(world, { points, faces: grp.lines }, null, color, false, { kind: "lines" })
    if (grp.pts.length) addMesh(world, { points, faces: [grp.pts] }, null, color, false, { kind: "points" })
  }
  return finishWorld(world)
}
