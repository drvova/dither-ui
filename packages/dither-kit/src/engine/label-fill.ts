// A label on a dithered fill (the badge, the toggle, the button): the fill's
// cells at rest, and the one rule that keeps its label at AA. The rule picks
// the fill's tone and the label's ink together: a fill whose ground would
// leave both inks under 4.5:1 is printed at the tone where one of them
// reaches it, on a dark page and a light one alike.

import type { Rgb } from "./palette"
import { BAYER4 } from "./pixel"
import { createRasterBuffer, type RasterBuffer } from "./raster"

export type LabelVariant = "gradient" | "solid" | "dotted" | "hatched"

/** How a painter stores its colour: as given beside its alpha (the badge,
 * the toggle), or already scaled by it (the button), which a page shows
 * as the colour times alpha twice. */
export type LabelStorage = "straight" | "premultiplied"

/** WCAG AA for text under 24px. */
export const LABEL_CONTRAST = 4.5

/** The grounds a kit label is read on, each theme's darkest and lightest:
 * the kit's dark page `#08090b` to a docs card `#17191c`, a light well
 * `#f2f3f4` to white. */
export const LABEL_GROUNDS: { dark: readonly Rgb[]; light: readonly Rgb[] } = {
  dark: [
    [0x08, 0x09, 0x0b],
    [0x17, 0x19, 0x1c],
  ],
  light: [
    [0xf2, 0xf3, 0xf4],
    [0xff, 0xff, 0xff],
  ],
}

/** The inks a label takes: the dark theme's own, as dim as a theme sets it
 * (the docs' bone `#e4e1d8`; the kit's `#ededed` is brighter), black on a
 * bright fill, and the light theme's own `#0a0a0a`. */
export const LABEL_INKS: { light: Rgb; black: Rgb; dark: Rgb } = {
  light: [0xe4, 0xe1, 0xd8],
  black: [0, 0, 0],
  dark: [0x0a, 0x0a, 0x0a],
}

/** A row's density: the gradient rises down the fill, the rest stand at one. */
export const labelDensity = (variant: LabelVariant, y: number, rows: number): number =>
  variant === "gradient" ? 0.25 + 0.75 * ((y + 0.5) / rows) : variant === "dotted" ? 0.5 : 0.75

/** A cell's alpha before its tone: lit cells at k, unlit at 0.4k, the dotted
 * and hatched gaps 0. `intensity` is the button's hover and press (0 at rest). */
export function labelAlpha(
  variant: LabelVariant,
  density: number,
  x: number,
  y: number,
  threshold: number,
  intensity = 0,
): number {
  if (variant === "hatched" && ((x + y) & 3) >= 2) return 0
  const lit = variant === "solid" || density > threshold - 0.1 * intensity - (variant === "dotted" ? 0.12 : 0)
  if (variant === "dotted" && !lit) return 0
  const k = (0.3 + density * 0.7) * (1 + 0.22 * intensity)
  return lit ? k : k * 0.4
}

/** The badge's and the toggle's fill at rest, straight alpha, at `tone`:
 * the cells, then the 1px edge laid over them at half alpha. */
export function renderLabelFill(
  cols: number,
  rows: number,
  fill: Rgb,
  variant: LabelVariant,
  tone: number,
  matrix: number[][] = BAYER4,
  target?: RasterBuffer,
): RasterBuffer {
  const buffer = target?.width === cols && target.height === rows ? target : createRasterBuffer(cols, rows)
  const d = buffer.data
  d.fill(0)
  const edge = 0.5 * tone
  for (let y = 0; y < rows; y++) {
    const density = labelDensity(variant, y, rows)
    for (let x = 0; x < cols; x++) {
      let a = Math.min(1, labelAlpha(variant, density, x, y, matrix[y & 3][x & 3]) * tone)
      // The edge over the cell, source-over: one fill, so only alpha adds.
      if (y === 0 || x === 0 || y === rows - 1 || x === cols - 1) a = edge + a * (1 - edge)
      if (!(a > 0)) continue
      const i = (y * cols + x) * 4
      d[i] = fill[0]
      d[i + 1] = fill[1]
      d[i + 2] = fill[2]
      d[i + 3] = Math.round(a * 255)
    }
  }
  return buffer
}

const lin = (c: number) => {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}
const luminance = (c: Rgb) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2])
const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)

/** The kit's labelled fills as they stand, in cells (2px each): a fill's
 * height and its label's line box across its middle. A badge's 9-10px type
 * on a 15-26px fill, a toggle's and a button's 12px type (a 16px line) on
 * a 28-48px one. */
export const LABEL_SIZES: readonly (readonly [rows: number, text: number])[] = [
  [8, 6],
  [9, 6],
  [10, 6],
  [11, 7],
  [12, 7],
  [13, 7],
  [14, 8],
  [16, 8],
  [18, 8],
  [20, 8],
  [24, 8],
]

/** The ground behind a label `text` cells tall centred on a fill `rows`
 * tall, as the page shows it over `page`: its cells' mean in linear light,
 * across whole periods of the matrix (a wide fill's inside). */
export function labelGround(
  fill: Rgb,
  variant: LabelVariant,
  storage: LabelStorage,
  tone: number,
  matrix: number[][],
  page: Rgb,
  rows: number,
  text: number,
): number {
  let sum = 0
  let n = 0
  const top = Math.floor((rows - text) / 2)
  for (let y = top; y < top + text; y++) {
    const density = labelDensity(variant, y, rows)
    for (let x = 0; x < 4; x++) {
      // in bytes, as the raster holds it
      const a = Math.min(1, labelAlpha(variant, density, x, y, matrix[y & 3][x & 3]) * tone)
      const shown = Math.round(a * 255) / 255
      const ink = (c: number) => (storage === "premultiplied" ? Math.round(c * a) : c)
      sum += luminance([
        ink(fill[0]) * shown + page[0] * (1 - shown),
        ink(fill[1]) * shown + page[1] * (1 - shown),
        ink(fill[2]) * shown + page[2] * (1 - shown),
      ])
      n++
    }
  }
  return sum / n
}

export type LabelFill = {
  /** The fill's tone, 1 as drawn: every cell's alpha is scaled by it. */
  tone: number
  /** Black ink on the dark page: the fill is too bright for the theme's. */
  darkInk: boolean
}

/** Whether a label reads at AA on the fill at `tone` at every size, and in
 * which ink: the light theme's ink on the light grounds, and on the dark
 * ones the theme's own or black, the one that reads better. */
function readsAt(
  fill: Rgb,
  variant: LabelVariant,
  storage: LabelStorage,
  matrix: number[][],
  tone: number,
): LabelFill | null {
  const dark = luminance(LABEL_INKS.dark)
  const light = luminance(LABEL_INKS.light)
  let lightWorst = Infinity
  let blackWorst = Infinity
  for (const [rows, text] of LABEL_SIZES) {
    for (const page of LABEL_GROUNDS.light)
      if (contrast(dark, labelGround(fill, variant, storage, tone, matrix, page, rows, text)) < LABEL_CONTRAST)
        return null
    for (const page of LABEL_GROUNDS.dark) {
      const ground = labelGround(fill, variant, storage, tone, matrix, page, rows, text)
      lightWorst = Math.min(lightWorst, contrast(light, ground))
      blackWorst = Math.min(blackWorst, contrast(0, ground))
    }
  }
  return Math.max(lightWorst, blackWorst) < LABEL_CONTRAST ? null : { tone, darkInk: blackWorst > lightWorst }
}

const fills = new Map<string, LabelFill>()

/** The tone a labelled fill prints at and the ink its label takes, for its
 * colour, variant, storage and label matrix: the tone nearest the fill as
 * drawn (1) at which its label reads at AA at every size, a step of a
 * hundredth either way, down first. A fill that already holds AA keeps its
 * tone; one that sits between the inks (too bright for the light ink, too
 * dark for black) is lifted to black's side or dimmed to the light one's,
 * whichever is the smaller change. Tone 0 is the page itself, so a tone
 * is always found. */
export function labelFill(
  fill: Rgb,
  variant: LabelVariant,
  storage: LabelStorage,
  matrix: number[][] = BAYER4,
): LabelFill {
  const key = `${fill.join()},${variant},${storage},${matrix.flat().join()}`
  const known = fills.get(key)
  if (known) return known
  let found: LabelFill | null = null
  for (let step = 0; !found; step++)
    found =
      readsAt(fill, variant, storage, matrix, (100 - step) / 100) ??
      readsAt(fill, variant, storage, matrix, (100 + step) / 100)
  if (fills.size >= 64) fills.clear()
  fills.set(key, found)
  return found
}
