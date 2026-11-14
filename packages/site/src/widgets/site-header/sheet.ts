// The menu as a bottom sheet under the hand (the user's call, after a
// phone's bottom sheet): it slides up from the foot of the screen on the
// glide, and the reader can drag it down by its head to close it. Let go,
// it closes if it was pulled far enough or thrown down, else it springs
// back up (the hand's spring, `shared/lib/spring.ts`, from the finger's own
// velocity); a cancelled drag springs back. Pulled up, it gives a little
// and no more. Framework-free.
import { GLIDE_BEZIER } from "@dither-ui/kit/engine/dither-paint.ts"

export const SHEET_DRAG = {
  /** How far a finger moves (px) before the head takes it as a drag, so a
   * tap on the close key stays a tap. */
  slop: 6,
  /** The share of the sheet's height that, dragged past, closes it. */
  close: 0.3,
  /** A throw down at this speed (px a ms) closes it whatever the distance;
   * one up as fast keeps it open whatever the distance. */
  flick: 0.5,
  /** How much of a pull up the sheet follows, and how far at most (px). */
  give: 0.2,
  reach: 24,
  /** The pointer's last stretch read for its velocity, ms. */
  window: 80,
} as const

/** How the sheet comes and goes when no hand moves it: a sheet's time on
 * the glide. */
export const SHEET_SLIDE = { duration: 500, easing: `cubic-bezier(${GLIDE_BEZIER.join(", ")})` } as const

/** Where the sheet stands (px below its rest) for a finger `dy` px from
 * where it took hold: down as far as it goes, up only a little. */
export const pullOf = (dy: number) => (dy >= 0 ? dy : -Math.min(SHEET_DRAG.reach, -dy * SHEET_DRAG.give))

/** What a sheet let go `offset` px down, moving at `velocity` px a ms
 * (down positive), `height` px tall, does. */
export function releaseOf(offset: number, velocity: number, height: number): "close" | "stay" {
  if (velocity >= SHEET_DRAG.flick) return "close"
  if (velocity <= -SHEET_DRAG.flick) return "stay"
  return offset >= height * SHEET_DRAG.close ? "close" : "stay"
}

/** One reading of the pointer: when (ms) and where (px). */
export type DragSample = { t: number; y: number }

/** The pointer's velocity (px a ms) over its last `SHEET_DRAG.window` ms. */
export function velocityOf(samples: readonly DragSample[]): number {
  const last = samples.at(-1)
  if (!last) return 0
  const first = samples.find((s) => last.t - s.t <= SHEET_DRAG.window) ?? last
  return last.t > first.t ? (last.y - first.y) / (last.t - first.t) : 0
}
