// @rstest-environment jsdom
// The canvas's pan and zoom steer the editor's viewport, whichever object
// it is: loading a document, switching a project or centring a fresh frame
// replaces it, and the canvas keeps answering.
import { ref } from "vue"
import { describe, expect, it } from "rstack/test"
import { centreOn, editor } from "@/entities/editor"
import { createArtboard } from "@/entities/artboard/model/factory"
import { usePanZoom } from "@/features/pan-zoom"

describe("pan and zoom", () => {
  it("still steer the viewport after the editor replaces it", () => {
    const host = ref(document.createElement("div"))
    const { zoomIn, onWheel } = usePanZoom(host)
    // A fresh document's frame centred once the canvas measured itself: a
    // new viewport object.
    editor.viewport = { x: 0, y: 0, zoom: 1 }
    editor.stage = { w: 800, h: 600 }
    centreOn(createArtboard("button"))
    zoomIn()
    expect(editor.viewport.zoom).toBeCloseTo(1.2)
    const y = editor.viewport.y
    onWheel(new WheelEvent("wheel", { deltaY: 50 }))
    expect(editor.viewport.y).toBe(y - 50)
  })
})
