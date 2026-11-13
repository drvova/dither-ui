// Pure step-timing primitives — the engine's temporal lattice. Progress in,
// quantized progress out: the same threshold operation the Bayer matrix performs
// on tone, performed on time. DOM-free and clock-free by contract (see
// dither-kit/AGENTS.md): drivers own the clock and pick the cadence; this module
// only maps values. The four step positions are spec-locked to css-easing-1 —
// tests/timing.spec.ts holds the MDN parity table; change both together.

/** Progress mapper: input progress 0..1 → output progress (0..1 at the ends). */
export type Easing = (p: number) => number

/** Step positions, spelled exactly as the CSS `steps()` keyword. */
export type StepPosition = "jump-end" | "jump-start" | "jump-none" | "jump-both"

/** Identity — the smooth baseline every quantized easing is compared against. */
export const linear: Easing = (p) => p

/**
 * CSS-compatible `steps(n, position)`:
 * - `jump-end` (default): floor(p·n)/n — holds the start, the end value lands
 *   only on the final frame (flipbooks; pair with `fill: both`).
 * - `jump-start`: min(1, (floor(p·n)+1)/n) — jumps immediately, ends ON the end.
 * - `jump-none`: floor(p·n)/(n−1), clamped — both 0 and 1 get a full interval
 *   (meters/counters that must display 100%). Requires n ≥ 2, like CSS.
 * - `jump-both`: (floor(p·n)+1)/(n+1) — start and end each get a plateau.
 */
export function steps(n: number, position: StepPosition = "jump-end"): Easing {
  const k = Math.floor(n)
  if (!Number.isFinite(k) || k < 1) throw new RangeError(`steps(): n must be ≥ 1, got ${n}`)
  if (position === "jump-none" && k < 2) {
    throw new RangeError(`steps(jump-none): n must be ≥ 2, got ${n}`)
  }
  const at = (p: number): number => (p <= 0 ? 0 : p >= 1 ? 1 : p)
  switch (position) {
    case "jump-start":
      return (p) => Math.min(1, (Math.floor(at(p) * k) + 1) / k)
    case "jump-none":
      return (p) => Math.min(1, Math.floor(at(p) * k) / (k - 1))
    case "jump-both":
      return (p) => (Math.floor(at(p) * k) + 1) / (k + 1)
    default:
      return (p) => Math.floor(at(p) * k) / k
  }
}

/**
 * `frame(fps)` cadence as a steps() polyfill: the step count derived from a
 * frame rate and a duration, so the perceptual cadence survives duration
 * changes — `frameSteps(24, 1000)` → 24 steps, `frameSteps(24, 500)` → 12.
 */
export function frameSteps(fps: number, durationMs: number): Easing {
  const count = Math.round((durationMs / 1000) * fps)
  return steps(count)
}

/**
 * Wall-time discrete frame clock: which fps-frame index does this elapsed time
 * fall in? Drivers gate painting on it (same index → hold the frame) — the
 * stop-motion seam for canvas drivers. `frameIndex(elapsedMs, fps)` jumps by 1
 * exactly `fps` times per second, independent of any animation duration.
 */
export function frameIndex(elapsedMs: number, fps: number): number {
  if (!Number.isFinite(fps) || fps <= 0) throw new RangeError(`frameIndex(): fps must be > 0, got ${fps}`)
  return Math.floor((Math.max(0, elapsedMs) * fps) / 1000)
}

/**
 * One config → the CSS string: `cssSteps(8, "jump-none")` → `"steps(8, jump-none)"`.
 * Serializes through `steps()` so the CSS surface and the JS driver can never
 * disagree on validity or spelling.
 */
export function cssSteps(n: number, position: StepPosition = "jump-end"): string {
  steps(n, position) // shared validation — throws on the same inputs CSS invalidates
  return `steps(${Math.floor(n)}, ${position})`
}
