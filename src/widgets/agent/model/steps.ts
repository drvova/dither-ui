// A Studio tool call as the composer shows it: one step in words (a verb,
// what it touched, a glyph) and the frames it changed, which the changes bar
// gathers per turn so the user keeps them or puts the canvas back. Tools
// that only read change nothing.
import type { IconName } from "@dither-kit"

type Result = { ok: true; data: unknown } | { ok: false; error: string }
export type Changed = { id: string; name: string }
export type Step = { icon: IconName; title: string; changed: Changed[]; mutates: boolean }

/** Every Studio tool: its verb, its glyph, and whether it edits the canvas. */
export const STEPS: Record<string, { verb: string; icon: IconName; mutates: boolean }> = {
  list_artboards: { verb: "Listed the frames", icon: "Layers", mutates: false },
  get_registry: { verb: "Read the registry", icon: "Book", mutates: false },
  get_document: { verb: "Read the document", icon: "File", mutates: false },
  get_code: { verb: "Read the code of", icon: "Code", mutates: false },
  select: { verb: "Selected", icon: "Crosshair", mutates: false },
  seek_clock: { verb: "Held the clock", icon: "Clock", mutates: false },
  export_video: { verb: "Exported a video of", icon: "Video", mutates: false },
  add_screen: { verb: "Added the screen", icon: "Layout", mutates: true },
  add_component: { verb: "Added", icon: "Box", mutates: true },
  add_chart: { verb: "Added the chart", icon: "ChartLine", mutates: true },
  add_widget: { verb: "Added", icon: "Sparkles", mutates: true },
  add_reel: { verb: "Cut the reel", icon: "Film", mutates: true },
  update_artboard: { verb: "Updated", icon: "Edit", mutates: true },
  remove_artboard: { verb: "Removed a frame", icon: "Trash", mutates: true },
  evolve: { verb: "Evolved", icon: "Dice", mutates: true },
}

const frame = (d: unknown): Changed | null =>
  d && typeof d === "object" && typeof (d as Changed).id === "string" && typeof (d as Changed).name === "string"
    ? { id: (d as Changed).id, name: (d as Changed).name }
    : null

export function toolStep(name: string, args: Record<string, unknown>, result: Result): Step {
  const known = STEPS[name] ?? { verb: name.replace(/_/g, " "), icon: "Terminal" as IconName, mutates: false }
  const data = result.ok ? result.data : null
  const frames = Array.isArray(data) ? data.map(frame) : [frame(data)]
  const changed = known.mutates ? frames.filter((f): f is Changed => f !== null) : []
  // What it touched: the frame by name, a count of variants, else what was asked.
  const object =
    name === "evolve" && changed.length
      ? `${changed.length} ${changed.length === 1 ? "variant" : "variants"}`
      : (frames[0]?.name ?? (typeof args.name === "string" ? args.name : typeof args.is === "string" ? args.is : ""))
  return { icon: known.icon, title: `${known.verb}${object ? ` ${object}` : ""}`, changed, mutates: known.mutates }
}
