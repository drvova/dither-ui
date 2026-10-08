// The Studio's tools as any harness sees them, the events the composer
// renders, and the composer's small persistent state.
//
// The composer is a CONTROL PLANE, not a model client: it never runs a model
// and never holds a credential. The user's own harness — Claude Code, Codex,
// Gemini CLI, oh-my-pi, Goose, OpenCode, any Agent Client Protocol agent —
// runs as the user's own signed-in process behind the local bridge
// (`bridge/dither-bridge.mjs`), and reaches the canvas through an MCP server
// made of the tools below (`acp.ts` is the browser side).
import { REEL_TRANSITIONS } from "@/entities/widget"
import { deliverVideo, type VideoExportData } from "@/features/export-video"
import type { CommandResult } from "./protocol"
import { runCommand } from "./protocol"

export type ToolDef = { name: string; description: string; parameters: Record<string, unknown> }
export type Usage = { input: number; output: number }

/* ------------------------------ studio tools ----------------------------- */

const obj = (properties: Record<string, unknown>, required: string[] = []) => ({ type: "object", properties, required, additionalProperties: true })
const str = (description: string) => ({ type: "string", description })
const num = (description: string) => ({ type: "number", description })

/** The protocol as tools: one per command the harness should have. */
export const STUDIO_TOOLS: { def: ToolDef; command: string }[] = [
  { def: { name: "list_artboards", description: "List every frame on the canvas with id, name, kind, position and size.", parameters: obj({}) }, command: "artboard.list" },
  { def: { name: "get_registry", description: "The component registry. Pass `is` for one component's full prop specs; omit it for the names of every component.", parameters: obj({ is: str("registry component name, e.g. DitherTabs") }) }, command: "registry.get" },
  { def: { name: "add_screen", description: "Add a composed screen: rows of registry components (one nesting level). Each cell: { is, props?, slotText?, grow? }. Row: { cells, align?, justify?, gap? }.", parameters: obj({ name: str("frame name"), rows: { type: "array", items: obj({ cells: { type: "array", items: obj({ is: str("registry name") }, ["is"]) } }, ["cells"]) }, gap: num("row gap px"), padding: num("padding px"), frame: obj({ w: num("width"), h: num("height") }) }, ["rows"]) }, command: "screen.add" },
  { def: { name: "add_component", description: "Add one registry component as its own frame.", parameters: obj({ is: str("registry name"), name: str("frame name"), props: obj({}), slotText: str("visible text for slot components"), frame: obj({ w: num("width"), h: num("height") }) }, ["is"]) }, command: "component.add" },
  { def: { name: "add_chart", description: "Add a chart. data: { labels: string[], series: [{ key, label?, color?, values: number[] }] }.", parameters: obj({ chart: { type: "string", enum: ["area", "line", "bar", "pie", "radar"] }, name: str("frame name"), data: obj({ labels: { type: "array", items: { type: "string" } }, series: { type: "array", items: obj({ key: str("series key"), values: { type: "array", items: { type: "number" } } }, ["key", "values"]) } }), frame: obj({ w: num("width"), h: num("height") }) }, ["chart"]) }, command: "chart.add" },
  { def: { name: "add_widget", description: "Add a bespoke widget: avatar, button, gradient or image, with optional model props (button: label, color, variant; avatar: name, grid; gradient: from, to, direction; image: src, alt).", parameters: obj({ widget: { type: "string", enum: ["avatar", "button", "gradient", "image"] }, name: str("frame name"), props: obj({}) }, ["widget"]) }, command: "widget.add" },
  { def: { name: "add_reel", description: "Cut frames into a reel: a frame that plays other frames in order with ordered-dither transitions and exports as one video. Clips are ids or { id, seconds?, transition?: { kind, seconds?, cell?, seed? } } (3s clips coming in over a 0.6s dissolve by default).", parameters: obj({ name: str("frame name"), clips: { type: "array", items: { anyOf: [str("artboard id"), obj({ id: str("artboard id"), seconds: num("clip length in seconds, 0.1–600"), transition: obj({ kind: { type: "string", enum: [...REEL_TRANSITIONS] }, seconds: num("transition length in seconds"), cell: num("dither cell size in px, 1–16"), seed: num("a seeded dither matrix instead of the Bayer order") }) }, ["id"])] } }, frame: obj({ w: num("width"), h: num("height") }) }, ["clips"]) }, command: "reel.add" },
  { def: { name: "update_artboard", description: "Patch a frame: name, x, y, w, h, hidden, locked; `chart` fields (seed, bloom, cell, stackType, series…); `widget` { props } for components, { rows } for screens or { clips } for reels.", parameters: obj({ id: str("artboard id"), patch: obj({}) }, ["id", "patch"]) }, command: "artboard.update" },
  { def: { name: "remove_artboard", description: "Delete a frame (undoable in the Studio).", parameters: obj({ id: str("artboard id") }, ["id"]) }, command: "artboard.remove" },
  { def: { name: "select", description: "Select one frame (id) or several (ids).", parameters: obj({ id: str("artboard id"), ids: { type: "array", items: { type: "string" } } }) }, command: "artboard.select" },
  { def: { name: "evolve", description: "Produce seeded variants of a frame, placed as a row and selected. Use when the user wants options.", parameters: obj({ id: str("parent artboard id; defaults to the selection"), count: num("1–12, default 4"), seed: num("generation seed"), strength: num("0–1 mutation pressure") }) }, command: "evolve" },
  { def: { name: "get_code", description: "The frame as a Vue single-file component.", parameters: obj({ id: str("artboard id") }, ["id"]) }, command: "code.get" },
  { def: { name: "get_document", description: "The whole project document (large; image data is elided). Prefer list_artboards.", parameters: obj({}) }, command: "document.get" },
  { def: { name: "seek_clock", description: "Hold every animation on the canvas at a moment, in seconds, so a screenshot is stable in any browser; call it without seconds to let time run again.", parameters: obj({ seconds: num("the moment in seconds; omit to release") }) }, command: "clock.seek" },
  { def: { name: "export_video", description: "Export a frame as a HyperFrames composition — one HTML file that `npx hyperframes render` turns into a deterministic MP4 (Node 22 + FFmpeg). It is written under the project as video/<name>/index.html; the result carries the render command. A reel renders as one video of its whole cut.", parameters: obj({ id: str("artboard id; defaults to the selection"), seconds: num("length in seconds, 1–600 (default 6; a reel defaults to its length)"), fps: { type: "number", enum: [24, 30, 60] }, theme: { type: "string", enum: ["dark", "light"] } }) }, command: "video.export" },
]

/** Execute a named studio tool with raw arguments. Unknown names come back as errors. */
export function callStudioTool(name: string, args: Record<string, unknown>, run: (command: unknown) => CommandResult = runCommand): CommandResult {
  const tool = STUDIO_TOOLS.find((t) => t.def.name === name)
  return tool ? run({ ...args, type: tool.command }) : { ok: false, error: `unknown tool ${name}` }
}

/** A composition is delivered, not returned: it rides the result to the
 * bridge as `data.files`, which writes it under the harness's project. */
export async function finishStudioTool(name: string, result: CommandResult): Promise<CommandResult> {
  return name === "export_video" && result.ok ? deliverVideo(result.data as VideoExportData, "files") : result
}

/* --------------------------------- events -------------------------------- */

export type Mode = { id: string; name: string; description?: string }
export type AgentCommand = { name: string; description: string; input?: string }

/** What the composer renders: everything the harness says, mapped from ACP. */
export type AgentEvent =
  | { type: "delta"; text: string }
  | { type: "assistant"; text: string }
  | { type: "tool"; name: string; args: Record<string, unknown>; result: CommandResult }
  | { type: "activity"; id: string; title: string; status: string }
  | { type: "plan"; entries: { content: string; status: string }[] }
  | { type: "mode"; current: string; modes: Mode[] }
  | { type: "commands"; commands: AgentCommand[] }
  | { type: "turn"; elapsedMs: number; usage?: Usage }
  | { type: "error"; message: string }
  | { type: "done" }

/* -------------------------------- storage -------------------------------- */

const CONFIG_KEY = "dither-agent-config"

/** Nothing here is a secret: the bridge address, the harness to start, and
 * whether permission prompts are answered with their allow option. */
export type AgentConfig = { bridgeUrl: string; harness: string; command: string; auto: boolean }

export const DEFAULT_BRIDGE_URL = "ws://127.0.0.1:8790"

export function loadAgentConfig(): AgentConfig {
  const fallback: AgentConfig = { bridgeUrl: DEFAULT_BRIDGE_URL, harness: "", command: "", auto: false }
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (!raw) return fallback
    const d = JSON.parse(raw) as Partial<AgentConfig>
    return {
      bridgeUrl: typeof d.bridgeUrl === "string" && d.bridgeUrl ? d.bridgeUrl : DEFAULT_BRIDGE_URL,
      harness: typeof d.harness === "string" ? d.harness : "",
      command: typeof d.command === "string" ? d.command : "",
      auto: d.auto === true,
    }
  } catch {
    return fallback
  }
}

export function saveAgentConfig(c: AgentConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(c))
  } catch {
    // privacy mode: the session keeps it in memory only
  }
}

const SESSION_PREFIX = "dither-agent-session-"
const SESSION_CAP = 160_000

export type AgentSession<E> = { entries: E[]; usage: Usage }

/** A project's conversation survives reloads (capped; oldest entries go first). */
export function loadSession<E>(projectId: string): AgentSession<E> | null {
  try {
    const raw = localStorage.getItem(SESSION_PREFIX + projectId)
    if (!raw) return null
    const d = JSON.parse(raw) as Partial<AgentSession<E>>
    if (!Array.isArray(d.entries)) return null
    return { entries: d.entries, usage: d.usage ?? { input: 0, output: 0 } }
  } catch {
    return null
  }
}

export function saveSession<E>(projectId: string, s: AgentSession<E>): void {
  try {
    if (!s.entries.length) {
      localStorage.removeItem(SESSION_PREFIX + projectId)
      return
    }
    const entries = [...s.entries]
    let json = JSON.stringify({ ...s, entries })
    while (json.length > SESSION_CAP && entries.length) {
      entries.shift()
      json = JSON.stringify({ ...s, entries })
    }
    localStorage.setItem(SESSION_PREFIX + projectId, json)
  } catch {
    // quota / privacy mode — the conversation lives in memory only
  }
}
