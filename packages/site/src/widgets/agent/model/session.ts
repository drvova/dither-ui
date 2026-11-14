// The panel's session as data: the bridge connection and the turn as
// unions (a state that cannot happen cannot be written: no client without
// its hello, no stop asked of a turn that is not running), and the
// harness's events folded into the thread by one pure reducer. The panel
// holds the state and applies what the reducer returns; nothing here
// touches a store, a socket or the clock (the moment comes in as `now`).
import type { BridgeHello } from "@/features/agent/acp"
import type { AgentCommand, AgentEvent, ContextUse, Mode, ModelChoice, Setting, Usage } from "@/features/agent/tools"
import type { Changed } from "./steps"
import { type Entry, secondsOf, toolEntry } from "./thread"

/* ------------------------------- connection ------------------------------- */

/** While no bridge answers, the chat shows how to start it: the panel looks
 * again every few seconds (`looking`), for a while (`stopped` after). */
export type Setup = "none" | "looking" | "stopped"

/** The bridge: none (with what the setup card shows), being opened (a quiet
 * look or a loud try; what it said once it said hello), or open. */
export type Connection<C> =
  | { kind: "closed"; setup: Setup }
  | { kind: "connecting"; setup: Setup; hello: BridgeHello | null }
  | { kind: "open"; client: C; hello: BridgeHello }

export const CLOSED: Connection<never> = { kind: "closed", setup: "none" }

/** What the setup card shows: nothing once a bridge is open. */
export const setupOf = <C>(c: Connection<C>): Setup => (c.kind === "open" ? "none" : c.setup)
export const clientOf = <C>(c: Connection<C>): C | null => (c.kind === "open" ? c.client : null)
/** What the bridge last said of itself (its cwd, its harnesses, the agent). */
export const helloOf = <C>(c: Connection<C>): BridgeHello | null => (c.kind === "closed" ? null : c.hello)

/** The setup card moved on (looking, stopped, done); an open bridge shows none. */
export const withSetup = <C>(c: Connection<C>, setup: Setup): Connection<C> => (c.kind === "open" ? c : { ...c, setup })
/** A try begins: from no bridge, keeping the card as it stands. */
export const connecting = <C>(c: Connection<C>): Connection<C> =>
  c.kind === "closed" ? { kind: "connecting", setup: c.setup, hello: null } : c
/** The bridge said hello (again: a harness started or ended). */
export const heard = <C>(c: Connection<C>, hello: BridgeHello): Connection<C> =>
  c.kind === "closed" ? c : { ...c, hello }
/** The bridge answered and is open. */
export const connected = <C>(client: C, hello: BridgeHello): Connection<C> => ({ kind: "open", client, hello })
/** A try that found none: the card stays as it stood. */
export const failed = <C>(c: Connection<C>): Connection<C> =>
  c.kind === "connecting" ? { kind: "closed", setup: c.setup } : c
/** The socket closed (or was closed): an open bridge is gone; a try under
 * way forgets what it heard and goes on. */
export const lost = <C>(c: Connection<C>): Connection<C> =>
  c.kind === "open" ? CLOSED : c.kind === "connecting" ? { ...c, hello: null } : c

/* ---------------------------------- turn ---------------------------------- */

/** A prompt's turn: none, running since `started`, or a stop asked at
 * `asked` and not yet answered by the harness. */
export type Turn =
  { kind: "idle" } | { kind: "running"; started: number } | { kind: "stopping"; started: number; asked: number }

export const IDLE: Turn = { kind: "idle" }
/** A stop the harness has not answered in this long offers to end its process. */
export const STUCK_MS = 5000

export const busyOf = (t: Turn) => t.kind !== "idle"
export const running = (now: number): Turn => ({ kind: "running", started: now })
/** Stop asked: only of a running turn, once. */
export const stopAsked = (t: Turn, now: number): Turn =>
  t.kind === "running" ? { kind: "stopping", started: t.started, asked: now } : t
export const elapsedOf = (t: Turn, now: number) => (t.kind === "idle" ? 0 : Math.max(0, now - t.started))
export const stuckOf = (t: Turn, now: number) => t.kind === "stopping" && now - t.asked >= STUCK_MS

/** What streams now, by its place in the thread (`null`: its entry left the
 * thread, a chat switched or cleared under it, and what follows goes
 * nowhere): the reply, or the thought and when it began. The harness may
 * speak outside a turn (while its session opens), so this is the turn's
 * neighbour, not part of it. */
export type Stream =
  { kind: "quiet" } | { kind: "reply"; at: number | null } | { kind: "thought"; at: number | null; since: number }

export const QUIET: Stream = { kind: "quiet" }
/** The thread kept only its first `kept` entries (all gone: 0): a stream
 * whose entry went with them streams nowhere. */
export const orphaned = (s: Stream, kept: number): Stream =>
  s.kind === "quiet" || s.at === null || s.at < kept ? s : { ...s, at: null }

/** What the run row says the harness is doing, and for how long (a second
 * at least); none while no turn runs. */
export function runOf(t: Turn, s: Stream, now: number) {
  if (t.kind === "idle") return null
  return {
    doing:
      t.kind === "stopping"
        ? "Stopping"
        : s.kind === "thought"
          ? "Thinking"
          : s.kind === "reply"
            ? "Writing"
            : "Working",
    time: secondsOf(Math.max(1000, elapsedOf(t, now))),
    stopping: t.kind === "stopping",
    stuck: stuckOf(t, now),
  }
}

/* --------------------------------- the fold -------------------------------- */

/** The harness's own state, as its session reports it: its modes, the
 * model it runs, its commands, how full its context is, its settings. */
export type Harness = {
  modes: Mode[]
  mode: string
  model: ModelChoice | null
  commands: AgentCommand[]
  context: ContextUse | null
  settings: Setting[]
}
export const NO_HARNESS: Harness = { modes: [], mode: "", model: null, commands: [], context: null, settings: [] }

/** What the harness's events fold into. */
export type Fold = {
  entries: readonly Entry[]
  stream: Stream
  /** The turn the thread is on: a Studio step carries it. */
  turnNo: number
  harness: Harness
  usage: Usage
  lastTurnMs: number
}

/** What the panel does besides the state: keep the thread's end in view,
 * and pan the canvas to what a step changed (when it follows the agent). */
export type Effect = { kind: "scroll" } | { kind: "follow"; frames: Changed[] }

type Thought = Extract<Entry, { kind: "thought" }>
type Reply = Extract<Entry, { text: string }>

/** The entries with the one at `at` replaced (copy on write: the panel
 * patches only what changed). */
const put = (entries: readonly Entry[], at: number, entry: Entry): Entry[] => {
  const next = entries.slice()
  next[at] = entry
  return next
}

/** The thought ended: folded under how long it took. */
export function endThought(f: Fold, now: number): Fold {
  const s = f.stream
  if (s.kind !== "thought") return f
  const t = s.at === null ? null : (f.entries[s.at] as Thought)
  return {
    ...f,
    stream: QUIET,
    entries: t && s.at !== null ? put(f.entries, s.at, { ...t, ms: now - s.since, open: false }) : f.entries,
  }
}
/** Nothing streams: the thought ends and the reply is done. */
export const hushed = (f: Fold, now: number): Fold => ({ ...endThought(f, now), stream: QUIET })

/** Events that leave a thought streaming (anything else the harness does ends it). */
const KEEPS_THOUGHT = new Set<AgentEvent["type"]>(["thought", "mode", "commands", "plan"])

/** One event of the harness, folded into the thread and the session. */
export function fold(state: Fold, e: AgentEvent, now: number): { state: Fold; effects: Effect[] } {
  const f = KEEPS_THOUGHT.has(e.type) ? state : endThought(state, now)
  const effects: Effect[] = []
  const push = (g: Fold, entry: Entry): Fold => {
    effects.push({ kind: "scroll" })
    return { ...g, entries: [...g.entries, entry] }
  }
  const quiet = { ...f, stream: f.stream.kind === "reply" ? QUIET : f.stream }
  switch (e.type) {
    case "thought": {
      let g = quiet
      if (g.stream.kind !== "thought") {
        g = {
          ...g,
          entries: [...g.entries, { kind: "thought", text: "", open: true }],
          stream: { kind: "thought", at: g.entries.length, since: now },
        }
      }
      const s = g.stream as Extract<Stream, { kind: "thought" }>
      if (s.at !== null) {
        const t = g.entries[s.at] as Thought
        g = { ...g, entries: put(g.entries, s.at, { ...t, text: t.text + e.text }) }
      }
      effects.push({ kind: "scroll" })
      return { state: g, effects }
    }
    case "delta": {
      let g = f
      if (g.stream.kind !== "reply") {
        g = {
          ...g,
          entries: [...g.entries, { kind: "assistant", text: "" }],
          stream: { kind: "reply", at: g.entries.length },
        }
      }
      const s = g.stream as Extract<Stream, { kind: "reply" }>
      if (s.at !== null) {
        const r = g.entries[s.at] as Reply
        g = { ...g, entries: put(g.entries, s.at, { ...r, text: r.text + e.text }) }
      }
      effects.push({ kind: "scroll" })
      return { state: g, effects }
    }
    case "assistant": {
      const s = f.stream
      const g =
        s.kind !== "reply"
          ? push(f, { kind: "assistant", text: e.text })
          : s.at === null
            ? f
            : { ...f, entries: put(f.entries, s.at, { ...(f.entries[s.at] as Reply), text: e.text }) }
      return { state: { ...g, stream: QUIET }, effects }
    }
    case "tool": {
      const step = toolEntry(e.name, e.args, e.result, f.turnNo, e.built)
      const g = push(quiet, step)
      if (step.changed?.length) effects.push({ kind: "follow", frames: step.changed })
      return { state: g, effects }
    }
    case "activity": {
      const at = quiet.entries.findIndex((x) => x.kind === "activity" && x.id === e.id)
      if (at >= 0) {
        const x = quiet.entries[at] as Extract<Entry, { kind: "activity" }>
        const entry = { ...x, status: e.status, ...(e.title ? { title: e.title } : {}) }
        return { state: { ...quiet, entries: put(quiet.entries, at, entry) }, effects }
      }
      // A call with no title yet waits for the update that names it (a
      // Studio tool's is drawn as its own step, so it never shows here).
      if (!e.title) return { state: quiet, effects }
      return {
        state: push(quiet, { kind: "activity", id: e.id, title: e.title, status: e.status, tool: e.kind }),
        effects,
      }
    }
    case "plan": {
      let at = -1
      for (let i = f.entries.length - 1; i >= 0 && at < 0; i--) if (f.entries[i].kind === "plan") at = i
      if (at < 0) return { state: push(f, { kind: "plan", entries: e.entries }), effects }
      return { state: { ...f, entries: put(f.entries, at, { kind: "plan", entries: e.entries }) }, effects }
    }
    case "mode":
      return {
        state: { ...f, harness: { ...f.harness, mode: e.current, modes: e.modes.length ? e.modes : f.harness.modes } },
        effects,
      }
    case "model":
      return { state: { ...f, harness: { ...f.harness, model: e.model } }, effects }
    case "commands":
      return { state: { ...f, harness: { ...f.harness, commands: e.commands } }, effects }
    case "context":
      return { state: { ...f, harness: { ...f.harness, context: e.context } }, effects }
    case "settings":
      return { state: { ...f, harness: { ...f.harness, settings: e.settings } }, effects }
    case "turn":
      return {
        state: {
          ...f,
          lastTurnMs: e.elapsedMs,
          usage: e.usage ? { input: f.usage.input + e.usage.input, output: f.usage.output + e.usage.output } : f.usage,
        },
        effects,
      }
    case "error":
      return { state: push(quiet, { kind: "error", text: e.message }), effects }
    case "stopped":
    case "done":
      return { state: quiet, effects }
  }
}
