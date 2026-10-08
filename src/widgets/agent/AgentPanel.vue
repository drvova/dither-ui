<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { DitherFocusScope } from "@dither-kit"
import { editor, selectArtboard, selectedArtboard } from "@/entities/editor"
import { evolveSelected, runCommand } from "@/features/agent"
import { type AcpClient, type AcpPermissionRequest, connectAcp } from "@/features/agent/acp"
import {
  type AgentConfig,
  type AgentEvent,
  type AgentMessage,
  type BackendKind,
  compact,
  DEFAULT_MODELS,
  estimateTokens,
  loadAgentConfig,
  loadSession,
  runAgent,
  saveAgentConfig,
  saveSession,
  systemPrompt,
  type ToolCall,
  type Usage,
} from "@/features/agent/llm"
import { undo } from "@/features/history"
import { activeProjectId } from "@/features/persistence"

// The agent panel is a COMPOSER in the sense pi, omp and Claude Code users
// know, and a control plane for whichever harness the user already has:
//   - backend "acp": the local bridge spawns the user's own Claude Code /
//     Codex / Gemini / pi process (its own login, no key here) and the
//     composer is its ACP client;
//   - backend "anthropic" / "openai": a bring-your-own-key loop in the page.
// Both render through one transcript: › prompt, ⏺ prose streamed as it
// arrives, ↳ steer, ⇢ follow-up, one collapsible block per tool call with
// args and the Studio's answer, ⚠ approvals the user answers inline, ☰
// plans, and a ✻ working line. Slash commands, ↑/↓ history, Esc stops,
// Ctrl+O folds tool output, Ctrl+L opens settings. The conversation
// persists per project.
const emit = defineEmits<{ close: [] }>()

/* ------------------------------ configuration ----------------------------- */

const config = ref<AgentConfig>(loadAgentConfig())
const keyed = computed(() => config.value.backend !== "acp")
const configured = computed(() => (keyed.value ? config.value.apiKey.trim().length > 0 && config.value.model.trim().length > 0 : config.value.bridgeUrl.trim().length > 0))
const settingsOpen = ref(!configured.value)
watch(
  () => config.value.backend,
  (b, prev) => {
    if (b === "acp") return
    config.value.kind = b
    if (!config.value.model || config.value.model === DEFAULT_MODELS[prev === "acp" ? b : prev]) config.value.model = DEFAULT_MODELS[b]
  },
)
watch(config, (c) => saveAgentConfig(c), { deep: true })
const maskedKey = computed(() => (config.value.apiKey ? `…${config.value.apiKey.slice(-4)}` : "no key"))

/* -------------------------------- transcript ------------------------------ */

type Entry =
  | { kind: "user" | "assistant" | "system" | "error" | "steer" | "followup"; text: string }
  | { kind: "tool"; name: string; summary: string; detail: string; ok: boolean; open: boolean }
  | { kind: "activity"; id: string; title: string; status: string }
  | { kind: "plan"; entries: { content: string; status: string }[] }
  | { kind: "approval"; title: string; options: { id: string; label: string; primary?: boolean }[]; answered: string | null }

const entries = ref<Entry[]>([])
const transcript = ref<AgentMessage[]>([])
type TextEntry = Extract<Entry, { text: string }>
type PlanEntry = Extract<Entry, { kind: "plan" }>
/** Newest entry matching a guard (lib is ES2020: no findLast). */
function lastEntry<T extends Entry>(is: (e: Entry) => e is T): T | undefined {
  for (let i = entries.value.length - 1; i >= 0; i--) {
    const e = entries.value[i]
    if (is(e)) return e
  }
  return undefined
}
const isPlan = (e: Entry): e is PlanEntry => e.kind === "plan"
const isAssistant = (e: Entry): e is TextEntry => e.kind === "assistant"
const session = ref<Usage>({ input: 0, output: 0 })
const log = ref<HTMLElement | null>(null)
const scrollLog = () => nextTick(() => log.value?.scrollTo({ top: log.value.scrollHeight }))
const push = (e: Entry) => {
  entries.value.push(e)
  scrollLog()
}
const system = (text: string) => push({ kind: "system", text })

// Per-project memory: the conversation survives reloads and follows the
// active project; switching projects swaps it.
let loadedFor = ""
function restore(projectId: string) {
  loadedFor = projectId
  const s = loadSession<Entry>(projectId)
  entries.value = s?.entries ?? []
  transcript.value = s?.transcript ?? []
  session.value = s?.usage ?? { input: 0, output: 0 }
  scrollLog()
}
watch(
  () => activeProjectId.value,
  (id) => {
    if (id && id !== loadedFor) restore(id)
  },
  { immediate: true },
)
watch([entries, transcript, session], () => loadedFor && saveSession(loadedFor, { entries: entries.value.filter((e) => e.kind !== "approval" || e.answered !== null), transcript: transcript.value, usage: session.value }), { deep: true })

/* --------------------------------- status --------------------------------- */

const busy = ref(false)
const step = ref(0)
const started = ref(0)
const now = ref(Date.now())
let clock: ReturnType<typeof setInterval> | undefined
const elapsed = computed(() => (busy.value ? Math.max(0, now.value - started.value) : 0))
const lastTurnMs = ref(0)
const context = computed(() => estimateTokens(systemPrompt(), transcript.value))
const fmtTokens = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k` : String(n))
const fmtMs = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`)
const retrying = ref("")

/* ------------------------------- ACP bridge ------------------------------- */

const acp = ref<AcpClient | null>(null)
const agentName = computed(() => (config.value.backend === "acp" ? (acp.value?.agent ?? "bridge") : config.value.model || "model"))

async function connect(url = config.value.bridgeUrl): Promise<AcpClient | null> {
  if (acp.value) return acp.value
  config.value.bridgeUrl = url
  system(`connecting ${url}…`)
  try {
    const client = await connectAcp({
      url,
      onEvent,
      permission: askPermission,
      onClose: () => {
        if (acp.value) system("bridge closed")
        acp.value = null
      },
    })
    acp.value = client
    system(`connected · ${client.agent}`)
    return client
  } catch (e) {
    push({ kind: "error", text: e instanceof Error ? e.message : String(e) })
    return null
  }
}

function disconnect() {
  acp.value?.close()
  acp.value = null
}

/* ---------------------------- tool call rendering -------------------------- */

const short = (v: unknown, n = 36): string => {
  const s = typeof v === "string" ? v : Array.isArray(v) ? `[${v.length}]` : typeof v === "object" && v ? "{…}" : String(v)
  return s.length > n ? `${s.slice(0, n - 1)}…` : s
}

function describeArgs(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case "add_screen":
      return `${short(args.name ?? "screen")} · ${Array.isArray(args.rows) ? args.rows.length : 0} rows`
    case "add_component":
      return `${short(args.is)}${args.name ? ` · ${short(args.name)}` : ""}`
    case "add_chart": {
      const d = args.data as { labels?: unknown[] } | undefined
      return `${short(args.chart)}${args.name ? ` · ${short(args.name)}` : ""}${d?.labels ? ` · ${d.labels.length} points` : ""}`
    }
    case "add_widget":
      return short(args.widget)
    case "update_artboard":
      return `${short(args.id, 14)} · ${Object.keys((args.patch as object) ?? {}).join(", ") || "patch"}`
    case "evolve":
      return `×${args.count ?? 4}${args.strength != null ? ` · strength ${args.strength}` : ""}`
    case "get_registry":
      return args.is ? short(args.is) : "all"
    default:
      return Object.entries(args)
        .filter(([, v]) => v != null)
        .map(([k, v]) => `${k}=${short(v, 20)}`)
        .join(" ")
  }
}

function describeResult(result: { ok: true; data: unknown } | { ok: false; error: string }): string {
  if (!result.ok) return result.error
  const d = result.data as Record<string, unknown> | unknown[] | null
  if (Array.isArray(d)) return `${d.length} ${d.length === 1 ? "item" : "items"}`
  if (d && typeof d === "object") {
    if (typeof d.code === "string") return `${d.code.split("\n").length} lines`
    if (typeof d.name === "string") return `${d.name}${typeof d.kind === "string" ? ` · ${d.kind}` : ""}${Array.isArray(d.dropped) && d.dropped.length ? ` · dropped ${d.dropped.join(", ")}` : ""}`
    if (Array.isArray(d.components)) return `${d.components.length} components`
    if (Array.isArray(d.artboards)) return `${d.artboards.length} frames`
    if (typeof d.removed === "string") return "removed"
  }
  return "ok"
}

const live = ref<{ kind: "assistant"; text: string } | null>(null)

function onEvent(e: AgentEvent) {
  switch (e.type) {
    case "delta":
      if (!live.value) {
        live.value = { kind: "assistant", text: "" }
        entries.value.push(live.value)
      }
      live.value.text += e.text
      scrollLog()
      break
    case "assistant":
      if (live.value) live.value.text = e.text
      else push({ kind: "assistant", text: e.text })
      live.value = null
      break
    case "steer":
      push({ kind: "steer", text: e.text })
      break
    case "tool": {
      live.value = null
      const detail = `${JSON.stringify(e.args, null, 1)}\n→ ${e.result.ok ? JSON.stringify(e.result.data, null, 1).slice(0, 1600) : e.result.error}`
      push({ kind: "tool", name: e.name, ok: e.result.ok, summary: `${describeArgs(e.name, e.args)}  ⎿ ${describeResult(e.result)}`, detail, open: !e.result.ok })
      break
    }
    case "activity": {
      live.value = null
      const existing = entries.value.find((x): x is Extract<Entry, { kind: "activity" }> => x.kind === "activity" && x.id === e.id)
      if (existing) {
        existing.status = e.status
        if (e.title) existing.title = e.title
      } else push({ kind: "activity", id: e.id, title: e.title || e.id, status: e.status })
      break
    }
    case "plan": {
      const existing = lastEntry(isPlan)
      if (existing) existing.entries = e.entries
      else push({ kind: "plan", entries: e.entries })
      break
    }
    case "turn":
      step.value = e.step
      lastTurnMs.value = e.elapsedMs
      retrying.value = ""
      if (e.usage) session.value = { input: session.value.input + e.usage.input, output: session.value.output + e.usage.output }
      break
    case "retry":
      retrying.value = `retry ${e.attempt} · ${e.reason}`
      break
    case "compact":
      system(`compacted context ~${fmtTokens(e.before)} → ~${fmtTokens(e.after)} tokens`)
      break
    case "error":
      live.value = null
      push({ kind: "error", text: e.message })
      break
    case "done":
      live.value = null
      break
  }
}

/* -------------------------------- approvals ------------------------------- */

const pendingApproval = ref<{ resolve: (id: string | null) => void } | null>(null)

function ask(title: string, options: { id: string; label: string; primary?: boolean }[]): Promise<string | null> {
  const entry: Extract<Entry, { kind: "approval" }> = { kind: "approval", title, options, answered: null }
  push(entry)
  return new Promise((resolve) => {
    pendingApproval.value = {
      resolve: (id) => {
        entry.answered = id ?? "cancelled"
        pendingApproval.value = null
        resolve(id)
      },
    }
  })
}

const approveTool = async (call: ToolCall): Promise<boolean> => {
  if (config.value.auto) return true
  const answer = await ask(`${call.name} ${describeArgs(call.name, call.args)}`, [
    { id: "allow", label: "allow", primary: true },
    { id: "deny", label: "deny" },
  ])
  return answer === "allow"
}

const askPermission = async (req: AcpPermissionRequest): Promise<string | null> => {
  const options = req.options.map((o) => ({ id: o.optionId, label: o.name, primary: o.kind.startsWith("allow") }))
  if (config.value.auto) return options.find((o) => o.primary)?.id ?? options[0]?.id ?? null
  return ask(req.title, options.length ? options : [{ id: "allow", label: "allow", primary: true }, { id: "reject", label: "reject" }])
}

function answer(entry: Extract<Entry, { kind: "approval" }>, id: string | null) {
  if (entry.answered !== null) return
  pendingApproval.value?.resolve(id)
}

/* -------------------------------- composer -------------------------------- */

const input = ref("")
const box = ref<HTMLTextAreaElement | null>(null)
const history = ref<string[]>([])
let cursor = -1
let draft = ""
const steering = ref<string[]>([])
const followUps = ref<string[]>([])
let controller: AbortController | null = null
const toolsOpen = ref(false)

const rows = computed(() => Math.min(6, Math.max(1, input.value.split("\n").length)))

type Slash = { name: string; args?: string; desc: string }
const SLASH: Slash[] = [
  { name: "help", desc: "list commands" },
  { name: "backend", args: "acp | anthropic | openai", desc: "harness bridge or a key-based provider" },
  { name: "connect", args: "[ws url]", desc: "connect the ACP bridge" },
  { name: "disconnect", desc: "close the bridge" },
  { name: "new", desc: "fresh session (clears the transcript)" },
  { name: "model", args: "<name>", desc: "switch the model (key backends)" },
  { name: "base", args: "<url>", desc: "OpenAI-compatible base URL" },
  { name: "key", args: "<api key>", desc: "set the API key (not echoed)" },
  { name: "remember", args: "on | off", desc: "keep settings on this device" },
  { name: "auto", args: "on | off", desc: "approve destructive calls and permissions automatically" },
  { name: "settings", desc: "toggle the settings form" },
  { name: "evolve", args: "[count]", desc: "seeded variants of the selection" },
  { name: "select", args: "<name>", desc: "select a frame by name" },
  { name: "code", desc: "the selection as a Vue SFC" },
  { name: "copy", desc: "copy the last reply" },
  { name: "compact", desc: "trim old tool results from the context" },
  { name: "session", desc: "tokens, context, frames" },
  { name: "undo", desc: "undo the last edit" },
  { name: "clear", desc: "clear the transcript" },
  { name: "stop", desc: "interrupt the run" },
]
const slashOpen = computed(() => /^\/[\w-]*$/.test(input.value))
const slashMatches = computed(() => {
  const q = input.value.slice(1).toLowerCase()
  return SLASH.filter((c) => c.name.startsWith(q))
})
const slashIndex = ref(0)
watch(slashMatches, () => (slashIndex.value = 0))

async function slash(line: string) {
  const [cmd, ...rest] = line.slice(1).trim().split(/\s+/)
  const arg = rest.join(" ").trim()
  switch (cmd) {
    case "help":
      system(SLASH.map((c) => `/${c.name}${c.args ? ` ${c.args}` : ""} — ${c.desc}`).join("\n"))
      return
    case "backend":
      if (arg === "acp" || arg === "anthropic" || arg === "openai") config.value.backend = arg as BackendKind
      system(`backend ${config.value.backend}`)
      return
    case "connect":
      config.value.backend = "acp"
      await connect(arg || config.value.bridgeUrl)
      return
    case "disconnect":
      disconnect()
      system("disconnected")
      return
    case "new":
      entries.value = []
      transcript.value = []
      session.value = { input: 0, output: 0 }
      if (acp.value) await acp.value.newSession().catch((e: Error) => push({ kind: "error", text: e.message }))
      return
    case "model":
      if (arg) config.value.model = arg
      system(`model ${config.value.model}`)
      return
    case "base":
      config.value.baseUrl = arg
      system(arg ? `base ${arg}` : "base reset to the provider default")
      return
    case "key":
      if (arg) config.value.apiKey = arg
      system(`key ${maskedKey.value}`)
      return
    case "remember":
      if (arg === "on" || arg === "off") config.value.remember = arg === "on"
      system(`remember ${config.value.remember ? "on" : "off"}`)
      return
    case "auto":
      if (arg === "on" || arg === "off") config.value.auto = arg === "on"
      system(`auto-approve ${config.value.auto ? "on" : "off"}`)
      return
    case "settings":
      settingsOpen.value = !settingsOpen.value
      return
    case "evolve": {
      const gen = evolveSelected({ count: Number(arg) || undefined })
      system(gen.length ? `evolve → ${gen.length} variants` : "select a frame first")
      return
    }
    case "select": {
      const q = arg.toLowerCase()
      const hit = editor.artboards.find((a) => a.name.toLowerCase().includes(q) || a.id === arg)
      if (hit) selectArtboard(hit.id)
      system(hit ? `selected ${hit.name}` : `no frame matches "${arg}"`)
      return
    }
    case "code": {
      const a = selectedArtboard.value
      const r = a ? runCommand({ type: "code.get", id: a.id }) : null
      system(r?.ok ? String((r.data as { code: string }).code) : "select a frame first")
      return
    }
    case "copy": {
      const last = lastEntry(isAssistant)
      if (!last) return system("nothing to copy")
      await navigator.clipboard.writeText(last.text).then(() => system("copied"), () => system("clipboard unavailable"))
      return
    }
    case "compact": {
      const before = context.value
      transcript.value = compact(transcript.value)
      system(`compacted ~${fmtTokens(before)} → ~${fmtTokens(context.value)} tokens`)
      return
    }
    case "session":
      system(`${agentName.value} · ${transcript.value.length} messages · ${fmtTokens(session.value.input)} in / ${fmtTokens(session.value.output)} out${keyed.value ? ` · ctx ~${fmtTokens(context.value)}` : ""} · ${editor.artboards.length} frames${acp.value?.sessionId ? ` · acp ${acp.value.sessionId}` : ""}`)
      return
    case "undo":
      undo()
      system("undone")
      return
    case "clear":
      entries.value = []
      transcript.value = []
      session.value = { input: 0, output: 0 }
      return
    case "stop":
      stop()
      return
    default:
      system(`unknown command /${cmd} — try /help`)
  }
}

async function send(followUp = false) {
  const text = input.value.trim()
  if (!text) return
  input.value = ""
  cursor = -1
  draft = ""
  if (text.startsWith("/")) return slash(text)
  if (!configured.value) {
    system(keyed.value ? "add an API key first: /key <key>, or the ⚙ form" : "set the bridge url first: /connect ws://127.0.0.1:8790")
    return
  }
  history.value.push(text)
  if (busy.value) {
    // Enter steers the running turn (ACP has no steering: it queues);
    // Alt+Enter always queues a follow-up for after the task.
    if (followUp || !keyed.value) followUps.value.push(text)
    else steering.value.push(text)
    return
  }
  await run(text)
}

async function run(text: string) {
  push({ kind: "user", text })
  busy.value = true
  step.value = 0
  retrying.value = ""
  started.value = Date.now()
  now.value = started.value
  clock = setInterval(() => (now.value = Date.now()), 250)
  controller = new AbortController()
  if (keyed.value) {
    const { backend: _b, bridgeUrl: _u, remember: _r, auto: _a, ...provider } = config.value
    void _b
    void _u
    void _r
    void _a
    transcript.value = await runAgent({
      provider,
      goal: text,
      history: transcript.value,
      onEvent,
      approve: approveTool,
      signal: controller.signal,
      pull: () => steering.value.splice(0),
    })
  } else {
    const client = acp.value ?? (await connect())
    if (client) {
      transcript.value.push({ role: "user", content: text })
      const r = await client.prompt(text, controller.signal)
      if (r.text) transcript.value.push({ role: "assistant", content: r.text })
    }
  }
  clearInterval(clock)
  busy.value = false
  controller = null
  live.value = null
  // Follow-ups run one at a time, in order; leftover steers join them.
  const next = [...steering.value.splice(0), ...followUps.value.splice(0)]
  if (next.length) {
    for (const t of next.slice(1)) followUps.value.push(t)
    push({ kind: "followup", text: next[0] })
    await run(next[0])
  }
}

function stop() {
  if (pendingApproval.value) pendingApproval.value.resolve(null)
  controller?.abort()
  // Aborting returns queued messages to the editor (pi's rule).
  const queued = [...steering.value.splice(0), ...followUps.value.splice(0)]
  if (queued.length) input.value = [input.value, ...queued].filter(Boolean).join("\n")
}

function unqueue() {
  const last = followUps.value.pop() ?? steering.value.pop()
  if (last) input.value = input.value ? `${last}\n${input.value}` : last
}

function onKey(e: KeyboardEvent) {
  if (slashOpen.value && slashMatches.value.length) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      slashIndex.value = (slashIndex.value + 1) % slashMatches.value.length
      return
    }
    if (e.key === "ArrowUp") {
      e.preventDefault()
      slashIndex.value = (slashIndex.value - 1 + slashMatches.value.length) % slashMatches.value.length
      return
    }
    if (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey && `/${slashMatches.value[slashIndex.value].name}` !== input.value)) {
      e.preventDefault()
      const c = slashMatches.value[slashIndex.value]
      input.value = `/${c.name}${c.args ? " " : ""}`
      return
    }
  }
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault()
    void send(e.altKey)
    return
  }
  if (e.key === "ArrowUp" && e.altKey) {
    e.preventDefault()
    unqueue()
    return
  }
  if (e.key === "Escape") {
    if (busy.value || pendingApproval.value) {
      e.preventDefault()
      stop()
    }
    return
  }
  if (e.ctrlKey && (e.key === "o" || e.key === "O")) {
    e.preventDefault()
    toolsOpen.value = !toolsOpen.value
    for (const x of entries.value) if (x.kind === "tool") x.open = toolsOpen.value
    return
  }
  if (e.ctrlKey && (e.key === "l" || e.key === "L")) {
    e.preventDefault()
    settingsOpen.value = !settingsOpen.value
    return
  }
  const single = !input.value.includes("\n")
  if (e.key === "ArrowUp" && single && history.value.length) {
    e.preventDefault()
    if (cursor === -1) draft = input.value
    cursor = cursor === -1 ? history.value.length - 1 : Math.max(0, cursor - 1)
    input.value = history.value[cursor]
  } else if (e.key === "ArrowDown" && single && cursor !== -1) {
    e.preventDefault()
    cursor = cursor + 1 >= history.value.length ? -1 : cursor + 1
    input.value = cursor === -1 ? draft : history.value[cursor]
  }
}

function pickSlash(c: Slash) {
  input.value = `/${c.name}${c.args ? " " : ""}`
  box.value?.focus()
}

onMounted(() => box.value?.focus())
onBeforeUnmount(() => {
  controller?.abort()
  clearInterval(clock)
  disconnect()
})
</script>

<template>
  <div class="agent">
    <div class="head">
      <span class="title">Agent</span>
      <button type="button" class="model" :title="keyed ? `${config.kind} · ${maskedKey}` : config.bridgeUrl" @click="settingsOpen = !settingsOpen">
        <span v-if="!keyed" class="led" :data-on="String(!!acp)" aria-hidden="true"></span>{{ agentName }}
      </button>
      <div class="head-actions">
        <button type="button" class="head-btn" :aria-pressed="settingsOpen" aria-label="Settings" title="Settings (ctrl+l)" @click="settingsOpen = !settingsOpen">⚙</button>
        <button type="button" class="head-btn" aria-label="Close agent" @click="emit('close')">×</button>
      </div>
    </div>

    <DitherFocusScope v-if="settingsOpen" :trapped="false" :restore-focus="false" class="settings">
      <label class="field"><span>backend</span>
        <select v-model="config.backend" name="agent-backend" class="input">
          <option value="acp">acp bridge · your own claude code / codex / gemini / pi</option>
          <option value="anthropic">anthropic · api key</option>
          <option value="openai">openai-compatible · api key</option>
        </select>
      </label>
      <template v-if="keyed">
        <label class="field"><span>model</span><input v-model.trim="config.model" name="agent-model" type="text" class="input" :placeholder="DEFAULT_MODELS[config.kind]" autocomplete="off" spellcheck="false" /></label>
        <label v-if="config.kind === 'openai'" class="field"><span>base url</span><input v-model.trim="config.baseUrl" name="agent-base-url" type="url" class="input" placeholder="https://api.openai.com" autocomplete="off" spellcheck="false" /></label>
        <label class="field"><span>api key</span><input v-model.trim="config.apiKey" name="agent-key" type="password" class="input" autocomplete="off" placeholder="sk-…" /></label>
      </template>
      <template v-else>
        <label class="field"><span>bridge</span><input v-model.trim="config.bridgeUrl" name="agent-bridge-url" type="text" class="input" placeholder="ws://127.0.0.1:8790" autocomplete="off" spellcheck="false" /></label>
        <p class="note">Run the bridge next to your harness, which keeps its own login:<br /><code>node bridge/dither-bridge.mjs --agent "npx @zed-industries/claude-code-acp"</code><br />Any ACP agent works: codex-acp, <code>gemini --experimental-acp</code>, pi, omp.</p>
      </template>
      <label class="remember"><input v-model="config.remember" type="checkbox" name="agent-remember" class="accent-foreground" />remember on this device</label>
      <label class="remember"><input v-model="config.auto" type="checkbox" name="agent-auto" class="accent-foreground" />auto-approve deletes and permissions</label>
      <p v-if="keyed" class="note">Calls go straight from this browser to the provider; nothing passes through dither-ui.com. Subscription logins are not offered — use the acp bridge for Claude Code, Codex, pi or omp, or give them <a href="/agent/SKILL.md" target="_blank" rel="noreferrer">the Studio skill</a>.</p>
    </DitherFocusScope>

    <div ref="log" class="log" aria-live="polite">
      <div v-if="!entries.length" class="empty">
        <p>Describe a screen, a chart or a control. The agent composes it from the kit's registry through the Studio protocol; every placement is one undo away.</p>
        <p class="dim">try: a sign-in screen with email, password and a primary button<br />/evolve on a selected frame · /help for commands</p>
      </div>
      <template v-for="(e, i) in entries" :key="i">
        <details v-if="e.kind === 'tool'" class="tool" :open="e.open" :data-ok="String(e.ok)">
          <summary><span class="mark" aria-hidden="true">{{ e.ok ? "⚙" : "×" }}</span><span class="name">{{ e.name }}</span><span class="sum">{{ e.summary }}</span></summary>
          <pre class="detail">{{ e.detail }}</pre>
        </details>
        <div v-else-if="e.kind === 'activity'" class="entry" data-kind="activity" :data-status="e.status">
          <span class="mark" aria-hidden="true">{{ e.status === "completed" ? "✓" : e.status === "failed" ? "×" : "⚙" }}</span>
          <span class="text">{{ e.title }}<span class="dim"> · {{ e.status.replace("_", " ") }}</span></span>
        </div>
        <div v-else-if="e.kind === 'plan'" class="entry" data-kind="plan">
          <span class="mark" aria-hidden="true">☰</span>
          <ul class="plan">
            <li v-for="(p, j) in e.entries" :key="j" :data-status="p.status"><span class="mark" aria-hidden="true">{{ p.status === "completed" ? "✓" : p.status === "in_progress" ? "›" : "·" }}</span>{{ p.content }}</li>
          </ul>
        </div>
        <div v-else-if="e.kind === 'approval'" class="entry approval" data-kind="approval" :data-answered="String(e.answered !== null)">
          <span class="mark" aria-hidden="true">⚠</span>
          <span class="text">
            {{ e.title }}
            <span v-if="e.answered === null" class="choices">
              <button v-for="o in e.options" :key="o.id" type="button" class="chip" :class="o.primary ? 'is-primary' : ''" @click="answer(e, o.id)">{{ o.label }}</button>
            </span>
            <span v-else class="dim"> · {{ e.answered }}</span>
          </span>
        </div>
        <div v-else class="entry" :data-kind="e.kind">
          <span class="mark" aria-hidden="true">{{ e.kind === "user" ? "›" : e.kind === "assistant" ? "⏺" : e.kind === "error" ? "!" : e.kind === "steer" ? "↳" : e.kind === "followup" ? "⇢" : "·" }}</span>
          <span class="text">{{ e.text }}<span v-if="live === e" class="caret" aria-hidden="true">▍</span></span>
        </div>
      </template>
      <div v-if="busy && !live" class="entry working" data-kind="system">
        <span class="mark spin" aria-hidden="true">✻</span>
        <span class="text">{{ retrying || "working…" }} {{ fmtMs(elapsed) }}{{ step ? ` · turn ${step}` : "" }}<span v-if="steering.length"> · {{ steering.length }} steering</span><span v-if="followUps.length"> · {{ followUps.length }} queued</span> <span class="dim">(esc to stop)</span></span>
      </div>
    </div>

    <div v-if="steering.length || followUps.length" class="queued">
      <span v-for="(s, i) in steering" :key="`s${i}`" class="chip" :title="s">↳ {{ s.length > 32 ? `${s.slice(0, 31)}…` : s }}</span>
      <span v-for="(s, i) in followUps" :key="`f${i}`" class="chip" :title="s">⇢ {{ s.length > 32 ? `${s.slice(0, 31)}…` : s }}</span>
    </div>

    <div class="composer">
      <div v-if="slashOpen && slashMatches.length" class="slash" role="listbox" aria-label="Commands">
        <button v-for="(c, i) in slashMatches" :key="c.name" type="button" role="option" :aria-selected="i === slashIndex" class="slash-row" :class="i === slashIndex ? 'is-active' : ''" @click="pickSlash(c)">
          <span class="slash-name">/{{ c.name }}<span v-if="c.args" class="dim"> {{ c.args }}</span></span><span class="dim">{{ c.desc }}</span>
        </button>
      </div>
      <div class="line">
        <span class="prompt-mark" aria-hidden="true">›</span>
        <textarea ref="box" v-model="input" name="agent-goal" :rows="rows" class="prompt" :placeholder="busy ? (keyed ? 'steer the agent…' : 'queue a follow-up…') : configured ? 'what should the studio build?' : keyed ? 'set a key: /key <api key>' : 'run the bridge, then /connect'" spellcheck="false" @keydown="onKey" />
        <button v-if="busy" type="button" class="run stop" title="Stop (esc)" @click="stop">stop</button>
        <button v-else type="button" class="run" :disabled="!input.trim()" title="Run (enter)" @click="send()">run</button>
      </div>
    </div>

    <div class="status">
      <span class="dim">{{ keyed ? config.kind : "acp" }}</span>
      <span class="sep" aria-hidden="true">·</span>
      <span>{{ fmtTokens(session.input) }} in · {{ fmtTokens(session.output) }} out</span>
      <span v-if="keyed" class="sep" aria-hidden="true">·</span>
      <span v-if="keyed" class="dim">ctx ~{{ fmtTokens(context) }}</span>
      <span v-if="lastTurnMs" class="sep" aria-hidden="true">·</span>
      <span v-if="lastTurnMs" class="dim">last {{ fmtMs(lastTurnMs) }}</span>
      <span v-if="config.auto" class="auto" title="auto-approve on">auto</span>
      <span class="hint dim">↵ send · ⌥↵ queue · ⇧↵ newline · / commands · ↑ history · ^o tools · esc stop</span>
    </div>
  </div>
</template>

<style scoped>
.agent { display: flex; height: 100%; min-height: 0; flex-direction: column; font-family: var(--font-mono); font-size: 12px; }
.head { display: flex; height: 2.25rem; flex-shrink: 0; align-items: center; gap: 8px; border-bottom: 1px solid color-mix(in oklab, var(--color-border) 60%, transparent); padding-inline: 0.75rem 0.5rem; font-size: 11px; color: var(--color-muted-foreground); }
.title { color: var(--color-foreground); }
.model { display: inline-flex; align-items: center; gap: 6px; max-width: 11rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; border-radius: 0.375rem; padding: 2px 6px; font-size: 10.5px; color: var(--color-muted-foreground); background: color-mix(in oklab, var(--color-foreground) 6%, transparent); }
.model:hover { color: var(--color-foreground); }
.led { width: 6px; height: 6px; border-radius: 1px; background: var(--color-muted-foreground); opacity: 0.5; }
.led[data-on="true"] { background: var(--swatch-green); opacity: 1; }
.head-actions { margin-left: auto; display: flex; gap: 2px; }
.head-btn { display: grid; width: 1.75rem; height: 1.75rem; place-items: center; border-radius: 0.375rem; color: var(--color-muted-foreground); }
.head-btn:hover, .head-btn[aria-pressed="true"] { background: var(--color-card); color: var(--color-foreground); }
.settings { display: grid; gap: 6px; border-bottom: 1px solid color-mix(in oklab, var(--color-border) 60%, transparent); padding: 8px 12px; }
.field { display: grid; grid-template-columns: 4rem minmax(0, 1fr); align-items: center; gap: 8px; font-size: 11px; color: var(--color-muted-foreground); }
.input { height: 1.625rem; min-width: 0; border: 1px solid var(--color-border); border-radius: 0.375rem; background: var(--color-background); padding-inline: 0.5rem; font: inherit; font-size: 11px; color: var(--color-foreground); outline: none; }
.input:focus { border-color: color-mix(in oklab, var(--color-accent) 60%, transparent); }
.remember { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--color-muted-foreground); }
.note { margin: 0; font-size: 10.5px; line-height: 1.5; color: color-mix(in oklab, var(--color-muted-foreground) 80%, transparent); overflow-wrap: anywhere; }
.note a { color: var(--color-foreground); text-decoration: underline; text-underline-offset: 2px; }
.note code { color: var(--color-foreground); }
.log { min-height: 0; flex: 1; overflow-y: auto; padding: 10px 12px; display: grid; align-content: start; gap: 5px; }
.empty { display: grid; gap: 8px; padding-top: 6px; line-height: 1.5; color: var(--color-muted-foreground); }
.empty p { margin: 0; }
.dim { color: color-mix(in oklab, var(--color-muted-foreground) 72%, transparent); }
.entry { display: grid; grid-template-columns: 1.1rem minmax(0, 1fr); gap: 4px; line-height: 1.45; }
.entry[data-kind="user"], .entry[data-kind="assistant"] { color: var(--color-foreground); }
.entry[data-kind="assistant"] .mark { color: var(--swatch-blue); }
.entry[data-kind="system"], .entry[data-kind="activity"] { color: var(--color-muted-foreground); font-size: 11px; }
.entry[data-kind="activity"][data-status="failed"] .mark { color: var(--swatch-orange); }
.entry[data-kind="steer"], .entry[data-kind="followup"] { color: var(--color-muted-foreground); }
.entry[data-kind="error"] { color: var(--swatch-red); }
.entry[data-kind="plan"] { font-size: 11px; color: var(--color-muted-foreground); }
.plan { margin: 0; padding: 0; list-style: none; display: grid; gap: 2px; }
.plan li { display: grid; grid-template-columns: 1rem minmax(0, 1fr); gap: 2px; }
.plan li[data-status="completed"] { color: color-mix(in oklab, var(--color-muted-foreground) 65%, transparent); }
.plan li[data-status="in_progress"] { color: var(--color-foreground); }
.approval .mark { color: var(--swatch-orange); }
.approval[data-answered="false"] { color: var(--color-foreground); }
.choices { display: inline-flex; gap: 4px; margin-left: 6px; vertical-align: middle; }
.mark { color: var(--color-muted-foreground); text-align: center; }
.text { white-space: pre-wrap; overflow-wrap: anywhere; }
.caret { color: var(--swatch-blue); }
.working .mark { color: var(--swatch-orange); }
@media (prefers-reduced-motion: no-preference) {
  .spin, .caret { animation: pulse 1.2s ease-in-out infinite; }
  @keyframes pulse { 50% { opacity: 0.3; } }
}
.tool { font-size: 11px; color: var(--color-muted-foreground); }
.tool summary { display: grid; grid-template-columns: 1.1rem auto minmax(0, 1fr); gap: 4px; cursor: pointer; list-style: none; line-height: 1.45; border-radius: 0.25rem; }
.tool summary::-webkit-details-marker { display: none; }
.tool summary:hover { color: var(--color-foreground); }
.tool .name { color: var(--color-foreground); }
.tool .sum { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tool[open] .sum { white-space: normal; }
.tool[data-ok="false"] .mark, .tool[data-ok="false"] .sum { color: var(--swatch-orange); }
.detail { margin: 4px 0 4px 1.1rem; max-height: 14rem; overflow: auto; border-left: 1px solid color-mix(in oklab, var(--color-border) 80%, transparent); padding-left: 8px; font-size: 10.5px; line-height: 1.4; white-space: pre-wrap; overflow-wrap: anywhere; color: var(--color-muted-foreground); }
.queued { display: flex; flex-wrap: wrap; gap: 4px; padding: 0 12px 6px; }
.chip { max-width: 100%; min-height: 1.25rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; border: 1px dashed var(--color-border); border-radius: 0.375rem; padding: 1px 6px; font-size: 10.5px; color: var(--color-muted-foreground); }
button.chip { border-style: solid; cursor: pointer; }
button.chip:hover { color: var(--color-foreground); background: var(--color-card); }
button.chip.is-primary { border-color: var(--color-accent); color: var(--color-foreground); }
.composer { position: relative; flex-shrink: 0; border-top: 1px solid color-mix(in oklab, var(--color-border) 60%, transparent); padding: 8px 10px 6px; }
.slash { position: absolute; left: 10px; right: 10px; bottom: calc(100% - 2px); display: grid; max-height: 16rem; overflow-y: auto; border: 1px solid var(--color-border); border-radius: 0.375rem; background: var(--color-card); padding: 4px; box-shadow: 0 8px 24px rgb(0 0 0 / 0.32); }
.slash-row { display: flex; justify-content: space-between; gap: 10px; border-radius: 0.25rem; padding: 4px 6px; text-align: left; font-size: 11px; color: var(--color-foreground); }
.slash-row.is-active, .slash-row:hover { background: var(--color-background); }
.slash-name { white-space: nowrap; }
.line { display: grid; grid-template-columns: 1rem minmax(0, 1fr) auto; align-items: end; gap: 6px; }
.prompt-mark { padding-bottom: 6px; color: var(--swatch-orange); }
.prompt { resize: none; border: 0; background: transparent; padding: 5px 0; font: inherit; font-size: 12px; line-height: 1.45; color: var(--color-foreground); outline: none; }
.prompt::placeholder { color: color-mix(in oklab, var(--color-muted-foreground) 70%, transparent); }
.run { min-height: 1.5rem; border-radius: 0.375rem; padding-inline: 0.6rem; font-size: 11px; color: var(--color-accent-foreground); background: var(--color-accent); transition: opacity 140ms ease; }
.run:disabled { opacity: 0.35; }
.run.stop { background: color-mix(in oklab, var(--swatch-red) 80%, black); }
.status { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; border-top: 1px solid color-mix(in oklab, var(--color-border) 60%, transparent); padding: 5px 12px; font-size: 10px; color: var(--color-muted-foreground); }
.sep { opacity: 0.5; }
.auto { margin-left: auto; color: var(--swatch-orange); }
.hint { flex-basis: 100%; }
</style>
