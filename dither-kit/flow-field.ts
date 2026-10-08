// FlowField — thousands of tiny white dots advected through a seeded simplex
// wind: each particle samples the noise angle at its own position and drifts
// down-current, stamping one low-opacity dither cell per frame while the
// buffer's old ink fades beneath it — the fade IS the trail, so streaks read
// as wind currents / flowing water without ever storing a line.
//
// The painter is pure over the RasterBuffer contract; the particle state
// rides a WeakMap keyed by the buffer (the runtime persists one buffer per
// component, so the keying is stable, and a resized/replaced buffer simply
// gets fresh particles). Deterministic per seed: the simplex table and the
// particle scatter both derive from it.

import { clamp01 } from "./pixel"
import { mulberry32, simplex2DFactory } from "./noise"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"

export type FlowFieldParams = {
  colors: Rgb[]
  /** particle count — thousands reads as wind, hundreds reads as fireflies. */
  count: number
  /** drift speed in cell-heights per second. */
  speed: number
  /** noise frequency — higher = tighter eddies. */
  scale: number
  /** trail persistence: 0.9 = long streaks, 1 = no trail (pure dots). */
  fade: number
  /** per-dot brightness gain. */
  glow: number
  opacity: number
  dither: number
  /** deterministic seed for the noise table + particle scatter. */
  seed: number
}

type FlowState = {
  noise: (x: number, y: number) => number
  rng: () => number
  px: Float32Array
  py: Float32Array
  life: Float32Array
}

const states = new WeakMap<RasterBuffer, FlowState>()

function spawn(state: FlowState, i: number, w: number, h: number): void {
  state.px[i] = state.rng() * w
  state.py[i] = state.rng() * h
  state.life[i] = 4 + state.rng() * 10 // seconds of drift before a re-seed
}

/**
 * The trail: every pixel's ink decays toward transparent, multiplicative
 * with a subtractive floor — a pure multiplicative fade leaves ghost residue
 * at low alphas (rounding never reaches 0); the floor guarantees an exact
 * clear. Exported as its own seam: the floor's exact-clear guarantee is a
 * tested contract, not an implementation detail.
 */
export function fadeRasterAlpha(buffer: RasterBuffer, persistence: number): void {
  const drop = Math.min(1, Math.max(0.02, 1 - persistence))
  const cut = 2 // alpha units removed per frame regardless of level
  const data = buffer.data
  for (let i = 3; i < data.length; i += 4) {
    const a = data[i]
    if (a === 0) continue
    const next = a * (1 - drop) - cut
    data[i] = next > 0 ? next : 0
  }
}

export function paintFlowField(
  buffer: RasterBuffer,
  p: FlowFieldParams,
  time: number,
  dt: number,
  matrix: number[][],
): void {
  const w = buffer.width
  const h = buffer.height
  const data = buffer.data
  const n = Math.max(1, Math.min(20000, Math.round(p.count)))

  // 1) The trail decays toward transparent.
  fadeRasterAlpha(buffer, p.fade)

  // 2) The state (created once per buffer; rebuilt if the count changes).
  let st = states.get(buffer)
  if (!st || st.px.length !== n) {
    st = { noise: simplex2DFactory(p.seed), rng: mulberry32(p.seed ^ 0x9e3779b9), px: new Float32Array(n), py: new Float32Array(n), life: new Float32Array(n) }
    for (let i = 0; i < n; i++) spawn(st, i, w, h)
    states.set(buffer, st)
  }

  // 3) Advect + stamp.
  const step = clamp01(p.speed) * 60 // cells per second at speed 1
  const freq = Math.max(0.001, p.scale) / 100 // noise-space frequency
  const col: [number, number, number] = [0, 0, 0]
  for (let i = 0; i < n; i++) {
    st.life[i] -= dt
    if (st.life[i] <= 0) spawn(st, i, w, h)
    const angle = st.noise(st.px[i] * freq, st.py[i] * freq + time * 0.15) * Math.PI * 2
    st.px[i] += Math.cos(angle) * step * dt
    st.py[i] += Math.sin(angle) * step * dt
    // Toroidal wrap: the wind never runs out of world.
    if (st.px[i] < 0) st.px[i] += w
    else if (st.px[i] >= w) st.px[i] -= w
    if (st.py[i] < 0) st.py[i] += h
    else if (st.py[i] >= h) st.py[i] -= h

    const cx = st.px[i] | 0
    const cy = st.py[i] | 0
    if (cx < 0 || cy < 0 || cx >= w || cy >= h) continue
    // The dither gate: the Bayer rank decides whether this stamp lands hard
    // (lit) or faint (the half-tone) — the house texture, per cell.
    const lit = matrix[cy & 3][cx & 3] > 0.5 ? 1 : 0.6
    const a = clamp01(0.5 * p.glow * lit) * p.opacity
    if (a <= 0) continue
    const pi = (cy * w + cx) * 4
    sampleRgbGradient(p.colors, clamp01(st.py[i] / h), col)
    // Source-over stamp with a soft cap so dense clusters bloom, not blow out.
    const da = data[pi + 3] / 255
    const outA = a + da * (1 - a)
    if (outA <= 0) continue
    data[pi] = (col[0] * a + data[pi] * da * (1 - a)) / outA
    data[pi + 1] = (col[1] * a + data[pi + 1] * da * (1 - a)) / outA
    data[pi + 2] = (col[2] * a + data[pi + 2] * da * (1 - a)) / outA
    data[pi + 3] = outA * 255
  }
}
