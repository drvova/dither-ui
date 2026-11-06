// The scope: an oscilloscope's trace printed through the threshold matrix,
// Vue-free so both kits share it verbatim. The beam sweeps the screen left
// to right; where it moves slowly (a flat stretch) it lands bright, where it
// moves fast (an edge) it lands faint, as a real beam does, and it leaves a
// glow on the rows beside it. A named wave drifts on its phase; its
// afterglow is the trace at a few earlier phases, each fainter, so a moment
// prints the same however it was reached (seekable, video-safe).

import type { Rgb } from "./palette"
import { clamp01 } from "./pixel"
import { cellCanvas } from "./raster"

export type ScopeWave = "sine" | "square" | "triangle" | "saw"
/** What the scope traces: a named wave, or samples in -1..1 across the screen. */
export type ScopeSignal = ScopeWave | readonly number[]

/** The graticule's divisions across and up, the screen's 5:4. */
export const SCOPE_DIVISIONS = [10, 8] as const
/** Earlier traces printed behind the beam, and the phase between two of them. */
export const SCOPE_ECHOES = 6
export const SCOPE_ECHO_STEP = 0.012

const TAU = Math.PI * 2
const wrap = (p: number) => p - Math.floor(p)

/** A named wave's value (-1..1) at phase `p`, in cycles. */
export function waveAt(wave: ScopeWave, p: number): number {
  const t = wrap(p)
  if (wave === "square") return t < 0.5 ? 1 : -1
  if (wave === "triangle") return 1 - 4 * Math.abs(t - 0.5)
  if (wave === "saw") return 2 * t - 1
  return Math.sin(t * TAU)
}

/** The signal at `x` (0..1 across the screen): a named wave runs `cycles`
 * cycles from `phase`; samples are read linearly between neighbours. */
export function signalAt(signal: ScopeSignal, x: number, cycles: number, phase: number): number {
  if (typeof signal === "string") return waveAt(signal, x * cycles + phase)
  const n = signal.length
  if (n === 0) return 0
  if (n === 1) return signal[0]
  const at = clamp01(x) * (n - 1)
  const i = Math.min(n - 2, Math.floor(at))
  const f = at - i
  return Math.max(-1, Math.min(1, signal[i] * (1 - f) + signal[i + 1] * f))
}

/** The beam's energy on a `w` by `h` grid for one pass at `phase`, laid into
 * `energy` (the brighter of what is there and this pass, times `weight`). */
function sweep(
  energy: Float32Array,
  w: number,
  h: number,
  signal: ScopeSignal,
  cycles: number,
  phase: number,
  gain: number,
  weight: number,
): void {
  const mid = (h - 1) / 2
  const amp = mid * 0.9 * gain
  const rowOf = (x: number) => Math.round(mid - signalAt(signal, (x + 0.5) / w, cycles, phase) * amp)
  let prev = rowOf(0)
  const lay = (x: number, y: number, e: number) => {
    if (y < 0 || y >= h) return
    const i = y * w + x
    if (e > energy[i]) energy[i] = e
  }
  for (let x = 0; x < w; x++) {
    const row = rowOf(x)
    const lo = Math.min(prev, row)
    const hi = Math.max(prev, row)
    // a fast beam lands faint: the column's energy spread over its span
    const e = weight * Math.max(0.3, 1 / (1 + (hi - lo) * 0.35))
    for (let y = lo; y <= hi; y++) {
      lay(x, y, e)
      lay(x, y - 1, e * 0.3)
      lay(x, y + 1, e * 0.3)
    }
    prev = row
  }
}

export type ScopeTrace = {
  signal: ScopeSignal
  /** Cycles of a named wave across the screen. */
  cycles: number
  /** Where the wave starts, in cycles. */
  phase: number
  /** The trace's height, 1 filling the screen's height. */
  gain: number
  /** The afterglow, 0 (none) to 1 (every echo at its full share). */
  afterglow: number
}

/** The trace's energy (0..1) for each cell of a `w` by `h` grid, row by row. */
export function scopeEnergy(w: number, h: number, t: ScopeTrace): Float32Array {
  const energy = new Float32Array(w * h)
  const glow = clamp01(t.afterglow)
  // a named wave leaves its earlier phases behind; samples hold still
  const echoes = typeof t.signal === "string" && glow > 0 ? SCOPE_ECHOES : 0
  for (let k = echoes; k >= 0; k--) {
    const weight = k === 0 ? 1 : glow * 0.55 * (1 - k / (echoes + 1))
    sweep(energy, w, h, t.signal, t.cycles, t.phase - k * SCOPE_ECHO_STEP, t.gain, weight)
  }
  return energy
}

/** Print the trace on a `w` by `h` grid through `matrix`. */
export function paintScope(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  ink: Rgb,
  trace: ScopeTrace,
  matrix: number[][],
): void {
  const px = cellCanvas(ctx, w, h)
  const energy = scopeEnergy(w, h, trace)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const e = energy[y * w + x]
      if (e <= 0.02) continue
      px.cell(x, y, ink, e > matrix[y & 3][x & 3] ? 0.35 + 0.65 * e : e * 0.3)
    }
  }
  px.flush()
}
