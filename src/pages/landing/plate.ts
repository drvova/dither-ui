// The plates: print sheets between the landing's sections, each the brand
// small in a wide field. One table sets the series; `Plate.vue` prints a row
// of it. Each plate is tone thinning from its top edge to a clear band and
// rising from it to the foot, the brand (`brand.ts`) standing in the band.
import type { Move, Scene } from "./brand"

/** The plates' stock: the raised ground (`--surface`) as a colour the kit
 * prints with, so the open cells of a plate's print are the plate itself,
 * never a tint. `tests/landing-facts.spec.ts` holds it to the token's mix. */
export const STOCK = "#1c1e1f"

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
}

/** The series, in page order: after the bento a high band and the brand at
 * the left; after the agent's session a low, narrow band and the brand past
 * the middle; before the install the band at the middle. */
export const PLATES = {
  afterExamples: { sky: 0.18, band: [0.24, 0.7], ground: 0.34, mark: [0.26, 0.47], move: "rain" },
  afterAsk: { sky: 0.32, band: [0.5, 0.66], ground: 0.2, mark: [0.56, 0.58], move: "sort" },
  beforeInstall: { sky: 0.25, band: [0.38, 0.62], ground: 0.3, mark: [0.68, 0.5], move: "converge" },
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
