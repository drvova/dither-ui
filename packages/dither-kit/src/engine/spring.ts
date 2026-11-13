// The spring: Apple's smooth motion (a critically damped spring, no bounce,
// the curve SwiftUI's `.smooth` and UIKit's sheets settle on), normalised so
// it lands exactly on 1 at the end of whatever duration it is given. It
// starts from rest, gathers, and settles long and soft, never overshooting:
// one shape at every duration, since a spring's response scales its time.
// The kit's "spring" easing is this function; a stylesheet takes the same
// curve as CSS `linear()` (`springLinear`), or the bezier that stays closest
// to it where `linear()` is not supported (`SPRING_BEZIER`).

/** How stiff the spring is against its duration: at the end it has settled
 * to within a thousandth of its rest, so the cut to rest is unseen. */
const OMEGA = 9.23

const raw = (t: number) => 1 - (1 + OMEGA * t) * Math.exp(-OMEGA * t)
const END = raw(1)

/** The spring at `t` in [0, 1] (clamped): 0 at rest, 1 landed. */
export function spring(t: number): number {
  if (!(t > 0)) return 0
  if (t >= 1) return 1
  return raw(t) / END
}

/** The cubic-bezier closest to the spring (within 3.5% at every point), for
 * where CSS `linear()` is not supported. */
export const SPRING_BEZIER = [0.29, 0.6, 0.14, 1] as const

/** The spring as a CSS `linear()` timing function, `points` evenly spaced
 * stops, four decimals each. */
export function springLinear(points = 32): string {
  const stops = Array.from({ length: points + 1 }, (_, i) => Number(spring(i / points).toFixed(4)))
  return `linear(${stops.join(", ")})`
}
