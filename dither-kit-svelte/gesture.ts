/** Gesture math for swipeable surfaces (drawers, sheets).
 * Both formulas follow Apple's "Designing Fluid Interfaces" sample code. */

/** Project where a flick would land: momentum, not the release point. */
export function project(velocity: number, decelerationRate = 0.998): number {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate)
}

/** Progressive resistance past a boundary — real things slow before they stop. */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot))
}

export type VelocitySample = { t: number; p: number }

/** Velocity in px/s from a short pointer-move history. */
export function velocityFrom(samples: VelocitySample[]): number {
  if (samples.length < 2) return 0
  const a = samples[0]
  const b = samples[samples.length - 1]
  const dt = (b.t - a.t) / 1000
  return dt > 0 ? (b.p - a.p) / dt : 0
}
