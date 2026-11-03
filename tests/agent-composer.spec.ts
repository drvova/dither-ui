// The agent panel as a composer: the reply set as prose from the Markdown a
// harness writes (never as HTML), each Studio tool call a step in words with
// the frames it changed, and the checkpoint each message keeps, restored as
// one undoable step.
import { beforeEach, describe, expect, it } from "rstack/test"
import { ICONS } from "@dither-kit"
import { createArtboard } from "@/entities/artboard/model/factory"
import { editor } from "@/entities/editor/model/store"
import { checkpoint, history, redo, resetHistory, restoreCheckpoint, undo } from "@/features/history"
import { STUDIO_TOOLS } from "@/features/agent/tools"
import { inline, parseProse } from "@/widgets/agent/model/prose"
import { STEPS, toolStep } from "@/widgets/agent/model/steps"
import {
  changesOf,
  type Entry,
  secondsOf,
  STEP_RUN,
  threadBlocks,
  titleOf,
  todosOf,
  toolEntry,
} from "@/widgets/agent/model/thread"

describe("the reply as prose", () => {
  it("reads headings, paragraphs, lists and fenced code into blocks", () => {
    const blocks = parseProse(
      "## Plan\nI added a **sign-in** screen\nwith `DitherInput`.\n\n- email\n- password\n1. one\n2) two\n```vue\n<DitherButton />\n```",
    )
    expect(blocks.map((b) => b.kind)).toEqual(["heading", "paragraph", "list", "list", "code"])
    expect(blocks[0]).toEqual({ kind: "heading", level: 2, inline: [{ kind: "text", text: "Plan" }] })
    // A paragraph's lines join; its marks become spans.
    expect(blocks[1]).toEqual({
      kind: "paragraph",
      inline: [
        { kind: "text", text: "I added a " },
        { kind: "strong", text: "sign-in" },
        { kind: "text", text: " screen with " },
        { kind: "code", text: "DitherInput" },
        { kind: "text", text: "." },
      ],
    })
    expect(blocks[2]).toMatchObject({
      kind: "list",
      ordered: false,
      items: [[{ text: "email" }], [{ text: "password" }]],
    })
    expect(blocks[3]).toMatchObject({ kind: "list", ordered: true })
    expect(blocks[4]).toEqual({ kind: "code", lang: "vue", text: "<DitherButton />" })
  })

  it("is safe on a partial stream: an open fence is code to the end, an open mark is text", () => {
    expect(parseProse("Here:\n```ts\nconst a = 1")).toEqual([
      { kind: "paragraph", inline: [{ kind: "text", text: "Here:" }] },
      { kind: "code", lang: "ts", text: "const a = 1" },
    ])
    expect(inline("half **bold and `half code")).toEqual([{ kind: "text", text: "half **bold and `half code" }])
  })

  it("keeps markup as text and a link as its words", () => {
    expect(inline('<img src=x onerror="alert(1)"> [the docs](https://x.y)')).toEqual([
      { kind: "text", text: '<img src=x onerror="alert(1)"> the docs' },
    ])
    // Nothing inside a code span is a mark.
    expect(inline("`**not bold**`")).toEqual([{ kind: "code", text: "**not bold**" }])
  })
})

describe("a tool call as a step", () => {
  it("names every Studio tool, with a glyph the kit draws", () => {
    for (const { def: t } of STUDIO_TOOLS) {
      expect(STEPS[t.name], t.name).toBeDefined()
      expect(ICONS[STEPS[t.name].icon], t.name).toBeDefined()
    }
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
    expect(toolStep("read_file", {}, ok(null))).toMatchObject({ title: "read file", icon: "Terminal", mutates: false })
  })
})

describe("a message's checkpoint", () => {
  beforeEach(() => {
    editor.artboards = []
    editor.groups = []
    resetHistory()
  })

  it("puts the document back as one undoable step, and undo returns to where it was asked", () => {
    const before = checkpoint()
    editor.artboards.push(createArtboard("button"), createArtboard("chart"))
    const after = checkpoint()
    expect(editor.artboards).toHaveLength(2)

    restoreCheckpoint(before)
    expect(editor.artboards).toHaveLength(0)
    expect(history.canUndo).toBe(true)
    undo()
    expect(JSON.stringify({ artboards: editor.artboards, groups: editor.groups })).toBe(after)
    redo()
    expect(editor.artboards).toHaveLength(0)
  })

  it("adds nothing to the history when the document already is the checkpoint", () => {
    const now = checkpoint()
    restoreCheckpoint(now)
    expect(history.canUndo).toBe(false)
  })
})

describe("the thread's readings", () => {
  const ok = (data: unknown) => ({ ok: true as const, data })
  const step = (name: string, turn: number, data: unknown = { id: `${name}-${turn}`, name }) =>
    toolEntry(name, {}, ok(data), turn)
  const activity = (id: string, status = "completed"): Entry => ({ kind: "activity", id, title: id, status })

  it("names the chat by its first message, and says new chat before one", () => {
    expect(titleOf([])).toBe("New chat")
    expect(
      titleOf([
        { kind: "system", text: "connected" },
        { kind: "user", text: "A sign-in\nwith a link" },
      ]),
    ).toBe("A sign-in")
  })

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

  it("says a length in whole seconds, minutes past sixty", () => {
    expect(secondsOf(200)).toBe("1s")
    expect(secondsOf(12_400)).toBe("12s")
    expect(secondsOf(65_000)).toBe("1m 5s")
  })
})
