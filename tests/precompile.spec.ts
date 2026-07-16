import { describe, expect, it } from "vitest"
import { renderDitherButton, renderDitherGradient } from "../dither-kit/precompile"

describe("server-safe raster compiler", () => {
  it("returns a bounded deterministic gradient raster", () => {
    const first = renderDitherGradient({ width: 960, height: 600, cell: 2, seed: 42 })
    const second = renderDitherGradient({ width: 960, height: 600, cell: 2, seed: 42 })
    expect(first.width).toBe(480)
    expect(first.height).toBe(300)
    expect(first.data).toEqual(second.data)
    expect(first.data.length).toBe(first.width * first.height * 4)
  })

  it("compiles button variants without browser globals", () => {
    const raster = renderDitherButton({ width: 160, height: 40, cell: 2, variant: "hatched" })
    expect(raster.width).toBe(80)
    expect(raster.height).toBe(20)
    expect([...raster.data].some((value) => value > 0)).toBe(true)
  })

  it("rejects non-finite raster dimensions and cell sizes", () => {
    expect(() => renderDitherGradient({ width: Number.NaN, height: 40 })).toThrow(RangeError)
    expect(() => renderDitherButton({ width: 160, height: 40, cell: Number.POSITIVE_INFINITY })).toThrow(RangeError)
  })
})
