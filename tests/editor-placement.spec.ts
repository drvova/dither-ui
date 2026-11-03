import { beforeEach, describe, expect, it } from "rstack/test"
import { createArtboard } from "../src/entities/artboard/model/factory"
import { centreOn, editor, placeArtboard } from "../src/entities/editor/model/store"

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

  it("keeps consecutive frames at the exact visual center", () => {
    const first = placeArtboard(createArtboard("button"))
    const second = placeArtboard(createArtboard("button"))
    expect(second.x).toBe(first.x)
    expect(second.y).toBe(first.y)
    expect(editor.selectedArtboardId).toBe(second.id)
  })
})
