// Pure step-timing primitives — the engine's temporal lattice. Progress in,
// quantized progress out: the same threshold operation the Bayer matrix performs
// on tone, performed on time. DOM-free and clock-free by contract (see
// dither-kit/AGENTS.md): drivers own the clock and pick the cadence; this module
// only maps values. The four step positions are spec-locked to css-easing-1 —
// tests/timing.spec.ts holds the MDN parity table; change both together.
import { cubicBezier } from "./dither-paint"

/** Progress mapper: input progress 0..1 → output progress (0..1 at the ends). */
export type Easing = (p: number) => number

/** Step positions, spelled exactly as the CSS `steps()` keyword. */
export type StepPosition = "jump-end" | "jump-start" | "jump-none" | "jump-both"

/** The CSS timing function an easing made here is, for a driver that hands
 * its motion to a stylesheet. */
const CSS_OF = new WeakMap<Easing, string>()

/** The CSS spelling of an easing made here (`linear`, `steps()`), or
 * undefined for any other function. */
export const cssEasing = (easing: Easing): string | undefined => CSS_OF.get(easing)

/** Identity — the smooth baseline every quantized easing is compared against. */
export const linear: Easing = (p) => p
CSS_OF.set(linear, "linear")

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
  const easing: Easing =
    position === "jump-start"
      ? (p) => Math.min(1, (Math.floor(at(p) * k) + 1) / k)
      : position === "jump-none"
        ? (p) => Math.min(1, Math.floor(at(p) * k) / (k - 1))
        : position === "jump-both"
          ? (p) => (Math.floor(at(p) * k) + 1) / (k + 1)
          : (p) => Math.floor(at(p) * k) / k
  CSS_OF.set(easing, `steps(${k}, ${position})`)
  return easing
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
  // shared validation — throws on the same inputs CSS invalidates
  return cssEasing(steps(n, position))!
}

/**
 * The four motion roles (the user's call): the scoped exceptions to the one
 * glide, each its own curve and duration. Everything else glides, and what
 * the hand lets go settles on the hand's spring.
 * - `travel`: a thing hopping from one place to the next along a path (a
 *   packet on its route, the mascot's flight), 420 to 620ms a hop (`span`;
 *   `ms` where one duration serves), five dots trailing behind it.
 * - `reorder`: cards changing places in a list or a grid.
 * - `pill`: a small value pill changing its text, size or place (a
 *   readout, a tab's marker, a key's label).
 * - `bump`: a hub or a receiver acknowledging an arrival with one small
 *   pulse past its mark: the one curve that overshoots without a hand, and
 *   only as the answer to an arrival.
 * The stylesheet's copy is `theme.css` (`--ease-<role>`, `--duration-<role>`,
 * as `motionRoleCss()` writes them; `tests/timing.spec.ts` holds the two
 * together).
 */
export const MOTION_ROLES = {
  travel: { bezier: [0.45, 0, 0.55, 1], ms: 520, span: [420, 620] },
  reorder: { bezier: [0.16, 1, 0.3, 1], ms: 700 },
  pill: { bezier: [0.2, 0.8, 0.2, 1], ms: 300 },
  bump: { bezier: [0.34, 1.4, 0.64, 1], ms: 250 },
} as const satisfies Record<
  string,
  { bezier: readonly [number, number, number, number]; ms: number; span?: readonly [number, number] }
>

export type MotionRole = keyof typeof MOTION_ROLES

const ROLES = Object.keys(MOTION_ROLES) as MotionRole[]

/** Each role's curve as an easing; `cssEasing` spells it as the
 * `cubic-bezier()` its custom property holds. */
export const ROLE_EASINGS = Object.fromEntries(
  ROLES.map((role) => {
    const bezier = MOTION_ROLES[role].bezier
    const easing: Easing = cubicBezier(bezier[0], bezier[1], bezier[2], bezier[3])
    CSS_OF.set(easing, `cubic-bezier(${bezier.join(", ")})`)
    return [role, easing]
  }),
) as Record<MotionRole, Easing>

/** The roles as the declarations a stylesheet carries, one a line:
 * `--ease-travel: cubic-bezier(0.45, 0, 0.55, 1);`, `--duration-travel: 520ms;`. */
export const motionRoleCss = (): string[] =>
  ROLES.flatMap((role) => [
    `--ease-${role}: ${cssEasing(ROLE_EASINGS[role])};`,
    `--duration-${role}: ${MOTION_ROLES[role].ms}ms;`,
  ])
