// A label on a dithered fill (the badge, the toggle, the button): the fill's
// cells at rest, and the one rule that keeps its label at AA. The rule picks
// the fill's tone and the label's ink together: a fill whose ground would
// leave both inks under 4.5:1 is printed at the tone where one of them
// reaches it, on a dark page and a light one alike.

import { contrast, luminance, type Rgb } from "./palette"
import { BAYER4, clamp } from "./pixel"
import { rasterSrc } from "./png"
import { createRasterBuffer, type RasterBuffer } from "./raster"
import { matchTone, toneClass, toneTile, toneVar, type ToneMask, type ToneMatch } from "./tone"

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
/** The rows of square cells a fill `height` px tall holds at `cell` px:
 * whole cells from the top, the last one cut where the box ends. */
export const labelRows = (height: number, cell: number): number => Math.max(1, Math.ceil(height / cell - 1e-6))

export const labelDensity = (variant: LabelVariant, y: number, rows: number): number =>
  variant === "gradient" ? 0.25 + 0.75 * ((y + 0.5) / rows) : variant === "dotted" ? 0.5 : 0.75

/** Whether a cell is lit: every solid cell, else a density past the cell's
 * threshold (the press lowers it, the dotted fill more). */
const labelLit = (variant: LabelVariant, density: number, threshold: number, intensity: number) =>
  variant === "solid" || density > threshold - 0.1 * intensity - (variant === "dotted" ? 0.12 : 0)

/** A lit cell's alpha before its tone (an unlit one's is 0.4 of it). */
const labelK = (density: number, intensity: number) => (0.3 + density * 0.7) * (1 + 0.22 * intensity)

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
  const lit = labelLit(variant, density, threshold, intensity)
  if (variant === "dotted" && !lit) return 0
  const k = labelK(density, intensity)
  return lit ? k : k * 0.4
}

/** A cell's colour and alpha bytes as the fill stores them: straight (the
 * colour as given) or premultiplied (scaled by the alpha). */
function cellBytes(fill: Rgb, storage: LabelStorage, alpha: number): [number, number, number, number] {
  const a = alpha > 1 ? 1 : alpha
  if (storage === "straight") return [fill[0], fill[1], fill[2], Math.round(a * 255)]
  return [(fill[0] * a + 0.5) | 0, (fill[1] * a + 0.5) | 0, (fill[2] * a + 0.5) | 0, (a * 255 + 0.5) | 0]
}

/** Bytes as a CSS colour, its alpha the same byte once a browser reads it. */
const cssInk = ([r, g, b, a]: [number, number, number, number]) => `rgb(${r} ${g} ${b} / ${+(a / 255).toFixed(4)})`

/** One layer of a labelled fill as a stylesheet prints it: a tone (the lit
 * cells, or with `gaps` the unlit ones, the hatch's gaps left out with
 * `hatch`) in one ink, or the gradient's cells as an image four cells wide
 * and the fill's rows tall, stretched down the fill as the canvas was.
 * `names` are its classes, for `tones.css` and the fill's stylesheet. */
export type LabelLayer =
  | {
      kind: "tone"
      names: string
      /** The screen's tile it is, at a shift, when one is (Bayer as it
       * stands, unseeded); a seed's jitter can make cells no tile makes. */
      tone: ToneMatch | null
      /** The lit cells, before `gaps` and `hatch`. */
      mask: ToneMask
      /** The tile as a CSS image: the root's `--dk-t-<screen>-<level>`, or
       * the cells themselves. */
      tile: string
      gaps: boolean
      hatch: boolean
      ink: string
    }
  | { kind: "image"; names: "dk-label-image"; src: string }

/** A labelled fill in CSS: its `labelFill` tone, its layers, bottom first, and the 1-cell edge
 * over them (`over`, straight alpha: laid on the cells) or in their place. */
export type LabelPaint = { tone: number; layers: LabelLayer[]; edge: string; over: boolean }

const images = new Map<string, string>()

/** The gradient's cells, four columns (the matrix's period) by `rows`, as
 * the fill stores them at `tone`: the image its layer prints. */
export function gradientCells(
  fill: Rgb,
  storage: LabelStorage,
  matrix: number[][],
  rows: number,
  intensity: number,
  tone: number,
): RasterBuffer {
  const raster = createRasterBuffer(4, rows)
  for (let y = 0; y < rows; y++) {
    const density = labelDensity("gradient", y, rows)
    for (let x = 0; x < 4; x++)
      raster.data.set(
        cellBytes(fill, storage, labelAlpha("gradient", density, x, y, matrix[y & 3][x & 3], intensity) * tone),
        (y * 4 + x) * 4,
      )
  }
  return raster
}

/** A labelled fill as tone classes print it, cell for cell what
 * `renderLabelFill` (straight) and `renderDitherButton` (premultiplied)
 * paint: at the `labelFill` tone, `rows` cells tall (only the gradient
 * reads it: its density runs down the rows), at `intensity` (the button's
 * hover 1 and press 1.5). */
export function labelPaint(
  fill: Rgb,
  variant: LabelVariant,
  storage: LabelStorage,
  matrix: number[][],
  rows: number,
  intensity = 0,
): LabelPaint {
  const { tone } = labelFill(fill, variant, storage, matrix)
  const edgeAlpha = storage === "straight" ? 0.5 * tone : Math.max(0, Math.min(1, (0.5 + 0.25 * intensity) * tone))
  const edge = cssInk(cellBytes(fill, storage, edgeAlpha))
  const over = storage === "straight"
  if (variant === "gradient") {
    const key = `${fill.join()},${storage},${matrix.flat().join()},${rows},${intensity}`
    let src = images.get(key)
    if (!src) {
      src = rasterSrc(gradientCells(fill, storage, matrix, rows, intensity, tone))
      if (images.size >= 128) images.clear()
      images.set(key, src)
    }
    return { tone, layers: [{ kind: "image", names: "dk-label-image", src }], edge, over }
  }
  const density = labelDensity(variant, 0, rows)
  const k = labelK(density, intensity) * tone
  const lit = matrix.flatMap((row) => row.map((threshold) => labelLit(variant, density, threshold, intensity)))
  const match = matchTone(lit)
  const tile = match ? `var(${toneVar(match.screen, match.level)})` : toneTile(lit)
  const hatch = variant === "hatched"
  const layer = (gaps: boolean, alpha: number): LabelLayer => ({
    kind: "tone",
    // the tile's class (else the bare `dk-tone`, its tile in its style)
    names: [match ? toneClass(match.screen, match.level) : "dk-tone", gaps && "dk-tone-gaps", hatch && "dk-tone-hatch"]
      .filter(Boolean)
      .join(" "),
    tone: match,
    mask: lit,
    tile,
    gaps,
    hatch,
    ink: cssInk(cellBytes(fill, storage, alpha)),
  })
  const layers = [layer(false, k)]
  if (variant === "hatched") layers.unshift(layer(true, k * 0.4))
  return { tone, layers, edge, over }
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
  toward = 0,
): number {
  let sum = 0
  let n = 0
  const top = Math.floor((rows - text) / 2)
  for (let y = top; y < top + text; y++) {
    const density = labelDensity(variant, y, rows)
    for (let x = 0; x < 4; x++) {
      // In bytes as the raster holds them, laid over the page as a browser
      // lays them: the colour scaled by its alpha byte, then the page under
      // it, each rounded to a byte; `toward` moves every byte that far, as
      // an engine that rounds the other way would (a byte toward the ink).
      const a = Math.min(1, labelAlpha(variant, density, x, y, matrix[y & 3][x & 3]) * tone)
      const alpha = Math.round(a * 255)
      const ink = (c: number) => (storage === "premultiplied" ? Math.round(c * a) : c)
      const lay = (c: number, p: number) =>
        clamp(Math.round(Math.round((ink(c) * alpha) / 255) + (p * (255 - alpha)) / 255) + toward, 0, 255)
      sum += luminance([lay(fill[0], page[0]), lay(fill[1], page[1]), lay(fill[2], page[2])])
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
      if (contrast(dark, labelGround(fill, variant, storage, tone, matrix, page, rows, text, -1)) < LABEL_CONTRAST)
        return null
    for (const page of LABEL_GROUNDS.dark) {
      const ground = (toward: number) => labelGround(fill, variant, storage, tone, matrix, page, rows, text, toward)
      lightWorst = Math.min(lightWorst, contrast(light, ground(1)))
      blackWorst = Math.min(blackWorst, contrast(0, ground(-1)))
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
