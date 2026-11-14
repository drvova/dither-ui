// The agent panel's session as data (`src/widgets/agent/model/`): the
// harness's events replayed through the fold, as the panel spec's turns
// send them; the connection and the turn as unions, each state read the way
// the panel shows it; the changes bar and the composer's queue, recall and
// keys as pure steps. (Run here, not with `rs test`: the thread's steps
// read the Studio's command table, which stands on the editor's store.)
import { render } from "@solidjs/testing-library"
import { describe, expect, it } from "vitest"
import type { AcpClient, BridgeHello } from "../../src/features/agent/acp"
import type { AgentEvent } from "../../src/features/agent/tools"
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
} from "../../src/widgets/agent/model/changes"
import {
  answerKey,
  atMatchesOf,
  atQueryOf,
  enqueued,
  listboxOf,
  movedUp,
  NO_QUEUE,
  placeholderOf,
  recall,
  slashMatchesOf,
  slashOpenOf,
  stepped,
  toFront,
  TYPING_GUARD,
  without,
  withoutAt,
} from "../../src/widgets/agent/model/composer"
import {
  busyOf,
  CLOSED,
  clientOf,
  connected,
  type Connection,
  connecting,
  type Effect,
  failed,
  type Fold,
  fold,
  heard,
  helloOf,
  hushed,
  IDLE,
  lost,
  NO_HARNESS,
  orphaned,
  QUIET,
  runOf,
  running,
  setupOf,
  stopAsked,
  type Stream,
  STUCK_MS,
  stuckOf,
  type Turn,
  withSetup,
} from "../../src/widgets/agent/model/session"
import { OURS } from "../../src/widgets/agent/model/slash"
import { type Entry, toolEntry } from "../../src/widgets/agent/model/thread"
import BridgeSetup from "../../src/widgets/agent/ui/BridgeSetup"
import TurnTrays from "../../src/widgets/agent/ui/TurnTrays"

const start = (entries: Entry[] = [{ kind: "user", text: "A sign-in screen", turn: 1 }]): Fold => ({
  entries,
  stream: QUIET,
  turnNo: 1,
  harness: NO_HARNESS,
  usage: { input: 0, output: 0 },
  lastTurnMs: 0,
})
/** Events at one moment after another (a second apart), the fold's state
 * after each and every effect it asked for. */
function replay(events: AgentEvent[], from = start(), t0 = 1000) {
  const states: Fold[] = []
  const effects: Effect[] = []
  let f = from
  events.forEach((e, i) => {
    const out = fold(f, e, t0 + i * 1000)
    f = out.state
    states.push(f)
    effects.push(...out.effects)
  })
  return { state: f, states, effects }
}
const ok = (data: unknown) => ({ ok: true as const, data })

describe("the fold of the harness's events", () => {
  it("streams the thought, then the reply, as the panel spec's turn sends them", () => {
    const { state, states, effects } = replay([
      { type: "thought", text: "A form, " },
      { type: "thought", text: "two fields" },
      { type: "delta", text: "Placing the " },
      { type: "delta", text: "**screen**." },
      { type: "done" },
    ])
    // The thought opens as its own entry and streams in place.
    expect(states[1].stream).toEqual({ kind: "thought", at: 1, since: 1000 })
    expect(states[1].entries[1]).toEqual({ kind: "thought", text: "A form, two fields", open: true })
    // The reply ends it: folded under how long it took.
    expect(states[2].stream).toEqual({ kind: "reply", at: 2 })
    expect(state.entries).toEqual([
      { kind: "user", text: "A sign-in screen", turn: 1 },
      { kind: "thought", text: "A form, two fields", open: false, ms: 2000 },
      { kind: "assistant", text: "Placing the **screen**." },
    ])
    expect(state.stream).toEqual(QUIET)
    expect(effects).toEqual(Array(4).fill({ kind: "scroll" }))
  })

  it("copies on write: what did not change is the very entry it was", () => {
    const from = start()
    const { state } = replay([{ type: "delta", text: "a" }], from)
    expect(state.entries[0]).toBe(from.entries[0])
    expect(fold(from, { type: "done" }, 0).state.entries).toBe(from.entries)
  })

  it("takes the whole reply in place of the streamed one, and pushes one that never streamed", () => {
    const streamed = replay([
      { type: "delta", text: "Plac" },
      { type: "assistant", text: "Placed it." },
    ])
    expect(streamed.state.entries.slice(1)).toEqual([{ kind: "assistant", text: "Placed it." }])
    expect(streamed.effects).toEqual([{ kind: "scroll" }])
    const whole = replay([{ type: "assistant", text: "Placed it." }])
    expect(whole.state.entries.slice(1)).toEqual([{ kind: "assistant", text: "Placed it." }])
    expect(whole.effects).toEqual([{ kind: "scroll" }])
    expect(whole.state.stream).toEqual(QUIET)
  })

  it("lands a Studio step under the turn, and asks to follow the frames it changed", () => {
    const result = ok({ id: "f1", name: "Buy" })
    const args = { is: "DitherBadge", name: "Buy" }
    const { state, effects } = replay([
      { type: "delta", text: "Adding it" },
      { type: "tool", name: "add_component", args, result },
    ])
    expect(state.entries[2]).toEqual(toolEntry("add_component", args, result, 1))
    expect(state.stream).toEqual(QUIET)
    expect(effects).toEqual([
      { kind: "scroll" },
      { kind: "scroll" },
      { kind: "follow", frames: [{ id: "f1", name: "Buy" }] },
    ])
    // A read changes nothing to follow.
    expect(replay([{ type: "tool", name: "get_code", args: {}, result }]).effects).toEqual([{ kind: "scroll" }])
  })

  it("waits for a call's title, then keeps it through updates that only say its status", () => {
    const { states, state } = replay([
      { type: "activity", id: "x1", title: "", status: "pending" },
      { type: "activity", id: "x1", title: "Read file", status: "in_progress", kind: "read" },
      { type: "activity", id: "x1", title: "", status: "completed" },
    ])
    expect(states[0].entries).toHaveLength(1)
    expect(state.entries[1]).toEqual({
      kind: "activity",
      id: "x1",
      title: "Read file",
      status: "completed",
      tool: "read",
    })
  })

  it("keeps one plan, the latest, without ending a thought", () => {
    const { state } = replay([
      { type: "thought", text: "hm" },
      { type: "plan", entries: [{ content: "Lay out", status: "pending" }] },
      { type: "plan", entries: [{ content: "Lay out", status: "completed" }] },
    ])
    expect(state.entries.filter((e) => e.kind === "plan")).toEqual([
      { kind: "plan", entries: [{ content: "Lay out", status: "completed" }] },
    ])
    expect(state.stream.kind).toBe("thought")
  })

  it("folds the harness's own state: modes keep a thought, the rest end it", () => {
    const model = { configId: "model", current: "opus", options: [{ id: "opus", name: "Opus" }] }
    const { states, state } = replay([
      { type: "thought", text: "hm" },
      { type: "mode", current: "ask", modes: [{ id: "ask", name: "Ask" }] },
      { type: "commands", commands: [{ name: "review", description: "review" }] },
      { type: "mode", current: "code", modes: [] },
      { type: "model", model },
      { type: "context", context: { used: 10, size: 100 } },
      { type: "settings", settings: [] },
      { type: "turn", elapsedMs: 4200, usage: { input: 3, output: 4 } },
      { type: "turn", elapsedMs: 900, usage: { input: 1, output: 1 } },
    ])
    expect(states[3].stream.kind).toBe("thought")
    expect(states[4].stream).toEqual(QUIET)
    expect(state.harness).toEqual({
      modes: [{ id: "ask", name: "Ask" }],
      mode: "code",
      model,
      commands: [{ name: "review", description: "review" }],
      context: { used: 10, size: 100 },
      settings: [],
    })
    expect(state.usage).toEqual({ input: 4, output: 5 })
    expect(state.lastTurnMs).toBe(900)
  })

  it("says an error in the thread, and a stop or the end only quiets the stream", () => {
    const { state, states } = replay([
      { type: "delta", text: "a" },
      { type: "stopped" },
      { type: "delta", text: "b" },
      { type: "error", message: "the harness exited" },
    ])
    expect(states[1].stream).toEqual(QUIET)
    expect(state.entries.slice(1)).toEqual([
      { kind: "assistant", text: "a" },
      { kind: "assistant", text: "b" },
      { kind: "error", text: "the harness exited" },
    ])
  })

  it("streams nowhere once its entry left the thread (a chat switched or cleared under it)", () => {
    const mid = replay([{ type: "delta", text: "for the old chat" }]).state
    const cleared: Fold = { ...mid, entries: [], stream: orphaned(mid.stream, 0) }
    expect(cleared.stream).toEqual({ kind: "reply", at: null })
    const { state } = replay(
      [
        { type: "delta", text: " still" },
        { type: "assistant", text: "whole" },
      ],
      cleared,
    )
    expect(state.entries).toEqual([])
    expect(state.stream).toEqual(QUIET)
    // A thread cut after the stream's entry keeps it.
    expect(orphaned({ kind: "reply", at: 1 }, 2)).toEqual({ kind: "reply", at: 1 })
  })

  it("hushes before a turn: the thought folds, the reply is done", () => {
    const thinking = replay([{ type: "thought", text: "hm" }]).state
    const h = hushed(thinking, 3500)
    expect(h.stream).toEqual(QUIET)
    expect(h.entries[1]).toEqual({ kind: "thought", text: "hm", open: false, ms: 2500 })
  })
})

describe("the connection", () => {
  const client = { hello: null } as unknown as AcpClient
  const hi: BridgeHello = { cwd: "/home/me/site", harnesses: [], agent: null }

  it("opens through a try, and closes back to none", () => {
    const trying = connecting<AcpClient>(CLOSED)
    expect(trying).toEqual({ kind: "connecting", setup: "none", hello: null })
    const said = heard(trying, hi)
    expect(helloOf(said)).toBe(hi)
    const open = connected(client, hi)
    expect([clientOf(open), helloOf(open), setupOf(open)]).toEqual([client, hi, "none"])
    expect(lost(open)).toEqual(CLOSED)
    // A socket closing under a try forgets what it said; the try goes on.
    expect(lost(said)).toEqual(trying)
  })

  it("keeps the setup card through a try that finds none, and drops it once open", () => {
    const looking = withSetup<AcpClient>(CLOSED, "looking")
    expect(failed(connecting(looking))).toEqual(looking)
    expect(setupOf(withSetup(connecting(looking), "stopped"))).toBe("stopped")
    const open = connected(client, hi)
    expect(withSetup(open, "looking")).toBe(open)
    // No bridge says nothing of itself.
    expect(heard(CLOSED, hi)).toBe(CLOSED)
    expect(helloOf(CLOSED)).toBeNull()
  })

  it("shows the setup card for each state, and only for a bridge not found", async () => {
    const card = (c: Connection<AcpClient>) => {
      const setup = setupOf(c)
      const root = render(() =>
        setup === "none" ? (
          <p />
        ) : (
          <BridgeSetup looking={setup === "looking"} url="ws://127.0.0.1:8790" onLook={() => {}} />
        ),
      ).container
      return root.querySelector("[role='status']")?.textContent ?? null
    }
    expect(card(CLOSED)).toBeNull()
    expect(card(connected(client, hi))).toBeNull()
    expect(card(withSetup(CLOSED, "looking"))).toContain("Looking for it at ws://127.0.0.1:8790")
    expect(card(connecting(withSetup(CLOSED, "looking")))).toContain("Looking for it")
    expect(card(withSetup(CLOSED, "stopped"))).not.toContain("Looking for it")
  })

  it("says what sending does in each state", () => {
    const at = (c: Connection<AcpClient>, t: Turn = IDLE, asking = false) =>
      placeholderOf({
        asking: asking ? { options: [1, 2, 3] } : null,
        stopping: t.kind === "stopping",
        busy: busyOf(t),
        bridge: !!clientOf(c),
        agent: !!helloOf(c)?.agent,
      })
    const harnessed = connected(client, {
      ...hi,
      agent: { id: "claude", name: "claude-code-acp", command: "claude-code-acp", pid: 1 },
    })
    expect(at(CLOSED)).toBe("Ask; this starts the bridge")
    expect(at(connected(client, hi))).toBe("Ask; this starts your harness")
    expect(at(harnessed)).toBe("Ask, / for commands")
    expect(at(harnessed, running(0))).toBe("Queue a follow-up")
    expect(at(harnessed, stopAsked(running(0), 5))).toBe("Queue for after the stop")
    expect(at(harnessed, running(0), true)).toBe("Answer 1 to 3, or redirect")
  })
})

describe("the turn", () => {
  it("asks a stop only of a running turn, once, and calls it stuck after a while", () => {
    expect(stopAsked(IDLE, 5)).toBe(IDLE)
    const stopping = stopAsked(running(1000), 2000)
    expect(stopping).toEqual({ kind: "stopping", started: 1000, asked: 2000 })
    expect(stopAsked(stopping, 3000)).toBe(stopping)
    expect(stuckOf(stopping, 2000 + STUCK_MS - 1)).toBe(false)
    expect(stuckOf(stopping, 2000 + STUCK_MS)).toBe(true)
    expect(busyOf(IDLE)).toBe(false)
  })

  it("draws the run row each state reads as", () => {
    const row = (t: Turn, s: Stream, now: number) => {
      const run = runOf(t, s, now)
      const root = render(() => (
        <TurnTrays next={[]} todos={null} queue={[]} paused={false} run={run} changes={null} shown={() => true} />
      )).container
      return [root.querySelector(".run-time")?.textContent ?? null, root.querySelector(".quiet")?.textContent ?? null]
    }
    expect(row(IDLE, QUIET, 0)).toEqual([null, null])
    expect(row(running(0), QUIET, 300)).toEqual(["Working for 1s", "Stopesc"])
    expect(row(running(0), { kind: "thought", at: 1, since: 0 }, 2000)).toEqual(["Thinking for 2s", "Stopesc"])
    expect(row(running(0), { kind: "reply", at: 2 }, 3000)).toEqual(["Writing for 3s", "Stopesc"])
    expect(row(stopAsked(running(0), 4000), { kind: "reply", at: 2 }, 5000)).toEqual(["Stopping for 5s", "Stopping…"])
    expect(row(stopAsked(running(0), 4000), QUIET, 4000 + STUCK_MS)).toEqual(["Stopping for 9s", "Force stop"])
  })
})

describe("the changes bar", () => {
  const add = (id: string, name: string, turn: number) =>
    toolEntry("add_component", { is: "DitherBadge", name }, ok({ id, name }), turn)
  const entries: Entry[] = [{ kind: "user", text: "two badges", turn: 1 }, add("a", "Buy", 1), add("b", "Sell", 1)]

  it("shows what the turn changed until each frame is kept or undone, and one undone to put back", () => {
    let bar = NO_BAR
    expect(barChanges(entries, 1, bar)?.frames.map((f) => f.name)).toEqual(["Buy", "Sell"])
    bar = undoneFrame(bar, { id: "a", name: "Buy" }, "after")
    expect(barChanges(entries, 1, bar)?.frames.map((f) => f.name)).toEqual(["Sell"])
    expect(bar.putBack).toEqual({ id: "a", name: "Buy", after: "after" })
    bar = putBack(bar)
    expect(barChanges(entries, 1, bar)?.frames.map((f) => f.name)).toEqual(["Buy", "Sell"])
    bar = keptFrame(keptFrame(bar, "a"), "b")
    expect(barChanges(entries, 1, bar)).toBeNull()
    // Undone last: nothing left to settle, but it can still go back.
    const last = undoneFrame(keptFrame(NO_BAR, "a"), { id: "b", name: "Sell" }, "x")
    expect(barChanges(entries, 1, last)?.frames).toEqual([])
    expect(barChanges(entries, 1, forgotPutBack(last))).toBeNull()
  })

  it("goes once a turn is kept or restored, and starts fresh with the next turn", () => {
    expect(barChanges(entries, 1, settledTurn(NO_BAR, 1))).toBeNull()
    expect(barChanges(entries, 1, restoredTo(NO_BAR, 1, 1))).toBeNull()
    expect([...restoredTo(NO_BAR, 2, 4).settled]).toEqual([2, 3, 4])
    // A chat restored with three turns: all of them settled.
    expect([...settledThrough(3)]).toEqual([0, 1, 2, 3])
    expect(nextTurn(undoneFrame(NO_BAR, { id: "a", name: "Buy" }, "x"))).toEqual(NO_BAR)
  })
})

describe("the composer's model", () => {
  it("opens the command menu on a /word until Esc, and the frames on an @ word", () => {
    expect(slashOpenOf("/he", false)).toBe(true)
    expect(slashOpenOf("/he", true)).toBe(false)
    expect(slashOpenOf("/help me", false)).toBe(false)
    expect(slashMatchesOf("/he", OURS).map((c) => c.name)).toEqual(["help"])
    expect(atQueryOf("look at @rev")).toBe("rev")
    expect(atQueryOf("mail@rev")).toBeNull()
    expect(withoutAt("look at @rev")).toBe("look at ")
    const frames = [
      { id: "a", name: "Sign in" },
      { id: "b", name: "Revenue" },
    ]
    expect(atMatchesOf("", frames, [{ id: "a" }])).toEqual([frames[1]])
    expect(listboxOf({ slash: null, at: 2 })).toEqual({ id: "agent-frames", active: "agent-frame-2" })
    expect(listboxOf({ slash: 0, at: 2 })?.id).toBe("agent-commands")
    expect([stepped(0, 3, true), stepped(0, 3, false)]).toEqual([1, 2])
  })

  it("recalls what was sent from an empty field only, and Down empties it past the newest", () => {
    const sent = ["one", "two"]
    expect(recall(-1, sent, "a draft", "ArrowUp")).toBeNull()
    expect(recall(-1, sent, "", "ArrowUp")).toEqual({ cursor: 1, text: "two" })
    expect(recall(1, sent, "two", "ArrowUp")).toEqual({ cursor: 0, text: "one" })
    expect(recall(0, sent, "one", "ArrowUp")).toEqual({ cursor: 0, text: "one" })
    expect(recall(0, sent, "one", "ArrowDown")).toEqual({ cursor: 1, text: "two" })
    expect(recall(1, sent, "two", "ArrowDown")).toEqual({ cursor: -1, text: "" })
    expect(recall(-1, sent, "", "ArrowDown")).toBeNull()
  })

  it("queues, sends one now, moves one up and takes one out", () => {
    const q = (id: string) => ({ id, text: id, attachments: [] })
    let queue = enqueued(enqueued(NO_QUEUE, q("q1")), q("q2"))
    expect(enqueued(queue, q("q0"), true).items.map((x) => x.id)).toEqual(["q0", "q1", "q2"])
    expect(toFront({ ...queue, paused: true }, "q2")).toEqual({ items: [q("q2"), q("q1")], paused: false })
    expect(toFront(queue, "gone")).toBeNull()
    queue = movedUp(queue, "q2")
    expect(queue.items.map((x) => x.id)).toEqual(["q2", "q1"])
    expect(movedUp(queue, "q2").items.map((x) => x.id)).toEqual(["q2", "q1"])
    expect(without(queue, "q2").items.map((x) => x.id)).toEqual(["q1"])
  })

  it("answers a prompt with a digit from an empty field, unless it came up under your typing", () => {
    const options = ["allow", "reject"]
    const key = (k: string, empty = true, meta = false) => ({ key: k, meta, empty })
    const calm = { asked: 10_000, typedBefore: 0, typed: 20_000 }
    expect(answerKey(options, key("2"), calm)).toBe("reject")
    expect(answerKey(options, key("3"), calm)).toBeNull()
    expect(answerKey(options, key("1", false), calm)).toBeNull()
    expect(answerKey(options, key("1", true, true), calm)).toBeNull()
    // Typing when it came up, and still typing: the digit is the message's.
    const busy = { asked: 1000, typedBefore: 900, typed: 1200 }
    expect(answerKey(options, key("1"), busy)).toBeNull()
    expect(answerKey(options, key("1"), { ...busy, typed: 900 + TYPING_GUARD })).toBe("allow")
  })
})
