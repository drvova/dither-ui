// The Studio's state core on Solid: the editor store, its history and
// persistence, the agent's protocol, tools and chats, the canvas's gestures
// and keys, and the three dialogs, held to what their Vue twins did. The
// first half is this port's own (what a mutable Solid store must keep that
// Vue's gave for free, and the modules the earlier Vue site had no spec for); the
// second carries the earlier Vue site's specs for these modules, assertion for
// assertion.
import { readFileSync } from "node:fs"
import { cleanup, fireEvent, render } from "@solidjs/testing-library"
import { createEffect, createRoot, createSignal } from "solid-js"
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { createArtboard } from "@/entities/artboard/model/factory"
import { FRAME_GAP } from "@/entities/editor/model/free"
import { componentEntry, createCell, createRow, createScreen } from "@/entities/widget"
import { evolveArtboard, mutateProps } from "@/features/agent/evolve"
import { reelDuration } from "@/features/reel"
import { directedTime, isDirected, release } from "@dither-ui/kit/engine/clock.ts"
import {
  actualSize,
  addArtboard,
  addComponentArtboard,
  addReelArtboard,
  centreOn,
  copySelected,
  deleteSeries,
  deselect,
  duplicateSelected,
  editor,
  fitAll,
  fitSelection,
  groupSelected,
  moveArtboard,
  moveSelected,
  pasteClipboard,
  placeArtboard,
  placeGeneration,
  removeArtboard,
  removeSelected,
  resizeArtboard,
  selectArtboard,
  selectedArtboard,
  selectedChart,
  selectedLayers,
  selectGroup,
  selectLayer,
  selectMany,
  setArtboardHidden,
  setArtboardLocked,
  setGroupHidden,
  setGroupLocked,
  setSelectedType,
  startInspecting,
  stopInspecting,
  ungroup,
  watch,
  zoomIn,
  zoomOut,
} from "../../src/entities/editor"
import {
  addLaunchFilm,
  COMMAND_EVENT,
  evolveSelected,
  installStudioAgentApi,
  MIRROR_ID,
  registrySchema,
  RESULT_EVENT,
  runCommand,
} from "../../src/features/agent"
import {
  mapUpdate,
  modelName,
  modelOf,
  modesOf,
  permissionOptions,
  promptBlocks,
  takesImages,
  usageOf,
} from "../../src/features/agent/acp"
import {
  agoOf,
  chatGroups,
  chats,
  chatsOf,
  forgetProject,
  loadThread,
  newChat,
  openChat,
  openProject,
  pinChat,
  removeChat,
  renameChat,
  saveThread,
  stepChat,
  titleOf,
} from "../../src/features/agent/chats"
import {
  built,
  callDither,
  ditherDef,
  type DitherDeps,
  type DitherStep,
  findFor,
  GOOD_FIT,
  parseDither,
  removeBuilt,
  wordsOf,
} from "../../src/features/agent/dither"
import { askAgent, handoff, takeAsk, togglePicked } from "../../src/features/agent/handoff"
import { type CommandResult } from "../../src/features/agent/protocol"
import {
  callStudioTool,
  loadAgentConfig,
  loadDraft,
  saveAgentConfig,
  saveDraft,
  STUDIO_SERVER,
  STUDIO_TOOLS,
} from "../../src/features/agent/tools"
import { startDrag } from "../../src/features/artboard-transform"
import { ExportDialog } from "../../src/features/export-code"
import { defaultSeconds, playerUrl, renderCommand, VideoDialog, videoFileName } from "../../src/features/export-video"
import {
  checkpoint,
  history,
  redo,
  resetHistory,
  restoreCheckpoint,
  restoreFrame,
  startHistory,
  stopHistory,
  undo,
} from "../../src/features/history"
import { pageKeyOf, ShortcutsHelp, usePanelShortcuts, useShortcuts } from "../../src/features/keyboard"
import { type PageKeys } from "../../src/features/keyboard/useShortcuts"
import { usePanZoom } from "../../src/features/pan-zoom"
import {
  activeProjectId,
  applyDocument,
  createProject,
  deleteProject,
  deleteWarning,
  documentSnapshot,
  duplicateProject,
  hydrate,
  parseDocument,
  projects,
  renameProject,
  startAutosave,
  stopAutosave,
  switchProject,
} from "../../src/features/persistence"
import { chartCode } from "../../src/entities/chart/model/codegen"
import { addArtboardFromPreset, presets, removePreset, savePreset } from "../../src/features/presets"

// The reader's styling system is the shared layer's: here a stand-in that
// marks what it was asked for, so these specs hold only what this slice does
// with it.
vi.mock("../../src/shared/lib/restyle", async () => {
  const { createSignal } = await import("solid-js")
  const STYLINGS = ["tailwind", "css", "modules", "stylex"] as const
  const [styling, setStyling] = createSignal<string>("tailwind")
  return {
    STYLINGS,
    STYLING_LABELS: { tailwind: "Tailwind", css: "CSS", modules: "Modules", stylex: "StyleX" },
    isStyling: (v: unknown) => STYLINGS.includes(v as never),
    restyle: (code: string, system: string) => (system === "tailwind" ? code : `/* ${system} */\n${code}`),
    styling,
    setStyling,
  }
})
vi.mock("../../src/shared/ui", () => ({
  CodeBlock: (props: { code: string }) => <pre data-testid="code">{props.code}</pre>,
  Segmented: (props: {
    options: readonly string[]
    labels: Record<string, string>
    modelValue: string
    onUpdateModelValue: (v: string) => void
  }) => (
    <div>
      {props.options.map((o) => (
        <button type="button" aria-pressed={o === props.modelValue} onClick={() => props.onUpdateModelValue(o)}>
          {props.labels[o]}
        </button>
      ))}
    </div>
  ),
}))

// What the specs share: the stores are module singletons, so each carried
// spec starts from the state its Vue twin's own file started from.
function fresh() {
  stopHistory()
  stopAutosave()
  stopInspecting()
  localStorage.clear()
  editor.artboards = []
  editor.groups = []
  deselect()
  editor.viewport = { x: 96, y: 88, zoom: 1 }
  editor.stage = { w: 1280, h: 720 }
  editor.dataOpen = false
  chats.project = ""
  chats.list = []
  built.list = []
  projects.splice(0, projects.length)
  activeProjectId.value = ""
  presets.splice(0, presets.length)
  handoff.picking = false
  handoff.picked = []
  handoff.asks = []
  resetHistory()
}
/** The microtask a watcher's callback waits for (Vue's `nextTick` there). */
const tick = () => new Promise<void>((resolve) => queueMicrotask(resolve))
/** A command's answer, where the spec has already held that it is one. */
const dataOf = (r: CommandResult): unknown => (r.ok ? r.data : undefined)
const key = (k: string, init: KeyboardEventInit = {}) =>
  new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init })

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe("the editor store on Solid", () => {
  beforeEach(fresh)

  it("hands back the store's own frame, so a write after an insert reaches every reader", () => {
    const names: string[] = []
    const dispose = createRoot((dispose) => {
      createEffect(() => names.push(editor.artboards.map((a) => a.name).join(",")))
      return dispose
    })
    const a = addArtboard("area")
    a.name = "Renamed"
    expect(names.at(-1)).toBe("Renamed")
    const [b] = placeGeneration([createArtboard("button")])
    b.name = "Variant"
    expect(names.at(-1)).toBe("Renamed,Variant")
    const g = groupSelected()!
    g.name = "Mine"
    expect(editor.groups[0].name).toBe("Mine")
    expect(editor.artboards[1].groupId).toBe(g.id)
    dispose()
  })

  it("reads the selection as `.value`, as it changes", () => {
    const a = addArtboard("area")
    const b = addArtboard("bar")
    expect(selectedArtboard.value?.id).toBe(b.id)
    expect(selectedChart.value?.type).toBe("bar")
    expect(selectedLayers.value[0].id).toBe(`${b.id}:root`)
    selectArtboard(a.id)
    expect(selectedArtboard.value?.id).toBe(a.id)
    setSelectedType("line")
    expect(selectedChart.value?.type).toBe("line")
    deselect()
    expect(selectedArtboard.value).toBeNull()
    expect(selectedLayers.value).toEqual([])
  })

  it("makes each action one change: no reader sees a selection naming a frame already gone", () => {
    const a = addArtboard("area")
    const b = addArtboard("bar")
    const c = addArtboard("button")
    const torn: string[] = []
    let runs = 0
    const dispose = createRoot((dispose) => {
      createEffect(() => {
        runs++
        const ids = new Set(editor.artboards.map((x) => x.id))
        for (const id of editor.selectedIds) if (!ids.has(id)) torn.push(id)
        if (editor.selectedArtboardId && !ids.has(editor.selectedArtboardId)) torn.push(editor.selectedArtboardId)
      })
      return dispose
    })
    runs = 0
    selectMany([b.id, c.id])
    expect(runs).toBe(1)
    removeSelected()
    expect(runs).toBe(2)
    expect(editor.selectedIds).toEqual([a.id])
    removeArtboard(a.id)
    expect(editor.selectedArtboardId).toBe("")
    expect(torn).toEqual([])
    dispose()
  })

  it("selects additively, by group and by layer", () => {
    const a = addArtboard("area")
    const b = addArtboard("bar")
    selectArtboard(a.id, true)
    expect(editor.selectedIds).toEqual([b.id, a.id])
    selectArtboard(b.id, true)
    expect(editor.selectedIds).toEqual([a.id])
    expect(editor.selectedLayerId).toBe(`${a.id}:root`)
    selectMany([a.id, b.id])
    const g = groupSelected()!
    deselect()
    selectGroup(g.id)
    expect(editor.selectedIds).toEqual([a.id, b.id])
    selectLayer(`${a.id}:series:x`)
    expect(editor.selectedIds).toEqual([a.id])
    expect(editor.selectedLayerId).toBe(`${a.id}:series:x`)
    setGroupLocked(g.id, true)
    setGroupHidden(g.id, true)
    expect(editor.artboards.map((x) => [x.locked, x.hidden])).toEqual([
      [true, true],
      [true, true],
    ])
    ungroup(g.id)
    expect(editor.groups).toEqual([])
    expect(editor.artboards.every((x) => x.groupId === null)).toBe(true)
  })

  it("keeps a reel to frames that still exist, and never moves or sizes a locked frame", () => {
    const a = addArtboard("area")
    const b = addArtboard("bar")
    const reel = addReelArtboard([a.id, b.id, a.id])
    expect(reel.widget?.kind === "reel" && reel.widget.clips.map((c) => c.id)).toEqual([a.id, b.id])
    removeArtboard(a.id)
    expect(reel.widget?.kind === "reel" && reel.widget.clips.map((c) => c.id)).toEqual([b.id])
    setArtboardLocked(b.id, true)
    const at = [b.x, b.y, b.w, b.h]
    moveArtboard(b.id, 9, 9)
    resizeArtboard(b.id, 10, 10)
    expect([b.x, b.y, b.w, b.h]).toEqual(at)
    setArtboardLocked(b.id, false)
    resizeArtboard(b.id, 10.4, 10)
    expect([b.w, b.h]).toEqual([260, 200])
    setArtboardHidden(b.id, true)
    expect(b.hidden).toBe(true)
  })
})

describe("watch, Vue's timing over a Solid store", () => {
  beforeEach(fresh)

  it("calls back once, a microtask after the writes of one turn, never for the first read", async () => {
    let calls = 0
    const stop = watch(
      () => [editor.artboards, editor.groups],
      () => calls++,
      { deep: true },
    )
    await tick()
    expect(calls).toBe(0)
    const a = addArtboard("area")
    a.name = "Deep"
    a.chart.series[0].key = "deeper"
    expect(calls).toBe(0)
    await tick()
    expect(calls).toBe(1)
    // Not the document: the view moves without a call.
    editor.viewport.x += 5
    await tick()
    expect(calls).toBe(1)
    // Stopped with a call waiting: it does not run.
    a.x += 1
    stop()
    await tick()
    expect(calls).toBe(1)
  })

  it("watches only what the getter reads when not deep", async () => {
    let calls = 0
    const stop = watch(
      () => [editor.viewport.x, editor.viewport.zoom],
      () => calls++,
    )
    editor.viewport.y = 5
    await tick()
    expect(calls).toBe(0)
    // The editor replaces the viewport: the watch follows the new one.
    editor.viewport = { x: 1, y: 2, zoom: 1 }
    await tick()
    editor.viewport.x = 9
    await tick()
    expect(calls).toBe(2)
    stop()
  })
})

describe("history", () => {
  beforeEach(async () => {
    fresh()
    vi.useFakeTimers()
    startHistory()
    // A reset swallows the echo of the load it follows (a project switch):
    // here, this one.
    editor.groups = []
    await tick()
  })
  afterEach(stopHistory)
  /** Let the watcher hear the edit, then the coalescing window pass. */
  const settle = async () => {
    await tick()
    vi.advanceTimersByTime(301)
  }

  it("coalesces the edits of one window into one entry, and lights undo at the first", async () => {
    expect(history.canUndo).toBe(false)
    const a = addArtboard("area")
    await tick()
    expect(history.canUndo).toBe(true)
    moveArtboard(a.id, 5, 0)
    moveArtboard(a.id, 5, 0)
    await settle()
    undo()
    expect(editor.artboards).toEqual([])
    expect(history.canUndo).toBe(false)
    expect(history.canRedo).toBe(true)
    redo()
    expect(editor.artboards).toHaveLength(1)
    expect(editor.artboards[0].x).toBe(a.x)
    expect(editor.selectedArtboardId).toBe(a.id)
  })

  it("does not take its own restore for an edit", async () => {
    addArtboard("area")
    await settle()
    addArtboard("bar")
    await settle()
    undo()
    await settle()
    // The echo swallowed: the redo branch stands, and the next real edit is heard.
    expect(history.canRedo).toBe(true)
    redo()
    await settle()
    expect(editor.artboards).toHaveLength(2)
    addArtboard("button")
    await settle()
    expect(history.canRedo).toBe(false)
    undo()
    expect(editor.artboards).toHaveLength(2)
    undo()
    expect(editor.artboards).toHaveLength(1)
  })

  it("leaves pan and zoom out, and an edit ends the redo branch", async () => {
    const a = addArtboard("area")
    await settle()
    editor.viewport.x += 40
    selectArtboard(a.id)
    await settle()
    undo()
    expect(editor.artboards).toEqual([])
    expect(editor.viewport.x).not.toBe(96)
    addArtboard("bar")
    redo()
    expect(history.canRedo).toBe(false)
    expect(editor.artboards).toHaveLength(1)
  })

  it("comes back to a checkpoint as one undoable step, and forgets all on a reset", async () => {
    addArtboard("area")
    await settle()
    const cp = checkpoint()
    addArtboard("bar")
    addArtboard("button")
    await settle()
    restoreCheckpoint(cp)
    expect(editor.artboards).toHaveLength(1)
    restoreCheckpoint(cp)
    undo()
    expect(editor.artboards).toHaveLength(3)
    resetHistory()
    expect([history.canUndo, history.canRedo]).toEqual([false, false])
    undo()
    expect(editor.artboards).toHaveLength(3)
  })
})

describe("persistence beyond the project story", () => {
  beforeEach(fresh)

  it("saves the document a while after an edit, and at once when autosave stops", async () => {
    vi.useFakeTimers()
    hydrate()
    startAutosave()
    const doc = () => JSON.parse(localStorage.getItem(`dither-studio-doc-${activeProjectId.value}`) ?? "null")
    expect(doc()).toBeNull()
    editor.artboards[0].name = "Edited"
    await tick()
    vi.advanceTimersByTime(399)
    expect(doc()).toBeNull()
    vi.advanceTimersByTime(2)
    expect(doc().artboards[0].name).toBe("Edited")
    editor.artboards[0].name = "Again"
    await tick()
    stopAutosave()
    expect(doc().artboards[0].name).toBe("Again")
  })

  it("applies only a document that survives validation, undoable when asked", () => {
    hydrate()
    expect(applyDocument(null)).toBe(false)
    expect(applyDocument({ artboards: [] })).toBe(false)
    expect(applyDocument({ artboards: ["junk"] })).toBe(false)
    const before = editor.artboards[0].id
    const doc = {
      artboards: [{ id: 7, name: null, x: "a", y: 0, w: Infinity, h: 10, chart: { type: "bar" } }],
      groups: [{ id: "g", name: "G" }, { id: 1 }],
      viewport: { x: 1, y: 2, zoom: 99 },
    }
    expect(applyDocument(doc, { keepHistory: true })).toBe(true)
    const [a] = editor.artboards
    expect(a.id).toMatch(/^ab-imported-/)
    expect([a.name, a.x, a.w]).toEqual(["Artboard", 0, 520])
    expect(editor.groups).toEqual([{ id: "g", name: "G", collapsed: false }])
    expect(editor.viewport).toEqual({ x: 1, y: 2, zoom: 3 })
    expect(editor.selectedArtboardId).toBe(a.id)
    expect(a.id).not.toBe(before)
    // A detached copy: writing to it moves nothing.
    const copy = documentSnapshot()
    ;(copy.artboards[0] as { name: string }).name = "Elsewhere"
    expect(editor.artboards[0].name).toBe("Artboard")
    expect(parseDocument("nope")).toBeNull()
  })
})

describe("presets", () => {
  beforeEach(fresh)

  it("keeps a chart under a name, replaces a same-named one, and seeds a new frame from it", () => {
    const a = addArtboard("bar")
    savePreset("  ", a)
    expect(presets).toHaveLength(0)
    savePreset(" Mine ", a)
    a.chart.cell = 3
    savePreset("Mine", a)
    expect(presets.map((p) => [p.name, p.chart.cell])).toEqual([["Mine", 3]])
    expect(JSON.parse(localStorage.getItem("dither-presets-v1")!)[0].name).toBe("Mine")
    // A snapshot: the frame moves on without it.
    a.chart.cell = 1
    expect(presets[0].chart.cell).toBe(3)
    addArtboardFromPreset(presets[0])
    const made = editor.artboards[1]
    expect([made.name, made.chart.type, made.chart.cell]).toEqual(["Mine", "bar", 3])
    expect(editor.selectedArtboardId).toBe(made.id)
    // A widget frame has no chart to keep.
    savePreset("Widget", addArtboard("button"))
    expect(presets).toHaveLength(1)
    removePreset("Mine")
    expect(presets).toHaveLength(0)
    expect(localStorage.getItem("dither-presets-v1")).toBe("[]")
  })
})

describe("the canvas's handoff to the agent", () => {
  beforeEach(fresh)

  it("hands frames over in the order picked, and queues what is asked", () => {
    togglePicked("a")
    togglePicked("b")
    togglePicked("a")
    expect(handoff.picked).toEqual(["b"])
    askAgent("   ", ["a"])
    expect(takeAsk()).toBeUndefined()
    const frames = ["a"]
    askAgent(" Make it dark ", frames)
    askAgent("And wider", [])
    frames.push("z")
    expect(takeAsk()).toEqual({ text: "Make it dark", frames: ["a"] })
    expect(takeAsk()).toEqual({ text: "And wider", frames: [] })
    expect(handoff.asks).toEqual([])
  })
})

describe("the canvas under a pointer and under fingers", () => {
  const touch = (type: string, pointerId: number, clientX: number, clientY: number) =>
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      button: 0,
      pointerId,
      pointerType: "touch",
      clientX,
      clientY,
    })
  /** A canvas as the Studio wires it: its gestures heard first, a frame's
   * surface that drags its frame, empty canvas that pans under a finger. */
  function canvas() {
    const host = document.createElement("div")
    const surface = document.createElement("div")
    host.append(surface)
    document.body.append(host)
    const { onTouchDown, startPan } = usePanZoom(() => host)
    host.addEventListener("pointerdown", onTouchDown, true)
    surface.addEventListener("pointerdown", (e) =>
      startDrag(e, (dx, dy) => moveArtboard(editor.artboards[0].id, dx, dy)),
    )
    host.addEventListener("pointerdown", (e) => e.pointerType === "touch" && startPan(e))
    return { host, surface }
  }

  beforeEach(() => {
    fresh()
    editor.artboards = [createArtboard("button", 300, 300)]
    Object.assign(editor.viewport, { x: 0, y: 0, zoom: 1 })
  })
  afterEach(() => document.body.replaceChildren())

  it("drags in world units and tears down on the pointer's own up", () => {
    editor.viewport.zoom = 2
    const { surface } = canvas()
    let ended = 0
    surface.addEventListener(
      "pointerdown",
      (e) =>
        startDrag(
          e,
          () => {},
          () => ended++,
        ),
      { once: true },
    )
    surface.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerId: 1, clientX: 50, clientY: 50 }),
    )
    window.dispatchEvent(new PointerEvent("pointermove", { pointerId: 1, clientX: 60, clientY: 54 }))
    // Another pointer is not this drag's.
    window.dispatchEvent(new PointerEvent("pointermove", { pointerId: 2, clientX: 90, clientY: 90 }))
    window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 2 }))
    expect([editor.artboards[0].x, editor.artboards[0].y]).toEqual([305, 302])
    window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1 }))
    window.dispatchEvent(new PointerEvent("pointermove", { pointerId: 1, clientX: 80, clientY: 75 }))
    expect([editor.artboards[0].x, editor.artboards[0].y]).toEqual([305, 302])
    expect(ended).toBe(1)
  })

  it("pans under one finger on empty canvas", () => {
    const { host } = canvas()
    host.dispatchEvent(touch("pointerdown", 1, 20, 20))
    window.dispatchEvent(touch("pointermove", 1, 60, 50))
    window.dispatchEvent(touch("pointerup", 1, 60, 50))
    expect([editor.viewport.x, editor.viewport.y]).toEqual([40, 30])
  })

  it("pinches about the fingers' midpoint and ends the first finger's drag", () => {
    const { host, surface } = canvas()
    surface.addEventListener("pointerdown", (e) => e.stopPropagation())
    const [x0, y0] = [editor.artboards[0].x, editor.artboards[0].y]

    // The first finger lands on the artboard and starts moving it.
    surface.dispatchEvent(touch("pointerdown", 1, 100, 100))
    window.dispatchEvent(touch("pointermove", 1, 110, 100))
    expect(editor.artboards[0].x).toBe(x0 + 10)

    // A second finger lands: the drag ends and the pinch takes over.
    host.dispatchEvent(touch("pointerdown", 2, 210, 100))
    window.dispatchEvent(touch("pointermove", 1, 60, 100))
    window.dispatchEvent(touch("pointermove", 2, 260, 100))
    expect([editor.artboards[0].x, editor.artboards[0].y]).toEqual([x0 + 10, y0])
    // The spread doubled (100 to 200) about the unchanged midpoint (160, 100).
    expect(editor.viewport.zoom).toBeCloseTo(2)
    expect(editor.viewport.x).toBeCloseTo(160 - 160 * 2)
    expect(editor.viewport.y).toBeCloseTo(100 - 100 * 2)

    // Lifting both ends it; a later finger pans again.
    window.dispatchEvent(touch("pointerup", 1, 60, 100))
    window.dispatchEvent(touch("pointerup", 2, 260, 100))
    const x = editor.viewport.x
    host.dispatchEvent(touch("pointerdown", 3, 20, 20))
    window.dispatchEvent(touch("pointermove", 3, 30, 20))
    window.dispatchEvent(touch("pointerup", 3, 30, 20))
    expect(editor.viewport.x).toBeCloseTo(x + 10)
  })

  it("holds a third finger off and rebases on the pair that remains", () => {
    const { host } = canvas()
    host.dispatchEvent(touch("pointerdown", 1, 100, 100))
    host.dispatchEvent(touch("pointerdown", 2, 200, 100))
    // A third finger starts nothing of its own, not even a pan.
    const third = touch("pointerdown", 3, 150, 300)
    host.dispatchEvent(third)
    expect(third.defaultPrevented).toBe(true)
    window.dispatchEvent(touch("pointermove", 3, 190, 300))
    expect([editor.viewport.x, editor.viewport.y, editor.viewport.zoom]).toEqual([0, 0, 1])
    // The first lifts: fingers 2 and 3 are the pair now, and it starts from
    // them, so the view holds still until they move.
    window.dispatchEvent(touch("pointerup", 1, 100, 100))
    window.dispatchEvent(touch("pointermove", 2, 200, 100))
    expect([editor.viewport.x, editor.viewport.y, editor.viewport.zoom]).toEqual([0, 0, 1])
  })

  it("zooms to the cursor under a ctrl wheel, and holds while the workbench inspects", () => {
    const host = document.createElement("div")
    const { onWheel } = usePanZoom(() => host)
    const under = () => (200 - editor.viewport.x) / editor.viewport.zoom
    const before = under()
    onWheel(new WheelEvent("wheel", { deltaY: -200, ctrlKey: true, clientX: 200, clientY: 100 }))
    expect(editor.viewport.zoom).toBeCloseTo(1.3)
    expect(under()).toBeCloseTo(before)
    startInspecting()
    onWheel(new WheelEvent("wheel", { deltaY: -200, ctrlKey: true }))
    expect(editor.viewport.zoom).toBe(1)
    stopInspecting()
  })
})

describe("keyboard", () => {
  beforeEach(fresh)

  function Keys(props: { page?: PageKeys }) {
    useShortcuts()
    if (props.page) usePanelShortcuts(props.page)
    return <input aria-label="field" />
  }

  it("answers the canvas's keys while mounted, and lets go of the window after", () => {
    const a = addArtboard("area")
    const b = addArtboard("bar")
    const { unmount } = render(() => <Keys />)
    const [x, y] = [b.x, b.y]
    window.dispatchEvent(key("ArrowRight"))
    window.dispatchEvent(key("ArrowUp", { shiftKey: true }))
    expect([b.x, b.y]).toEqual([x + 1, y - 10])
    // With the mod key the arrows are the page's.
    window.dispatchEvent(key("ArrowRight", { metaKey: true }))
    expect(b.x).toBe(x + 1)
    window.dispatchEvent(key("l", { ctrlKey: true }))
    expect(b.locked).toBe(true)
    window.dispatchEvent(key("l", { ctrlKey: true }))
    expect(b.locked).toBe(false)
    window.dispatchEvent(key("d", { metaKey: true }))
    expect(editor.artboards).toHaveLength(3)
    const pressed = key("Backspace")
    window.dispatchEvent(pressed)
    expect(pressed.defaultPrevented).toBe(true)
    expect(editor.artboards.map((f) => f.id)).toEqual([a.id, b.id])
    selectMany([a.id, b.id])
    window.dispatchEvent(key("g", { metaKey: true }))
    expect(editor.groups).toHaveLength(1)
    window.dispatchEvent(key("G", { metaKey: true, shiftKey: true }))
    expect(editor.groups).toHaveLength(0)
    window.dispatchEvent(key("c", { metaKey: true }))
    window.dispatchEvent(key("v", { metaKey: true }))
    expect(editor.artboards).toHaveLength(4)
    window.dispatchEvent(key("=", { metaKey: true }))
    expect(editor.viewport.zoom).toBeCloseTo(1.2)
    window.dispatchEvent(key("0", { metaKey: true }))
    expect(editor.viewport.zoom).toBe(1)
    window.dispatchEvent(key("Escape"))
    expect(editor.selectedIds).toEqual([])
    unmount()
    selectArtboard(a.id)
    window.dispatchEvent(key("Backspace"))
    expect(editor.artboards).toHaveLength(4)
  })

  it("steps aside in a field (Escape leaves it) and while the workbench inspects", () => {
    addArtboard("area")
    const { getByLabelText } = render(() => <Keys />)
    const field = getByLabelText("field")
    field.focus()
    field.dispatchEvent(key("Backspace"))
    expect(editor.artboards).toHaveLength(1)
    field.dispatchEvent(key("Escape"))
    expect(document.activeElement).not.toBe(field)
    expect(editor.selectedIds).toHaveLength(1)
    editor.inspecting = true
    window.dispatchEvent(key("Backspace"))
    expect(editor.artboards).toHaveLength(1)
    editor.inspecting = false
  })

  it("undoes and redoes from the keys", async () => {
    vi.useFakeTimers()
    startHistory()
    render(() => <Keys />)
    addArtboard("area")
    await tick()
    vi.advanceTimersByTime(301)
    window.dispatchEvent(key("z", { metaKey: true }))
    expect(editor.artboards).toHaveLength(0)
    window.dispatchEvent(key("Z", { metaKey: true, shiftKey: true }))
    expect(editor.artboards).toHaveLength(1)
    stopHistory()
  })

  it("reads a page key from one table, a field's included save where it selects text", () => {
    const field = document.createElement("textarea")
    const on = (k: string, init: KeyboardEventInit, target?: HTMLElement) => {
      const e = key(k, init)
      if (target) Object.defineProperty(e, "target", { value: target })
      return pageKeyOf(e)
    }
    expect(on("i", { metaKey: true })).toBe("toggleChat")
    expect(on("K", { ctrlKey: true }, field)).toBe("search")
    expect(on("b", { metaKey: true })).toBe("toggleSidebar")
    expect(on("b", {})).toBeNull()
    expect(on("b", { metaKey: true, altKey: true })).toBeNull()
    expect(on("ArrowUp", { metaKey: true, shiftKey: true })).toBe("chatBefore")
    expect(on("ArrowDown", { metaKey: true, shiftKey: true })).toBe("chatAfter")
    expect(on("ArrowDown", { metaKey: true, shiftKey: true }, field)).toBeNull()
    expect(on("i", { metaKey: true, shiftKey: true })).toBeNull()
  })

  it("calls the page's keys while mounted", () => {
    const heard: string[] = []
    const page: PageKeys = {
      toggleChat: () => heard.push("chat"),
      search: () => heard.push("search"),
      toggleSidebar: () => heard.push("sidebar"),
      stepChat: (by) => heard.push(`step ${by}`),
    }
    const { unmount } = render(() => <Keys page={page} />)
    const pressed = key("k", { metaKey: true })
    window.dispatchEvent(pressed)
    expect(pressed.defaultPrevented).toBe(true)
    window.dispatchEvent(key("i", { ctrlKey: true }))
    window.dispatchEvent(key("b", { metaKey: true }))
    window.dispatchEvent(key("ArrowUp", { metaKey: true, shiftKey: true }))
    window.dispatchEvent(key("ArrowDown", { metaKey: true, shiftKey: true }))
    expect(heard).toEqual(["search", "chat", "sidebar", "step -1", "step 1"])
    unmount()
    window.dispatchEvent(key("k", { metaKey: true }))
    expect(heard).toHaveLength(5)
  })
})

describe("ShortcutsHelp", () => {
  it("opens on ?, lists every key by group, and closes on Escape before the canvas hears it", async () => {
    const heard: string[] = []
    const onWindow = (e: KeyboardEvent) => heard.push(e.key)
    window.addEventListener("keydown", onWindow)
    const { queryByRole, getByRole, getByText, unmount } = render(() => (
      <>
        <input aria-label="field" />
        <ShortcutsHelp />
      </>
    ))
    expect(queryByRole("dialog")).toBeNull()
    // Typed in a field, a question mark is a question mark.
    getByRole("textbox").dispatchEvent(key("?"))
    expect(queryByRole("dialog")).toBeNull()
    const asked = key("?")
    window.dispatchEvent(asked)
    expect(asked.defaultPrevented).toBe(true)
    const dialog = getByRole("dialog")
    expect(dialog.getAttribute("aria-modal")).toBe("true")
    expect(dialog.getAttribute("aria-label")).toBe("Keyboard shortcuts")
    for (const title of ["Edit", "Move", "View", "Window"]) expect(getByText(title)).toBeTruthy()
    expect(dialog.querySelectorAll("dt")).toHaveLength(18)
    expect(getByText("Chat before / after").nextElementSibling?.textContent).toBe("⌘⇧↑ / ⌘⇧↓")
    expect(getByText("Press ? to toggle this panel")).toBeTruthy()
    heard.length = 0
    document.body.dispatchEvent(key("Escape"))
    expect(heard).toEqual([])
    await vi.waitFor(() => expect(queryByRole("dialog")).toBeNull())
    // Again, and closed by its key, by the ground behind it, and by ? itself.
    window.dispatchEvent(key("?"))
    fireEvent.click(getByRole("button", { name: "Close" }))
    await vi.waitFor(() => expect(queryByRole("dialog")).toBeNull())
    window.dispatchEvent(key("?"))
    fireEvent.click(getByText("Keyboard shortcuts"))
    expect(queryByRole("dialog")).not.toBeNull()
    fireEvent.click(getByRole("dialog"))
    await vi.waitFor(() => expect(queryByRole("dialog")).toBeNull())
    window.dispatchEvent(key("?"))
    window.dispatchEvent(key("?"))
    await vi.waitFor(() => expect(queryByRole("dialog")).toBeNull())
    unmount()
    window.dispatchEvent(key("?"))
    expect(queryByRole("dialog")).toBeNull()
    window.removeEventListener("keydown", onWindow)
  })
})

describe("VideoDialog", () => {
  beforeEach(fresh)

  it("asks for a frame when none is selected, and is out of the page when closed", () => {
    const closed = render(() => <VideoDialog open={false} />)
    expect(closed.queryByRole("dialog")).toBeNull()
    closed.unmount()
    const { getByRole, getByText } = render(() => <VideoDialog open />)
    expect(getByRole("dialog").getAttribute("aria-label")).toBe("Export video")
    expect(getByText("Select a frame first.")).toBeTruthy()
  })

  it("exports the selected frame: its length, rate and theme, focus on its close key", async () => {
    const a = addArtboard("area")
    a.name = "Revenue"
    let closes = 0
    const { getByRole, getByLabelText, getByText } = render(() => <VideoDialog open onClose={() => closes++} />)
    await tick()
    expect(document.activeElement).toBe(getByRole("button", { name: "Close" }))
    expect(getByText("Revenue")).toBeTruthy()
    expect(getByRole("dialog").textContent).toContain(`(${a.w}×${a.h}) is the video frame`)
    const seconds = getByLabelText("length") as HTMLInputElement
    expect(seconds.value).toBe(String(defaultSeconds(a)))
    expect(seconds.type).toBe("number")
    fireEvent.input(seconds, { target: { value: "9000" } })
    expect(seconds.value).toBe("600")
    fireEvent.input(seconds, { target: { value: "" } })
    expect(seconds.value).toBe("1")
    const pressed = (name: string) => getByRole("button", { name }).getAttribute("aria-pressed")
    expect([pressed("24 fps"), pressed("30 fps"), pressed("60 fps")]).toEqual(["false", "true", "false"])
    fireEvent.click(getByRole("button", { name: "60 fps" }))
    expect([pressed("30 fps"), pressed("60 fps")]).toEqual(["false", "true"])
    expect(getByRole("group", { name: "frame rate" })).toBeTruthy()
    expect([pressed("dark"), pressed("light")]).toEqual(["true", "false"])
    fireEvent.click(getByRole("button", { name: "light" }))
    expect(pressed("light")).toBe("true")
    expect(getByRole("button", { name: `Download ${videoFileName(a)}` }).classList.contains("key-chrome")).toBe(true)
    expect(getByRole("dialog").textContent).toContain(renderCommand(a))
    // The preview opens the player on this frame, in the theme picked.
    const opened = vi.spyOn(window, "open").mockReturnValue(null)
    fireEvent.click(getByRole("button", { name: "Preview" }))
    expect(opened).toHaveBeenCalledWith(playerUrl(a, "light"), "_blank", "noopener")
    opened.mockRestore()
    fireEvent.click(getByRole("button", { name: "Copy the render command" }))
    await vi.waitFor(() => expect(getByRole("dialog").querySelector("[aria-live=polite]")?.textContent).not.toBe(""))

    // Escape closes and stops there; the ground behind closes, the panel does not.
    const heard: string[] = []
    const onWindow = (e: KeyboardEvent) => heard.push(e.key)
    window.addEventListener("keydown", onWindow)
    seconds.dispatchEvent(key("Escape"))
    seconds.dispatchEvent(key("a"))
    window.removeEventListener("keydown", onWindow)
    expect(heard).toEqual(["a"])
    expect(closes).toBe(1)
    fireEvent.click(getByText("Export as video"))
    expect(closes).toBe(1)
    fireEvent.click(getByRole("dialog"))
    fireEvent.click(getByRole("button", { name: "Close" }))
    expect(closes).toBe(3)
  })

  it("takes a reel's own length each time it opens", async () => {
    const a = addArtboard("area")
    const reel = addReelArtboard([a.id])
    const [open, setOpen] = createSignal(false)
    const { getByLabelText } = render(() => <VideoDialog open={open()} />)
    setOpen(true)
    await tick()
    expect((getByLabelText("length") as HTMLInputElement).value).toBe(String(defaultSeconds(reel)))
  })
})

describe("ExportDialog", () => {
  beforeEach(fresh)

  it("shows the selected frame's code in the styling picked, copies it and downloads every frame", async () => {
    vi.useFakeTimers()
    const a = addArtboard("area")
    a.name = "Revenue chart!"
    addArtboard("button")
    selectArtboard(a.id)
    let closes = 0
    const [open, setOpen] = createSignal(false)
    const { getByRole, getByText, queryByRole, getByTestId } = render(() => (
      <ExportDialog open={open()} onClose={() => closes++} />
    ))
    expect(queryByRole("dialog")).toBeNull()
    setOpen(true)
    await tick()
    expect(getByRole("dialog").getAttribute("aria-label")).toBe("Export code")
    expect(document.activeElement).toBe(getByRole("button", { name: "Close" }))
    expect(getByText("Export as a Solid component")).toBeTruthy()
    const code = () => getByTestId("code").textContent
    expect(code()).toBe(chartCode(a.chart))
    // The reader's styling system, one choice for the docs and the Studio.
    fireEvent.click(getByRole("button", { name: "StyleX" }))
    expect(code()).toContain("stylex.create({")
    expect(code()).not.toContain('class="h-80"')
    // A stylesheet is its own file, read under the component.
    fireEvent.click(getByRole("button", { name: "Modules" }))
    expect(code()).toContain('import styles from "./revenue-chart-.module.css"')
    expect(code()).toContain("\n\n/* revenue-chart-.module.css */\n.")
    fireEvent.click(getByRole("button", { name: "Tailwind" }))
    // It follows the selection and the frame's edits.
    a.chart.cell = 3
    expect(code()).toBe(chartCode(a.chart))
    selectArtboard(editor.artboards[1].id)
    expect(code()).toContain("DitherButton")
    deselect()
    expect(code()).toBe("// select an artboard")

    const all = getByRole("button", { name: "Download all (2)" })
    expect(all.title).toBe("Download every artboard as its own .tsx file (2)")
    const saved: string[] = []
    const link = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      saved.push(this.download)
    })
    URL.createObjectURL ??= () => "blob:x"
    URL.revokeObjectURL ??= () => {}
    fireEvent.click(all)
    await vi.advanceTimersByTimeAsync(300)
    expect(saved).toEqual(["revenue-chart-.tsx", "button.tsx"])
    // ...each with the stylesheet it imports, where the system keeps one (a
    // lone kit component has no class of its own to move).
    fireEvent.click(getByRole("button", { name: "Modules" }))
    saved.length = 0
    fireEvent.click(all)
    await vi.advanceTimersByTimeAsync(600)
    link.mockRestore()
    expect(saved).toEqual(["revenue-chart-.tsx", "revenue-chart-.module.css", "button.tsx"])
    fireEvent.click(getByRole("button", { name: "Tailwind" }))

    Object.defineProperty(navigator, "clipboard", { value: { writeText: async () => {} }, configurable: true })
    fireEvent.click(getByRole("button", { name: "Copy" }))
    await vi.advanceTimersByTimeAsync(0)
    expect(getByRole("button", { name: "Copied" })).toBeTruthy()
    await vi.advanceTimersByTimeAsync(1500)
    expect(getByRole("button", { name: "Copy" })).toBeTruthy()

    getByRole("dialog").dispatchEvent(key("Escape"))
    fireEvent.click(getByRole("dialog"))
    fireEvent.click(getByText("Export as a Solid component"))
    expect(closes).toBe(2)
  })
})

describe("the agent's own inserts", () => {
  beforeEach(fresh)

  // Carried from tests/reel.spec.ts (the rest of it holds the reel's
  // timeline and renderer, which are not this slice's).
  it("builds the kit's frames into a film with chapters and a score, its frames in a row under it", () => {
    const id = addLaunchFilm()
    const film = editor.artboards.find((a) => a.id === id)
    if (film?.widget?.kind !== "reel") throw new Error("no film")
    expect(editor.artboards).toHaveLength(6)
    expect(film.widget.clips).toHaveLength(5)
    expect(film.widget.clips.every((c) => c.chapter)).toBe(true)
    expect(film.widget.clips.filter((c) => c.camera.length === 2)).toHaveLength(5)
    expect(film.widget.score).toEqual({ seed: 7 })
    expect(reelDuration(film.widget.clips)).toBe(21)
    expect([film.w, film.h]).toEqual([960, 540])
    expect(editor.selectedArtboardId).toBe(id)
    const frames = editor.artboards.filter((a) => a.id !== id)
    expect(new Set(frames.map((f) => f.y)).size).toBe(1)
    expect(frames[0].y).toBeGreaterThan(film.y + film.h)
  })

  it("evolves the selection into a row of variants, selected, their entrances replayed", () => {
    expect(evolveSelected()).toEqual([])
    const parent = addArtboard("area")
    const token = editor.replayToken
    const gen = evolveSelected({ count: 3, seed: 5 })
    expect(gen).toHaveLength(3)
    expect(editor.artboards).toHaveLength(4)
    expect(editor.selectedIds).toEqual(gen.map((g) => g.id))
    expect(new Set(gen.map((g) => g.y)).size).toBe(1)
    expect(gen.every((g) => g.id !== parent.id)).toBe(true)
    expect(editor.replayToken).toBe(token + 1)
  })
})

describe("carried from tests/editor-placement.spec.ts", () => {
  beforeAll(fresh)

  type B = { x: number; y: number; w: number; h: number }
  /** Two frames stand clear of each other (their gap kept). */
  const clear = (a: B, b: B) =>
    a.x + a.w + FRAME_GAP <= b.x ||
    b.x + b.w + FRAME_GAP <= a.x ||
    a.y + a.h + FRAME_GAP <= b.y ||
    b.y + b.h + FRAME_GAP <= a.y
  /** A frame wholly on the canvas as seen. */
  const seen = (a: B) => {
    const { x, y, zoom } = editor.viewport
    return (
      a.x * zoom + x >= 0 &&
      a.y * zoom + y >= 0 &&
      (a.x + a.w) * zoom + x <= editor.stage.w &&
      (a.y + a.h) * zoom + y <= editor.stage.h
    )
  }

  beforeEach(() => {
    editor.artboards = []
    editor.viewport = { x: 100, y: 60, zoom: 2 }
    editor.stage = { w: 900, h: 640 }
  })

  describe("artboard placement", () => {
    it("centers new frames on the canvas as seen, whatever the window's size", () => {
      const a = createArtboard("button")
      placeArtboard(a)
      expect(a.x).toBe(Math.round((900 / 2 - 100) / 2 - a.w / 2))
      expect(a.y).toBe(Math.round((640 / 2 - 60) / 2 - a.h / 2))
      expect(editor.selectedArtboardId).toBe(a.id)
    })

    it("centres a frame placed before the canvas measured itself, once it has", () => {
      // Placed against the stage assumed before measuring...
      editor.stage = { w: 1280, h: 720 }
      const a = placeArtboard(createArtboard("button"))
      // ...then the canvas turns out narrower: centring pans to it, zoom kept.
      editor.stage = { w: 700, h: 500 }
      centreOn(a)
      expect(editor.viewport.zoom).toBe(2)
      expect(editor.viewport.x + (a.x + a.w / 2) * 2).toBeCloseTo(350, 0)
      expect(editor.viewport.y + (a.y + a.h / 2) * 2).toBeCloseTo(250, 0)
    })

    it("puts a frame on free canvas nearest the centre when one stands there, in view", () => {
      // Each lands in view (the view pans to it when it must); at 100%, where
      // a chart fits the stage.
      editor.viewport = { x: 0, y: 0, zoom: 1 }
      const place = (kind: "button" | "area") => {
        const a = placeArtboard(createArtboard(kind))
        expect(seen(a), kind).toBe(true)
        return a
      }
      const first = place("button")
      const second = place("button")
      const third = place("area")
      expect(clear(first, second)).toBe(true)
      expect(clear(first, third) && clear(second, third)).toBe(true)
      expect(editor.selectedArtboardId).toBe(third.id)
      // Nearest: the second stands right beside the first, the gap apart.
      const d = Math.min(Math.abs(second.x - first.x) - first.w, Math.abs(second.y - first.y) - first.h)
      expect(d).toBeLessThan(FRAME_GAP + 20)
    })

    it("puts copies beside their originals, clear of every frame, selected", () => {
      const a = placeArtboard(createArtboard("button"))
      const b = placeArtboard(createArtboard("button"))
      editor.selectedIds = [a.id, b.id]
      duplicateSelected()
      const copies = editor.artboards.slice(2)
      expect(copies).toHaveLength(2)
      expect(editor.selectedIds).toEqual(copies.map((c) => c.id))
      for (const c of copies) for (const o of [a, b]) expect(clear(c, o)).toBe(true)
      // The pair moved as one: their layout kept.
      expect(copies[1].x - copies[0].x).toBe(b.x - a.x)
      expect(copies[1].y - copies[0].y).toBe(b.y - a.y)
      // Pasted copies too.
      selectArtboard(a.id)
      copySelected()
      pasteClipboard()
      const pasted = editor.artboards[editor.artboards.length - 1]
      for (const o of editor.artboards.slice(0, -1)) expect(clear(pasted, o)).toBe(true)
    })
  })
})

describe("carried from tests/editor-selection.spec.ts", () => {
  beforeAll(fresh)

  beforeEach(() => {
    const first = createArtboard("button", 10, 20)
    const second = createArtboard("button", 30, 40)
    second.locked = true
    editor.artboards = [first, second]
    selectMany(editor.artboards.map((a) => a.id))
  })

  describe("selected artboard movement", () => {
    it("moves every selected unlocked artboard", () => {
      moveSelected(5, -2)
      expect(editor.artboards.map(({ x, y }) => [x, y])).toEqual([
        [15, 18],
        [30, 40],
      ])
    })
  })
})

describe("carried from tests/editor-series.spec.ts", () => {
  beforeAll(fresh)

  beforeEach(() => {
    // Two charts whose series share their default keys.
    editor.artboards = [createArtboard("area", 0, 0), createArtboard("area", 600, 0)]
  })

  describe("deleteSeries", () => {
    it("deletes from the frame its layer belongs to, not the selected one", () => {
      const [selected, other] = editor.artboards
      const key = other.chart.series[0].key
      expect(selected.chart.series.some((s) => s.key === key)).toBe(true)
      selectArtboard(selected.id)
      deleteSeries(other.id, key)
      expect(other.chart.series.some((s) => s.key === key)).toBe(false)
      expect(selected.chart.series.some((s) => s.key === key)).toBe(true)
    })
    it("moves the selection off the series it deleted", () => {
      const [a] = editor.artboards
      const key = a.chart.series[0].key
      selectArtboard(a.id)
      editor.selectedLayerId = `${a.id}:series:${key}`
      deleteSeries(a.id, key)
      expect(editor.selectedLayerId).toBe(`${a.id}:root`)
    })
  })
})

// The canvas view: its gestures and its view functions steer the editor's
// viewport, whichever object it is (loading a document, switching a project
// or centring a fresh frame replaces it); the bar, the keys and the agent
// zoom and fit through the same functions; Inspect reads at 100% and holds.
describe("carried from tests/pan-zoom.spec.ts", () => {
  beforeAll(fresh)

  beforeEach(() => {
    stopInspecting()
    editor.stage = { w: 800, h: 600 }
    editor.viewport = { x: 0, y: 0, zoom: 1 }
  })

  describe("pan and zoom", () => {
    it("still steer the viewport after the editor replaces it", () => {
      const el = document.createElement("div")
      const host = () => el
      const { onWheel } = usePanZoom(host)
      // A fresh document's frame centred once the canvas measured itself: a
      // new viewport object.
      centreOn(createArtboard("button"))
      zoomIn()
      expect(editor.viewport.zoom).toBeCloseTo(1.2)
      const y = editor.viewport.y
      onWheel(new WheelEvent("wheel", { deltaY: 50 }))
      expect(editor.viewport.y).toBe(y - 50)
    })

    it("zooms about the stage's centre, the world under it kept", () => {
      const world = (v = editor.viewport) => ({ x: (400 - v.x) / v.zoom, y: (300 - v.y) / v.zoom })
      const before = world()
      zoomIn()
      zoomIn()
      expect(world().x).toBeCloseTo(before.x)
      expect(world().y).toBeCloseTo(before.y)
      zoomOut()
      expect(editor.viewport.zoom).toBeCloseTo(1.2)
      actualSize()
      expect(editor.viewport.zoom).toBe(1)
      expect(world().x).toBeCloseTo(before.x)
    })

    it("fits every frame, or the selection, never past 100%", () => {
      const a = createArtboard("button")
      const b = createArtboard("button")
      Object.assign(a, { x: 0, y: 0, w: 200, h: 100 })
      Object.assign(b, { x: 3000, y: 0, w: 200, h: 100 })
      editor.artboards = [a, b]
      fitAll()
      const v = editor.viewport
      expect(v.zoom).toBeLessThan(1)
      // Both ends on the stage.
      expect(a.x * v.zoom + v.x).toBeGreaterThanOrEqual(0)
      expect((b.x + b.w) * v.zoom + v.x).toBeLessThanOrEqual(800)
      selectArtboard(a.id)
      fitSelection()
      expect(editor.viewport.zoom).toBe(1)
      expect((a.x + a.w / 2) * editor.viewport.zoom + editor.viewport.x).toBeCloseTo(400)
    })

    it("inspects at 100% on the selection, and holds the zoom until it ends", () => {
      const a = createArtboard("button")
      Object.assign(a, { x: 500, y: 400, w: 200, h: 100 })
      editor.artboards = [a]
      selectArtboard(a.id)
      editor.viewport = { x: 10, y: 10, zoom: 0.5 }
      startInspecting()
      expect(editor.inspecting).toBe(true)
      expect(editor.viewport.zoom).toBe(1)
      expect(a.x + a.w / 2 + editor.viewport.x).toBe(400)
      zoomIn()
      fitAll()
      expect(editor.viewport.zoom).toBe(1)
      stopInspecting()
      zoomIn()
      expect(editor.viewport.zoom).toBeCloseTo(1.2)
    })
  })
})

// The changes bar frame by frame: one frame back to where the turn found it
// (removed when the turn made it, back when the turn removed it), the rest
// of the canvas as it stands, as one undoable step; each row's Undo and
// Keep, and the row that puts an undone frame back.
describe("carried from tests/frame-undo.spec.ts", () => {
  beforeAll(fresh)

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
})

describe("carried from tests/components/projects.spec.ts", () => {
  beforeAll(fresh)

  // The persistence module is a singleton over the editor singleton — these run
  // as one sequential story, resetting storage (not module state) between steps.
  beforeEach(() => {
    // no localStorage.clear(): later steps build on earlier ones deliberately
  })

  describe("project workspace (sequential story)", () => {
    it("migrates the legacy single-document key into the first project", () => {
      localStorage.clear()
      localStorage.setItem(
        "dither-studio-v8",
        JSON.stringify({
          artboards: [
            {
              id: "legacy1",
              name: "Legacy chart",
              x: 0,
              y: 0,
              w: 520,
              h: 360,
              hidden: false,
              locked: false,
              groupId: null,
              chart: { type: "bar" },
            },
          ],
          groups: [],
        }),
      )
      // A kept document is no fresh one: nothing to centre once mounted.
      expect(hydrate()).toBe(false)
      expect(projects).toHaveLength(1)
      expect(projects[0].name).toBe("My project")
      expect(editor.artboards[0].name).toBe("Legacy chart")
      expect(editor.artboards[0].chart.type).toBe("bar")
      // legacy key consumed
      expect(localStorage.getItem("dither-studio-v8")).toBeNull()
    })
    it("rehydrates without duplicating project metadata", () => {
      hydrate()
      expect(projects).toHaveLength(1)
      expect(projects[0].name).toBe("My project")
    })

    it("createProject starts a fresh isolated document", () => {
      const before = editor.artboards.map((a) => a.id)
      createProject("Second")
      expect(projects).toHaveLength(2)
      expect(activeProjectId.value).toBe(projects[1].id)
      // fresh default doc, not the legacy artboards
      expect(editor.artboards.map((a) => a.id)).not.toEqual(before)
      expect(editor.artboards).toHaveLength(1)
      expect(editor.artboards[0].name).toBe("Area chart")
      expect(editor.artboards[0].x).not.toBe(0)
      expect(editor.artboards[0].y).not.toBe(0)
    })

    it("switching back restores the first project's work untouched", () => {
      switchProject(projects[0].id)
      expect(editor.artboards[0].name).toBe("Legacy chart")
      switchProject(projects[1].id)
      expect(editor.artboards[0].name).not.toBe("Legacy chart")
    })

    it("rename persists to the index", () => {
      renameProject(projects[1].id, "Renamed")
      expect(projects[1].name).toBe("Renamed")
      const idx = JSON.parse(localStorage.getItem("dither-studio-projects")!)
      expect(idx[1].name).toBe("Renamed")
    })

    it("duplicating a project copies its work beside it and opens the copy", () => {
      const [first] = projects
      duplicateProject(first.id)
      expect(projects.map((p) => p.name)).toEqual([first.name, `${first.name} copy`, "Renamed"])
      expect(activeProjectId.value).toBe(projects[1].id)
      expect(editor.artboards[0].name).toBe("Legacy chart")
      const idx = JSON.parse(localStorage.getItem("dither-studio-projects")!)
      expect(idx).toHaveLength(3)
      deleteProject(projects[1].id)
      expect(activeProjectId.value).toBe(projects[0].id)
    })

    it("deleting the active project falls back to the remaining one", () => {
      deleteProject(projects[1].id)
      expect(projects).toHaveLength(1)
      expect(activeProjectId.value).toBe(projects[0].id)
      expect(editor.artboards[0].name).toBe("Legacy chart")
    })

    it("deleting the last project puts a new one, named anew, in its place", () => {
      const [last] = projects
      expect(deleteWarning(last.id)).toContain("It is your only project, so a new one takes its place.")
      deleteProject(last.id)
      expect(projects).toHaveLength(1)
      // The delete reads as one: neither the id nor the name comes back.
      expect(projects[0].id).not.toBe(last.id)
      expect(projects[0].name).not.toBe(last.name)
      expect(deleteWarning(projects[0].id)).toMatch(/^“Project 1”, its frames and its chats will be removed/)
      expect(editor.artboards).toHaveLength(1)
      expect(editor.artboards[0].x).not.toBe(0)
      expect(editor.artboards[0].y).not.toBe(0)
    })

    it("says when a first visit got the fresh document, so the page can centre it", () => {
      localStorage.clear()
      expect(hydrate()).toBe(true)
      expect(editor.artboards).toHaveLength(1)
    })
  })
})

describe("carried from tests/components/persistence-autosave.spec.ts", () => {
  beforeAll(fresh)

  afterEach(() => {
    stopAutosave()
    vi.useRealTimers()
    localStorage.clear()
  })

  describe("studio autosave", () => {
    it("persists viewport changes without document edits", async () => {
      vi.useFakeTimers()
      localStorage.clear()
      hydrate()
      startAutosave()

      editor.viewport.x = 123
      editor.viewport.y = 45
      editor.viewport.zoom = 1.5
      await tick()
      vi.advanceTimersByTime(401)

      const raw = localStorage.getItem(`dither-studio-doc-${activeProjectId.value}`)
      expect(raw).not.toBeNull()
      expect(JSON.parse(raw!).viewport).toEqual({ x: 123, y: 45, zoom: 1.5 })
    })
  })
})

// A project's chats with the agent: the list the Studio's sidebar shows, the
// chat open in the panel, and each chat's thread.
describe("carried from tests/agent-chats.spec.ts", () => {
  beforeAll(fresh)

  type E = { kind: string; text?: string }
  const said = (...texts: string[]): { entries: E[]; usage: { input: number; output: number } } => ({
    entries: texts.map((text) => ({ kind: "user", text })),
    usage: { input: 0, output: 0 },
  })

  beforeEach(() => {
    localStorage.clear()
    chats.project = ""
  })

  describe("a project's chats", () => {
    it("lists a chat once something is said in it, newest first, and keeps each thread apart", () => {
      openProject("p1")
      const first = chats.active
      expect(chats.list).toEqual([])
      saveThread("p1", first, said("A sign-in screen\nwith a link"), true)
      newChat()
      const second = chats.active
      expect(second).not.toBe(first)
      expect(chats.list.map((c) => c.id)).toEqual([first])
      saveThread("p1", second, said("A table"), true)
      expect(chats.list.map((c) => c.title)).toEqual(["A table", "A sign-in screen"])
      openChat(first)
      expect(loadThread<E>("p1", chats.active)?.entries[0].text).toBe("A sign-in screen\nwith a link")
      // Something new said in the older chat brings it to the top.
      saveThread("p1", first, said("A sign-in screen", "Make it dark"), true)
      expect(chats.list[0].id).toBe(first)
    })

    it("lists a chat once something is said in it, not when the harness first speaks", () => {
      openProject("p1")
      saveThread(
        "p1",
        chats.active,
        { entries: [{ kind: "system", text: "connected" }], usage: { input: 0, output: 0 } },
        true,
      )
      expect(chats.list).toEqual([])
      saveThread("p1", chats.active, said("A table"), true)
      expect(chats.list.map((c) => c.title)).toEqual(["A table"])
    })

    it("keeps a chat in its place when nothing new is said, and drops one emptied", () => {
      openProject("p1")
      const a = chats.active
      saveThread("p1", a, said("One"), true)
      newChat()
      const b = chats.active
      saveThread("p1", b, said("Two"), true)
      const at = chats.list.find((c) => c.id === a)?.at
      saveThread("p1", a, said("One"))
      expect(chats.list.map((c) => c.id)).toEqual([b, a])
      expect(chats.list[1].at).toBe(at)
      saveThread("p1", b, said())
      expect(chats.list.map((c) => c.id)).toEqual([a])
    })

    it("opens a project at its newest chat, and a removed chat hands over to the next", () => {
      openProject("p1")
      const a = chats.active
      saveThread("p1", a, said("One"), true)
      newChat()
      const b = chats.active
      saveThread("p1", b, said("Two"), true)
      chats.project = ""
      openProject("p1")
      expect(chats.active).toBe(b)
      removeChat(b)
      expect(chats.active).toBe(a)
      expect(loadThread("p1", b)).toBeNull()
      removeChat(a)
      expect(chats.list).toEqual([])
      expect(chats.active).not.toBe(a)
    })

    it("makes the thread a project kept before chats existed its first chat", () => {
      localStorage.setItem(
        "dither-agent-session-p1",
        JSON.stringify({ entries: [{ kind: "user", text: "An old ask" }], usage: { input: 3, output: 4 } }),
      )
      openProject("p1")
      expect(chats.list.map((c) => c.title)).toEqual(["An old ask"])
      expect(loadThread("p1", chats.active)?.usage).toEqual({ input: 3, output: 4 })
      expect(localStorage.getItem("dither-agent-session-p1")).toBeNull()
    })

    it("keeps a thread under a cap, dropping the oldest entries first", () => {
      openProject("p1")
      const big = Array.from({ length: 400 }, (_, i) => ({ kind: "assistant", text: `${i}:${"x".repeat(1000)}` }))
      saveThread("p1", chats.active, { entries: big, usage: { input: 1, output: 2 } }, true)
      const s = loadThread<E>("p1", chats.active)
      expect(s?.usage).toEqual({ input: 1, output: 2 })
      expect(s?.entries.length).toBeLessThan(400)
      expect(s?.entries.at(-1)?.text?.startsWith("399:")).toBe(true)
    })

    it("names a chat by its first message", () => {
      expect(titleOf([])).toBe("New chat")
      expect(
        titleOf([
          { kind: "system", text: "connected" },
          { kind: "user", text: "A\nB" },
        ]),
      ).toBe("A")
    })

    it("says how long ago the way a chat list does", () => {
      const now = Date.UTC(2026, 10, 3, 12)
      const ago = (ms: number) => agoOf(now - ms, now)
      expect(ago(20_000)).toBe("now")
      expect(ago(9 * 60_000)).toBe("9m")
      expect(ago(2 * 3_600_000)).toBe("2h")
      expect(ago(3 * 86_400_000)).toBe("3d")
      expect(ago(15 * 86_400_000)).toBe("2w")
      expect(ago(60 * 86_400_000)).toBe("Sep 4")
    })
  })

  describe("managing chats", () => {
    it("keeps a title the user gave over the first message's, and gives it back when cleared", () => {
      openProject("p1")
      const id = chats.active
      saveThread("p1", id, said("A sign-in screen"), true)
      renameChat(id, "  Login   flow ")
      expect(chats.list[0]).toMatchObject({ title: "Login flow", named: true })
      saveThread("p1", id, said("A sign-in screen", "Make it dark"), true)
      expect(chats.list[0].title).toBe("Login flow")
      renameChat(id, "")
      expect(chats.list[0].title).toBe("A sign-in screen")
      expect(chats.list[0].named).toBeUndefined()
    })

    it("groups chats as the sidebar shows them: pinned, then by the day they last moved", () => {
      const now = new Date(2026, 10, 4, 15).getTime()
      const at = (days: number, hours = 0) => now - days * 86_400_000 - hours * 3_600_000
      const groups = chatGroups(
        [
          { id: "a", title: "a", at: at(0, 1) },
          { id: "b", title: "b", at: at(1) },
          { id: "c", title: "c", at: at(3) },
          { id: "d", title: "d", at: at(20) },
          { id: "e", title: "e", at: at(40), pinned: true },
        ],
        now,
      )
      expect(groups.map((g) => [g.label, g.chats.map((c) => c.id)])).toEqual([
        ["Pinned", ["e"]],
        ["Today", ["a"]],
        ["Yesterday", ["b"]],
        ["This week", ["c"]],
        ["Earlier", ["d"]],
      ])
    })

    it("pins a chat, steps between chats in the sidebar's order, and reads another project's chats", () => {
      openProject("p2")
      saveThread("p2", chats.active, said("Elsewhere"), true)
      chats.project = ""
      openProject("p1")
      const first = chats.active
      saveThread("p1", first, said("One"), true)
      newChat()
      const second = chats.active
      saveThread("p1", second, said("Two"), true)
      pinChat(first, true)
      expect(chatGroups(chats.list)[0]).toMatchObject({ label: "Pinned", chats: [{ id: first }] })
      // The pinned chat stands first, so the one before the open chat is it.
      stepChat(-1)
      expect(chats.active).toBe(first)
      stepChat(-1)
      expect(chats.active).toBe(first)
      stepChat(1)
      expect(chats.active).toBe(second)
      pinChat(first, false)
      expect(chats.list.find((c) => c.id === first)?.pinned).toBeUndefined()
      expect(chatsOf("p2").map((c) => c.title)).toEqual(["Elsewhere"])
      // A hostile index keeps only well-formed chats and only true flags.
      localStorage.setItem(
        "dither-agent-chats-p3",
        JSON.stringify([{ id: "x", title: "ok", at: 1, pinned: "yes" }, { id: 7 }, "junk"]),
      )
      expect(chatsOf("p3")).toEqual([{ id: "x", title: "ok", at: 1 }])
    })
  })

  describe("deleting a project", () => {
    it("forgets its chats, threads and drafts, and only its own", () => {
      const keys = [
        "dither-agent-chats-p1",
        "dither-agent-session-p1/c1",
        "dither-agent-session-p1",
        "dither-agent-draft-p1/c1",
        "dither-agent-chats-p10",
        "dither-agent-session-p10/c1",
        "dither-agent-draft-p2/c1",
        "dither-studio-doc-p1",
      ]
      for (const k of keys) localStorage.setItem(k, "[]")
      forgetProject("p1")
      expect(Object.keys(localStorage).sort()).toEqual(
        [
          "dither-agent-chats-p10",
          "dither-agent-draft-p2/c1",
          "dither-agent-session-p10/c1",
          "dither-studio-doc-p1",
        ].sort(),
      )
      forgetProject("")
      expect(Object.keys(localStorage)).toHaveLength(4)
    })
  })
})

// The Studio as one tool: a harness finds the action that fits its job (and
// the kit components that do), runs it, or builds one when none fits; a
// built tool is kept, found first next time, and runs only once the user
// says so.
describe("carried from tests/agent-dither.spec.ts", () => {
  beforeAll(fresh)

  const ok = (data: unknown) => ({ ok: true as const, data })

  function deps(over: Partial<DitherDeps> = {}) {
    const steps: DitherStep[] = []
    const commands: unknown[] = []
    const d: DitherDeps = {
      run: (c) => (commands.push(c), ok({ id: "f1", name: "Sign in" })),
      approve: async () => true,
      sandbox: async (_code, args, call) => ok({ ran: await call("add_screen", { name: String(args.title) }) }),
      onStep: (s) => steps.push(s),
      ...over,
    }
    return { d, steps, commands }
  }

  beforeEach(() => {
    localStorage.clear()
    built.list = []
  })

  describe("the one tool", () => {
    it("is one short definition naming every action, in place of every action's schema", () => {
      const def = ditherDef()
      for (const { def: t } of STUDIO_TOOLS) expect(def.description).toContain(t.name)
      const all = JSON.stringify(STUDIO_TOOLS.map((t) => t.def)).length
      expect(JSON.stringify(def).length).toBeLessThan(all / 3)
    })

    it("reads its input once into find, run or build, and says what it takes otherwise", () => {
      expect(parseDither({ find: " a sign-in screen " })).toEqual({ kind: "find", job: "a sign-in screen" })
      expect(parseDither({ run: "add_screen" })).toEqual({ kind: "run", action: "add_screen", args: {} })
      expect(parseDither({ build: { name: "Bad Name", description: "x", code: "return 1" } })).toMatchObject({
        error: expect.stringContaining("name"),
      })
      expect(parseDither({ build: { name: "add_screen", description: "x", code: "return 1" } })).toMatchObject({
        error: expect.stringContaining("already"),
      })
      expect(parseDither(null)).toMatchObject({ error: expect.any(String) })
    })
  })

  describe("finding what fits", () => {
    it("maps a person's words to the schema's", () => {
      expect(wordsOf("Make a login page with a graph")).toEqual(["add", "login", "screen", "chart"])
    })

    it("puts the action that fits the job first, with its exact arguments, and the components it names", () => {
      const found = findFor("a sign-in screen with an email field and a slider")
      expect(found.actions[0].name).toBe("add_screen")
      expect(found.actions[0].args).toEqual(STUDIO_TOOLS.find((t) => t.def.name === "add_screen")?.def.parameters)
      expect(found.actions.length).toBeLessThanOrEqual(3)
      expect(found.components.map((c) => c.is)).toContain("DitherSlider")
      expect(findFor("export it as a film").actions[0].name).toBe("export_video")
      // The canvas bar's actions are found in a person's words too.
      expect(findFor("check the contrast of the login screen").actions[0].name).toBe("inspect")
      expect(findFor("save a png of the frame").actions[0].name).toBe("export_png")
      expect(findFor("zoom to fit the canvas").actions[0].name).toBe("set_view")
      expect(findFor("clone this frame").actions[0].name).toBe("duplicate")
      expect(findFor("ungroup them").actions[0].name).toBe("ungroup")
    })

    it("says to build a tool when nothing fits the job well", () => {
      const found = findFor("translate the copy into japanese")
      expect(found.fit).toBeLessThan(GOOD_FIT)
      expect(found.next).toContain("build")
    })
  })

  describe("running and building", () => {
    it("runs an action through the Studio protocol and shows it as its own step", async () => {
      const { d, steps, commands } = deps()
      const r = await callDither({ run: "add_screen", args: { name: "Sign in" } }, d)
      expect(r).toEqual(ok({ id: "f1", name: "Sign in" }))
      expect(commands).toEqual([{ name: "Sign in", type: "screen.add" }])
      expect(steps.map((s) => s.name)).toEqual(["add_screen"])
    })

    it("answers a failed run with what the action takes", async () => {
      const { d } = deps({ run: () => ({ ok: false, error: "rows required" }) })
      const r = await callDither({ run: "add_screen", args: {} }, d)
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.error).toMatch(/^rows required\. add_screen takes \{/)
    })

    it("keeps a built tool, finds it first next time, and runs it only once the user says so", async () => {
      const tool = {
        name: "sign_in_flow",
        description: "a sign-in screen with a forgot password link and a remember me checkbox",
        code: "return await studio.run('add_screen', { name: args.title })",
      }
      const { d, steps } = deps()
      expect(await callDither({ build: tool }, d)).toMatchObject({ ok: true })
      expect(JSON.parse(localStorage.getItem("dither-agent-built") ?? "[]")[0].name).toBe("sign_in_flow")
      expect(findFor("sign-in screen with a forgot password link").actions[0]).toMatchObject({
        name: "sign_in_flow",
        built: true,
      })
      expect(ditherDef().description).toContain("sign_in_flow")

      // Asked, and refused: nothing runs.
      let asked = 0
      const refused = deps({ approve: async () => (asked++, false) })
      expect(await callDither({ run: "sign_in_flow", args: { title: "Hi" } }, refused.d)).toEqual({
        ok: false,
        error: "the user did not let it run",
      })
      expect(asked).toBe(1)
      expect(refused.commands).toEqual([])

      // Allowed: its own Studio calls are steps, then the tool's.
      const r = await callDither({ run: "sign_in_flow", args: { title: "Hi" } }, d)
      expect(r.ok).toBe(true)
      expect(steps.map((s) => [s.name, !!s.built])).toEqual([
        ["build", false],
        ["add_screen", false],
        ["sign_in_flow", true],
      ])
      removeBuilt("sign_in_flow")
      expect(built.list).toEqual([])
    })

    it("lets a built tool reach the Studio's actions only", async () => {
      const { d } = deps({ sandbox: async (_c, _a, call) => call("rm -rf", {}) })
      await callDither({ build: { name: "sneaky", description: "x", code: "" } }, d).catch(() => {})
      built.list = [{ name: "sneaky", description: "x", parameters: {}, code: "x", at: 1 }]
      expect(await callDither({ run: "sneaky" }, d)).toEqual({ ok: false, error: "no action rm -rf" })
    })
  })
})

describe("carried from tests/agent-protocol.spec.ts", () => {
  beforeAll(fresh)

  beforeEach(() => {
    editor.artboards = []
    editor.groups = []
    editor.selectedIds = []
    editor.selectedArtboardId = ""
    editor.viewport = { x: 0, y: 0, zoom: 1 }
  })

  describe("studio agent protocol", () => {
    it("rejects malformed input without throwing", () => {
      expect(runCommand(null).ok).toBe(false)
      expect(runCommand({ type: "nope" }).ok).toBe(false)
      expect(runCommand({ type: "component.add", is: "DitherNotAThing" })).toMatchObject({ ok: false })
    })

    it("adds registry components with sanitized props", () => {
      const r = runCommand({
        type: "component.add",
        is: "DitherSlider",
        props: { max: 9999, step: "x", disabled: true, bogus: 1 },
      })
      expect(r.ok).toBe(true)
      const a = editor.artboards[0]
      expect(a.widget?.kind).toBe("component")
      if (a.widget?.kind === "component") {
        expect(a.widget.is).toBe("DitherSlider")
        expect(a.widget.props.disabled).toBe(true)
        expect(a.widget.props.step).toBe(1) // junk type → default
        expect("bogus" in a.widget.props).toBe(false)
      }
    })

    it("composes screens, dropping unknown cells and reporting them", () => {
      const r = runCommand({
        type: "screen.add",
        name: "Sign in",
        rows: [
          { cells: [{ is: "DitherInput", props: { placeholder: "Email" }, grow: true }], gap: 8 },
          { cells: [{ is: "DitherBadge", slotText: "Continue" }, { is: "DitherNope" }], justify: "end" },
        ],
      })
      expect(r.ok).toBe(true)
      if (r.ok) expect((r.data as { dropped: string[] }).dropped).toEqual(["DitherNope"])
      const a = editor.artboards[0]
      expect(a.name).toBe("Sign in")
      if (a.widget?.kind === "screen") {
        expect(a.widget.rows).toHaveLength(2)
        expect(a.widget.rows[0].cells[0].props.placeholder).toBe("Email")
        expect(a.widget.rows[0].cells[0].grow).toBe(true)
        expect(a.widget.rows[1].cells.map((c) => c.is)).toEqual(["DitherBadge"])
        expect(a.widget.rows[1].justify).toBe("end")
      }
    })

    it("adds charts from the friendly data shape", () => {
      const r = runCommand({
        type: "chart.add",
        chart: "bar",
        name: "Signups",
        data: {
          labels: ["Q1", "Q2", "Q3"],
          series: [
            { key: "web", values: [10, 20, 30] },
            { key: "app", label: "App", color: "pink", values: [5, "x", 9] },
          ],
        },
      })
      expect(r.ok).toBe(true)
      const a = editor.artboards[0]
      expect(a.chart.type).toBe("bar")
      expect(a.chart.rows).toEqual([
        { month: "Q1", web: 10, app: 5 },
        { month: "Q2", web: 20, app: 0 },
        { month: "Q3", web: 30, app: 9 },
      ])
      expect(a.chart.series.map((s) => [s.key, s.label, s.color])).toEqual([
        ["web", "web", "blue"],
        ["app", "App", "pink"],
      ])
      const pie = runCommand({
        type: "chart.add",
        chart: "pie",
        data: { labels: ["a", "b"], series: [{ key: "whatever", values: [3, 7] }] },
      })
      expect(pie.ok).toBe(true)
      expect(editor.artboards[1].chart.rows).toEqual([
        { name: "a", value: 3 },
        { name: "b", value: 7 },
      ])
    })

    it("updates, lists, codes, evolves and removes frames", () => {
      runCommand({ type: "widget.add", widget: "button", props: { label: "Go", color: "orange", variant: "nonsense" } })
      const id = editor.artboards[0].id
      const up = runCommand({
        type: "artboard.update",
        id,
        patch: { name: "CTA", w: 300, widget: { variant: "solid" } },
      })
      expect(up.ok).toBe(true)
      const a = editor.artboards[0]
      expect(a.name).toBe("CTA")
      expect(a.w).toBe(300)
      if (a.widget?.kind === "button") {
        expect(a.widget.label).toBe("Go")
        expect(a.widget.variant).toBe("solid")
      }
      const list = runCommand({ type: "artboard.list" })
      expect(list.ok && (list.data as unknown[]).length).toBe(1)
      const code = runCommand({ type: "code.get", id })
      expect(code.ok && String((code.data as { code: string }).code)).toContain("DitherButton")
      // a Solid component file, never a Vue one
      const frame = dataOf(code) as { file: string; code: string; sheet: null }
      expect(frame).toMatchObject({ file: "cta.tsx", sheet: null })
      expect(frame.code).toContain("export default function Frame() {")
      expect(frame.code).not.toMatch(/<template>|<script/)
      const gen = runCommand({ type: "evolve", id, count: 3, seed: 5 })
      expect(gen.ok && (gen.data as unknown[]).length).toBe(3)
      expect(editor.artboards).toHaveLength(4)
      expect(editor.selectedIds).toHaveLength(3)
      expect(runCommand({ type: "artboard.remove", id }).ok).toBe(true)
      expect(editor.artboards).toHaveLength(3)
    })

    it("writes a frame's code in the asked styling system", () => {
      const added = runCommand({ type: "widget.add", widget: "image" })
      const id = (added as { data: { id: string } }).data.id
      const css = runCommand({ type: "code.get", id, styling: "css" })
      expect(css.ok && (css.data as { styling: string }).styling).toBe("css")
      // What each system's code reads like is `restyle`'s own to hold (the shared
      // layer's); a stylesheet comes beside the component, as the file it imports.
      const styled = dataOf(css) as { code: string; sheet: { file: string; text: string } }
      expect(styled.sheet.file).toBe("image.css")
      expect(styled.sheet.text).toContain(".box {\n  height: 16rem;\n}")
      expect(styled.code).toContain('import "./image.css"')
      expect(styled.code).not.toContain('class="h-64"')
      const sx = runCommand({ type: "code.get", id, styling: "stylex" })
      expect(sx.ok && String((sx.data as { code: string }).code)).toContain("stylex.create({")
      const plain = runCommand({ type: "code.get", id })
      expect(plain.ok && String((plain.data as { code: string }).code)).toContain('class="h-64"')
      expect(runCommand({ type: "code.get", id, styling: "sass" }).ok).toBe(false)
      expect(registrySchema().commands["code.get"]).toContain("stylex")
      expect(registrySchema().commands["code.get"]).toContain("Solid component")
      expect(registrySchema().commands["code.get"]).not.toContain("Vue")
    })

    it("replaces the document through the import validation path", () => {
      expect(runCommand({ type: "document.set", document: { artboards: [] } }).ok).toBe(false)
      const r = runCommand({
        type: "document.set",
        document: { artboards: [{ name: "Imported", chart: { type: "radar" } }, "junk"] },
      })
      expect(r.ok).toBe(true)
      expect(editor.artboards).toHaveLength(1)
      expect(editor.artboards[0].chart.type).toBe("radar")
      expect(typeof editor.artboards[0].id).toBe("string")
      const got = runCommand({ type: "document.get" })
      expect(got.ok && (got.data as { artboards: unknown[] }).artboards.length).toBe(1)
    })

    it("serves the registry with every component's prop specs", () => {
      const reg = registrySchema()
      expect(reg.components.length).toBeGreaterThan(50)
      expect(reg.components.find((c) => c.is === "DitherSlider")?.props.map((p) => p.key)).toContain("max")
      const one = runCommand({ type: "registry.get", is: "DitherTabs" })
      expect(one.ok && (dataOf(one) as { is: string }).is).toBe("DitherTabs")
      expect(JSON.parse(JSON.stringify(reg))).toBeTruthy()
    })

    it("gives a harness the brief registry it can read in one answer, and one component in full", () => {
      // A harness spills a long tool answer to a file and greps it: the names
      // must fit one answer (well under 25k tokens).
      const brief = callStudioTool("get_registry", {})
      expect(brief.ok).toBe(true)
      const comps = (dataOf(brief) as { components: Record<string, unknown>[] }).components
      expect(comps.length).toBe(registrySchema().components.length)
      expect(Object.keys(comps[0]).sort()).toEqual(["group", "is", "label"])
      expect(JSON.stringify(dataOf(brief)).length).toBeLessThan(40_000)
      const one = callStudioTool("get_registry", { is: "DitherSlider" })
      expect((dataOf(one) as { props: { key: string }[] }).props.map((p) => p.key)).toContain("max")
    })

    it("answers DOM-event commands with string details and keeps a document mirror", async () => {
      const uninstall = installStudioAgentApi()
      expect(window.ditherStudio?.version).toBe(1)
      const result = new Promise<Record<string, unknown>>((resolve) => {
        document.addEventListener(RESULT_EVENT, (e) => resolve(JSON.parse((e as CustomEvent).detail as string)), {
          once: true,
        })
      })
      document.dispatchEvent(
        new CustomEvent(COMMAND_EVENT, {
          detail: JSON.stringify({ id: "r1", command: { type: "component.add", is: "DitherSwitch" } }),
        }),
      )
      const got = await result
      expect(got.id).toBe("r1")
      expect(got.ok).toBe(true)
      expect(editor.artboards).toHaveLength(1)
      const mirror = document.getElementById(MIRROR_ID) as HTMLScriptElement
      expect(mirror.type).toBe("application/json")
      await new Promise((r) => setTimeout(r, 500))
      expect(JSON.parse(mirror.textContent || "{}").artboards).toHaveLength(1)
      // Malformed detail answers with an error instead of throwing.
      const bad = new Promise<Record<string, unknown>>((resolve) => {
        document.addEventListener(RESULT_EVENT, (e) => resolve(JSON.parse((e as CustomEvent).detail as string)), {
          once: true,
        })
      })
      document.dispatchEvent(new CustomEvent(COMMAND_EVENT, { detail: "{not json" }))
      expect((await bad).ok).toBe(false)
      uninstall()
      expect(window.ditherStudio).toBeUndefined()
      expect(document.getElementById(MIRROR_ID)).toBeNull()
    })
  })

  describe("video.export", () => {
    it("returns a composition referencing the player, with the assets to fetch", () => {
      editor.artboards = []
      const added = runCommand({ type: "component.add", is: "DitherBadge", name: "Hero badge", slotText: "New" })
      expect(added.ok).toBe(true)
      const r = runCommand({ type: "video.export", seconds: 3, fps: 60, theme: "light" })
      expect(r.ok).toBe(true)
      if (!r.ok) return
      const d = r.data as {
        file: string
        index: string
        assets: { path: string; url: string }[]
        render: string
        options: { seconds: number }
      }
      expect(d.file).toBe("hero-badge.hyperframes.html")
      expect(d.options.seconds).toBe(3)
      expect(d.index).toContain('data-composition-id="dither-hero-badge"')
      expect(d.index).toContain('data-duration="3" data-fps="60"')
      expect(d.index).toContain('<script src="./player.js"></script>')
      expect(d.assets.map((a) => a.path)).toEqual(["player.js", "player.css"])
      expect(d.assets[0].url).toMatch(/^http.*\/play\/player\.js$/)
      expect(d.render).toContain("npx hyperframes render")
      expect(runCommand({ type: "video.export", id: "nope" }).ok).toBe(false)
    })
  })

  describe("clock commands", () => {
    it("hold and free the kit clock for any driver, from the protocol and the window API", () => {
      expect(runCommand({ type: "clock.seek", seconds: 1.5 })).toEqual({
        ok: true,
        data: { directed: true, seconds: 1.5 },
      })
      expect(isDirected()).toBe(true)
      expect(directedTime()).toBe(1500)
      expect(runCommand({ type: "clock.seek", seconds: -1 }).ok).toBe(false)
      expect(runCommand({ type: "clock.seek" })).toEqual({ ok: true, data: { directed: false } })
      expect(isDirected()).toBe(false)
      runCommand({ type: "clock.seek", seconds: 2 })
      expect(runCommand({ type: "clock.release" })).toEqual({ ok: true, data: { directed: false } })
      const off = installStudioAgentApi()
      window.ditherStudio!.clock.seek(0.25)
      expect(window.ditherStudio!.clock.time()).toBe(0.25)
      expect(window.ditherStudio!.clock.directed()).toBe(true)
      window.ditherStudio!.clock.release()
      expect(window.ditherStudio!.clock.directed()).toBe(false)
      expect(registrySchema().commands["clock.seek"]).toContain("seconds")
      off()
      release()
    })
  })

  describe("the canvas bar's actions", () => {
    const add = (name: string) => {
      const r = runCommand({ type: "component.add", is: "DitherBadge", name, slotText: name })
      if (!r.ok) throw new Error(r.error)
      return (r.data as { id: string }).id
    }

    it("duplicates, groups and ungroups the frames named, or the selection", () => {
      const a = add("One")
      const b = add("Two")
      const dup = runCommand({ type: "artboard.duplicate", id: a })
      expect(dup.ok).toBe(true)
      expect(editor.artboards).toHaveLength(3)
      expect(runCommand({ type: "artboard.duplicate", ids: ["nope"] })).toEqual({
        ok: false,
        error: "no artboard nope",
      })

      const g = runCommand({ type: "group", ids: [a, b], name: "Pair" })
      expect(g.ok).toBe(true)
      if (!g.ok) return
      const frames = g.data as { id: string; group: string }[]
      expect(frames.map((f) => f.id)).toEqual([a, b])
      expect(editor.groups).toEqual([expect.objectContaining({ name: "Pair", id: frames[0].group })])
      // Ungrouped by a frame of the group.
      expect(runCommand({ type: "ungroup", id: b })).toMatchObject({ ok: true })
      expect(editor.groups).toEqual([])
      expect(runCommand({ type: "ungroup", id: b }).ok).toBe(false)
    })

    it("moves the view through the canvas's own functions, and holds while the workbench inspects", () => {
      editor.stage = { w: 800, h: 600 }
      const a = add("Wide")
      expect(runCommand({ type: "view", to: "in" })).toMatchObject({ ok: true, data: { zoom: 1.2 } })
      expect(runCommand({ type: "view", zoom: 2 })).toMatchObject({ ok: true, data: { zoom: 2 } })
      expect(runCommand({ type: "view", to: "actual" })).toMatchObject({ ok: true, data: { zoom: 1 } })
      expect(runCommand({ type: "view", id: a })).toMatchObject({ ok: true })
      expect(editor.selectedIds).toEqual([a])
      expect(runCommand({ type: "view", to: "sideways" as never }).ok).toBe(false)
      expect(runCommand({ type: "view", zoom: -1 }).ok).toBe(false)
      editor.inspecting = true
      expect(runCommand({ type: "view", zoom: 2 })).toMatchObject({ ok: true, data: { zoom: 1, inspecting: true } })
      editor.inspecting = false
    })

    it("names a PNG's place under the project, at the scales it takes", () => {
      add("Hero badge")
      expect(runCommand({ type: "image.export" })).toMatchObject({
        ok: true,
        data: { file: "image/hero-badge.png", scale: 2 },
      })
      expect(runCommand({ type: "image.export", scale: 9 }).ok).toBe(false)
    })

    it("inspects a frame as drawn: its controls in Tab order and what the floor finds", () => {
      const id = add("Form")
      // The canvas draws the frame; here, by hand, as Artboard stamps it.
      const frame = document.createElement("div")
      frame.dataset.artboardId = id
      frame.innerHTML = `<div data-artboard-surface><button>Save</button><button></button><img src="x.png"></div>`
      document.body.append(frame)
      // jsdom lays nothing out: a 40px box each, so nothing reads as hidden or small.
      const box = { x: 0, y: 0, top: 0, left: 0, right: 40, bottom: 40, width: 40, height: 40, toJSON: () => ({}) }
      const rect = vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(box as DOMRect)
      const r = runCommand({ type: "inspect", id })
      rect.mockRestore()
      frame.remove()
      expect(r.ok).toBe(true)
      if (!r.ok) return
      const d = r.data as {
        controls: { role: string; name: string }[]
        issues: { kind: string }[]
        passes: boolean
      }
      expect(d.controls.map((c) => [c.role, c.name])).toEqual([
        ["button", "Save"],
        ["button", ""],
      ])
      expect(d.issues.map((i) => i.kind).sort()).toEqual(["alt", "name"])
      expect(d.passes).toBe(false)
      // Not on the page: said so.
      expect(runCommand({ type: "inspect", id })).toMatchObject({ ok: false })
    })

    it("replays every frame's entrance", () => {
      add("One")
      const before = editor.replayToken
      expect(runCommand({ type: "replay" })).toMatchObject({ ok: true, data: { replayed: 1 } })
      expect(editor.replayToken).toBe(before + 1)
    })
  })
})

describe("carried from tests/agent-tools.spec.ts", () => {
  beforeAll(fresh)

  beforeEach(() => {
    localStorage.clear()
  })

  describe("studio tools", () => {
    it("map one to one onto protocol commands and carry schemas a harness can read", () => {
      const names = STUDIO_TOOLS.map((t) => t.def.name)
      expect(names).toEqual([
        "list_artboards",
        "get_registry",
        "add_screen",
        "add_component",
        "add_chart",
        "add_widget",
        "add_reel",
        "update_artboard",
        "remove_artboard",
        "select",
        "evolve",
        "duplicate",
        "group",
        "ungroup",
        "replay",
        "set_view",
        "inspect",
        "export_png",
        "get_code",
        "get_document",
        "seek_clock",
        "export_video",
      ])
      for (const t of STUDIO_TOOLS) expect(t.def.parameters).toMatchObject({ type: "object" })
      // Every command a tool runs is one the registry tells a harness about.
      const listed = Object.keys(registrySchema().commands)
      for (const t of STUDIO_TOOLS) expect(listed, t.def.name).toContain(t.command)
      const seen: unknown[] = []
      const run = (c: unknown): CommandResult => {
        seen.push(c)
        return { ok: true, data: [] }
      }
      expect(callStudioTool("add_chart", { chart: "bar", name: "Q3" }, run)).toEqual({ ok: true, data: [] })
      expect(seen).toEqual([{ chart: "bar", name: "Q3", type: "chart.add" }])
      expect(callStudioTool("nope", {}, run)).toEqual({ ok: false, error: "unknown tool nope" })
    })
  })

  describe("acp mapping", () => {
    it("reads a harness's permission options once, whatever it sends", () => {
      expect(
        permissionOptions([
          { optionId: "allow-once", name: "Allow", kind: "allow_once" },
          { optionId: "reject", kind: 7 },
          { name: "no id" },
          null,
          "x",
        ]),
      ).toEqual([
        { optionId: "allow-once", name: "Allow", kind: "allow_once" },
        { optionId: "reject", name: "reject", kind: "" },
      ])
      expect(permissionOptions(undefined)).toEqual([])
    })
    it("turns session updates into composer events", () => {
      expect(mapUpdate({ sessionUpdate: "agent_message_chunk", content: { type: "text", text: "hi" } })).toEqual([
        { type: "delta", text: "hi" },
      ])
      // The harness's reasoning streams apart from its reply.
      expect(mapUpdate({ sessionUpdate: "agent_thought_chunk", content: { type: "text", text: "hmm" } })).toEqual([
        { type: "thought", text: "hmm" },
      ])
      expect(mapUpdate({ sessionUpdate: "agent_thought_chunk", content: { type: "image" } })).toEqual([])
      expect(
        mapUpdate({ sessionUpdate: "tool_call", toolCallId: "t1", title: "Read file src/app.ts", status: "pending" }),
      ).toEqual([{ type: "activity", id: "t1", title: "Read file src/app.ts", status: "pending" }])
      // A status-only update keeps the title it announced with.
      expect(mapUpdate({ sessionUpdate: "tool_call_update", toolCallId: "t1", status: "completed" })).toEqual([
        { type: "activity", id: "t1", title: "", status: "completed" },
      ])
      // Studio tools are rendered from the bridge's studio/call path, not the agent's mirror.
      // The harness's mirror of its call of the Studio's one tool is drawn from
      // the call itself; a file of a dither project is not that tool.
      expect(mapUpdate({ sessionUpdate: "tool_call", toolCallId: "t2", title: "mcp__dither-studio__dither" })).toEqual(
        [],
      )
      expect(mapUpdate({ sessionUpdate: "tool_call", toolCallId: "t3", title: "dither" })).toEqual([])
      expect(
        mapUpdate({ sessionUpdate: "tool_call", toolCallId: "t4", title: "Read dither-kit/engine/pixel.ts" }),
      ).toHaveLength(1)
      // A call that arrives untitled is named by a later update, never by its id.
      expect(mapUpdate({ sessionUpdate: "tool_call", toolCallId: "toolu_01", status: "pending" })).toEqual([
        { type: "activity", id: "toolu_01", title: "", status: "pending" },
      ])
      expect(
        mapUpdate({ sessionUpdate: "plan", entries: [{ content: "Add a screen", status: "in_progress" }] }),
      ).toEqual([{ type: "plan", entries: [{ content: "Add a screen", status: "in_progress" }] }])
      expect(mapUpdate({ sessionUpdate: "current_mode_update", currentModeId: "plan" })).toEqual([
        { type: "mode", current: "plan", modes: [] },
      ])
      expect(
        mapUpdate({
          sessionUpdate: "available_commands_update",
          availableCommands: [
            { name: "review", description: "Review the diff", input: { hint: "<path>" } },
            { name: 7 },
          ],
        }),
      ).toEqual([{ type: "commands", commands: [{ name: "review", description: "Review the diff", input: "<path>" }] }])
      expect(mapUpdate({ sessionUpdate: "user_message_chunk" })).toEqual([])
    })

    it("sends pictures only to a harness that said it takes them", () => {
      const png = { mimeType: "image/png", data: "iVBOR" }
      expect(takesImages({ agentCapabilities: { promptCapabilities: { image: true } } })).toBe(true)
      for (const init of [
        { agentCapabilities: { promptCapabilities: { image: "yes" } } },
        { agentCapabilities: {} },
        null,
      ])
        expect(takesImages(init)).toBe(false)
      expect(promptBlocks("look", [png], true)).toEqual([
        { type: "text", text: "look" },
        { type: "image", mimeType: "image/png", data: "iVBOR" },
      ])
      expect(promptBlocks("look", [png], false)).toEqual([{ type: "text", text: "look" }])
    })

    it("reads modes and usage off the agent's answers", () => {
      expect(
        modesOf({
          sessionId: "s",
          modes: {
            currentModeId: "code",
            availableModes: [
              { id: "code", name: "Code" },
              { id: "plan", name: "Plan", description: "read only" },
            ],
          },
        }),
      ).toEqual({
        current: "code",
        modes: [
          { id: "code", name: "Code", description: undefined },
          { id: "plan", name: "Plan", description: "read only" },
        ],
      })
      expect(modesOf({ sessionId: "s" })).toBeNull()
      expect(usageOf({ usage: { inputTokens: 5, outputTokens: 2 } })).toEqual({ input: 5, output: 2 })
      expect(usageOf({})).toBeUndefined()
    })

    it("names the Studio's MCP server as the bridge does", () => {
      // The bridge is its own zero-dependency file: its copy of the name is
      // pinned here, so a harness's `mcp__<server>__<tool>` titles read back.
      expect(readFileSync("../bridge/src/dither-bridge.mjs", "utf8")).toContain(`name: "${STUDIO_SERVER}"`)
    })

    it("reads the model a harness runs off its session's config options, and follows its updates", () => {
      // As Claude Code's ACP adapter sends it: a select of category "model",
      // its default entry naming the model it resolves to.
      const session = {
        sessionId: "s",
        configOptions: [
          { id: "mode", category: "mode", type: "select", currentValue: "default", options: [] },
          {
            id: "model",
            name: "Model",
            category: "model",
            type: "select",
            currentValue: "default",
            options: [
              { value: "default", name: "Default (recommended)", description: "Opus 5.5" },
              { value: "sonnet", name: "Sonnet", description: "Sonnet 5.5 for everyday tasks" },
            ],
          },
        ],
      }
      const m = modelOf(session)
      expect(m).toEqual({
        configId: "model",
        current: "default",
        options: [
          { id: "default", name: "Default (recommended)", description: "Opus 5.5" },
          { id: "sonnet", name: "Sonnet", description: "Sonnet 5.5 for everyday tasks" },
        ],
      })
      expect(modelName(m!)).toBe("Opus 5.5")
      expect(modelName({ ...m!, current: "sonnet" })).toBe("Sonnet")
      // Grouped values flatten; a session with no model option has none.
      const grouped = modelOf({
        configOptions: [
          {
            id: "m",
            category: "model",
            type: "select",
            currentValue: "a",
            options: [{ group: "g", options: [{ value: "a", name: "A" }] }],
          },
        ],
      })
      expect(grouped?.options.map((o) => o.id)).toEqual(["a"])
      expect(modelOf({ sessionId: "s" })).toBeNull()
      expect(mapUpdate({ sessionUpdate: "config_option_update", configOptions: session.configOptions })).toEqual([
        { type: "model", model: m },
        // The other settings come along, none here, so stale ones clear.
        { type: "settings", settings: [] },
      ])
    })
  })

  describe("composer state", () => {
    it("keeps the harness choice and the bridge address, never a secret", () => {
      expect(loadAgentConfig()).toEqual({
        bridgeUrl: "ws://127.0.0.1:8790",
        harness: "",
        command: "",
        auto: false,
        follow: false,
      })
      saveAgentConfig({
        bridgeUrl: "ws://127.0.0.1:9000",
        harness: "custom",
        command: "omp --mode acp",
        auto: true,
        follow: true,
      })
      expect(loadAgentConfig()).toEqual({
        bridgeUrl: "ws://127.0.0.1:9000",
        harness: "custom",
        command: "omp --mode acp",
        auto: true,
        follow: true,
      })
      expect(Object.keys(JSON.parse(localStorage.getItem("dither-agent-config") ?? "{}"))).toEqual([
        "bridgeUrl",
        "harness",
        "command",
        "auto",
        "follow",
      ])
    })

    it("keeps each chat's unsent message with what it carries, and forgets an empty one", () => {
      const quote = { kind: "quote", name: "Quote", text: "Placed it." }
      saveDraft("p1", "c1", { text: "a sign-in screen", attachments: [quote] })
      saveDraft("p1", "c2", { text: "a table", attachments: [] })
      expect(loadDraft("p1", "c1")).toEqual({ text: "a sign-in screen", attachments: [quote] })
      expect(loadDraft("p1", "c2").text).toBe("a table")
      saveDraft("p1", "c1", { text: "  ", attachments: [] })
      expect(loadDraft("p1", "c1")).toEqual({ text: "", attachments: [] })
      expect(localStorage.getItem("dither-agent-draft-p1/c1")).toBeNull()
    })

    it("keeps a draft's pictures only while it stays small, and brings a project's old draft back once", () => {
      const big = { kind: "image", name: "Shot", mimeType: "image/png", data: "A".repeat(2_000_000), w: 1, h: 1 }
      saveDraft("p1", "c1", { text: "this", attachments: [big, { kind: "text", name: "Pasted text", text: "x" }] })
      expect(loadDraft("p1", "c1").attachments.map((a) => (a as { kind: string }).kind)).toEqual(["text"])
      localStorage.setItem("dither-agent-draft-p9", "from before chats")
      expect(loadDraft("p9", "c1").text).toBe("from before chats")
      expect(loadDraft("p9", "c1").text).toBe("")
    })
  })
})

describe("carried from tests/agent-evolve.spec.ts", () => {
  beforeAll(fresh)

  describe("evolve", () => {
    it("is deterministic for a parent and seed, and distinct across seeds", () => {
      const parent = createArtboard("area")
      const a = evolveArtboard(parent, { count: 4, seed: 7 })
      const b = evolveArtboard(parent, { count: 4, seed: 7 })
      const strip = (xs: typeof a) => xs.map(({ id: _id, ...rest }) => rest)
      expect(strip(a)).toEqual(strip(b))
      const c = evolveArtboard(parent, { count: 4, seed: 8 })
      expect(strip(a)).not.toEqual(strip(c))
      expect(a.map((v) => v.id).length).toBe(new Set(a.map((v) => v.id)).size)
      expect(a[0].name).toBe("Area chart v1")
    })

    it("keeps a chart's data and only moves style within the allowlists", () => {
      const parent = createArtboard("bar")
      const gen = evolveArtboard(parent, { count: 6, seed: 3, strength: 1 })
      for (const v of gen) {
        expect(v.chart.rows).toEqual(parent.chart.rows)
        expect(v.chart.type).toBe("bar")
        expect(typeof v.chart.seed).toBe("number")
        expect(["off", "low", "high", "aura"]).toContain(v.chart.bloom)
        expect(v.chart.cell).toBeGreaterThanOrEqual(1)
        expect(v.chart.cell).toBeLessThanOrEqual(4)
      }
      expect(new Set(gen.map((v) => v.chart.seed)).size).toBe(gen.length)
    })

    it("jitters component props inside their registry specs", () => {
      const entry = componentEntry("DitherSlider")!
      const rng = (() => {
        let x = 0.137
        return () => (x = (x * 9301 + 49297) % 233280) / 233280
      })()
      const base = Object.fromEntries(entry.props.map((p) => [p.key, p.def]))
      for (let i = 0; i < 20; i++) {
        const out = mutateProps(entry.props, base, rng, 1)
        for (const spec of entry.props) {
          const v = out[spec.key]
          if (spec.kind === "number") {
            expect(typeof v).toBe("number")
            if (spec.min != null) expect(v as number).toBeGreaterThanOrEqual(spec.min)
            if (spec.max != null) expect(v as number).toBeLessThanOrEqual(spec.max)
          }
          if (spec.kind === "select") expect(spec.options).toContain(v)
          if (spec.kind === "boolean") expect(typeof v).toBe("boolean")
        }
      }
    })

    it("evolves screens cell by cell and normalizes the result", () => {
      const parent = createArtboard("button")
      parent.widget = createScreen()
      parent.widget.rows = [
        createRow([createCell(componentEntry("DitherBadge")!), createCell(componentEntry("DitherSwitch")!)]),
      ]
      const gen = evolveArtboard(parent, { count: 3, seed: 11, strength: 1 })
      for (const v of gen) {
        expect(v.widget?.kind).toBe("screen")
        if (v.widget?.kind === "screen") {
          expect(v.widget.rows[0].cells.map((c) => c.is)).toEqual(["DitherBadge", "DitherSwitch"])
          expect(["start", "center", "end", "stretch"]).toContain(v.widget.rows[0].align)
        }
      }
    })

    it("places a generation as one row, clear of its parent, and selects it", () => {
      editor.artboards = []
      editor.viewport = { x: 0, y: 0, zoom: 1 }
      const parent = addComponentArtboard(componentEntry("DitherSwitch")!)
      const gen = placeGeneration(evolveArtboard(parent, { count: 3, seed: 1 }), 40)
      expect(editor.artboards.length).toBe(4)
      expect(editor.selectedIds).toEqual(gen.map((g) => g.id))
      // A row, 40px apart, on one line...
      expect(gen[1].x).toBe(gen[0].x + gen[0].w + 40)
      expect(gen[1].y).toBe(gen[0].y)
      // ...that stands off the parent placed at the centre, not on it.
      const row = { x: gen[0].x, y: gen[0].y, w: gen[2].x + gen[2].w - gen[0].x, h: gen[0].h }
      const apart =
        row.x + row.w <= parent.x ||
        parent.x + parent.w <= row.x ||
        row.y + row.h <= parent.y ||
        parent.y + parent.h <= row.y
      expect(apart).toBe(true)
    })
  })
})
