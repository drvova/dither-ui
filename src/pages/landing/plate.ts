// The plates: print sheets between the landing's sections, each the kit's
// diamond small in a wide field. One table sets the series; `Plate.vue`
// prints a row of it. Each plate is tone thinning from its top edge to a
// clear band and rising from it to the foot, the mark standing in the band.

/** The brand mark: the kit's 7x7 dithered diamond, its ember core drawn
 * apart. The header carries it too. */
export const MARK = "M3 0h1v1h1v1h1v1h1v1h-1v1h-1v1h-1v1h-1v-1h-1v-1h-1v-1h-1v-1h1v-1h1v-1h1z"

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
  /** Where the mark's centre stands, as fractions of the width and height. */
  mark: readonly [number, number]
}

/** The series, in page order: after the bento a high band and the mark at
 * the left; after the agent's session a low, narrow band and the mark at
 * the right; before the install the band at the middle. */
export const PLATES = {
  afterExamples: { sky: 0.18, band: [0.24, 0.7], ground: 0.34, mark: [0.26, 0.47] },
  afterAsk: { sky: 0.32, band: [0.5, 0.66], ground: 0.2, mark: [0.84, 0.58] },
  beforeInstall: { sky: 0.25, band: [0.38, 0.62], ground: 0.3, mark: [0.68, 0.5] },
} as const satisfies Record<string, Plate>
