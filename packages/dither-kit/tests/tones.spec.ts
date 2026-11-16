// The dither as CSS: `src/engine/tones.css` is written from `engine/tone.ts`
// (`npx rs test -u packages/dither-kit/tests/tones.spec.ts` rewrites it), each
// tile is its screen's level, and a labelled fill's layers lay the cells its
// raster paints, byte for byte, so the label keeps its AA on the page.
import { createRequire } from "node:module"
import { describe, expect, it } from "rstack/test"
import {
  gradientCells,
  LABEL_SIZES,
  labelPaint,
  labelRows,
  renderLabelFill,
  type LabelVariant,
} from "../src/engine/label-fill"
import { type DitherColor, PALETTE } from "../src/engine/palette"
import { BAYER4, SCREEN_KINDS, SCREENS, screenMatrix } from "../src/engine/pixel"
import { rasterSrc } from "../src/engine/png"
import { renderDitherButton } from "../src/engine/precompile"
import type { RasterBuffer } from "../src/engine/raster"
import {
  HATCH_MASK,
  matchTone,
  screenTone,
  shiftMask,
  TONE_LEVELS,
  toneMask,
  toneStylesheet,
  tonePatterns,
  type ToneMask,
} from "../src/engine/tone"

// `rs fmt` is rstack's Prettier with the house options (the root's
// rstack.config.ts): the stylesheet comes out of the same formatter.
const require = createRequire(import.meta.url)
const prettier = createRequire(require.resolve("rstack/package.json"))("prettier") as {
  format(text: string, options: Record<string, unknown>): Promise<string>
}

/** The cells a tile's SVG path lights. */
function cellsOf(url: string): ToneMask {
  const d = decodeURIComponent(url).match(/d='([^']*)'/)?.[1] ?? ""
  const lit = Array.from({ length: 16 }, () => false)
  for (const [, x, y, w] of d.matchAll(/M(\d) (\d)h(\d)v1h-\d+z/g))
    for (let i = 0; i < +w; i++) lit[+y * 4 + +x + i] = true
  return lit
}

/** The colour a CSS ink names, as bytes. */
function inkBytes(ink: string): number[] {
  const [, r, g, b, a] = ink.match(/rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)/)!
  return [+r!, +g!, +b!, Math.round(+a! * 255)]
}

/** A labelled fill as its layers lay it, `cols` by `rows` cells: each layer
 * source-over the ones under it (they never share a cell), then the edge,
 * laid on the cells or in their place. */
function cellsOfPaint(
  paint: ReturnType<typeof labelPaint>,
  cols: number,
  rows: number,
  image?: RasterBuffer,
): RasterBuffer {
  const data = new Uint8ClampedArray(cols * rows * 4)
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const t = (y & 3) * 4 + (x & 3)
      for (const layer of paint.layers) {
        if (layer.kind === "image") {
          expect(layer.src).toBe(rasterSrc(image!))
          data.set(image!.data.subarray((y * 4 + (x & 3)) * 4, (y * 4 + (x & 3)) * 4 + 4), i)
          continue
        }
        const shown = (layer.gaps ? !layer.mask[t] : layer.mask[t]) && (!layer.hatch || HATCH_MASK[t])
        if (shown) data.set(inkBytes(layer.ink), i)
      }
      if (y === 0 || x === 0 || y === rows - 1 || x === cols - 1) {
        const edge = inkBytes(paint.edge)
        const e = edge[3]! / 255
        const a = data[i + 3]! / 255
        // over: one colour, so only the alpha adds (as the canvas laid it)
        data.set(paint.over ? [edge[0]!, edge[1]!, edge[2]!, Math.round((e + a * (1 - e)) * 255)] : edge, i)
        if (paint.over && !(e + a * (1 - e) > 0)) data.fill(0, i, i + 4)
      }
    }
  return { width: cols, height: rows, data }
}

describe("tones.css", () => {
  it("is written from the screens", async () => {
    const css = await prettier.format(toneStylesheet(), { semi: false, printWidth: 120, filepath: "tones.css" })
    await expect(css).toMatchFileSnapshot("../src/engine/tones.css")
  })

  it("holds 17 tiles a screen, each its level's lowest ranks", () => {
    const css = toneStylesheet()
    for (const screen of SCREEN_KINDS)
      for (let level = 0; level < TONE_LEVELS; level++) {
        const url = css.match(new RegExp(`--dk-t-${screen}-${level}: (url\\("[^"]*"\\));`))![1]!
        const ranks = SCREENS[screen].flat().map((v) => v * 16 - 0.5)
        expect(cellsOf(url), `${screen} ${level}`).toEqual(ranks.map((r) => r < level))
        expect(css).toContain(`.dk-tone-${screen}-${level} {\n  --dk-tone-tile: var(--dk-t-${screen}-${level});`)
      }
  })

  it("gives SVG fills the same tiles as patterns", () => {
    const svg = tonePatterns(2)
    expect(svg.match(/<pattern /g)).toHaveLength(SCREEN_KINDS.length * TONE_LEVELS)
    expect(svg).toContain('<pattern id="dk-bayer-9" width="8" height="8" patternUnits="userSpaceOnUse">')
  })
})

describe("matchTone", () => {
  it("finds a screen's level and its shift", () => {
    for (const screen of SCREEN_KINDS)
      for (let level = 1; level < 16; level++) {
        const m = matchTone(shiftMask(screenTone(screen, level), 1, 2))!
        expect(shiftMask(screenTone(m.screen, m.level), m.x, m.y)).toEqual(shiftMask(screenTone(screen, level), 1, 2))
      }
  })

  it("names a seeded matrix's cells by a tile where one makes them, by themselves where none does", () => {
    let named = 0
    let own = 0
    for (let seed = 0; seed < 200; seed++)
      for (let level = 0; level <= 16; level++) {
        const mask = toneMask(screenMatrix("bayer", seed), (level + 0.5) / 17)
        const m = matchTone(mask)
        if (m) {
          named++
          expect(shiftMask(screenTone(m.screen, m.level), m.x, m.y)).toEqual(mask)
        } else own++
      }
    expect(named).toBeGreaterThan(0)
    expect(named + own).toBe(200 * 17)
  })
})

const COLORS = Object.keys(PALETTE) as DitherColor[]
const VARIANTS: LabelVariant[] = ["gradient", "solid", "dotted", "hatched"]

describe("a labelled fill's tone classes lay its raster's cells", () => {
  it("the badge's and the toggle's (straight alpha)", () => {
    for (const color of COLORS)
      for (const variant of VARIANTS)
        for (const seed of [undefined, 3, 42])
          for (const [rows] of LABEL_SIZES) {
            const matrix = screenMatrix("bayer", seed)
            const fill = PALETTE[color].fill
            const paint = labelPaint(fill, variant, "straight", matrix, rows)
            const raster = renderLabelFill(32, rows, fill, variant, paint.tone, matrix)
            // The edge laid over a cell rounds twice (the cell, then the
            // two together) where the raster rounded once: a byte of alpha.
            const laid = cellsOfPaint(
              paint,
              32,
              rows,
              gradientCells(fill, "straight", matrix, rows, 0, paint.tone),
            ).data
            const off = laid.findIndex((v, i) => Math.abs(v - raster.data[i]!) > ((i & 3) === 3 ? 1 : 0))
            expect(off, `${color} ${variant} ${seed} ${rows}`).toBe(-1)
          }
  })

  it("the button's (premultiplied), at rest, hovered and pressed", () => {
    for (const color of COLORS)
      for (const variant of VARIANTS)
        for (const seed of [undefined, 3, 42])
          for (const [rows] of LABEL_SIZES)
            for (const intensity of [0, 1, 1.5]) {
              const fill = PALETTE[color].fill
              const matrix = screenMatrix("bayer", seed)
              const paint = labelPaint(fill, variant, "premultiplied", matrix, rows, intensity)
              const image = gradientCells(fill, "premultiplied", matrix, rows, intensity, paint.tone)
              const raster = renderDitherButton({ width: 32, height: rows, cell: 1, color, variant, seed, intensity })
              expect(
                cellsOfPaint(paint, 32, rows, image).data,
                `${color} ${variant} ${seed} ${rows} ${intensity}`,
              ).toEqual(raster.data)
            }
  })

  it("in square cells at any height: a 48px key, a 3px cell", () => {
    // rows from the top, the last one cut where the box ends, never stretched
    expect(labelRows(40, 2)).toBe(20)
    expect(labelRows(48, 2)).toBe(24)
    expect(labelRows(40, 3)).toBe(14)
    expect(labelRows(20, 2)).toBe(10)
    expect(labelRows(30, 2)).toBe(15)
    for (const [height, cell] of [
      [48, 2],
      [40, 3],
    ])
      for (const color of COLORS)
        for (const variant of VARIANTS)
          for (const intensity of [0, 1, 1.5]) {
            const rows = labelRows(height, cell)
            const fill = PALETTE[color].fill
            const paint = labelPaint(fill, variant, "premultiplied", BAYER4, rows, intensity)
            const image = gradientCells(fill, "premultiplied", BAYER4, rows, intensity, paint.tone)
            const raster = renderDitherButton({ width: 32, height: rows, cell: 1, color, variant, intensity })
            expect(cellsOfPaint(paint, 32, rows, image).data, `${height}px ${cell} ${color} ${variant}`).toEqual(
              raster.data,
            )
          }
  })
})
