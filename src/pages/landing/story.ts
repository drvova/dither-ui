// The agent session the ask section plays as you scroll: the ask, then what
// the agent does with the Studio's tools (`features/agent/tools.ts`:
// get_registry, add_screen, get_code, export_video), said in words. The
// screen is made only of registry components (`add_screen` lays them out),
// so every line is true. A step is one notch of the scroll: line `i` works
// at step `i` and is done after it, so the last step, every line done and
// the screen whole, is the still the story ends on (and the poster an
// unpinned stage shows).
export const ASK = "A deploy panel: this week's deploys, the build minutes used and an auto deploy switch."

export const DOES = [
  "Reads every component and its props",
  "Lays out a Deploys screen from them",
  "Writes the screen as a Vue file",
  "Renders it as an MP4",
] as const

export const STEPS = DOES.length + 1

/** Where a line stands at a step: not yet said, being done, done. */
export type LineState = "ahead" | "working" | "done"
export const lineState = (line: number, step: number): LineState =>
  step < line ? "ahead" : step === line ? "working" : "done"

/** Deploys per day this week: the screen's chart; its count is their sum.
 * A working week, never a day without one, so a dip the crop cuts never
 * reads as zero. */
export const DAYS = [3, 5, 4, 6, 5, 7, 6] as const
export const DEPLOYS = DAYS.reduce((n, d) => n + d, 0)

/** The step each part of the screen resolves at, top to bottom, while the
 * agent lays it out; before it, the part's slot holds its place. */
export const PARTS = { count: 1, meter: 1, toggle: 2, chart: 2 } as const

/** The line whose result the render chip shows: rendering while it works,
 * ready once it is done. */
export const RENDER = DOES.length - 1
