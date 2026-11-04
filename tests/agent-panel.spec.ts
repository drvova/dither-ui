// @rstest-environment jsdom
// The agent panel mounted as the Studio mounts it, before any bridge: its
// setup runs in order (the project's session and draft come back), and the
// field's keys behave as the composer promises.
import { readFileSync } from "node:fs"
import { mount } from "@vue/test-utils"
import { nextTick } from "vue"
import { afterEach, beforeEach, describe, expect, it, rs } from "rstack/test"
import { createArtboard } from "@/entities/artboard/model/factory"
import { editor } from "@/entities/editor/model/store"
import { askAgent, handoff } from "@/features/agent/handoff"
import { chats, newChat, openChat, openProject, saveThread } from "@/features/agent/chats"
import { saveDraft } from "@/features/agent/tools"
import { activeProjectId } from "@/features/persistence"
import AgentPanel from "@/widgets/agent/AgentPanel.vue"
import TurnTrays from "@/widgets/agent/ui/TurnTrays.vue"
import type { Entry } from "@/widgets/agent/model/thread"

/** A thread kept as the project's open chat, as a panel left it. */
function keep(entries: Entry[]) {
  openProject("p1")
  saveThread("p1", chats.active, { entries, usage: { input: 0, output: 0 } }, true)
}
const field = (w: ReturnType<typeof mount>) => w.get<HTMLTextAreaElement>('textarea[name="agent-goal"]')

beforeEach(() => {
  localStorage.clear()
  chats.project = ""
  activeProjectId.value = "p1"
  handoff.picked.splice(0)
  handoff.asks.splice(0)
  handoff.picking = false
  editor.artboards = []
  editor.selectedIds = []
})
afterEach(() => rs.restoreAllMocks())

describe("the agent panel", () => {
  it("mounts cleanly and brings back the project's draft and thread", async () => {
    const warn = rs.spyOn(console, "warn")
    keep([{ kind: "user", text: "A sign-in screen", turn: 1 }])
    saveDraft("p1", chats.active, { text: "half a message", attachments: [] })
    const w = mount(AgentPanel, { attachTo: document.body })
    await nextTick()
    expect(warn.mock.calls.filter(([m]) => String(m).includes("Unhandled error"))).toEqual([])
    expect(field(w).element.value).toBe("half a message")
    expect(w.text()).toContain("A sign-in screen")
    expect(w.emitted("activity")?.[0]).toEqual(["idle"])
    w.unmount()
  })

  it("recalls a sent message with Up only from an empty field, and Down empties it again", async () => {
    keep([{ kind: "user", text: "A sign-in screen", turn: 1 }])
    const w = mount(AgentPanel, { attachTo: document.body })
    const box = field(w)
    await box.setValue("a draft")
    await box.trigger("keydown", { key: "ArrowUp" })
    expect(box.element.value).toBe("a draft")
    await box.setValue("")
    await box.trigger("keydown", { key: "ArrowUp" })
    expect(box.element.value).toBe("A sign-in screen")
    await box.trigger("keydown", { key: "ArrowDown" })
    expect(box.element.value).toBe("")
    w.unmount()
  })

  it("never sends on the Enter that ends an IME composition", async () => {
    const w = mount(AgentPanel, { attachTo: document.body })
    const box = field(w)
    await box.setValue("こんにちは")
    await box.trigger("keydown", { key: "Enter", isComposing: true })
    await box.trigger("keydown", { key: "Enter", keyCode: 229 })
    expect(box.element.value).toBe("こんにちは")
    w.unmount()
  })

  it("puts the command menu away on Esc, keeping what was typed", async () => {
    const w = mount(AgentPanel, { attachTo: document.body })
    const box = field(w)
    await box.setValue("/he")
    expect(w.find("#agent-commands").exists()).toBe(true)
    await box.trigger("keydown", { key: "Escape" })
    expect(w.find("#agent-commands").exists()).toBe(false)
    expect(box.element.value).toBe("/he")
    w.unmount()
  })

  it("carries frames picked on the canvas as context, and its pick key turns picking on and off", async () => {
    const frame = createArtboard("button")
    frame.name = "Sign in"
    editor.artboards = [frame]
    handoff.picked.push(frame.id)
    const w = mount(AgentPanel, { attachTo: document.body })
    await nextTick()
    expect(w.find(".card .ctx").text()).toContain("Sign in")
    const pick = w.get('button[aria-label="Pick frames on the canvas"]')
    await pick.trigger("click")
    expect(handoff.picking).toBe(true)
    await field(w).trigger("keydown", { key: "Escape" })
    expect(handoff.picking).toBe(false)
    w.unmount()
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
    const w = mount(AgentPanel, { attachTo: document.body })
    await nextTick()
    const rows = [...w.element.querySelectorAll(".ctx, .status-key, .pill, .key, .row-key, summary, .worked p")]
    expect(rows.length).toBeGreaterThan(6)
    // Bare words on a row sit on their face's line box, high beside a glyph.
    const bare = rows.flatMap((row) =>
      [...row.childNodes]
        .filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim())
        .map(() => row.outerHTML),
    )
    expect(bare).toEqual([])
    w.unmount()
  })

  it("shows the chat picked in the sidebar, and a new chat starts empty", async () => {
    keep([{ kind: "user", text: "A plum orders table", turn: 1 }])
    const first = chats.active
    const w = mount(AgentPanel, { attachTo: document.body })
    await nextTick()
    newChat()
    await nextTick()
    expect(w.text()).not.toContain("A plum orders table")
    openChat(first)
    await nextTick()
    expect(w.text()).toContain("A plum orders table")
    w.unmount()
  })

  it("takes a message asked at the selection off the canvas's queue", async () => {
    askAgent("make it dark", ["f1"])
    const w = mount(AgentPanel, { attachTo: document.body })
    await nextTick()
    expect(handoff.asks).toEqual([])
    w.unmount()
  })

  it("keeps its keys from the canvas: an arrow on one of its keys never reaches the page", async () => {
    const w = mount(AgentPanel, { attachTo: document.body })
    const seen: string[] = []
    const onKey = (e: KeyboardEvent) => seen.push(e.key)
    window.addEventListener("keydown", onKey)
    await w.get(".status-key").trigger("keydown", { key: "ArrowRight" })
    await w.get(".status-key").trigger("keydown", { key: "i", metaKey: true })
    window.removeEventListener("keydown", onKey)
    expect(seen).toEqual(["i"])
    w.unmount()
  })

  it("stacks its blocks in grids whose one column can shrink, so a long line never widens the panel", () => {
    // A grid's auto column grows to its widest unbreakable line (a path, a
    // code line, a long suggestion) and pushes the panel past its column.
    // A grid that stacks blocks names its column; one that centres a glyph
    // (place-items) holds no text.
    const files = ["AgentPanel.vue", "ui/Prose.vue", "ui/ThreadEntry.vue", "ui/TurnTrays.vue"]
    const loose = files.flatMap((f) => {
      const css = readFileSync(`src/widgets/agent/${f}`, "utf8").split("<style")[1] ?? ""
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
    const trays = mount(TurnTrays, {
      props: {
        next: [long],
        todos: [{ content: long, status: "pending" }],
        queue: [{ id: "q", text: long, attachments: [] }],
        paused: false,
        run: null,
        changes: { frames: [{ id: "f", name: long }] },
        shown: () => true,
      },
    })
    await trays.get(".toggle").trigger("click")
    const rows = trays.findAll(".row")
    expect(rows.length).toBe(4)
    for (const row of rows) {
      expect(row.classes()).toContain("first-line")
      expect(row.find(".row-label").classes()).toContain("is-wrap")
    }
    const frame = createArtboard("button")
    frame.name = long
    editor.artboards = [frame]
    handoff.picked.push(frame.id)
    const w = mount(AgentPanel, { attachTo: document.body })
    await nextTick()
    expect(w.get(".card .ctx").classes()).toContain("first-line")
    expect(w.get(".card .ctx .row-label").classes()).toContain("is-wrap")
    w.unmount()
  })
})
