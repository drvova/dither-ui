// The close's heat painted off the main thread. Its band paints a film's
// cadence while the page moves, and each paint (three noise calls a cell
// over the band) was the landing's heaviest main-thread work but one. A
// worker paints it: each paint the page takes the worker's latest finished
// frame (a copy, under a tenth of a millisecond) and asks for the frame due
// at the next paint, so what shows lands on time. The first paint, and any
// sheet that holds still, paints here at once; without workers every paint
// does.
import type { Rgb } from "@dither-kit/engine/palette"
import type { RasterBuffer } from "@dither-kit/engine/raster"
import { CLOSE, paintHeat } from "./heat"
import type { HeatAsk, HeatDone } from "./heat-ask"

/** The page's side of the close: `paint` fills `buffer` with the latest
 * frame the worker finished (painting it here when there is none yet, or
 * no worker) and asks for the one at `next` seconds; `stop` lets the
 * worker go. `spawn` makes the worker, or null where there are none. */
export function offloadHeat(spawn: () => Worker | null) {
  let worker: Worker | null | undefined
  let done: HeatDone | null = null
  let asked = false
  // The two pixel buffers taking turns: one with the worker, one back here.
  let spare: ArrayBuffer | null = null
  const ask = (buffer: RasterBuffer, next: number, hand: HeatAsk["hand"], ramp: readonly Rgb[], matrix: number[][]) => {
    const n = buffer.width * buffer.height * 4
    const pixels = spare && spare.byteLength === n ? spare : new ArrayBuffer(n)
    spare = null
    asked = true
    const message: HeatAsk = { cols: buffer.width, rows: buffer.height, time: next, hand, ramp, matrix, pixels }
    worker!.postMessage(message, [pixels])
  }
  return {
    paint(
      buffer: RasterBuffer,
      time: number,
      next: number,
      hand: HeatAsk["hand"],
      ramp: readonly Rgb[],
      matrix: number[][],
    ) {
      if (worker === undefined) {
        worker = spawn()
        if (worker)
          worker.onmessage = (e: MessageEvent<HeatDone>) => {
            if (done) spare = done.pixels
            done = e.data
            asked = false
          }
      }
      if (done && done.cols === buffer.width && done.rows === buffer.height)
        buffer.data.set(new Uint8ClampedArray(done.pixels))
      else paintHeat(buffer, time, hand, CLOSE.cell, ramp, matrix)
      if (worker && !asked) ask(buffer, next, hand, ramp, matrix)
    },
    stop() {
      worker?.terminate()
      worker = null
    },
  }
}

/** The close's worker, where the page can have one. */
export const spawnHeatWorker = (): Worker | null =>
  typeof Worker === "undefined" ? null : new Worker(new URL("./heat-worker.ts", import.meta.url), { type: "module" })
