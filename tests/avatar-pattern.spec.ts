import { describe, expect, it } from "rstack/test"
import { clampGrid, normalizePattern, patternFromPixels, seededPattern } from "../dither-kit/avatar-pattern"

describe("seededPattern", () => {
  it("is deterministic per name", () => {
    const a = seededPattern("Ada Lovelace", 8, "auto")
    const b = seededPattern("Ada Lovelace", 8, "auto")
    expect(a.on).toEqual(b.on)
    expect(a.density).toEqual(b.density)
    expect(a.drawnHue).toBe(b.drawnHue)
  })
  it("different names diverge", () => {
    const a = seededPattern("Ada", 8, "auto")
    const b = seededPattern("Grace", 8, "auto")
    expect(a.on).not.toEqual(b.on)
  })
  it("horizontal mirror folds left/right", () => {
    const p = seededPattern("Ada", 8, "horizontal")
    for (let r = 0; r < 8; r++) for (let c = 0; c < 4; c++) expect(p.on[r * 8 + c]).toBe(p.on[r * 8 + (7 - c)])
  })
  it("vertical mirror folds top/bottom", () => {
    const p = seededPattern("Ada", 8, "vertical")
    for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) expect(p.on[r * 8 + c]).toBe(p.on[(7 - r) * 8 + c])
  })
})

describe("clampGrid / normalizePattern", () => {
  it("clamps to even 4–16", () => {
    expect(clampGrid(3)).toBe(4)
    expect(clampGrid(9)).toBe(10)
    expect(clampGrid(99)).toBe(16)
  })
  it("pads short patterns and accepts 0/1 cells", () => {
    const { on, density } = normalizePattern({ on: [1, 0, 1] }, 4)
    expect(on).toHaveLength(16)
    expect(on.slice(0, 3)).toEqual([true, false, true])
    expect(on[10]).toBe(false)
    expect(density[0]).toBeCloseTo(0.85)
  })
})

describe("patternFromPixels", () => {
  const px = (r: number, g: number, b: number, a = 255) => [r, g, b, a]
  it("dark pixels light up at the default threshold", () => {
    const rgba = [...px(0, 0, 0), ...px(255, 255, 255), ...px(30, 30, 30), ...px(240, 240, 240)]
    const { on } = patternFromPixels(rgba, 2, 0.5)
    expect(on).toEqual([true, false, true, false])
  })
  it("invert flips the mapping", () => {
    const rgba = [...px(0, 0, 0), ...px(255, 255, 255), ...px(0, 0, 0), ...px(255, 255, 255)]
    const { on } = patternFromPixels(rgba, 2, 0.5, true)
    expect(on).toEqual([false, true, false, true])
  })
  it("transparent pixels stay off; darker cells are denser", () => {
    const rgba = [...px(0, 0, 0, 0), ...px(0, 0, 0), ...px(128, 128, 128), ...px(255, 255, 255)]
    const { on, density } = patternFromPixels(rgba, 2, 0.5)
    expect(on[0]).toBe(false)
    expect(density[1]).toBeGreaterThan(density[2])
    expect(density[2]).toBeGreaterThan(density[3])
  })
})
