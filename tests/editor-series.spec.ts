import { beforeEach, describe, expect, it } from "rstack/test"
import { createArtboard } from "../src/entities/artboard/model/factory"
import { deleteSeries, editor, selectArtboard } from "../src/entities/editor/model/store"

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
