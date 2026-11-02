// A share card's art: the kit's poster, printed by the kit's own engine
// (`dither-kit/engine/poster.ts`, what the hero's `DitherPoster` runs) at
// the card's print size, cell for cell. A card's seed picks the poster's
// composition and its printer's screen; the loop's phase slides the screen
// inside the diamond, as the hero's print does.
import { fillOf, SCREEN_KINDS, type ScreenKind } from "@dither-kit/engine/pixel"
import type { Rgb } from "@dither-kit/engine/palette"
import { paintPoster, posterLayout } from "@dither-kit/engine/poster"
import { createRasterBuffer, type RasterBuffer } from "@dither-kit/engine/raster"
import { OG_DRIFT, OG_PRINT, OG_PRINT_INKS, type OgCard } from "./og-card"

/** The printer's screen a card prints through, picked by its seed (the
 * hero's seed lands on Bayer, as the hero prints). */
export function ogScreen(card: Pick<OgCard, "seed">): ScreenKind {
  return SCREEN_KINDS[card.seed % SCREEN_KINDS.length]
}

/** The print's inks as colours, by night or by day. */
export function ogInks(card: Pick<OgCard, "inv">): Rgb[] {
  return OG_PRINT_INKS[card.inv ? "day" : "night"].map((c) => fillOf(c))
}

/** The print at loop phase `phase` (0 to 1): one pixel a cell, clear where
 * the card's ground shows through. */
export function ogPrint(card: Pick<OgCard, "seed" | "inv">, phase: number): RasterBuffer {
  const buffer = createRasterBuffer(OG_PRINT.cols, OG_PRINT.rows)
  const inks = ogInks(card)
  paintPoster(
    buffer,
    posterLayout(card.seed, inks.length),
    { inks, ground: null, screen: ogScreen(card), speed: 1 },
    phase * OG_DRIFT,
  )
  return buffer
}
