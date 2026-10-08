// A bring-your-own-key model client and the agent loop that drives the
// Studio protocol with it. Vanilla: `fetch` only, no SDK, no framework.
//
// Two wire formats cover every provider that matters: Anthropic's Messages
// API (direct browser calls are allowed with the
// `anthropic-dangerous-direct-browser-access` header, which is exactly what
// a user's own key in their own browser is) and the OpenAI chat-completions
// shape, which OpenAI, OpenRouter, Groq, Gemini's compatibility endpoint
// and local servers all speak — `baseUrl` points it anywhere. Both stream
// (SSE) when the server does and fall back to the JSON body when it does
// not, so prose arrives as it is written.
//
// The harness rules, learned from pi / omp / Claude Code and the harness-
// engineering literature:
//   - a mid-run message (steering) lands after the current block of tool
//     results, before the next model turn, never between a call and its
//     result; follow-ups wait for the task to end (the panel owns those);
//   - tool results are shaped at the tool layer (data URIs elided, size
//     capped with a marker that says how to narrow), never cut silently;
//   - the canvas state is re-injected every turn as environment context,
//     the way a coding agent is told its cwd and git status;
//   - destructive calls go through an approval hook the UI can answer;
//   - transient provider failures (429, 5xx, 529, network) retry twice
//     with backoff; everything else surfaces;
//   - compaction trims rather than rewrites: old tool results collapse to
//     short markers, prose stays verbatim, the newest turns are untouched.
//
// Keys never leave the browser except to the provider the user chose;
// nothing is proxied through dither-ui.com. Subscription logins (Claude
// Pro/Max, ChatGPT) are deliberately NOT offered here: Anthropic forbids
// third-party apps from holding Claude.ai credentials, and OpenAI's plan
// access needs a partner registration. Those users drive the Studio from
// their own harness — through the ACP bridge (`acp.ts`) or the protocol.
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
  /** Streamed prose, as it arrives. */
  onDelta?: (text: string) => void
  /** Transient failure about to be retried. */
  onRetry?: (attempt: number, reason: string) => void
}

export const DEFAULT_MODELS: Record<ProviderKind, string> = {
  anthropic: "claude-sonnet-5-5",
  openai: "gpt-5",
}

const origin = (p: AgentProvider) =>
  (p.baseUrl?.trim() || (p.kind === "anthropic" ? "https://api.anthropic.com" : "https://api.openai.com")).replace(/\/+$/, "")

const isPlain = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v)

/* --------------------------------- transport ----------------------------- */

const RETRY_STATUS = new Set([408, 409, 429, 500, 502, 503, 504, 529])

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(t)
        reject(new DOMException("aborted", "AbortError"))
      },
      { once: true },
    )
  })

/** POST with two retries on transient failures (429/5xx/529/network),
 * backing off 1s then 2s; an abort ends it at once. */
async function post(url: string, headers: Record<string, string>, body: unknown, o: ChatOptions): Promise<Response> {
  const f = o.fetch ?? fetch
  for (let attempt = 0; ; attempt++) {
    let res: Response | null = null
    let reason: string
    try {
      res = await f(url, { method: "POST", signal: o.signal, headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) })
      if (res.ok || !RETRY_STATUS.has(res.status)) return res
      reason = `HTTP ${res.status}`
    } catch (e) {
      if (o.signal?.aborted || (e instanceof DOMException && e.name === "AbortError")) throw e
      reason = e instanceof Error ? e.message : String(e)
    }
    if (attempt >= 2) {
      if (res) return res
      throw new Error(reason)
    }
    o.onRetry?.(attempt + 1, reason)
    await sleep(1000 * (attempt + 1), o.signal)
  }
}

/** Server-sent events off a fetch body: `{ event, data }` per message. */
export async function* sse(body: ReadableStream<Uint8Array>): AsyncGenerator<{ event?: string; data: string }> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buf = ""
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    let i: number
    while ((i = buf.indexOf("\n\n")) >= 0) {
      const chunk = buf.slice(0, i)
      buf = buf.slice(i + 2)
      let event: string | undefined
      const data: string[] = []
      for (const line of chunk.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim()
        else if (line.startsWith("data:")) data.push(line.slice(5).trimStart())
      }
      if (data.length) yield { event, data: data.join("\n") }
    }
  }
}

const isStream = (res: Response) =>
  !!res.body && typeof res.headers?.get === "function" && (res.headers.get("content-type") ?? "").includes("text/event-stream")

async function errorOf(res: Response, kind: string): Promise<Error> {
  const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
  return new Error(data.error?.message ?? `${kind} ${res.status}`)
}

const parseArgs = (raw: string): Record<string, unknown> => {
  try {
    const parsed = JSON.parse(raw || "{}")
    return isPlain(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

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
  const res = await post(
    `${origin(p)}/v1/messages`,
    { "x-api-key": p.apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    {
      model: p.model,
      max_tokens: 4096,
      stream: true,
      system: o.system,
      messages: toAnthropic(o.messages),
      tools: o.tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.parameters })),
    },
    o,
  )
  if (!res.ok) throw await errorOf(res, p.kind)
  if (isStream(res)) {
    const blocks = new Map<number, { type: "text"; text: string } | { type: "tool_use"; id: string; name: string; json: string }>()
    const usage: Usage = { input: 0, output: 0 }
    for await (const { data } of sse(res.body!)) {
      const ev = JSON.parse(data) as Record<string, unknown>
      const t = ev.type
      if (t === "message_start") {
        usage.input = (ev.message as { usage?: { input_tokens?: number } })?.usage?.input_tokens ?? 0
      } else if (t === "content_block_start") {
        const cb = ev.content_block as { type: string; id?: string; name?: string }
        const i = ev.index as number
        if (cb.type === "tool_use") blocks.set(i, { type: "tool_use", id: cb.id ?? "", name: cb.name ?? "", json: "" })
        else blocks.set(i, { type: "text", text: "" })
      } else if (t === "content_block_delta") {
        const d = ev.delta as { type: string; text?: string; partial_json?: string }
        const b = blocks.get(ev.index as number)
        if (b?.type === "text" && d.type === "text_delta" && d.text) {
          b.text += d.text
          o.onDelta?.(d.text)
        } else if (b?.type === "tool_use" && d.type === "input_json_delta") b.json += d.partial_json ?? ""
      } else if (t === "message_delta") {
        usage.output = (ev.usage as { output_tokens?: number })?.output_tokens ?? usage.output
      } else if (t === "error") {
        throw new Error((ev.error as { message?: string })?.message ?? "stream error")
      }
    }
    const ordered = [...blocks.entries()].sort((a, b) => a[0] - b[0]).map(([, b]) => b)
    return {
      text: ordered.filter((b): b is { type: "text"; text: string } => b.type === "text").map((b) => b.text).join("\n"),
      toolCalls: ordered
        .filter((b): b is { type: "tool_use"; id: string; name: string; json: string } => b.type === "tool_use")
        .map((b) => ({ id: b.id, name: b.name, args: parseArgs(b.json) })),
      usage,
    }
  }
  const data = (await res.json().catch(() => ({}))) as { content?: AnthropicBlock[]; usage?: { input_tokens?: number; output_tokens?: number } }
  const text = (data.content ?? []).filter((b): b is Extract<AnthropicBlock, { type: "text" }> => b.type === "text").map((b) => b.text).join("\n")
  if (text) o.onDelta?.(text)
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

type OpenAIToolCall = { id: string; function: { name: string; arguments: string } }

async function chatOpenAI(p: AgentProvider, o: ChatOptions): Promise<ChatResult> {
  const res = await post(
    `${origin(p)}/v1/chat/completions`,
    { authorization: `Bearer ${p.apiKey}` },
    {
      model: p.model,
      stream: true,
      stream_options: { include_usage: true },
      messages: toOpenAI(o.system, o.messages),
      tools: o.tools.map((t) => ({ type: "function", function: { name: t.name, description: t.description, parameters: t.parameters } })),
    },
    o,
  )
  if (!res.ok) throw await errorOf(res, p.kind)
  if (isStream(res)) {
    let text = ""
    const calls = new Map<number, OpenAIToolCall>()
    let usage: Usage | undefined
    for await (const { data } of sse(res.body!)) {
      if (data === "[DONE]") break
      const ev = JSON.parse(data) as {
        choices?: { delta?: { content?: string | null; tool_calls?: { index: number; id?: string; function?: { name?: string; arguments?: string } }[] } }[]
        usage?: { prompt_tokens?: number; completion_tokens?: number }
        error?: { message?: string }
      }
      if (ev.error) throw new Error(ev.error.message ?? "stream error")
      const delta = ev.choices?.[0]?.delta
      if (delta?.content) {
        text += delta.content
        o.onDelta?.(delta.content)
      }
      for (const tc of delta?.tool_calls ?? []) {
        const cur = calls.get(tc.index) ?? { id: "", function: { name: "", arguments: "" } }
        if (tc.id) cur.id = tc.id
        if (tc.function?.name) cur.function.name += tc.function.name
        if (tc.function?.arguments) cur.function.arguments += tc.function.arguments
        calls.set(tc.index, cur)
      }
      if (ev.usage) usage = { input: ev.usage.prompt_tokens ?? 0, output: ev.usage.completion_tokens ?? 0 }
    }
    const toolCalls = [...calls.entries()].sort((a, b) => a[0] - b[0]).map(([, c]) => ({ id: c.id, name: c.function.name, args: parseArgs(c.function.arguments) }))
    return { text, toolCalls, usage }
  }
  const data = (await res.json().catch(() => ({}))) as {
    choices?: { message?: { content?: string | null; tool_calls?: OpenAIToolCall[] } }[]
    usage?: { prompt_tokens?: number; completion_tokens?: number }
  }
  const msg = data.choices?.[0]?.message
  if (msg?.content) o.onDelta?.(msg.content)
  const toolCalls = (msg?.tool_calls ?? []).map((c) => ({ id: c.id, name: c.function.name, args: parseArgs(c.function.arguments) }))
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

/** The tools the model sees: thin names over the protocol commands. The
 * same list is what the ACP bridge serves to a harness as an MCP server. */
export const STUDIO_TOOLS: { def: ToolDef; command: string; destructive?: boolean }[] = [
  { def: { name: "list_artboards", description: "List every frame on the canvas with id, name, kind, position and size.", parameters: obj({}) }, command: "artboard.list" },
  { def: { name: "get_registry", description: "The component registry. Pass `is` for one component's full prop specs; omit it for the names of every component.", parameters: obj({ is: str("registry component name, e.g. DitherTabs") }) }, command: "registry.get" },
  { def: { name: "add_screen", description: "Add a composed screen: rows of registry components (one nesting level). Each cell: { is, props?, slotText?, grow? }. Row: { cells, align?, justify?, gap? }.", parameters: obj({ name: str("frame name"), rows: { type: "array", items: obj({ cells: { type: "array", items: obj({ is: str("registry name") }, ["is"]) } }, ["cells"]) }, gap: num("row gap px"), padding: num("padding px"), frame: obj({ w: num("width"), h: num("height") }) }, ["rows"]) }, command: "screen.add" },
  { def: { name: "add_component", description: "Add one registry component as its own frame.", parameters: obj({ is: str("registry name"), name: str("frame name"), props: obj({}), slotText: str("visible text for slot components"), frame: obj({ w: num("width"), h: num("height") }) }, ["is"]) }, command: "component.add" },
  { def: { name: "add_chart", description: "Add a chart. data: { labels: string[], series: [{ key, label?, color?, values: number[] }] }.", parameters: obj({ chart: { type: "string", enum: ["area", "line", "bar", "pie", "radar"] }, name: str("frame name"), data: obj({ labels: { type: "array", items: { type: "string" } }, series: { type: "array", items: obj({ key: str("series key"), values: { type: "array", items: { type: "number" } } }, ["key", "values"]) } }), frame: obj({ w: num("width"), h: num("height") }) }, ["chart"]) }, command: "chart.add" },
  { def: { name: "add_widget", description: "Add a bespoke widget: avatar, button, gradient or image, with optional model props (button: label, color, variant; avatar: name, grid; gradient: from, to, direction; image: src, alt).", parameters: obj({ widget: { type: "string", enum: ["avatar", "button", "gradient", "image"] }, name: str("frame name"), props: obj({}) }, ["widget"]) }, command: "widget.add" },
  { def: { name: "update_artboard", description: "Patch a frame: name, x, y, w, h, hidden, locked; `chart` fields (seed, bloom, cell, stackType, series…); `widget` { props } for components or { rows } for screens.", parameters: obj({ id: str("artboard id"), patch: obj({}) }, ["id", "patch"]) }, command: "artboard.update" },
  { def: { name: "remove_artboard", description: "Delete a frame. Asks the user unless auto-approval is on.", parameters: obj({ id: str("artboard id") }, ["id"]) }, command: "artboard.remove", destructive: true },
  { def: { name: "select", description: "Select one frame (id) or several (ids).", parameters: obj({ id: str("artboard id"), ids: { type: "array", items: { type: "string" } } }) }, command: "artboard.select" },
  { def: { name: "evolve", description: "Produce seeded variants of a frame, placed as a row and selected. Use when the user wants options.", parameters: obj({ id: str("parent artboard id; defaults to the selection"), count: num("1–12, default 4"), seed: num("generation seed"), strength: num("0–1 mutation pressure") }) }, command: "evolve" },
  { def: { name: "get_code", description: "The frame as a Vue single-file component.", parameters: obj({ id: str("artboard id") }, ["id"]) }, command: "code.get" },
  { def: { name: "get_document", description: "The whole project document (large; image data is elided). Prefer list_artboards.", parameters: obj({}) }, command: "document.get" },
]

/** Execute a named studio tool with raw arguments (the bridge's MCP path
 * and the loop share it). Unknown names and denials come back as errors. */
export function callStudioTool(name: string, args: Record<string, unknown>, run: (command: unknown) => CommandResult = runCommand): CommandResult {
  const tool = STUDIO_TOOLS.find((t) => t.def.name === name)
  return tool ? run({ ...args, type: tool.command }) : { ok: false, error: `unknown tool ${name}` }
}

/* ---------------------------- context shaping ---------------------------- */

const RESULT_LIMIT = 12_000

/** Shape a tool result for the model: elide inline image data, cap the
 * size, and say how to narrow — never cut silently. */
export function shapeResult(name: string, result: CommandResult): string {
  let text = JSON.stringify(result).replace(/"data:[^"]{120,}"/g, (m) => `"data:…(${m.length - 2} chars elided)"`)
  if (text.length > RESULT_LIMIT) {
    const hint = name === "get_document" ? "use list_artboards, then get_code or update_artboard per frame" : name === "get_registry" ? "pass `is` for one component" : "ask for less"
    text = `${text.slice(0, RESULT_LIMIT)}… [truncated ${text.length - RESULT_LIMIT} chars — ${hint}]`
  }
  return text
}

/** Rough context size: characters over four. */
export function estimateTokens(system: string, messages: AgentMessage[]): number {
  let chars = system.length
  for (const m of messages) chars += m.content.length + (m.role === "assistant" ? JSON.stringify(m.toolCalls ?? []).length : 0) + 16
  return Math.round(chars / 4)
}

/** Trim, don't rewrite: tool results older than the last `keepTurns` user
 * turns collapse to short markers; prose and tool calls stay verbatim, so
 * repeated compactions never drift. */
export function compact(messages: AgentMessage[], keepTurns = 2): AgentMessage[] {
  const userIdx = messages.map((m, i) => (m.role === "user" ? i : -1)).filter((i) => i >= 0)
  const cut = userIdx.length > keepTurns ? userIdx[userIdx.length - keepTurns] : 0
  return messages.map((m, i) => {
    if (i >= cut || m.role !== "tool" || m.content.length <= 160) return m
    const ok = m.content.startsWith('{"ok":true')
    return { ...m, content: `${m.content.slice(0, 120)}… [compacted: ${ok ? "ok" : "error"}, ${m.content.length} chars]` }
  })
}

/** The system prompt: the registry's names grouped by family (props come
 * from get_registry on demand — 255 components with specs would be most of
 * the context), the document rules, the studio's working style, and the
 * canvas as it stands right now. */
export function systemPrompt(canvas = ""): string {
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
    "Rules: one idea per frame. Use add_screen for views with several controls (rows of cells, one nesting level); add_component to show one control. Call get_registry with `is` before guessing prop names. When the user wants options, add one good frame then call evolve. Keep names short. Removing frames asks the user. After acting, answer in two or three plain sentences naming what you placed; no markdown headers.",
    canvas ? `\nCanvas now: ${canvas}` : "",
  ].join("\n")
}

/** The canvas as one line of environment context. */
export function canvasContext(run: (command: unknown) => CommandResult): string {
  const list = run({ type: "artboard.list" })
  if (!list.ok || !Array.isArray(list.data)) return ""
  const frames = list.data as { id: string; name: string; kind: string; selected: boolean }[]
  if (!frames.length) return "empty canvas"
  const shown = frames.slice(0, 30).map((f) => `${f.name} (${f.kind}${f.selected ? ", selected" : ""}, id ${f.id})`)
  return `${frames.length} frames — ${shown.join(" · ")}${frames.length > 30 ? " · …" : ""}`
}

/* ---------------------------------- loop --------------------------------- */

export type AgentEvent =
  | { type: "delta"; text: string }
  | { type: "assistant"; text: string }
  | { type: "tool"; name: string; args: Record<string, unknown>; result: CommandResult }
  | { type: "activity"; id: string; title: string; status: string }
  | { type: "plan"; entries: { content: string; status: string }[] }
  | { type: "turn"; step: number; elapsedMs: number; usage?: Usage; context: number }
  | { type: "steer"; text: string }
  | { type: "retry"; attempt: number; reason: string }
  | { type: "compact"; before: number; after: number }
  | { type: "error"; message: string }
  | { type: "done"; steps: number }

export type RunOptions = {
  provider: AgentProvider
  goal: string
  history?: AgentMessage[]
  onEvent?: (e: AgentEvent) => void
  run?: (command: unknown) => CommandResult
  /** Steering: messages typed while the agent works. Drained after each
   * turn's tool results and delivered as user text before the next turn,
   * the way pi delivers a mid-run message. */
  pull?: () => string[]
  /** Destructive tool calls wait on this; a denial goes back to the model
   * as a failed result. Default: deny. */
  approve?: (call: ToolCall) => Promise<boolean>
  /** Compact automatically above this many estimated tokens. Default 60k. */
  contextBudget?: number
  maxSteps?: number
  signal?: AbortSignal
  fetch?: typeof fetch
}

/** The loop: ask, execute every tool call against the protocol, feed the
 * results back, until the model answers in prose or the step budget ends.
 * Returns the transcript so the panel can continue the conversation. */
export async function runAgent(o: RunOptions): Promise<AgentMessage[]> {
  const run = o.run ?? runCommand
  let messages: AgentMessage[] = [...(o.history ?? []), { role: "user", content: o.goal }]
  const tools = STUDIO_TOOLS.map((t) => t.def)
  const max = o.maxSteps ?? 10
  const budget = o.contextBudget ?? 60_000
  for (let step = 0; step < max; step++) {
    const system = systemPrompt(canvasContext(run))
    const before = estimateTokens(system, messages)
    if (before > budget) {
      messages = compact(messages)
      o.onEvent?.({ type: "compact", before, after: estimateTokens(system, messages) })
    }
    let turn: ChatResult
    const started = Date.now()
    try {
      turn = await chat(o.provider, {
        system,
        messages,
        tools,
        signal: o.signal,
        fetch: o.fetch,
        onDelta: (text) => o.onEvent?.({ type: "delta", text }),
        onRetry: (attempt, reason) => o.onEvent?.({ type: "retry", attempt, reason }),
      })
    } catch (e) {
      o.onEvent?.({ type: "error", message: o.signal?.aborted ? "stopped" : e instanceof Error ? e.message : String(e) })
      return messages
    }
    messages.push({ role: "assistant", content: turn.text, toolCalls: turn.toolCalls })
    o.onEvent?.({ type: "turn", step: step + 1, elapsedMs: Date.now() - started, usage: turn.usage, context: estimateTokens(system, messages) })
    if (turn.text) o.onEvent?.({ type: "assistant", text: turn.text })
    if (!turn.toolCalls.length) {
      o.onEvent?.({ type: "done", steps: step + 1 })
      return messages
    }
    for (const call of turn.toolCalls) {
      const tool = STUDIO_TOOLS.find((t) => t.def.name === call.name)
      let result: CommandResult
      if (!tool) result = { ok: false, error: `unknown tool ${call.name}` }
      else if (tool.destructive && !(await (o.approve?.(call) ?? Promise.resolve(false)))) result = { ok: false, error: "denied by the user" }
      else result = run({ ...call.args, type: tool.command })
      o.onEvent?.({ type: "tool", name: call.name, args: call.args, result })
      messages.push({ role: "tool", toolCallId: call.id, name: call.name, content: shapeResult(call.name, result) })
      if (o.signal?.aborted) {
        o.onEvent?.({ type: "error", message: "stopped" })
        return messages
      }
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

export type BackendKind = ProviderKind | "acp"

export type AgentConfig = AgentProvider & {
  /** Which backend the composer drives: a key-based provider or the ACP bridge. */
  backend: BackendKind
  /** The local ACP bridge's websocket. */
  bridgeUrl: string
  remember: boolean
  auto: boolean
}

export const DEFAULT_BRIDGE_URL = "ws://127.0.0.1:8790"

export function loadAgentConfig(): AgentConfig {
  const fallback: AgentConfig = { backend: "acp", kind: "anthropic", apiKey: "", model: DEFAULT_MODELS.anthropic, baseUrl: "", bridgeUrl: DEFAULT_BRIDGE_URL, remember: false, auto: false }
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (!raw) return fallback
    const d = JSON.parse(raw) as Partial<AgentConfig>
    const kind: ProviderKind = d.kind === "openai" ? "openai" : "anthropic"
    return {
      backend: d.backend === "acp" || d.backend === "openai" || d.backend === "anthropic" ? d.backend : kind,
      kind,
      apiKey: typeof d.apiKey === "string" ? d.apiKey : "",
      model: typeof d.model === "string" && d.model ? d.model : DEFAULT_MODELS[kind],
      baseUrl: typeof d.baseUrl === "string" ? d.baseUrl : "",
      bridgeUrl: typeof d.bridgeUrl === "string" && d.bridgeUrl ? d.bridgeUrl : DEFAULT_BRIDGE_URL,
      remember: true,
      auto: d.auto === true,
    }
  } catch {
    return fallback
  }
}

/** Persist only when the user asked to remember; forgetting clears the key. */
export function saveAgentConfig(c: AgentConfig): void {
  try {
    if (c.remember) localStorage.setItem(CONFIG_KEY, JSON.stringify({ backend: c.backend, kind: c.kind, apiKey: c.apiKey, model: c.model, baseUrl: c.baseUrl, bridgeUrl: c.bridgeUrl, auto: c.auto }))
    else localStorage.removeItem(CONFIG_KEY)
  } catch {
    // privacy mode: the session keeps it in memory only
  }
}

const SESSION_PREFIX = "dither-agent-session-"
const SESSION_CAP = 160_000

export type AgentSession<E> = { entries: E[]; transcript: AgentMessage[]; usage: Usage }

/** A project's conversation survives reloads (capped; oldest entries go first). */
export function loadSession<E>(projectId: string): AgentSession<E> | null {
  try {
    const raw = localStorage.getItem(SESSION_PREFIX + projectId)
    if (!raw) return null
    const d = JSON.parse(raw) as Partial<AgentSession<E>>
    if (!Array.isArray(d.entries) || !Array.isArray(d.transcript)) return null
    return { entries: d.entries, transcript: d.transcript, usage: d.usage ?? { input: 0, output: 0 } }
  } catch {
    return null
  }
}

export function saveSession<E>(projectId: string, s: AgentSession<E>): void {
  try {
    if (!s.entries.length && !s.transcript.length) {
      localStorage.removeItem(SESSION_PREFIX + projectId)
      return
    }
    const entries = [...s.entries]
    let transcript = s.transcript
    let json = JSON.stringify({ ...s, entries, transcript })
    while (json.length > SESSION_CAP && (entries.length || transcript.length)) {
      if (entries.length) entries.shift()
      transcript = compact(transcript, 1)
      if (!entries.length) transcript = transcript.slice(-6)
      json = JSON.stringify({ ...s, entries, transcript })
    }
    localStorage.setItem(SESSION_PREFIX + projectId, json)
  } catch {
    // quota / privacy mode — the conversation stays in memory for this tab
  }
}
