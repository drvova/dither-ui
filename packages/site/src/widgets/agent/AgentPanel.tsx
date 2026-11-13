import { createMemo, createSignal, For, Match, onCleanup, onMount, Show, Switch, untrack } from "solid-js"
import { createMutable, unwrap } from "solid-js/store"
import { Portal } from "solid-js/web"
import { copyText, DitherIcon, type IconName } from "@dither-ui/kit"
import { artboardPng } from "@/features/export-image"
import { isMark } from "@/shared/ui/marks"
import {
  type Attachment,
  attachmentsOf,
  chipOf,
  foldsPaste,
  imagesOf,
  intake,
  moved,
  pastedText,
  promptText,
  type Queued,
  quoteOf,
  withContext,
} from "@/widgets/agent/model/compose"
import { hintOf, type Slash, slashList, unknownOf } from "./model/slash"
import { nextPrompts } from "./model/suggest"
import { boundsOf, centreOn, editor, selectArtboard, selectedArtboard, watch } from "@/entities/editor"
import { evolveSelected, runCommand } from "@/features/agent"
import {
  type AcpClient,
  type AcpPermissionRequest,
  type BridgeHello,
  connectAcp,
  modelName,
  NoBridge,
  type PromptImage,
} from "@/features/agent/acp"
import { chats, loadThread, newChat, openProject, saveThread, titleOf } from "@/features/agent/chats"
import type { Built } from "@/features/agent/dither"
import { handoff, takeAsk, togglePicked } from "@/features/agent/handoff"
import {
  type AgentActivity,
  type AgentCommand,
  type AgentConfig,
  type AgentEvent,
  type ContextUse,
  DEFAULT_BRIDGE_URL,
  loadAgentConfig,
  loadDraft,
  type Mode,
  type ModelChoice,
  saveAgentConfig,
  saveDraft,
  type Setting,
  type Usage,
} from "@/features/agent/tools"
import { checkpoint, restoreCheckpoint, restoreFrame, undo } from "@/features/history"
import { activeProjectId } from "@/features/persistence"
import { modKey } from "@/shared/lib"
import BrandMark from "@/shared/ui/BrandMark"
import Mascot from "@/shared/ui/Mascot"
import ToolMark from "@/shared/ui/ToolMark"
import { askTitle, type Changed } from "./model/steps"
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
import BridgeSetup from "./ui/BridgeSetup"
import Attached from "./ui/Attached"
import ContextMeter from "./ui/ContextMeter"
import ThreadEntry from "./ui/ThreadEntry"
import TurnTrays from "./ui/TurnTrays"
import "./AgentPanel.css"

// The agent panel is a CONTROL PLANE for the harness the user already has.
// One local bridge, one pick: Claude Code, Codex, Gemini CLI, oh-my-pi,
// Goose, OpenCode, or any command that speaks the Agent Client Protocol.
// The harness runs as the user's own signed-in process; the panel is its
// client, set as a composer. This file holds the session (the bridge, the
// turns and their checkpoints, the queue, the context) and lays it out; the
// thread's entries draw in `ui/ThreadEntry.tsx`, the trays over the input in
// `ui/TurnTrays.tsx`, and every reading of the thread is `model/thread.ts`.
// Nothing here is a key or a model setting.
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
type PlanEntry = Extract<Entry, { kind: "plan" }>
type Thought = Extract<Entry, { kind: "thought" }>
type Approval = Extract<Entry, { kind: "approval" }>
type Reply = { kind: "assistant"; text: string }
type Editing = { at: number; turn: number; was: string; restore: boolean; restorable: boolean }
const isPlan = (e: Entry): e is PlanEntry => e.kind === "plan"
const isAssistant = (e: Entry): e is TextEntry => e.kind === "assistant"

/** After this turn's writes have landed. */
const nextTick = (then: () => void) => queueMicrotask(then)

export default function AgentPanel(props: AgentPanelProps) {
  /** A watcher over a getter: `changed` some time after the
   * value it returns has changed (with `deep`, anything under it), once for
   * every write of a turn, never for the first read. */
  function watching<T>(source: () => T, changed: (value: T) => void, opts: { deep?: boolean } = {}) {
    let was: T
    onMount(() => (was = untrack(source)))
    onCleanup(
      watch(
        source,
        () => {
          const value = untrack(source)
          if (!opts.deep && Object.is(value, was)) return
          was = value
          changed(value)
        },
        opts,
      ),
    )
  }

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
    setCustomCommand(config.command)
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
  const [menuOpen, setMenuOpen] = createSignal(false)

  /* ------------------------------- transcript ------------------------------- */

  /** The message being written, and its field (declared first: the session
   * restore below brings back the project's draft). */
  const [input, setInput] = createSignal("")
  /** What the message carries besides its words (pastes, dropped files,
   * pictures), and a line about what could not come in. */
  const [attachments, setAttachments] = createSignal<Attachment[]>([])
  const [notice, setNotice] = createSignal("")
  watching(input, () => setNotice(""))
  let box: HTMLTextAreaElement | undefined
  /** The thread: a store, so an entry changed in place (a reply as it
   * streams, a fold opened, a prompt answered) draws again. */
  const thread = createMutable({ entries: [] as Entry[] })
  const [usage, setUsage] = createSignal<Usage>({ input: 0, output: 0 })
  /** The harness's other choice settings (effort, thinking, ...), as it reports them. */
  const [settings, setSettings] = createSignal<Setting[]>([])
  /** A setting to one of its values, asked of the harness (which answers
   * with what it now holds). */
  async function setSetting(s: Setting, id: string) {
    const client = acp()
    if (!client || id === s.current) return
    await client.setOption(s.configId, id).catch((e: Error) => push({ kind: "error", text: e.message }))
  }
  /** How full the harness says its context is (none until it reports). */
  const [contextUse, setContextUse] = createSignal<ContextUse | null>(null)
  /** The newest entry, as the thread holds it. */
  const newest = () => thread.entries[thread.entries.length - 1]
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
  const [turn, setTurn] = createSignal(0)
  const checkpoints = new Map<number, string>()
  /** Turns whose changes were kept (or undone): their bar is gone. */
  const [settled, setSettled] = createSignal(new Set<number>())

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
    setUsage(s?.usage ?? { input: 0, output: 0 })
    setTurn(Math.max(0, ...thread.entries.map((e) => ("turn" in e && e.turn) || 0)))
    checkpoints.clear()
    setSettled(new Set(Array.from({ length: turn() + 1 }, (_, i) => i)))
    keptCount = thread.entries.length
    setOpened(new Map())
    const draft = loadDraft(projectId, chatId)
    setInput(draft.text)
    setAttachments(attachmentsOf(draft.attachments))
    scrollLog(true)
    // Another chat is another session with the harness.
    const client = acp()
    if (fresh && client?.hello?.agent) {
      setContextUse(null)
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

  /** The latest turn's frames settled one by one (kept or undone), and the
   * one just undone, which can be put back until the canvas changes again. */
  const [settledFrames, setSettledFrames] = createSignal(new Set<string>())
  const [putBack, setPutBack] = createSignal<{ id: string; name: string; after: string } | null>(null)
  watching(turn, () => {
    setSettledFrames(new Set<string>())
    setPutBack(null)
  })
  /** What the latest turn changed on the canvas, until kept or undone (all at
   * once, or frame by frame). */
  const changes = createMemo(() => {
    if (!turn() || settled().has(turn())) return null
    const c = changesOf(thread.entries, turn())
    if (!c) return null
    const frames = c.frames.filter((f) => !settledFrames().has(f.id))
    return frames.length || putBack() ? { ...c, frames } : null
  })
  function settleFrame(id: string) {
    setSettledFrames(new Set(settledFrames()).add(id))
    setPutBack(null)
    refocus()
  }
  /** One frame back to where the turn found it (one undoable step). */
  function undoFrame(id: string) {
    const c = changes()
    const cp = c && checkpoints.get(c.turn)
    const f = c?.frames.find((x) => x.id === id)
    if (!c || !cp || !f) return
    restoreFrame(cp, id)
    setSettledFrames(new Set(settledFrames()).add(id))
    setPutBack({ id, name: f.name, after: checkpoint() })
    refocus()
  }
  /** The frame just undone, as the turn left it: the history's undo of that
   * step, offered only while nothing else changed since. */
  function putFrameBack() {
    const p = putBack()
    setPutBack(null)
    if (!p || checkpoint() !== p.after) return
    undo()
    const left = new Set(settledFrames())
    left.delete(p.id)
    setSettledFrames(left)
    refocus()
  }

  function keep() {
    const c = changes()
    if (c) setSettled(new Set(settled()).add(c.turn))
    refocus()
  }
  /** The canvas back to where the turn found it (one undoable step). */
  function undoTurn() {
    const c = changes()
    const cp = c && checkpoints.get(c.turn)
    if (!c || !cp) return
    restoreCheckpoint(cp)
    setSettled(new Set(settled()).add(c.turn))
    refocus()
    system("Put the canvas back to before that message")
  }
  /** Any earlier turn: the canvas as it stood before its message. */
  function restoreTo(at: number) {
    const cp = checkpoints.get(at)
    if (!cp || busy()) return
    restoreCheckpoint(cp)
    setSettled(new Set([...settled(), ...Array.from({ length: turn() - at + 1 }, (_, i) => at + i)]))
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

  const [busy, setBusy] = createSignal(false)
  /** A stop asked for and not yet answered by the harness (declared here:
   * the field's placeholder reads it). */
  const [stopping, setStopping] = createSignal(false)
  const [started, setStarted] = createSignal(0)
  const [now, setNow] = createSignal(Date.now())
  let clock: ReturnType<typeof setInterval> | undefined
  const elapsed = createMemo(() => (busy() ? Math.max(0, now() - started()) : 0))
  const [lastTurnMs, setLastTurnMs] = createSignal(0)
  const fmtTokens = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k` : String(n))
  const fmtMs = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`)
  /** The folder's own name out of a path, either separator. */
  const folderOf = (path: string) => path.split(/[\\/]/).filter(Boolean).pop() ?? path
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

  const [acp, setAcp] = createSignal<AcpClient | null>(null)
  const [hello, setHello] = createSignal<BridgeHello | null>(null)
  const [connecting, setConnecting] = createSignal(false)
  const harnesses = createMemo(() => hello()?.harnesses ?? [])
  const agent = createMemo(() => hello()?.agent ?? null)
  /** The mark of who answers, when the site draws one for it. */
  const agentMark = createMemo(() => {
    const id = agent()?.id
    return id && isMark(id) ? id : null
  })
  /** Who answers, as a person reads it: a harness picked from the bridge's
   * list goes by that name (Claude Code, not its adapter's package), any
   * other command by the name it introduced itself with. */
  const [agentName, setAgentName] = createSignal("")
  const nameIt = () =>
    setAgentName(
      (agent() && harnesses().find((h) => h.id === agent()?.id)?.name) || acp()?.agent || agent()?.name || "",
    )
  const [modes, setModes] = createSignal<Mode[]>([])
  const [mode, setMode] = createSignal("")
  /** The model the harness runs, as its session says; switched only among
   * the harness's own. */
  const [model, setModel] = createSignal<ModelChoice | null>(null)
  const [modelOpen, setModelOpen] = createSignal(false)
  const [commands, setCommands] = createSignal<AgentCommand[]>([])
  const [pickerOpen, setPickerOpen] = createSignal(false)
  const [customCommand, setCustomCommand] = createSignal(config.command)

  /** No bridge answered: the chat shows how to start it while the panel
   * looks again every few seconds ("looking"), for a while ("stopped"
   * after), until one answers ("none" again). */
  const [setup, setSetup] = createSignal<"none" | "looking" | "stopped">("none")
  const LOOK_EVERY = 2500
  const LOOK_FOR = 5 * 60_000
  let lookTimer: ReturnType<typeof setInterval> | undefined
  function stopLooking(next: "none" | "stopped") {
    clearInterval(lookTimer)
    lookTimer = undefined
    setSetup(next)
  }
  function lookForBridge() {
    setSetup("looking")
    scrollLog(true)
    clearInterval(lookTimer)
    const until = Date.now() + LOOK_FOR
    lookTimer = setInterval(async () => {
      if (acp()) return stopLooking("none")
      if (Date.now() > until) return stopLooking("stopped")
      if (await connect(config.bridgeUrl, true)) {
        stopLooking("none")
        system("bridge connected")
        refocus()
      }
    }, LOOK_EVERY)
  }

  /** Open the bridge at `url`. When none answers, the setup shows and the
   * panel keeps looking; a `quiet` try (one of those looks) says nothing. */
  async function connect(url = config.bridgeUrl, quiet = false): Promise<AcpClient | null> {
    const open = acp()
    if (open) return open
    if (connecting()) return null
    setConnecting(true)
    config.bridgeUrl = url
    try {
      const client = await connectAcp({
        url,
        onEvent,
        permission: askPermission,
        approveTool,
        onHello: (h) => {
          setHello(h)
          if (!h.agent) {
            setModes([])
            setMode("")
            setModel(null)
            setCommands([])
            setContextUse(null)
            setSettings([])
          }
          nameIt()
        },
        onClose: () => {
          if (acp()) system("bridge closed")
          setAcp(null)
          setHello(null)
        },
      })
      setAcp(client)
      if (setup() !== "none") stopLooking("none")
      nameIt()
      return client
    } catch (e) {
      if (e instanceof NoBridge) {
        if (!quiet && setup() !== "looking") lookForBridge()
      } else if (!quiet) push({ kind: "error", text: e instanceof Error ? e.message : String(e) })
      return null
    } finally {
      setConnecting(false)
    }
  }

  /** Start a harness by preset id or command line through the bridge. */
  async function start(choice: string | { command: string }) {
    setPickerOpen(false)
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
      setPickerOpen(true)
      system("pick a harness above")
      return null
    }
    await start(choice)
    return client.hello?.agent ? client : null
  }

  function disconnect() {
    acp()?.close()
    setAcp(null)
    setHello(null)
  }

  /** The reply streaming now, as the thread holds it. */
  const [live, setLive] = createSignal<Reply | null>(null)
  /** The thought streaming now, and when it began. */
  const [thinking, setThinking] = createSignal<Thought | null>(null)
  let thoughtAt = 0
  /** Anything else the harness does ends its thought. */
  function endThought() {
    const t = thinking()
    if (!t) return
    t.ms = Date.now() - thoughtAt
    t.open = false
    setThinking(null)
  }

  function onEvent(e: AgentEvent) {
    if (e.type !== "thought" && e.type !== "mode" && e.type !== "commands" && e.type !== "plan") endThought()
    switch (e.type) {
      case "thought": {
        setLive(null)
        let t = thinking()
        if (!t) {
          thoughtAt = Date.now()
          thread.entries.push({ kind: "thought", text: "", open: true })
          t = newest() as Thought
          setThinking(t)
        }
        t.text += e.text
        scrollLog()
        break
      }
      case "delta": {
        let reply = live()
        if (!reply) {
          thread.entries.push({ kind: "assistant", text: "" })
          reply = newest() as Reply
          setLive(reply)
        }
        reply.text += e.text
        scrollLog()
        break
      }
      case "assistant": {
        const reply = live()
        if (reply) reply.text = e.text
        else push({ kind: "assistant", text: e.text })
        setLive(null)
        break
      }
      case "tool": {
        setLive(null)
        const step = toolEntry(e.name, e.args, e.result, turn(), e.built)
        push(step)
        if (config.follow && step.kind === "tool" && step.changed?.length) follow(step.changed)
        break
      }
      case "activity": {
        setLive(null)
        const existing = thread.entries.find(
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
        setMode(e.current)
        if (e.modes.length) setModes(e.modes)
        break
      case "model":
        setModel(e.model)
        break
      case "commands":
        setCommands(e.commands)
        break
      case "context":
        setContextUse(e.context)
        break
      case "settings":
        setSettings(e.settings)
        break
      case "turn":
        setLastTurnMs(e.elapsedMs)
        if (e.usage) setUsage({ input: usage().input + e.usage.input, output: usage().output + e.usage.output })
        break
      case "error":
        setLive(null)
        push({ kind: "error", text: e.message })
        break
      case "stopped":
        setLive(null)
        break
      case "done":
        setLive(null)
        break
    }
  }

  /* -------------------------------- approvals ------------------------------- */

  /** Every open permission prompt and how it is settled, keyed by its own
   * transcript entry: two prompts at once are each answered on their row. */
  const pending = new Map<Approval, (id: string | null) => void>()
  /** How many of them wait (the map itself tells nothing when it changes). */
  const [waiting, setWaiting] = createSignal(0)

  function ask(
    title: string,
    options: { id: string; label: string; primary?: boolean; reject?: boolean }[],
    code?: string,
  ): Promise<string | null> {
    askedAt = Date.now()
    push({ kind: "approval", title, options, answered: null, ...(code ? { code } : {}) })
    const entry = newest() as Approval
    return new Promise((resolve) => {
      pending.set(unwrap(entry), (id) => {
        entry.answered = id ?? "cancelled"
        pending.delete(unwrap(entry))
        setWaiting(pending.size)
        resolve(id)
      })
      setWaiting(pending.size)
    })
  }

  /** A tool the harness built runs only when you say so, every time: its
   * code is on the prompt, and Auto never answers it. */
  const approveTool = async (tool: Built): Promise<boolean> =>
    (await ask(
      `Run ${tool.name.replace(/_/g, " ")}, a tool ${agentName() || "your harness"} built`,
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
    if (config.auto) return options.find((o) => o.primary)?.id ?? options[0]?.id ?? null
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
  const openApproval = createMemo(() => {
    for (let i = thread.entries.length - 1; i >= 0; i--) {
      const e = thread.entries[i]
      if (e.kind === "approval" && e.answered === null) return e
    }
    return null
  })

  /* One quiet voice for a screen reader: what the turn needs or how it
   * ended, never the stream itself. */
  const [announced, setAnnounced] = createSignal("")
  watching(openApproval, (a) => a && setAnnounced("Needs your answer"))

  /* What the page shows of the agent while the panel is closed. */
  const activity = createMemo<AgentActivity>(() => (waiting() ? "waiting" : busy() ? "working" : "idle"))
  onMount(() => props.onActivity?.(activity()))
  watching(activity, (a) => props.onActivity?.(a))

  function answer(entry: Approval, id: string | null) {
    pending.get(unwrap(entry))?.(id)
    refocus()
  }

  /* -------------------------------- composer -------------------------------- */

  /* Up walks back through what was sent (read off the thread, so it survives
   * a reload), only from an empty field; editing a recalled message makes it
   * a draft again; Down past the newest empties the field. */
  const sent = createMemo(() => sentOf(thread.entries))
  let cursor = -1
  watching(input, (text) => {
    if (cursor !== -1 && text !== sent()[cursor]) cursor = -1
  })
  /** Messages written while a turn runs, in the order they go; `paused`
   * after a stop, until you send one or press Send next. */
  const [followUps, setFollowUps] = createSignal<Queued[]>([])
  const [paused, setPaused] = createSignal(false)
  let qn = 0
  const queueOf = (text: string, atts: Attachment[]): Queued => ({ id: `q${++qn}`, text, attachments: atts })
  let controller: AbortController | null = null
  let toolsOpen = false

  /* The field grows with what is typed, up to a cap, then scrolls. */
  const FIELD_MAX = 176
  function fit() {
    const el = box
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, FIELD_MAX)}px`
  }
  watching(input, () => nextTick(fit))
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
  const refocus = () => !touch() && nextTick(() => box?.focus())
  /** iPad Safari ends a composition and then delivers its Enter as a key of
   * its own: an Enter this soon after a composition ended is the
   * composition's. */
  let composedAt = 0
  /** The field's words come in once a composition has ended, never while
   * it runs. */
  const onCompositionEnd = (e: CompositionEvent) => {
    composedAt = Date.now()
    setInput((e.currentTarget as HTMLTextAreaElement).value)
  }
  const onInput = (e: InputEvent & { currentTarget: HTMLTextAreaElement }) => {
    if (!e.isComposing) setInput(e.currentTarget.value)
  }
  /* The panel is its own keyboard scope: a key pressed in it never reaches
   * the canvas (whose arrows nudge and whose Backspace deletes frames), and a
   * character typed with a key of the panel focused lands in the field. The
   * page's chords (⌘Z, ⌘I) still pass. */
  function onPanelKey(e: KeyboardEvent) {
    if (e.metaKey || e.ctrlKey) return
    e.stopPropagation()
    const t = e.target as HTMLElement
    if (t.closest("input, textarea, select, [contenteditable]") || e.isComposing) return
    if (e.key.length === 1 || e.key === "Backspace") box?.focus()
  }

  /** Ours plus whatever the harness advertises; a harness command is sent to it as text. */
  const slashAll = createMemo(() => slashList(commands()))
  /** The field says what sending will do now. */
  const placeholder = createMemo(() => {
    const asking = openApproval()
    return asking
      ? `Answer 1 to ${Math.min(9, asking.options.length)}, or redirect`
      : stopping()
        ? "Queue for after the stop"
        : busy()
          ? "Queue a follow-up"
          : !acp()
            ? "Ask; this starts the bridge"
            : !agent()
              ? "Ask; this starts your harness"
              : "Ask, / for commands"
  })
  /** Esc puts the command menu away until the field changes. */
  const [slashDismissed, setSlashDismissed] = createSignal(false)
  watching(input, () => setSlashDismissed(false))
  const slashOpen = createMemo(() => !slashDismissed() && /^\/[\w-]*$/.test(input()))
  const slashMatches = createMemo(() => {
    const q = input().slice(1).toLowerCase()
    return slashAll().filter((c) => c.name.startsWith(q))
  })
  const [slashIndex, setSlashIndex] = createSignal(0)
  watching(slashMatches, () => setSlashIndex(0))
  /** A command picked and waiting for what it takes: what that is, in words. */
  const slashHint = createMemo(() => hintOf(input(), slashAll()))
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
        if (!arg) setPickerOpen(true)
        else await start(harnesses().some((h) => h.id === arg) ? arg : { command: arg })
        return true
      case "connect":
        await connect(arg || config.bridgeUrl)
        if (acp() && !acp()?.hello?.agent) setPickerOpen(true)
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
        if (!client || !modes().length) return (system("the harness has no modes"), true)
        const m = modes().find((x) => x.id === arg || x.name.toLowerCase() === arg.toLowerCase())
        if (!m)
          return (
            system(
              `modes: ${modes()
                .map((x) => x.id)
                .join(", ")}`,
            ),
            true
          )
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
            mode(),
            `${fmtTokens(usage().input)} in / ${fmtTokens(usage().output)} out`,
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
        setOpened(new Map())
        setUsage({ input: 0, output: 0 })
        setTurn(0)
        checkpoints.clear()
        return true
      case "stop":
        stop()
        return true
      default:
        // The harness's own command goes to it as text.
        if (commands().some((c) => c.name === cmd)) return false
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

  /* The @ picker: typed at a word's start, or opened from the card's @ key. */
  const atQuery = createMemo(() => /(?:^|\s)@([^\s@]*)$/.exec(input())?.[1] ?? null)
  const [atForced, setAtForced] = createSignal(false)
  const atOpen = createMemo(() => atForced() || atQuery() !== null)

  /* A menu over the composer (commands, frames, the harness, the model, the
     bridge) is as tall as the room above the composer: measured whenever one
     opens and when the panel resizes, so it never runs past the thread's top
     (the composer stands mid-panel in an empty chat). */
  let composerEl: HTMLDivElement | undefined
  const [room, setRoom] = createSignal("16rem")
  function measureRoom() {
    const top = log?.getBoundingClientRect().top
    const at = composerEl?.getBoundingClientRect().top
    if (top === undefined || at === undefined) return
    setRoom(`${Math.max(96, Math.floor(at - top - 10))}px`)
  }
  watching(
    () => [slashOpen(), atOpen(), pickerOpen(), menuOpen(), modelOpen()].join(),
    () => nextTick(measureRoom),
  )
  const atMatches = createMemo(() => {
    const q = (atQuery() ?? "").toLowerCase()
    return editor.artboards.filter((a) => a.name.toLowerCase().includes(q) && !context().some((c) => c.id === a.id))
  })
  const [atIndex, setAtIndex] = createSignal(0)
  watching(atMatches, () => setAtIndex(0))
  function pickAt(id: string) {
    if (!handoff.picked.includes(id)) togglePicked(id)
    if (atQuery() !== null) setInput(input().replace(/(^|\s)@[^\s@]*$/, "$1"))
    setAtForced(false)
    box?.focus()
  }

  /** The open listbox and its highlighted option, which the field announces
   * (`aria-activedescendant`) and keeps in view while the arrows move it. */
  const listbox = createMemo(() =>
    slashOpen() && slashMatches().length
      ? { id: "agent-commands", active: `agent-command-${slashIndex()}` }
      : atOpen() && atMatches().length
        ? { id: "agent-frames", active: `agent-frame-${atIndex()}` }
        : null,
  )
  watching(
    () => listbox()?.active,
    (id) => id && nextTick(() => document.getElementById(id)?.scrollIntoView?.({ block: "nearest" })),
  )

  /** After a turn that finished on its own, a few next prompts from the
   * frames it touched (else the frames in hand), while the field is empty. */
  const suggestions = createMemo(() => {
    const last = thread.entries[thread.entries.length - 1]
    if (busy() || input() || openApproval() || last?.kind !== "worked" || last.end) return []
    return nextPrompts(changesOf(thread.entries, turn())?.frames ?? context())
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
    if (touch()) box?.blur()
    else refocus()
    if (text.startsWith("/") && !atts.length) {
      // The second Enter on a refused /word sends it as words.
      const words = unknownOnce === text
      if (refusesUnknown(text)) return
      if (!words) {
        setInput("")
        cursor = -1
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
    cursor = -1
    if (busy()) {
      // Words typed while a permission prompt waits are the answer: it is
      // declined and they go next, in its place.
      const asking = openApproval()
      if (asking && text) {
        answer(asking, asking.options.find((o) => o.reject)?.id ?? null)
        now = true
      }
      const q = queueOf(text, atts)
      if (now) {
        setFollowUps([q, ...followUps()])
        sendNow(q.id)
      } else setFollowUps([...followUps(), q])
      setAnnounced(now ? "Stopping to send it" : "Queued")
      return
    }
    setPaused(false)
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
    setTurn(turn() + 1)
    checkpoints.set(turn(), checkpoint())
    handoff.picked.splice(0)
    handoff.picking = false
    // Whatever the harness said before (while its session opened) is its own
    // entry: this turn's reply starts under its message.
    setLive(null)
    endThought()
    const framePictures = client.acceptsImages ? await picturesOf(frames) : []
    const pictures = [
      ...framePictures,
      ...(client.acceptsImages ? imagesOf(atts).map((a) => ({ mimeType: a.mimeType, data: a.data })) : []),
    ]
    push({
      kind: "user",
      text,
      turn: turn(),
      context: frames,
      pictured: framePictures.length > 0,
      ...(atts.length ? { attached: atts.map((a) => ({ kind: a.kind, ...chipOf(a) })) } : {}),
    })
    scrollLog(true)
    setBusy(true)
    setStarted(Date.now())
    setNow(started())
    clock = setInterval(() => setNow(Date.now()), 1000)
    controller = new AbortController()
    const { stopReason } = await client.prompt(
      revision + withContext(promptText(text, atts), frames, pictures.length),
      controller.signal,
      pictures,
    )
    clearInterval(clock)
    setBusy(false)
    setStopping(false)
    controller = null
    setLive(null)
    endThought()
    const end = stopReason === "cancelled" ? "stopped" : stopReason === "error" ? "failed" : undefined
    setAnnounced(end === "stopped" ? "Stopped" : end === "failed" ? "Failed" : "Done")
    push({ kind: "worked", ms: Date.now() - started(), ...(end ? { end } : {}) })
    // Follow-ups run one at a time, in order, each its own turn; a stop pauses
    // them (a Send now stops on purpose and goes on).
    if (end === "stopped" && !sendingNow) setPaused(true)
    sendingNow = false
    if (!paused()) await runNext()
  }

  /** The next queued message, as its own turn. */
  async function runNext() {
    const [next, ...rest] = followUps()
    if (!next) return
    setFollowUps(rest)
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
    const at = followUps().findIndex((q) => q.id === id)
    if (at < 0) return
    setFollowUps([followUps()[at], ...followUps().filter((q) => q.id !== id)])
    setPaused(false)
    if (busy()) {
      sendingNow = true
      stopTurn()
    } else void runNext()
  }
  /** Take a queued message back into the composer, to change and send again. */
  function editQueued(id: string) {
    const q = followUps().find((x) => x.id === id)
    if (!q) return
    setFollowUps(followUps().filter((x) => x.id !== id))
    setInput(input() ? `${q.text}\n${input()}` : q.text)
    setAttachments([...q.attachments, ...attachments()])
    refocus()
  }
  /** Go on with a paused queue. */
  function resume() {
    setPaused(false)
    if (!busy()) void runNext()
  }
  const moveQueued = (id: string) => {
    const at = followUps().findIndex((q) => q.id === id)
    setFollowUps(moved(followUps(), at, -1))
  }

  /** A stop the harness has not answered in `STUCK_MS`: the tray offers to
   * stop the harness itself (the bridge ends its process, which ends the
   * turn). */
  const STUCK_MS = 5000
  const [stoppedAt, setStoppedAt] = createSignal(0)
  const stuck = createMemo(() => stopping() && now() - stoppedAt() >= STUCK_MS)
  function forceStop() {
    acp()?.stop()
    refocus()
  }
  /** Stop the turn. The queue stays, paused (Send next or a new message goes on). */
  function stop() {
    stopTurn()
  }
  function stopTurn() {
    for (const settle of [...pending.values()]) settle(null)
    if (busy() && !stopping()) {
      setStopping(true)
      setStoppedAt(Date.now())
    }
    controller?.abort()
  }

  function unqueue() {
    const last = followUps()[followUps().length - 1]
    if (last) editQueued(last.id)
  }

  /* What comes in by paste or drop. A long text folds into a chip (the
   * field stays a field); Cmd/Ctrl+Shift+V pastes it as typed text. Files:
   * pictures and text files; anything else says why not. */
  let rawPasteUntil = 0
  async function takeFiles(files: File[]) {
    for (const f of files) {
      const got = await intake(f, attachments())
      if (typeof got === "string") setNotice(got)
      else setAttachments([...attachments(), got])
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
    setAttachments([...attachments(), pastedText(text, attachments())])
  }
  const [dropping, setDropping] = createSignal(false)
  function onDrop(e: DragEvent) {
    setDropping(false)
    const files = [...(e.dataTransfer?.files ?? [])]
    if (!files.length) return
    e.preventDefault()
    void takeFiles(files)
    refocus()
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
  const unattach = (id: string) => setAttachments(attachments().filter((a) => a.id !== id))
  /** A folded text back into the field, as typed text. */
  function unfold(id: string) {
    const a = attachments().find((x) => x.id === id)
    if (a?.kind !== "text") return
    unattach(id)
    setInput(input() ? `${input()}\n${a.text}` : a.text)
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
    const asking = openApproval()
    const settledIn = !asking || askedAt - typedBefore >= TYPING_GUARD || typedAt - typedBefore >= TYPING_GUARD
    if (asking && settledIn && !input() && /^[1-9]$/.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const option = asking.options[Number(e.key) - 1]
      if (option) {
        e.preventDefault()
        answer(asking, option.id)
        return
      }
    }
    if (atOpen() && atMatches().length) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault()
        const n = atMatches().length
        setAtIndex((atIndex() + (e.key === "ArrowDown" ? 1 : n - 1)) % n)
        return
      }
      if (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey)) {
        e.preventDefault()
        pickAt(atMatches()[atIndex()].id)
        return
      }
    }
    if (atForced() && e.key === "Escape") {
      setAtForced(false)
      return
    }
    if (slashOpen() && slashMatches().length) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSlashIndex((slashIndex() + 1) % slashMatches().length)
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSlashIndex((slashIndex() - 1 + slashMatches().length) % slashMatches().length)
        return
      }
      if (e.key === "Escape") {
        setSlashDismissed(true)
        return
      }
      if (
        e.key === "Tab" ||
        (e.key === "Enter" && !e.shiftKey && `/${slashMatches()[slashIndex()].name}` !== input())
      ) {
        e.preventDefault()
        const c = slashMatches()[slashIndex()]
        setInput(`/${c.name}${c.args ? " " : ""}`)
        return
      }
    }
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "v" || e.key === "V" || e.code === "KeyV")) {
      rawPasteUntil = Date.now() + 1000
      return
    }
    if (e.key === "Enter" && !e.shiftKey && !touch()) {
      e.preventDefault()
      // An empty field on a paused queue: Enter goes on with it.
      if (!input().trim() && !attachments().length && paused() && followUps().length) return resume()
      void send(undefined, busy() && (e.metaKey || e.ctrlKey))
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
      if (pickerOpen() || menuOpen() || modelOpen()) {
        setPickerOpen(false)
        setMenuOpen(false)
        setModelOpen(false)
        return
      }
      if (busy() || pending.size) {
        e.preventDefault()
        stop()
      } else if (editing()) cancelEdit()
      else box?.blur()
      return
    }
    if (e.ctrlKey && (e.key === "o" || e.key === "O")) {
      e.preventDefault()
      toolsOpen = !toolsOpen
      for (const x of thread.entries) if (x.kind === "tool") x.open = toolsOpen
      return
    }
    const recalling = cursor !== -1
    if (e.key === "ArrowUp" && !e.shiftKey && sent().length && (recalling || !input())) {
      e.preventDefault()
      cursor = recalling ? Math.max(0, cursor - 1) : sent().length - 1
      setInput(sent()[cursor])
    } else if (e.key === "ArrowDown" && !e.shiftKey && recalling) {
      e.preventDefault()
      const next = cursor + 1
      cursor = next < sent().length ? next : -1
      setInput(cursor === -1 ? "" : sent()[cursor])
    }
  }

  function pickSlash(c: Slash) {
    setInput(`/${c.name}${c.args ? " " : ""}`)
    box?.focus()
  }

  async function pickModel(id: string) {
    setModelOpen(false)
    refocus()
    const client = acp()
    if (!client || id === model()?.current) return
    await client.setModel(id).catch((e: Error) => push({ kind: "error", text: e.message }))
  }

  async function togglePicker() {
    setPickerOpen(!pickerOpen())
    setMenuOpen(false)
    setModelOpen(false)
    if (pickerOpen() && !acp()) await connect()
  }

  function keepDraft() {
    if (loadedFor && loadedChat) saveDraft(loadedFor, loadedChat, { text: input(), attachments: attachments() })
  }
  onMount(() => {
    window.addEventListener("resize", measureRoom)
    document.addEventListener("selectionchange", onSelection)
    takeAsks()
    window.addEventListener("pagehide", keepDraft)
    fit()
    refocus()
    onCleanup(() => {
      window.removeEventListener("resize", measureRoom)
      document.removeEventListener("selectionchange", onSelection)
      window.removeEventListener("pagehide", keepDraft)
      clearTimeout(draftTimer)
      clearTimeout(copiedTimer)
      keepDraft()
      controller?.abort()
      clearInterval(clock)
      clearInterval(lookTimer)
      disconnect()
    })
  })
  props.ref?.({ focus: refocus })

  const empty = () => !thread.entries.length && setup() === "none"

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
                      live={live() === b().entry || thinking() === b().entry}
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
        <Show when={setup() !== "none"}>
          <BridgeSetup looking={setup() === "looking"} url={config.bridgeUrl} onLook={lookForBridge} />
        </Show>
      </div>

      <div class="dock">
        <Show when={unseen()}>
          <button type="button" class="latest" onClick={() => toEnd(true)}>
            <DitherIcon name="ArrowDown" size={11} strokeWidth={1.5} />
            Latest
          </button>
        </Show>
        <div ref={(el) => (composerEl = el)} class="composer" style={{ "--room": room() }}>
          <Switch>
            <Match when={slashOpen() && slashMatches().length}>
              <div id="agent-commands" class="pop" role="listbox" aria-label="Commands">
                <For each={slashMatches()}>
                  {(c, i) => (
                    <button
                      id={`agent-command-${i()}`}
                      type="button"
                      tabindex="-1"
                      role="option"
                      aria-selected={i() === slashIndex()}
                      class={`pop-row${i() === slashIndex() ? " is-active" : ""}`}
                      onClick={() => pickSlash(c)}
                    >
                      <span class="pop-name">
                        /{c.name}
                        <Show when={c.args}>
                          <span class="dim"> {c.args}</span>
                        </Show>
                      </span>
                      <span class="dim">
                        {c.harness ? `${agentName()}: ` : ""}
                        {c.desc}
                      </span>
                    </button>
                  )}
                </For>
              </div>
            </Match>
            <Match when={atOpen()}>
              <div id="agent-frames" class="pop" role="listbox" aria-label="Frames">
                <For each={atMatches()}>
                  {(a, i) => (
                    <button
                      id={`agent-frame-${i()}`}
                      type="button"
                      tabindex="-1"
                      role="option"
                      aria-selected={i() === atIndex()}
                      class={`pop-row${i() === atIndex() ? " is-active" : ""}`}
                      onClick={() => pickAt(a.id)}
                    >
                      <span class="pop-name">
                        <DitherIcon name="Layout" size={11} strokeWidth={1.5} />
                        {a.name}
                      </span>
                    </button>
                  )}
                </For>
                <Show when={!atMatches().length}>
                  <p class="note">No frame left to add</p>
                </Show>
              </div>
            </Match>
            <Match when={modelOpen() && model()}>
              {(m) => (
                <div id="agent-model-picker" class="pop" role="group" aria-label="Model">
                  <For each={m().options}>
                    {(o) => (
                      <button
                        type="button"
                        class="pop-row"
                        aria-pressed={o.id === m().current}
                        onClick={() => pickModel(o.id)}
                      >
                        <span class="pop-name">
                          {o.name}
                          <Show when={o.id === m().current}>
                            <DitherIcon name="Check" size={11} strokeWidth={1.5} />
                          </Show>
                        </span>
                        <Show when={o.description}>
                          <span class="dim">{o.description}</span>
                        </Show>
                      </button>
                    )}
                  </For>
                </div>
              )}
            </Match>
            <Match when={pickerOpen()}>
              <div id="agent-harness-picker" class="pop" role="group" aria-label="Harness">
                <Show
                  when={hello()}
                  fallback={
                    <p class="note">
                      {connecting()
                        ? "Connecting the bridge…"
                        : "No bridge yet: the chat shows the line that starts it."}{" "}
                      Then pick Claude Code, Codex, Gemini CLI, oh-my-pi, Goose, OpenCode, or any ACP command here.
                    </p>
                  }
                >
                  <For each={harnesses()}>
                    {(h) => (
                      <button
                        type="button"
                        class="pop-row"
                        aria-pressed={agent()?.id === h.id}
                        title={h.command}
                        onClick={() => start(h.id)}
                      >
                        <span class="pop-name">
                          {isMark(h.id) ? <ToolMark id={h.id} size={12} /> : null}
                          {h.name}
                          <Show when={agent()?.id === h.id}>
                            <DitherIcon name="Check" size={11} strokeWidth={1.5} />
                          </Show>
                        </span>
                        <span class="dim">{h.installed ? (h.note ?? "on this path") : "not on the path"}</span>
                      </button>
                    )}
                  </For>
                  <div class="pop-foot">
                    <form
                      class="custom"
                      onSubmit={(e) => {
                        e.preventDefault()
                        if (customCommand().trim()) void start({ command: customCommand().trim() })
                      }}
                    >
                      <input
                        value={customCommand()}
                        onInput={(e) => setCustomCommand(e.currentTarget.value)}
                        type="text"
                        name="agent-command"
                        class="input"
                        placeholder="any ACP command, e.g. omp --mode acp"
                        autocomplete="off"
                        spellcheck={false}
                        aria-label="Custom harness command"
                      />
                      <button type="submit" class="key" disabled={!customCommand().trim()}>
                        <span class="row-label">Start</span>
                      </button>
                    </form>
                    <Show when={agent()}>
                      {(a) => (
                        <button type="button" class="pop-row text-destructive" onClick={() => acp()?.stop()}>
                          <span class="pop-name">Stop {a().name}</span>
                        </button>
                      )}
                    </Show>
                  </div>
                </Show>
              </div>
            </Match>
            <Match when={menuOpen()}>
              <div class="pop menu" role="group" aria-label="Settings">
                <div class="fields">
                  <label class="field">
                    <span>bridge</span>
                    <input
                      value={config.bridgeUrl}
                      onInput={(e) => (config.bridgeUrl = e.currentTarget.value.trim())}
                      onChange={(e) => (e.currentTarget.value = e.currentTarget.value.trim())}
                      name="agent-bridge-url"
                      type="text"
                      class="input"
                      placeholder="ws://127.0.0.1:8790"
                      autocomplete="off"
                      spellcheck={false}
                    />
                  </label>
                  {/* The harness's own settings, asked of it; nothing kept here. */}
                  <For each={settings()}>
                    {(o) => (
                      <label class="field">
                        <span>{o.name.toLowerCase()}</span>
                        <select
                          class="input"
                          name={`agent-setting-${o.configId}`}
                          value={o.current}
                          onChange={(e) => setSetting(o, e.currentTarget.value)}
                        >
                          <For each={o.options}>
                            {(v) => (
                              <option value={v.id} title={v.description}>
                                {v.name}
                              </option>
                            )}
                          </For>
                        </select>
                      </label>
                    )}
                  </For>
                </div>
                <p class="note">
                  {fmtTokens(usage().input)} in, {fmtTokens(usage().output)} out
                  <Show when={lastTurnMs()}>, last turn {fmtMs(lastTurnMs())}</Show>
                  <Show when={hello()}>{(at) => <>, in {at().cwd}</>}</Show>
                </p>
                <p class="note">
                  The harness runs on your machine behind the bridge; the Studio only sends prompts and answers its tool
                  calls. No key lives here; the harness's settings above are its own, asked of it.
                </p>
              </div>
            </Match>
          </Switch>

          <TurnTrays
            next={suggestions()}
            todos={todos()}
            queue={followUps()}
            paused={paused()}
            run={
              busy()
                ? {
                    doing: stopping() ? "Stopping" : thinking() ? "Thinking" : live() ? "Writing" : "Working",
                    time: secondsOf(Math.max(1000, elapsed())),
                    stopping: stopping(),
                    stuck: stuck(),
                  }
                : null
            }
            changes={changes()}
            putBack={putBack()?.name ?? null}
            shown={(id) => editor.artboards.some((a) => a.id === id)}
            onStop={stop}
            onForceStop={forceStop}
            onUnqueue={(id) => setFollowUps(followUps().filter((q) => q.id !== id))}
            onEditQueued={editQueued}
            onSendNow={sendNow}
            onMoveUp={moveQueued}
            onClearQueue={() => {
              setFollowUps([])
              setPaused(false)
            }}
            onResume={resume}
            onUndo={undoTurn}
            onKeep={keep}
            onUndoFrame={undoFrame}
            onKeepFrame={settleFrame}
            onPutBack={putFrameBack}
            onShow={(id) => selectArtboard(id)}
            onAsk={(s) => send(s)}
          />

          <Show when={editing()}>
            {(ed) => (
              <div class="editing" role="status">
                <p class="editing-line">
                  <DitherIcon name="Edit" size={12} strokeWidth={1.5} />
                  <span class="row-label is-wrap">
                    Editing an earlier message. Sending goes back there: the messages after it leave the thread.
                  </span>
                </p>
                <div class="editing-keys">
                  <Show when={ed().restorable}>
                    <label class="editing-choice">
                      <input
                        checked={ed().restore}
                        onChange={(e) => setEditing({ ...ed(), restore: e.currentTarget.checked })}
                        type="checkbox"
                        name="edit-restore"
                      />
                      <span class="row-label">Canvas back to before it</span>
                    </label>
                  </Show>
                  <button type="button" class="editing-cancel" onClick={cancelEdit}>
                    <span class="row-label">Cancel</span>
                    <kbd class="row-label">esc</kbd>
                  </button>
                </div>
              </div>
            )}
          </Show>
          <div
            class={`card${dropping() ? " is-dropping" : ""}`}
            onDragOver={(e) => {
              e.preventDefault()
              setDropping(true)
            }}
            onDragLeave={(e) => e.target === e.currentTarget && setDropping(false)}
            onDrop={onDrop}
          >
            <Show when={context().length || attachments().length}>
              <div class="chips">
                <For each={context()}>
                  {(c) => (
                    <span class="ctx first-line">
                      <DitherIcon name="Layout" size={11} strokeWidth={1.5} />
                      <span class="row-label is-wrap">{c.name}</span>
                      <button
                        type="button"
                        class="ctx-x"
                        aria-label={`Leave ${c.name} out`}
                        onClick={() => dropContext(c.id)}
                      >
                        <DitherIcon name="Close" size={10} strokeWidth={1.5} />
                      </button>
                    </span>
                  )}
                </For>
                <Attached attachments={attachments()} onRemove={unattach} onUnfold={unfold} />
              </div>
            </Show>
            <Switch>
              <Match when={notice()}>
                <p class="notice" role="status">
                  {notice()}
                </p>
              </Match>
              <Match when={slashHint()}>
                <p class="slash-hint">{slashHint()}</p>
              </Match>
            </Switch>
            <textarea
              ref={(el) => (box = el)}
              value={input()}
              onInput={onInput}
              name="agent-goal"
              rows="1"
              class="prompt"
              placeholder={placeholder()}
              enterkeyhint={touch() ? "enter" : "send"}
              aria-label="Message the agent"
              aria-autocomplete="list"
              aria-expanded={listbox() !== null}
              aria-controls={listbox()?.id}
              aria-activedescendant={listbox()?.active}
              spellcheck={false}
              on:keydown={onKey}
              onPaste={onPaste}
              onCompositionEnd={onCompositionEnd}
            />
            <div class="foot">
              <button
                type="button"
                class="foot-key"
                aria-pressed={handoff.picking}
                aria-label="Pick frames on the canvas"
                title="Pick frames on the canvas (esc when done)"
                onClick={() => (handoff.picking = !handoff.picking)}
              >
                <DitherIcon name="Crosshair" size={13} strokeWidth={1.5} />
              </button>
              <button
                type="button"
                class="foot-key"
                aria-label="Add a frame by name"
                title="Add a frame by name (@)"
                aria-pressed={atForced()}
                onClick={() => setAtForced(!atForced())}
              >
                @
              </button>
              <button
                type="button"
                class="pill"
                aria-expanded={pickerOpen()}
                aria-controls="agent-harness-picker"
                title={hello() ? `${agentName() || "Harness"}, bridge ${config.bridgeUrl}` : config.bridgeUrl}
                onClick={togglePicker}
              >
                <span class="led" data-on={String(!!agent())} aria-hidden="true"></span>
                <span class="row-label">{agentName() || (acp() ? "Pick a harness" : "Harness")}</span>
                <DitherIcon name="ChevronDown" size={10} strokeWidth={1.5} />
              </button>
              <Show when={model()}>
                {(m) => (
                  <button
                    type="button"
                    class="pill"
                    aria-expanded={modelOpen()}
                    aria-controls="agent-model-picker"
                    title={`${agentName() || "The harness"} runs ${modelName(m())}`}
                    disabled={m().options.length < 2}
                    onClick={() => {
                      setModelOpen(!modelOpen())
                      setPickerOpen(false)
                      setMenuOpen(false)
                    }}
                  >
                    <span class="row-label">{modelName(m())}</span>
                    <Show when={m().options.length > 1}>
                      <DitherIcon name="ChevronDown" size={10} strokeWidth={1.5} />
                    </Show>
                  </button>
                )}
              </Show>
              <button
                type="button"
                class={`send ${input().trim() || attachments().length ? "key-chrome" : "is-idle"}`}
                disabled={!input().trim() && !attachments().length}
                aria-label={busy() ? `Queue (enter), or send now (${modKey("enter")})` : "Send (enter)"}
                title={busy() ? `Queue (enter), or stop and send now (${modKey("enter")})` : "Send (enter)"}
                onMouseDown={(e) => e.preventDefault()}
                onClick={(ev) => ev.detail > 1 || send()}
              >
                <DitherIcon name="ArrowUp" size={13} strokeWidth={2} />
              </button>
            </div>
          </div>

          <div class="status">
            <button
              type="button"
              class="status-key"
              aria-pressed={config.auto}
              title={
                config.auto
                  ? "Permission prompts are answered with their allow option"
                  : "Permission prompts wait for you"
              }
              onClick={() => (config.auto = !config.auto)}
            >
              <DitherIcon name={config.auto ? "Unlock" : "Lock"} size={11} strokeWidth={1.5} />
              <span class="row-label">{config.auto ? "Auto" : "Ask"}</span>
            </button>
            <Show when={modes().length}>
              <button
                type="button"
                class="status-key"
                title={modes().find((m) => m.id === mode())?.description || "Switch mode"}
                onClick={() =>
                  slash(`/mode ${modes()[(modes().findIndex((m) => m.id === mode()) + 1) % modes().length].id}`)
                }
              >
                <DitherIcon name="Bot" size={11} strokeWidth={1.5} />
                <span class="row-label">{modes().find((m) => m.id === mode())?.name || mode()}</span>
              </button>
            </Show>
            <button
              type="button"
              class="status-key is-glyph"
              aria-label="Follow the agent"
              title={
                config.follow
                  ? "Following the agent: the canvas pans to each frame it changes"
                  : "Follow the agent: pan the canvas to each frame it changes"
              }
              aria-pressed={config.follow}
              onClick={() => (config.follow = !config.follow)}
            >
              <DitherIcon name="Eye" size={12} strokeWidth={1.5} />
            </button>
            <Show when={hello()}>
              {(at) => (
                <span class="status-key is-static" title={at().cwd}>
                  <DitherIcon name="Folder" size={11} strokeWidth={1.5} />
                  <span class="row-label">{folderOf(at().cwd)}</span>
                </span>
              )}
            </Show>
            <Show when={contextUse()}>{(use) => <ContextMeter class="status-meter" use={use()} />}</Show>
            <button
              type="button"
              class="status-key is-icon"
              aria-pressed={menuOpen()}
              aria-label="Settings"
              title="Settings: the bridge and the harness's own"
              onClick={() => {
                setMenuOpen(!menuOpen())
                setPickerOpen(false)
              }}
            >
              <DitherIcon name="Settings" size={12} strokeWidth={1.5} />
            </button>
          </div>
        </div>
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
