// The agent session the ask section plays as you scroll: what a harness
// sends the Studio and the Studio tools it calls, by their real names and
// arguments (`features/agent/tools.ts`), with what each returns. The screen
// is made only of registry components (`add_screen` lays them out), so
// every line is true. A step is one notch of the scroll; `CHAPTERS` group
// them, `CALLS` land at theirs and finish at `done`, and the frame's parts
// appear at `PARTS`.
export const ASK = "a deploy panel: this week's deploys, the build minutes used and an auto deploy switch"

export const STEPS = 8

export const CHAPTERS = [
  { label: "Ask", from: 0 },
  { label: "Tool calls", from: 1 },
  { label: "Frame", from: 3 },
  { label: "Export", from: 6 },
] as const

export const CALLS = [
  { step: 1, done: 1, at: "0.6s", tool: "get_registry", args: "{}", result: "Every component and its props" },
  {
    step: 2,
    done: 3,
    at: "1.9s",
    tool: "add_screen",
    args: '{ name: "Deploys", rows: 4 }',
    result: "Deploys, four rows of kit parts",
  },
  { step: 6, done: 6, at: "3.4s", tool: "get_code", args: '{ styling: "tailwind" }', result: "Deploys.vue" },
  { step: 7, done: 7, at: "4.1s", tool: "export_video", args: "{ seconds: 6 }", result: "video/deploys/index.html" },
] as const

/** The step each of the frame's rows appears at: the heading and the
 * count, the meter, the switch. */
export const PARTS = { count: 3, meter: 4, toggle: 5 } as const

/** What `get_code` hands back, its template's parts. */
export const CODE = [
  '<DitherHeading level="3">Deploys</DitherHeading>',
  '<DitherNumberText :value="16" />',
  '<DitherProgress :value="64" color="blue" />',
  '<DitherSwitch v-model="auto" label="Auto deploy" />',
] as const
