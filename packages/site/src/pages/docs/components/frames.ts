// The Gauge section's live panel reads the page it is on: frames a second
// and the worst frame in a window of frame stamps (ms, as rAF gives them).
// Pure, so the readings are tested apart from the loop that collects them.

/** How long a window of frames is read over, ms. */
export const FRAME_WINDOW = 500

/** A window's reading: frames a second over its span, and its longest frame
 * in ms (one decimal). Fewer than two stamps read as nothing yet. */
export function readFrames(stamps: readonly number[]): { fps: number; worst: number } {
  if (stamps.length < 2) return { fps: 0, worst: 0 }
  const span = stamps[stamps.length - 1] - stamps[0]
  let worst = 0
  for (let i = 1; i < stamps.length; i++) worst = Math.max(worst, stamps[i] - stamps[i - 1])
  return { fps: span > 0 ? Math.round(((stamps.length - 1) * 1000) / span) : 0, worst: Math.round(worst * 10) / 10 }
}
