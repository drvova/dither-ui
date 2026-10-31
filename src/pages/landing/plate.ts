// The plates: print sheets between the landing's sections, each the brand
// small in a wide field. One table sets the series; `Plate.vue` prints a row
// of it. Each plate is tone thinning from its top edge to a clear band and
// rising from it to the foot, the brand (`brand.ts`) standing in the band.
import type { PixelColor, ScreenKind } from "@dither-kit"
import type { Move, Scene } from "./brand"

/** The plates' stock: the raised ground (`--surface`) as a colour the kit
 * prints with, so the open cells of a plate's print are the plate itself,
 * never a tint. `tests/landing-facts.spec.ts` holds it to the token's mix. */
export const STOCK = "#1c1e1f"

/** The page's ground, as a colour the kit prints with. */
export const GROUND = "#101214"

/** The print's inks: the kit's blue, the ember and the page's own bone ink.
 * The hero's poster prints them; the footer's road ramps through them. */
export const INKS: PixelColor[] = ["blue", "orange", "#e4e1d8"]

export type Plate = {
  /** The tone at the top edge (0 to 1), thinning to nothing at the band. */
  sky: number
  /** The clear band's top and foot, as fractions of the plate's height. */
  band: readonly [number, number]
  /** The tone at the foot, rising from nothing at the band's foot. */
  ground: number
  /** Where the mark's centre stands, as fractions of the width and height;
   * the wordmark reads on to its right. */
  mark: readonly [number, number]
  /** How the brand forms on this plate, its own among the page's. */
  move: Move
  /** The sheet's width over its height: each plate its own proportion. */
  aspect: number
  /** The printer's screen its tone prints through, each plate its own. */
  screen: ScreenKind
}

/** The series, in page order, two plates unlike each other: after the bento
 * a sheet of 3.4 with a high band, the brand at the left and the tone in the
 * kit's Bayer cells; before the install a slimmer sheet of 4.6 with the band
 * at the middle, the brand right of centre and the tone in a halftone dot. */
export const PLATES = {
  afterExamples: {
    sky: 0.18,
    band: [0.24, 0.7],
    ground: 0.34,
    mark: [0.26, 0.47],
    move: "rain",
    aspect: 3.4,
    screen: "bayer",
  },
  beforeInstall: {
    sky: 0.25,
    band: [0.34, 0.66],
    ground: 0.3,
    mark: [0.66, 0.5],
    move: "converge",
    aspect: 4.6,
    screen: "dot",
  },
} as const satisfies Record<string, Plate>

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
