import { describe, expect, it } from "vitest"
import { createArtboard } from "@/entities/artboard"
import { addComponentArtboard, editor, placeGeneration } from "@/entities/editor"
import { componentEntry, createCell, createRow, createScreen } from "@/entities/widget"
import { evolveArtboard, mutateProps } from "@/features/agent/evolve"

describe("evolve", () => {
  it("is deterministic for a parent and seed, and distinct across seeds", () => {
    const parent = createArtboard("area")
    const a = evolveArtboard(parent, { count: 4, seed: 7 })
    const b = evolveArtboard(parent, { count: 4, seed: 7 })
    const strip = (xs: typeof a) => xs.map(({ id: _id, ...rest }) => rest)
    expect(strip(a)).toEqual(strip(b))
    const c = evolveArtboard(parent, { count: 4, seed: 8 })
    expect(strip(a)).not.toEqual(strip(c))
    expect(a.map((v) => v.id).length).toBe(new Set(a.map((v) => v.id)).size)
    expect(a[0].name).toBe("Area chart · v1")
  })

  it("keeps a chart's data and only moves style within the allowlists", () => {
    const parent = createArtboard("bar")
    const gen = evolveArtboard(parent, { count: 6, seed: 3, strength: 1 })
    for (const v of gen) {
      expect(v.chart.rows).toEqual(parent.chart.rows)
      expect(v.chart.type).toBe("bar")
      expect(typeof v.chart.seed).toBe("number")
      expect(["off", "low", "high", "aura"]).toContain(v.chart.bloom)
      expect(v.chart.cell).toBeGreaterThanOrEqual(1)
      expect(v.chart.cell).toBeLessThanOrEqual(4)
    }
    expect(new Set(gen.map((v) => v.chart.seed)).size).toBe(gen.length)
  })

  it("jitters component props inside their registry specs", () => {
    const entry = componentEntry("DitherSlider")!
    const rng = (() => {
      let x = 0.137
      return () => (x = (x * 9301 + 49297) % 233280) / 233280
    })()
    const base = Object.fromEntries(entry.props.map((p) => [p.key, p.def]))
    for (let i = 0; i < 20; i++) {
      const out = mutateProps(entry.props, base, rng, 1)
      for (const spec of entry.props) {
        const v = out[spec.key]
        if (spec.kind === "number") {
          expect(typeof v).toBe("number")
          if (spec.min != null) expect(v as number).toBeGreaterThanOrEqual(spec.min)
          if (spec.max != null) expect(v as number).toBeLessThanOrEqual(spec.max)
        }
        if (spec.kind === "select") expect(spec.options).toContain(v)
        if (spec.kind === "boolean") expect(typeof v).toBe("boolean")
      }
    }
  })

  it("evolves screens cell by cell and normalizes the result", () => {
    const parent = createArtboard("button")
    parent.widget = createScreen()
    parent.widget.rows = [createRow([createCell(componentEntry("DitherBadge")!), createCell(componentEntry("DitherSwitch")!)])]
    const gen = evolveArtboard(parent, { count: 3, seed: 11, strength: 1 })
    for (const v of gen) {
      expect(v.widget?.kind).toBe("screen")
      if (v.widget?.kind === "screen") {
        expect(v.widget.rows[0].cells.map((c) => c.is)).toEqual(["DitherBadge", "DitherSwitch"])
        expect(["start", "center", "end", "stretch"]).toContain(v.widget.rows[0].align)
      }
    }
  })

  it("places a generation as one centred row and selects it", () => {
    editor.artboards = []
    editor.viewport = { x: 0, y: 0, zoom: 1 }
    const parent = addComponentArtboard(componentEntry("DitherSwitch")!)
    const gen = placeGeneration(evolveArtboard(parent, { count: 3, seed: 1 }), 40)
    expect(editor.artboards.length).toBe(4)
    expect(editor.selectedIds).toEqual(gen.map((g) => g.id))
    const total = gen.reduce((n, g) => n + g.w, 0) + 80
    expect(gen[0].x).toBe(Math.round(1280 / 2 - total / 2))
    expect(gen[1].x).toBe(gen[0].x + gen[0].w + 40)
    expect(gen[0].y).toBe(Math.round(720 / 2 - gen[0].h / 2))
  })
})
