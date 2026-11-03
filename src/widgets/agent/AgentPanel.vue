<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowReactive, toRaw, watch } from "vue"
import { copyText, DitherIcon, type IconName } from "@dither-kit"
import { editor, selectArtboard, selectedArtboard } from "@/entities/editor"
import { evolveSelected, runCommand } from "@/features/agent"
import { type AcpClient, type AcpPermissionRequest, type BridgeHello, connectAcp } from "@/features/agent/acp"
import {
  type AgentCommand,
  type AgentConfig,
  type AgentEvent,
  loadAgentConfig,
  loadSession,
  type Mode,
  saveAgentConfig,
  saveSession,
  type Usage,
} from "@/features/agent/tools"
import { checkpoint, restoreCheckpoint, undo } from "@/features/history"
import { activeProjectId } from "@/features/persistence"
import ToolMark from "@/shared/ui/ToolMark.vue"
import { isMark } from "@/shared/ui/marks"
import Prose from "./Prose.vue"
import { type Changed, toolStep } from "./steps"

// The agent panel is a CONTROL PLANE for the harness the user already has.
// One local bridge, one pick: Claude Code, Codex, Gemini CLI, oh-my-pi,
// Goose, OpenCode, or any command that speaks the Agent Client Protocol.
// The harness runs as the user's own signed-in process; the panel is its
// client, set as a composer: a thread (your messages as cards, each with
// the checkpoint the canvas held before it; the reply as prose; each Studio
// tool call a step in words; the harness's own tool calls; permission
// prompts answered inline), and over the input the turn's to-dos, the
// queue, the run and the changes it made to keep or undo. The input card
// carries the frames you hand it as context, the harness and its mode, and
// the send key. Nothing here is a key or a model setting.
const emit = defineEmits<{ close: [] }>()
// Suggestions for an empty thread.
const STARTERS = [
  "A sign-in screen with email, password and a primary button",
  "A revenue dashboard: an area chart, three stat cards and a table",
  "Evolve the selected frame into four variants",
] as const

/* ------------------------------ configuration ----------------------------- */

const config = ref<AgentConfig>(loadAgentConfig())
watch(config, (c) => saveAgentConfig(c), { deep: true })
const menuOpen = ref(false)

/* ------------------------------- transcript ------------------------------- */

type Entry =
  | { kind: "user" | "followup"; text: string; turn?: number; context?: Changed[] }
  | { kind: "assistant" | "system" | "error"; text: string }
  | {
      kind: "tool"
      name: string
      title?: string
      icon?: IconName
      summary: string
      detail: string
      ok: boolean
      open: boolean
      turn?: number
      changed?: Changed[]
      mutates?: boolean
    }
  | { kind: "activity"; id: string; title: string; status: string }
  | { kind: "plan"; entries: { content: string; status: string }[] }
  | {
      kind: "approval"
      title: string
      options: { id: string; label: string; primary?: boolean }[]
      answered: string | null
    }

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

/* ------------------------------ turns and checkpoints ---------------------- */

/** Each prompt is a turn; the canvas as it stood before it is the turn's
 * checkpoint (kept in memory: a document per turn is too large to save). */
const turn = ref(0)
const checkpoints = new Map<number, string>()
/** Turns whose changes were kept (or undone): their bar is gone. */
const settled = ref(new Set<number>())

// Per-project memory: the conversation follows the active project.
let loadedFor = ""
function restore(projectId: string) {
  loadedFor = projectId
  const s = loadSession<Entry>(projectId)
  entries.value = s?.entries ?? []
  usage.value = s?.usage ?? { input: 0, output: 0 }
  turn.value = Math.max(0, ...entries.value.map((e) => ("turn" in e && e.turn) || 0))
  checkpoints.clear()
  settled.value = new Set(Array.from({ length: turn.value + 1 }, (_, i) => i))
  scrollLog()
}

/** The chat's title: its first message, else a new chat. */
const title = computed(() => {
  const first = entries.value.find((e) => e.kind === "user")
  return first && "text" in first ? first.text.split("\n")[0] : "New chat"
})

/** What the latest turn changed on the canvas: its editing steps and the
 * frames they touched (by id, the last name kept), until kept or undone. */
const changes = computed(() => {
  if (!turn.value || settled.value.has(turn.value)) return null
  const steps = entries.value.filter(
    (e): e is Extract<Entry, { kind: "tool" }> => e.kind === "tool" && e.turn === turn.value && e.ok && !!e.mutates,
  )
  if (!steps.length) return null
  const frames = new Map<string, Changed>()
  for (const s of steps) for (const f of s.changed ?? []) frames.set(f.id, f)
  return { turn: turn.value, steps: steps.length, frames: [...frames.values()] }
})
const changesOpen = ref(false)

function keep() {
  if (changes.value) settled.value = new Set(settled.value).add(changes.value.turn)
}
/** The canvas back to where the turn found it (one undoable step). */
function undoTurn() {
  const c = changes.value
  const cp = c && checkpoints.get(c.turn)
  if (!c || !cp) return
  restoreCheckpoint(cp)
  settled.value = new Set(settled.value).add(c.turn)
  system("Put the canvas back to before that message")
}
/** Any earlier turn: the canvas as it stood before its message. */
function restoreTo(at: number) {
  const cp = checkpoints.get(at)
  if (!cp || busy.value) return
  restoreCheckpoint(cp)
  settled.value = new Set([...settled.value, ...Array.from({ length: turn.value - at + 1 }, (_, i) => at + i)])
  system("Restored the checkpoint")
}
const canRestore = (e: Entry) => "turn" in e && !!e.turn && checkpoints.has(e.turn) && !busy.value

/** The turn's plan, shown over the input as its to-dos. */
const todos = computed(() => {
  let i = entries.value.length - 1
  while (i >= 0 && entries.value[i].kind !== "user" && entries.value[i].kind !== "followup") i--
  for (let j = entries.value.length - 1; j > i; j--) {
    const e = entries.value[j]
    if (e.kind === "plan") return e.entries
  }
  return null
})
const todosOpen = ref(true)
const todosDone = computed(() => todos.value?.filter((t) => t.status === "completed").length ?? 0)
watch(
  () => activeProjectId.value,
  (id) => {
    if (id && id !== loadedFor) restore(id)
  },
  { immediate: true },
)
watch(
  [entries, usage],
  () =>
    loadedFor &&
    saveSession(loadedFor, {
      entries: entries.value.filter((e) => e.kind !== "approval" || e.answered !== null),
      usage: usage.value,
    }),
  { deep: true },
)

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
    if (client.agent) system(`connected to ${client.agent}`)
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
  const label =
    typeof choice === "string" ? (harnesses.value.find((h) => h.id === choice)?.name ?? choice) : choice.command
  system(`starting ${label}…`)
  try {
    await client.start(choice)
    nameIt()
    system(`connected to ${client.agent}`)
  } catch (e) {
    push({ kind: "error", text: e instanceof Error ? e.message : String(e) })
  }
}

/** The harness to run, from the saved choice: a preset id or the custom command. */
const savedChoice = (): string | { command: string } | null =>
  config.value.harness === "custom"
    ? config.value.command
      ? { command: config.value.command }
      : null
    : config.value.harness || null

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
  const s =
    typeof v === "string" ? v : Array.isArray(v) ? `[${v.length}]` : typeof v === "object" && v ? "{…}" : String(v)
  return s.length > n ? `${s.slice(0, n - 1)}…` : s
}

function describeArgs(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case "add_screen":
      return `${short(args.name ?? "screen")}, ${Array.isArray(args.rows) ? args.rows.length : 0} rows`
    case "add_component":
      return `${short(args.is)}${args.name ? `, ${short(args.name)}` : ""}`
    case "add_chart": {
      const d = args.data as { labels?: unknown[] } | undefined
      return `${short(args.chart)}${args.name ? `, ${short(args.name)}` : ""}${d?.labels ? `, ${d.labels.length} points` : ""}`
    }
    case "add_widget":
      return short(args.widget)
    case "update_artboard":
      return `${short(args.id, 14)}: ${Object.keys((args.patch as object) ?? {}).join(", ") || "patch"}`
    case "evolve":
      return `×${args.count ?? 4}${args.strength != null ? `, strength ${args.strength}` : ""}`
    case "get_registry":
      return args.is ? short(args.is) : "all"
    case "export_video":
      return `${args.seconds ?? 6}s at ${args.fps ?? 30} fps`
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
    if (typeof d.name === "string")
      return `${d.name}${typeof d.kind === "string" ? ` (${d.kind})` : ""}${Array.isArray(d.dropped) && d.dropped.length ? `, dropped ${d.dropped.join(", ")}` : ""}`
    if (Array.isArray(d.components)) return `${d.components.length} components`
    if (Array.isArray(d.artboards)) return `${d.artboards.length} frames`
    if (typeof d.removed === "string") return "removed"
    if (Array.isArray(d.files))
      return d.files
        .map((f) => (typeof f === "object" && f && "path" in f ? String((f as { path: unknown }).path) : String(f)))
        .join(", ")
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
      const data =
        e.result.ok &&
        typeof e.result.data === "object" &&
        e.result.data &&
        Array.isArray((e.result.data as { files?: unknown }).files)
          ? {
              ...(e.result.data as object),
              files: ((e.result.data as { files: unknown[] }).files as { path?: unknown }[]).map((f) => f?.path ?? f),
            }
          : e.result.ok
            ? e.result.data
            : null
      const detail = `${JSON.stringify(e.args, null, 1)}\n\n${e.result.ok ? JSON.stringify(data, null, 1).slice(0, 1600) : e.result.error}`
      const step = toolStep(e.name, e.args, e.result)
      push({
        kind: "tool",
        name: e.name,
        title: step.title,
        icon: step.icon,
        ok: e.result.ok,
        summary: `${describeArgs(e.name, e.args)}, ${describeResult(e.result)}`,
        detail,
        open: !e.result.ok,
        turn: turn.value,
        changed: step.changed,
        mutates: step.mutates,
      })
      break
    }
    case "activity": {
      live.value = null
      const existing = entries.value.find(
        (x): x is Extract<Entry, { kind: "activity" }> => x.kind === "activity" && x.id === e.id,
      )
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
      if (e.usage)
        usage.value = { input: usage.value.input + e.usage.input, output: usage.value.output + e.usage.output }
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

type Approval = Extract<Entry, { kind: "approval" }>
/** Every open permission prompt and how it is settled, keyed by its own
 * transcript entry: two prompts at once are each answered on their row. */
const pending = shallowReactive(new Map<Approval, (id: string | null) => void>())

function ask(title: string, options: { id: string; label: string; primary?: boolean }[]): Promise<string | null> {
  push({ kind: "approval", title, options, answered: null })
  const entry = entries.value[entries.value.length - 1] as Approval
  return new Promise((resolve) => {
    pending.set(toRaw(entry), (id) => {
      entry.answered = id ?? "cancelled"
      pending.delete(toRaw(entry))
      resolve(id)
    })
  })
}

const askPermission = async (req: AcpPermissionRequest): Promise<string | null> => {
  const options = req.options.map((o) => ({ id: o.optionId, label: o.name, primary: o.kind.startsWith("allow") }))
  if (config.value.auto) return options.find((o) => o.primary)?.id ?? options[0]?.id ?? null
  return ask(
    req.title,
    options.length
      ? options
      : [
          { id: "allow", label: "allow", primary: true },
          { id: "reject", label: "reject" },
        ],
  )
}

function answer(entry: Approval, id: string | null) {
  pending.get(toRaw(entry))?.(id)
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
const slashAll = computed<Slash[]>(() => [
  ...OURS,
  ...commands.value
    .filter((c) => !OURS.some((o) => o.name === c.name))
    .map((c) => ({ name: c.name, args: c.input, desc: c.description, harness: true })),
])
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
      system(
        slashAll.value
          .map(
            (c) =>
              `/${c.name}${c.args ? ` ${c.args}` : ""}: ${c.desc}${c.harness ? ` (${agentName.value || "harness"})` : ""}`,
          )
          .join("\n"),
      )
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
      turn.value = 0
      checkpoints.clear()
      if (acp.value?.hello?.agent)
        await acp.value.newSession().catch((e: Error) => push({ kind: "error", text: e.message }))
      return true
    case "mode": {
      const client = acp.value
      if (!client || !modes.value.length) return (system("the harness has no modes"), true)
      const m = modes.value.find((x) => x.id === arg || x.name.toLowerCase() === arg.toLowerCase())
      if (!m) return (system(`modes: ${modes.value.map((x) => x.id).join(", ")}`), true)
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
      system(gen.length ? `evolve made ${gen.length} variants` : "select a frame first")
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
      if (!last) return (system("nothing to copy"), true)
      system((await copyText(last.text)) ? "copied" : "clipboard unavailable")
      return true
    }
    case "session":
      system(
        [
          agentName.value || "no harness",
          mode.value,
          `${fmtTokens(usage.value.input)} in / ${fmtTokens(usage.value.output)} out`,
          `${editor.artboards.length} frames`,
          acp.value?.sessionId && `acp ${acp.value.sessionId}`,
          hello.value && `cwd ${hello.value.cwd}`,
        ]
          .filter(Boolean)
          .join(", "),
      )
      return true
    case "undo":
      undo()
      system("undone")
      return true
    case "clear":
      entries.value = []
      usage.value = { input: 0, output: 0 }
      turn.value = 0
      checkpoints.clear()
      return true
    case "stop":
      stop()
      return true
    default:
      // The harness's own command goes to it as text.
      if (commands.value.some((c) => c.name === cmd)) return false
      system(`unknown command /${cmd}. Try /help.`)
      return true
  }
}

/* --------------------------------- context -------------------------------- */

/** The frames handed to the agent with the message: the selection (any of
 * it can be left out) and the ones picked with @. */
const left = ref(new Set<string>())
const pinned = ref<string[]>([])
watch(
  () => editor.selectedIds.join(),
  () => (left.value = new Set()),
)
const context = computed<Changed[]>(() => {
  const ids = [...editor.selectedIds.filter((id) => !left.value.has(id)), ...pinned.value]
  return [...new Set(ids)]
    .map((id) => editor.artboards.find((a) => a.id === id))
    .filter((a) => !!a)
    .map((a) => ({ id: a.id, name: a.name }))
})
function dropContext(id: string) {
  pinned.value = pinned.value.filter((x) => x !== id)
  if (editor.selectedIds.includes(id)) left.value = new Set(left.value).add(id)
}
/** The message as the harness reads it: the frames first, by name and id. */
const withContext = (text: string, frames: Changed[]) =>
  frames.length
    ? `Context, frames on the Studio canvas:\n${frames.map((f) => `- ${f.name} (id ${f.id})`).join("\n")}\n\n${text}`
    : text

/* The @ picker: typed at a word's start, or opened from the card's @ key. */
const atQuery = computed(() => /(?:^|\s)@([^\s@]*)$/.exec(input.value)?.[1] ?? null)
const atForced = ref(false)
const atOpen = computed(() => atForced.value || atQuery.value !== null)
const atMatches = computed(() => {
  const q = (atQuery.value ?? "").toLowerCase()
  return editor.artboards.filter((a) => a.name.toLowerCase().includes(q) && !context.value.some((c) => c.id === a.id))
})
const atIndex = ref(0)
watch(atMatches, () => (atIndex.value = 0))
function pickAt(id: string) {
  pinned.value = [...pinned.value, id]
  if (atQuery.value !== null) input.value = input.value.replace(/(^|\s)@[^\s@]*$/, "$1")
  atForced.value = false
  box.value?.focus()
}

async function send(text = input.value.trim()) {
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
  const frames = context.value
  turn.value += 1
  checkpoints.set(turn.value, checkpoint())
  pinned.value = []
  // Whatever the harness said before (while its session opened) is its own
  // entry: this turn's reply starts under its message.
  live.value = null
  push({ kind: "user", text, turn: turn.value, context: frames })
  busy.value = true
  started.value = Date.now()
  now.value = started.value
  clock = setInterval(() => (now.value = Date.now()), 250)
  controller = new AbortController()
  await client.prompt(withContext(text, frames), controller.signal)
  clearInterval(clock)
  busy.value = false
  controller = null
  live.value = null
  // Follow-ups run one at a time, in order, each its own turn.
  const next = followUps.value.shift()
  if (next !== undefined) await run(next)
}

function stop() {
  for (const settle of [...pending.values()]) settle(null)
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
  if (atOpen.value && atMatches.value.length) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      const n = atMatches.value.length
      atIndex.value = (atIndex.value + (e.key === "ArrowDown" ? 1 : n - 1)) % n
      return
    }
    if (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey)) {
      e.preventDefault()
      pickAt(atMatches.value[atIndex.value].id)
      return
    }
  }
  if (atForced.value && e.key === "Escape") {
    atForced.value = false
    return
  }
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
    if (
      e.key === "Tab" ||
      (e.key === "Enter" && !e.shiftKey && `/${slashMatches.value[slashIndex.value].name}` !== input.value)
    ) {
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
    if (pickerOpen.value || menuOpen.value) {
      pickerOpen.value = false
      menuOpen.value = false
      return
    }
    if (busy.value || pending.size) {
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
      <span class="title" :title="title">{{ title }}</span>
      <button type="button" class="head-btn" aria-label="New chat" title="New chat" @click="slash('/new')">
        <DitherIcon name="Plus" :size="13" :stroke-width="1.5" />
      </button>
      <button
        type="button"
        class="head-btn"
        :aria-pressed="menuOpen"
        aria-label="Bridge and session"
        title="Bridge and session"
        @click="menuOpen = !menuOpen"
      >
        <DitherIcon name="MoreHorizontal" :size="13" :stroke-width="1.5" />
      </button>
      <button type="button" class="head-btn" aria-label="Close agent" @click="emit('close')">
        <DitherIcon name="Close" :size="13" :stroke-width="1.5" />
      </button>
      <div v-if="menuOpen" class="menu" role="group" aria-label="Bridge and session">
        <label class="field"
          ><span>bridge</span
          ><input
            v-model.trim="config.bridgeUrl"
            name="agent-bridge-url"
            type="text"
            class="input"
            placeholder="ws://127.0.0.1:8790"
            autocomplete="off"
            spellcheck="false"
        /></label>
        <label class="remember"
          ><input v-model="config.auto" type="checkbox" name="agent-auto" class="accent-foreground" />Answer permission
          prompts with their allow option</label
        >
        <p class="note">
          {{ fmtTokens(usage.input) }} in, {{ fmtTokens(usage.output) }} out<template v-if="lastTurnMs"
            >, last turn {{ fmtMs(lastTurnMs) }}</template
          ><template v-if="hello">, in {{ hello.cwd }}</template>
        </p>
        <p class="note">
          The harness runs on your machine behind the bridge; the Studio only sends prompts and answers its tool calls.
          No key, no model setting lives here.
        </p>
      </div>
    </div>

    <div ref="log" class="log" aria-live="polite">
      <div v-if="!entries.length" class="empty">
        <p>
          Describe a screen, a chart or a control. Your harness composes it from the kit's registry through the Studio's
          tools, and every message keeps a checkpoint to go back to.
        </p>
        <button v-for="s in STARTERS" :key="s" type="button" class="starter" @click="send(s)">
          <DitherIcon name="Sparkles" :size="12" :stroke-width="1.5" /><span>{{ s }}</span>
        </button>
      </div>
      <template v-for="(e, i) in entries" :key="i">
        <div v-if="e.kind === 'user' || e.kind === 'followup'" class="msg">
          <div v-if="e.context?.length" class="chips">
            <span v-for="c in e.context" :key="c.id" class="ctx"
              ><DitherIcon name="Layout" :size="11" :stroke-width="1.5" />{{ c.name }}</span
            >
          </div>
          <p class="msg-text">{{ e.text }}</p>
          <button
            v-if="canRestore(e)"
            type="button"
            class="restore"
            aria-label="Restore checkpoint"
            title="Restore checkpoint: the canvas as it was before this message"
            @click="restoreTo(e.turn!)"
          >
            <DitherIcon name="Undo" :size="12" :stroke-width="1.5" />
          </button>
        </div>
        <Prose v-else-if="e.kind === 'assistant'" :text="e.text" :live="live === e" />
        <details v-else-if="e.kind === 'tool'" class="step" :open="e.open" :data-ok="String(e.ok)">
          <summary :title="e.summary">
            <DitherIcon :name="e.icon ?? 'Terminal'" :size="12" :stroke-width="1.5" /><span class="step-title">{{
              e.title || e.name
            }}</span
            ><DitherIcon class="chev" name="ChevronRight" :size="11" :stroke-width="1.5" />
          </summary>
          <pre class="detail">{{ e.detail }}</pre>
        </details>
        <div v-else-if="e.kind === 'activity'" class="step activity" :data-status="e.status">
          <span v-if="e.status === 'pending' || e.status === 'in_progress'" class="spin" aria-hidden="true"></span>
          <DitherIcon
            v-else
            :name="e.status === 'failed' ? 'XCircle' : 'CheckCircle'"
            :size="12"
            :stroke-width="1.5"
          /><span class="step-title">{{ e.title }}</span>
        </div>
        <div v-else-if="e.kind === 'approval'" class="approval" :data-answered="String(e.answered !== null)">
          <p class="approval-title"><DitherIcon name="AlertTriangle" :size="12" :stroke-width="1.5" />{{ e.title }}</p>
          <div v-if="e.answered === null" class="choices">
            <button
              v-for="o in e.options"
              :key="o.id"
              type="button"
              class="key"
              :class="o.primary ? 'is-primary' : ''"
              @click="answer(e, o.id)"
            >
              {{ o.label }}
            </button>
          </div>
          <p v-else class="note">Answered {{ e.answered }}</p>
        </div>
        <p v-else-if="e.kind === 'error'" class="line-error">{{ e.text }}</p>
        <p v-else-if="e.kind === 'system'" class="line-system">{{ e.text }}</p>
      </template>
    </div>

    <div class="dock">
      <div v-if="todos?.length" class="tray">
        <button type="button" class="tray-head" :aria-expanded="todosOpen" @click="todosOpen = !todosOpen">
          <DitherIcon :name="todosOpen ? 'ChevronDown' : 'ChevronRight'" :size="11" :stroke-width="1.5" />
          <span>{{ todos.length }} {{ todos.length === 1 ? "to-do" : "to-dos" }}</span>
          <span class="dim">{{ todosDone }} of {{ todos.length }} done</span>
        </button>
        <ul v-if="todosOpen" class="rows">
          <li v-for="(t, j) in todos" :key="j" class="row" :data-status="t.status">
            <DitherIcon v-if="t.status === 'completed'" name="CheckCircle" :size="12" :stroke-width="1.5" /><span
              v-else
              class="circle"
              aria-hidden="true"
            ></span
            ><span class="row-text">{{ t.content }}</span>
          </li>
        </ul>
      </div>
      <div v-if="followUps.length" class="tray">
        <p class="tray-head is-static">
          <span>{{ followUps.length }} in queue</span>
        </p>
        <ul class="rows">
          <li v-for="(s, j) in followUps" :key="j" class="row">
            <span class="circle" aria-hidden="true"></span><span class="row-text" :title="s">{{ s }}</span>
            <button
              type="button"
              class="row-key"
              :aria-label="`Remove ${s} from the queue`"
              @click="followUps.splice(j, 1)"
            >
              <DitherIcon name="Close" :size="11" :stroke-width="1.5" />
            </button>
          </li>
        </ul>
      </div>
      <div v-if="busy" class="tray generating">
        <span class="spin" aria-hidden="true"></span>
        <span>{{ live ? "Writing" : "Generating" }}… {{ fmtMs(elapsed) }}</span>
        <button type="button" class="key stop" title="Stop (esc)" @click="stop">Stop</button>
      </div>
      <div v-else-if="changes" class="tray">
        <div class="tray-head is-split">
          <button type="button" class="tray-toggle" :aria-expanded="changesOpen" @click="changesOpen = !changesOpen">
            <DitherIcon :name="changesOpen ? 'ChevronDown' : 'ChevronRight'" :size="11" :stroke-width="1.5" />
            <span>{{ changes.frames.length }} {{ changes.frames.length === 1 ? "frame" : "frames" }} changed</span>
          </button>
          <button type="button" class="key" @click="undoTurn">Undo all</button>
          <button type="button" class="key is-primary" @click="keep">Keep</button>
        </div>
        <ul v-if="changesOpen" class="rows">
          <li v-for="f in changes.frames" :key="f.id" class="row">
            <DitherIcon name="Layout" :size="12" :stroke-width="1.5" /><span class="row-text">{{ f.name }}</span>
            <button
              v-if="editor.artboards.some((a) => a.id === f.id)"
              type="button"
              class="row-key is-word"
              @click="selectArtboard(f.id)"
            >
              Show
            </button>
          </li>
        </ul>
      </div>

      <div class="card rim">
        <div v-if="slashOpen && slashMatches.length" class="pop" role="listbox" aria-label="Commands">
          <button
            v-for="(c, i) in slashMatches"
            :key="c.name"
            type="button"
            role="option"
            :aria-selected="i === slashIndex"
            class="pop-row"
            :class="i === slashIndex ? 'is-active' : ''"
            @click="pickSlash(c)"
          >
            <span class="pop-name"
              >/{{ c.name }}<span v-if="c.args" class="dim"> {{ c.args }}</span></span
            ><span class="dim">{{ c.harness ? `${agentName}: ` : "" }}{{ c.desc }}</span>
          </button>
        </div>
        <div v-else-if="atOpen" class="pop" role="listbox" aria-label="Frames">
          <button
            v-for="(a, i) in atMatches"
            :key="a.id"
            type="button"
            role="option"
            :aria-selected="i === atIndex"
            class="pop-row"
            :class="i === atIndex ? 'is-active' : ''"
            @click="pickAt(a.id)"
          >
            <span class="pop-name"><DitherIcon name="Layout" :size="11" :stroke-width="1.5" />{{ a.name }}</span>
          </button>
          <p v-if="!atMatches.length" class="note">No frame left to add</p>
        </div>
        <div v-else-if="pickerOpen" id="agent-harness-picker" class="pop" role="group" aria-label="Harness">
          <template v-if="hello">
            <button
              v-for="h in harnesses"
              :key="h.id"
              type="button"
              class="pop-row"
              :aria-pressed="agent?.id === h.id"
              :title="h.command"
              @click="start(h.id)"
            >
              <span class="pop-name"
                ><ToolMark v-if="isMark(h.id)" :id="h.id" :size="12" />{{ h.name
                }}<DitherIcon v-if="agent?.id === h.id" name="Check" :size="11" :stroke-width="1.5"
              /></span>
              <span class="dim">{{ h.installed ? (h.note ?? "on this path") : "not on the path" }}</span>
            </button>
            <form class="custom" @submit.prevent="customCommand.trim() && start({ command: customCommand.trim() })">
              <input
                v-model="customCommand"
                type="text"
                name="agent-command"
                class="input"
                placeholder="any ACP command, e.g. omp --mode acp"
                autocomplete="off"
                spellcheck="false"
                aria-label="Custom harness command"
              />
              <button type="submit" class="key" :disabled="!customCommand.trim()">Start</button>
            </form>
            <button v-if="agent" type="button" class="pop-row text-destructive" @click="acp?.stop()">
              <span class="pop-name">Stop {{ agent.name }}</span>
            </button>
          </template>
          <p v-else class="note">
            {{ connecting ? "Connecting the bridge…" : "No bridge yet." }} Run it next to your harness, which keeps its
            own login:<br /><code>node bridge/dither-bridge.mjs</code><br />then pick Claude Code, Codex, Gemini CLI,
            oh-my-pi, Goose, OpenCode, or any ACP command.
          </p>
        </div>

        <div class="chips">
          <button
            type="button"
            class="ctx is-key"
            aria-label="Add a frame as context"
            :aria-pressed="atForced"
            @click="atForced = !atForced"
          >
            @
          </button>
          <span v-for="c in context" :key="c.id" class="ctx"
            ><DitherIcon name="Layout" :size="11" :stroke-width="1.5" />{{ c.name
            }}<button type="button" class="ctx-x" :aria-label="`Leave ${c.name} out`" @click="dropContext(c.id)">
              <DitherIcon name="Close" :size="10" :stroke-width="1.5" /></button
          ></span>
        </div>
        <textarea
          ref="box"
          v-model="input"
          name="agent-goal"
          :rows="rows"
          class="prompt"
          :placeholder="busy ? 'Queue a follow-up' : '/ for commands, @ for context'"
          aria-label="Message the agent"
          spellcheck="false"
          @keydown="onKey"
        />
        <div class="foot">
          <button
            v-if="modes.length"
            type="button"
            class="pill"
            :title="modes.find((m) => m.id === mode)?.description || 'Switch mode'"
            @click="slash(`/mode ${modes[(modes.findIndex((m) => m.id === mode) + 1) % modes.length].id}`)"
          >
            <DitherIcon name="Bot" :size="11" :stroke-width="1.5" />{{ modes.find((m) => m.id === mode)?.name || mode }}
          </button>
          <button
            type="button"
            class="pill"
            :aria-expanded="pickerOpen"
            aria-controls="agent-harness-picker"
            :title="hello ? `bridge ${config.bridgeUrl}, cwd ${hello.cwd}` : config.bridgeUrl"
            @click="togglePicker"
          >
            <span class="led" :data-on="String(!!agent)" aria-hidden="true"></span
            ><ToolMark v-if="agent && isMark(agent.id)" :id="agent.id" :size="11" /><span class="pill-name">{{
              agentName || (acp ? "Pick a harness" : "Harness")
            }}</span
            ><DitherIcon name="ChevronDown" :size="10" :stroke-width="1.5" />
          </button>
          <span v-if="config.auto" class="auto" title="Permission prompts are answered with their allow option"
            >auto</span
          >
          <button
            v-if="busy && !input.trim()"
            type="button"
            class="send key-chrome"
            aria-label="Stop (esc)"
            title="Stop (esc)"
            @click="stop"
          >
            <span class="stop-square" aria-hidden="true"></span>
          </button>
          <button
            v-else
            type="button"
            class="send key-chrome"
            :disabled="!input.trim()"
            :aria-label="busy ? 'Queue (enter)' : 'Send (enter)'"
            :title="busy ? 'Queue (enter)' : 'Send (enter)'"
            @click="send()"
          >
            <DitherIcon name="ArrowUp" :size="13" :stroke-width="2" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.agent {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  font-family: var(--font-mono);
  font-size: 12px;
}
.dim {
  color: var(--color-muted-foreground);
}
.note {
  margin: 0;
  font-size: 10.5px;
  line-height: 1.5;
  color: var(--color-muted-foreground);
  overflow-wrap: anywhere;
}
.note code {
  color: var(--color-foreground);
}

/* The chat's header: its title, a new chat, the session menu, close. */
.head {
  position: relative;
  z-index: 5;
  display: flex;
  height: 2.5rem;
  flex-shrink: 0;
  align-items: center;
  gap: 2px;
  padding-inline: 0.875rem 0.5rem;
}
.title {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11.5px;
  color: var(--color-foreground);
}
.head-btn {
  display: grid;
  width: 1.75rem;
  height: 1.75rem;
  flex-shrink: 0;
  place-items: center;
  border-radius: 7px;
  color: var(--color-muted-foreground);
  transition:
    color 200ms var(--ease-settle),
    background-color 200ms var(--ease-settle);
}
.head-btn:hover,
.head-btn[aria-pressed="true"] {
  background: var(--color-card);
  color: var(--color-foreground);
}
.menu {
  position: absolute;
  top: calc(100% - 2px);
  right: 0.5rem;
  left: 0.5rem;
  display: grid;
  gap: 8px;
  border-radius: 12px;
  padding: 10px 12px;
  background: var(--color-card);
  box-shadow: var(--float-shadow);
}
.field {
  display: grid;
  grid-template-columns: 3.5rem minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--color-muted-foreground);
}
.input {
  height: 1.75rem;
  min-width: 0;
  border: 1px solid var(--color-edge);
  border-radius: 7px;
  background: var(--color-background);
  padding-inline: 0.5rem;
  font: inherit;
  font-size: 11px;
  color: var(--color-foreground);
  outline: none;
}
.input:focus {
  border-color: var(--color-ring);
}
.remember {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--color-muted-foreground);
}

/* The thread: your messages as cards, the reply as prose, steps in words. */
.log {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  padding: 4px 14px 14px;
  display: grid;
  align-content: start;
  gap: 10px;
}
.empty {
  display: grid;
  gap: 4px;
  padding-top: 4px;
}
.empty p {
  margin: 0 0 8px;
  line-height: 1.6;
  color: var(--color-muted-foreground);
}
.starter {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-height: 1.75rem;
  border-radius: 8px;
  padding: 6px 8px;
  text-align: left;
  font-size: 11.5px;
  line-height: 1.45;
  color: var(--color-muted-foreground);
  transition:
    color 200ms var(--ease-settle),
    background-color 200ms var(--ease-settle);
}
.starter :deep(svg) {
  flex-shrink: 0;
  margin-top: 2px;
}
.starter:hover {
  color: var(--color-foreground);
  background: var(--color-card);
}
.msg {
  position: relative;
  display: grid;
  gap: 6px;
  border-radius: 10px;
  padding: 8px 10px;
  background: var(--color-card);
}
.msg-text {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: var(--color-foreground);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.msg:has(.restore) {
  padding-right: 34px;
}
.restore {
  position: absolute;
  top: 4px;
  right: 4px;
  display: grid;
  width: 1.5rem;
  height: 1.5rem;
  place-items: center;
  border-radius: 7px;
  color: var(--color-muted-foreground);
  opacity: 0;
  transition:
    opacity 200ms var(--ease-settle),
    color 200ms var(--ease-settle),
    background-color 200ms var(--ease-settle);
}
.msg:hover .restore,
.restore:focus-visible {
  opacity: 1;
}
@media (hover: none) {
  .restore {
    opacity: 1;
  }
}
.restore:hover {
  color: var(--color-foreground);
  background: color-mix(in oklab, var(--color-foreground) 8%, transparent);
}
.step {
  font-size: 11.5px;
  color: var(--color-muted-foreground);
}
.step summary,
.activity {
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 1.5rem;
  line-height: 1.4;
}
.step summary {
  cursor: pointer;
  list-style: none;
  border-radius: 6px;
  transition: color 200ms var(--ease-settle);
}
.step summary::-webkit-details-marker {
  display: none;
}
.step summary:hover {
  color: var(--color-foreground);
}
.step-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.chev {
  flex-shrink: 0;
  opacity: 0;
  transition:
    opacity 200ms var(--ease-settle),
    rotate 350ms var(--ease-settle);
}
.step summary:hover .chev,
.step[open] .chev {
  opacity: 1;
}
.step[open] .chev {
  rotate: 90deg;
}
.step[data-ok="false"],
.activity[data-status="failed"] {
  color: var(--color-destructive);
}
.detail {
  margin: 4px 0 2px 19px;
  max-height: 14rem;
  overflow: auto;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 10.5px;
  line-height: 1.45;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: var(--color-muted-foreground);
  background: var(--well);
  box-shadow: var(--recess-sm);
}
.approval {
  display: grid;
  gap: 8px;
  border-radius: 10px;
  padding: 8px 10px;
  background: var(--color-card);
}
.approval[data-answered="true"] {
  background: none;
  padding-block: 0;
}
.approval-title {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  margin: 0;
  font-size: 11.5px;
  line-height: 1.45;
  color: var(--color-foreground);
  overflow-wrap: anywhere;
}
.approval-title :deep(svg) {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--swatch-orange);
}
.approval[data-answered="true"] .approval-title {
  color: var(--color-muted-foreground);
}
.choices {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.line-system,
.line-error {
  margin: 0;
  font-size: 10.5px;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: var(--color-muted-foreground);
}
.line-error {
  color: var(--color-destructive);
}

/* Keys: machined, filled, the primary one in ink. */
.key {
  min-height: 1.5rem;
  border-radius: 7px;
  padding-inline: 9px;
  font-size: 11px;
  color: var(--color-foreground);
  background: color-mix(in oklab, var(--color-foreground) 8%, transparent);
  transition: background-color 200ms var(--ease-settle);
}
.key:hover:not(:disabled) {
  background: color-mix(in oklab, var(--color-foreground) 14%, transparent);
}
.key.is-primary {
  color: var(--color-background);
  background: var(--color-foreground);
}
.key.is-primary:hover {
  background: color-mix(in oklab, var(--color-foreground) 88%, var(--color-background));
}
.key:disabled {
  opacity: 0.5;
}

/* Over the input: the turn's to-dos, the queue, the run, its changes. */
.dock {
  display: grid;
  flex-shrink: 0;
  gap: 6px;
  padding: 0 10px 10px;
}
.tray {
  display: grid;
  gap: 2px;
  border-radius: 10px;
  padding: 4px 6px;
  background: var(--color-card);
  font-size: 11px;
}
.tray-head,
.tray-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 1.5rem;
  min-width: 0;
  margin: 0;
  border-radius: 6px;
  padding-inline: 4px;
  text-align: left;
  color: var(--color-foreground);
}
.tray-head .dim {
  margin-left: auto;
}
.tray-head.is-split {
  padding: 0;
  gap: 4px;
}
.tray-toggle {
  flex: 1;
}
.rows {
  display: grid;
  max-height: 8.5rem;
  overflow-y: auto;
  margin: 0;
  padding: 0 0 2px;
  list-style: none;
}
.row {
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 1.5rem;
  padding-inline: 4px;
  color: var(--color-foreground);
}
.row[data-status="completed"] {
  color: var(--color-muted-foreground);
}
.row[data-status="completed"] .row-text {
  text-decoration: line-through;
}
.row-text {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.circle {
  width: 10px;
  height: 10px;
  flex-shrink: 0;
  margin-inline: 1px;
  border-radius: 999px;
  box-shadow: inset 0 0 0 1.25px var(--color-muted-foreground);
}
.row[data-status="in_progress"] .circle {
  box-shadow:
    inset 0 0 0 1.25px var(--color-foreground),
    inset 0 0 0 3px var(--color-card),
    inset 0 0 0 5px var(--color-foreground);
}
.row-key {
  display: grid;
  min-width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  place-items: center;
  border-radius: 6px;
  color: var(--color-muted-foreground);
}
.row-key.is-word {
  padding-inline: 6px;
  font-size: 10.5px;
}
.row-key:hover {
  color: var(--color-foreground);
  background: color-mix(in oklab, var(--color-foreground) 8%, transparent);
}
.generating {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 4px 4px 10px;
  color: var(--color-muted-foreground);
}
.generating .stop {
  margin-left: auto;
}
.spin {
  width: 10px;
  height: 10px;
  flex-shrink: 0;
  margin-inline: 1px;
  border-radius: 999px;
  box-shadow: inset 0 0 0 1.25px color-mix(in oklab, var(--color-foreground) 25%, transparent);
  border-top: 1.25px solid var(--color-foreground);
}
@media (prefers-reduced-motion: no-preference) {
  .spin {
    animation: spin 0.9s linear infinite;
  }
  @keyframes spin {
    to {
      rotate: 360deg;
    }
  }
}

/* The input card: context chips, the message, the harness and the send key. */
.card {
  position: relative;
  display: grid;
  gap: 4px;
  border-radius: 14px;
  padding: 8px 8px 6px 10px;
  background: var(--well);
  box-shadow: var(--recess-sm);
}
.card:focus-within {
  box-shadow:
    var(--recess-sm),
    0 0 0 1px var(--color-edge);
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.ctx {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  min-height: 1.5rem;
  overflow: hidden;
  border-radius: 6px;
  padding-inline: 6px;
  font-size: 10.5px;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--color-foreground);
  background: color-mix(in oklab, var(--color-foreground) 8%, transparent);
}
.msg .ctx {
  color: var(--color-muted-foreground);
}
.ctx.is-key {
  min-width: 1.5rem;
  justify-content: center;
  color: var(--color-muted-foreground);
}
.ctx.is-key:hover,
.ctx.is-key[aria-pressed="true"] {
  color: var(--color-foreground);
}
.ctx-x {
  display: grid;
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  place-items: center;
  margin: 0 -6px 0 -4px;
  border-radius: 6px;
  color: var(--color-muted-foreground);
}
.ctx-x:hover {
  color: var(--color-foreground);
}
.prompt {
  resize: none;
  border: 0;
  background: transparent;
  padding: 4px 0;
  font: inherit;
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-foreground);
  outline: none;
}
.prompt::placeholder {
  color: var(--color-muted-foreground);
}
.foot {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
.pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  max-width: 10rem;
  min-height: 1.5rem;
  border-radius: 7px;
  padding-inline: 6px;
  font-size: 10.5px;
  color: var(--color-muted-foreground);
  background: color-mix(in oklab, var(--color-foreground) 7%, transparent);
  transition:
    color 200ms var(--ease-settle),
    background-color 200ms var(--ease-settle);
}
.pill:hover,
.pill[aria-expanded="true"] {
  color: var(--color-foreground);
}
.pill-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.led {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 1px;
  background: var(--color-muted-foreground);
}
.led[data-on="true"] {
  background: var(--swatch-green);
}
.auto {
  font-size: 10px;
  color: var(--swatch-orange);
}
.send {
  display: grid;
  width: 1.625rem;
  height: 1.625rem;
  flex-shrink: 0;
  margin-left: auto;
  place-items: center;
}
.send:disabled {
  opacity: 0.4;
  filter: grayscale(1);
}
.stop-square {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: currentColor;
}

/* Popovers over the card: commands, frames, harnesses. */
.pop {
  position: absolute;
  right: 0;
  bottom: calc(100% + 6px);
  left: 0;
  z-index: 6;
  display: grid;
  max-height: 16rem;
  overflow-y: auto;
  border-radius: 12px;
  padding: 4px;
  background: var(--color-card);
  box-shadow: var(--float-shadow);
}
.pop .note {
  padding: 6px 8px;
}
.pop-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  min-height: 1.75rem;
  align-items: center;
  border-radius: 8px;
  padding: 4px 8px;
  text-align: left;
  font-size: 11px;
  color: var(--color-foreground);
}
.pop-row .dim {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pop-row.is-active,
.pop-row:hover {
  background: color-mix(in oklab, var(--color-foreground) 8%, transparent);
}
.pop-name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}
.pop-row.text-destructive {
  color: var(--color-destructive);
}
.custom {
  display: flex;
  gap: 6px;
  padding: 4px;
}
.custom .input {
  flex: 1;
}

.head-btn:focus-visible,
.starter:focus-visible,
.restore:focus-visible,
.step summary:focus-visible,
.key:focus-visible,
.tray-head:focus-visible,
.tray-toggle:focus-visible,
.row-key:focus-visible,
.ctx.is-key:focus-visible,
.ctx-x:focus-visible,
.pill:focus-visible,
.send:focus-visible,
.pop-row:focus-visible {
  outline: 2px solid var(--color-ring);
  outline-offset: 1px;
}
@media (prefers-reduced-motion: reduce) {
  .head-btn,
  .starter,
  .restore,
  .chev,
  .key,
  .pill {
    transition: none;
  }
}
</style>
