// The Studio's tools as any harness sees them, the events the composer
// renders, and the composer's small persistent state.
//
// The composer is a CONTROL PLANE, not a model client: it never runs a model
// and never holds a credential. The user's own harness — Claude Code, Codex,
// Gemini CLI, oh-my-pi, Goose, OpenCode, any Agent Client Protocol agent —
// runs as the user's own signed-in process behind the local bridge
// (`bridge/dither-bridge.mjs`), and reaches the canvas through an MCP server
// made of the tools below (`acp.ts` is the browser side).
import { editor } from "../../entities/editor"
import { artboardPng } from "@/entities/artboard/picture"
import { normalizeVideoOptions, selfContainedComposition, slugOf, type VideoOptions } from "@/entities/video"
import { readJson, storage, writeJson } from "@/shared/lib/storage"
import { type CommandResult, commandRows, type CommandType, runCommand, type ToolDef } from "./commands"

export type Usage = { input: number; output: number }
export type ContextUse = { used: number; size: number; cost?: { amount: number; currency: string } }

/* ------------------------------ studio tools ----------------------------- */

/** The name the bridge gives the Studio's MCP server in every session, so a
 * harness calls its tools `mcp__dither-studio__<tool>`. The bridge (zero
 * dependencies, its own file) carries a copy, pinned by its spec. */
export const STUDIO_SERVER = "dither-studio"

/** A Studio tool: its definition for the harness, the protocol command it
 * runs, and arguments it always sends (`preset`, under the harness's own);
 * one per row of the command table that has a tool, in the table's order. */
export const STUDIO_TOOLS: { def: ToolDef; command: CommandType; preset?: Record<string, unknown> }[] =
  commandRows().flatMap(([command, { tool }]) =>
    tool ? [{ def: tool.def, command, ...(tool.preset ? { preset: tool.preset } : {}) }] : [],
  )

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
  if (name === "export_video") return deliverVideo(result.data as { id: string; options: VideoOptions })
  if (name === "export_png") return deliverPng(result.data as { id: string; file: string; scale: number })
  return result
}

/** The composition, self-contained, as a file the bridge writes under the
 * harness's project, so the agent renders it there. */
async function deliverVideo(d: { id: string; options: VideoOptions }): Promise<CommandResult> {
  const a = editor.artboards.find((x) => x.id === d.id)
  if (!a) return { ok: false, error: `no frame ${d.id}` }
  try {
    const slug = slugOf(a.name)
    const html = await selfContainedComposition(a, normalizeVideoOptions(d.options))
    return {
      ok: true,
      data: {
        files: [{ path: `video/${slug}/index.html`, content: html }],
        render: `npx hyperframes render video/${slug} -o ${slug}.mp4`,
        note: "Written under the project by the bridge; render it with the HyperFrames CLI (Node 22 + FFmpeg). Simulation backgrounds need --workers 1.",
      },
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
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

export const DRAFT_PREFIX = "dither-agent-draft-"

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
