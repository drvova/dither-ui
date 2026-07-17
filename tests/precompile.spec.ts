import { describe, expect, it } from "vitest"
import {
  renderDitherButton,
  renderDitherGradient,
  DEFAULT_MAX_COLS,
  DEFAULT_MAX_ROWS,
  STATIC_DEFAULT_MAX_COLS,
  STATIC_DEFAULT_MAX_ROWS,
} from "../dither-kit/precompile"
import { createRasterBuffer, setRasterPixel32 } from "../dither-kit/raster"

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

  it("exports sensible default resolution caps", () => {
    expect(DEFAULT_MAX_COLS).toBe(960)
    expect(DEFAULT_MAX_ROWS).toBe(600)
    expect(STATIC_DEFAULT_MAX_COLS).toBe(320)
    expect(STATIC_DEFAULT_MAX_ROWS).toBe(200)
    expect(STATIC_DEFAULT_MAX_COLS).toBeLessThan(DEFAULT_MAX_COLS)
    expect(STATIC_DEFAULT_MAX_ROWS).toBeLessThan(DEFAULT_MAX_ROWS)
  })

  it("honors custom maxCols/maxRows in renderDitherGradient", () => {
    const raster = renderDitherGradient({
      width: 960,
      height: 600,
      cell: 1,
      maxCols: 160,
      maxRows: 100,
    })
    expect(raster.width).toBe(160)
    expect(raster.height).toBe(100)
    // Without caps, 960/1=960 cols — caps must clamp
    expect(raster.width).toBeLessThan(DEFAULT_MAX_COLS)
  })

  it("honors custom maxCols/maxRows in renderDitherButton", () => {
    const raster = renderDitherButton({
      width: 320,
      height: 80,
      cell: 1,
      maxCols: 80,
      maxRows: 40,
    })
    expect(raster.width).toBe(80)
    expect(raster.height).toBe(40)
  })
})

describe("setRasterPixel32", () => {
  it("writes a packed pixel via Uint32Array view", () => {
    const buf = createRasterBuffer(4, 4)
    const view = new Uint32Array(buf.data.buffer)
    setRasterPixel32(view, 4, 1, 2, 0xff, 0x00, 0x80, 0xff)
    const i = (2 * 4 + 1) * 4
    expect(buf.data[i]).toBe(0xff) // r
    expect(buf.data[i + 1]).toBe(0x00) // g
    expect(buf.data[i + 2]).toBe(0x80) // b
    expect(buf.data[i + 3]).toBe(0xff) // a
  })

  it("defaults alpha to 255 when omitted", () => {
    const buf = createRasterBuffer(2, 2)
    const view = new Uint32Array(buf.data.buffer)
    setRasterPixel32(view, 2, 0, 0, 10, 20, 30)
    expect(buf.data[3]).toBe(255)
  })
})
