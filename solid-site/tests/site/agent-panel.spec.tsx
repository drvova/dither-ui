// The agent panel on Solid (`src/widgets/agent/`), held to what its Vue twin
// did: the panel mounted as the Studio mounts it, before any bridge (its
// setup in order, the field's keys, the chat it shows), the composer's
// chips, quotes, edits and settings, the thread's entries and the trays
// over the input, and the two model modules copied for the store's sake.
// Carried from the earlier Vue site's `tests/agent-panel.spec.ts`,
// `tests/agent-compose.spec.ts` and `tests/agent-composer.spec.ts`,
// assertion for assertion, then this port's own.
import { readFileSync } from "node:fs"
import { cleanup, fireEvent, render } from "@solidjs/testing-library"
import { createSignal } from "solid-js"
import { createMutable } from "solid-js/store"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ICONS } from "@dither-kit"
import { createArtboard } from "@/entities/artboard/model/factory"
import type { Queued } from "@/widgets/agent/model/compose"
import { editor } from "../../src/entities/editor"
import { chats, newChat, openChat, openProject, saveThread } from "../../src/features/agent/chats"
import { askAgent, handoff } from "../../src/features/agent/handoff"
import { saveDraft, STUDIO_TOOLS } from "../../src/features/agent/tools"
import { activeProjectId } from "../../src/features/persistence"
import { AgentPanel } from "../../src/widgets/agent"
import type { AgentPanelApi } from "../../src/widgets/agent/AgentPanel"
import { askTitle, STEPS, toolStep } from "../../src/widgets/agent/model/steps"
import {
  changesOf,
  type Entry,
  runLabel,
  secondsOf,
  sentOf,
  STEP_RUN,
  threadBlocks,
  todosOf,
  toolEntry,
} from "../../src/widgets/agent/model/thread"
import Attached from "../../src/widgets/agent/ui/Attached"
import BridgeSetup from "../../src/widgets/agent/ui/BridgeSetup"
import ContextMeter from "../../src/widgets/agent/ui/ContextMeter"
import Prose from "../../src/widgets/agent/ui/Prose"
import ThreadEntry from "../../src/widgets/agent/ui/ThreadEntry"
import TurnTrays, { type TurnTraysProps } from "../../src/widgets/agent/ui/TurnTrays"

/** A thread kept as the project's open chat, as a panel left it. */
function keep(entries: Entry[]) {
  openProject("p1")
  saveThread("p1", chats.active, { entries, usage: { input: 0, output: 0 } }, true)
}
/** What Vue's `nextTick` was to the Vue specs: the watchers of this turn, and
 * what they queued, have run. */
const tick = async () => {
  for (let i = 0; i < 4; i++) await Promise.resolve()
}
const field = (root: HTMLElement) => root.querySelector<HTMLTextAreaElement>('textarea[name="agent-goal"]')!
/** Type into the field, as a reader does (the watchers of the change run). */
async function type(box: HTMLTextAreaElement, text: string) {
  fireEvent.input(box, { target: { value: text } })
  await tick()
}
const key = async (el: Element, init: KeyboardEventInit & { keyCode?: number }) => {
  fireEvent.keyDown(el, init)
  await tick()
}
const click = async (el: Element) => {
  fireEvent.click(el)
  await tick()
}
const get = <T extends Element = HTMLElement>(root: ParentNode, selector: string): T => {
  const el = root.querySelector<T>(selector)
  if (!el) throw new Error(`nothing matches ${selector}`)
  return el
}
const labelled = (root: ParentNode, words: string) =>
  [...root.querySelectorAll("button")].find((b) => b.textContent?.trim() === words)!
/** The panel in the page, with what it told the page. */
async function panel() {
  const activity: string[] = []
  let closed = 0
  let api: AgentPanelApi | undefined
  const view = render(() => (
    <AgentPanel onActivity={(a) => activity.push(a)} onClose={() => closed++} ref={(a) => (api = a)} />
  ))
  await tick()
  return { root: view.container as HTMLElement, activity, closed: () => closed, api: () => api!, unmount: view.unmount }
}

beforeEach(() => {
  localStorage.clear()
  chats.project = ""
  chats.list = []
  chats.active = ""
  activeProjectId.value = "p1"
  handoff.picked.splice(0)
  handoff.asks.splice(0)
  handoff.picking = false
  editor.artboards = []
  editor.selectedIds = []
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe("the agent panel (carried from tests/agent-panel.spec.ts)", () => {
  it("mounts cleanly and brings back the project's draft and thread", async () => {
    const error = vi.spyOn(console, "error")
    keep([{ kind: "user", text: "A sign-in screen", turn: 1 }])
    saveDraft("p1", chats.active, { text: "half a message", attachments: [] })
    const w = await panel()
    expect(error.mock.calls).toEqual([])
    expect(field(w.root).value).toBe("half a message")
    expect(w.root.textContent).toContain("A sign-in screen")
    expect(w.activity[0]).toBe("idle")
  })

  it("recalls a sent message with Up only from an empty field, and Down empties it again", async () => {
    keep([{ kind: "user", text: "A sign-in screen", turn: 1 }])
    const w = await panel()
    const box = field(w.root)
    await type(box, "a draft")
    await key(box, { key: "ArrowUp" })
    expect(box.value).toBe("a draft")
    await type(box, "")
    await key(box, { key: "ArrowUp" })
    expect(box.value).toBe("A sign-in screen")
    await key(box, { key: "ArrowDown" })
    expect(box.value).toBe("")
  })

  it("never sends on the Enter that ends an IME composition", async () => {
    const w = await panel()
    const box = field(w.root)
    await type(box, "こんにちは")
    await key(box, { key: "Enter", isComposing: true })
    await key(box, { key: "Enter", keyCode: 229 })
    expect(box.value).toBe("こんにちは")
  })

  it("puts the command menu away on Esc, keeping what was typed", async () => {
    const w = await panel()
    const box = field(w.root)
    await type(box, "/he")
    expect(w.root.querySelector("#agent-commands")).not.toBeNull()
    await key(box, { key: "Escape" })
    expect(w.root.querySelector("#agent-commands")).toBeNull()
    expect(box.value).toBe("/he")
  })

  it("carries frames picked on the canvas as context, and its pick key turns picking on and off", async () => {
    const frame = createArtboard("button")
    frame.name = "Sign in"
    editor.artboards = [frame]
    handoff.picked.push(frame.id)
    const w = await panel()
    expect(get(w.root, ".card .ctx").textContent).toContain("Sign in")
    await click(get(w.root, 'button[aria-label="Pick frames on the canvas"]'))
    expect(handoff.picking).toBe(true)
    await key(field(w.root), { key: "Escape" })
    expect(handoff.picking).toBe(false)
  })

  it("sets the words on every row as a label, so they centre on their capitals beside a glyph", async () => {
    const frame = createArtboard("button")
    editor.artboards = [frame]
    handoff.picked.push(frame.id)
    keep([
      { kind: "user", text: "A sign-in screen", turn: 1, context: [{ id: frame.id, name: "Sign in" }] },
      { kind: "thought", text: "A form", ms: 2000 },
      { kind: "activity", id: "a", title: "Read the registry", status: "completed" },
      { kind: "worked", ms: 3000, end: "stopped" },
    ])
    const w = await panel()
    const rows = [...w.root.querySelectorAll(".ctx, .status-key, .pill, .key, .row-key, summary, .worked p")]
    expect(rows.length).toBeGreaterThan(6)
    // Bare words on a row sit on their face's line box, high beside a glyph.
    const bare = rows.flatMap((row) =>
      [...row.childNodes]
        .filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim())
        .map(() => row.outerHTML),
    )
    expect(bare).toEqual([])
  })

  it("shows the chat picked in the sidebar, and a new chat starts empty", async () => {
    keep([{ kind: "user", text: "A plum orders table", turn: 1 }])
    const first = chats.active
    const w = await panel()
    newChat()
    await tick()
    expect(w.root.textContent).not.toContain("A plum orders table")
    openChat(first)
    await tick()
    expect(w.root.textContent).toContain("A plum orders table")
  })

  it("takes a message asked at the selection off the canvas's queue", async () => {
    askAgent("make it dark", ["f1"])
    await panel()
    expect(handoff.asks).toEqual([])
  })

  it("keeps its keys from the canvas: an arrow on one of its keys never reaches the page", async () => {
    const w = await panel()
    const seen: string[] = []
    const onKey = (e: KeyboardEvent) => seen.push(e.key)
    window.addEventListener("keydown", onKey)
    await key(get(w.root, ".status-key"), { key: "ArrowRight" })
    await key(get(w.root, ".status-key"), { key: "i", metaKey: true })
    window.removeEventListener("keydown", onKey)
    expect(seen).toEqual(["i"])
  })

  it("stacks its blocks in grids whose one column can shrink, so a long line never widens the panel", () => {
    // A grid's auto column grows to its widest unbreakable line (a path, a
    // code line, a long suggestion) and pushes the panel past its column.
    // A grid that stacks blocks names its column; one that centres a glyph
    // (place-items) holds no text.
    const files = ["AgentPanel.css", "ui/Prose.css", "ui/ThreadEntry.css", "ui/TurnTrays.css"]
    const loose = files.flatMap((f) => {
      const css = readFileSync(`src/widgets/agent/${f}`, "utf8")
      return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
        .filter(([, , body]) => /display:\s*grid/.test(body) && !/place-items|grid-template-columns/.test(body))
        .map(([, sel]) => `${f} ${sel.trim()}`)
    })
    expect(loose).toEqual([])
  })

  it("wraps the composer's words instead of cutting them, its glyphs on the first line", async () => {
    // A to-do, a queued message, a suggestion and a frame's name are
    // content: cut short with an ellipsis they lose words.
    const long = "Place the screen beside the existing revenue chart and line it up with its top edge"
    const trays = render(() => (
      <TurnTrays
        next={[long]}
        todos={[{ content: long, status: "pending" }]}
        queue={[{ id: "q", text: long, attachments: [] }]}
        paused={false}
        run={null}
        changes={{ frames: [{ id: "f", name: long }] }}
        shown={() => true}
      />
    ))
    await click(get(trays.container, ".toggle"))
    const rows = [...trays.container.querySelectorAll(".row")]
    expect(rows.length).toBe(4)
    for (const row of rows) {
      expect(row.classList.contains("first-line")).toBe(true)
      expect(get(row, ".row-label").classList.contains("is-wrap")).toBe(true)
    }
    const frame = createArtboard("button")
    frame.name = long
    editor.artboards = [frame]
    handoff.picked.push(frame.id)
    const w = await panel()
    expect(get(w.root, ".card .ctx").classList.contains("first-line")).toBe(true)
    expect(get(w.root, ".card .ctx .row-label").classList.contains("is-wrap")).toBe(true)
  })

  it("shows how to start the bridge when none answers, and keeps the message", async () => {
    // Nothing listens: every socket fails before it opens, as a closed port does.
    class Refused {
      onopen: (() => void) | null = null
      onerror: (() => void) | null = null
      onclose: (() => void) | null = null
      onmessage: (() => void) | null = null
      constructor() {
        setTimeout(() => {
          this.onerror?.()
          this.onclose?.()
        })
      }
      close() {}
      send() {}
    }
    vi.stubGlobal("WebSocket", Refused)
    const w = await panel()
    await type(field(w.root), "a pricing page")
    await key(field(w.root), { key: "Enter" })
    await new Promise((r) => setTimeout(r, 20))
    await tick()
    const card = get(w.root, "section[aria-labelledby='bridge-setup-title']")
    expect(card.textContent).toContain("Start the bridge")
    expect(get(card, "code").textContent).toMatch(/^curl -fsSL http:\/\/localhost(:\d+)?\/bridge\/dither-bridge\.mjs /)
    expect(get(card, "[role='status']").textContent).toContain("Looking for it at ws://127.0.0.1:8790")
    // No raw error in the thread; the message waits in the field.
    expect(w.root.querySelectorAll(".line-error")).toHaveLength(0)
    expect(field(w.root).value).toBe("a pricing page")
    // The greeting and the starters give the thread to the setup.
    expect(w.root.querySelector(".hello")).toBeNull()
    expect(w.root.querySelector(".starters")).toBeNull()
    expect(w.root.firstElementChild?.classList.contains("is-empty")).toBe(false)
  })
})

describe("the composer (carried from tests/agent-compose.spec.ts)", () => {
  const lines = (n: number) => Array.from({ length: n }, (_, i) => `line ${i}`).join("\n")
  const replied = () =>
    keep([
      { kind: "user", text: "A sign-in screen", turn: 1 },
      { kind: "assistant", text: "Placed it beside the chart." },
    ])

  it("folds a long paste into the composer as a chip, and puts it back as text when pressed", async () => {
    const w = await panel()
    const box = field(w.root)
    const big = lines(30)
    fireEvent.paste(box, { clipboardData: { files: [], getData: () => big } })
    await tick()
    expect(box.value).toBe("")
    const chip = get(w.root, ".chips .unfold")
    expect(chip.textContent).toContain("Pasted text")
    expect(chip.textContent).toContain("30 lines")
    // A short paste stays typed text (the browser inserts it; nothing folds).
    fireEvent.paste(box, { clipboardData: { files: [], getData: () => "two words" } })
    await tick()
    expect(w.root.querySelectorAll(".chips .unfold")).toHaveLength(1)
    await click(chip)
    expect(box.value).toBe(big)
    expect(w.root.querySelector(".chips .unfold")).toBeNull()
  })

  it("takes a reply's Quote key into the composer", async () => {
    replied()
    const w = await panel()
    await click(get(w.root, '[aria-label="Quote reply"]'))
    expect(get(w.root, ".card .chips").textContent).toContain("Quote")
    expect(get(w.root, ".card .chips").textContent).toContain("Placed it beside the chart.")
  })

  it("takes an edit back into the field with a way out, Esc included", async () => {
    replied()
    const w = await panel()
    await click(get(w.root, '[aria-label="Edit from here"]'))
    const box = field(w.root)
    expect(box.value).toBe("A sign-in screen")
    expect(get(w.root, ".editing").textContent).toContain("the messages after it leave the thread")
    await key(box, { key: "Escape" })
    expect(w.root.querySelector(".editing")).toBeNull()
    expect(box.value).toBe("")
  })

  it("brings a chat's draft back with its chips when the panel opens on it", async () => {
    openProject("p1")
    saveDraft("p1", chats.active, {
      text: "half a thought",
      attachments: [{ kind: "quote", name: "Quote", text: "Placed it." }],
    })
    const w = await panel()
    expect(field(w.root).value).toBe("half a thought")
    expect(get(w.root, ".card .chips").textContent).toContain("Quote")
  })

  it("follows the agent from a key in the composer's foot, remembered with the panel's settings", async () => {
    const w = await panel()
    const follow = get(w.root, '[aria-label="Follow the agent"]')
    expect(follow.getAttribute("aria-pressed")).toBe("false")
    await click(follow)
    expect(follow.getAttribute("aria-pressed")).toBe("true")
    expect(JSON.parse(localStorage.getItem("dither-agent-config") ?? "{}").follow).toBe(true)
  })

  it("shows a picked command's hint under the field and keeps a /word that is no command", async () => {
    const w = await panel()
    const box = field(w.root)
    await type(box, "/harness ")
    expect(get(w.root, ".slash-hint").textContent).toBe("/harness <id | command>")
    await type(box, "/frob it")
    await key(box, { key: "Enter" })
    expect(box.value).toBe("/frob it")
    expect(get(w.root, ".notice").textContent).toContain("No command /frob here")
  })

  describe("the queue tray", () => {
    const queue: Queued[] = [
      { id: "q1", text: "first", attachments: [] },
      { id: "q2", text: "second", attachments: [{ kind: "text", id: "a", name: "Pasted text", text: "x" }] },
    ]
    const tray = (paused: boolean, run: boolean, on: Partial<TurnTraysProps> = {}) =>
      render(() => (
        <TurnTrays
          next={[]}
          todos={null}
          queue={queue}
          paused={paused}
          run={run ? { doing: "Working", time: "1s", stopping: false, stuck: false } : null}
          changes={null}
          shown={() => true}
          {...on}
        />
      )).container

    it("edits, sends now, moves up and removes each message", async () => {
      const said: string[] = []
      const w = tray(false, true, {
        onMoveUp: (id) => said.push(`moveUp ${id}`),
        onEditQueued: (id) => said.push(`editQueued ${id}`),
        onSendNow: (id) => said.push(`sendNow ${id}`),
        onUnqueue: (id) => said.push(`unqueue ${id}`),
      })
      expect(w.textContent).toContain("2 in queue")
      expect(w.textContent).toContain("with 1 attachment")
      // Only a message behind another moves up.
      expect(w.querySelector('[aria-label="Move up: first"]')).toBeNull()
      await click(get(w, '[aria-label="Move up: second"]'))
      await click(get(w, '[aria-label="Edit: first"]'))
      await click(labelled(w, "Send now"))
      await click(get(w, '[aria-label="Remove: second"]'))
      expect(said).toEqual(["moveUp q2", "editQueued q1", "sendNow q1", "unqueue q2"])
      // Running: nothing to resume.
      expect(labelled(w, "Send next")).toBeUndefined()
    })

    it("flies the mascot while the turn runs, and only then", () => {
      const flying = get(tray(false, true), ".run .run-mascot")
      expect(flying.getAttribute("aria-hidden")).toBe("true")
      expect(flying.querySelectorAll("rect").length).toBeGreaterThan(0)
      expect(tray(false, false).querySelector(".run-mascot")).toBeNull()
    })

    it("says a stop paused it, and offers to go on", async () => {
      let resumed = 0
      let cleared = 0
      const w = tray(true, false, { onResume: () => resumed++, onClearQueue: () => cleared++ })
      expect(w.textContent).toContain("Paused after the stop")
      await click(labelled(w, "Send next"))
      await click(labelled(w, "Clear"))
      expect([resumed, cleared]).toEqual([1, 1])
    })
  })

  it("offers edit from here only when no turn runs, and copy always", async () => {
    const entry = { kind: "user" as const, text: "A sign-in screen", turn: 1 }
    let edits = 0
    let copies = 0
    const idle = render(() => (
      <ThreadEntry entry={entry} editable onEdit={() => edits++} onCopy={() => copies++} />
    )).container
    await click(get(idle, '[aria-label="Edit from here"]'))
    await click(get(idle, '[aria-label="Copy message"]'))
    expect([edits, copies]).toEqual([1, 1])
    const running = render(() => <ThreadEntry entry={entry} editable={false} />).container
    expect(running.querySelector('[aria-label="Edit from here"]')).toBeNull()
  })

  it("draws the harness's usage as a ring with its share", () => {
    const ring = get(
      render(() => <ContextMeter use={{ used: 52000, size: 200000, cost: { amount: 0.12, currency: "USD" } }} />)
        .container,
      ".meter",
    )
    expect(ring.getAttribute("aria-label")).toBe("Context 26% used: 52k of 200k tokens, $0.12")
    expect(ring.textContent).toBe("26%")
    expect(ring.getAttribute("data-full")).toBeNull()
    const full = get(render(() => <ContextMeter use={{ used: 190000, size: 200000 }} />).container, ".meter")
    expect(full.getAttribute("data-full")).toBe("true")
  })
})

describe("the composer's model", () => {
  describe("a tool call as a step (carried from tests/agent-composer.spec.ts)", () => {
    it("names every Studio tool, with a glyph the kit draws", () => {
      for (const { def: t } of STUDIO_TOOLS) {
        expect(STEPS[t.name], t.name).toBeDefined()
        expect(ICONS[STEPS[t.name].icon], t.name).toBeDefined()
      }
    })

    it("asks for a Studio tool in its own words, and names any other MCP tool by its tool and server", () => {
      expect(askTitle("mcp__dither-studio__dither", { run: "add_screen", args: {} })).toBe("Add a screen to the canvas")
      expect(askTitle("mcp__dither-studio__dither", { find: "a sign-in screen" })).toBe(
        "Look for the actions that fit the job",
      )
      expect(
        askTitle("mcp__dither-studio__dither", { build: { name: "sign_in_flow", description: "x", code: "1" } }),
      ).toBe("Build a tool for the job: sign in flow")
      expect(askTitle("mcp__dither-studio__dither")).toBe("Use the Studio")
      expect(askTitle("mcp__github__create_issue")).toBe("create issue (github)")
      expect(askTitle("Run npm test")).toBe("Run npm test")
      for (const { def: t } of STUDIO_TOOLS) expect(STEPS[t.name].ask, t.name).toMatch(/^[A-Z]/)
    })

    it("says what it touched and gathers the frames an edit changed", () => {
      const ok = (data: unknown) => ({ ok: true as const, data })
      expect(toolStep("add_screen", { name: "Sign in" }, ok({ id: "a1", name: "Sign in", kind: "screen" }))).toEqual({
        icon: "Layout",
        title: "Added the screen Sign in",
        changed: [{ id: "a1", name: "Sign in" }],
        mutates: true,
      })
      const evolve = toolStep(
        "evolve",
        {},
        ok([
          { id: "v1", name: "A 1" },
          { id: "v2", name: "A 2" },
        ]),
      )
      expect(evolve.title).toBe("Evolved 2 variants")
      expect(evolve.changed).toHaveLength(2)
      // A read changes nothing; a failed edit changes nothing.
      expect(toolStep("get_code", {}, ok({ id: "a1", name: "Sign in", code: "" }))).toMatchObject({
        title: "Read the code of Sign in",
        changed: [],
        mutates: false,
      })
      expect(toolStep("add_component", { is: "DitherSlider" }, { ok: false, error: "no" })).toMatchObject({
        title: "Added DitherSlider",
        changed: [],
      })
      // A tool the Studio does not know is its name in words.
      expect(toolStep("read_file", {}, ok(null))).toMatchObject({
        title: "read file",
        icon: "Terminal",
        mutates: false,
      })
    })
  })

  describe("the thread's readings (carried from tests/agent-composer.spec.ts)", () => {
    const ok = (data: unknown) => ({ ok: true as const, data })
    const step = (name: string, turn: number, data: unknown = { id: `${name}-${turn}`, name }) =>
      toolEntry(name, {}, ok(data), turn)
    const activity = (id: string, status = "completed"): Entry => ({ kind: "activity", id, title: id, status })

    it("takes the to-dos from the latest turn's plan only", () => {
      const plan = (content: string): Entry => ({ kind: "plan", entries: [{ content, status: "pending" }] })
      expect(todosOf([plan("old"), { kind: "user", text: "next" }])).toBeNull()
      expect(todosOf([plan("old"), { kind: "user", text: "next" }, plan("a"), plan("b")])?.[0].content).toBe("b")
    })

    it("gathers what a turn changed: its landed edits, each frame once under its latest name", () => {
      const entries: Entry[] = [
        step("add_screen", 1, { id: "s", name: "Sign in" }),
        step("add_screen", 2, { id: "t", name: "Table" }),
        step("update_artboard", 2, { id: "t", name: "Orders" }),
        step("get_code", 2, { id: "t", name: "Orders", code: "" }),
        toolEntry("add_chart", {}, { ok: false, error: "no" }, 2),
      ]
      expect(changesOf(entries, 2)).toEqual({ turn: 2, steps: 2, frames: [{ id: "t", name: "Orders" }] })
      expect(changesOf(entries, 3)).toBeNull()
    })

    it("folds a run of steps into one block, and leaves a short run and plans alone", () => {
      const short = threadBlocks([activity("a"), activity("b"), { kind: "assistant", text: "done" }])
      expect(short.map((b) => b.kind)).toEqual(["entry", "entry", "entry"])
      const run: Entry[] = [
        { kind: "user", text: "go" },
        activity("a"),
        { kind: "plan", entries: [] },
        step("add_screen", 1),
        toolEntry("add_chart", {}, { ok: false, error: "no" }, 1),
        activity("d", "in_progress"),
        { kind: "assistant", text: "done" },
      ]
      const blocks = threadBlocks(run)
      expect(blocks.map((b) => b.kind)).toEqual(["entry", "steps", "entry"])
      const folded = blocks[1]
      expect(folded).toMatchObject({ kind: "steps", at: 1, failed: 1, running: true })
      if (folded.kind === "steps") expect(folded.items.map((i) => i.at)).toEqual([1, 3, 4, 5])
      expect(STEP_RUN).toBe(3)
    })

    it("shows a delivered file by its path and opens a failed step", () => {
      const video = toolEntry("export_video", {}, ok({ files: [{ path: "video/a/index.html", content: "<html>" }] }), 1)
      expect(video.detail).toContain('"video/a/index.html"')
      expect(video.detail).not.toContain("<html>")
      expect(video.open).toBe(false)
      expect(toolEntry("add_chart", {}, { ok: false, error: "no chart" }, 1)).toMatchObject({ open: true, ok: false })
    })

    it("says what a run of steps did, in the order each kind first came up", () => {
      const act = (tool?: string, status = "completed"): Entry => ({
        kind: "activity",
        id: "x",
        title: "x",
        status,
        tool,
      })
      expect(
        runLabel([
          act("read"),
          act("read"),
          act("search"),
          act("read"),
          act("execute"),
          step("add_screen", 1),
          step("get_code", 1),
          act("move"),
          act(),
        ]),
      ).toBe(
        "Read 3 files, searched once, ran 1 command, made 1 edit on the canvas, looked at the canvas once, edited 1 file, took 1 other step",
      )
      expect(runLabel([act("search"), act("search"), act("fetch", "failed")])).toBe(
        "Searched twice, fetched 1 page, 1 failed",
      )
    })

    it("walks back through what was sent, a repeat in a row once", () => {
      expect(
        sentOf([
          { kind: "user", text: "a" },
          { kind: "assistant", text: "ok" },
          { kind: "user", text: "a" },
          { kind: "followup", text: "b" },
          { kind: "user", text: "a" },
        ]),
      ).toEqual(["a", "b", "a"])
    })

    it("says a length in whole seconds, minutes past sixty", () => {
      expect(secondsOf(200)).toBe("1s")
      expect(secondsOf(12_400)).toBe("12s")
      expect(secondsOf(65_000)).toBe("1m 5s")
    })
  })
})

describe("the panel's own", () => {
  it("answers the page: close from its head, focus through its ref, a new chat from its key", async () => {
    keep([{ kind: "user", text: "A plum orders table", turn: 1 }])
    const w = await panel()
    expect(get(w.root, ".head .title").textContent).toBe("A plum orders table")
    await click(get(w.root, '[aria-label="Close the chat"]'))
    expect(w.closed()).toBe(1)
    get<HTMLButtonElement>(w.root, ".status-key").focus()
    w.api().focus()
    await tick()
    expect(document.activeElement).toBe(field(w.root))
    await click(get(w.root, '[aria-label="New chat"]'))
    expect(w.root.textContent).not.toContain("A plum orders table")
    expect(get(w.root, ".head .title").textContent).toBe("New chat")
    expect(get(w.root, ".hello-title").textContent).toBe("What are we making?")
    expect(w.root.querySelectorAll(".starters .starter")).toHaveLength(3)
  })

  it("keeps what is being written in the chat it was written in", async () => {
    keep([{ kind: "user", text: "A plum orders table", turn: 1 }])
    const first = chats.active
    const w = await panel()
    await type(field(w.root), "not sent yet")
    newChat()
    await tick()
    expect(field(w.root).value).toBe("")
    openChat(first)
    await tick()
    expect(field(w.root).value).toBe("not sent yet")
    // Unmounting keeps it too.
    await type(field(w.root), "left on close")
    w.unmount()
    expect(JSON.parse(localStorage.getItem(`dither-agent-draft-p1/${first}`) ?? "{}").text).toBe("left on close")
  })

  it("lists its commands as a listbox the field announces, the arrows moving its option", async () => {
    const w = await panel()
    const box = field(w.root)
    expect(box.getAttribute("aria-expanded")).toBe("false")
    expect(box.hasAttribute("aria-controls")).toBe(false)
    await type(box, "/")
    const options = () => [...w.root.querySelectorAll("#agent-commands [role='option']")]
    expect(options().length).toBeGreaterThan(5)
    expect(box.getAttribute("aria-expanded")).toBe("true")
    expect(box.getAttribute("aria-controls")).toBe("agent-commands")
    expect(box.getAttribute("aria-activedescendant")).toBe("agent-command-0")
    expect(options()[0].getAttribute("aria-selected")).toBe("true")
    await key(box, { key: "ArrowDown" })
    expect(box.getAttribute("aria-activedescendant")).toBe("agent-command-1")
    expect(options()[1].classList.contains("is-active")).toBe(true)
    await key(box, { key: "ArrowUp" })
    await key(box, { key: "ArrowUp" })
    expect(box.getAttribute("aria-activedescendant")).toBe(`agent-command-${options().length - 1}`)
    // Tab completes the highlighted command into the field.
    await type(box, "/he")
    await key(box, { key: "Tab" })
    expect(box.value).toBe("/help")
    // A click picks one, with room for what it takes.
    await type(box, "/har")
    await click(options()[0])
    expect(box.value).toBe("/harness ")
  })

  it("runs its own commands without a bridge: /help lists them, /clear empties the thread", async () => {
    keep([{ kind: "user", text: "A plum orders table", turn: 1 }])
    const w = await panel()
    const box = field(w.root)
    await type(box, "/help")
    await key(box, { key: "Enter" })
    expect(box.value).toBe("")
    expect(get(w.root, ".line-system").textContent).toContain("/harness <id | command>: start a harness")
    await type(box, "/clear")
    await key(box, { key: "Enter" })
    expect(w.root.querySelector(".line-system")).toBeNull()
    expect(w.root.querySelector(".hello")).not.toBeNull()
    await type(box, "/auto on")
    await key(box, { key: "Enter" })
    expect(get(w.root, ".line-system").textContent).toBe("auto-approve on")
    expect(get(w.root, ".status-key").getAttribute("aria-pressed")).toBe("true")
    expect(get(w.root, ".status-key").textContent).toBe("Auto")
  })

  it("adds a frame by name from the @ picker, and leaves one out from its chip", async () => {
    const a = createArtboard("button")
    a.name = "Sign in"
    const b = createArtboard("area")
    b.name = "Revenue"
    editor.artboards = [a, b]
    const w = await panel()
    const box = field(w.root)
    await type(box, "look at @rev")
    const rows = [...w.root.querySelectorAll("#agent-frames [role='option']")]
    expect(rows.map((r) => r.textContent)).toEqual(["Revenue"])
    await key(box, { key: "Enter" })
    expect(box.value).toBe("look at ")
    expect(handoff.picked).toEqual([b.id])
    expect(get(w.root, ".card .ctx").textContent).toContain("Revenue")
    // The @ key opens the same list of what is left; Esc puts it away.
    await click(get(w.root, '[aria-label="Add a frame by name"]'))
    expect([...w.root.querySelectorAll("#agent-frames [role='option']")].map((r) => r.textContent)).toEqual(["Sign in"])
    await key(box, { key: "Escape" })
    expect(w.root.querySelector("#agent-frames")).toBeNull()
    await click(get(w.root, '[aria-label="Leave Revenue out"]'))
    expect(handoff.picked).toEqual([])
    expect(w.root.querySelector(".card .chips")).toBeNull()
  })

  it("opens its settings over the composer: the bridge's address trimmed, kept as typed", async () => {
    const w = await panel()
    await click(get(w.root, '[aria-label="Settings"]'))
    const url = get<HTMLInputElement>(w.root, 'input[name="agent-bridge-url"]')
    expect(url.value).toBe("ws://127.0.0.1:8790")
    fireEvent.input(url, { target: { value: " ws://127.0.0.1:9000 " } })
    await tick()
    expect(JSON.parse(localStorage.getItem("dither-agent-config") ?? "{}").bridgeUrl).toBe("ws://127.0.0.1:9000")
    expect(get(w.root, ".pop.menu").textContent).toContain("0 in, 0 out")
    // A key typed in a field of the panel stays in that field.
    get<HTMLButtonElement>(w.root, ".status-key").focus()
    await key(url, { key: "x" })
    expect(document.activeElement).not.toBe(field(w.root))
    // One typed on a key of the panel lands in the message.
    await key(get(w.root, ".status-key"), { key: "x" })
    expect(document.activeElement).toBe(field(w.root))
  })

  it("draws a run of steps folded under what it did, each step inside it", async () => {
    keep([
      { kind: "user", text: "go", turn: 1 },
      { kind: "activity", id: "a", title: "Read the registry", status: "completed", tool: "read" },
      { kind: "activity", id: "b", title: "Read the tokens", status: "completed", tool: "read" },
      { kind: "activity", id: "c", title: "Searched the kit", status: "failed", tool: "search" },
      { kind: "assistant", text: "Done." },
    ])
    const w = await panel()
    const group = get<HTMLDetailsElement>(w.root, "details.group")
    expect(group.open).toBe(false)
    expect(get(group, "summary").textContent).toBe("Read 2 files, searched once, 1 failed")
    expect([...group.querySelectorAll(".group-body .activity")].map((r) => r.textContent)).toEqual([
      "Read the registry",
      "Read the tokens",
      "Searched the kit",
    ])
    expect(w.root.querySelectorAll(".log > .thread-entry-scope")).toHaveLength(2)
  })
})

/** A bridge that answers: a socket standing where the local bridge would,
 * with one harness already running behind it. The spec plays the harness. */
class Bridge {
  static open: Bridge | null = null
  /** What the harness's new session says of itself (its options). */
  static session: object = {}
  onopen: (() => void) | null = null
  onerror: (() => void) | null = null
  onclose: (() => void) | null = null
  onmessage: ((ev: { data: string }) => void) | null = null
  /** Everything the page sent, parsed. */
  sent: { id?: string; method?: string; params?: Record<string, unknown>; result?: unknown }[] = []
  closed = false
  constructor() {
    Bridge.open = this
    setTimeout(() => {
      this.onopen?.()
      this.say({
        method: "bridge/hello",
        params: {
          cwd: "/home/me/site",
          harnesses: [{ id: "claude", name: "Claude Code", command: "claude-code-acp", installed: true }],
          agent: { id: "claude", name: "claude-code-acp" },
        },
      })
    })
  }
  say(message: object) {
    this.onmessage?.({ data: JSON.stringify({ jsonrpc: "2.0", ...message }) })
  }
  send(json: string) {
    const m = JSON.parse(json) as Bridge["sent"][number]
    this.sent.push(m)
    if (m.method === "initialize") this.say({ id: m.id, result: { agentInfo: { name: "claude-code-acp" } } })
    if (m.method === "session/new") this.say({ id: m.id, result: { sessionId: "s1", ...Bridge.session } })
  }
  close() {
    this.closed = true
    this.onclose?.()
  }
  update(update: object) {
    this.say({ method: "session/update", params: { sessionId: "s1", update } })
  }
  /** The prompts asked so far, and the end of the newest. */
  get prompts() {
    return this.sent.filter((m) => m.method === "session/prompt")
  }
  end(stopReason: string) {
    this.say({ id: this.prompts[this.prompts.length - 1].id, result: { stopReason } })
  }
}
/** The page's turn and the socket's have both run. */
const settle = async () => {
  for (let i = 0; i < 3; i++) {
    await new Promise((r) => setTimeout(r, 2))
    await tick()
  }
}

describe("a turn with the harness", () => {
  beforeEach(() => {
    Bridge.open = null
    Bridge.session = {}
    vi.stubGlobal("WebSocket", Bridge)
  })

  it("streams the thought and the reply, asks in place, queues a follow-up and stops on Esc", async () => {
    const w = await panel()
    const box = field(w.root)
    await type(box, "A sign-in screen")
    await key(box, { key: "Enter" })
    await settle()
    const bridge = Bridge.open!
    // The bridge answered and its harness goes by the name people know.
    expect(get(w.root, ".foot .pill").textContent).toBe("Claude Code")
    expect(get(w.root, ".foot .led").getAttribute("data-on")).toBe("true")
    expect(get(w.root, ".status-key.is-static").textContent).toBe("site")
    expect(w.root.querySelector(".who .tool-mark")).not.toBeNull()
    // The message is a bubble, the field is empty, the run row counts.
    expect(box.value).toBe("")
    expect(get(w.root, ".msg-text").textContent).toBe("A sign-in screen")
    expect(bridge.prompts).toHaveLength(1)
    expect(JSON.stringify(bridge.prompts[0].params)).toContain("A sign-in screen")
    expect(get(w.root, ".run .run-time").textContent).toBe("Working for 1s")
    expect(box.placeholder).toBe("Queue a follow-up")
    expect(w.activity).toEqual(["idle", "working"])
    expect(w.root.querySelector('[aria-label="Edit from here"]')).toBeNull()

    bridge.update({ sessionUpdate: "agent_thought_chunk", content: { type: "text", text: "A form, " } })
    bridge.update({ sessionUpdate: "agent_thought_chunk", content: { type: "text", text: "two fields" } })
    const thought = get<HTMLDetailsElement>(w.root, "details.thought")
    expect(thought.open).toBe(true)
    expect(get(thought, "summary").textContent).toBe("Thinking")
    expect(get(thought, ".thought-text").textContent).toBe("A form, two fields")
    expect(get(w.root, ".run .run-time").textContent).toBe("Thinking for 1s")

    bridge.update({ sessionUpdate: "agent_message_chunk", content: { type: "text", text: "Placing the " } })
    bridge.update({ sessionUpdate: "agent_message_chunk", content: { type: "text", text: "**screen**." } })
    // The thought folded under how long it took; the reply streams, no keys yet.
    expect(thought.open).toBe(false)
    expect(get(thought, "summary").textContent).toMatch(/^Thought/)
    expect(w.root.querySelectorAll(".reply")).toHaveLength(1)
    expect(get(w.root, ".reply .prose").textContent).toBe("Placing the screen.")
    expect(get(w.root, ".reply strong").textContent).toBe("screen")
    expect(w.root.querySelector(".reply .caret")).not.toBeNull()
    expect(w.root.querySelector(".reply-actions")).toBeNull()
    expect(get(w.root, ".run .run-time").textContent).toBe("Writing for 1s")

    // A permission prompt is answered on its own row.
    bridge.say({
      id: "p1",
      method: "session/request_permission",
      params: {
        toolCall: { title: "Run npm test" },
        options: [
          { optionId: "yes", name: "Allow", kind: "allow_once" },
          { optionId: "no", name: "Reject", kind: "reject_once" },
        ],
      },
    })
    await settle()
    expect(get(w.root, ".approval-title").textContent).toBe("Run npm test")
    expect(get(w.root, "[role='status']").textContent).toBe("Needs your answer")
    expect(box.placeholder).toBe("Answer 1 to 2, or redirect")
    expect(w.activity[w.activity.length - 1]).toBe("waiting")
    const choices = [...w.root.querySelectorAll(".choices .key")]
    expect(choices.map((c) => c.textContent)).toEqual(["1Allow", "2Reject"])
    await click(choices[0])
    await settle()
    expect(bridge.sent.find((m) => m.id === "p1")?.result).toEqual({
      outcome: { outcome: "selected", optionId: "yes" },
    })
    expect(get(w.root, ".approval").getAttribute("data-answered")).toBe("true")
    expect(get(w.root, ".approval .note").textContent).toBe("Answered yes")
    expect(w.activity[w.activity.length - 1]).toBe("working")

    // Written while the turn runs, a message waits in the queue.
    await type(box, "then make it dark")
    await key(box, { key: "Enter" })
    expect(box.value).toBe("")
    expect(get(w.root, ".grow").textContent).toBe("1 in queue")
    expect(get(w.root, "[role='status']").textContent).toBe("Queued")
    expect(bridge.prompts).toHaveLength(1)

    // The turn ends on its own: its close, then the queued message as its own turn.
    bridge.end("end_turn")
    await settle()
    expect(get(w.root, ".worked p").textContent).toMatch(/^Worked for \ds$/)
    expect(w.root.querySelector(".reply .caret")).toBeNull()
    expect(w.root.querySelector(".reply-actions")).not.toBeNull()
    expect(bridge.prompts).toHaveLength(2)
    expect(JSON.stringify(bridge.prompts[1].params)).toContain("then make it dark")
    expect(w.root.querySelector(".grow")).toBeNull()
    expect([...w.root.querySelectorAll(".msg-text")].map((m) => m.textContent)).toEqual([
      "A sign-in screen",
      "then make it dark",
    ])

    // Esc stops the turn: the harness is told, and the close offers to go on.
    await key(box, { key: "Escape" })
    expect(bridge.sent.some((m) => m.method === "session/cancel")).toBe(true)
    expect(get(w.root, ".run .quiet").textContent).toBe("Stopping…")
    expect(box.placeholder).toBe("Queue for after the stop")
    bridge.end("cancelled")
    await settle()
    expect(w.root.querySelector(".run")).toBeNull()
    const closes = [...w.root.querySelectorAll(".worked")]
    expect(closes[closes.length - 1].getAttribute("data-end")).toBe("stopped")
    expect(labelled(closes[closes.length - 1], "Continue")).toBeDefined()
    expect(get(w.root, "[role='status']").textContent).toBe("Stopped")
    expect(w.activity[w.activity.length - 1]).toBe("idle")
    expect(box.placeholder).toBe("Ask, / for commands")

    // The thread is kept as the project's open chat, under its first message.
    expect(chats.list.map((c) => c.title)).toEqual(["A sign-in screen"])
    const kept = JSON.parse(localStorage.getItem(`dither-agent-session-p1/${chats.active}`) ?? "{}")
    expect(kept.entries.map((e: Entry) => e.kind)).toEqual([
      "user",
      "thought",
      "assistant",
      "approval",
      "worked",
      "user",
      "worked",
    ])
    w.unmount()
    expect(bridge.closed).toBe(true)
  })

  it("shows the model the harness runs and its other settings, each asked of the harness", async () => {
    Bridge.session = {
      configOptions: [
        {
          id: "model",
          name: "Model",
          category: "model",
          type: "select",
          currentValue: "opus",
          options: [
            { value: "opus", name: "Opus", description: "The deep one" },
            { value: "sonnet", name: "Sonnet" },
          ],
        },
        {
          id: "effort",
          name: "Effort",
          type: "select",
          currentValue: "high",
          options: [
            { value: "low", name: "Low" },
            { value: "high", name: "High" },
          ],
        },
      ],
    }
    const w = await panel()
    await click(get(w.root, ".foot .pill"))
    await settle()
    const bridge = Bridge.open!
    // The picker lists the bridge's harnesses, the running one pressed.
    const rows = [...w.root.querySelectorAll("#agent-harness-picker > .pop-row")]
    expect(rows.map((r) => r.getAttribute("aria-pressed"))).toEqual(["true"])
    expect(rows[0].textContent).toBe("Claude Codeon this path")
    expect(get(w.root, "#agent-harness-picker .pop-foot .pop-row").textContent).toBe("Stop claude-code-acp")
    expect(get<HTMLButtonElement>(w.root, "#agent-harness-picker .custom .key").disabled).toBe(true)
    const model = [...w.root.querySelectorAll(".foot .pill")][1]
    expect(model.textContent).toBe("Opus")
    await click(model)
    expect(w.root.querySelector("#agent-harness-picker")).toBeNull()
    const options = [...w.root.querySelectorAll("#agent-model-picker .pop-row")]
    expect(options.map((o) => o.getAttribute("aria-pressed"))).toEqual(["true", "false"])
    expect(options[0].textContent).toBe("OpusThe deep one")
    await click(options[1])
    await settle()
    expect(bridge.sent.find((m) => m.method === "session/set_config_option")?.params).toMatchObject({
      configId: "model",
      value: "sonnet",
    })
    expect(w.root.querySelector("#agent-model-picker")).toBeNull()
    await click(get(w.root, '[aria-label="Settings"]'))
    const effort = get<HTMLSelectElement>(w.root, 'select[name="agent-setting-effort"]')
    expect(effort.previousElementSibling?.textContent).toBe("effort")
    expect(effort.value).toBe("high")
    fireEvent.change(effort, { target: { value: "low" } })
    await settle()
    expect(bridge.sent.filter((m) => m.method === "session/set_config_option")[1]?.params).toMatchObject({
      configId: "effort",
      value: "low",
    })
    expect(get(w.root, ".pop.menu").textContent).toContain(", in /home/me/site")
  })

  it("lands the harness's edit on the canvas as a step, and puts the canvas back from the changes bar", async () => {
    const w = await panel()
    const box = field(w.root)
    await type(box, "A badge")
    await key(box, { key: "Enter" })
    await settle()
    const bridge = Bridge.open!
    bridge.say({
      id: "t1",
      method: "studio/call",
      params: {
        name: "dither",
        arguments: { run: "add_component", args: { is: "DitherBadge", name: "Buy", slotText: "New" } },
      },
    })
    await settle()
    expect(bridge.sent.find((m) => m.id === "t1")?.result).toMatchObject({ ok: true })
    expect(editor.artboards.map((a) => a.name)).toEqual(["Buy"])
    expect(get(w.root, "details.step summary").textContent).toContain("Buy")
    bridge.end("end_turn")
    await settle()
    // What the turn changed rests on the card until kept or undone.
    expect(get(w.root, ".toggle").textContent).toBe("1 frame changed")
    expect(w.root.querySelectorAll(".part .row.is-key").length).toBeGreaterThan(0)
    expect(w.root.querySelector('[aria-label="Restore checkpoint"]')).not.toBeNull()
    await click(labelled(w.root, "Undo all"))
    expect(editor.artboards).toHaveLength(0)
    expect(w.root.querySelector(".toggle")).toBeNull()
    const lines = [...w.root.querySelectorAll(".line-system")]
    expect(lines[lines.length - 1].textContent).toBe("Put the canvas back to before that message")
  })
})

describe("the thread's entries", () => {
  it("folds a long message to its first lines until opened", async () => {
    const text = Array.from({ length: 12 }, (_, i) => `line ${i}`).join("\n")
    const w = render(() => <ThreadEntry entry={{ kind: "user", text }} />).container
    expect(get(w, ".msg-text").textContent).toBe(text)
    expect(get(w, ".msg-text").getAttribute("data-folded")).toBe("true")
    const more = get(w, ".more")
    expect(more.getAttribute("aria-expanded")).toBe("false")
    await click(more)
    expect(get(w, ".msg-text").hasAttribute("data-folded")).toBe(false)
    expect(more.textContent).toBe("Show less")
    expect(
      render(() => <ThreadEntry entry={{ kind: "user", text: "short" }} />).container.querySelector(".more"),
    ).toBeNull()
  })

  it("shows what a message carried: its frames, pictured or not, and its attachments", () => {
    const w = render(() => (
      <ThreadEntry
        restorable
        entry={{
          kind: "user",
          text: "Make it dark",
          context: [{ id: "f", name: "Sign in" }],
          pictured: true,
          attached: [{ kind: "quote", name: "Quote", detail: "Placed it." }],
        }}
      />
    )).container
    const chips = [...w.querySelectorAll(".msg .chips .ctx")]
    expect(chips.map((c) => c.getAttribute("title"))).toEqual(["Sign in, sent with a picture", "Quote, Placed it."])
    expect(w.querySelector('[aria-label="Restore checkpoint"]')).not.toBeNull()
  })

  it("streams a reply without its keys, a thought open under how long it took", async () => {
    const entry = createMutable({ kind: "assistant" as const, text: "Placing" })
    const [live, setLive] = createSignal(true)
    const w = render(() => <ThreadEntry entry={entry} live={live()} />).container
    expect(w.querySelector(".reply-actions")).toBeNull()
    expect(w.querySelector(".caret")).not.toBeNull()
    entry.text = "Placing the **screen**."
    expect(get(w, ".prose strong").textContent).toBe("screen")
    setLive(false)
    expect(w.querySelector(".caret")).toBeNull()
    expect(w.querySelector('[aria-label="Copy reply"]')).not.toBeNull()

    const toggles: boolean[] = []
    const thought = render(() => (
      <ThreadEntry
        entry={{ kind: "thought", text: " A form ", ms: 2400, open: true }}
        onToggle={(o) => toggles.push(o)}
      />
    )).container
    const fold = get<HTMLDetailsElement>(thought, "details.thought")
    expect(fold.open).toBe(true)
    expect(get(fold, "summary").textContent).toBe("Thought for 2s")
    expect(get(fold, ".thought-text").textContent).toBe("A form")
    fold.open = false
    fold.dispatchEvent(new Event("toggle"))
    expect(toggles).toEqual([false])
    const thinking = render(() => <ThreadEntry entry={{ kind: "thought", text: "" }} live />).container
    expect(get(thinking, "summary").textContent).toBe("Thinking")
    expect(thinking.querySelector("summary .spin")).not.toBeNull()
  })

  it("draws a step with its glyph and detail, failed ones marked", () => {
    const step = toolEntry("add_chart", { chart: "area" }, { ok: false, error: "no chart" }, 1)
    const w = render(() => <ThreadEntry entry={step} />).container
    const fold = get<HTMLDetailsElement>(w, "details.step")
    expect(fold.getAttribute("data-ok")).toBe("false")
    expect(fold.open).toBe(true)
    expect(get(fold, ".detail").textContent).toBe(step.detail)
    const running = render(() => (
      <ThreadEntry entry={{ kind: "activity", id: "a", title: "Reading", status: "in_progress" }} />
    )).container
    expect(get(running, ".activity").getAttribute("data-status")).toBe("in_progress")
    expect(running.querySelector(".activity .spin")).not.toBeNull()
  })

  it("answers a permission prompt in place, its choices numbered when it takes the keys", async () => {
    const entry = createMutable<Entry>({
      kind: "approval",
      title: "Run sign in flow, a tool your harness built",
      options: [
        { id: "run", label: "Run it", primary: true },
        { id: "no", label: "Don't run" },
      ],
      answered: null,
      code: "const a = 1\nreturn a",
    })
    const answers: string[] = []
    const w = render(() => <ThreadEntry entry={entry} numbered onAnswer={(id) => answers.push(id)} />).container
    expect(get(w, ".approval").getAttribute("data-answered")).toBe("false")
    expect(get(w, ".approval-code summary").textContent).toBe("Its code, 2 lines")
    expect(get<HTMLDetailsElement>(w, ".approval-code").open).toBe(true)
    const keys = [...w.querySelectorAll(".choices .key")]
    expect(keys.map((k) => k.getAttribute("aria-keyshortcuts"))).toEqual(["1", "2"])
    expect(keys[0].classList.contains("is-primary")).toBe(true)
    expect(keys[1].classList.contains("is-primary")).toBe(false)
    await click(keys[1])
    expect(answers).toEqual(["no"])
    if (entry.kind === "approval") entry.answered = "no"
    expect(w.querySelector(".choices")).toBeNull()
    expect(get(w, ".note").textContent).toBe("Answered no")
    expect(get(w, ".approval").getAttribute("data-answered")).toBe("true")
  })

  it("closes a turn with how it ended, and its next move while it is the latest", async () => {
    let continued = 0
    let again = 0
    const stopped = render(() => (
      <ThreadEntry entry={{ kind: "worked", ms: 65_000, end: "stopped" }} latest onContinue={() => continued++} />
    )).container
    expect(get(stopped, ".worked p").textContent).toBe("Stopped after 1m 5s")
    await click(labelled(stopped, "Continue"))
    const failed = render(() => (
      <ThreadEntry entry={{ kind: "worked", ms: 2000, end: "failed" }} latest onAgain={() => again++} />
    )).container
    expect(get(failed, ".worked").getAttribute("data-end")).toBe("failed")
    await click(labelled(failed, "Try again"))
    expect([continued, again]).toEqual([1, 1])
    const done = render(() => <ThreadEntry entry={{ kind: "worked", ms: 2000 }} latest />).container
    expect(get(done, ".worked p").textContent).toBe("Worked for 2s")
    expect(done.querySelector("button")).toBeNull()
    const earlier = render(() => <ThreadEntry entry={{ kind: "worked", ms: 2000, end: "stopped" }} />).container
    expect(earlier.querySelector("button")).toBeNull()
    expect(
      get(render(() => <ThreadEntry entry={{ kind: "error", text: "no bridge" }} />).container, ".line-error")
        .textContent,
    ).toBe("no bridge")
  })
})

describe("the reply as prose", () => {
  it("sets each block as its element, never as HTML", () => {
    const text =
      '## Plan\nI added a **sign-in** screen with `DitherInput`.\n\n- email\n- password\n1. one\n```vue\n<DitherButton />\n```\n<img src=x onerror="alert(1)">'
    const w = render(() => <Prose text={text} />).container
    const prose = get(w, ".prose")
    expect([...prose.children].map((c) => c.tagName)).toEqual(["H4", "P", "UL", "OL", "DIV", "P"])
    expect(get(prose, "h4").className).toBe("h")
    expect(get(prose, "p").innerHTML).toBe("I added a <strong>sign-in</strong> screen with <code>DitherInput</code>.")
    expect([...prose.querySelectorAll("ul li")].map((li) => li.textContent)).toEqual(["email", "password"])
    expect(get(prose, "pre").getAttribute("data-lang")).toBe("vue")
    expect(get(prose, "pre code").textContent).toBe("<DitherButton />")
    expect(prose.querySelector("img")).toBeNull()
    expect(prose.lastElementChild?.textContent).toBe('<img src=x onerror="alert(1)">')
  })

  it("copies a code block from its key, and shows the caret only while it streams", async () => {
    const writeText = vi.fn(async () => {})
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } })
    const [text, setText] = createSignal("")
    const [live, setLive] = createSignal(true)
    const w = render(() => <Prose text={text()} live={live()} />).container
    expect(w.querySelectorAll(".prose > p > .caret")).toHaveLength(1)
    setText("Here:\n```ts\nconst a = 1")
    // The block still streaming has no copy key yet.
    expect(w.querySelector(".code-copy")).toBeNull()
    expect(w.querySelector(".caret")).toBeNull()
    setLive(false)
    const copy = get(w, ".code-copy")
    expect(copy.getAttribute("aria-label")).toBe("Copy code")
    await click(copy)
    expect(writeText).toHaveBeenCalledWith("const a = 1")
    expect(copy.getAttribute("aria-label")).toBe("Copied")
  })
})

describe("the composer's chips and the bridge card", () => {
  it("draws what a message carries: a text to put back, a quote, a picture's thumbnail, each to remove", async () => {
    const said: string[] = []
    const w = render(() => (
      <Attached
        attachments={[
          { kind: "text", id: "t", name: "Pasted text", text: "a\nb" },
          { kind: "quote", id: "q", name: "Quote", text: "Placed it." },
          { kind: "image", id: "i", name: "shot.png", mimeType: "image/png", data: "iVBORw0K", w: 10, h: 20 },
        ]}
        onRemove={(id) => said.push(`remove ${id}`)}
        onUnfold={(id) => said.push(`unfold ${id}`)}
      />
    )).container
    const chips = [...w.querySelectorAll(".ctx")]
    expect(chips.map((c) => c.getAttribute("data-kind"))).toEqual(["text", "quote", "image"])
    expect(chips.every((c) => c.classList.contains("first-line"))).toBe(true)
    expect(get(chips[0], ".unfold").getAttribute("title")).toBe("Put Pasted text back in the field as text")
    expect(chips[1].querySelector(".unfold")).toBeNull()
    expect(get(chips[2], "img.thumb").getAttribute("src")).toBe("data:image/png;base64,iVBORw0K")
    await click(get(chips[0], ".unfold"))
    await click(get(chips[2], '[aria-label="Remove shot.png"]'))
    expect(said).toEqual(["unfold t", "remove i"])
  })

  it("says the line that starts the bridge, and looks again when asked", async () => {
    let looks = 0
    const [looking, setLooking] = createSignal(true)
    const w = render(() => (
      <BridgeSetup looking={looking()} url="ws://127.0.0.1:8790" onLook={() => looks++} />
    )).container
    expect(get(w, ".setup-cmd").textContent).toMatch(
      /^curl -fsSL http:\/\/localhost(:\d+)?\/bridge\/dither-bridge\.mjs /,
    )
    expect(get(w, "[role='status']").textContent).toBe("Looking for it at ws://127.0.0.1:8790")
    expect(w.querySelector(".setup-mascot")).not.toBeNull()
    setLooking(false)
    expect(get(w, "[role='status']").textContent).toBe("Stopped looking. Look again")
    await click(get(w, ".setup-again"))
    expect(looks).toBe(1)
  })

  it("folds the to-dos once all are done, unless the reader opened them", async () => {
    const [todos, setTodos] = createSignal([
      { content: "Read the registry", status: "completed" },
      { content: "Place the screen", status: "in_progress" },
    ])
    const w = render(() => (
      <TurnTrays next={[]} todos={todos()} queue={[]} paused={false} run={null} changes={null} shown={() => true} />
    )).container
    const head = get(w, ".head")
    expect(head.textContent).toBe("2 to-dos1 of 2 done")
    expect(head.getAttribute("aria-expanded")).toBe("true")
    expect([...w.querySelectorAll(".rows .row")].map((r) => r.getAttribute("data-status"))).toEqual([
      "completed",
      "in_progress",
    ])
    setTodos(todos().map((t) => ({ ...t, status: "completed" })))
    expect(head.getAttribute("aria-expanded")).toBe("false")
    expect(w.querySelector(".rows")).toBeNull()
    await click(head)
    expect(w.querySelectorAll(".rows .row")).toHaveLength(2)
  })

  it("offers each changed frame to show, undo or keep, a frame just undone to put back, and a stuck stop to force", async () => {
    const said: string[] = []
    const [run, setRun] = createSignal<TurnTraysProps["run"]>(null)
    const w = render(() => (
      <TurnTrays
        next={["Evolve Sign in into four variants"]}
        todos={null}
        queue={[]}
        paused={false}
        run={run()}
        changes={{
          frames: [
            { id: "f", name: "Sign in" },
            { id: "gone", name: "Old" },
          ],
        }}
        putBack="Table"
        shown={(id) => id === "f"}
        onAsk={(s) => said.push(`ask ${s}`)}
        onUndo={() => said.push("undo")}
        onKeep={() => said.push("keep")}
        onShow={(id) => said.push(`show ${id}`)}
        onUndoFrame={(id) => said.push(`undoFrame ${id}`)}
        onKeepFrame={(id) => said.push(`keepFrame ${id}`)}
        onPutBack={() => said.push("putBack")}
        onStop={() => said.push("stop")}
        onForceStop={() => said.push("forceStop")}
      />
    )).container
    expect(get(w, ".toggle").textContent).toBe("2 frames changed")
    expect(get(w, "[role='status']").textContent).toBe("Undid TablePut it back")
    await click(get(w, ".row.is-key"))
    await click(labelled(w, "Undo all"))
    await click(labelled(w, "Keep"))
    await click(labelled(w, "Put it back"))
    await click(get(w, ".toggle"))
    expect(w.querySelector('[aria-label="Show Old"]')).toBeNull()
    await click(get(w, '[aria-label="Show Sign in"]'))
    await click(get(w, '[aria-label="Undo Sign in"]'))
    await click(get(w, '[aria-label="Keep Old"]'))
    // While the turn runs the run row stands in the changes' place.
    setRun({ doing: "Working", time: "3s", stopping: false, stuck: false })
    expect(w.querySelector(".toggle")).toBeNull()
    expect(get(w, ".run-time").textContent).toBe("Working for 3s")
    await click(get(w, ".quiet"))
    setRun({ doing: "Stopping", time: "9s", stopping: true, stuck: false })
    expect(get<HTMLButtonElement>(w, ".quiet").disabled).toBe(true)
    expect(get(w, ".quiet").textContent).toBe("Stopping…")
    setRun({ doing: "Stopping", time: "9s", stopping: true, stuck: true })
    await click(get(w, ".quiet.text-destructive"))
    expect(said).toEqual([
      "ask Evolve Sign in into four variants",
      "undo",
      "keep",
      "putBack",
      "show f",
      "undoFrame f",
      "keepFrame gone",
      "stop",
      "forceStop",
    ])
  })
})
