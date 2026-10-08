import { describe, expect, it } from "vitest"
import {
  avoidFactor,
  bayerMatrix,
  mulberry32,
  packColor,
  quantize,
  rasterize,
  scatterBodies,
  type RasterInput,
} from "@/pages/landing/dither-field"

function input(over: Partial<RasterInput> = {}): RasterInput {
  const bodies = scatterBodies(96, 48, mulberry32(3))
  return {
    cols: 32,
    rows: 16,
    cell: 3,
    matrix: bayerMatrix(8),
    matrixSize: 8,
    ramp: Uint32Array.from(["#0c1730", "#2f6fd0", "#c9dbff"], packColor),
    hot: Uint32Array.from(["#ff9632"], packColor),
    hotAt: 0.95,
    sizzle: 0,
    density: 1,
    bodies,
    pointer: null,
    avoid: null,
    scrollShift: 0,
    ...over,
  }
}

describe("dither-field engine", () => {
  it("builds Bayer matrices with every rank exactly once, in (0, 1)", () => {
    for (const n of [4, 8] as const) {
      const m = bayerMatrix(n)
      const ranks = Array.from(m, (v) => Math.round(v * n * n - 0.5)).sort((a, b) => a - b)
      expect(ranks).toEqual(Array.from({ length: n * n }, (_, i) => i))
      expect(Math.min(...m)).toBeGreaterThan(0)
      expect(Math.max(...m)).toBeLessThan(1)
    }
    // The 4x4 is the kit's gradient matrix: rank 0 top-left, 15 bottom-left.
    const b4 = bayerMatrix(4)
    expect(Math.round(b4[0] * 16 - 0.5)).toBe(0)
    expect(Math.round(b4[12] * 16 - 0.5)).toBe(15)
  })

  it("quantizes monotonically and clamps to the ramp", () => {
    let prev = 0
    for (let t = 0; t <= 1; t += 0.01) {
      const i = quantize(t, 3, 0.5)
      expect(i).toBeGreaterThanOrEqual(prev)
      prev = i
    }
    expect(quantize(0, 3, 0.5)).toBe(0)
    expect(quantize(1, 3, 0.5)).toBe(3)
    expect(quantize(2, 3, 0.5)).toBe(3)
    // A cell steps up to the next colour only when its fraction beats its threshold.
    expect(quantize(0.4, 1, 0.3)).toBe(1)
    expect(quantize(0.2, 1, 0.3)).toBe(0)
  })

  it("packs colours as opaque ImageData pixels", () => {
    const px = packColor("#ff9632")
    const bytes = new Uint8Array(new Uint32Array([px]).buffer)
    expect(Array.from(bytes)).toEqual([0xff, 0x96, 0x32, 0xff])
    expect(packColor("#fff")).toBe(packColor("#ffffff"))
  })

  it("is deterministic: same seed, size and time give the same bytes", () => {
    const a = new Uint32Array(32 * 16)
    const b = new Uint32Array(32 * 16)
    rasterize(a, input(), 1.25)
    rasterize(b, input(), 1.25)
    expect(a).toEqual(b)
    rasterize(b, input(), 1.5)
    expect(a).not.toEqual(b)
    expect(a.some((v) => v !== 0)).toBe(true)
  })

  it("dithers through the ramp instead of flooding a colour", () => {
    const buf = new Uint32Array(32 * 16)
    const inp = input({ density: 0.55 })
    rasterize(buf, inp, 0.4)
    const counts = new Map<number, number>()
    for (const v of buf) counts.set(v, (counts.get(v) ?? 0) + 1)
    // Clear floor + every ramp level present.
    expect(counts.get(0) ?? 0).toBeGreaterThan(0)
    for (const c of inp.ramp) expect(counts.get(c) ?? 0).toBeGreaterThan(0)
    // The hot ramp only ignites above hotAt — the bodies peak under it.
    expect(counts.get(inp.hot[0]) ?? 0).toBe(0)
  })

  it("yields to an avoid rect and lights under the pointer", () => {
    const buf = new Uint32Array(32 * 16)
    rasterize(buf, input({ avoid: { rect: { x: 0, y: 0, w: 96, h: 48 }, pad: 1 } }), 0.4)
    expect(buf.every((v) => v === 0)).toBe(true)
    expect(avoidFactor(50, 50, { x: 0, y: 0, w: 10, h: 10 }, 20)).toBe(1)
    expect(avoidFactor(5, 5, { x: 0, y: 0, w: 10, h: 10 }, 20)).toBe(0)
    const hot = new Uint32Array(32 * 16)
    rasterize(hot, input({ bodies: [], pointer: { x: 48, y: 24, w: 1.2, r: 30 } }), 0)
    expect(hot[8 * 32 + 16]).toBe(packColor("#ff9632"))
    expect(hot[0]).toBe(0)
  })

  it("scales with density (the hover state)", () => {
    const lit = (d: number) => {
      const buf = new Uint32Array(32 * 16)
      rasterize(buf, input({ density: d }), 0.4)
      return buf.reduce((n, v) => n + (v !== 0 ? 1 : 0), 0)
    }
    expect(lit(0.4)).toBeLessThan(lit(1))
    expect(lit(0)).toBe(0)
  })
})
