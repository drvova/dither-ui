// The paths that paint the kit at memory speed must paint exactly what the
// slow paths painted: a cell laid by `cellCanvas` is the pixel a fillStyle
// string and a 1x1 fillRect over a cleared canvas leave, and fbm with its
// lattice cache is bit-identical to summing valueNoise. The Svelte port
// paints through the same bytes: its engine is a verbatim copy.
import { readdirSync, readFileSync } from "node:fs"
import { describe, expect, it } from "rstack/test"
import { fbm, valueNoise } from "../dither-kit/engine/noise"
import { cellCanvas } from "../dither-kit/engine/raster"

/** A 2D context with just what cellCanvas uses: ImageData in, one upload out. */
function fakeContext() {
  const uploads: ImageData[] = []
  let created = 0
  const ctx = {
    createImageData: (w: number, h: number) => {
      created++
      return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) } as unknown as ImageData
    },
    putImageData: (image: ImageData) => uploads.push(image),
  } as unknown as CanvasRenderingContext2D
  return { ctx, uploads, created: () => created }
}

const pixel = (img: ImageData, cols: number, x: number, y: number) =>
  Array.from(img.data.slice((y * cols + x) * 4, (y * cols + x) * 4 + 4))

describe("cellCanvas", () => {
  it("lays a cell as rgb(color, k, alpha) and a 1x1 fillRect would", () => {
    const { ctx, uploads } = fakeContext()
    const px = cellCanvas(ctx, 4, 2)
    px.cell(1, 0, [63, 143, 243], 0.5)
    px.cell(2, 1, [120, 120, 130], 0.2, 2)
    px.cell(9, 9, [255, 0, 0], 1) // off the grid: ignored
    px.cell(0, 0, [255, 0, 0], 0) // no alpha: nothing
    px.flush()
    const img = uploads[0]
    expect(pixel(img, 4, 1, 0)).toEqual([63, 143, 243, 128])
    // k scales the colour before alpha, as rgb() does (and clamps at 255).
    expect(pixel(img, 4, 2, 1)).toEqual([240, 240, 255, 51])
    expect(pixel(img, 4, 0, 0)).toEqual([0, 0, 0, 0])
  })

  it("blends a second write source-over, as a second fillRect does", () => {
    const { ctx, uploads } = fakeContext()
    const px = cellCanvas(ctx, 2, 1)
    px.cell(0, 0, [255, 255, 255], 0.5)
    px.cell(0, 0, [0, 0, 0], 0.5)
    px.rect(1, 0, 1, 1, [10, 20, 30], 1)
    px.flush()
    // 50% black over 50% white, the first write's alpha stored as 128/255
    // as a canvas stores it: alpha 192, colour 1/3 white.
    expect(pixel(uploads[0], 2, 0, 0)).toEqual([85, 85, 85, 192])
    expect(pixel(uploads[0], 2, 1, 0)).toEqual([10, 20, 30, 255])
  })

  it("reuses one raster and one ImageData per canvas, frame after frame", () => {
    const { ctx, uploads, created } = fakeContext()
    for (let f = 0; f < 5; f++) {
      const px = cellCanvas(ctx, 8, 8)
      px.cell(f, 0, [255, 255, 255], 1)
      px.flush()
    }
    expect(created()).toBe(1)
    expect(new Set(uploads).size).toBe(1)
    // Each frame starts cleared: only the last frame's cell is lit.
    const last = uploads[4]
    expect(pixel(last, 8, 4, 0)[3]).toBe(255)
    expect(pixel(last, 8, 3, 0)[3]).toBe(0)
  })
})

describe("fbm's lattice cache", () => {
  const reference = (x: number, y: number, t: number) => {
    let sum = 0
    let amp = 0.5
    let fx = x
    let fy = y
    let ft = t
    for (let o = 0; o < 3; o++) {
      sum += amp * valueNoise(fx + ft, fy - ft * 0.5)
      fx *= 2
      fy *= 2
      ft *= 1.7
      amp *= 0.5
    }
    return sum
  }

  it("is bit-identical to summing valueNoise, raster order or any order", () => {
    const samples: [number, number, number][] = []
    for (let y = 0; y < 40; y++) for (let x = 0; x < 60; x++) samples.push([(x / 60) * 3.1, (y / 40) * 2.2, 0.37])
    for (const [x, y, t] of samples) expect(fbm(x, y, t)).toBe(reference(x, y, t))
    // Shuffled: every call a likely cache miss, the same values.
    let seed = 7
    const shuffled = samples
      .map((s) => ({ s, k: (seed = (seed * 1103515245 + 12345) >>> 0) }))
      .sort((a, b) => a.k - b.k)
      .map((v) => v.s)
    for (const [x, y, t] of shuffled) expect(fbm(x, y, t)).toBe(reference(x, y, t))
    expect(fbm(-12.5, 7.25, -3)).toBe(reference(-12.5, 7.25, -3))
  })
})

describe("the Svelte port's engine", () => {
  // dither-paint.ts carries the port's one deliberate change (its AGENTS.md).
  const OWN = new Set(["dither-paint.ts"])

  it("is the kit's engine, byte for byte", () => {
    const files = readdirSync("dither-kit-svelte/engine").filter((f) => f.endsWith(".ts") && !OWN.has(f))
    expect(files).toContain("raster.ts")
    expect(files).toContain("noise.ts")
    for (const f of files)
      expect(readFileSync(`dither-kit-svelte/engine/${f}`, "utf8"), f).toBe(
        readFileSync(`dither-kit/engine/${f}`, "utf8"),
      )
  })
})
