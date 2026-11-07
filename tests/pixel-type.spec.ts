import { describe, expect, it } from "rstack/test"
import { layoutPixelText, PIXEL_CHARS, PIXEL_DESCENT, PIXEL_ROWS } from "../src/pages/landing/pixel-type"

describe("pixel type", () => {
  it("draws every glyph on seven rows of one width, a descender at most two under", () => {
    for (const ch of PIXEL_CHARS) {
      const { cells, width } = layoutPixelText(ch)
      expect(cells.every((c) => c.y >= 0 && c.y < PIXEL_ROWS + PIXEL_DESCENT && c.x >= 0 && c.x < width)).toBe(true)
      if (ch !== " ") expect(cells.length).toBeGreaterThan(0)
    }
  })

  it("hangs the g's tail under the baseline, its bowl on the x-height", () => {
    // without one it read as a 9: "bri9ge"
    const g = layoutPixelText("g").cells
    const o = layoutPixelText("o").cells
    expect(Math.max(...g.map((c) => c.y))).toBe(PIXEL_ROWS + PIXEL_DESCENT - 1)
    expect(Math.min(...g.map((c) => c.y))).toBe(Math.min(...o.map((c) => c.y)))
    for (const ch of PIXEL_CHARS.replace("g", ""))
      expect(
        layoutPixelText(ch).cells.every((c) => c.y < PIXEL_ROWS),
        ch,
      ).toBe(true)
  })

  it("tracks glyphs one empty column apart", () => {
    const one = layoutPixelText("1").width
    expect(layoutPixelText("11").width).toBe(one * 2 + 1)
  })

  it("covers every string the landing sets", () => {
    for (const s of [
      "DITHER-UI",
      "264",
      "6",
      "46",
      "4×4",
      "512",
      "513",
      "0:00",
      "9:59",
      "1k+/.",
      "kit",
      "studio",
      "bridge",
    ]) {
      expect(() => layoutPixelText(s)).not.toThrow()
    }
    expect(() => layoutPixelText("q")).toThrow(/no glyph/)
  })

  it("tags each cell with its character so the first ones can take the accent", () => {
    const { cells } = layoutPixelText("DI")
    expect(new Set(cells.map((c) => c.char))).toEqual(new Set([0, 1]))
  })
})
