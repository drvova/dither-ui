import { createMemo, createSignal, For, Match, onCleanup, onMount, Show, Switch } from "solid-js"
import { createMutable, unwrap } from "solid-js/store"
import { Portal } from "solid-js/web"
import { copyText, DitherIcon, type IconName } from "@dither-ui/kit"
import {
  boundsOf,
  centreOn,
  checkpoint,
  editor,
  restoreCheckpoint,
  restoreFrame,
  selectArtboard,
  selectedArtboard,
  undo,
} from "@/entities/editor"
import { evolveSelected, runCommand } from "@/features/agent"
import type { AcpClient, PromptImage } from "@/features/agent/acp"
import { chats, loadThread, newChat, openProject, saveThread, titleOf } from "@/features/agent/chats"
import { handoff, takeAsk, togglePicked } from "@/features/agent/handoff"
import {
  type AgentActivity,
  type AgentConfig,
  type AgentEvent,
  DEFAULT_BRIDGE_URL,
  loadAgentConfig,
  loadDraft,
  saveAgentConfig,
  saveDraft,
  type Setting,
  type Usage,
} from "@/features/agent/tools"
import { artboardPng } from "@/features/export-image"
import { activeProjectId } from "@/features/persistence"
import BrandMark from "@/shared/ui/BrandMark"
import { isMark } from "@/shared/ui/marks"
import Mascot from "@/shared/ui/Mascot"
import ToolMark from "@/shared/ui/ToolMark"
import {
  barChanges,
  forgotPutBack,
  keptFrame,
  NO_BAR,
  nextTurn,
  putBack,
  restoredTo,
  settledThrough,
  settledTurn,
  undoneFrame,
} from "./model/changes"
import {
  type Attachment,
  attachmentsOf,
  chipOf,
  imagesOf,
  promptText,
  type Queued,
  quoteOf,
  withContext,
} from "./model/compose"
import { enqueued, movedUp, NO_QUEUE, placeholderOf, type Queue, tokensOf, toFront, without } from "./model/composer"
import {
  busyOf,
  type Effect,
  type Fold,
  fold,
  hushed,
  IDLE,
  NO_HARNESS,
  orphaned,
  QUIET,
  runOf,
  running,
  setupOf,
  stopAsked,
  type Stream,
  type Turn,
} from "./model/session"
import { slashList, unknownOf } from "./model/slash"
import type { Changed } from "./model/steps"
import { nextPrompts } from "./model/suggest"
import { type Block, changesOf, type Entry, runLabel, sentOf, threadBlocks, todosOf } from "./model/thread"
import BridgeSetup from "./ui/BridgeSetup"
import Composer, { type ComposerApi, type Editing, type Pops } from "./ui/Composer"
import ThreadEntry from "./ui/ThreadEntry"
import TurnTrays from "./ui/TurnTrays"
import { createApprovals } from "./approvals"
import { createBridge } from "./bridge"
import { watching } from "./watching"
import "./AgentPanel.css"

// The agent panel is a CONTROL PLANE for the harness the user already has.
// One local bridge, one pick: Claude Code, Codex, Gemini CLI, oh-my-pi,
// Goose, OpenCode, or any command that speaks the Agent Client Protocol.
// The harness runs as the user's own signed-in process; the panel is its
// client, set as a composer. This file wires the session (the bridge, the
// turns and their checkpoints, the queue, the approvals) and lays it out:
// the session's states and the fold of the harness's events are
// `model/session.ts`, the changes bar's `model/changes.ts`, the composer's
// `model/composer.ts` and `ui/Composer.tsx`, the thread's entries draw in
// `ui/ThreadEntry.tsx`, the trays over the input in `ui/TurnTrays.tsx`, and
// every reading of the thread is `model/thread.ts`. Nothing here is a key
// or a model setting.
export type AgentPanelApi = { focus: () => void }
export type AgentPanelProps = {
  onClose?: () => void
  onActivity?: (activity: AgentActivity) => void
  ref?: (api: AgentPanelApi) => void
}

// Suggestions for an empty thread.
const STARTERS: { icon: IconName; text: string }[] = [
  { icon: "Layout", text: "A sign-in screen with email, password and a primary button" },
  { icon: "ChartLine", text: "A revenue dashboard: an area chart, three stat cards and a table" },
  { icon: "Dice", text: "Evolve the selected frame into four variants" },
]

type TextEntry = Extract<Entry, { text: string }>
const isAssistant = (e: Entry): e is TextEntry => e.kind === "assistant"

/** After this turn's writes have landed. */
const nextTick = (then: () => void) => queueMicrotask(then)

export default function AgentPanel(props: AgentPanelProps) {
  /* ------------------------------ configuration ----------------------------- */

  // What the page kept comes back once it is a page: a server renders the
  // panel as it first stands (no thread, no draft, the settings as new), and
  // this runs before anything below watches.
  const config = createMutable<AgentConfig>({
    bridgeUrl: DEFAULT_BRIDGE_URL,
    harness: "",
    command: "",
    auto: false,
    follow: false,
  })
  onMount(() => {
    Object.assign(config, loadAgentConfig())
    setTouch(window.matchMedia?.("(pointer: coarse)").matches ?? false)
    if (activeProjectId.value) openProject(activeProjectId.value)
    if (chats.project && chats.active && (chats.project !== loadedFor || chats.active !== loadedChat))
      restore(chats.project, chats.active)
  })
  watching(
    () => config,
    (c) => saveAgentConfig({ ...c }),
    { deep: true },
  )
  /** The menus over the composer besides the field's own. */
  const pops = createMutable<Pops>({ harness: false, settings: false, model: false })

  /* ------------------------------- transcript ------------------------------- */

  /** The message being written, what it carries besides its words (pastes,
   * dropped files, pictures), and a line about what could not come in
   * (declared first: the session restore below brings back the draft). */
  const [input, setInput] = createSignal("")
  const [attachments, setAttachments] = createSignal<Attachment[]>([])
  const [notice, setNotice] = createSignal("")
  watching(input, () => setNotice(""))
  const draft = { text: input, setText: setInput, attachments, setAttachments, notice, setNotice }
  let field: ComposerApi | undefined
  /** The thread: a store, so an entry changed in place (a reply as it
   * streams, a fold opened, a prompt answered) draws again. */
  const thread = createMutable({ entries: [] as Entry[] })
  const [usage, setUsage] = createSignal<Usage>({ input: 0, output: 0 })
  /** The harness's own state as it reports it (modes, model, commands,
   * context, settings). */
  const [harness, setHarness] = createSignal(NO_HARNESS)
  const [lastTurnMs, setLastTurnMs] = createSignal(0)
  /** What streams now (the reply, or the thought), by its place in the thread. */
  const [stream, setStream] = createSignal<Stream>(QUIET)
  /** A setting to one of its values, asked of the harness (which answers
   * with what it now holds). */
  async function setSetting(s: Setting, id: string) {
    const client = acp()
    if (!client || id === s.current) return
    await client.setOption(s.configId, id).catch((e: Error) => push({ kind: "error", text: e.message }))
  }
  /** Newest entry matching a guard (lib is ES2020: no findLast). */
  function lastEntry<T extends Entry>(is: (e: Entry) => e is T): T | undefined {
    for (let i = thread.entries.length - 1; i >= 0; i--) {
      const e = thread.entries[i]
      if (is(e)) return e
    }
    return undefined
  }
  /* The thread follows what arrives only while you read its end: scrolled up,
   * it holds still and a key offers the latest. */
  let log: HTMLDivElement | undefined
  const [atEnd, setAtEnd] = createSignal(true)
  const [unseen, setUnseen] = createSignal(false)
  const onScroll = () => {
    const el = log
    if (!el) return
    setAtEnd(el.scrollHeight - el.scrollTop - el.clientHeight < 32)
    if (atEnd()) setUnseen(false)
  }
  function toEnd(smooth = false) {
    const el = log
    if (!el) return
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? true
    el.scrollTop = el.scrollHeight
    if (smooth && !still) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
    setUnseen(false)
  }
  const scrollLog = (force = false) =>
    nextTick(() => {
      if (force || atEnd()) toEnd()
      else setUnseen(true)
    })
  const push = (e: Entry) => {
    thread.entries.push(e)
    scrollLog()
  }
  const system = (text: string) => push({ kind: "system", text })

  /* ------------------------------ turns and checkpoints ---------------------- */

  /** Each prompt is a turn; the canvas as it stood before it is the turn's
   * checkpoint (kept in memory: a document per turn is too large to save). */
  const [turnNo, setTurnNo] = createSignal(0)
  const checkpoints = new Map<number, string>()
  /** The changes bar: the turns settled, the latest one's frames settled one
   * by one, and the frame just undone, which can be put back. */
  const [bar, setBar] = createSignal(NO_BAR)
  watching(turnNo, () => setBar(nextTurn(bar())))

  // The conversation is the open chat of the active project (`chats`): it
  // follows the project, and the chat picked in the sidebar.
  let loadedFor = ""
  let loadedChat = ""
  /** Entries when last kept: more of them means the chat moved. */
  let keptCount = 0
  function restore(projectId: string, chatId: string) {
    // The chat left keeps what was being written in it.
    if (loadedFor && loadedChat) keepDraft()
    const fresh = loadedChat !== "" && (projectId !== loadedFor || chatId !== loadedChat)
    loadedFor = projectId
    loadedChat = chatId
    const s = loadThread<Entry>(projectId, chatId)
    thread.entries = s?.entries ?? []
    setStream(orphaned(stream(), 0))
    setUsage(s?.usage ?? { input: 0, output: 0 })
    setTurnNo(Math.max(0, ...thread.entries.map((e) => ("turn" in e && e.turn) || 0)))
    checkpoints.clear()
    setBar({ ...bar(), settled: settledThrough(turnNo()) })
    keptCount = thread.entries.length
    setOpened(new Map())
    const kept = loadDraft(projectId, chatId)
    setInput(kept.text)
    setAttachments(attachmentsOf(kept.attachments))
    scrollLog(true)
    // Another chat is another session with the harness.
    const client = acp()
    if (fresh && client?.hello?.agent) {
      setHarness({ ...harness(), context: null })
      client.newSession().catch((e: Error) => push({ kind: "error", text: e.message }))
    }
  }

  const title = createMemo(() => titleOf(thread.entries))
  /** Following the agent: the canvas pans to the frames a step changed (its
   * zoom kept; not while the workbench inspects, which reads at 100%). */
  function follow(frames: Changed[]) {
    if (editor.inspecting) return
    const boxes = editor.artboards.filter((a) => !a.hidden && frames.some((f) => f.id === a.id))
    if (boxes.length) centreOn(boundsOf(boxes))
  }

  /** What the latest turn changed on the canvas, until kept or undone (all at
   * once, or frame by frame). */
  const changes = createMemo(() => barChanges(thread.entries, turnNo(), bar()))
  function settleFrame(id: string) {
    setBar(keptFrame(bar(), id))
    refocus()
  }
  /** One frame back to where the turn found it (one undoable step). */
  function undoFrame(id: string) {
    const c = changes()
    const cp = c && checkpoints.get(c.turn)
    const f = c?.frames.find((x) => x.id === id)
    if (!c || !cp || !f) return
    restoreFrame(cp, id)
    setBar(undoneFrame(bar(), f, checkpoint()))
    refocus()
  }
  /** The frame just undone, as the turn left it: the history's undo of that
   * step, offered only while nothing else changed since. */
  function putFrameBack() {
    const p = bar().putBack
    if (!p || checkpoint() !== p.after) return setBar(forgotPutBack(bar()))
    undo()
    setBar(putBack(bar()))
    refocus()
  }

  function keep() {
    const c = changes()
    if (c) setBar(settledTurn(bar(), c.turn))
    refocus()
  }
  /** The canvas back to where the turn found it (one undoable step). */
  function undoTurn() {
    const c = changes()
    const cp = c && checkpoints.get(c.turn)
    if (!c || !cp) return
    restoreCheckpoint(cp)
    setBar(settledTurn(bar(), c.turn))
    refocus()
    system("Put the canvas back to before that message")
  }
  /** Any earlier turn: the canvas as it stood before its message. */
  function restoreTo(at: number) {
    const cp = checkpoints.get(at)
    if (!cp || busy()) return
    restoreCheckpoint(cp)
    setBar(restoredTo(bar(), at, turnNo()))
    system("Restored the checkpoint")
  }
  const canRestore = (e: Entry) => "turn" in e && !!e.turn && checkpoints.has(e.turn) && !busy()

  /** Your earlier message, taken back to change and send again from there:
   * the later entries leave the thread, the canvas goes back to before it
   * when its checkpoint is kept (`restore`, yours to turn off), and the
   * harness is told it is a revision (its session remembers the rest). */
  const [editing, setEditing] = createSignal<Editing | null>(null)
  function editFrom(at: number) {
    const e = thread.entries[at]
    if (busy() || !e || (e.kind !== "user" && e.kind !== "followup")) return
    const restorable = !!e.turn && checkpoints.has(e.turn)
    setEditing({ at, turn: e.turn ?? 0, was: e.text, restore: restorable, restorable })
    setInput(e.text)
    for (const c of e.context ?? [])
      if (editor.artboards.some((a) => a.id === c.id) && !handoff.picked.includes(c.id)) togglePicked(c.id)
    refocus()
  }
  function cancelEdit() {
    setEditing(null)
    setInput("")
    refocus()
  }
  /** Go back to the message being edited: the canvas (when chosen) and the
   * thread; what the harness reads before the revised message. */
  function rewind(ed: Editing): string {
    const cp = ed.restore ? checkpoints.get(ed.turn) : undefined
    if (cp) restoreCheckpoint(cp)
    thread.entries = thread.entries.slice(0, ed.at)
    setStream(orphaned(stream(), ed.at))
    const first = ed.was.split("\n")[0].slice(0, 80)
    return `I am changing my earlier message ("${first}"); ${cp ? "the canvas is back to how it stood before it" : "the canvas stays as it is now"}. What I want instead:\n\n`
  }

  const todos = createMemo(() => todosOf(thread.entries))

  /** The thread as drawn, runs of steps folded; a run is open while it is the
   * newest thing the harness is doing, or once you open it. */
  const blocks = createMemo(() => threadBlocks(thread.entries))
  /** The blocks by where each starts: the thread draws one row a place and
   * keeps it while the block there stays of its kind. */
  const blockAt = createMemo(() => new Map(blocks().map((b) => [b.at, b])))
  const places = createMemo(() => blocks().map((b) => b.at))
  const [opened, setOpened] = createSignal(new Map<number, boolean>())
  const isOpen = (b: Block) => opened().get(b.at) ?? (busy() && b === blocks()[blocks().length - 1])
  const setOpen = (b: Block, open: boolean) => {
    if (open !== isOpen(b)) setOpened(new Map(opened()).set(b.at, open))
  }
  /** A fold the reader opened or closed (a thought, a step) keeps it. */
  function setFold(e: Entry, open: boolean) {
    if ((e.kind === "thought" || e.kind === "tool") && e.open !== open) e.open = open
  }
  /** Ctrl+O: every step open, or every one closed. */
  let stepsOpen = false
  function toggleSteps() {
    stepsOpen = !stepsOpen
    for (const x of thread.entries) if (x.kind === "tool") x.open = stepsOpen
  }
  watching(
    () => activeProjectId.value,
    (id) => id && openProject(id),
  )
  watching(
    () => `${chats.project}\n${chats.active}`,
    () => {
      const { project, active: chat } = chats
      if (project && chat && (project !== loadedFor || chat !== loadedChat)) restore(project, chat)
    },
  )
  watching(
    () => [thread.entries, usage()] as const,
    () => {
      if (!loadedFor) return
      const kept = unwrap(thread.entries).filter((e) => e.kind !== "approval" || e.answered !== null)
      saveThread(loadedFor, loadedChat, { entries: kept, usage: usage() }, kept.length > keptCount)
      keptCount = kept.length
    },
    { deep: true },
  )

  /* --------------------------------- status --------------------------------- */

  const [turn, setTurn] = createSignal<Turn>(IDLE)
  const busy = () => busyOf(turn())
  const [now, setNow] = createSignal(Date.now())
  let clock: ReturnType<typeof setInterval> | undefined
  /** The reply just copied, by its place in the thread. */
  const [copied, setCopied] = createSignal<number | null>(null)
  let copiedTimer: ReturnType<typeof setTimeout> | undefined
  async function copyReply(at: number, text: string) {
    if (!(await copyText(text))) return
    setCopied(at)
    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => setCopied(null), 1600)
  }

  /* -------------------------------- the bridge ------------------------------ */

  const { conn, acp, hello, harnesses, agent, agentName, nameIt, connect, lookForBridge, disconnect } = createBridge({
    config,
    onEvent: (e) => onEvent(e),
    permission: (req) => askPermission(req),
    approveTool: (tool) => approveTool(tool),
    say: push,
    onLooking: () => scrollLog(true),
    onFound: () => refocus(),
    onBare: () => setHarness(NO_HARNESS),
  })
  /** The mark of who answers, when the site draws one for it. */
  const agentMark = createMemo(() => {
    const id = agent()?.id
    return id && isMark(id) ? id : null
  })

  /** Start a harness by preset id or command line through the bridge. */
  async function start(choice: string | { command: string }) {
    pops.harness = false
    refocus()
    const client = acp() ?? (await connect())
    if (!client) return
    if (typeof choice === "string") {
      config.harness = choice
    } else {
      config.harness = "custom"
      config.command = choice.command
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
    config.harness === "custom" ? (config.command ? { command: config.command } : null) : config.harness || null

  /** Make sure a harness is running: the bridge's own, the saved choice, or ask. */
  async function ready(): Promise<AcpClient | null> {
    const client = acp() ?? (await connect())
    if (!client) return null
    if (client.hello?.agent) return client
    const choice = savedChoice()
    if (!choice) {
      pops.harness = true
      system("pick a harness above")
      return null
    }
    await start(choice)
    return client.hello?.agent ? client : null
  }

  /** The harness's events, folded into the thread and the session
   * (`model/session.ts`); the panel patches the entries that changed, in
   * place, and does what the fold asks besides. */
  const folded = (): Fold => ({
    entries: unwrap(thread.entries),
    stream: stream(),
    turnNo: turnNo(),
    harness: harness(),
    usage: usage(),
    lastTurnMs: lastTurnMs(),
  })
  function commit(next: Fold, effects: readonly Effect[] = []) {
    const raw = unwrap(thread.entries)
    next.entries.forEach((e, i) => {
      if (raw[i] === e) return
      if (i < raw.length) Object.assign(thread.entries[i], e)
      else thread.entries.push(e)
    })
    setStream(next.stream)
    setHarness(next.harness)
    setUsage(next.usage)
    setLastTurnMs(next.lastTurnMs)
    for (const f of effects)
      if (f.kind === "scroll") scrollLog()
      else if (config.follow) follow(f.frames)
  }
  function onEvent(e: AgentEvent) {
    const { state, effects } = fold(folded(), e, Date.now())
    commit(state, effects)
  }

  /* -------------------------------- approvals ------------------------------- */

  const { waiting, askedAt, openApproval, approveTool, askPermission, answer, cancelAll } = createApprovals({
    config,
    thread,
    push,
    agentName,
    refocus: () => refocus(),
  })

  /* One quiet voice for a screen reader: what the turn needs or how it
   * ended, never the stream itself. */
  const [announced, setAnnounced] = createSignal("")
  watching(openApproval, (a) => a && setAnnounced("Needs your answer"))

  /* What the page shows of the agent while the panel is closed. */
  const activity = createMemo<AgentActivity>(() => (waiting() ? "waiting" : busy() ? "working" : "idle"))
  onMount(() => props.onActivity?.(activity()))
  watching(activity, (a) => props.onActivity?.(a))

  /* -------------------------------- composer -------------------------------- */

  /** What Up walks back through (read off the thread, so it survives a reload). */
  const sent = createMemo(() => sentOf(thread.entries))
  /** Messages written while a turn runs, in the order they go, paused after a stop. */
  const [queue, setQueue] = createSignal<Queue>(NO_QUEUE)
  let qn = 0
  const queueOf = (text: string, atts: Attachment[]): Queued => ({ id: `q${++qn}`, text, attachments: atts })
  let controller: AbortController | null = null

  // The unsent message, with what it carries, is kept per chat (closing the
  // panel, a reload, another chat keep it).
  let draftTimer: ReturnType<typeof setTimeout> | undefined
  const keepDraftSoon = () => {
    clearTimeout(draftTimer)
    draftTimer = setTimeout(keepDraft, 250)
  }
  watching(input, keepDraftSoon)
  watching(attachments, keepDraftSoon)
  /** A finger on a touch screen: Enter is a newline there (only the send key
   * sends), and the field never takes focus on its own, which would raise
   * the keyboard over the canvas. */
  const [touch, setTouch] = createSignal(false)
  /** Back to the field after a key elsewhere in the panel did its job. */
  const refocus = () => !touch() && nextTick(() => field?.focus())
  /* The panel is its own keyboard scope: a key pressed in it never reaches
   * the canvas (whose arrows nudge and whose Backspace deletes frames), and a
   * character typed with a key of the panel focused lands in the field. The
   * page's chords (⌘Z, ⌘I) still pass. */
  function onPanelKey(e: KeyboardEvent) {
    if (e.metaKey || e.ctrlKey) return
    e.stopPropagation()
    const t = e.target as HTMLElement
    if (t.closest("input, textarea, select, [contenteditable]") || e.isComposing) return
    if (e.key.length === 1 || e.key === "Backspace") field?.focus()
  }

  /** Ours plus whatever the harness advertises; a harness command is sent to it as text. */
  const slashAll = createMemo(() => slashList(harness().commands))
  /** The field says what sending will do now. */
  const placeholder = createMemo(() =>
    placeholderOf({
      asking: openApproval(),
      stopping: turn().kind === "stopping",
      busy: busy(),
      bridge: !!acp(),
      agent: !!agent(),
    }),
  )
  /** A /word that is no command here, sent as words on a second Enter (a
   * path, say); the first keeps it in the field and says so. */
  let unknownOnce = ""
  function refusesUnknown(text: string): boolean {
    const name = unknownOnce !== text ? unknownOf(text, slashAll()) : null
    unknownOnce = name ? text : ""
    if (!name) return false
    setInput(text)
    nextTick(() => setNotice(`No command /${name} here. Enter again sends it as words; /help lists them.`))
    return true
  }

  async function slash(line: string): Promise<boolean> {
    const [cmd, ...rest] = line.slice(1).trim().split(/\s+/)
    const arg = rest.join(" ").trim()
    const { modes, mode, commands } = harness()
    switch (cmd) {
      case "help":
        system(
          slashAll()
            .map(
              (c) =>
                `/${c.name}${c.args ? ` ${c.args}` : ""}: ${c.desc}${c.harness ? ` (${agentName() || "harness"})` : ""}`,
            )
            .join("\n"),
        )
        return true
      case "harness":
        if (!arg) pops.harness = true
        else await start(harnesses().some((h) => h.id === arg) ? arg : { command: arg })
        return true
      case "connect":
        await connect(arg || config.bridgeUrl)
        if (acp() && !acp()?.hello?.agent) pops.harness = true
        return true
      case "disconnect":
        disconnect()
        system("disconnected")
        return true
      case "new":
        newChat()
        return true
      case "mode": {
        const client = acp()
        if (!client || !modes.length) return (system("the harness has no modes"), true)
        const m = modes.find((x) => x.id === arg || x.name.toLowerCase() === arg.toLowerCase())
        if (!m) return (system(`modes: ${modes.map((x) => x.id).join(", ")}`), true)
        await client.setMode(m.id).catch((e: Error) => push({ kind: "error", text: e.message }))
        system(`mode ${m.name}`)
        return true
      }
      case "auto":
        if (arg === "on" || arg === "off") config.auto = arg === "on"
        system(`auto-approve ${config.auto ? "on" : "off"}`)
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
      case "session": {
        const at = hello()
        system(
          [
            agentName() || "no harness",
            mode,
            `${tokensOf(usage().input)} in / ${tokensOf(usage().output)} out`,
            `${editor.artboards.length} frames`,
            acp()?.sessionId && `acp ${acp()?.sessionId}`,
            at && `cwd ${at.cwd}`,
          ]
            .filter(Boolean)
            .join(", "),
        )
        return true
      }
      case "undo":
        undo()
        system("undone")
        return true
      case "clear":
        thread.entries = []
        setStream(orphaned(stream(), 0))
        setOpened(new Map())
        setUsage({ input: 0, output: 0 })
        setTurnNo(0)
        checkpoints.clear()
        return true
      case "stop":
        stopTurn()
        return true
      default:
        // The harness's own command goes to it as text.
        if (commands.some((c) => c.name === cmd)) return false
        system(`unknown command /${cmd}. Try /help.`)
        return true
    }
  }

  /* --------------------------------- context -------------------------------- */

  /** The frames handed to the agent with the message: the selection (any of
   * it can be left out) and the ones picked with @. */
  const [left, setLeft] = createSignal(new Set<string>())
  watching(
    () => editor.selectedIds.join(),
    () => setLeft(new Set<string>()),
  )
  const context = createMemo<Changed[]>(() => {
    const ids = [...editor.selectedIds.filter((id) => !left().has(id)), ...handoff.picked]
    return [...new Set(ids)]
      .map((id) => editor.artboards.find((a) => a.id === id))
      .filter((a) => !!a)
      .map((a) => ({ id: a.id, name: a.name }))
  })
  function dropContext(id: string) {
    if (handoff.picked.includes(id)) togglePicked(id)
    if (editor.selectedIds.includes(id)) setLeft(new Set(left()).add(id))
  }
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

  /** After a turn that finished on its own, a few next prompts from the
   * frames it touched (else the frames in hand), while the field is empty. */
  const suggestions = createMemo(() => {
    const last = thread.entries[thread.entries.length - 1]
    if (busy() || input() || openApproval() || last?.kind !== "worked" || last.end) return []
    return nextPrompts(changesOf(thread.entries, turnNo())?.frames ?? context())
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
  watching(() => handoff.asks.length, takeAsks)

  /** Send what is in the composer (or `text`, a suggestion or an ask). While
   * the harness works it waits in the queue; `now` stops the turn and sends
   * it next (the protocol has no way into a running turn: a stop and a send
   * is the honest version of steering). */
  async function send(text = input().trim(), now = false) {
    const atts = text === input().trim() ? attachments() : []
    if (!text && !atts.length) return
    // A finger's send puts the keyboard away; a pointer's keeps the field.
    if (touch()) field?.blur()
    else refocus()
    if (text.startsWith("/") && !atts.length) {
      // The second Enter on a refused /word sends it as words.
      const words = unknownOnce === text
      if (refusesUnknown(text)) return
      if (!words) {
        setInput("")
        if (await slash(text)) return
      }
    }
    const client = acp()
    if (imagesOf(atts).length && client && !client.acceptsImages) {
      setNotice(`${agentName() || "This harness"} takes no pictures here: remove them to send`)
      return
    }
    setInput("")
    setAttachments([])
    if (busy()) {
      // Words typed while a permission prompt waits are the answer: it is
      // declined and they go next, in its place.
      const asking = openApproval()
      if (asking && text) {
        answer(asking, asking.options.find((o) => o.reject)?.id ?? null)
        now = true
      }
      const q = queueOf(text, atts)
      setQueue(enqueued(queue(), q, now))
      if (now) sendNow(q.id)
      setAnnounced(now ? "Stopping to send it" : "Queued")
      return
    }
    setQueue({ ...queue(), paused: false })
    const ed = editing()
    setEditing(null)
    await run(text, atts, ed ? rewind(ed) : "")
  }

  /** The latest turn's message, for "Try again" when it failed. */
  let lastSent: { text: string; attachments: Attachment[] } = { text: "", attachments: [] }
  async function run(text: string, atts: Attachment[] = [], revision = "") {
    lastSent = { text, attachments: atts }
    const client = await ready()
    if (!client) {
      setInput(input() ? `${text}\n${input()}` : text)
      setAttachments([...atts, ...attachments()])
      return
    }
    const frames = context()
    setTurnNo(turnNo() + 1)
    checkpoints.set(turnNo(), checkpoint())
    handoff.picked.splice(0)
    handoff.picking = false
    // Whatever the harness said before (while its session opened) is its own
    // entry: this turn's reply starts under its message.
    commit(hushed(folded(), Date.now()))
    const framePictures = client.acceptsImages ? await picturesOf(frames) : []
    const pictures = [
      ...framePictures,
      ...(client.acceptsImages ? imagesOf(atts).map((a) => ({ mimeType: a.mimeType, data: a.data })) : []),
    ]
    push({
      kind: "user",
      text,
      turn: turnNo(),
      context: frames,
      pictured: framePictures.length > 0,
      ...(atts.length ? { attached: atts.map((a) => ({ kind: a.kind, ...chipOf(a) })) } : {}),
    })
    scrollLog(true)
    const started = Date.now()
    setTurn(running(started))
    setNow(started)
    clock = setInterval(() => setNow(Date.now()), 1000)
    controller = new AbortController()
    const { stopReason } = await client.prompt(
      revision + withContext(promptText(text, atts), frames, pictures.length),
      controller.signal,
      pictures,
    )
    clearInterval(clock)
    setTurn(IDLE)
    controller = null
    commit(hushed(folded(), Date.now()))
    const end = stopReason === "cancelled" ? "stopped" : stopReason === "error" ? "failed" : undefined
    setAnnounced(end === "stopped" ? "Stopped" : end === "failed" ? "Failed" : "Done")
    push({ kind: "worked", ms: Date.now() - started, ...(end ? { end } : {}) })
    // Follow-ups run one at a time, in order, each its own turn; a stop pauses
    // them (a Send now stops on purpose and goes on).
    if (end === "stopped" && !sendingNow) setQueue({ ...queue(), paused: true })
    sendingNow = false
    if (!queue().paused) await runNext()
  }

  /** The next queued message, as its own turn. */
  async function runNext() {
    const [next, ...rest] = queue().items
    if (!next) return
    setQueue({ ...queue(), items: rest })
    await run(next.text, next.attachments)
  }
  /** Try again after a failed turn: the same words and what they carried. */
  function againLast() {
    if (busy() || !lastSent.text) return
    void run(lastSent.text, lastSent.attachments)
  }
  let sendingNow = false
  /** Send a queued message now: to the front, and a running turn stops for it. */
  function sendNow(id: string) {
    const q = toFront(queue(), id)
    if (!q) return
    setQueue(q)
    if (busy()) {
      sendingNow = true
      stopTurn()
    } else void runNext()
  }
  /** Take a queued message back into the composer, to change and send again. */
  function editQueued(id: string) {
    const q = queue().items.find((x) => x.id === id)
    if (!q) return
    setQueue(without(queue(), id))
    setInput(input() ? `${q.text}\n${input()}` : q.text)
    setAttachments([...q.attachments, ...attachments()])
    refocus()
  }
  /** Go on with a paused queue. */
  function resume() {
    setQueue({ ...queue(), paused: false })
    if (!busy()) void runNext()
  }
  function unqueue() {
    const items = queue().items
    if (items.length) editQueued(items[items.length - 1].id)
  }

  /** A stop the harness has not answered in a while: the tray offers to stop
   * the harness itself (the bridge ends its process, which ends the turn). */
  function forceStop() {
    acp()?.stop()
    refocus()
  }
  /** Stop the turn. The queue stays, paused (Send next or a new message goes on). */
  function stopTurn() {
    cancelAll()
    setTurn(stopAsked(turn(), Date.now()))
    controller?.abort()
  }

  /* Quoting the harness's reply: a selection inside a reply shows a Quote key
   * beside it; each reply's own Quote key takes all of it. */
  const [quoteAt, setQuoteAt] = createSignal<{ x: number; y: number; text: string } | null>(null)
  function quote(text: string) {
    if (!text.trim()) return
    setAttachments([...attachments(), quoteOf(text)])
    setQuoteAt(null)
    window.getSelection()?.removeAllRanges()
    refocus()
  }
  function onSelection() {
    const sel = window.getSelection()
    const text = sel?.toString().trim() ?? ""
    const range = text && sel?.rangeCount ? sel.getRangeAt(0) : null
    const at = range?.commonAncestorContainer
    const el = at instanceof Element ? at : (at?.parentElement ?? null)
    if (!range || !el?.closest(".agent .reply") || !log?.contains(el)) {
      setQuoteAt(null)
      return
    }
    const r = range.getBoundingClientRect()
    setQuoteAt({ x: Math.round(r.right), y: Math.round(r.top), text })
  }

  async function pickModel(id: string) {
    pops.model = false
    refocus()
    const client = acp()
    if (!client || id === harness().model?.current) return
    await client.setModel(id).catch((e: Error) => push({ kind: "error", text: e.message }))
  }

  function keepDraft() {
    if (loadedFor && loadedChat) saveDraft(loadedFor, loadedChat, { text: input(), attachments: attachments() })
  }
  onMount(() => {
    document.addEventListener("selectionchange", onSelection)
    takeAsks()
    window.addEventListener("pagehide", keepDraft)
    refocus()
    onCleanup(() => {
      document.removeEventListener("selectionchange", onSelection)
      window.removeEventListener("pagehide", keepDraft)
      clearTimeout(draftTimer)
      clearTimeout(copiedTimer)
      keepDraft()
      controller?.abort()
      clearInterval(clock)
      disconnect()
    })
  })
  props.ref?.({ focus: refocus })

  const empty = () => !thread.entries.length && setupOf(conn()) === "none"
  /** The entry streaming now, by its place. */
  const streaming = (at: number) => {
    const s = stream()
    return s.kind !== "quiet" && s.at === at
  }

  return (
    <div class={`agent-panel-scope agent${empty() ? " is-empty" : ""}`} on:keydown={onPanelKey}>
      <div class="head">
        <span class="who" aria-hidden="true">
          <Show when={agentMark()} fallback={<BrandMark size={12} />}>
            {(id) => <ToolMark id={id()} size={12} />}
          </Show>
        </span>
        <span class="title row-label" title={title()}>
          {title()}
        </span>
        <button type="button" class="head-btn" aria-label="New chat" title="New chat" onClick={() => slash("/new")}>
          <DitherIcon name="Edit" size={13} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          class="head-btn"
          aria-label="Close the chat"
          title="Close the chat"
          onClick={() => props.onClose?.()}
        >
          <DitherIcon name="Close" size={13} strokeWidth={1.5} />
        </button>
      </div>

      <p class="sr-only" role="status">
        {announced()}
      </p>
      <Portal>
        <Show when={quoteAt()}>
          {(at) => (
            <button
              type="button"
              class="agent-quote"
              style={{ left: `${at().x}px`, top: `${at().y}px` }}
              title="Quote the selection in your message"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => quote(at().text)}
            >
              <DitherIcon name="Bookmark" size={11} strokeWidth={1.5} />
              <span>Quote</span>
            </button>
          )}
        </Show>
      </Portal>
      <div ref={(el) => (log = el)} class="log" onScroll={onScroll}>
        <Show when={empty()}>
          <div class="hello">
            <span class="hello-mark" aria-hidden="true">
              <Show when={agentMark()} fallback={<Mascot size={30} alive />}>
                {(id) => <ToolMark id={id()} size={26} />}
              </Show>
            </span>
            <h2 class="hello-title">What are we making?</h2>
            <p class="hello-note">
              {agentName() || "Your harness"} builds it on the canvas from the kit's registry. Every message keeps a
              checkpoint to go back to.
            </p>
          </div>
        </Show>
        <For each={places()}>
          {(at) => {
            const block = () => blockAt().get(at)
            const one = () => {
              const b = block()
              return b?.kind === "entry" ? b : undefined
            }
            const steps = () => {
              const b = block()
              return b?.kind === "steps" ? b : undefined
            }
            return (
              <Switch>
                <Match when={one()}>
                  {(b) => (
                    <ThreadEntry
                      entry={b().entry}
                      live={streaming(at)}
                      copied={copied() === at}
                      restorable={canRestore(b().entry)}
                      editable={!busy() && (b().entry.kind === "user" || b().entry.kind === "followup")}
                      latest={!busy() && at === thread.entries.length - 1}
                      numbered={b().entry === openApproval()}
                      onAgain={againLast}
                      onContinue={() => send("Continue")}
                      onRestore={() => {
                        const e = b().entry
                        if ("turn" in e && e.turn) restoreTo(e.turn)
                      }}
                      onEdit={() => editFrom(at)}
                      onQuote={() => {
                        const e = b().entry
                        if ("text" in e) quote(e.text)
                      }}
                      onCopy={() => {
                        const e = b().entry
                        if ("text" in e) void copyReply(at, e.text)
                      }}
                      onAnswer={(id) => {
                        const e = b().entry
                        if (e.kind === "approval") answer(e, id)
                      }}
                      onToggle={(open) => setFold(b().entry, open)}
                    />
                  )}
                </Match>
                <Match when={steps()}>
                  {(b) => (
                    <details
                      class="group fold"
                      open={isOpen(b())}
                      onToggle={(e) => setOpen(b(), (e.target as HTMLDetailsElement).open)}
                    >
                      <summary class="first-line">
                        <Show when={b().running} fallback={<DitherIcon name="Layers" size={12} strokeWidth={1.5} />}>
                          <span class="spin" aria-hidden="true"></span>
                        </Show>
                        <span class="row-label is-wrap">{runLabel(b().items.map((it) => it.entry))}</span>
                        <DitherIcon class="chev" name="ChevronRight" size={11} strokeWidth={1.5} />
                      </summary>
                      <div class="group-body">
                        <For each={b().items.map((it) => it.entry)}>
                          {(entry) => <ThreadEntry entry={entry} onToggle={(open) => setFold(entry, open)} />}
                        </For>
                      </div>
                    </details>
                  )}
                </Match>
              </Switch>
            )
          }}
        </For>
        <Show when={setupOf(conn()) !== "none"}>
          <BridgeSetup looking={setupOf(conn()) === "looking"} url={config.bridgeUrl} onLook={lookForBridge} />
        </Show>
      </div>

      <div class="dock">
        <Show when={unseen()}>
          <button type="button" class="latest" onClick={() => toEnd(true)}>
            <DitherIcon name="ArrowDown" size={11} strokeWidth={1.5} />
            Latest
          </button>
        </Show>
        <Composer
          draft={draft}
          config={config}
          pops={pops}
          placeholder={placeholder()}
          busy={busy()}
          stoppable={busy() || waiting() > 0}
          touch={touch()}
          agentName={agentName()}
          bridgeOpen={!!acp()}
          hello={hello()}
          connecting={conn().kind === "connecting"}
          harness={harness()}
          usage={usage()}
          lastTurnMs={lastTurnMs()}
          commands={slashAll()}
          context={context()}
          editing={editing()}
          sent={sent()}
          queue={queue()}
          asking={openApproval()}
          askedAt={askedAt}
          roomTop={() => log?.getBoundingClientRect().top}
          ref={(api) => (field = api)}
          refocus={refocus}
          onSend={(text, now) => void send(text, now)}
          onAnswer={answer}
          onResume={resume}
          onUnqueue={unqueue}
          onStop={stopTurn}
          onCancelEdit={cancelEdit}
          onEditing={setEditing}
          onToggleSteps={toggleSteps}
          onDropContext={dropContext}
          onConnect={() => void connect()}
          onStart={(choice) => void start(choice)}
          onStopHarness={() => acp()?.stop()}
          onModel={(id) => void pickModel(id)}
          onSetting={(s, id) => void setSetting(s, id)}
          onMode={(id) => void slash(`/mode ${id}`)}
          trays={
            <TurnTrays
              next={suggestions()}
              todos={todos()}
              queue={queue().items}
              paused={queue().paused}
              run={runOf(turn(), stream(), now())}
              changes={changes()}
              putBack={bar().putBack?.name ?? null}
              shown={(id) => editor.artboards.some((a) => a.id === id)}
              onStop={stopTurn}
              onForceStop={forceStop}
              onUnqueue={(id) => setQueue(without(queue(), id))}
              onEditQueued={editQueued}
              onSendNow={sendNow}
              onMoveUp={(id) => setQueue(movedUp(queue(), id))}
              onClearQueue={() => setQueue(NO_QUEUE)}
              onResume={resume}
              onUndo={undoTurn}
              onKeep={keep}
              onUndoFrame={undoFrame}
              onKeepFrame={settleFrame}
              onPutBack={putFrameBack}
              onShow={(id) => selectArtboard(id)}
              onAsk={(s) => send(s)}
            />
          }
        />
      </div>

      <Show when={empty()}>
        <div class="starters">
          <For each={STARTERS}>
            {(s) => (
              <button type="button" class="starter" onClick={() => send(s.text)}>
                <DitherIcon name={s.icon} size={12} strokeWidth={1.5} />
                <span>{s.text}</span>
              </button>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}
