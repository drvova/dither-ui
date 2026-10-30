// The poster: a seed cuts the surface into columns of tiles whose inks differ
// from their neighbours', each tile's tone runs along its ramp through the
// screen, and the mark prints the tiles' negative, the same bytes for the same
// seed and moment.
import { describe, expect, it } from "rstack/test"
import { paintPoster, posterLayout, type PosterParams, type PosterTile } from "../dither-kit/engine/poster"
import { createRasterBuffer } from "../dither-kit/engine/raster"

const INKS: PosterParams["inks"] = [
  [255, 0, 0],
  [0, 255, 0],
  [0, 0, 255],
]
const params: PosterParams = { inks: INKS, ground: null, screen: "bayer", speed: 2 }
const W = 96
const H = 64

describe("posterLayout", () => {
  it("tiles the surface with columns whose inks change tile to tile", () => {
    for (const seed of [0, 5, 7, 1984, 31337]) {
      const { tiles, mark } = posterLayout(seed, INKS.length)
      const area = tiles.reduce((a, t) => a + (t.x1 - t.x0) * (t.y1 - t.y0), 0)
      expect(area).toBeCloseTo(1, 9)
      const columns = [...new Set(tiles.map((t) => t.x0))].sort((a, b) => a - b)
      expect(columns.length).toBeGreaterThanOrEqual(3)
      expect(columns[0]).toBe(0)
      columns.forEach((x0) => {
        const stack = tiles.filter((t) => t.x0 === x0).sort((a, b) => a.y0 - b.y0)
        expect(stack[0].y0).toBe(0)
        expect(stack[stack.length - 1].y1).toBe(1)
        stack.forEach((t, i) => i && expect(t.ink).not.toBe(stack[i - 1].ink))
      })
      tiles.forEach((t) => {
        if (t.under >= 0) expect(t.under).not.toBe(t.ink)
        for (const tone of [t.from, t.to]) {
          expect(tone).toBeGreaterThan(0)
          expect(tone).toBeLessThanOrEqual(1)
        }
      })
      expect(mark.r).toBeGreaterThan(0.3)
      expect(posterLayout(seed, INKS.length)).toEqual({ tiles, mark })
    }
  })
})

describe("paintPoster", () => {
  const paint = (time: number, layout = posterLayout(7, INKS.length)) => {
    const buffer = createRasterBuffer(W, H)
    paintPoster(buffer, layout, params, time)
    return buffer.data
  }
  const pixel = (data: Uint8ClampedArray, x: number, y: number) =>
    Array.from(data.slice((y * W + x) * 4, (y * W + x) * 4 + 4))
  // One tile over the whole surface, its ramp falling from solid to a fifth.
  const one = (tile: Partial<PosterTile>, mark = { x: 0.5, y: 0.5, r: 0.25 }) => ({
    tiles: [{ x0: 0, x1: 1, y0: 0, y1: 1, ink: 0, under: 1, from: 1, to: 0.2, axis: "y" as const, ...tile }],
    mark,
  })
  const share = (data: Uint8ClampedArray, ys: number[], x0 = 0, x1 = 16) => {
    let lit = 0
    let all = 0
    for (const y of ys)
      for (let x = x0; x < x1; x++) {
        all++
        if (pixel(data, x, y).join() === "255,0,0,255") lit++
      }
    return lit / all
  }

  it("prints the same bytes for the same seed and moment", () => {
    expect(paint(1.5)).toEqual(paint(1.5))
    expect(paint(1.5, posterLayout(8, INKS.length))).not.toEqual(paint(1.5))
  })

  it("runs a tile's tone along its ramp", () => {
    const data = paint(0, one({}, { x: 5, y: 5, r: 0 }))
    // Solid at the top, thinning to about a fifth of the cells at the foot.
    expect(share(data, [0, 1])).toBe(1)
    expect(share(data, [60, 61, 62, 63])).toBeLessThan(0.35)
    expect(share(data, [28, 29, 30, 31])).toBeGreaterThan(0.45)
    expect(share(data, [28, 29, 30, 31])).toBeLessThan(0.75)
  })

  it("prints the tiles' negative inside the mark and slides its screen with time", () => {
    const solid = one({ from: 1, to: 1 })
    const data = paint(0, solid)
    // The tile is solid ink outside the mark and its second ink inside.
    expect(pixel(data, 2, 2).join()).toBe("255,0,0,255")
    expect(pixel(data, W / 2, H / 2).join()).toBe("0,255,0,255")
    // A half tone inside the mark moves with the clock; outside it holds.
    const half = one({ from: 0.5, to: 0.5 })
    const row = (d: Uint8ClampedArray, x0: number) =>
      Array.from({ length: 8 }, (_, i) => pixel(d, x0 + i, H / 2).join()).join("|")
    expect(row(paint(0.5, half), W / 2 - 4)).not.toEqual(row(paint(0, half), W / 2 - 4))
    expect(row(paint(0.5, half), 0)).toEqual(row(paint(0, half), 0))
  })

  it("leaves a tile's open cells clear where it meets the ground", () => {
    const data = paint(0, one({ under: -1, from: 0.5, to: 0.5 }, { x: 5, y: 5, r: 0 }))
    const alphas = Array.from({ length: 4 }, (_, i) => pixel(data, i, 0)[3])
    expect(alphas).toContain(0)
    expect(alphas).toContain(255)
  })
})
