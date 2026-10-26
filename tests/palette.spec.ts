import { describe, expect, it } from "rstack/test"
import {
  colorToHex,
  cssColor,
  hexToHsv,
  hexToRgb,
  hsvToHex,
  hsvToRgb,
  PALETTE,
  rgbToHex,
  rgbToHsv,
  seedFromColor,
  seedFromHex,
  seedFromHue,
} from "../dither-kit/engine/palette"

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
