// The Studio's tools as any harness sees them, the events the composer
// renders, and the composer's small persistent state.
//
// The composer is a CONTROL PLANE, not a model client: it never runs a model
// and never holds a credential. The user's own harness — Claude Code, Codex,
// Gemini CLI, oh-my-pi, Goose, OpenCode, any Agent Client Protocol agent —
// runs as the user's own signed-in process behind the local bridge
// (`bridge/dither-bridge.mjs`), and reaches the canvas through an MCP server
// made of the tools below (`acp.ts` is the browser side).
import { editor } from "@/entities/editor"
import { REEL_TRANSITIONS } from "@/entities/widget"
import { artboardPng } from "@/features/export-image"
import { deliverVideo, type VideoExportData } from "@/features/export-video"
import { STYLINGS } from "@/shared/lib/restyle"
import { readJson, storage, writeJson } from "@/shared/lib/storage"
import type { CommandResult } from "./protocol"
import { PNG_SCALES, runCommand, VIEW_TO } from "./protocol"

export type ToolDef = { name: string; description: string; parameters: Record<string, unknown> }
export type Usage = { input: number; output: number }
export type ContextUse = { used: number; size: number; cost?: { amount: number; currency: string } }

/* ------------------------------ studio tools ----------------------------- */

const obj = (properties: Record<string, unknown>, required: string[] = []) => ({
  type: "object",
  properties,
  required,
  additionalProperties: true,
})
const str = (description: string) => ({ type: "string", description })
const num = (description: string) => ({ type: "number", description })

/** The protocol as tools: one per command the harness should have. */
/** The name the bridge gives the Studio's MCP server in every session, so a
 * harness calls its tools `mcp__dither-studio__<tool>`. The bridge (zero
 * dependencies, its own file) carries a copy, pinned by its spec. */
export const STUDIO_SERVER = "dither-studio"

/** A Studio tool: its definition for the harness, the protocol command it
 * runs, and arguments it always sends (`preset`, under the harness's own). */
export const STUDIO_TOOLS: { def: ToolDef; command: string; preset?: Record<string, unknown> }[] = [
  {
    def: {
      name: "list_artboards",
      description: "List every frame on the canvas with id, name, kind, position and size.",
      parameters: obj({}),
    },
    command: "artboard.list",
  },
  {
    def: {
      name: "get_registry",
      description:
        "The component registry. Pass `is` for one component's full prop specs; omit it for the names of every component.",
      parameters: obj({ is: str("registry component name, e.g. DitherTabs") }),
    },
    command: "registry.get",
    preset: { brief: true },
  },
  {
    def: {
      name: "add_screen",
      description:
        'Add a composed screen: rows of registry components (one nesting level). Each cell: { is, props?, slotText?, value?, grow? }; value is what its v-model holds (a field\'s text: "" shows its placeholder). Row: { cells, align?, justify?, gap? }.',
      parameters: obj(
        {
          name: str("frame name"),
          rows: {
            type: "array",
            items: obj({ cells: { type: "array", items: obj({ is: str("registry name") }, ["is"]) } }, ["cells"]),
          },
          gap: num("row gap px"),
          padding: num("padding px"),
          frame: obj({ w: num("width"), h: num("height") }),
        },
        ["rows"],
      ),
    },
    command: "screen.add",
  },
  {
    def: {
      name: "add_component",
      description: "Add one registry component as its own frame.",
      parameters: obj(
        {
          is: str("registry name"),
          name: str("frame name"),
          props: obj({}),
          slotText: str("visible text for slot components"),
          value: {
            description: "what its v-model holds (a field's text, a switch's state); \"\" shows a field's placeholder",
          },
          frame: obj({ w: num("width"), h: num("height") }),
        },
        ["is"],
      ),
    },
    command: "component.add",
  },
  {
    def: {
      name: "add_chart",
      description: "Add a chart. data: { labels: string[], series: [{ key, label?, color?, values: number[] }] }.",
      parameters: obj(
        {
          chart: { type: "string", enum: ["area", "line", "bar", "pie", "radar"] },
          name: str("frame name"),
          data: obj({
            labels: { type: "array", items: { type: "string" } },
            series: {
              type: "array",
              items: obj({ key: str("series key"), values: { type: "array", items: { type: "number" } } }, [
                "key",
                "values",
              ]),
            },
          }),
          frame: obj({ w: num("width"), h: num("height") }),
        },
        ["chart"],
      ),
    },
    command: "chart.add",
  },
  {
    def: {
      name: "add_widget",
      description:
        "Add a bespoke widget: avatar, button, gradient or image, with optional model props (button: label, color, variant; avatar: name, grid; gradient: from, to, direction; image: src, alt).",
      parameters: obj(
        {
          widget: { type: "string", enum: ["avatar", "button", "gradient", "image"] },
          name: str("frame name"),
          props: obj({}),
        },
        ["widget"],
      ),
    },
    command: "widget.add",
  },
  {
    def: {
      name: "add_reel",
      description:
        "Cut frames into a reel: a frame that plays other frames in order with ordered-dither transitions and exports as one video. Clips are ids or { id, seconds?, transition?, camera?, callouts?, chapter? } (3s clips coming in over a 0.6s dissolve by default). Make it a film: camera keys move each clip (t is 0-1 of the clip; x, y the frame point looked at, 0-1; zoom 1 is the frame fitted; tilt in degrees), callouts point at frame points with a label and a note, a chapter sets the band's line and figure-first spec rows from that clip on, and score: true (or { seed }) synthesizes a soundtrack from the cut that the video export carries.",
      parameters: obj(
        {
          name: str("frame name"),
          clips: {
            type: "array",
            items: {
              anyOf: [
                str("artboard id"),
                obj(
                  {
                    id: str("artboard id"),
                    seconds: num("clip length in seconds, 0.1–600"),
                    transition: obj({
                      kind: { type: "string", enum: [...REEL_TRANSITIONS] },
                      seconds: num("transition length in seconds"),
                      cell: num("dither cell size in px, 1–16"),
                      seed: num("a seeded dither matrix instead of the Bayer order"),
                    }),
                    camera: {
                      type: "array",
                      description: "camera keys, eased between; none holds the frame fitted",
                      items: obj({
                        t: num("when, 0–1 of the clip"),
                        x: num("the frame point looked at, 0–1 across"),
                        y: num("the frame point looked at, 0–1 down"),
                        zoom: num("1 is the frame fitted, up to 8"),
                        tilt: num("lean about the vertical in degrees, ±30"),
                      }),
                    },
                    callouts: {
                      type: "array",
                      description: "spec callouts on leaders, at most 8",
                      items: obj(
                        {
                          x: num("the frame point, 0–1 across"),
                          y: num("the frame point, 0–1 down"),
                          label: str("the label, up to 48 characters"),
                          note: str("a note under it, up to 64 characters"),
                          side: { type: "string", enum: ["left", "right"] },
                          from: num("seconds into the clip it draws in"),
                          to: num("seconds into the clip it fades by"),
                        },
                        ["label"],
                      ),
                    },
                    chapter: obj(
                      {
                        line: str("the band's line from this clip on, up to 80 characters"),
                        spec: {
                          type: "array",
                          description: "up to 4 [figure, words] rows, the figure first",
                          items: { type: "array", items: { type: "string" } },
                        },
                      },
                      ["line"],
                    ),
                  },
                  ["id"],
                ),
              ],
            },
          },
          score: {
            anyOf: [{ type: "boolean" }, obj({ seed: num("the score's seed: another seed, another arrangement") })],
          },
          frame: obj({ w: num("width"), h: num("height") }),
        },
        ["clips"],
      ),
    },
    command: "reel.add",
  },
  {
    def: {
      name: "update_artboard",
      description:
        "Patch a frame: name, x, y, w, h, hidden, locked; `chart` fields (seed, bloom, cell, stackType, series…); what it shows goes under `widget`: { props, value } for a component, { rows } for a screen (every row, each cell with its props and value, as add_screen takes them) or { clips } for a reel. A key it does not know fails the call.",
      parameters: obj({ id: str("artboard id"), patch: obj({ widget: obj({}), chart: obj({}) }) }, ["id", "patch"]),
    },
    command: "artboard.update",
  },
  {
    def: {
      name: "remove_artboard",
      description: "Delete a frame (undoable in the Studio).",
      parameters: obj({ id: str("artboard id") }, ["id"]),
    },
    command: "artboard.remove",
  },
  {
    def: {
      name: "select",
      description: "Select one frame (id) or several (ids).",
      parameters: obj({ id: str("artboard id"), ids: { type: "array", items: { type: "string" } } }),
    },
    command: "artboard.select",
  },
  {
    def: {
      name: "evolve",
      description: "Produce seeded variants of a frame, placed as a row and selected. Use when the user wants options.",
      parameters: obj({
        id: str("parent artboard id; defaults to the selection"),
        count: num("1–12, default 4"),
        seed: num("generation seed"),
        strength: num("0–1 mutation pressure"),
      }),
    },
    command: "evolve",
  },
  {
    def: {
      name: "duplicate",
      description: "Duplicate frames (the selection by default); the copies come back selected.",
      parameters: obj({ id: str("artboard id"), ids: { type: "array", items: { type: "string" } } }),
    },
    command: "artboard.duplicate",
  },
  {
    def: {
      name: "group",
      description: "Group frames (the selection by default) so they move and hide as one layer group.",
      parameters: obj({
        id: str("artboard id"),
        ids: { type: "array", items: { type: "string" } },
        name: str("group name"),
      }),
    },
    command: "group",
  },
  {
    def: {
      name: "ungroup",
      description: "Ungroup a group, named by its id or by one of its frames.",
      parameters: obj({ id: str("group id or a frame of the group") }, ["id"]),
    },
    command: "ungroup",
  },
  {
    def: {
      name: "replay",
      description: "Play every frame's entrance animation again.",
      parameters: obj({}),
    },
    command: "replay",
  },
  {
    def: {
      name: "set_view",
      description:
        "Move the canvas view, zoom and fit: to fits every frame (all), the selection, steps in or out, or 100% (actual); id fits one frame; zoom sets it (1 is 100%).",
      parameters: obj({
        to: { type: "string", enum: [...VIEW_TO] },
        id: str("a frame to fit"),
        zoom: num("0.2–3, 1 is 100%"),
      }),
    },
    command: "view",
  },
  {
    def: {
      name: "inspect",
      description:
        "Inspect a frame as drawn: its controls in Tab order (role, accessible name, states, box) and what the accessibility floor finds: missing names, fields named only by their placeholder (give the field its `label` prop: a visible label tied to it), targets under 24px, text under AA contrast, images without alt. Check a screen before calling it done.",
      parameters: obj({ id: str("artboard id; defaults to the selection") }),
    },
    command: "inspect",
  },
  {
    def: {
      name: "export_png",
      description: "Export a frame as a PNG picture, written under the project as image/<name>.png.",
      parameters: obj({
        id: str("artboard id; defaults to the selection"),
        scale: { type: "number", enum: [...PNG_SCALES], description: "pixel ratio, 2 by default" },
      }),
    },
    command: "image.export",
  },
  {
    def: {
      name: "get_code",
      description:
        "The frame as a Vue single-file component, in the styling system asked for: tailwind (default) keeps the utility classes; css, modules (CSS Modules) or stylex write the same look that way while the kit components keep their own styles.",
      parameters: obj(
        {
          id: str("artboard id"),
          styling: { type: "string", enum: [...STYLINGS], description: "tailwind | css | modules | stylex" },
        },
        ["id"],
      ),
    },
    command: "code.get",
  },
  {
    def: {
      name: "get_document",
      description: "The whole project document (large; image data is elided). Prefer list_artboards.",
      parameters: obj({}),
    },
    command: "document.get",
  },
  {
    def: {
      name: "seek_clock",
      description:
        "Hold every animation on the canvas at a moment, in seconds, so a screenshot is stable in any browser; call it without seconds to let time run again.",
      parameters: obj({ seconds: num("the moment in seconds; omit to release") }),
    },
    command: "clock.seek",
  },
  {
    def: {
      name: "export_video",
      description:
        "Export a frame as a HyperFrames composition — one HTML file that `npx hyperframes render` turns into a deterministic MP4 (Node 22 + FFmpeg). It is written under the project as video/<name>/index.html; the result carries the render command. A reel renders as one video of its whole cut.",
      parameters: obj({
        id: str("artboard id; defaults to the selection"),
        seconds: num("length in seconds, 1–600 (default 6; a reel defaults to its length)"),
        fps: { type: "number", enum: [24, 30, 60] },
        theme: { type: "string", enum: ["dark", "light"] },
      }),
    },
    command: "video.export",
  },
]

/** Execute a named studio tool with raw arguments. Unknown names come back as errors. */
export function callStudioTool(
  name: string,
  args: Record<string, unknown>,
  run: (command: unknown) => CommandResult = runCommand,
): CommandResult {
  const tool = STUDIO_TOOLS.find((t) => t.def.name === name)
  return tool ? run({ ...tool.preset, ...args, type: tool.command }) : { ok: false, error: `unknown tool ${name}` }
}

/** A composition or a picture is delivered, not returned: it rides the
 * result to the bridge as `data.files`, which writes it under the harness's
 * project. */
export async function finishStudioTool(name: string, result: CommandResult): Promise<CommandResult> {
  if (!result.ok) return result
  if (name === "export_video") return deliverVideo(result.data as VideoExportData, "files")
  if (name === "export_png") return deliverPng(result.data as { id: string; file: string; scale: number })
  return result
}

async function deliverPng(d: { id: string; file: string; scale: number }): Promise<CommandResult> {
  const a = editor.artboards.find((x) => x.id === d.id)
  const url = a ? await artboardPng(a, d.scale) : null
  if (!a || !url) return { ok: false, error: `${a?.name ?? d.id} could not be drawn (is it hidden?)` }
  return {
    ok: true,
    data: {
      id: a.id,
      name: a.name,
      files: [{ path: d.file, base64: url.slice(url.indexOf(",") + 1) }],
      size: { w: a.w * d.scale, h: a.h * d.scale },
      note: "Written under the project by the bridge.",
    },
  }
}

/* --------------------------------- events -------------------------------- */

export type Mode = { id: string; name: string; description?: string }
/** The model the harness runs, as its session reports it (an ACP config
 * option of category "model"): the option's id, the current model and the
 * ones the harness offers. The harness owns it; the Studio keeps nothing. */
export type ModelChoice = { configId: string; current: string; options: Mode[] }
/** One of the harness's other choice settings (an ACP config option of a
 * category besides model and mode: effort, thinking, ...), by its name. */
export type Setting = ModelChoice & { name: string }
export type AgentCommand = { name: string; description: string; input?: string }

/** What the composer renders: everything the harness says, mapped from ACP. */
/** What the agent is up to, as the Studio shows it outside the panel: its
 * toolbar key carries it while the panel is closed (`unseen`: a turn ended
 * while you were not looking). */
export type AgentActivity = "idle" | "working" | "waiting" | "unseen"

export type AgentEvent =
  | { type: "delta"; text: string }
  | { type: "thought"; text: string }
  | { type: "assistant"; text: string }
  /** An action the Studio's one tool ran; `built`: a tool the harness built. */
  | { type: "tool"; name: string; args: Record<string, unknown>; result: CommandResult; built?: boolean }
  /** One of the harness's own tool calls; `kind` is ACP's (read, edit,
   * delete, move, search, execute, think, fetch, other) when it says. */
  | { type: "activity"; id: string; title: string; status: string; kind?: string }
  | { type: "plan"; entries: { content: string; status: string }[] }
  | { type: "mode"; current: string; modes: Mode[] }
  | { type: "model"; model: ModelChoice }
  | { type: "settings"; settings: Setting[] }
  | { type: "commands"; commands: AgentCommand[] }
  | { type: "turn"; elapsedMs: number; usage?: Usage }
  /** How full the session's context is, as the harness reports it (ACP
   * `usage_update`): tokens used of the window's size, and what it cost. */
  | { type: "context"; context: ContextUse }
  | { type: "error"; message: string }
  /** The turn ended because the user stopped it. */
  | { type: "stopped" }
  | { type: "done" }

/* -------------------------------- storage -------------------------------- */

const CONFIG_KEY = "dither-agent-config"

/** Nothing here is a secret: the bridge address, the harness to start,
 * whether permission prompts are answered with their allow option, and
 * whether the canvas follows the agent. */
export type AgentConfig = {
  bridgeUrl: string
  harness: string
  command: string
  auto: boolean
  /** The canvas pans to each frame the agent changes. */
  follow: boolean
}

export const DEFAULT_BRIDGE_URL = "ws://127.0.0.1:8790"

export function loadAgentConfig(): AgentConfig {
  const d = (readJson(CONFIG_KEY) ?? {}) as Partial<Record<keyof AgentConfig, unknown>>
  return {
    bridgeUrl: typeof d.bridgeUrl === "string" && d.bridgeUrl ? d.bridgeUrl : DEFAULT_BRIDGE_URL,
    harness: typeof d.harness === "string" ? d.harness : "",
    command: typeof d.command === "string" ? d.command : "",
    auto: d.auto === true,
    follow: d.follow === true,
  }
}

export const saveAgentConfig = (c: AgentConfig): void => writeJson(CONFIG_KEY, c)

const DRAFT_PREFIX = "dither-agent-draft-"

/** A chat's unsent message: its words and what it carries, as stored (the
 * panel parses the attachments, untrusted, where they come back in). */
export type Draft = { text: string; attachments: unknown[] }
/** The most a draft keeps, as JSON: past it, its pictures stay out. */
export const DRAFT_MAX = 1_500_000
const draftKey = (projectId: string, chatId: string) => `${DRAFT_PREFIX}${projectId}/${chatId}`

/** A chat's unsent message, kept while the panel is closed, a reload, or
 * another chat; an empty one is removed. A project's draft from before
 * drafts were per chat comes back in its chat once. */
export function loadDraft(projectId: string, chatId: string): Draft {
  const raw = readJson(draftKey(projectId, chatId)) as { text?: unknown; attachments?: unknown } | null
  if (raw && typeof raw === "object")
    return {
      text: typeof raw.text === "string" ? raw.text : "",
      attachments: Array.isArray(raw.attachments) ? raw.attachments : [],
    }
  const old = storage.get(DRAFT_PREFIX + projectId)
  if (old === null) return { text: "", attachments: [] }
  storage.remove(DRAFT_PREFIX + projectId)
  return { text: old, attachments: [] }
}
export function saveDraft(projectId: string, chatId: string, draft: Draft): void {
  const key = draftKey(projectId, chatId)
  if (!draft.text.trim() && !draft.attachments.length) return storage.remove(key)
  const kept = { text: draft.text.slice(0, 20_000), attachments: draft.attachments }
  writeJson(
    key,
    JSON.stringify(kept).length <= DRAFT_MAX
      ? kept
      : { ...kept, attachments: kept.attachments.filter((a) => (a as { kind?: unknown }).kind !== "image") },
  )
}
