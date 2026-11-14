import { describe, expect, it } from "rstack/test"
import { createArtboard } from "../src/entities/artboard/model/factory"
import { normalizeArtboard } from "../src/entities/artboard/model/normalize"
import { DOCUMENT_KEYS, type DocumentState, parseDocument } from "../src/entities/editor/model/document"
import type { Artboard } from "../src/entities/artboard/model/types"

/** Simulate an older document: serialize, then delete newer fields. */
const strip = (a: Artboard, mutate: (json: Record<string, never>) => void): Artboard => {
  const json = JSON.parse(JSON.stringify(a))
  mutate(json)
  return json as Artboard
}

describe("normalizeArtboard", () => {
  it("fills the avatar fields behind the reported crash (imageThreshold)", () => {
    const old = strip(createArtboard("avatar"), (j: any) => {
      delete j.widget.imageThreshold
      delete j.widget.imageInvert
      delete j.widget.source
      delete j.widget.pattern
    })
    const a = normalizeArtboard(old)
    if (a.widget?.kind !== "avatar") throw new Error("unreachable")
    expect(a.widget.imageThreshold).toBe(0.5)
    expect(a.widget.imageInvert).toBe(false)
    expect(a.widget.source).toBe("seed")
  })

  it("fills chart fields added after a document was saved", () => {
    const old = strip(createArtboard("area"), (j: any) => {
      delete j.chart.hoverStrength
      delete j.chart.dimOpacity
      delete j.chart.crosshair
      delete j.chart.cell
    })
    const a = normalizeArtboard(old)
    expect(a.chart.hoverStrength).toBe(1)
    expect(a.chart.dimOpacity).toBe(0.3)
    expect(a.chart.crosshair).toBe(true)
    expect(a.chart.cell).toBe(2)
  })

  it("fills per-series fields (markers, opacity) without touching data", () => {
    const src = createArtboard("area")
    src.chart.rows[0].desktop = 999
    const old = strip(src, (j: any) => {
      for (const s of j.chart.series) {
        delete s.dots
        delete s.activeDot
        delete s.opacity
      }
    })
    const a = normalizeArtboard(old)
    expect(a.chart.series[0].dots).toEqual({ on: false, variant: "border", r: 2 })
    expect(a.chart.series[0].opacity).toBe(1)
    expect(a.chart.rows[0].desktop).toBe(999) // data preserved
  })

  it("never overwrites existing values", () => {
    const src = createArtboard("avatar")
    if (src.widget?.kind !== "avatar") throw new Error("unreachable")
    src.widget.imageThreshold = 0.8
    src.widget.grid = 12
    const a = normalizeArtboard(JSON.parse(JSON.stringify(src)))
    if (a.widget?.kind !== "avatar") throw new Error("unreachable")
    expect(a.widget.imageThreshold).toBe(0.8)
    expect(a.widget.grid).toBe(12)
  })

  it("repairs a missing chart and frame flags", () => {
    const old = strip(createArtboard("area"), (j: any) => {
      delete j.chart
      delete j.hidden
      delete j.locked
    })
    const a = normalizeArtboard(old)
    expect(a.chart.type).toBe("area")
    expect(a.hidden).toBe(false)
    expect(a.locked).toBe(false)
  })
})

describe("parseDocument", () => {
  /** A document as an older or careless writer leaves it: frames to repair,
   * junk groups and an out-of-range view. */
  const untrusted = () => {
    const old = strip(createArtboard("avatar"), (j: any) => {
      delete j.widget.imageThreshold
      delete j.hidden
    })
    return {
      artboards: [old, { id: 7, name: null, x: "a", y: 0, w: Infinity, h: 10, chart: { type: "bar" } }, "junk"],
      groups: [{ id: "g", name: "G" }, { id: 1 }],
      viewport: { x: 1, y: 2, zoom: 99 },
    }
  }

  it("never writes to the document it reads", () => {
    const input = untrusted()
    const before = structuredClone(input)
    const doc = parseDocument(input)
    expect(doc?.artboards).toHaveLength(2)
    expect(input).toEqual(before)
    // and what it hands back shares nothing with the input
    doc!.artboards[0].name = "Elsewhere"
    expect(input.artboards[0]).toEqual(before.artboards[0])
  })

  it("reads the envelope once: frames repaired, groups shape-checked, the view held to the canvas's zoom", () => {
    const doc = parseDocument(untrusted())!
    const [kept, repaired] = doc.artboards
    if (kept.widget?.kind !== "avatar") throw new Error("unreachable")
    expect([kept.widget.imageThreshold, kept.hidden]).toEqual([0.5, false])
    expect(repaired.id).toMatch(/^ab-imported-/)
    expect([repaired.name, repaired.x, repaired.w, repaired.h]).toEqual(["Artboard", 0, 520, 10])
    expect(doc.groups).toEqual([{ id: "g", name: "G", collapsed: false }])
    expect(doc.viewport).toEqual({ x: 1, y: 2, zoom: 3 })
  })

  it("refuses what carries no frame, and leaves out a view it cannot read", () => {
    for (const junk of [null, "nope", 7, [], {}, { artboards: [] }, { artboards: ["junk"] }, { artboards: "x" }])
      expect(parseDocument(junk)).toBeNull()
    const cyclic: Record<string, unknown> = { artboards: [createArtboard("area")] }
    cyclic.self = cyclic
    expect(parseDocument(cyclic)).toBeNull()
    const doc = parseDocument({ artboards: [createArtboard("area")], viewport: { x: 0, y: "1", zoom: 1 } })!
    expect("viewport" in doc).toBe(false)
  })

  it("produces every key of the edited state", () => {
    const doc = parseDocument({ artboards: [createArtboard("area")] })!
    const state: DocumentState = doc
    expect(DOCUMENT_KEYS.every((k) => Array.isArray(state[k]))).toBe(true)
  })
})
