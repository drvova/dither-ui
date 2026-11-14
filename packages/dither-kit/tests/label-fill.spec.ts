import { describe, expect, it } from "rstack/test"
import { labelFill, renderLabelFill, type LabelVariant } from "../src/engine/label-fill"
import { contrast, type DitherColor, luminance, PALETTE, type Rgb } from "../src/engine/palette"
import { screenMatrix } from "../src/engine/pixel"
import { renderDitherButton } from "../src/engine/precompile"
import type { RasterBuffer } from "../src/engine/raster"

// Every label the kit prints on a dithered fill, measured as the walk
// measures the page: the cells under the label's line box, laid over the
// page as a canvas shows them (the stored colour at its alpha), read as
// their mean in linear light, against the ink the component picks.

/** Each theme's grounds a demo sits on and the ink a label takes there. */
const THEMES: { name: string; grounds: Rgb[]; ink: (darkInk: boolean) => Rgb[] }[] = [
  {
    name: "dark",
    // the kit's page, the docs' page, the docs' card
    grounds: [
      [0x08, 0x09, 0x0b],
      [0x10, 0x12, 0x14],
      [0x17, 0x19, 0x1c],
    ],
    // the docs' bone and the kit's own, or black
    ink: (darkInk) =>
      darkInk
        ? [[0, 0, 0]]
        : [
            [0xe4, 0xe1, 0xd8],
            [0xed, 0xed, 0xed],
          ],
  },
  {
    name: "light",
    grounds: [
      [0xff, 0xff, 0xff],
      [0xf2, 0xf3, 0xf4],
    ],
    ink: (darkInk) => (darkInk ? [[0, 0, 0]] : [[0x0a, 0x0a, 0x0a]]),
  },
]

/** The label's ground: rows `band` of the raster inside its padding. */
function ground(raster: RasterBuffer, page: Rgb, band: [number, number]): number {
  const { width, data } = raster
  let sum = 0
  let n = 0
  for (let y = band[0]; y < band[1]; y++)
    for (let x = 2; x < width - 2; x++) {
      const i = (y * width + x) * 4
      const a = data[i + 3]! / 255
      sum += luminance([0, 1, 2].map((k) => data[i + k]! * a + page[k]! * (1 - a)) as Rgb)
      n++
    }
  return sum / n
}

/** A label's line box, centred: `text` cells tall of `rows`. */
const centred = (rows: number, text: number): [number, number] => {
  const top = Math.floor((rows - text) / 2)
  return [top, top + text]
}

type Fill = {
  name: string
  variants: LabelVariant[]
  /** The fill at `rows` cells tall, `seed` its label matrix's. */
  raster: (color: DitherColor, variant: LabelVariant, rows: number, seed?: number) => RasterBuffer
  darkInk: (color: DitherColor, variant: LabelVariant, seed?: number) => boolean
  /** Its heights in cells and its label's line box in cells at each. */
  sizes: [rows: number, text: number][]
}

const VARIANTS: LabelVariant[] = ["gradient", "solid", "dotted", "hatched"]
const FILLS: Fill[] = [
  {
    // 9-10px type on a 2px cell, a line box of 11-13px, the badge 15-26px tall
    name: "DitherBadge",
    variants: VARIANTS,
    raster: (color, variant, rows, seed) =>
      renderLabelFill(
        32,
        rows,
        PALETTE[color].fill,
        variant,
        labelFill(PALETTE[color].fill, variant, "straight", screenMatrix("bayer", seed)).tone,
        screenMatrix("bayer", seed),
      ),
    darkInk: (color, variant, seed) =>
      labelFill(PALETTE[color].fill, variant, "straight", screenMatrix("bayer", seed)).darkInk,
    sizes: [
      [8, 6],
      [9, 6],
      [10, 6],
      [11, 7],
      [12, 7],
      [13, 7],
    ],
  },
  {
    // 12px type, a 16px line, the toggle 28-40px tall
    name: "DitherToggle",
    variants: ["gradient"],
    raster: (color, _variant, rows, seed) =>
      renderLabelFill(
        32,
        rows,
        PALETTE[color].fill,
        "gradient",
        labelFill(PALETTE[color].fill, "gradient", "straight", screenMatrix("bayer", seed)).tone,
        screenMatrix("bayer", seed),
      ),
    darkInk: (color, _variant, seed) =>
      labelFill(PALETTE[color].fill, "gradient", "straight", screenMatrix("bayer", seed)).darkInk,
    sizes: [
      [14, 8],
      [16, 8],
      [18, 8],
      [20, 8],
    ],
  },
  {
    // 12px type, a 16px line, the button 32-48px tall
    name: "DitherButton",
    variants: VARIANTS,
    raster: (color, variant, rows, seed) =>
      renderDitherButton({ width: 64, height: rows * 2, cell: 2, color, variant, seed }),
    darkInk: (color, variant, seed) =>
      labelFill(PALETTE[color].fill, variant, "premultiplied", screenMatrix("bayer", seed)).darkInk,
    sizes: [
      [16, 8],
      [20, 8],
      [24, 8],
    ],
  },
]

describe("a label on a dithered fill reads at AA", () => {
  for (const fill of FILLS)
    for (const theme of THEMES)
      it(`${fill.name}, every colour and variant, in ${theme.name}`, () => {
        const below: string[] = []
        for (const color of Object.keys(PALETTE) as DitherColor[])
          for (const variant of fill.variants)
            for (const seed of [undefined, 3, 42])
              for (const [rows, text] of fill.sizes) {
                const raster = fill.raster(color, variant, rows, seed)
                for (const page of theme.grounds)
                  for (const ink of theme.ink(fill.darkInk(color, variant, seed))) {
                    const r = contrast(luminance(ink), ground(raster, page, centred(rows, text)))
                    if (r < 4.5) below.push(`${color} ${variant} seed ${seed} ${rows} rows: ${r.toFixed(2)}:1`)
                  }
              }
        expect(below).toEqual([])
      })
})

describe("labelFill", () => {
  it("keeps a fill that already reads at AA as drawn", () => {
    expect(labelFill(PALETTE.blue.fill, "gradient", "straight")).toEqual({ tone: 1, darkInk: false })
    expect(labelFill(PALETTE.orange.fill, "solid", "premultiplied")).toEqual({ tone: 1, darkInk: true })
  })

  it("moves a fill between the inks the least way that reaches AA", () => {
    // green's gradient badge, too bright for bone and too dark for black,
    // lifts a little to black's side rather than dimming far to bone's
    const green = labelFill(PALETTE.green.fill, "gradient", "straight")
    expect(green.darkInk).toBe(true)
    expect(green.tone).toBeGreaterThan(1)
    expect(green.tone).toBeLessThan(1.1)
    // the grey solid button on a light page dims until its ink reads
    const grey = labelFill(PALETTE.grey.fill, "solid", "premultiplied")
    expect(grey.darkInk).toBe(false)
    expect(grey.tone).toBeLessThan(1)
    expect(grey.tone).toBeGreaterThan(0.75)
  })
})
