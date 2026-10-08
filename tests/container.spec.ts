import { describe, expect, it } from "vitest"
import { CONTAINER_SCALE, quantize, resolveCq, type CqScale } from "../dither-kit/containers"

describe("resolveCq", () => {
  it("ships a component-sized default scale", () => {
    expect(CONTAINER_SCALE).toEqual({ xs: 0, sm: 240, md: 360, lg: 520, xl: 720 })
  })

  it("puts boundaries on the wider bucket (min inclusive, max exclusive)", () => {
    const at = (w: number) => resolveCq(w).size
    expect(at(0)).toBe("xs")
    expect(at(239)).toBe("xs")
    expect(at(240)).toBe("sm") // sm's min — inclusive
    expect(at(359)).toBe("sm")
    expect(at(360)).toBe("md") // never sm: the open max is exclusive
    expect(at(519)).toBe("md")
    expect(at(520)).toBe("lg")
    expect(at(720)).toBe("xl")
    expect(at(4096)).toBe("xl")
    expect(resolveCq(360).index).toBe(2)
    expect(resolveCq(360).matches).toEqual(["xs", "sm", "md"]) // stacked mins all match
  })

  it("returns an empty resolution for unmatched or non-finite widths", () => {
    expect(resolveCq(-1)).toEqual({ size: null, index: -1, matches: [] })
    expect(resolveCq(NaN)).toEqual({ size: null, index: -1, matches: [] })
    expect(resolveCq(Infinity)).toEqual({ size: null, index: -1, matches: [] })
    expect(resolveCq(0, {})).toEqual({ size: null, index: -1, matches: [] })
  })

  it("resolves by min regardless of declaration order", () => {
    const scale: CqScale = { zeta: { min: 500 }, alpha: { min: 100 } }
    expect(resolveCq(600, scale)).toEqual({ size: "zeta", index: 1, matches: ["alpha", "zeta"] })
    expect(resolveCq(150, scale)).toEqual({ size: "alpha", index: 0, matches: ["alpha"] })
  })

  it("hands a boundary to the bucket that opens there (explicit ranges)", () => {
    const split: CqScale = { small: { max: 100 }, large: { min: 100 } }
    expect(resolveCq(99, split).size).toBe("small")
    expect(resolveCq(100, split).size).toBe("large")
    const capped: CqScale = { only: { min: 0, max: 50 } }
    expect(resolveCq(50, capped)).toEqual({ size: null, index: -1, matches: [] }) // past every max
  })

  it("active = highest matching min; matches lists every overlapping bucket", () => {
    const overlap: CqScale = { base: 0, wide: { min: 400, max: 600 } }
    expect(resolveCq(500, overlap)).toEqual({ size: "wide", index: 1, matches: ["base", "wide"] })
    expect(resolveCq(700, overlap)).toEqual({ size: "base", index: 0, matches: ["base"] }) // wide ended
    expect(resolveCq(300, overlap)).toEqual({ size: "base", index: 0, matches: ["base"] })
  })
})

describe("quantize", () => {
  it("rounds to the nearest step", () => {
    expect(quantize(404, 8)).toBe(408) // 50.5 rounds up
    expect(quantize(402, 8)).toBe(400)
    expect(quantize(7, 3)).toBe(6)
    expect(quantize(5, 3)).toBe(6)
    expect(quantize(0, 8)).toBe(0)
  })

  it("is identity for step <= 0 and never goes negative", () => {
    expect(quantize(404, 0)).toBe(404)
    expect(quantize(404, -2)).toBe(404)
    expect(quantize(-5, 8)).toBe(0)
  })

  it("passes non-finite values through untouched", () => {
    expect(quantize(NaN, 8)).toBeNaN()
    expect(quantize(Infinity, 8)).toBe(Infinity)
  })
})
