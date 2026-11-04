// @rstest-environment jsdom
// The ask at the selection stands under its frame, or above the frame's
// label when the canvas's foot (where the zoom and selection bars stand)
// leaves no room under it: never under those bars.
import { mount } from "@vue/test-utils"
import { describe, expect, it } from "rstack/test"
import { createArtboard } from "@/entities/artboard/model/factory"
import { editor } from "@/entities/editor"
import SelectionAsk from "@/widgets/canvas/SelectionAsk.vue"

function placed(y: number) {
  const a = createArtboard("button")
  a.x = 100
  a.y = y
  a.w = 300
  a.h = 200
  editor.artboards = [a]
  editor.selectedIds = [a.id]
  editor.viewport = { x: 0, y: 0, zoom: 1 }
  editor.stage = { w: 900, h: 700 }
  const w = mount(SelectionAsk, { props: { held: false } })
  const top = parseFloat((w.get(".ask").element as HTMLElement).style.top)
  w.unmount()
  return { top, frameTop: a.y, frameBottom: a.y + a.h }
}

describe("the ask at the selection", () => {
  it("stands under a frame with room under it", () => {
    const p = placed(100)
    expect(p.top).toBeGreaterThan(p.frameBottom)
  })

  it("moves above the frame when only the bars' foot is left under it", () => {
    // 700 tall: under the frame it would end at 610 + 10 + 36 = 656, inside the
    // 60px foot the bars stand in.
    const p = placed(410)
    expect(p.top).toBeLessThan(p.frameTop)
  })
})
