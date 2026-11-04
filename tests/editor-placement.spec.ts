import { beforeEach, describe, expect, it } from "rstack/test"
import { createArtboard } from "../src/entities/artboard/model/factory"
import { FRAME_GAP } from "../src/entities/editor/model/free"
import {
  centreOn,
  duplicateSelected,
  editor,
  pasteClipboard,
  copySelected,
  placeArtboard,
  selectArtboard,
} from "../src/entities/editor/model/store"

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
