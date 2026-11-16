// The hand's spring (the user's call): a key let go after a press settles
// on a spring that may pass its mark a little and comes back, where
// everything else moves on the glide. ONE definition, a response and a
// bounce: the spring takes about `response` to reach its mark and passes it
// by `bounce`'s share of the way at most. The stylesheet takes it as CSS
// `linear()` (`springLinear`, copied into `app/styles.css` as
// `--ease-spring` over `--spring-time` and held to this module by
// `tests/spring.spec.ts`): the press's way back, a transition, never a
// script (the user's call: no motion is JS). Framework-free.

/** The spring: its response (s) and how far past its mark it may go. */
export const HAND_SPRING = { response: 0.35, bounce: 0.25 } as const

/** Where the motion counts as settled: this share of its travel left. */
const SETTLED = 1 / 500

/** The spring's physics for unit mass: its natural frequency, damping
 * ratio and the frequency it rings at (rad/s). */
export function springPhysics(spring: { response: number; bounce: number } = HAND_SPRING) {
  const omega = (2 * Math.PI) / spring.response
  const zeta = 1 - spring.bounce
  return {
    stiffness: omega * omega,
    damping: 2 * zeta * omega,
    omega,
    zeta,
    ring: omega * Math.sqrt(1 - zeta * zeta),
  }
}

const PHYSICS = springPhysics()

/** The spring at `t` seconds after it was let go `x0` from its mark at
 * `v0` (units a second, toward the mark negative of `x0`): how far from the
 * mark it is and how fast it moves. */
export function springAt(t: number, x0: number, v0 = 0): { x: number; v: number } {
  const { omega, zeta, ring } = PHYSICS
  const a = zeta * omega
  const b = (v0 + a * x0) / ring
  const decay = Math.exp(-a * t)
  const cos = Math.cos(ring * t)
  const sin = Math.sin(ring * t)
  return {
    x: decay * (x0 * cos + b * sin),
    v: decay * ((b * ring - a * x0) * cos - (a * b + x0 * ring) * sin),
  }
}

/** How long the spring takes from rest to settle on its mark, ms (rounded
 * up to 10ms): the duration its CSS easing runs over. */
export const SPRING_MS = (() => {
  const { omega, zeta, ring } = PHYSICS
  const a = zeta * omega
  const amplitude = Math.hypot(1, a / ring)
  return Math.ceil((Math.log(amplitude / SETTLED) / a) * 100) * 10
})()

/** The spring from rest as an easing over `SPRING_MS`: 0 at the start, 1
 * at the end, a little over 1 where it passes its mark. */
export const springEase = (t: number) => (t >= 1 ? 1 : t <= 0 ? 0 : 1 - springAt((t * SPRING_MS) / 1000, 1).x)

/** The largest share past its mark the spring goes, from rest. */
export const SPRING_OVERSHOOT = Math.exp((-PHYSICS.zeta * PHYSICS.omega * Math.PI) / PHYSICS.ring)

/** The spring as a CSS `linear()` easing over `SPRING_MS`, `points`
 * evenly spaced stops, three decimals each. */
export function springLinear(points = 40): string {
  const stops = Array.from({ length: points + 1 }, (_, i) => Number(springEase(i / points).toFixed(3)))
  return `linear(${stops.join(", ")})`
}
