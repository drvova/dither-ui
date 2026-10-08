// A bring-your-own-key model client and the agent loop that drives the
// Studio protocol with it. Vanilla: `fetch` only, no SDK, no framework.
//
// Two wire formats cover every provider that matters: Anthropic's Messages
// API (direct browser calls are allowed with the
// `anthropic-dangerous-direct-browser-access` header, which is exactly what
// a user's own key in their own browser is) and the OpenAI chat-completions
// shape, which OpenAI, OpenRouter, Groq, Gemini's compatibility endpoint
// and local servers all speak — `baseUrl` points it anywhere.
//
// Keys never leave the browser except to the provider the user chose;
// nothing is proxied through dither-ui.com. Subscription logins (Claude
// Pro/Max, ChatGPT) are deliberately NOT offered here: Anthropic forbids
// third-party apps from holding Claude.ai credentials, and OpenAI's plan
// access needs a partner registration. Those users drive the Studio from
// their own harness through the protocol instead (see /agent/SKILL.md).
import type { CommandResult } from "./protocol"
import { registrySchema, runCommand } from "./protocol"

export type ProviderKind = "anthropic" | "openai"

export type AgentProvider = {
  kind: ProviderKind
  apiKey: string
  model: string
  /** Override the API origin (OpenAI-compatible servers, proxies). */
  baseUrl?: string
}

export type ToolCall = { id: string; name: string; args: Record<string, unknown> }

export type AgentMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; toolCalls?: ToolCall[] }
  | { role: "tool"; toolCallId: string; name: string; content: string }

export type ToolDef = { name: string; description: string; parameters: Record<string, unknown> }

export type Usage = { input: number; output: number }
export type ChatResult = { text: string; toolCalls: ToolCall[]; usage?: Usage }

export type ChatOptions = {
  system: string
  messages: AgentMessage[]
  tools: ToolDef[]
  signal?: AbortSignal
  fetch?: typeof fetch
}

export const DEFAULT_MODELS: Record<ProviderKind, string> = {
  anthropic: "claude-sonnet-5-5",
  openai: "gpt-5",
}

const origin = (p: AgentProvider) =>
  (p.baseUrl?.trim() || (p.kind === "anthropic" ? "https://api.anthropic.com" : "https://api.openai.com")).replace(/\/+$/, "")

const isPlain = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v)

/* ------------------------------- anthropic ------------------------------- */

type AnthropicBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; tool_use_id: string; content: string }

export function toAnthropic(messages: AgentMessage[]): { role: "user" | "assistant"; content: AnthropicBlock[] }[] {
  const out: { role: "user" | "assistant"; content: AnthropicBlock[] }[] = []
  for (const m of messages) {
    if (m.role === "user") out.push({ role: "user", content: [{ type: "text", text: m.content }] })
    else if (m.role === "assistant") {
      const content: AnthropicBlock[] = []
      if (m.content) content.push({ type: "text", text: m.content })
      for (const c of m.toolCalls ?? []) content.push({ type: "tool_use", id: c.id, name: c.name, input: c.args })
      out.push({ role: "assistant", content })
    } else {
      // Consecutive tool results share one user turn: the API alternates roles.
      const block: AnthropicBlock = { type: "tool_result", tool_use_id: m.toolCallId, content: m.content }
      const last = out[out.length - 1]
      if (last && last.role === "user" && last.content.every((b) => b.type === "tool_result")) last.content.push(block)
      else out.push({ role: "user", content: [block] })
    }
  }
  // A steering message typed while tools ran lands as text after the tool
  // results in the SAME user turn (roles must alternate); any two adjacent
  // user turns merge the same way.
  const merged: typeof out = []
  for (const turn of out) {
    const last = merged[merged.length - 1]
    if (last && last.role === "user" && turn.role === "user") last.content.push(...turn.content)
    else merged.push(turn)
  }
  return merged
}

async function chatAnthropic(p: AgentProvider, o: ChatOptions): Promise<ChatResult> {
  const f = o.fetch ?? fetch
  const res = await f(`${origin(p)}/v1/messages`, {
    method: "POST",
    signal: o.signal,
    headers: {
      "content-type": "application/json",
      "x-api-key": p.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: p.model,
      max_tokens: 4096,
      system: o.system,
      messages: toAnthropic(o.messages),
      tools: o.tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.parameters })),
    }),
  })
  const data = (await res.json().catch(() => ({}))) as {
    content?: AnthropicBlock[]
    usage?: { input_tokens?: number; output_tokens?: number }
    error?: { message?: string }
  }
  if (!res.ok) throw new Error(data.error?.message ?? `${p.kind} ${res.status}`)
  const text = (data.content ?? []).filter((b): b is Extract<AnthropicBlock, { type: "text" }> => b.type === "text").map((b) => b.text).join("\n")
  const toolCalls = (data.content ?? [])
    .filter((b): b is Extract<AnthropicBlock, { type: "tool_use" }> => b.type === "tool_use")
    .map((b) => ({ id: b.id, name: b.name, args: isPlain(b.input) ? b.input : {} }))
  const usage = data.usage ? { input: data.usage.input_tokens ?? 0, output: data.usage.output_tokens ?? 0 } : undefined
  return { text, toolCalls, usage }
}

/* -------------------------------- openai --------------------------------- */

type OpenAIMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[] }
  | { role: "tool"; tool_call_id: string; content: string }

export function toOpenAI(system: string, messages: AgentMessage[]): OpenAIMessage[] {
  const out: OpenAIMessage[] = [{ role: "system", content: system }]
  for (const m of messages) {
    if (m.role === "user") out.push({ role: "user", content: m.content })
    else if (m.role === "assistant")
      out.push({
        role: "assistant",
        content: m.content || null,
        ...(m.toolCalls?.length
          ? { tool_calls: m.toolCalls.map((c) => ({ id: c.id, type: "function" as const, function: { name: c.name, arguments: JSON.stringify(c.args) } })) }
          : {}),
      })
    else out.push({ role: "tool", tool_call_id: m.toolCallId, content: m.content })
  }
  return out
}

async function chatOpenAI(p: AgentProvider, o: ChatOptions): Promise<ChatResult> {
  const f = o.fetch ?? fetch
  const res = await f(`${origin(p)}/v1/chat/completions`, {
    method: "POST",
    signal: o.signal,
    headers: { "content-type": "application/json", authorization: `Bearer ${p.apiKey}` },
    body: JSON.stringify({
      model: p.model,
      messages: toOpenAI(o.system, o.messages),
      tools: o.tools.map((t) => ({ type: "function", function: { name: t.name, description: t.description, parameters: t.parameters } })),
    }),
  })
  const data = (await res.json().catch(() => ({}))) as {
    choices?: { message?: { content?: string | null; tool_calls?: { id: string; function: { name: string; arguments: string } }[] } }[]
    usage?: { prompt_tokens?: number; completion_tokens?: number }
    error?: { message?: string }
  }
  if (!res.ok) throw new Error(data.error?.message ?? `${p.kind} ${res.status}`)
  const msg = data.choices?.[0]?.message
  const toolCalls = (msg?.tool_calls ?? []).map((c) => {
    let args: Record<string, unknown> = {}
    try {
      const parsed = JSON.parse(c.function.arguments || "{}")
      if (isPlain(parsed)) args = parsed
    } catch {
      args = {}
    }
    return { id: c.id, name: c.function.name, args }
  })
  const usage = data.usage ? { input: data.usage.prompt_tokens ?? 0, output: data.usage.completion_tokens ?? 0 } : undefined
  return { text: msg?.content ?? "", toolCalls, usage }
}

/** One model turn. */
export function chat(p: AgentProvider, o: ChatOptions): Promise<ChatResult> {
  return p.kind === "anthropic" ? chatAnthropic(p, o) : chatOpenAI(p, o)
}

/* ------------------------------ studio tools ----------------------------- */

const obj = (properties: Record<string, unknown>, required: string[] = []) => ({ type: "object", properties, required, additionalProperties: true })
const str = (description: string) => ({ type: "string", description })
const num = (description: string) => ({ type: "number", description })

/** The tools the model sees: thin names over the protocol commands. */
export const STUDIO_TOOLS: { def: ToolDef; command: string }[] = [
  { def: { name: "list_artboards", description: "List every frame on the canvas with id, name, kind, position and size.", parameters: obj({}) }, command: "artboard.list" },
  { def: { name: "get_registry", description: "The component registry. Pass `is` for one component's full prop specs; omit it for the names of every component.", parameters: obj({ is: str("registry component name, e.g. DitherTabs") }) }, command: "registry.get" },
  { def: { name: "add_screen", description: "Add a composed screen: rows of registry components (one nesting level). Each cell: { is, props?, slotText?, grow? }. Row: { cells, align?, justify?, gap? }.", parameters: obj({ name: str("frame name"), rows: { type: "array", items: obj({ cells: { type: "array", items: obj({ is: str("registry name") }, ["is"]) } }, ["cells"]) }, gap: num("row gap px"), padding: num("padding px"), frame: obj({ w: num("width"), h: num("height") }) }, ["rows"]) }, command: "screen.add" },
  { def: { name: "add_component", description: "Add one registry component as its own frame.", parameters: obj({ is: str("registry name"), name: str("frame name"), props: obj({}), slotText: str("visible text for slot components"), frame: obj({ w: num("width"), h: num("height") }) }, ["is"]) }, command: "component.add" },
  { def: { name: "add_chart", description: "Add a chart. data: { labels: string[], series: [{ key, label?, color?, values: number[] }] }.", parameters: obj({ chart: { type: "string", enum: ["area", "line", "bar", "pie", "radar"] }, name: str("frame name"), data: obj({ labels: { type: "array", items: { type: "string" } }, series: { type: "array", items: obj({ key: str("series key"), values: { type: "array", items: { type: "number" } } }, ["key", "values"]) } }), frame: obj({ w: num("width"), h: num("height") }) }, ["chart"]) }, command: "chart.add" },
  { def: { name: "add_widget", description: "Add a bespoke widget: avatar, button, gradient or image, with optional model props (button: label, color, variant; avatar: name, grid; gradient: from, to, direction; image: src, alt).", parameters: obj({ widget: { type: "string", enum: ["avatar", "button", "gradient", "image"] }, name: str("frame name"), props: obj({}) }, ["widget"]) }, command: "widget.add" },
  { def: { name: "update_artboard", description: "Patch a frame: name, x, y, w, h, hidden, locked; `chart` fields (seed, bloom, cell, stackType, series…); `widget` { props } for components or { rows } for screens.", parameters: obj({ id: str("artboard id"), patch: obj({}) }, ["id", "patch"]) }, command: "artboard.update" },
  { def: { name: "remove_artboard", description: "Delete a frame.", parameters: obj({ id: str("artboard id") }, ["id"]) }, command: "artboard.remove" },
  { def: { name: "select", description: "Select one frame (id) or several (ids).", parameters: obj({ id: str("artboard id"), ids: { type: "array", items: { type: "string" } } }) }, command: "artboard.select" },
  { def: { name: "evolve", description: "Produce seeded variants of a frame, placed as a row and selected. Use when the user wants options.", parameters: obj({ id: str("parent artboard id; defaults to the selection"), count: num("1–12, default 4"), seed: num("generation seed"), strength: num("0–1 mutation pressure") }) }, command: "evolve" },
  { def: { name: "get_code", description: "The frame as a Vue single-file component.", parameters: obj({ id: str("artboard id") }, ["id"]) }, command: "code.get" },
  { def: { name: "get_document", description: "The whole project document (can be large).", parameters: obj({}) }, command: "document.get" },
]

const RESULT_LIMIT = 12_000

/** The system prompt: the registry's names grouped by family (props come
 * from get_registry on demand — 255 components with specs would be most of
 * the context), the document rules, and the studio's working style. */
export function systemPrompt(): string {
  const reg = registrySchema()
  const groups = new Map<string, string[]>()
  for (const c of reg.components) groups.set(c.group, [...(groups.get(c.group) ?? []), c.is])
  const lines = [...groups].map(([group, names]) => `${group}: ${names.join(", ")}`)
  return [
    "You are the dither-ui Studio agent. You compose UI on an infinite canvas by calling tools; the Studio validates every call, so only registry names and in-spec props land.",
    "Registry components by group (call get_registry with `is` for a component's props):",
    ...lines,
    "",
    "Charts: area, line, bar (rows keyed by `month` + series keys), pie (`name`/`value`), radar (`axis` + series keys). Widgets: avatar, button, gradient, image.",
    "Rules: one idea per frame. Use add_screen for views with several controls (rows of cells, one nesting level); add_component to show one control. Call get_registry with `is` before guessing prop names. When the user wants options, add one good frame then call evolve. Keep names short. After acting, answer in two or three plain sentences naming what you placed; no markdown headers.",
  ].join("\n")
}

export type AgentEvent =
  | { type: "assistant"; text: string }
  | { type: "tool"; name: string; args: Record<string, unknown>; result: CommandResult }
  | { type: "turn"; step: number; elapsedMs: number; usage?: Usage }
  | { type: "steer"; text: string }
  | { type: "error"; message: string }
  | { type: "done"; steps: number }

export type RunOptions = {
  provider: AgentProvider
  goal: string
  history?: AgentMessage[]
  onEvent?: (e: AgentEvent) => void
  run?: (command: unknown) => CommandResult
  /** Steering: messages typed while the agent works. Drained before every
   * model turn and delivered as user text after the tool results, the way
   * pi delivers a mid-run message. */
  pull?: () => string[]
  maxSteps?: number
  signal?: AbortSignal
  fetch?: typeof fetch
}

/** The loop: ask, execute every tool call against the protocol, feed the
 * results back, until the model answers in prose or the step budget ends.
 * Returns the transcript so the panel can continue the conversation. */
export async function runAgent(o: RunOptions): Promise<AgentMessage[]> {
  const run = o.run ?? runCommand
  const messages: AgentMessage[] = [...(o.history ?? []), { role: "user", content: o.goal }]
  const system = systemPrompt()
  const tools = STUDIO_TOOLS.map((t) => t.def)
  const max = o.maxSteps ?? 10
  for (let step = 0; step < max; step++) {
    let turn: ChatResult
    const started = Date.now()
    try {
      turn = await chat(o.provider, { system, messages, tools, signal: o.signal, fetch: o.fetch })
    } catch (e) {
      o.onEvent?.({ type: "error", message: o.signal?.aborted ? "stopped" : e instanceof Error ? e.message : String(e) })
      return messages
    }
    o.onEvent?.({ type: "turn", step: step + 1, elapsedMs: Date.now() - started, usage: turn.usage })
    messages.push({ role: "assistant", content: turn.text, toolCalls: turn.toolCalls })
    if (turn.text) o.onEvent?.({ type: "assistant", text: turn.text })
    if (!turn.toolCalls.length) {
      o.onEvent?.({ type: "done", steps: step + 1 })
      return messages
    }
    for (const call of turn.toolCalls) {
      const tool = STUDIO_TOOLS.find((t) => t.def.name === call.name)
      const result: CommandResult = tool ? run({ ...call.args, type: tool.command }) : { ok: false, error: `unknown tool ${call.name}` }
      o.onEvent?.({ type: "tool", name: call.name, args: call.args, result })
      let text = JSON.stringify(result)
      if (text.length > RESULT_LIMIT) text = `${text.slice(0, RESULT_LIMIT)}… (truncated ${text.length - RESULT_LIMIT} chars)`
      messages.push({ role: "tool", toolCallId: call.id, name: call.name, content: text })
    }
    // Steering typed while the tools ran rides in after their results.
    for (const text of o.pull?.() ?? []) {
      if (!text.trim()) continue
      messages.push({ role: "user", content: text })
      o.onEvent?.({ type: "steer", text })
    }
  }
  o.onEvent?.({ type: "error", message: `stopped after ${max} steps` })
  return messages
}

/* -------------------------------- storage -------------------------------- */

const CONFIG_KEY = "dither-agent-config"

export type AgentConfig = AgentProvider & { remember: boolean }

export function loadAgentConfig(): AgentConfig {
  const fallback: AgentConfig = { kind: "anthropic", apiKey: "", model: DEFAULT_MODELS.anthropic, baseUrl: "", remember: false }
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (!raw) return fallback
    const d = JSON.parse(raw) as Partial<AgentConfig>
    return {
      kind: d.kind === "openai" ? "openai" : "anthropic",
      apiKey: typeof d.apiKey === "string" ? d.apiKey : "",
      model: typeof d.model === "string" && d.model ? d.model : DEFAULT_MODELS[d.kind === "openai" ? "openai" : "anthropic"],
      baseUrl: typeof d.baseUrl === "string" ? d.baseUrl : "",
      remember: true,
    }
  } catch {
    return fallback
  }
}

/** Persist only when the user asked to remember; forgetting clears the key. */
export function saveAgentConfig(c: AgentConfig): void {
  try {
    if (c.remember) localStorage.setItem(CONFIG_KEY, JSON.stringify({ kind: c.kind, apiKey: c.apiKey, model: c.model, baseUrl: c.baseUrl }))
    else localStorage.removeItem(CONFIG_KEY)
  } catch {
    // privacy mode: the session keeps it in memory only
  }
}
