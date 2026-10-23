import { describe, expect, it } from "rstack/test"
import { layoutPixelText, PIXEL_CHARS, PIXEL_ROWS } from "../src/pages/landing/pixel-type"

describe("pixel type", () => {
  it("draws every glyph on seven rows of one width", () => {
    for (const ch of PIXEL_CHARS) {
      const { cells, width } = layoutPixelText(ch)
      expect(cells.every((c) => c.y >= 0 && c.y < PIXEL_ROWS && c.x >= 0 && c.x < width)).toBe(true)
      if (ch !== " ") expect(cells.length).toBeGreaterThan(0)
    }
  })

  it("tracks glyphs one empty column apart", () => {
    const one = layoutPixelText("1").width
    expect(layoutPixelText("11").width).toBe(one * 2 + 1)
  })

  it("covers every string the landing sets", () => {
    for (const s of ["DITHER-UI", "264", "6", "46", "4×4", "512", "513", "0:00", "9:59", "1k+/."]) {
      expect(() => layoutPixelText(s)).not.toThrow()
    }
    expect(() => layoutPixelText("q")).toThrow(/no glyph/)
  })

  it("tags each cell with its character so the first ones can take the accent", () => {
    const { cells } = layoutPixelText("DI")
    expect(new Set(cells.map((c) => c.char))).toEqual(new Set([0, 1]))
  })
})
