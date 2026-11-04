<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowReactive, toRaw, watch } from "vue"
import { copyText, DitherIcon, type IconName } from "@dither-kit"
import { editor, selectArtboard, selectedArtboard } from "@/entities/editor"
import { evolveSelected, runCommand } from "@/features/agent"
import {
  type AcpClient,
  type AcpPermissionRequest,
  type BridgeHello,
  connectAcp,
  modelName,
  type PromptImage,
} from "@/features/agent/acp"
import {
  type AgentCommand,
  type AgentActivity,
  type AgentConfig,
  type AgentEvent,
  loadAgentConfig,
  loadDraft,
  type Mode,
  type ModelChoice,
  saveAgentConfig,
  saveDraft,
  type ContextUse,
  type Usage,
} from "@/features/agent/tools"
import { chats, loadThread, newChat, openProject, saveThread, titleOf } from "@/features/agent/chats"
import type { Built } from "@/features/agent/dither"
import { handoff, takeAsk, togglePicked } from "@/features/agent/handoff"
import { artboardPng } from "@/features/export-image"
import { checkpoint, restoreCheckpoint, undo } from "@/features/history"
import { activeProjectId } from "@/features/persistence"
import BrandMark from "@/shared/ui/BrandMark.vue"
import { modKey } from "@/shared/lib"
import ToolMark from "@/shared/ui/ToolMark.vue"
import { isMark } from "@/shared/ui/marks"
import {
  type Attachment,
  chipOf,
  foldsPaste,
  imagesOf,
  intake,
  moved,
  pastedText,
  promptText,
  type Queued,
} from "./model/compose"
import { askTitle, type Changed } from "./model/steps"
import { nextPrompts } from "./model/suggest"
import {
  type Block,
  changesOf,
  type Entry,
  runLabel,
  secondsOf,
  sentOf,
  threadBlocks,
  todosOf,
  toolEntry,
} from "./model/thread"
import Attached from "./ui/Attached.vue"
import ContextMeter from "./ui/ContextMeter.vue"
import ThreadEntry from "./ui/ThreadEntry.vue"
import TurnTrays from "./ui/TurnTrays.vue"

// The agent panel is a CONTROL PLANE for the harness the user already has.
// One local bridge, one pick: Claude Code, Codex, Gemini CLI, oh-my-pi,
// Goose, OpenCode, or any command that speaks the Agent Client Protocol.
// The harness runs as the user's own signed-in process; the panel is its
// client, set as a composer. This file holds the session (the bridge, the
// turns and their checkpoints, the queue, the context) and lays it out; the
// thread's entries draw in `ui/ThreadEntry.vue`, the trays over the input in
// `ui/TurnTrays.vue`, and every reading of the thread is `model/thread.ts`.
// Nothing here is a key or a model setting.
const emit = defineEmits<{ close: []; activity: [AgentActivity] }>()
// Suggestions for an empty thread.
const STARTERS: { icon: IconName; text: string }[] = [
  { icon: "Layout", text: "A sign-in screen with email, password and a primary button" },
  { icon: "ChartLine", text: "A revenue dashboard: an area chart, three stat cards and a table" },
  { icon: "Dice", text: "Evolve the selected frame into four variants" },
]

/* ------------------------------ configuration ----------------------------- */

const config = ref<AgentConfig>(loadAgentConfig())
watch(config, (c) => saveAgentConfig(c), { deep: true })
const menuOpen = ref(false)

/* ------------------------------- transcript ------------------------------- */

/** The message being written, and its field (declared first: the session
 * restore below brings back the project's draft). */
const input = ref("")
const box = ref<HTMLTextAreaElement | null>(null)
const entries = ref<Entry[]>([])
const usage = ref<Usage>({ input: 0, output: 0 })
/** How full the harness says its context is (none until it reports). */
const contextUse = ref<ContextUse | null>(null)
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
/* The thread follows what arrives only while you read its end: scrolled up,
 * it holds still and a key offers the latest. */
const log = ref<HTMLElement | null>(null)
const atEnd = ref(true)
const unseen = ref(false)
const onScroll = () => {
  const el = log.value
  if (!el) return
  atEnd.value = el.scrollHeight - el.scrollTop - el.clientHeight < 32
  if (atEnd.value) unseen.value = false
}
function toEnd(smooth = false) {
  const el = log.value
  if (!el) return
  const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? true
  el.scrollTop = el.scrollHeight
  if (smooth && !still) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  unseen.value = false
}
const scrollLog = (force = false) =>
  nextTick(() => {
    if (force || atEnd.value) toEnd()
    else unseen.value = true
  })
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

// The conversation is the open chat of the active project (`chats`): it
// follows the project, and the chat picked in the sidebar.
let loadedFor = ""
let loadedChat = ""
/** Entries when last kept: more of them means the chat moved. */
let keptCount = 0
function restore(projectId: string, chatId: string) {
  const fresh = loadedChat !== "" && (projectId !== loadedFor || chatId !== loadedChat)
  loadedFor = projectId
  loadedChat = chatId
  const s = loadThread<Entry>(projectId, chatId)
  entries.value = s?.entries ?? []
  usage.value = s?.usage ?? { input: 0, output: 0 }
  turn.value = Math.max(0, ...entries.value.map((e) => ("turn" in e && e.turn) || 0))
  checkpoints.clear()
  settled.value = new Set(Array.from({ length: turn.value + 1 }, (_, i) => i))
  keptCount = entries.value.length
  opened.value = new Map()
  input.value = loadDraft(projectId)
  scrollLog(true)
  // Another chat is another session with the harness.
  if (fresh && acp.value?.hello?.agent) {
    contextUse.value = null
    acp.value.newSession().catch((e: Error) => push({ kind: "error", text: e.message }))
  }
}

const title = computed(() => titleOf(entries.value))
/** What the latest turn changed on the canvas, until kept or undone. */
const changes = computed(() =>
  !turn.value || settled.value.has(turn.value) ? null : changesOf(entries.value, turn.value),
)

function keep() {
  if (changes.value) settled.value = new Set(settled.value).add(changes.value.turn)
  refocus()
}
/** The canvas back to where the turn found it (one undoable step). */
function undoTurn() {
  const c = changes.value
  const cp = c && checkpoints.get(c.turn)
  if (!c || !cp) return
  restoreCheckpoint(cp)
  settled.value = new Set(settled.value).add(c.turn)
  refocus()
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

/** Your earlier message, taken back to change and send again from there:
 * the later entries leave the thread, the canvas goes back to before it
 * when its checkpoint is kept (`restore`, yours to turn off), and the
 * harness is told it is a revision (its session remembers the rest). */
const editing = ref<{ at: number; turn: number; was: string; restore: boolean; restorable: boolean } | null>(null)
function editFrom(at: number) {
  const e = entries.value[at]
  if (busy.value || !e || (e.kind !== "user" && e.kind !== "followup")) return
  const restorable = !!e.turn && checkpoints.has(e.turn)
  editing.value = { at, turn: e.turn ?? 0, was: e.text, restore: restorable, restorable }
  input.value = e.text
  for (const c of e.context ?? [])
    if (editor.artboards.some((a) => a.id === c.id) && !handoff.picked.includes(c.id)) togglePicked(c.id)
  refocus()
}
function cancelEdit() {
  editing.value = null
  input.value = ""
  refocus()
}
/** Go back to the message being edited: the canvas (when chosen) and the
 * thread; what the harness reads before the revised message. */
function rewind(ed: NonNullable<typeof editing.value>): string {
  const cp = ed.restore ? checkpoints.get(ed.turn) : undefined
  if (cp) restoreCheckpoint(cp)
  entries.value = entries.value.slice(0, ed.at)
  const first = ed.was.split("\n")[0].slice(0, 80)
  return `I am changing my earlier message ("${first}"); ${cp ? "the canvas is back to how it stood before it" : "the canvas stays as it is now"}. What I want instead:\n\n`
}

const todos = computed(() => todosOf(entries.value))

/** The thread as drawn, runs of steps folded; a run is open while it is the
 * newest thing the harness is doing, or once you open it. */
const blocks = computed(() => threadBlocks(entries.value))
const opened = ref(new Map<number, boolean>())
const isOpen = (b: Block) => opened.value.get(b.at) ?? (busy.value && b === blocks.value[blocks.value.length - 1])
const setOpen = (b: Block, open: boolean) => {
  if (open !== isOpen(b)) opened.value = new Map(opened.value).set(b.at, open)
}
/** A fold the reader opened or closed (a thought, a step) keeps it. */
function setFold(e: Entry, open: boolean) {
  if ((e.kind === "thought" || e.kind === "tool") && e.open !== open) e.open = open
}
watch(
  () => activeProjectId.value,
  (id) => id && openProject(id),
  { immediate: true },
)
watch(
  () => [chats.project, chats.active] as const,
  ([project, chat]) => {
    if (project && chat && (project !== loadedFor || chat !== loadedChat)) restore(project, chat)
  },
  { immediate: true },
)
watch(
  [entries, usage],
  () => {
    if (!loadedFor) return
    const kept = entries.value.filter((e) => e.kind !== "approval" || e.answered !== null)
    saveThread(loadedFor, loadedChat, { entries: kept, usage: usage.value }, kept.length > keptCount)
    keptCount = kept.length
  },
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
/** The folder's own name out of a path, either separator. */
const folderOf = (path: string) => path.split(/[\\/]/).filter(Boolean).pop() ?? path
/** The reply just copied, by its place in the thread. */
const copied = ref<number | null>(null)
let copiedTimer: ReturnType<typeof setTimeout> | undefined
async function copyReply(at: number, text: string) {
  if (!(await copyText(text))) return
  copied.value = at
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => (copied.value = null), 1600)
}

/* -------------------------------- the bridge ------------------------------ */

const acp = ref<AcpClient | null>(null)
const hello = ref<BridgeHello | null>(null)
const connecting = ref(false)
const harnesses = computed(() => hello.value?.harnesses ?? [])
const agent = computed(() => hello.value?.agent ?? null)
/** Who answers, as a person reads it: a harness picked from the bridge's
 * list goes by that name (Claude Code, not its adapter's package), any
 * other command by the name it introduced itself with. */
const agentName = ref("")
const nameIt = () =>
  (agentName.value =
    (agent.value && harnesses.value.find((h) => h.id === agent.value?.id)?.name) ||
    acp.value?.agent ||
    agent.value?.name ||
    "")
const modes = ref<Mode[]>([])
const mode = ref("")
/** The model the harness runs, as its session says; switched only among
 * the harness's own. */
const model = ref<ModelChoice | null>(null)
const modelOpen = ref(false)
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
      approveTool,
      onHello: (h) => {
        hello.value = h
        if (!h.agent) {
          modes.value = []
          mode.value = ""
          model.value = null
          commands.value = []
          contextUse.value = null
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
  refocus()
  const client = acp.value ?? (await connect())
  if (!client) return
  if (typeof choice === "string") {
    config.value.harness = choice
  } else {
    config.value.harness = "custom"
    config.value.command = choice.command
  }
  try {
    await client.start(choice)
    nameIt()
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

const live = ref<{ kind: "assistant"; text: string } | null>(null)
type Thought = Extract<Entry, { kind: "thought" }>
/** The thought streaming now, and when it began. */
const thinking = ref<Thought | null>(null)
let thoughtAt = 0
/** Anything else the harness does ends its thought. */
function endThought() {
  const t = thinking.value
  if (!t) return
  t.ms = Date.now() - thoughtAt
  t.open = false
  thinking.value = null
}

function onEvent(e: AgentEvent) {
  if (e.type !== "thought" && e.type !== "mode" && e.type !== "commands" && e.type !== "plan") endThought()
  switch (e.type) {
    case "thought":
      live.value = null
      if (!thinking.value) {
        thoughtAt = Date.now()
        thinking.value = { kind: "thought", text: "", open: true }
        entries.value.push(thinking.value)
      }
      thinking.value.text += e.text
      scrollLog()
      break
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
    case "tool":
      live.value = null
      push(toolEntry(e.name, e.args, e.result, turn.value, e.built))
      break
    case "activity": {
      live.value = null
      const existing = entries.value.find(
        (x): x is Extract<Entry, { kind: "activity" }> => x.kind === "activity" && x.id === e.id,
      )
      if (existing) {
        existing.status = e.status
        if (e.title) existing.title = e.title
        // A call with no title yet waits for the update that names it (a
        // Studio tool's is drawn as its own step, so it never shows here).
      } else if (e.title) push({ kind: "activity", id: e.id, title: e.title, status: e.status, tool: e.kind })
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
    case "model":
      model.value = e.model
      break
    case "commands":
      commands.value = e.commands
      break
    case "context":
      contextUse.value = e.context
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
    case "stopped":
      live.value = null
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

function ask(
  title: string,
  options: { id: string; label: string; primary?: boolean; reject?: boolean }[],
  code?: string,
): Promise<string | null> {
  askedAt = Date.now()
  push({ kind: "approval", title, options, answered: null, ...(code ? { code } : {}) })
  const entry = entries.value[entries.value.length - 1] as Approval
  return new Promise((resolve) => {
    pending.set(toRaw(entry), (id) => {
      entry.answered = id ?? "cancelled"
      pending.delete(toRaw(entry))
      resolve(id)
    })
  })
}

/** A tool the harness built runs only when you say so, every time: its
 * code is on the prompt, and Auto never answers it. */
const approveTool = async (tool: Built): Promise<boolean> =>
  (await ask(
    `Run ${tool.name.replace(/_/g, " ")}, a tool ${agentName.value || "your harness"} built`,
    [
      { id: "run", label: "Run it", primary: true },
      { id: "no", label: "Don't run" },
    ],
    tool.code,
  )) === "run"

const askPermission = async (req: AcpPermissionRequest): Promise<string | null> => {
  const options = req.options.map((o) => ({
    id: o.optionId,
    label: o.name,
    primary: o.kind.startsWith("allow"),
    reject: o.kind.startsWith("reject"),
  }))
  if (config.value.auto) return options.find((o) => o.primary)?.id ?? options[0]?.id ?? null
  return ask(
    askTitle(req.title, (req.raw as { toolCall?: { rawInput?: unknown } } | null)?.toolCall?.rawInput),
    options.length
      ? options
      : [
          { id: "allow", label: "allow", primary: true },
          { id: "reject", label: "reject", reject: true },
        ],
  )
}

/** When the newest permission prompt came up, and when a key was last
 * typed in the field: the number keys wait out `TYPING_GUARD` between. */
let askedAt = 0
let typedAt = 0
const TYPING_GUARD = 1500
/** The newest permission prompt still waiting for its answer. */
const openApproval = computed(() => {
  for (let i = entries.value.length - 1; i >= 0; i--) {
    const e = entries.value[i]
    if (e.kind === "approval" && e.answered === null) return e
  }
  return null
})

/* One quiet voice for a screen reader: what the turn needs or how it
 * ended, never the stream itself. */
const announced = ref("")
watch(openApproval, (a) => a && (announced.value = "Needs your answer"))

/* What the page shows of the agent while the panel is closed. */
watch(
  () => (pending.size ? "waiting" : busy.value ? "working" : "idle") as AgentActivity,
  (a) => emit("activity", a),
  { immediate: true },
)

function answer(entry: Approval, id: string | null) {
  pending.get(toRaw(entry))?.(id)
  refocus()
}

/* -------------------------------- composer -------------------------------- */

/* Up walks back through what was sent (read off the thread, so it survives
 * a reload), only from an empty field; editing a recalled message makes it
 * a draft again; Down past the newest empties the field. */
const sent = computed(() => sentOf(entries.value))
let cursor = -1
watch(input, (text) => {
  if (cursor !== -1 && text !== sent.value[cursor]) cursor = -1
})
/** What the message carries besides its words (pastes, dropped files,
 * pictures), and a line about what could not come in. */
const attachments = ref<Attachment[]>([])
const notice = ref("")
watch(input, () => (notice.value = ""))
/** Messages written while a turn runs, in the order they go; `paused`
 * after a stop, until you send one or press Send next. */
const followUps = ref<Queued[]>([])
const paused = ref(false)
let qn = 0
const queueOf = (text: string, atts: Attachment[]): Queued => ({ id: `q${++qn}`, text, attachments: atts })
let controller: AbortController | null = null
const toolsOpen = ref(false)

/* The field grows with what is typed, up to a cap, then scrolls. */
const FIELD_MAX = 176
function fit() {
  const el = box.value
  if (!el) return
  el.style.height = "auto"
  el.style.height = `${Math.min(el.scrollHeight, FIELD_MAX)}px`
}
watch(input, () => nextTick(fit))
// The unsent message is kept per project (closing the panel keeps it).
let draftTimer: ReturnType<typeof setTimeout> | undefined
watch(input, (text) => {
  clearTimeout(draftTimer)
  draftTimer = setTimeout(() => loadedFor && saveDraft(loadedFor, text), 250)
})
/** A finger on a touch screen: Enter is a newline there (only the send key
 * sends), and the field never takes focus on its own, which would raise
 * the keyboard over the canvas. */
const touch = window.matchMedia?.("(pointer: coarse)").matches ?? false
/** Back to the field after a key elsewhere in the panel did its job. */
const refocus = () => !touch && nextTick(() => box.value?.focus())
/** iPad Safari ends a composition and then delivers its Enter as a key of
 * its own: an Enter this soon after a composition ended is the
 * composition's. */
let composedAt = 0
const onCompositionEnd = () => (composedAt = Date.now())
/* The panel is its own keyboard scope: a key pressed in it never reaches
 * the canvas (whose arrows nudge and whose Backspace deletes frames), and a
 * character typed with a key of the panel focused lands in the field. The
 * page's chords (⌘Z, ⌘I) still pass. */
function onPanelKey(e: KeyboardEvent) {
  if (e.metaKey || e.ctrlKey) return
  e.stopPropagation()
  const t = e.target as HTMLElement
  if (t.closest("input, textarea, select, [contenteditable]") || e.isComposing) return
  if (e.key.length === 1 || e.key === "Backspace") box.value?.focus()
}

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
/** The field says what sending will do now. */
const placeholder = computed(() =>
  openApproval.value
    ? `Answer 1 to ${Math.min(9, openApproval.value.options.length)}, or redirect`
    : stopping.value
      ? "Queue for after the stop"
      : busy.value
        ? "Queue a follow-up"
        : !acp.value
          ? "Ask; this starts the bridge"
          : !agent.value
            ? "Ask; this starts your harness"
            : "Ask, / for commands",
)
/** Esc puts the command menu away until the field changes. */
const slashDismissed = ref(false)
watch(input, () => (slashDismissed.value = false))
const slashOpen = computed(() => !slashDismissed.value && /^\/[\w-]*$/.test(input.value))
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
      newChat()
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
      opened.value = new Map()
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
watch(
  () => editor.selectedIds.join(),
  () => (left.value = new Set()),
)
const context = computed<Changed[]>(() => {
  const ids = [...editor.selectedIds.filter((id) => !left.value.has(id)), ...handoff.picked]
  return [...new Set(ids)]
    .map((id) => editor.artboards.find((a) => a.id === id))
    .filter((a) => !!a)
    .map((a) => ({ id: a.id, name: a.name }))
})
function dropContext(id: string) {
  if (handoff.picked.includes(id)) togglePicked(id)
  if (editor.selectedIds.includes(id)) left.value = new Set(left.value).add(id)
}
/** The message as the harness reads it: the frames first, by name and id. */
const withContext = (text: string, frames: Changed[]) =>
  frames.length
    ? `Context, frames on the Studio canvas:\n${frames.map((f) => `- ${f.name} (id ${f.id})`).join("\n")}\n\n${text}`
    : text

/** The context frames as pictures (PNG at 1x, the first `PICTURES`), so
 * a harness that takes images sees what it is asked about. */
const PICTURES = 3
async function picturesOf(frames: Changed[]): Promise<PromptImage[]> {
  const out: PromptImage[] = []
  for (const f of frames.slice(0, PICTURES)) {
    const a = editor.artboards.find((x) => x.id === f.id)
    const url = a && (await artboardPng(a, 1))
    if (url) out.push({ mimeType: "image/png", data: url.slice(url.indexOf(",") + 1) })
  }
  return out
}

/* The @ picker: typed at a word's start, or opened from the card's @ key. */
const atQuery = computed(() => /(?:^|\s)@([^\s@]*)$/.exec(input.value)?.[1] ?? null)
const atForced = ref(false)
const atOpen = computed(() => atForced.value || atQuery.value !== null)

/* A menu over the composer (commands, frames, the harness, the model, the
   bridge) is as tall as the room above the composer: measured whenever one
   opens and when the panel resizes, so it never runs past the thread's top
   (the composer stands mid-panel in an empty chat). */
const composerEl = ref<HTMLElement | null>(null)
const room = ref("16rem")
function measureRoom() {
  const top = log.value?.getBoundingClientRect().top
  const at = composerEl.value?.getBoundingClientRect().top
  if (top === undefined || at === undefined) return
  room.value = `${Math.max(96, Math.floor(at - top - 10))}px`
}
watch(
  () => [slashOpen.value, atOpen.value, pickerOpen.value, menuOpen.value, modelOpen.value],
  () => nextTick(measureRoom),
)
onMounted(() => window.addEventListener("resize", measureRoom))
onBeforeUnmount(() => window.removeEventListener("resize", measureRoom))
const atMatches = computed(() => {
  const q = (atQuery.value ?? "").toLowerCase()
  return editor.artboards.filter((a) => a.name.toLowerCase().includes(q) && !context.value.some((c) => c.id === a.id))
})
const atIndex = ref(0)
watch(atMatches, () => (atIndex.value = 0))
function pickAt(id: string) {
  if (!handoff.picked.includes(id)) togglePicked(id)
  if (atQuery.value !== null) input.value = input.value.replace(/(^|\s)@[^\s@]*$/, "$1")
  atForced.value = false
  box.value?.focus()
}

/** The open listbox and its highlighted option, which the field announces
 * (`aria-activedescendant`) and keeps in view while the arrows move it. */
const listbox = computed(() =>
  slashOpen.value && slashMatches.value.length
    ? { id: "agent-commands", active: `agent-command-${slashIndex.value}` }
    : atOpen.value && atMatches.value.length
      ? { id: "agent-frames", active: `agent-frame-${atIndex.value}` }
      : null,
)
watch(
  () => listbox.value?.active,
  (id) => id && nextTick(() => document.getElementById(id)?.scrollIntoView?.({ block: "nearest" })),
)

/** After a turn that finished on its own, a few next prompts from the
 * frames it touched (else the frames in hand), while the field is empty. */
const suggestions = computed(() => {
  const last = entries.value[entries.value.length - 1]
  if (busy.value || input.value || openApproval.value || last?.kind !== "worked" || last.end) return []
  return nextPrompts(changesOf(entries.value, turn.value)?.frames ?? context.value)
})

/* A message asked at the selection on the canvas: its frames join the
 * context, then it goes like one typed here. */
function takeAsks() {
  for (let ask = takeAsk(); ask; ask = takeAsk()) {
    for (const id of ask.frames) if (!handoff.picked.includes(id)) togglePicked(id)
    void send(ask.text)
  }
}
// Asked while the panel was closed: taken once it has mounted (its run
// state exists by then), and as they come after that.
watch(() => handoff.asks.length, takeAsks)

/** Send what is in the composer (or `text`, a suggestion or an ask). While
 * the harness works it waits in the queue; `now` stops the turn and sends
 * it next (the protocol has no way into a running turn: a stop and a send
 * is the honest version of steering). */
async function send(text = input.value.trim(), now = false) {
  const atts = text === input.value.trim() ? attachments.value : []
  if (!text && !atts.length) return
  // A finger's send puts the keyboard away; a pointer's keeps the field.
  if (touch) box.value?.blur()
  else refocus()
  if (text.startsWith("/") && !atts.length) {
    input.value = ""
    cursor = -1
    if (await slash(text)) return
  }
  if (imagesOf(atts).length && acp.value && !acp.value.acceptsImages) {
    notice.value = `${agentName.value || "This harness"} takes no pictures here: remove them to send`
    return
  }
  input.value = ""
  attachments.value = []
  cursor = -1
  if (busy.value) {
    // Words typed while a permission prompt waits are the answer: it is
    // declined and they go next, in its place.
    const asking = openApproval.value
    if (asking && text) {
      answer(asking, asking.options.find((o) => o.reject)?.id ?? null)
      now = true
    }
    const q = queueOf(text, atts)
    if (now) {
      followUps.value.unshift(q)
      sendNow(q.id)
    } else followUps.value.push(q)
    announced.value = now ? "Stopping to send it" : "Queued"
    return
  }
  paused.value = false
  const ed = editing.value
  editing.value = null
  await run(text, atts, ed ? rewind(ed) : "")
}

/** The latest turn's message, for "Try again" when it failed. */
const lastSent = ref("")
/** A stop asked for and not yet answered by the harness. */
const stopping = ref(false)
async function run(text: string, atts: Attachment[] = [], revision = "") {
  lastSent.value = text
  const client = await ready()
  if (!client) {
    input.value = input.value ? `${text}\n${input.value}` : text
    attachments.value = [...atts, ...attachments.value]
    return
  }
  const frames = context.value
  turn.value += 1
  checkpoints.set(turn.value, checkpoint())
  handoff.picked.splice(0)
  handoff.picking = false
  // Whatever the harness said before (while its session opened) is its own
  // entry: this turn's reply starts under its message.
  live.value = null
  endThought()
  const framePictures = client.acceptsImages ? await picturesOf(frames) : []
  const pictures = [
    ...framePictures,
    ...(client.acceptsImages ? imagesOf(atts).map((a) => ({ mimeType: a.mimeType, data: a.data })) : []),
  ]
  push({
    kind: "user",
    text,
    turn: turn.value,
    context: frames,
    pictured: framePictures.length > 0,
    ...(atts.length ? { attached: atts.map((a) => ({ kind: a.kind, ...chipOf(a) })) } : {}),
  })
  scrollLog(true)
  busy.value = true
  started.value = Date.now()
  now.value = started.value
  clock = setInterval(() => (now.value = Date.now()), 1000)
  controller = new AbortController()
  const { stopReason } = await client.prompt(
    revision + withContext(promptText(text, atts), frames),
    controller.signal,
    pictures,
  )
  clearInterval(clock)
  busy.value = false
  stopping.value = false
  controller = null
  live.value = null
  endThought()
  const end = stopReason === "cancelled" ? "stopped" : stopReason === "error" ? "failed" : undefined
  announced.value = end === "stopped" ? "Stopped" : end === "failed" ? "Failed" : "Done"
  push({ kind: "worked", ms: Date.now() - started.value, ...(end ? { end } : {}) })
  // Follow-ups run one at a time, in order, each its own turn; a stop pauses
  // them (a Send now stops on purpose and goes on).
  if (end === "stopped" && !sendingNow) paused.value = true
  sendingNow = false
  if (!paused.value) await runNext()
}

/** The next queued message, as its own turn. */
async function runNext() {
  const next = followUps.value.shift()
  if (next) await run(next.text, next.attachments)
}
let sendingNow = false
/** Send a queued message now: to the front, and a running turn stops for it. */
function sendNow(id: string) {
  const at = followUps.value.findIndex((q) => q.id === id)
  if (at < 0) return
  followUps.value = [followUps.value[at], ...followUps.value.filter((q) => q.id !== id)]
  paused.value = false
  if (busy.value) {
    sendingNow = true
    stopTurn()
  } else void runNext()
}
/** Take a queued message back into the composer, to change and send again. */
function editQueued(id: string) {
  const q = followUps.value.find((x) => x.id === id)
  if (!q) return
  followUps.value = followUps.value.filter((x) => x.id !== id)
  input.value = input.value ? `${q.text}\n${input.value}` : q.text
  attachments.value = [...q.attachments, ...attachments.value]
  refocus()
}
/** Go on with a paused queue. */
function resume() {
  paused.value = false
  if (!busy.value) void runNext()
}
const moveQueued = (id: string) => {
  const at = followUps.value.findIndex((q) => q.id === id)
  followUps.value = moved(followUps.value, at, -1)
}

/** A stop the harness has not answered in `STUCK_MS`: the tray offers to
 * stop the harness itself (the bridge ends its process, which ends the
 * turn). */
const STUCK_MS = 5000
const stuck = computed(() => stopping.value && now.value - stoppedAt.value >= STUCK_MS)
const stoppedAt = ref(0)
function forceStop() {
  acp.value?.stop()
  refocus()
}
/** Stop the turn. The queue stays, paused (Send next or a new message goes on). */
function stop() {
  stopTurn()
}
function stopTurn() {
  for (const settle of [...pending.values()]) settle(null)
  if (busy.value && !stopping.value) {
    stopping.value = true
    stoppedAt.value = Date.now()
  }
  controller?.abort()
}

function unqueue() {
  const last = followUps.value[followUps.value.length - 1]
  if (last) editQueued(last.id)
}

/* What comes in by paste or drop. A long text folds into a chip (the
 * field stays a field); Cmd/Ctrl+Shift+V pastes it as typed text. Files:
 * pictures and text files; anything else says why not. */
let rawPasteUntil = 0
async function takeFiles(files: File[]) {
  for (const f of files) {
    const got = await intake(f, attachments.value)
    if (typeof got === "string") notice.value = got
    else attachments.value = [...attachments.value, got]
  }
}
function onPaste(e: ClipboardEvent) {
  const files = [...(e.clipboardData?.files ?? [])]
  if (files.length) {
    e.preventDefault()
    void takeFiles(files)
    return
  }
  const text = e.clipboardData?.getData("text/plain") ?? ""
  if (Date.now() < rawPasteUntil || !foldsPaste(text)) return
  e.preventDefault()
  attachments.value = [...attachments.value, pastedText(text, attachments.value)]
}
const dropping = ref(false)
function onDrop(e: DragEvent) {
  dropping.value = false
  const files = [...(e.dataTransfer?.files ?? [])]
  if (!files.length) return
  e.preventDefault()
  void takeFiles(files)
  refocus()
}
const unattach = (id: string) => (attachments.value = attachments.value.filter((a) => a.id !== id))
/** A folded text back into the field, as typed text. */
function unfold(id: string) {
  const a = attachments.value.find((x) => x.id === id)
  if (a?.kind !== "text") return
  unattach(id)
  input.value = input.value ? `${input.value}\n${a.text}` : a.text
  refocus()
}

function onKey(e: KeyboardEvent) {
  // A key that ends an IME composition (Japanese, Chinese, Korean) is the
  // composition's, never a send.
  if (e.isComposing || e.keyCode === 229) return
  if (e.key === "Enter" && (e.repeat || Date.now() - composedAt < 500)) return
  const typedBefore = typedAt
  typedAt = Date.now()
  // An open permission prompt takes 1 to 9 from an empty field, unless it
  // came up under your typing: then only once you have paused (so a digit
  // meant for the message never answers it).
  const asking = openApproval.value
  const settledIn = !asking || askedAt - typedBefore >= TYPING_GUARD || typedAt - typedBefore >= TYPING_GUARD
  if (asking && settledIn && !input.value && /^[1-9]$/.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
    const option = asking.options[Number(e.key) - 1]
    if (option) {
      e.preventDefault()
      answer(asking, option.id)
      return
    }
  }
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
    if (e.key === "Escape") {
      slashDismissed.value = true
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
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "v" || e.key === "V" || e.code === "KeyV")) {
    rawPasteUntil = Date.now() + 1000
    return
  }
  if (e.key === "Enter" && !e.shiftKey && !touch) {
    e.preventDefault()
    // An empty field on a paused queue: Enter goes on with it.
    if (!input.value.trim() && !attachments.value.length && paused.value && followUps.value.length) return resume()
    void send(undefined, busy.value && (e.metaKey || e.ctrlKey))
    return
  }
  if (e.key === "ArrowUp" && e.altKey) {
    e.preventDefault()
    unqueue()
    return
  }
  if (e.key === "Escape") {
    if (handoff.picking) {
      handoff.picking = false
      return
    }
    if (pickerOpen.value || menuOpen.value || modelOpen.value) {
      pickerOpen.value = false
      menuOpen.value = false
      modelOpen.value = false
      return
    }
    if (busy.value || pending.size) {
      e.preventDefault()
      stop()
    } else if (editing.value) cancelEdit()
    else box.value?.blur()
    return
  }
  if (e.ctrlKey && (e.key === "o" || e.key === "O")) {
    e.preventDefault()
    toolsOpen.value = !toolsOpen.value
    for (const x of entries.value) if (x.kind === "tool") x.open = toolsOpen.value
    return
  }
  const recalling = cursor !== -1
  if (e.key === "ArrowUp" && !e.shiftKey && sent.value.length && (recalling || !input.value)) {
    e.preventDefault()
    cursor = recalling ? Math.max(0, cursor - 1) : sent.value.length - 1
    input.value = sent.value[cursor]
  } else if (e.key === "ArrowDown" && !e.shiftKey && recalling) {
    e.preventDefault()
    const next = cursor + 1
    cursor = next < sent.value.length ? next : -1
    input.value = cursor === -1 ? "" : sent.value[cursor]
  }
}

function pickSlash(c: Slash) {
  input.value = `/${c.name}${c.args ? " " : ""}`
  box.value?.focus()
}

async function pickModel(id: string) {
  modelOpen.value = false
  refocus()
  if (!acp.value || id === model.value?.current) return
  await acp.value.setModel(id).catch((e: Error) => push({ kind: "error", text: e.message }))
}

async function togglePicker() {
  pickerOpen.value = !pickerOpen.value
  menuOpen.value = false
  modelOpen.value = false
  if (pickerOpen.value && !acp.value) await connect()
}

const keepDraft = () => loadedFor && saveDraft(loadedFor, input.value)
onMounted(() => {
  takeAsks()
  window.addEventListener("pagehide", keepDraft)
  fit()
  refocus()
})
defineExpose({ focus: refocus })
onBeforeUnmount(() => {
  window.removeEventListener("pagehide", keepDraft)
  clearTimeout(draftTimer)
  keepDraft()
  controller?.abort()
  clearInterval(clock)
  disconnect()
})
</script>

<template>
  <div class="agent" :class="{ 'is-empty': !entries.length }" @keydown="onPanelKey">
    <div class="head">
      <span class="who" aria-hidden="true"
        ><ToolMark v-if="agent && isMark(agent.id)" :id="agent.id" :size="12" /><BrandMark v-else :size="12"
      /></span>
      <span class="title row-label" :title="title">{{ title }}</span>
      <button type="button" class="head-btn" aria-label="New chat" title="New chat" @click="slash('/new')">
        <DitherIcon name="Edit" :size="13" :stroke-width="1.5" />
      </button>
      <button type="button" class="head-btn" aria-label="Close agent" @click="emit('close')">
        <DitherIcon name="Close" :size="13" :stroke-width="1.5" />
      </button>
    </div>

    <p class="sr-only" role="status">{{ announced }}</p>
    <div ref="log" class="log" @scroll.passive="onScroll">
      <div v-if="!entries.length" class="hello">
        <span class="hello-mark" aria-hidden="true"
          ><ToolMark v-if="agent && isMark(agent.id)" :id="agent.id" :size="26" /><BrandMark v-else :size="26"
        /></span>
        <h2 class="hello-title">What are we making?</h2>
        <p class="hello-note">
          {{ agentName || "Your harness" }} builds it on the canvas from the kit's registry. Every message keeps a
          checkpoint to go back to.
        </p>
      </div>
      <template v-for="b in blocks" :key="b.at">
        <ThreadEntry
          v-if="b.kind === 'entry'"
          :entry="b.entry"
          :live="live === b.entry || thinking === b.entry"
          :copied="copied === b.at"
          :restorable="canRestore(b.entry)"
          :editable="!busy && (b.entry.kind === 'user' || b.entry.kind === 'followup')"
          :latest="!busy && b.at === entries.length - 1"
          :numbered="b.entry === openApproval"
          @again="send(lastSent)"
          @continue="send('Continue')"
          @restore="'turn' in b.entry && b.entry.turn && restoreTo(b.entry.turn)"
          @edit="editFrom(b.at)"
          @copy="'text' in b.entry && copyReply(b.at, b.entry.text)"
          @answer="(id) => b.entry.kind === 'approval' && answer(b.entry, id)"
          @toggle="(open) => setFold(b.entry, open)"
        />
        <details
          v-else
          class="group fold"
          :open="isOpen(b)"
          @toggle="setOpen(b, ($event.target as HTMLDetailsElement).open)"
        >
          <summary class="first-line">
            <span v-if="b.running" class="spin" aria-hidden="true"></span
            ><DitherIcon v-else name="Layers" :size="12" :stroke-width="1.5" /><span class="row-label is-wrap">{{
              runLabel(b.items.map((it) => it.entry))
            }}</span
            ><DitherIcon class="chev" name="ChevronRight" :size="11" :stroke-width="1.5" />
          </summary>
          <div class="group-body">
            <ThreadEntry
              v-for="it in b.items"
              :key="it.at"
              :entry="it.entry"
              @toggle="(open) => setFold(it.entry, open)"
            />
          </div>
        </details>
      </template>
    </div>

    <div class="dock">
      <button v-if="unseen" type="button" class="latest" @click="toEnd(true)">
        <DitherIcon name="ArrowDown" :size="11" :stroke-width="1.5" />Latest
      </button>
      <div ref="composerEl" class="composer" :style="{ '--room': room }">
        <div
          v-if="slashOpen && slashMatches.length"
          id="agent-commands"
          class="pop"
          role="listbox"
          aria-label="Commands"
        >
          <button
            v-for="(c, i) in slashMatches"
            :id="`agent-command-${i}`"
            :key="c.name"
            type="button"
            tabindex="-1"
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
        <div v-else-if="atOpen" id="agent-frames" class="pop" role="listbox" aria-label="Frames">
          <button
            v-for="(a, i) in atMatches"
            :id="`agent-frame-${i}`"
            :key="a.id"
            type="button"
            tabindex="-1"
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
        <div v-else-if="modelOpen && model" id="agent-model-picker" class="pop" role="group" aria-label="Model">
          <button
            v-for="m in model.options"
            :key="m.id"
            type="button"
            class="pop-row"
            :aria-pressed="m.id === model.current"
            @click="pickModel(m.id)"
          >
            <span class="pop-name"
              >{{ m.name }}<DitherIcon v-if="m.id === model.current" name="Check" :size="11" :stroke-width="1.5"
            /></span>
            <span v-if="m.description" class="dim">{{ m.description }}</span>
          </button>
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
            <div class="pop-foot">
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
                <button type="submit" class="key" :disabled="!customCommand.trim()">
                  <span class="row-label">Start</span>
                </button>
              </form>
              <button v-if="agent" type="button" class="pop-row text-destructive" @click="acp?.stop()">
                <span class="pop-name">Stop {{ agent.name }}</span>
              </button>
            </div>
          </template>
          <p v-else class="note">
            {{ connecting ? "Connecting the bridge…" : "No bridge yet." }} Run it next to your harness, which keeps its
            own login:<br /><code>node bridge/dither-bridge.mjs</code><br />then pick Claude Code, Codex, Gemini CLI,
            oh-my-pi, Goose, OpenCode, or any ACP command.
          </p>
        </div>
        <div v-else-if="menuOpen" class="pop menu" role="group" aria-label="Bridge">
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
          <p class="note">
            {{ fmtTokens(usage.input) }} in, {{ fmtTokens(usage.output) }} out<template v-if="lastTurnMs"
              >, last turn {{ fmtMs(lastTurnMs) }}</template
            ><template v-if="hello">, in {{ hello.cwd }}</template>
          </p>
          <p class="note">
            The harness runs on your machine behind the bridge; the Studio only sends prompts and answers its tool
            calls. No key, no model setting lives here.
          </p>
        </div>

        <TurnTrays
          :next="suggestions"
          :todos="todos"
          :queue="followUps"
          :paused="paused"
          :run="
            busy
              ? {
                  doing: stopping ? 'Stopping' : thinking ? 'Thinking' : live ? 'Writing' : 'Working',
                  time: secondsOf(Math.max(1000, elapsed)),
                  stopping,
                  stuck,
                }
              : null
          "
          :changes="changes"
          :shown="(id) => editor.artboards.some((a) => a.id === id)"
          @stop="stop"
          @force-stop="forceStop"
          @unqueue="(id) => (followUps = followUps.filter((q) => q.id !== id))"
          @edit-queued="editQueued"
          @send-now="sendNow"
          @move-up="moveQueued"
          @clear-queue="((followUps = []), (paused = false))"
          @resume="resume"
          @undo="undoTurn"
          @keep="keep"
          @show="selectArtboard"
          @ask="(s) => send(s)"
        />

        <div v-if="editing" class="editing" role="status">
          <p class="editing-line">
            <DitherIcon name="Edit" :size="12" :stroke-width="1.5" /><span class="row-label is-wrap"
              >Editing an earlier message. Sending goes back there: the messages after it leave the thread.</span
            >
          </p>
          <div class="editing-keys">
            <label v-if="editing.restorable" class="editing-choice"
              ><input v-model="editing.restore" type="checkbox" name="edit-restore" /><span class="row-label"
                >Canvas back to before it</span
              ></label
            >
            <button type="button" class="editing-cancel" @click="cancelEdit">
              <span class="row-label">Cancel</span><kbd class="row-label">esc</kbd>
            </button>
          </div>
        </div>
        <div
          class="card"
          :class="{ 'is-dropping': dropping }"
          @dragover.prevent="dropping = true"
          @dragleave.self="dropping = false"
          @drop="onDrop"
        >
          <div v-if="context.length || attachments.length" class="chips">
            <span v-for="c in context" :key="c.id" class="ctx first-line"
              ><DitherIcon name="Layout" :size="11" :stroke-width="1.5" /><span class="row-label is-wrap">{{
                c.name
              }}</span
              ><button type="button" class="ctx-x" :aria-label="`Leave ${c.name} out`" @click="dropContext(c.id)">
                <DitherIcon name="Close" :size="10" :stroke-width="1.5" /></button
            ></span>
            <Attached :attachments="attachments" @remove="unattach" @unfold="unfold" />
          </div>
          <p v-if="notice" class="notice" role="status">{{ notice }}</p>
          <textarea
            ref="box"
            v-model="input"
            name="agent-goal"
            rows="1"
            class="prompt"
            :placeholder="placeholder"
            :enterkeyhint="touch ? 'enter' : 'send'"
            aria-label="Message the agent"
            aria-autocomplete="list"
            :aria-expanded="listbox !== null"
            :aria-controls="listbox?.id"
            :aria-activedescendant="listbox?.active"
            spellcheck="false"
            @keydown="onKey"
            @paste="onPaste"
            @compositionend="onCompositionEnd"
          />
          <div class="foot">
            <button
              type="button"
              class="foot-key"
              :aria-pressed="handoff.picking"
              aria-label="Pick frames on the canvas"
              title="Pick frames on the canvas (esc when done)"
              @click="handoff.picking = !handoff.picking"
            >
              <DitherIcon name="Crosshair" :size="13" :stroke-width="1.5" />
            </button>
            <button
              type="button"
              class="foot-key"
              aria-label="Add a frame by name"
              title="Add a frame by name (@)"
              :aria-pressed="atForced"
              @click="atForced = !atForced"
            >
              @
            </button>
            <button
              type="button"
              class="pill"
              :aria-expanded="pickerOpen"
              aria-controls="agent-harness-picker"
              :title="hello ? `${agentName || 'Harness'}, bridge ${config.bridgeUrl}` : config.bridgeUrl"
              @click="togglePicker"
            >
              <span class="led" :data-on="String(!!agent)" aria-hidden="true"></span
              ><span class="row-label">{{ agentName || (acp ? "Pick a harness" : "Harness") }}</span
              ><DitherIcon name="ChevronDown" :size="10" :stroke-width="1.5" />
            </button>
            <button
              v-if="model"
              type="button"
              class="pill"
              :aria-expanded="modelOpen"
              aria-controls="agent-model-picker"
              :title="`${agentName || 'The harness'} runs ${modelName(model)}`"
              :disabled="model.options.length < 2"
              @click="((modelOpen = !modelOpen), (pickerOpen = false), (menuOpen = false))"
            >
              <span class="row-label">{{ modelName(model) }}</span
              ><DitherIcon v-if="model.options.length > 1" name="ChevronDown" :size="10" :stroke-width="1.5" />
            </button>
            <button
              type="button"
              class="send"
              :class="input.trim() || attachments.length ? 'key-chrome' : 'is-idle'"
              :disabled="!input.trim() && !attachments.length"
              :aria-label="busy ? `Queue (enter), or send now (${modKey('enter')})` : 'Send (enter)'"
              :title="busy ? `Queue (enter), or stop and send now (${modKey('enter')})` : 'Send (enter)'"
              @mousedown.prevent
              @click="(ev: MouseEvent) => ev.detail > 1 || send()"
            >
              <DitherIcon name="ArrowUp" :size="13" :stroke-width="2" />
            </button>
          </div>
        </div>

        <div class="status">
          <button
            type="button"
            class="status-key"
            :aria-pressed="config.auto"
            :title="
              config.auto
                ? 'Permission prompts are answered with their allow option'
                : 'Permission prompts wait for you'
            "
            @click="config.auto = !config.auto"
          >
            <DitherIcon :name="config.auto ? 'Unlock' : 'Lock'" :size="11" :stroke-width="1.5" /><span
              class="row-label"
              >{{ config.auto ? "Auto" : "Ask" }}</span
            >
          </button>
          <button
            v-if="modes.length"
            type="button"
            class="status-key"
            :title="modes.find((m) => m.id === mode)?.description || 'Switch mode'"
            @click="slash(`/mode ${modes[(modes.findIndex((m) => m.id === mode) + 1) % modes.length].id}`)"
          >
            <DitherIcon name="Bot" :size="11" :stroke-width="1.5" /><span class="row-label">{{
              modes.find((m) => m.id === mode)?.name || mode
            }}</span>
          </button>
          <span v-if="hello" class="status-key is-static" :title="hello.cwd"
            ><DitherIcon name="Folder" :size="11" :stroke-width="1.5" /><span class="row-label">{{
              folderOf(hello.cwd)
            }}</span></span
          >
          <ContextMeter v-if="contextUse" class="status-meter" :use="contextUse" />
          <button
            type="button"
            class="status-key is-icon"
            :aria-pressed="menuOpen"
            aria-label="Bridge settings"
            title="Bridge settings"
            @click="((menuOpen = !menuOpen), (pickerOpen = false))"
          >
            <DitherIcon name="Settings" :size="12" :stroke-width="1.5" />
          </button>
        </div>
      </div>
    </div>

    <div v-if="!entries.length" class="starters">
      <button v-for="s in STARTERS" :key="s.text" type="button" class="starter" @click="send(s.text)">
        <DitherIcon :name="s.icon" :size="12" :stroke-width="1.5" /><span>{{ s.text }}</span>
      </button>
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
/* The chat's header: who answers, the chat's title, a new chat, close. */
.head {
  position: relative;
  z-index: 5;
  display: flex;
  height: 2.5rem;
  flex-shrink: 0;
  align-items: center;
  gap: 2px;
  /* The mark and the last key's glyph (13px in a 28px key) on the panel's
     14px line. */
  padding-inline: 14px 6.5px;
}
.who {
  display: grid;
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
  place-items: center;
  margin-right: 6px;
  border-radius: 6px;
  color: var(--color-foreground);
  background: color-mix(in oklab, var(--color-foreground) 8%, transparent);
}
.title {
  flex: 1;
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
.pop.menu {
  gap: 8px;
  padding: 10px 12px;
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
/* The thread: your message as a bubble, the reply as prose, steps in words. */
.log {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  padding: 4px 14px 14px;
  display: grid;
  /* One column the panel's width: a long unbroken line (a command, a path)
     never widens the thread past the panel. */
  grid-template-columns: minmax(0, 1fr);
  align-content: start;
  gap: 10px;
}
/* An empty chat: a greeting, the composer and the starters stand in the
   middle of the panel; the first message sends the composer down. */
.agent.is-empty .log {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding-bottom: 14px;
}
.hello {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  justify-items: start;
  gap: 8px;
  padding-inline: 2px;
}
.hello-mark {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  margin-bottom: 4px;
  border-radius: 12px;
  color: var(--color-foreground);
  background: var(--well);
  box-shadow: var(--recess-sm);
}
.hello-title {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-foreground);
}
.hello-note {
  margin: 0;
  font-size: 11px;
  line-height: 1.55;
  color: var(--color-muted-foreground);
}
.starters {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  flex: 1;
  align-content: start;
  min-height: 0;
  overflow-y: auto;
  padding: 2px 14px 10px;
}
.starter {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  min-height: 2rem;
  border-radius: 8px;
  padding: 8px 8px;
  text-align: left;
  font-size: 11.5px;
  line-height: 1.45;
  color: var(--color-muted-foreground);
  transition:
    color 200ms var(--ease-settle),
    background-color 200ms var(--ease-settle);
}
.starter + .starter {
  box-shadow: 0 -1px 0 color-mix(in oklab, var(--color-border) 70%, transparent);
}
.starter :deep(svg) {
  flex-shrink: 0;
  margin-top: 2px;
}
.starter:hover {
  color: var(--color-foreground);
  background: var(--color-card);
}
/* The composer's outer edge on the panel's 14px line, the thread's. */
.dock {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  flex-shrink: 0;
  gap: 6px;
  padding: 0 14px 12px;
}
/* The composer: one surface holding the stack (`ui/TurnTrays.vue`), the
   input card resting under it, and the row that says where it runs (how
   permission prompts are answered, the folder, settings). */
.composer {
  /* The composer's one line: every icon, chip and the placeholder start
     `--inset` in from its inner edge, every key ends there, and the text
     beside an icon (12px, then 7px) shares one column. */
  --inset: 10px;
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  border-radius: 16px;
  padding: 3px;
  background: var(--color-card);
}
/* The input card: the recessed well with a hairline, quiet until it holds
   the focus, then edged in the ring ink. */
.card {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 4px;
  border-radius: 13px;
  padding: 8px var(--inset) 6px;
  background: var(--well);
  box-shadow:
    var(--recess-sm),
    0 0 0 1px var(--color-border);
  transition: box-shadow 200ms var(--ease-settle);
}
/* Under the stack, a breath between its last row and the card. */
.part + .card {
  margin-top: 3px;
}
/* Editing an earlier message: what sending will do, and the way out. */
.editing {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 6px;
  margin-bottom: 4px;
  padding: 7px var(--inset);
  border-radius: 10px;
  background: color-mix(in oklab, var(--color-foreground) 6%, transparent);
  font-size: 11px;
  color: var(--color-foreground);
}
.editing-line {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  margin: 0;
  line-height: 1.4;
}
.editing-line > svg {
  flex-shrink: 0;
  margin-top: 2px;
}
.editing-keys {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px 10px;
  padding-left: 19px;
}
.editing-choice {
  display: inline-flex;
  min-height: 1.5rem;
  align-items: center;
  gap: 6px;
  color: var(--color-muted-foreground);
  cursor: pointer;
}
.editing-cancel {
  display: inline-flex;
  min-height: 1.5rem;
  align-items: center;
  gap: 6px;
  border-radius: 7px;
  padding: 0 8px;
  color: var(--color-foreground);
}
.editing-cancel:hover {
  background: color-mix(in oklab, var(--color-foreground) 8%, transparent);
}
.editing-cancel kbd {
  font: inherit;
  color: var(--color-muted-foreground);
}
.editing-cancel:focus-visible {
  outline: 2px solid var(--color-ring);
  outline-offset: 1px;
}
/* A file held over the composer: its ring says it lands here. */
.card.is-dropping {
  box-shadow:
    var(--recess-sm),
    0 0 0 2px var(--color-ring);
}
/* What could not come in, or why a send waits. */
.notice {
  margin: 0;
  font-size: 11px;
  line-height: 1.4;
  color: var(--color-destructive);
}
.card:focus-within {
  box-shadow:
    var(--recess-sm),
    0 0 0 1px var(--color-ring);
}
.ctx-x {
  --glyph: 1.5rem;
  display: grid;
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  place-items: center;
  margin-inline: -4px -6px;
  border-radius: 6px;
  color: var(--color-muted-foreground);
}
.ctx-x:hover {
  color: var(--color-foreground);
}
.prompt {
  min-height: calc(1.5em * 2 + 8px);
  max-height: 176px;
  overflow-y: auto;
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
/* The first key's glyph (13px in a 24px key) sits on the line. */
.foot {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  margin-left: -5.5px;
}
.foot-key {
  display: grid;
  min-width: 1.5rem;
  height: 1.5rem;
  place-items: center;
  border-radius: 7px;
  font-size: 12px;
  color: var(--color-muted-foreground);
  transition:
    color 200ms var(--ease-settle),
    background-color 200ms var(--ease-settle);
}
.foot-key:hover,
.foot-key[aria-pressed="true"] {
  color: var(--color-foreground);
  background: color-mix(in oklab, var(--color-foreground) 8%, transparent);
}
.pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  max-width: 9.5rem;
  min-height: 1.5rem;
  border-radius: 7px;
  padding-inline: 6px;
  font-size: 10.5px;
  color: var(--color-muted-foreground);
  transition: color 200ms var(--ease-settle);
}
.pill:hover,
.pill[aria-expanded="true"] {
  color: var(--color-foreground);
  background: color-mix(in oklab, var(--color-foreground) 7%, transparent);
}
/* Its keys' glyphs (6px into each key) on the composer's line. */
.status {
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
  padding: 3px calc(var(--inset) - 6px) 1px;
}
.status-key {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 5px;
  min-width: 0;
  min-height: 1.5rem;
  border-radius: 7px;
  padding-inline: 6px;
  font-size: 10.5px;
  white-space: nowrap;
  color: var(--color-muted-foreground);
  transition:
    color 200ms var(--ease-settle),
    background-color 200ms var(--ease-settle);
}
/* The folder is the one key that gives way: its name is cut short first. */
.status-key.is-static {
  flex-shrink: 1;
  min-width: 0;
}
button.status-key:hover,
.status-key[aria-expanded="true"] {
  color: var(--color-foreground);
  background: color-mix(in oklab, var(--color-foreground) 7%, transparent);
}
.status-key[aria-pressed="true"] {
  color: var(--color-foreground);
}
.status-key.is-icon {
  min-width: 1.5rem;
  margin-left: auto;
  justify-content: center;
  padding: 0;
}
.status-key.is-icon[aria-pressed="true"] {
  background: color-mix(in oklab, var(--color-foreground) 7%, transparent);
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
.send {
  display: grid;
  width: 1.625rem;
  height: 1.625rem;
  flex-shrink: 0;
  margin-left: auto;
  place-items: center;
}
/* Grey until there is something to send, then the chrome key. */
.send.is-idle {
  border-radius: 999px;
  color: var(--color-muted-foreground);
  background: color-mix(in oklab, var(--color-foreground) 10%, transparent);
}
/* Popovers over the card: commands, frames, harnesses. */
.pop {
  position: absolute;
  right: 0;
  bottom: calc(100% + 6px);
  left: 0;
  z-index: 6;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  /* Tall enough for every harness the bridge knows, the custom command and
     Stop at the Studio's 1024px floor; past that it scrolls. */
  max-height: min(24rem, var(--room, 16rem));
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
/* A row's note wraps beside its name, never cut short. */
.pop-row .dim {
  min-width: 0;
  overflow-wrap: anywhere;
  text-align: right;
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
/* The command field, Start and Stop stay whole at the picker's foot; the
   list of harnesses above them is what scrolls. */
.pop-foot {
  position: sticky;
  bottom: -4px;
  margin-bottom: -4px;
  padding-bottom: 4px;
  background: var(--color-card);
}
.custom {
  display: flex;
  gap: 6px;
  padding: 4px;
}
.custom .input {
  flex: 1;
}
.dock {
  position: relative;
}
/* Back to the end of the thread, when it moved on while you read above. */
.latest {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  z-index: 4;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 1.5rem;
  translate: -50% 0;
  border-radius: 999px;
  padding-inline: 10px;
  font-size: 10.5px;
  color: var(--color-foreground);
  background: var(--color-card);
  box-shadow: var(--float-shadow);
}
/* A run of steps, folded under how many there were. */
.group {
  font-size: 11.5px;
  color: var(--color-muted-foreground);
}
.group-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2px;
  margin: 2px 0 0 5px;
  padding-left: 13px;
  box-shadow: inset 1px 0 0 var(--color-border);
}
.head-btn:focus-visible,
.starter:focus-visible,
.latest:focus-visible,
.foot-key:focus-visible,
.status-key:focus-visible,
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
  .foot-key,
  .status-key,
  .pill {
    transition: none;
  }
}
</style>

<style>
/* The composer's shared pieces (keys, folds, chips, the spinner), drawn by
   the panel and its parts alike; every rule under `.agent`. */
.agent .dim {
  color: var(--color-muted-foreground);
}
.agent .note {
  margin: 0;
  font-size: 10.5px;
  line-height: 1.5;
  color: var(--color-muted-foreground);
  overflow-wrap: anywhere;
}
.agent .note code {
  color: var(--color-foreground);
}
/* Keys: machined, filled, the primary one in ink. */
.agent .key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  max-width: 100%;
  min-height: 1.5rem;
  border-radius: 7px;
  padding-inline: 9px;
  font-size: 11px;
  color: var(--color-foreground);
  background: color-mix(in oklab, var(--color-foreground) 8%, transparent);
  transition: background-color 200ms var(--ease-settle);
}
.agent .key:hover:not(:disabled) {
  background: color-mix(in oklab, var(--color-foreground) 14%, transparent);
}
.agent .key.is-primary {
  color: var(--color-background);
  background: var(--color-foreground);
}
.agent .key.is-primary:hover {
  background: color-mix(in oklab, var(--color-foreground) 88%, var(--color-background));
}
.agent .key:disabled {
  opacity: 0.5;
}
.agent .row-key {
  --glyph: 1.5rem;
  display: grid;
  min-width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  place-items: center;
  border-radius: 6px;
  color: var(--color-muted-foreground);
}
.agent .row-key.is-word {
  padding-inline: 6px;
  font-size: 10.5px;
}
.agent .row-key:hover {
  color: var(--color-foreground);
  background: color-mix(in oklab, var(--color-foreground) 8%, transparent);
}
.agent .spin {
  --glyph: 10px;
  width: 10px;
  height: 10px;
  flex-shrink: 0;
  margin-inline: 1px;
  border-radius: 999px;
  box-shadow: inset 0 0 0 1.25px color-mix(in oklab, var(--color-foreground) 25%, transparent);
  border-top: 1.25px solid var(--color-foreground);
}
@media (prefers-reduced-motion: no-preference) {
  .agent .spin {
    animation: agent-spin 0.9s linear infinite;
  }
  @keyframes agent-spin {
    to {
      rotate: 360deg;
    }
  }
}
.agent .chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.agent .ctx {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  min-height: 1.5rem;
  border-radius: 6px;
  padding-inline: 4px 6px;
  font-size: 10.5px;
  color: var(--color-foreground);
  background: color-mix(in oklab, var(--color-foreground) 8%, transparent);
}
.agent .ctx > svg {
  --glyph: 11px;
  flex-shrink: 0;
}
/* A row, chip or key whose words wrap (an is-wrap label): its glyphs and
   keys stand on the label's first line, each centred on its capitals
   (--first, from the label's top: its 0.3em pad and half a cap), and a
   one-line row keeps its 24px. Without text-box it stays centred. */
.agent :is(.row, .ctx, .key, summary, .activity).first-line {
  --first: calc(0.3em + 0.5cap);
}
@supports (text-box: trim-both cap alphabetic) {
  .agent :is(.row, .ctx, .key, summary, .activity).first-line {
    align-items: flex-start;
    padding-block: calc((1.5rem - 0.6em - 1cap) / 2);
  }
  .agent :is(.row, .ctx, .key, summary, .activity).first-line > :not(.row-label) {
    margin-top: calc(var(--first) - var(--glyph, 12px) / 2);
    margin-bottom: 0;
  }
}
/* A fold: a summary row that opens what it holds (a thought, a step, a run
   of steps), its chevron turning as it opens. */
.agent .fold > summary {
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 1.5rem;
  cursor: pointer;
  list-style: none;
  border-radius: 6px;
  transition: color 200ms var(--ease-settle);
}
.agent .fold > summary::-webkit-details-marker {
  display: none;
}
.agent .fold > summary:hover {
  color: var(--color-foreground);
}
.agent .fold > summary .chev {
  --glyph: 11px;
  flex-shrink: 0;
  opacity: 0;
  transition:
    opacity 200ms var(--ease-settle),
    rotate 350ms var(--ease-settle);
}
.agent .fold > summary:hover .chev,
.agent .fold[open] > summary .chev {
  opacity: 1;
}
.agent .fold[open] > summary .chev {
  rotate: 90deg;
}
.agent .key:focus-visible,
.agent .row-key:focus-visible,
.agent .fold > summary:focus-visible {
  outline: 2px solid var(--color-ring);
  outline-offset: 1px;
}
@media (prefers-reduced-motion: reduce) {
  .agent .key,
  .agent .fold > summary,
  .agent .fold > summary .chev {
    transition: none;
  }
}
</style>
