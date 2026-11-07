// The plates: print sheets between the landing's sections, each the brand
// small in a wide field. One table sets the series; `Plate.vue` prints a row
// of it. Each plate is a sheet of the heat thinning from its top edge to a
// clear band and rising from it to the foot, the brand (`brand.ts`)
// standing in the band.
import type { PixelColor, ScreenKind } from "@dither-kit"
import type { Move, Scene } from "./brand"
import { plateau, type HeatField, type HeatGrain } from "./heat"

/** The plates' stock: the raised ground (`--surface`) as a colour the kit
 * prints with, so the open cells of a plate's print are the plate itself,
 * never a tint. `tests/landing-facts.spec.ts` holds it to the token's mix. */
export const STOCK = "#1c1e1f"

/** The page's ground, as a colour the kit prints with. */
export const GROUND = "#101214"

/** The print's inks: the kit's blue, the ember and the page's own bone ink.
 * The hero's poster prints them; the footer's road ramps through them. */
export const INKS: PixelColor[] = ["blue", "orange", "#e4e1d8"]

/** Dark to light: the ground, then the print's inks, so brightness 1/3,
 * 2/3 and 1 print blue, the ember and bone. The footer's road and the
 * close's heat print through it. */
export const RAMP: PixelColor[] = [GROUND, ...INKS]

/** Coolest first, the print's inks as the pointer's trail wears them:
 * landing hot in the orange, cooling through the bone to the blue. */
export const TRAIL: PixelColor[] = [INKS[0], INKS[2], INKS[1]]

export type Plate = {
  /** The clear band's top and foot, as fractions of the plate's height:
   * the heat prints above and below it, hottest at the sheet's edges. */
  band: readonly [number, number]
  /** Where the mark's centre stands, as fractions of the width and height;
   * the wordmark reads on to its right. */
  mark: readonly [number, number]
  /** How the brand forms on this plate, its own among the page's. */
  move: Move
  /** The sheet's width over its height: each plate its own proportion. */
  aspect: number
  /** The printer's screen its heat prints through, each plate its own. */
  screen: ScreenKind
  /** Its heat's grain: finer folds than the close's for a short sheet, in
   * its own region of the noise, read for a balanced mix of inks. */
  grain: HeatGrain
}

/** The series, in page order, two plates unlike each other, each a sheet of
 * the heat (`heat.ts`) so the material builds up through the page to the
 * close: after the bento a sheet of 3.4 with a high band, the brand at the
 * left, printed in the kit's Bayer cells; after the three parts a slimmer
 * sheet of 4.6 with the band at the middle, the brand right of centre, in a
 * halftone dot. */
export const PLATES = {
  afterExamples: {
    band: [0.24, 0.7],
    mark: [0.26, 0.47],
    move: "rain",
    aspect: 3.4,
    screen: "bayer",
    grain: { scale: 260, at: [8.5, 3] },
  },
  afterParts: {
    band: [0.34, 0.66],
    mark: [0.66, 0.5],
    move: "converge",
    aspect: 4.6,
    screen: "dot",
    grain: { scale: 260, at: [23.8, 3] },
  },
} as const satisfies Record<string, Plate>

/** Where a plate's heat prints: a cloud above the band and one below it,
 * each rising out of nothing and sinking back, thinning to nothing at the
 * plate's ends too, so it never shows a box's edge; never in the band,
 * where the brand forms. */
export const plateField =
  (plate: Plate): HeatField =>
  (x, y, width, height) => {
    const v = y / height
    const clouds = Math.max(plateau(0, plate.band[0], v), plateau(plate.band[1], 1, v))
    const field = clouds * plateau(0, width, x, 0.16)
    return { field, boost: 0.03 * field }
  }

/** A plate's scene for the brand's moment, in a plate `height` px tall: its
 * own move; the cells lie loose in the band and the tone's thin edges
 * (`EDGE` of the height either side); seeded by where the mark stands. */
const EDGE = 0.08
export const sceneOf = (plate: Plate, height: number): Scene => ({
  move: plate.move,
  seed: Math.round((plate.mark[0] * 997 + plate.mark[1] * 131) * 1e3),
  loose: [(plate.band[0] - EDGE) * height, (plate.band[1] + EDGE) * height],
  burst: [0, height],
})
