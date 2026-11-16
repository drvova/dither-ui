// What every model parser (`../models.ts`) shares: bytes and text, the grey a
// file without colour prints in, a ring's mean colour, the scene graph's
// bound and a capture's world.

import { emptyWorld, finishWorld, type World } from "../world-scene"
import type { Rgb } from "../palette"
import { splatCube, type SplatCloud } from "../splats"

export const decode = (bytes: Uint8Array) => new TextDecoder().decode(bytes)

export const toBytes = (input: string | ArrayBuffer | Uint8Array): Uint8Array =>
  typeof input === "string"
    ? new TextEncoder().encode(input)
    : input instanceof Uint8Array
      ? input
      : new Uint8Array(input)

export const GREY: Rgb = [204, 204, 204]

/** Mean rgb (0-1 triples) of a ring's vertices. */
export function average(colors: number[], ring: number[]): number[] {
  let r = 0
  let g = 0
  let b = 0
  let n = 0
  for (const i of ring) {
    if (i < 0 || i * 3 + 2 >= colors.length) continue
    r += colors[i * 3]
    g += colors[i * 3 + 1]
    b += colors[i * 3 + 2]
    n++
  }
  return n ? [r / n, g / n, b / n] : [0.8, 0.8, 0.8]
}

/** The most scene-graph nodes one parse visits, shared instances counted
 * each time they are reached. */
export const MAX_NODES = 50_000

/** A capture's world: its Gaussians, the colour cube their cells snap to, no light. */
export function splatWorld(cloud: SplatCloud): World {
  const world = emptyWorld()
  cloud.base = world.palette.length
  world.palette.push(...splatCube())
  world.splats = cloud
  world.headlight = false
  return finishWorld(world)
}
