<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { copyText } from "@dither-kit"
import { editor, selectArtboard, selectedArtboard } from "@/entities/editor"
import { evolveSelected, runCommand } from "@/features/agent"
import { type AcpClient, type AcpPermissionRequest, type BridgeHello, connectAcp } from "@/features/agent/acp"
import { type AgentCommand, type AgentConfig, type AgentEvent, loadAgentConfig, loadSession, type Mode, saveAgentConfig, saveSession, type Usage } from "@/features/agent/tools"
import { undo } from "@/features/history"
import { activeProjectId } from "@/features/persistence"

// The agent panel is a CONTROL PLANE for the harness the user already has.
// One local bridge, one pick: Claude Code, Codex, Gemini CLI, oh-my-pi,
// Goose, OpenCode — or any command that speaks the Agent Client Protocol.
// The harness runs as the user's own signed-in process; the panel is its
// client: a transcript (› prompt, ⏺ prose as it streams, ⚙ Studio tool calls
// with their result, ✓ the harness's own activity, ☰ plans, ⚠ permission
// prompts answered inline), a composer with slash commands (ours and the
// harness's own), follow-ups queued while it works, Esc to stop. Nothing
// here is a key or a model setting.
const emit = defineEmits<{ close: [] }>()

/* ------------------------------ configuration ----------------------------- */

const config = ref<AgentConfig>(loadAgentConfig())
watch(config, (c) => saveAgentConfig(c), { deep: true })
const settingsOpen = ref(false)

/* ------------------------------- transcript ------------------------------- */

type Entry =
  | { kind: "user" | "assistant" | "system" | "error" | "followup"; text: string }
  | { kind: "tool"; name: string; summary: string; detail: string; ok: boolean; open: boolean }
  | { kind: "activity"; id: string; title: string; status: string }
  | { kind: "plan"; entries: { content: string; status: string }[] }
  | { kind: "approval"; title: string; options: { id: string; label: string; primary?: boolean }[]; answered: string | null }

const entries = ref<Entry[]>([])
const usage = ref<Usage>({ input: 0, output: 0 })
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
const log = ref<HTMLElement | null>(null)
const scrollLog = () => nextTick(() => log.value?.scrollTo({ top: log.value.scrollHeight }))
const push = (e: Entry) => {
  entries.value.push(e)
  scrollLog()
}
const system = (text: string) => push({ kind: "system", text })

// Per-project memory: the conversation follows the active project.
let loadedFor = ""
function restore(projectId: string) {
  loadedFor = projectId
  const s = loadSession<Entry>(projectId)
  entries.value = s?.entries ?? []
  usage.value = s?.usage ?? { input: 0, output: 0 }
  scrollLog()
}
watch(
  () => activeProjectId.value,
  (id) => {
    if (id && id !== loadedFor) restore(id)
  },
  { immediate: true },
)
watch([entries, usage], () => loadedFor && saveSession(loadedFor, { entries: entries.value.filter((e) => e.kind !== "approval" || e.answered !== null), usage: usage.value }), { deep: true })

/* --------------------------------- status --------------------------------- */

const busy = ref(false)
const started = ref(0)
const now = ref(Date.now())
let clock: ReturnType<typeof setInterval> | undefined
const elapsed = computed(() => (busy.value ? Math.max(0, now.value - started.value) : 0))
const lastTurnMs = ref(0)
const fmtTokens = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k` : String(n))
const fmtMs = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`)

/* -------------------------------- the bridge ------------------------------ */

const acp = ref<AcpClient | null>(null)
const hello = ref<BridgeHello | null>(null)
const connecting = ref(false)
const harnesses = computed(() => hello.value?.harnesses ?? [])
const agent = computed(() => hello.value?.agent ?? null)
/** The harness's own name once it has introduced itself, else the bridge's label for it. */
const agentName = ref("")
const nameIt = () => (agentName.value = acp.value?.agent || agent.value?.name || "")
const modes = ref<Mode[]>([])
const mode = ref("")
const commands = ref<AgentCommand[]>([])
const pickerOpen = ref(false)
const customCommand = ref(config.value.command)

async function connect(url = config.value.bridgeUrl): Promise<AcpClient | null> {
  if (acp.value) return acp.value
  if (connecting.value) return null
  connecting.value = true
  config.value.bridgeUrl = url
  try {
    const client = await connectAcp({
      url,
      onEvent,
      permission: askPermission,
      onHello: (h) => {
        hello.value = h
        if (!h.agent) {
          modes.value = []
          mode.value = ""
          commands.value = []
        }
        nameIt()
      },
      onClose: () => {
        if (acp.value) system("bridge closed")
        acp.value = null
        hello.value = null
      },
    })
    acp.value = client
    nameIt()
    if (client.agent) system(`connected · ${client.agent}`)
    return client
  } catch (e) {
    push({ kind: "error", text: e instanceof Error ? e.message : String(e) })
    return null
  } finally {
    connecting.value = false
  }
}

/** Start a harness by preset id or command line through the bridge. */
async function start(choice: string | { command: string }) {
  pickerOpen.value = false
  const client = acp.value ?? (await connect())
  if (!client) return
  if (typeof choice === "string") {
    config.value.harness = choice
  } else {
    config.value.harness = "custom"
    config.value.command = choice.command
  }
  const label = typeof choice === "string" ? (harnesses.value.find((h) => h.id === choice)?.name ?? choice) : choice.command
  system(`starting ${label}…`)
  try {
    await client.start(choice)
    nameIt()
    system(`connected · ${client.agent}`)
  } catch (e) {
    push({ kind: "error", text: e instanceof Error ? e.message : String(e) })
  }
}

/** The harness to run, from the saved choice: a preset id or the custom command. */
const savedChoice = (): string | { command: string } | null =>
  config.value.harness === "custom" ? (config.value.command ? { command: config.value.command } : null) : config.value.harness || null

/** Make sure a harness is running: the bridge's own, the saved choice, or ask. */
async function ready(): Promise<AcpClient | null> {
  const client = acp.value ?? (await connect())
  if (!client) return null
  if (client.hello?.agent) return client
  const choice = savedChoice()
  if (!choice) {
    pickerOpen.value = true
    system("pick a harness above")
    return null
  }
  await start(choice)
  return client.hello?.agent ? client : null
}

function disconnect() {
  acp.value?.close()
  acp.value = null
  hello.value = null
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
    case "export_video":
      return `${args.seconds ?? 6}s · ${args.fps ?? 30} fps`
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
    if (Array.isArray(d.files)) return d.files.map((f) => (typeof f === "object" && f && "path" in f ? String((f as { path: unknown }).path) : String(f))).join(", ")
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
    case "tool": {
      live.value = null
      // A delivered file rides the result as content; the block shows its path.
      const data = e.result.ok && typeof e.result.data === "object" && e.result.data && Array.isArray((e.result.data as { files?: unknown }).files) ? { ...(e.result.data as object), files: ((e.result.data as { files: unknown[] }).files as { path?: unknown }[]).map((f) => f?.path ?? f) } : e.result.ok ? e.result.data : null
      const detail = `${JSON.stringify(e.args, null, 1)}\n→ ${e.result.ok ? JSON.stringify(data, null, 1).slice(0, 1600) : e.result.error}`
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
    case "mode":
      mode.value = e.current
      if (e.modes.length) modes.value = e.modes
      break
    case "commands":
      commands.value = e.commands
      break
    case "turn":
      lastTurnMs.value = e.elapsedMs
      if (e.usage) usage.value = { input: usage.value.input + e.usage.input, output: usage.value.output + e.usage.output }
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
const followUps = ref<string[]>([])
let controller: AbortController | null = null
const toolsOpen = ref(false)

const rows = computed(() => Math.min(6, Math.max(1, input.value.split("\n").length)))

type Slash = { name: string; args?: string; desc: string; harness?: boolean }
const OURS: Slash[] = [
  { name: "help", desc: "list commands" },
  { name: "harness", args: "<id | command>", desc: "start a harness: claude, codex, gemini, omp… or any ACP command" },
  { name: "connect", args: "[ws url]", desc: "connect the bridge" },
  { name: "new", desc: "fresh session (clears the transcript)" },
  { name: "mode", args: "<id>", desc: "switch the harness's mode" },
  { name: "auto", args: "on | off", desc: "answer permission prompts with their allow option" },
  { name: "evolve", args: "[count]", desc: "seeded variants of the selection" },
  { name: "select", args: "<name>", desc: "select a frame by name" },
  { name: "code", desc: "the selection as a Vue SFC" },
  { name: "copy", desc: "copy the last reply" },
  { name: "session", desc: "harness, tokens, frames" },
  { name: "undo", desc: "undo the last edit" },
  { name: "clear", desc: "clear the transcript" },
  { name: "stop", desc: "interrupt the run" },
  { name: "disconnect", desc: "close the bridge" },
]
/** Ours plus whatever the harness advertises; a harness command is sent to it as text. */
const slashAll = computed<Slash[]>(() => [...OURS, ...commands.value.filter((c) => !OURS.some((o) => o.name === c.name)).map((c) => ({ name: c.name, args: c.input, desc: c.description, harness: true }))])
const slashOpen = computed(() => /^\/[\w-]*$/.test(input.value))
const slashMatches = computed(() => {
  const q = input.value.slice(1).toLowerCase()
  return slashAll.value.filter((c) => c.name.startsWith(q))
})
const slashIndex = ref(0)
watch(slashMatches, () => (slashIndex.value = 0))

async function slash(line: string): Promise<boolean> {
  const [cmd, ...rest] = line.slice(1).trim().split(/\s+/)
  const arg = rest.join(" ").trim()
  switch (cmd) {
    case "help":
      system(slashAll.value.map((c) => `/${c.name}${c.args ? ` ${c.args}` : ""} — ${c.desc}${c.harness ? ` (${agentName.value || "harness"})` : ""}`).join("\n"))
      return true
    case "harness":
      if (!arg) pickerOpen.value = true
      else await start(harnesses.value.some((h) => h.id === arg) ? arg : { command: arg })
      return true
    case "connect":
      await connect(arg || config.value.bridgeUrl)
      if (acp.value && !acp.value.hello?.agent) pickerOpen.value = true
      return true
    case "disconnect":
      disconnect()
      system("disconnected")
      return true
    case "new":
      entries.value = []
      usage.value = { input: 0, output: 0 }
      if (acp.value?.hello?.agent) await acp.value.newSession().catch((e: Error) => push({ kind: "error", text: e.message }))
      return true
    case "mode": {
      const client = acp.value
      if (!client || !modes.value.length) return system("the harness has no modes"), true
      const m = modes.value.find((x) => x.id === arg || x.name.toLowerCase() === arg.toLowerCase())
      if (!m) return system(`modes: ${modes.value.map((x) => x.id).join(", ")}`), true
      await client.setMode(m.id).catch((e: Error) => push({ kind: "error", text: e.message }))
      system(`mode ${m.name}`)
      return true
    }
    case "auto":
      if (arg === "on" || arg === "off") config.value.auto = arg === "on"
      system(`auto-approve ${config.value.auto ? "on" : "off"}`)
      return true
    case "evolve": {
      const gen = evolveSelected({ count: Number(arg) || undefined })
      system(gen.length ? `evolve → ${gen.length} variants` : "select a frame first")
      return true
    }
    case "select": {
      const q = arg.toLowerCase()
      const hit = editor.artboards.find((a) => a.name.toLowerCase().includes(q) || a.id === arg)
      if (hit) selectArtboard(hit.id)
      system(hit ? `selected ${hit.name}` : `no frame matches "${arg}"`)
      return true
    }
    case "code": {
      const a = selectedArtboard.value
      const r = a ? runCommand({ type: "code.get", id: a.id }) : null
      system(r?.ok ? String((r.data as { code: string }).code) : "select a frame first")
      return true
    }
    case "copy": {
      const last = lastEntry(isAssistant)
      if (!last) return system("nothing to copy"), true
      system((await copyText(last.text)) ? "copied" : "clipboard unavailable")
      return true
    }
    case "session":
      system(`${agentName.value || "no harness"}${mode.value ? ` · ${mode.value}` : ""} · ${fmtTokens(usage.value.input)} in / ${fmtTokens(usage.value.output)} out · ${editor.artboards.length} frames${acp.value?.sessionId ? ` · acp ${acp.value.sessionId}` : ""}${hello.value ? ` · cwd ${hello.value.cwd}` : ""}`)
      return true
    case "undo":
      undo()
      system("undone")
      return true
    case "clear":
      entries.value = []
      usage.value = { input: 0, output: 0 }
      return true
    case "stop":
      stop()
      return true
    default:
      // The harness's own command goes to it as text.
      if (commands.value.some((c) => c.name === cmd)) return false
      system(`unknown command /${cmd} — try /help`)
      return true
  }
}

async function send() {
  const text = input.value.trim()
  if (!text) return
  input.value = ""
  cursor = -1
  draft = ""
  if (text.startsWith("/") && (await slash(text))) return
  history.value.push(text)
  // While the harness works, anything typed waits for the task to end.
  if (busy.value) {
    followUps.value.push(text)
    return
  }
  await run(text)
}

async function run(text: string) {
  const client = await ready()
  if (!client) {
    input.value = input.value ? `${text}\n${input.value}` : text
    return
  }
  push({ kind: "user", text })
  busy.value = true
  started.value = Date.now()
  now.value = started.value
  clock = setInterval(() => (now.value = Date.now()), 250)
  controller = new AbortController()
  await client.prompt(text, controller.signal)
  clearInterval(clock)
  busy.value = false
  controller = null
  live.value = null
  // Follow-ups run one at a time, in order.
  const next = followUps.value.shift()
  if (next !== undefined) {
    push({ kind: "followup", text: next })
    await run(next)
  }
}

function stop() {
  if (pendingApproval.value) pendingApproval.value.resolve(null)
  controller?.abort()
  // Stopping returns queued messages to the editor.
  const queued = followUps.value.splice(0)
  if (queued.length) input.value = [input.value, ...queued].filter(Boolean).join("\n")
}

function unqueue() {
  const last = followUps.value.pop()
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
    void send()
    return
  }
  if (e.key === "ArrowUp" && e.altKey) {
    e.preventDefault()
    unqueue()
    return
  }
  if (e.key === "Escape") {
    if (pickerOpen.value) {
      pickerOpen.value = false
      return
    }
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

async function togglePicker() {
  pickerOpen.value = !pickerOpen.value
  if (pickerOpen.value && !acp.value) await connect()
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
      <button type="button" class="model" :aria-expanded="pickerOpen" aria-controls="agent-harness-picker" :title="hello ? `bridge ${config.bridgeUrl} · cwd ${hello.cwd}` : config.bridgeUrl" @click="togglePicker">
        <span class="led" :data-on="String(!!agent)" aria-hidden="true"></span>{{ agentName || (acp ? "pick a harness" : "harness") }}
      </button>
      <button v-if="modes.length" type="button" class="model" :title="modes.find((m) => m.id === mode)?.description || 'mode'" @click="slash(`/mode ${modes[(modes.findIndex((m) => m.id === mode) + 1) % modes.length].id}`)">{{ modes.find((m) => m.id === mode)?.name || mode }}</button>
      <div class="head-actions">
        <button type="button" class="head-btn" :aria-pressed="settingsOpen" aria-label="Bridge settings" title="Bridge settings" @click="settingsOpen = !settingsOpen">⚙</button>
        <button type="button" class="head-btn" aria-label="Close agent" @click="emit('close')">×</button>
      </div>
    </div>

    <div v-if="pickerOpen" id="agent-harness-picker" class="picker" role="group" aria-label="Harness">
      <template v-if="hello">
        <button v-for="h in harnesses" :key="h.id" type="button" class="pick" :aria-pressed="agent?.id === h.id" :title="h.command" @click="start(h.id)">
          <span class="pick-name">{{ h.name }}</span>
          <span class="dim">{{ h.installed ? (h.note ?? "on this path") : "not on the path" }}</span>
        </button>
        <form class="custom" @submit.prevent="customCommand.trim() && start({ command: customCommand.trim() })">
          <input v-model="customCommand" type="text" name="agent-command" class="input" placeholder="any ACP command, e.g. omp --mode acp" autocomplete="off" spellcheck="false" aria-label="Custom harness command" />
          <button type="submit" class="chip is-primary" :disabled="!customCommand.trim()">start</button>
        </form>
        <button v-if="agent" type="button" class="pick stop-pick" @click="acp?.stop()"><span class="pick-name">stop {{ agent.name }}</span></button>
      </template>
      <p v-else class="note">
        {{ connecting ? "connecting the bridge…" : "No bridge." }} Run it next to your harness, which keeps its own login:<br />
        <code>node bridge/dither-bridge.mjs</code><br />then pick Claude Code, Codex, Gemini CLI, oh-my-pi, Goose, OpenCode — or any ACP command.
      </p>
    </div>

    <div v-if="settingsOpen" class="settings">
      <label class="field"><span>bridge</span><input v-model.trim="config.bridgeUrl" name="agent-bridge-url" type="text" class="input" placeholder="ws://127.0.0.1:8790" autocomplete="off" spellcheck="false" /></label>
      <label class="remember"><input v-model="config.auto" type="checkbox" name="agent-auto" class="accent-foreground" />answer permission prompts with their allow option</label>
      <p class="note">The harness runs on your machine behind the bridge; the Studio only sends prompts and answers its tool calls. No key, no model setting lives here.</p>
    </div>

    <div ref="log" class="log" aria-live="polite">
      <div v-if="!entries.length" class="empty">
        <p>Describe a screen, a chart or a control. Your harness composes it from the kit's registry through the Studio's tools; every placement is one undo away.</p>
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
          <span class="mark" aria-hidden="true">{{ e.kind === "user" ? "›" : e.kind === "assistant" ? "⏺" : e.kind === "error" ? "!" : e.kind === "followup" ? "⇢" : "·" }}</span>
          <span class="text">{{ e.text }}<span v-if="live === e" class="caret" aria-hidden="true">▍</span></span>
        </div>
      </template>
      <div v-if="busy && !live" class="entry working" data-kind="system">
        <span class="mark spin" aria-hidden="true">✻</span>
        <span class="text">working… {{ fmtMs(elapsed) }}<span v-if="followUps.length"> · {{ followUps.length }} queued</span> <span class="dim">(esc to stop)</span></span>
      </div>
    </div>

    <div v-if="followUps.length" class="queued">
      <span v-for="(s, i) in followUps" :key="`f${i}`" class="chip" :title="s">⇢ {{ s.length > 32 ? `${s.slice(0, 31)}…` : s }}</span>
    </div>

    <div class="composer">
      <div v-if="slashOpen && slashMatches.length" class="slash" role="listbox" aria-label="Commands">
        <button v-for="(c, i) in slashMatches" :key="c.name" type="button" role="option" :aria-selected="i === slashIndex" class="slash-row" :class="i === slashIndex ? 'is-active' : ''" @click="pickSlash(c)">
          <span class="slash-name">/{{ c.name }}<span v-if="c.args" class="dim"> {{ c.args }}</span></span><span class="dim">{{ c.harness ? `${agentName} · ` : "" }}{{ c.desc }}</span>
        </button>
      </div>
      <div class="line">
        <span class="prompt-mark" aria-hidden="true">›</span>
        <textarea ref="box" v-model="input" name="agent-goal" :rows="rows" class="prompt" :placeholder="busy ? 'queue a follow-up…' : agent ? 'what should the studio build?' : 'pick a harness, then describe a screen'" spellcheck="false" @keydown="onKey" />
        <button v-if="busy" type="button" class="run stop" title="Stop (esc)" @click="stop">stop</button>
        <button v-else type="button" class="run" :disabled="!input.trim()" title="Run (enter)" @click="send()">run</button>
      </div>
    </div>

    <div class="status">
      <span class="dim">{{ agentName || "acp" }}</span>
      <span class="sep" aria-hidden="true">·</span>
      <span>{{ fmtTokens(usage.input) }} in · {{ fmtTokens(usage.output) }} out</span>
      <span v-if="lastTurnMs" class="sep" aria-hidden="true">·</span>
      <span v-if="lastTurnMs" class="dim">last {{ fmtMs(lastTurnMs) }}</span>
      <span v-if="config.auto" class="auto" title="permission prompts answered automatically">auto</span>
      <span class="hint dim">↵ send · ⇧↵ newline · / commands · ↑ history · ⌥↑ unqueue · ^o tools · esc stop</span>
    </div>
  </div>
</template>

<style scoped>
.agent { display: flex; height: 100%; min-height: 0; flex-direction: column; font-family: var(--font-mono); font-size: 12px; }
.head { display: flex; height: 2.25rem; flex-shrink: 0; align-items: center; gap: 6px; border-bottom: 1px solid color-mix(in oklab, var(--color-border) 60%, transparent); padding-inline: 0.75rem 0.5rem; font-size: 11px; color: var(--color-muted-foreground); }
.title { color: var(--color-foreground); }
.model { display: inline-flex; align-items: center; gap: 6px; max-width: 11rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; border-radius: 0.375rem; padding: 2px 6px; font-size: 10.5px; color: var(--color-muted-foreground); background: color-mix(in oklab, var(--color-foreground) 6%, transparent); }
.model:hover { color: var(--color-foreground); }
.led { width: 6px; height: 6px; flex-shrink: 0; border-radius: 1px; background: var(--color-muted-foreground); opacity: 0.5; }
.led[data-on="true"] { background: var(--swatch-green); opacity: 1; }
.head-actions { margin-left: auto; display: flex; gap: 2px; }
.head-btn { display: grid; width: 1.75rem; height: 1.75rem; place-items: center; border-radius: 0.375rem; color: var(--color-muted-foreground); }
.head-btn:hover, .head-btn[aria-pressed="true"] { background: var(--color-card); color: var(--color-foreground); }
.picker, .settings { display: grid; gap: 4px; border-bottom: 1px solid color-mix(in oklab, var(--color-border) 60%, transparent); padding: 8px 12px; }
.pick { display: flex; justify-content: space-between; gap: 8px; border-radius: 0.375rem; padding: 4px 6px; text-align: left; font-size: 11px; color: var(--color-foreground); }
.pick:hover { background: var(--color-card); }
.pick[aria-pressed="true"] .pick-name::before { content: "● "; color: var(--swatch-green); }
.pick-name { white-space: nowrap; }
.stop-pick { color: var(--swatch-orange); }
.custom { display: flex; gap: 6px; margin-top: 4px; }
.custom .input { flex: 1; }
.field { display: grid; grid-template-columns: 4rem minmax(0, 1fr); align-items: center; gap: 8px; font-size: 11px; color: var(--color-muted-foreground); }
.input { height: 1.625rem; min-width: 0; border: 1px solid var(--color-border); border-radius: 0.375rem; background: var(--color-background); padding-inline: 0.5rem; font: inherit; font-size: 11px; color: var(--color-foreground); outline: none; }
.input:focus { border-color: color-mix(in oklab, var(--color-accent) 60%, transparent); }
.remember { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--color-muted-foreground); }
.note { margin: 0; font-size: 10.5px; line-height: 1.5; color: color-mix(in oklab, var(--color-muted-foreground) 80%, transparent); overflow-wrap: anywhere; }
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
.entry[data-kind="followup"] { color: var(--color-muted-foreground); }
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
button.chip:hover:not(:disabled) { color: var(--color-foreground); background: var(--color-card); }
button.chip.is-primary { border-color: var(--color-accent); color: var(--color-foreground); }
button.chip:disabled { opacity: 0.5; }
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
.pick:focus-visible, .model:focus-visible, .head-btn:focus-visible, .chip:focus-visible, .run:focus-visible, .slash-row:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 1px; }
@media (prefers-reduced-motion: reduce) { .run { transition: none; } }
</style>
