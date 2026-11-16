// STL, ASCII and binary (`../models.ts`).

import { addMesh, emptyWorld, finishWorld, type World } from "../world-scene"
import { decode, GREY, toBytes } from "./shared"

/** Binary when its triangle count fits its length, or when it does not read as ASCII. */
export function isBinaryStl(bytes: Uint8Array): boolean {
  if (bytes.length < 84) return false
  const count = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(80, true)
  if (84 + count * 50 === bytes.length) return true
  const head = decode(bytes.subarray(0, Math.min(512, bytes.length))).trimStart()
  return !(head.startsWith("solid") && head.includes("facet"))
}

export function parseStl(input: string | ArrayBuffer | Uint8Array): World {
  const bytes = toBytes(input)
  const points: number[] = []
  if (isBinaryStl(bytes)) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    const count = Math.min(view.getUint32(80, true), Math.floor((bytes.length - 84) / 50))
    for (let i = 0; i < count; i++) {
      const o = 84 + i * 50 + 12
      for (let k = 0; k < 9; k++) points.push(view.getFloat32(o + k * 4, true))
    }
  } else {
    const re = /vertex\s+([-+.\deE]+)\s+([-+.\deE]+)\s+([-+.\deE]+)/g
    const text = decode(bytes)
    for (let m = re.exec(text); m; m = re.exec(text)) points.push(+m[1], +m[2], +m[3])
  }
  const tris = Math.floor(points.length / 9)
  const faces: number[][] = []
  for (let t = 0; t < tris; t++) faces.push([t * 3, t * 3 + 1, t * 3 + 2])
  const world = emptyWorld()
  // Winding in the wild is unreliable, so an STL renders two-sided.
  addMesh(world, { points: points.slice(0, tris * 9), faces }, null, GREY, false)
  return finishWorld(world)
}
