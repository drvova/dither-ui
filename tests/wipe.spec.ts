import { describe, expect, it } from "rstack/test"
import { BAYER8, bayerMatrix, wipeStyle } from "../dither-kit/engine/wipe"

const svgOf = (image: string) => decodeURIComponent(image.slice(image.indexOf(",") + 1, -2))
const rects = (image: string) => (svgOf(image).match(/<rect /g) ?? []).length

describe("bayer matrices", () => {
  it("build recursively with thresholds centred in their steps", () => {
    expect(bayerMatrix(1)).toEqual([[0.5]])
    expect(bayerMatrix(2)).toEqual([
      [0.125, 0.625],
      [0.875, 0.375],
    ])
    const flat = BAYER8.flat()
    expect(flat).toHaveLength(64)
    expect(new Set(flat).size).toBe(64)
    expect(Math.min(...flat)).toBeCloseTo(0.5 / 64)
    expect(Math.max(...flat)).toBeCloseTo(63.5 / 64)
  })
})

describe("wipeStyle", () => {
  it("hides at 0, shows at 1 and resolves one cell per step between", () => {
    const hidden = wipeStyle(0, { cell: 4 })!
    expect(hidden.image).toContain("data:image/svg+xml")
    expect(rects(hidden.image)).toBe(0)
    expect(wipeStyle(1)).toBeNull()
    expect(wipeStyle(Number.NaN)).toBeNull()
    for (let k = 1; k < 64; k++) {
      const s = wipeStyle(k / 64 + 1e-6, { cell: 4 })!
      expect(s.size).toBe("32px 32px")
      expect(s.repeat).toBe("repeat")
      expect(rects(s.image)).toBe(k)
    }
    // Cells come in by threshold: the first cell shown is the lowest one.
    expect(svgOf(wipeStyle(1 / 64 + 1e-6, { cell: 4 })!.image)).toContain('<rect x="0" y="0" width="4" height="4"/>')
  })

  it("is a pure function of its inputs", () => {
    expect(wipeStyle(0.37, { cell: 3, seed: 7 })).toEqual(wipeStyle(0.37, { cell: 3, seed: 7 }))
    expect(wipeStyle(0.37, { cell: 3, seed: 7 })!.image).not.toBe(wipeStyle(0.37, { cell: 3 })!.image)
    expect(wipeStyle(0.37, { cell: 3, seed: 7 })!.size).toBe("12px 12px")
  })

  it("moves a dithered front across a box for a direction", () => {
    const box = { width: 200, height: 100, cell: 4, band: 5 }
    expect(svgOf(wipeStyle(0, { ...box, direction: "right" })!.image)).not.toContain("<pattern")
    const half = wipeStyle(0.5, { ...box, direction: "right" })!
    expect(half.size).toBe("200px 100px")
    expect(half.repeat).toBe("no-repeat")
    const svg = svgOf(half.image)
    expect(svg).toContain('width="200" height="100"')
    expect(svg).toContain('<rect x="0" y="0" width="92" height="100" fill="#000"/>')
    expect(svg.match(/<pattern /g)).toHaveLength(4)
    expect(svg).toContain('<rect x="92" y="0" width="5" height="100" fill="url(#p0)"/>')
    expect(wipeStyle(1, { ...box, direction: "right" })).toBeNull()
    // Shown at 1 even when the box is not a multiple of the cell.
    expect(wipeStyle(1, { width: 203, height: 101, cell: 6, direction: "down" })).toBeNull()
    expect(wipeStyle(0.98, { width: 203, height: 101, cell: 6, direction: "down" })).not.toBeNull()
    // The opposite direction reveals from the other edge.
    expect(svgOf(wipeStyle(0.5, { ...box, direction: "left" })!.image)).toContain(
      '<rect x="108" y="0" width="92" height="100" fill="#000"/>',
    )
    // Vertical wipes sweep rows.
    expect(svgOf(wipeStyle(0.5, { ...box, direction: "down" })!.image)).toContain(
      '<rect x="0" y="0" width="200" height="40" fill="#000"/>',
    )
    // Early on, only the band is inside the box.
    expect(svgOf(wipeStyle(0.05, { ...box, direction: "right" })!.image)).not.toContain('fill="#000"')
    // Without a box size a directional wipe is a dissolve.
    expect(wipeStyle(0.5, { direction: "down", cell: 4 })!.repeat).toBe("repeat")
  })

  it("inverts: the outgoing side, never sharing a cell with the incoming one", () => {
    expect(wipeStyle(0, { cell: 4, invert: true })).toBeNull()
    expect(rects(wipeStyle(1, { cell: 4, invert: true })!.image)).toBe(0)
    for (const k of [1, 17, 40, 63]) {
      const p = k / 64 + 1e-6
      const shown = svgOf(wipeStyle(p, { cell: 4 })!.image).match(/<rect [^>]+>/g) ?? []
      const hidden = svgOf(wipeStyle(p, { cell: 4, invert: true })!.image).match(/<rect [^>]+>/g) ?? []
      expect(hidden).toHaveLength(64 - k)
      expect(new Set([...shown, ...hidden]).size).toBe(64)
    }
    const box = { width: 200, height: 100, cell: 4, band: 5, direction: "right" as const }
    expect(wipeStyle(0, { ...box, invert: true })).toBeNull()
    expect(rects(wipeStyle(1, { ...box, invert: true })!.image)).toBe(0)
    // Solid beyond the band, the band's patterns the complement of the incoming ones.
    const svg = svgOf(wipeStyle(0.5, { ...box, invert: true })!.image)
    expect(svg).toContain('<rect x="112" y="0" width="88" height="100" fill="#000"/>')
    expect(svg).toContain('<rect x="92" y="0" width="5" height="100" fill="url(#p0)"/>')
    const p0 = (image: string) => image.match(/<pattern id="p0"[^>]*>(.*?)<\/pattern>/)![1].match(/<rect /g)!.length
    expect(p0(svg) + p0(svgOf(wipeStyle(0.5, box)!.image))).toBe(64)
  })

  it("grows an iris from its origin to the farthest corner", () => {
    const iris = { width: 200, height: 100, cell: 4, band: 5, direction: "iris" as const, origin: { x: 50, y: 50 } }
    const svg = svgOf(wipeStyle(0.5, iris)!.image)
    expect(svg).toContain('<circle cx="50" cy="50" r="68" fill="#000"/>')
    expect(svg).toContain('<circle cx="50" cy="50" r="70.5" fill="none" stroke="url(#p0)" stroke-width="5"/>')
    expect(svgOf(wipeStyle(0.5, { ...iris, invert: true })!.image)).toContain(
      '<path fill-rule="evenodd" fill="#000" d="M0 0H200V100H0Z M-38 50a88 88 0 1 0 176 0a88 88 0 1 0 -176 0Z"/>',
    )
    // Centred by default; shown at 1, nothing at 0.
    expect(svgOf(wipeStyle(0.5, { ...iris, origin: undefined })!.image)).toContain('cx="100" cy="50"')
    expect(wipeStyle(1, iris)).toBeNull()
    expect(rects(wipeStyle(0, iris)!.image)).toBe(0)
    expect(wipeStyle(0.9, iris)).not.toBeNull()
  })
})
