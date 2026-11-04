// @rstest-environment jsdom
// The changes bar frame by frame: one frame back to where the turn found it
// (removed when the turn made it, back when the turn removed it), the rest
// of the canvas as it stands, as one undoable step; each row's Undo and
// Keep, and the row that puts an undone frame back.
import { mount } from "@vue/test-utils"
import { beforeEach, describe, expect, it } from "rstack/test"
import { createArtboard } from "@/entities/artboard/model/factory"
import { editor } from "@/entities/editor"
import { checkpoint, resetHistory, restoreFrame, undo } from "@/features/history"
import TurnTrays from "@/widgets/agent/ui/TurnTrays.vue"

beforeEach(() => {
  editor.artboards = []
  editor.groups = []
  resetHistory()
})

describe("one frame back", () => {
  it("restores the frame the turn changed, removes the one it made, keeps the rest", () => {
    const kept = createArtboard("button")
    const changed = createArtboard("button")
    changed.name = "Before"
    editor.artboards.push(kept, changed)
    const cp = checkpoint()
    const x0 = kept.x
    // The turn: renames one, moves the other, adds a third.
    editor.artboards[1].name = "After"
    editor.artboards[0].x += 100
    const made = createArtboard("area")
    editor.artboards.push(made)

    restoreFrame(cp, changed.id)
    expect(editor.artboards.find((a) => a.id === changed.id)?.name).toBe("Before")
    expect(editor.artboards.find((a) => a.id === kept.id)?.x).toBe(x0 + 100)
    expect(editor.artboards.some((a) => a.id === made.id)).toBe(true)

    restoreFrame(cp, made.id)
    expect(editor.artboards.some((a) => a.id === made.id)).toBe(false)
    // Each was one step: undo brings the made frame back.
    undo()
    expect(editor.artboards.some((a) => a.id === made.id)).toBe(true)
  })

  it("brings back a frame the turn removed", () => {
    const gone = createArtboard("button")
    editor.artboards.push(gone)
    const cp = checkpoint()
    editor.artboards = []
    restoreFrame(cp, gone.id)
    expect(editor.artboards.map((a) => a.id)).toEqual([gone.id])
  })
})

describe("the changes bar, frame by frame", () => {
  const props = (putBack: string | null) => ({
    next: [],
    todos: null,
    queue: [],
    paused: false,
    run: null,
    changes: { frames: [{ id: "f1", name: "Sign in" }] },
    shown: () => true,
    putBack,
  })

  it("undoes or keeps one frame, and puts an undone one back", async () => {
    const w = mount(TurnTrays, { props: props(null) })
    await w.get(".toggle").trigger("click")
    const keys = w.findAll(".rows .row-key")
    await keys.find((k) => k.text() === "Undo")!.trigger("click")
    await keys.find((k) => k.text() === "Keep")!.trigger("click")
    expect(w.emitted("undoFrame")).toEqual([["f1"]])
    expect(w.emitted("keepFrame")).toEqual([["f1"]])
    const after = mount(TurnTrays, { props: props("Sign in") })
    expect(after.text()).toContain("Undid Sign in")
    await after
      .findAll("button")
      .find((b) => b.text() === "Put it back")!
      .trigger("click")
    expect(after.emitted("putBack")).toHaveLength(1)
  })
})
