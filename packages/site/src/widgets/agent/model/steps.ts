// A Studio tool call as the composer shows it: one step in words (a verb,
// what it touched, a glyph) and the frames it changed, which the changes bar
// gathers per turn so the user keeps them or puts the canvas back. Tools
// that only read change nothing.
import type { IconName } from "@dither-ui/kit"
import { commandRows, type ToolStep } from "@/features/agent/commands"
import { parseDither } from "@/features/agent/dither"
import { STUDIO_SERVER } from "@/features/agent/tools"

type Result = { ok: true; data: unknown } | { ok: false; error: string }
export type Changed = { id: string; name: string }
export type Step = { icon: IconName; title: string; changed: Changed[]; mutates: boolean }

/** Every Studio tool's step (the command table's), and the one tool's own
 * `find` and `build`. */
export const STEPS: Record<string, ToolStep> = {
  ...Object.fromEntries(commandRows().flatMap(([, { tool }]) => (tool ? [[tool.def.name, tool.step]] : []))),
  find: { verb: "Looked for what fits", ask: "Look for the actions that fit the job", icon: "Search", mutates: false },
  build: { verb: "Built the tool", ask: "Build a tool for the job", icon: "Sparkles", mutates: false },
}

const frame = (d: unknown): Changed | null =>
  d && typeof d === "object" && typeof (d as Changed).id === "string" && typeof (d as Changed).name === "string"
    ? { id: (d as Changed).id, name: (d as Changed).name }
    : null

/** A permission prompt's title as a person reads it. A harness names an MCP
 * tool `mcp__<server>__<tool>`: the Studio's one tool says what this call
 * will do (from its input, when the prompt carries it), any other its
 * tool's name and server. Anything else stands as it came. */
export function askTitle(title: string, input?: unknown): string {
  const m = /^mcp__(.+?)__(\w+)$/.exec(title.trim())
  if (!m) return title
  const [, server, tool] = m
  if (server !== STUDIO_SERVER) return `${tool.replace(/_/g, " ")} (${server})`
  const call = parseDither(input)
  if ("error" in call) return "Use the Studio"
  if (call.kind === "find") return STEPS.find.ask
  if (call.kind === "build") return `${STEPS.build.ask}: ${call.tool.name.replace(/_/g, " ")}`
  return STEPS[call.action]?.ask ?? `Run ${call.action.replace(/_/g, " ")}`
}

export function toolStep(name: string, args: Record<string, unknown>, result: Result, built = false): Step {
  // A tool the harness built: its own Studio calls are steps of their own.
  if (built) return { icon: "Sparkles", title: `Ran ${name.replace(/_/g, " ")}`, changed: [], mutates: false }
  const known = STEPS[name] ?? { verb: name.replace(/_/g, " "), icon: "Terminal" as IconName, mutates: false }
  const data = result.ok ? result.data : null
  const frames = Array.isArray(data) ? data.map(frame) : [frame(data)]
  const changed = known.mutates ? frames.filter((f): f is Changed => f !== null) : []
  // What it touched: the frame by name, a count of variants, else what was asked.
  const object =
    name === "evolve" && changed.length
      ? `${changed.length} ${changed.length === 1 ? "variant" : "variants"}`
      : name === "find" && typeof args.job === "string"
        ? args.job
        : (frames[0]?.name ?? (typeof args.name === "string" ? args.name : typeof args.is === "string" ? args.is : ""))
  return { icon: known.icon, title: `${known.verb}${object ? ` ${object}` : ""}`, changed, mutates: known.mutates }
}
