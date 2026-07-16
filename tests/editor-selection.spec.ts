import { beforeEach, describe, expect, it } from "vitest"
import { createArtboard } from "../src/entities/artboard/model/factory"
import { editor, moveSelected, selectMany } from "../src/entities/editor/model/store"

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
    expect(editor.artboards.map(({ x, y }) => [x, y])).toEqual([[15, 18], [30, 40]])
  })
})
