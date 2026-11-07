// One budget for every kit surface's paint in a frame. Each surface paints
// on its own cadence; where several land in the same frame (a heat print, a
// model, a shader) their paints together overran it and the page hitched
// (measured on the landing: frames of 20ms and more where two met). A paint
// asks first: past the budget it waits one frame, and one that has waited
// always paints, so nothing runs more than a frame late and no frame holds
// more than the budget and one paint. Framework-free: both kits' runtimes
// read it (the Svelte kit's copy is verbatim).

/** Main-thread ms the kit's paints may take in one frame, together: half a
 * 60Hz frame, the rest left to the page's own work and the browser's. */
export const FRAME_BUDGET_MS = 8

/** The frame being booked (its rAF timestamp) and what it has spent. */
let frameAt = Number.NaN
let spent = 0

function frameOf(now: number) {
  if (now !== frameAt) {
    frameAt = now
    spent = 0
  }
}

/** Whether a paint may run in the frame stamped `now` (the rAF timestamp
 * every callback of one frame shares): while the frame's paints are under
 * budget, or always when `owed`, a paint that already waited a frame. */
export function mayPaint(now: number, owed: boolean): boolean {
  frameOf(now)
  return owed || spent < FRAME_BUDGET_MS
}

/** Book `ms` of paint against the frame stamped `now`. */
export function spend(now: number, ms: number): void {
  frameOf(now)
  spent += ms
}
