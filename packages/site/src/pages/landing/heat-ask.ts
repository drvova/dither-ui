// The close's heat worker's side (`heat-offload.ts` is the page's): what
// the page asks for and how the worker answers. Its own module so the worker
// never imports the module that spawns it (a cycle the bundler warned of).
import type { Rgb } from "@dither-ui/kit/engine/palette.ts"
import { CLOSE, paintHeat } from "./heat"

/** What the page asks the worker for: the close at `time`, painted into
 * `pixels` (handed over and back, never copied on the way). */
export type HeatAsk = {
  cols: number
  rows: number
  time: number
  hand: readonly [number, number] | null
  ramp: readonly Rgb[]
  matrix: number[][]
  pixels: ArrayBuffer
}

/** What the worker hands back: the same pixels, painted. */
export type HeatDone = { cols: number; rows: number; pixels: ArrayBuffer }

/** The worker's side: paint the close the page asked for. */
export function answerHeat(ask: HeatAsk): HeatDone {
  const data = new Uint8ClampedArray(ask.pixels)
  paintHeat({ width: ask.cols, height: ask.rows, data }, ask.time, ask.hand, CLOSE.cell, ask.ramp, ask.matrix)
  return { cols: ask.cols, rows: ask.rows, pixels: ask.pixels }
}
