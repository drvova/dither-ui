// The paths that paint the kit at memory speed must paint exactly what the
// slow paths painted: a cell laid by `cellCanvas` is the pixel a fillStyle
// string and a 1x1 fillRect over a cleared canvas leave, valueNoise and fbm
// with their lattice cache are bit-identical to the plain hashes, and the
// engines that paint a run or a row at once print the per-cell walk's bytes.
import { describe, expect, it } from "rstack/test"
import { paintAurora, type AuroraParams } from "../src/engine/aurora"
import {
  paintColumn,
  resolveMatrix,
  resolveTexture,
  type PaintOpts,
  type VariantInput,
} from "../src/engine/dither-paint"
import { fbm, hash21, valueNoise } from "../src/engine/noise"
import { seedOfColor, sampleRgbGradient, type Rgb } from "../src/engine/palette"
import { BAYER4, clamp01, fillOf, SCREEN_KINDS, SCREENS, screenMatrix } from "../src/engine/pixel"
import { paintPoster, posterLayout, type PosterLayout, type PosterParams } from "../src/engine/poster"
import {
  DEFAULT_MAX_COLS,
  DEFAULT_MAX_ROWS,
  renderDitherGradient,
  type GradientRasterOptions,
} from "../src/engine/precompile"
import { cellCanvas, createRasterBuffer, type RasterBuffer } from "../src/engine/raster"
import { paintSoftAurora, type SoftAuroraParams } from "../src/engine/soft-aurora"

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

describe("the lattice cache of valueNoise and fbm", () => {
  const smooth = (t: number) => t * t * (3 - 2 * t)
  /** Value noise with no cache: four hashes a sample. */
  const plainNoise = (x: number, y: number) => {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const a = hash21(xi, yi)
    const b = hash21(xi + 1, yi)
    const c = hash21(xi, yi + 1)
    const d = hash21(xi + 1, yi + 1)
    const u = smooth(x - xi)
    const v = smooth(y - yi)
    return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v
  }
  const reference = (x: number, y: number, t: number) => {
    let sum = 0
    let amp = 0.5
    let fx = x
    let fy = y
    let ft = t
    for (let o = 0; o < 3; o++) {
      sum += amp * plainNoise(fx + ft, fy - ft * 0.5)
      fx *= 2
      fy *= 2
      ft *= 1.7
      amp *= 0.5
    }
    return sum
  }
  const samples: [number, number, number][] = []
  for (let y = 0; y < 40; y++) for (let x = 0; x < 60; x++) samples.push([(x / 60) * 3.1, (y / 40) * 2.2, 0.37])

  it("is bit-identical to the plain sum, raster order or any order", () => {
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

  it("stays bit-identical with several fields sampled a cell, as a painter samples them", () => {
    // Up to five fields interleaved: more than the cache holds, so the
    // slots turn over and every value still comes out exact.
    for (const fields of [2, 3, 5])
      for (const [x, y, t] of samples)
        for (let f = 0; f < fields; f++) {
          const fx = x * (1 + f * 0.7) + f * 4.1
          const fy = y * (1 + f * 0.3) - f * 2.7
          expect(fbm(fx, fy, t * (f + 1))).toBe(reference(fx, fy, t * (f + 1)))
          expect(valueNoise(fx + 1.7, fy + 9.2)).toBe(plainNoise(fx + 1.7, fy + 9.2))
        }
  })
})

/* The engines that paint a row or a run at once rather than a cell at a
 * time: each against the per-cell walk it replaced, byte for byte. */

describe("paintPoster's runs", () => {
  const INKS: Rgb[] = [
    [228, 225, 216],
    [255, 106, 43],
    [75, 123, 255],
  ]
  const reference = (buffer: RasterBuffer, layout: PosterLayout, p: PosterParams, time: number) => {
    const { width: cols, height: rows, data } = buffer
    const screen = SCREENS[p.screen]
    const drift = Math.floor(time * p.speed)
    const r = Math.max(1, layout.mark.r * Math.min(cols, rows))
    const place = (at: number, n: number) => Math.min(Math.max(at, Math.min(r, n / 2)), Math.max(n - r, n / 2))
    const cx = place(layout.mark.x * cols, cols)
    const cy = place(layout.mark.y * rows, rows)
    const ink = (i: number) => p.inks[((i % p.inks.length) + p.inks.length) % p.inks.length]
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const fx = (x + 0.5) / cols
        const fy = (y + 0.5) / rows
        const columns = [...new Set(layout.tiles.map((t) => t.x0))].sort((a, b) => a - b)
        let c = 0
        const stack = () => layout.tiles.filter((t) => t.x0 === columns[c]).sort((a, b) => a.y0 - b.y0)
        while (c < columns.length - 1 && fx >= stack()[0].x1) c++
        const tiles = stack()
        let s = 0
        while (s < tiles.length - 1 && fy >= tiles[s].y1) s++
        const t = tiles[s]
        const along = t.axis === "y" ? (fy - t.y0) / (t.y1 - t.y0) : (fx - t.x0) / (t.x1 - t.x0)
        const tone = t.from + (t.to - t.from) * along
        const inside = Math.abs(x + 0.5 - cx) + Math.abs(y + 0.5 - cy) < r
        const lit = inside ? 1 - tone > screen[y & 3][(x + drift) & 3] : tone > screen[y & 3][x & 3]
        const color = lit ? ink(t.ink) : t.under < 0 ? p.ground : ink(t.under)
        const i = (y * cols + x) * 4
        if (color) data.set([...color, 255], i)
        else data[i + 3] = 0
      }
  }

  it("prints what the cell by cell walk printed, at every size, screen and moment", () => {
    for (const [cols, rows] of [
      [97, 61],
      [64, 80],
      [5, 3],
      [301, 17],
    ])
      for (const seed of [0, 3, 11, 1984])
        for (const screen of SCREEN_KINDS) {
          const layout = posterLayout(seed, INKS.length)
          const p: PosterParams = { inks: INKS, ground: seed & 1 ? INKS[2] : null, screen, speed: 6 }
          for (const time of [0, 0.7, 2.25]) {
            // Both start from the same stale bytes: a clear cell keeps its colour.
            const got = createRasterBuffer(cols, rows)
            const want = createRasterBuffer(cols, rows)
            got.data.fill(9)
            want.data.fill(9)
            paintPoster(got, layout, p, time)
            reference(want, layout, p, time)
            expect(got.data).toEqual(want.data)
          }
        }
  })
})

describe("renderDitherGradient's rows", () => {
  const reference = (o: GradientRasterOptions) => {
    const cols = Math.min(DEFAULT_MAX_COLS, Math.max(4, Math.round(o.width / (o.cell ?? 3))))
    const rows = Math.min(DEFAULT_MAX_ROWS, Math.max(4, Math.round(o.height / (o.cell ?? 3))))
    const from = fillOf(o.from ?? "blue")
    const to = o.to === "transparent" || o.to === undefined ? null : fillOf(o.to)
    const opacity = o.opacity ?? 1
    const matrix = screenMatrix(o.screen ?? "bayer", o.seed)
    const out = createRasterBuffer(cols, rows)
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const dir = o.direction ?? "up"
        const t =
          dir === "up"
            ? 1 - (y + 0.5) / rows
            : dir === "down"
              ? (y + 0.5) / rows
              : dir === "left"
                ? 1 - (x + 0.5) / cols
                : (x + 0.5) / cols
        const density = 1 - t
        const lit = density > matrix[y & 3][x & 3]
        const c = lit || !to ? from : to
        const alpha = to ? opacity : (lit ? 0.35 + 0.65 * density : 0.12 * density) * opacity
        if (alpha <= 0) continue
        const a = alpha > 1 ? 1 : alpha
        out.data.set(
          [c[0] * a + 0.5, c[1] * a + 0.5, c[2] * a + 0.5, a * 255 + 0.5].map(Math.trunc),
          (y * cols + x) * 4,
        )
      }
    return out.data
  }

  it("lays what the cell by cell walk laid, in every direction and size", () => {
    for (const direction of ["up", "down", "left", "right"] as const)
      for (const [width, height] of [
        [12, 12],
        [999, 231],
        [37, 590],
      ])
        for (const o of [
          { from: "purple" as const, to: "transparent" as const, opacity: 0.14 },
          { from: "orange" as const, to: "blue" as const, opacity: 0.8, seed: 7 },
          { from: "green" as const, screen: "dot" as const, seed: 3 },
          { from: "blue" as const, opacity: 0 },
        ]) {
          const options: GradientRasterOptions = { width, height, cell: 3, direction, ...o }
          expect(renderDitherGradient(options).data).toEqual(reference(options))
        }
  })
})

describe("paintColumn's raster walk", () => {
  const reference = (buf: RasterBuffer, x: number, top: number, floor: number, fill: Rgb, o: PaintOpts) => {
    const tex = resolveTexture(o.variant)
    const mat = o.matrix ?? resolveMatrix(o.variant)
    const t = Math.round(top)
    const f = Math.round(floor)
    const depth = f - t
    const set = (y: number, alpha: number) => {
      const a = alpha < 0 ? 0 : alpha > 1 ? 1 : alpha
      const i = (y * buf.width + x) * 4
      buf.data[i] = (fill[0] * a + 0.5) | 0
      buf.data[i + 1] = (fill[1] * a + 0.5) | 0
      buf.data[i + 2] = (fill[2] * a + 0.5) | 0
      buf.data[i + 3] = (a * 255 + 0.5) | 0
    }
    const onGrid = (y: number) => y >= 0 && y < buf.height && x >= 0 && x < buf.width
    if (depth <= 0) {
      if (onGrid(t)) set(t, tex.edge * o.dim)
      return
    }
    const bias = tex.density + (o.stacked ? 0.2 : 0) - (o.sparse ?? 0)
    for (let y = t; y < f; y++) {
      if (y < 0 || y >= buf.height) continue
      let density = 1 - tex.ramp * (1 - (y - t) / depth)
      if (o.stacked) density = 0.5 + 0.5 * density
      if (tex.hatch >= 2 && (((x + y) % tex.hatch) + tex.hatch) % tex.hatch >= tex.hatch / 2) continue
      const lit = density > mat[y & 3][x & 3] - 0.1 * o.intensity - bias
      if (tex.gaps && !lit) continue
      const k = (tex.alphaFloor + density * tex.alphaRange) * (1 + tex.intensityLift * o.intensity)
      const alpha = (lit ? k : k * tex.offTier) * o.dim
      if (alpha <= 0) continue
      set(y, alpha)
    }
    if (tex.edge > 0 && onGrid(t)) {
      set(t, tex.edge * o.dim)
      if (depth > 1 && t + 1 < buf.height) set(t + 1, tex.edge * 0.5 * o.dim)
    }
  }

  it("lays what the cell by cell walk laid, for every texture and lift", () => {
    const seed = seedOfColor("orange")
    const variants: VariantInput[] = ["gradient", "dotted", "hatched", "solid", 17, 9001, { hatch: 3, gaps: true }]
    const got = createRasterBuffer(60, 40)
    const want = createRasterBuffer(60, 40)
    for (const variant of variants)
      for (const intensity of [0, 0.35, 1])
        for (const stacked of [false, true])
          for (let x = -1; x <= 60; x++) {
            const o: PaintOpts = { variant, intensity, dim: x % 4 ? 1 : 0.3, stacked, sparse: (x % 3) * 0.1 }
            const top = ((x * 7) % 50) - 6.4
            const floor = 44 - (x % 5)
            paintColumn(got, x, top, floor, seed, o)
            reference(want, x, top, floor, seed.fill, o)
          }
    expect(got.data).toEqual(want.data)
  })
})

describe("the auroras' curtain edges", () => {
  const RAMP: Rgb[] = [
    [16, 18, 20],
    [75, 123, 255],
    [228, 225, 216],
  ]
  const auroraRef = (buffer: RasterBuffer, p: AuroraParams, time: number) => {
    const { width: cols, height: rows, data } = buffer
    const t = time * p.speed
    const lo = 0.0025 + p.blend * 0.02
    const hi = 0.02 + p.blend * 0.15
    const col: [number, number, number] = [0, 0, 0]
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4
        const u = (x + 0.5) / cols
        const v = (y + 0.5) / rows
        const d = v - (0.28 + p.amplitude * 0.22 * (fbm(u * 2.5 + t * 0.15, 7.3, t * 0.4) - 0.5) * 2)
        let inten = Math.exp(-(d * d) / (d < 0 ? lo : hi))
        inten = clamp01(inten * (0.55 + 0.45 * fbm(u * 22, v * 3 + t * 0.5, t * 0.2)) * 1.4)
        if (p.dither > 0) inten = inten * (1 - p.dither) + (inten > BAYER4[y & 3][x & 3] ? 1 : 0) * p.dither
        const alpha = clamp01(inten) * p.opacity
        if (alpha <= 0) {
          data.fill(0, i, i + 4)
          continue
        }
        sampleRgbGradient(p.colors, u, col)
        data.set([col[0], col[1], col[2], alpha * 255], i)
      }
  }
  const softRef = (buffer: RasterBuffer, p: SoftAuroraParams, time: number) => {
    const { width: cols, height: rows, data } = buffer
    const t = time * p.speed
    const bands = Math.max(1, Math.round(p.bands))
    const spread = 0.01 + p.blend * 0.08
    const col: [number, number, number] = [0, 0, 0]
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4
        const u = (x + 0.5) / cols
        const v = (y + 0.5) / rows
        let inten = 0
        for (let b = 0; b < bands; b++) {
          const edge = 0.22 + b * (0.5 / bands) + p.amplitude * 0.15 * (fbm(u * 2 + b * 3, 7 + b, t * 0.4) - 0.5) * 2
          inten += Math.exp(-((v - edge) * (v - edge)) / spread) * 0.6
        }
        inten *= 0.6 + 0.4 * fbm(u * 10, v * 2, t * 0.15)
        inten = inten <= 0.05 ? 0 : clamp01(inten)
        if (inten > 0 && p.dither > 0)
          inten = inten * (1 - p.dither) + (inten > BAYER4[y & 3][x & 3] ? 1 : 0) * p.dither
        const a = clamp01(inten) * p.opacity
        if (a <= 0) {
          data.fill(0, i, i + 4)
          continue
        }
        sampleRgbGradient(p.colors, v, col)
        data.set([col[0], col[1], col[2], a * 255], i)
      }
  }

  it("paint what the per-cell edge painted, a wide frame then a narrow one", () => {
    for (const [cols, rows] of [
      [120, 40],
      [33, 21],
      [120, 9],
    ])
      for (const time of [0, 1.3]) {
        const aurora: AuroraParams = { colors: RAMP, amplitude: 1, blend: 0.4, speed: 1, opacity: 0.9, dither: 0.7 }
        const got = createRasterBuffer(cols, rows)
        const want = createRasterBuffer(cols, rows)
        paintAurora(got, aurora, time, BAYER4)
        auroraRef(want, aurora, time)
        expect(got.data).toEqual(want.data)
        for (const bands of [1, 3, 5]) {
          const soft: SoftAuroraParams = {
            colors: RAMP,
            bands,
            amplitude: 1,
            blend: 0.5,
            speed: 1,
            opacity: 1,
            dither: 0.4,
          }
          paintSoftAurora(got, soft, time, BAYER4)
          softRef(want, soft, time)
          expect(got.data).toEqual(want.data)
        }
      }
  })
})
