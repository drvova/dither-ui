import { describe, expect, it } from "rstack/test"
import {
  colorToHex,
  cssColor,
  hexToHsv,
  hexToRgb,
  hsvToHex,
  hsvToRgb,
  contrast,
  luminance,
  toGamma,
  toLinear,
  PALETTE,
  rgbToHex,
  rgbToHsv,
  seedFromColor,
  seedFromHex,
  seedFromHue,
} from "../src/engine/palette"

describe("hex <-> rgb", () => {
  it("parses 6-digit hex", () => {
    expect(hexToRgb("#358ff3")).toEqual([53, 143, 243])
  })
  it("expands 3-digit hex", () => {
    expect(hexToRgb("#fff")).toEqual([255, 255, 255])
    expect(hexToRgb("#000")).toEqual([0, 0, 0])
  })
  it("falls back to grey on garbage", () => {
    expect(hexToRgb("nope")).toEqual([128, 128, 128])
  })
  it("round-trips", () => {
    expect(rgbToHex(hexToRgb("#7cbf87"))).toBe("#7cbf87")
  })
  it("clamps out-of-range channels", () => {
    expect(rgbToHex([300, -5, 12])).toBe("#ff000c")
  })
})

describe("hsv <-> rgb/hex", () => {
  it("primary hues", () => {
    expect(hsvToRgb(0, 1, 1)).toEqual([255, 0, 0])
    expect(hsvToRgb(120, 1, 1)).toEqual([0, 255, 0])
    expect(hsvToRgb(240, 1, 1)).toEqual([0, 0, 255])
  })
  it("zero saturation is grey", () => {
    expect(hsvToRgb(210, 0, 0.5)).toEqual([128, 128, 128])
  })
  it("round-trips through hex within 1/255 tolerance", () => {
    const { h, s, v } = hexToHsv("#7cbf87")
    const back = hexToRgb(hsvToHex(h, s, v))
    const orig = hexToRgb("#7cbf87")
    for (let i = 0; i < 3; i++) expect(Math.abs(back[i] - orig[i])).toBeLessThanOrEqual(1)
  })
  it("rgbToHsv on pure red", () => {
    expect(rgbToHsv([255, 0, 0])).toEqual({ h: 0, s: 1, v: 1 })
  })
})

describe("seedFromColor", () => {
  it("resolves presets to the palette", () => {
    expect(seedFromColor("blue")).toBe(PALETTE.blue)
  })
  it("resolves a hue number", () => {
    expect(seedFromColor(120)).toEqual(seedFromHue(120))
  })
  it("resolves a hex string with lightened line/star", () => {
    const s = seedFromHex("#358ff3")
    expect(s.fill).toEqual([53, 143, 243])
    // line/star lighten toward white
    expect(s.line[0]).toBeGreaterThan(s.fill[0])
    expect(s.star[0]).toBeGreaterThan(s.line[0])
  })
})

describe("css/hex helpers", () => {
  it("cssColor: preset -> var, hex -> itself, hue -> hex", () => {
    expect(cssColor("green")).toBe("var(--swatch-green)")
    expect(cssColor("#abc123")).toBe("#abc123")
    expect(cssColor(0)).toMatch(/^#/)
  })
  it("colorToHex: preset -> its fill hex", () => {
    expect(colorToHex("blue")).toBe(rgbToHex(PALETTE.blue.fill))
    expect(colorToHex("#123456")).toBe("#123456")
  })
})

describe("colour names", () => {
  it("are the palette's own keys, never an inherited name", async () => {
    const { isDitherColor } = await import("../src/engine/palette")
    const { fillOf } = await import("../src/engine/pixel")
    expect(isDitherColor("blue")).toBe(true)
    for (const name of ["constructor", "toString", "__proto__", "hasOwnProperty"]) {
      expect(isDitherColor(name)).toBe(false)
      expect(Array.isArray(fillOf(name))).toBe(true)
    }
  })
})

describe("WCAG contrast", () => {
  it("reads luminance and the ratio as WCAG 2 states them, in either order", () => {
    expect(luminance([255, 255, 255])).toBe(1)
    expect(luminance([0, 0, 0])).toBe(0)
    // the sRGB transfer's linear foot and its curve
    expect(toLinear(0.04)).toBeCloseTo(0.04 / 12.92, 12)
    for (const c of [0, 0.002, 0.04, 0.5, 1]) expect(toGamma(toLinear(c))).toBeCloseTo(c, 12)
    expect(luminance([128, 128, 128])).toBeCloseTo(0.2158605, 6)
    expect(contrast(luminance([0, 0, 0]), luminance([255, 255, 255]))).toBe(21)
    expect(contrast(1, 0)).toBe(contrast(0, 1))
    // #767676 on white is the grey that just passes AA, #777777 the one that does not
    expect(contrast(luminance([0x76, 0x76, 0x76]), 1)).toBeCloseTo(4.54, 2)
    expect(contrast(luminance([0x77, 0x77, 0x77]), 1)).toBeLessThan(4.5)
  })
})
