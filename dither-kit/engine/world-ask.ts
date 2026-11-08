// The world's worker side (`world-offload.ts` is the page's): what the page
// asks a worker to paint and how it answers. A worker keeps the model it was
// last handed and its assembly, and paints each moment with the CPU engine
// and the shared paint, the same bytes the page would. Its own module so the
// worker never imports the module that spawns it.
import { type Assembly, type AssemblyState, createAssembly } from "./assemble"
import type { Rgb } from "./palette"
import {
  cameraOf,
  createWorldTarget,
  paintTarget,
  rasterizeWorld,
  type World,
  type WorldStyle,
  type WorldTarget,
  type WorldView,
} from "./world"

/** One moment of a world, asked of the worker. `world` comes only when the
 * model changed (`id`), never with every frame. */
export type WorldAsk = {
  id: number
  world?: World
  cols: number
  rows: number
  view: WorldView
  /** The build's state, null for the model whole and still. */
  state: AssemblyState | null
  heat: Rgb
  seed: number
  dt: number
  style: WorldStyle
  pixels: ArrayBuffer
}

/** The moment, painted into the pixels it was handed. */
export type WorldDone = { cols: number; rows: number; pixels: ArrayBuffer }

/** A worker's memory of the world it paints. */
export type WorldDesk = {
  id: number
  world: World | null
  assembly: { heat: string; seed: number; a: Assembly } | null
  target: WorldTarget | null
}

export const worldDesk = (): WorldDesk => ({ id: -1, world: null, assembly: null, target: null })

/** Paint the moment `ask` names, keeping its model on `desk`. */
export function answerWorld(desk: WorldDesk, ask: WorldAsk): WorldDone {
  if (ask.world) {
    desk.id = ask.id
    desk.world = ask.world
    desk.assembly = null
  }
  const buffer = { width: ask.cols, height: ask.rows, data: new Uint8ClampedArray(ask.pixels) }
  let w = desk.world
  if (!w || desk.id !== ask.id) {
    buffer.data.fill(0)
    return { cols: ask.cols, rows: ask.rows, pixels: ask.pixels }
  }
  if (ask.state) {
    const heat = ask.heat.join(",")
    if (!desk.assembly || desk.assembly.heat !== heat || desk.assembly.seed !== ask.seed)
      desk.assembly = { heat, seed: ask.seed, a: createAssembly(w, ask.heat, ask.seed) }
    w = desk.assembly.a.frame(ask.view, cameraOf(w, ask.view, ask.cols, ask.rows), ask.state, ask.dt)
  }
  if (!desk.target || desk.target.width !== ask.cols || desk.target.height !== ask.rows)
    desk.target = createWorldTarget(ask.cols, ask.rows)
  rasterizeWorld(w, ask.view, desk.target, ask.style)
  paintTarget(buffer, desk.target, w, ask.view, ask.style)
  return { cols: ask.cols, rows: ask.rows, pixels: ask.pixels }
}
