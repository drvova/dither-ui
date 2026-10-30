// @rstest-environment jsdom
// The Studio canvas under fingers (an iPad): one finger on empty canvas
// pans, two fingers pinch about their midpoint, and the second finger ends
// the first finger's drag the platform's way (a pointercancel), so an
// artboard under it stops moving while the pinch runs.
import { mount } from "@vue/test-utils"
import { beforeEach, describe, expect, it } from "rstack/test"
import { createArtboard } from "../src/entities/artboard/model/factory"
import { editor } from "../src/entities/editor/model/store"
import Canvas from "../src/widgets/canvas/Canvas.vue"

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

beforeEach(() => {
  editor.artboards = [createArtboard("button", 300, 300)]
  editor.selectedIds = []
  Object.assign(editor.viewport, { x: 0, y: 0, zoom: 1 })
})

describe("studio canvas touch", () => {
  it("pans under one finger on empty canvas", () => {
    const w = mount(Canvas, { attachTo: document.body })
    const host = w.get(".dk-canvas").element
    host.dispatchEvent(touch("pointerdown", 1, 20, 20))
    window.dispatchEvent(touch("pointermove", 1, 60, 50))
    window.dispatchEvent(touch("pointerup", 1, 60, 50))
    expect([editor.viewport.x, editor.viewport.y]).toEqual([40, 30])
    w.unmount()
  })

  it("pinches about the fingers' midpoint and ends the first finger's drag", () => {
    const w = mount(Canvas, { attachTo: document.body })
    const host = w.get(".dk-canvas").element
    const surface = w.get("[data-artboard-surface]").element
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
    w.unmount()
  })
})
