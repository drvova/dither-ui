// The agent session the ask section plays as you scroll: the ask, then what
// the agent does with the Studio's tools (`features/agent/tools.ts`:
// get_registry, add_screen, get_code, export_video), said in words. The
// screen is made only of registry components (`add_screen` lays them out),
// so every line is true. A step is one notch of the scroll; each line of
// `DOES` appears at its step, and the frame's parts at `PARTS`.
export const ASK = "A deploy panel: this week's deploys, the build minutes used and an auto deploy switch."

export const STEPS = 7

export const DOES = [
  { step: 1, line: "Reads every component and its props" },
  { step: 2, line: "Lays out a Deploys screen from them" },
  { step: 5, line: "Writes the screen as a Vue file" },
  { step: 6, line: "Renders it as an MP4" },
] as const

/** The step each of the frame's rows appears at: the heading and the
 * count, the meter, the switch. */
export const PARTS = { count: 2, meter: 3, toggle: 4 } as const
