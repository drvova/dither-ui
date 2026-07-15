import { beforeEach, describe, expect, it } from "vitest"
import { createArtboard } from "../src/entities/artboard/model/factory"
import { editor, placeArtboard } from "../src/entities/editor/model/store"

beforeEach(() => {
  editor.artboards = []
  editor.viewport = { x: 100, y: 60, zoom: 2 }
})

describe("artboard placement", () => {
  it("centers new frames in the current viewport", () => {
    const a = createArtboard("button")
    placeArtboard(a)
    expect(a.x).toBe(Math.round((1280 / 2 - 100) / 2 - a.w / 2))
    expect(a.y).toBe(Math.round((720 / 2 - 60) / 2 - a.h / 2))
    expect(editor.selectedArtboardId).toBe(a.id)
  })

  it("offsets consecutive frames so they remain separately draggable", () => {
    const first = placeArtboard(createArtboard("button"))
    const second = placeArtboard(createArtboard("button"))
    expect(second.x - first.x).toBe(24)
    expect(second.y - first.y).toBe(24)
  })
})
