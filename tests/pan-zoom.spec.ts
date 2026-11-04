// @rstest-environment jsdom
// The canvas view: its gestures and its view functions steer the editor's
// viewport, whichever object it is (loading a document, switching a project
// or centring a fresh frame replaces it); the bar, the keys and the agent
// zoom and fit through the same functions; Inspect reads at 100% and holds.
import { ref } from "vue"
import { beforeEach, describe, expect, it } from "rstack/test"
import {
  actualSize,
  centreOn,
  editor,
  fitAll,
  fitSelection,
  selectArtboard,
  startInspecting,
  stopInspecting,
  zoomIn,
  zoomOut,
} from "@/entities/editor"
import { createArtboard } from "@/entities/artboard/model/factory"
import { usePanZoom } from "@/features/pan-zoom"

beforeEach(() => {
  stopInspecting()
  editor.stage = { w: 800, h: 600 }
  editor.viewport = { x: 0, y: 0, zoom: 1 }
})

describe("pan and zoom", () => {
  it("still steer the viewport after the editor replaces it", () => {
    const host = ref(document.createElement("div"))
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
