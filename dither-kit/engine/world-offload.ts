// A world painted off the main thread. A model on the CPU engine (a build
// rising as the page scrolls, a model turning) took its whole raster and
// paint on the main thread every frame. A worker paints it instead: each
// paint the page takes the worker's latest finished frame (a copy) and asks
// for the moment due at the next paint, so what shows lands on time. The
// first paint, and every paint where there is no worker or it failed, paints
// here at once. The caller keeps to the CPU engine's plain case (no GPU, no
// GLSL material, no channels, not directed); `DitherWorld` does.
import type { AssemblyState } from "./assemble"
import type { Rgb } from "./palette"
import type { RasterBuffer } from "./raster"
import type { World, WorldStyle, WorldView } from "./world"
import type { WorldAsk, WorldDone } from "./world-ask"

/** One moment to paint: the model, the view, the build's state, the style. */
export type WorldMoment = {
  world: World
  view: WorldView
  state: AssemblyState | null
  heat: Rgb
  seed: number
  dt: number
  style: WorldStyle
}

/** The page's side of a world: `paint(buffer, now, next)` fills `buffer`
 * with the latest moment the worker finished (`here` paints `now` at once
 * when there is none, or no worker) and asks for `next`; `stop` lets the
 * worker go. `spawn` makes the worker, or null where there are none. */
export function offloadWorld(spawn: () => Worker | null) {
  let worker: Worker | null | undefined
  let done: WorldDone | null = null
  let asked = false
  let spare: ArrayBuffer | null = null
  // The model the worker holds, by identity, and the id it knows it by.
  let sent: World | null = null
  let id = 0
  const stop = () => {
    worker?.terminate()
    worker = null
  }
  return {
    paint(buffer: RasterBuffer, next: WorldMoment, here: () => void) {
      if (worker === undefined) {
        worker = spawn()
        if (worker) {
          worker.onmessage = (e: MessageEvent<WorldDone>) => {
            if (done) spare = done.pixels
            done = e.data
            asked = false
          }
          // A worker that cannot load (a bundler that did not emit it) is let
          // go for good: every paint is the page's again.
          worker.onerror = () => {
            stop()
            done = null
          }
        }
      }
      if (worker && done && done.cols === buffer.width && done.rows === buffer.height)
        buffer.data.set(new Uint8ClampedArray(done.pixels))
      else here()
      if (!worker || asked) return
      const n = buffer.width * buffer.height * 4
      const pixels = spare && spare.byteLength === n ? spare : new ArrayBuffer(n)
      spare = null
      const fresh = next.world !== sent
      if (fresh) {
        sent = next.world
        id++
      }
      const ask: WorldAsk = {
        id,
        world: fresh ? next.world : undefined,
        cols: buffer.width,
        rows: buffer.height,
        view: next.view,
        state: next.state,
        heat: next.heat,
        seed: next.seed,
        dt: next.dt,
        style: next.style,
        pixels,
      }
      asked = true
      worker.postMessage(ask, [pixels])
    },
    stop,
  }
}

/** A world's worker, where the page can have one. */
export const spawnWorldWorker = (): Worker | null => {
  if (typeof Worker === "undefined") return null
  try {
    return new Worker(new URL("./world-worker.ts", import.meta.url), { type: "module" })
  } catch {
    return null
  }
}
