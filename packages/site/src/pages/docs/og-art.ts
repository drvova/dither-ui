// A share card's art: the kit's poster, printed by the kit's own engine
// (`dither-kit/engine/poster.ts`, what the hero's `DitherPoster` runs) at
// the card's print size, cell for cell. A card's seed picks the poster's
// composition and its printer's screen. Over the loop the diamond swells
// over the whole sheet and recedes (the poster's own rule, every ramp
// turned over inside the mark, at the scale of the sheet), and the screen
// slides inside it as the hero's print does.
import { fillOf, SCREEN_KINDS, type ScreenKind } from "dither-kit/engine/pixel.ts"
import type { Rgb } from "dither-kit/engine/palette.ts"
import { paintPoster, posterLayout } from "dither-kit/engine/poster.ts"
import { createRasterBuffer, type RasterBuffer } from "dither-kit/engine/raster.ts"
import { spring } from "dither-kit/engine/spring.ts"
import { OG_BEATS, OG_DRIFT, OG_PRINT, OG_PRINT_INKS, type OgCard } from "./og-card"

/** The printer's screen a card prints through, picked by its seed (the
 * hero's seed lands on Bayer, as the hero prints). */
export function ogScreen(card: Pick<OgCard, "seed">): ScreenKind {
  return SCREEN_KINDS[card.seed % SCREEN_KINDS.length]
}

/** The print's inks as colours, by night or by day. */
export function ogInks(card: Pick<OgCard, "inv">): Rgb[] {
  return OG_PRINT_INKS[card.inv ? "day" : "night"].map((c) => fillOf(c))
}

/** How far the diamond has swelled at loop phase `phase`: 0 at its own
 * size, 1 over the whole sheet; it grows and recedes on the kit's spring. */
export function ogSwell(phase: number): number {
  const p = phase - Math.floor(phase)
  const { swell, over, recede, rest } = OG_BEATS
  if (p < swell || p >= rest) return 0
  if (p < over) return spring((p - swell) / (over - swell))
  if (p < recede) return 1
  return 1 - spring((p - recede) / (rest - recede))
}

/** The mark's reach, as a share of the sheet's shorter side, that covers the
 * whole sheet from its middle (its half perimeter, and a cell). */
const COVER = ((OG_PRINT.cols + OG_PRINT.rows) / 2 + 1) / Math.min(OG_PRINT.cols, OG_PRINT.rows)

/** The print at loop phase `phase` (0 to 1): one pixel a cell, clear where
 * the card's ground shows through. */
export function ogPrint(card: Pick<OgCard, "seed" | "inv">, phase: number): RasterBuffer {
  const buffer = createRasterBuffer(OG_PRINT.cols, OG_PRINT.rows)
  const inks = ogInks(card)
  const layout = posterLayout(card.seed, inks.length)
  const r = layout.mark.r + (COVER - layout.mark.r) * ogSwell(phase)
  paintPoster(
    buffer,
    { ...layout, mark: { ...layout.mark, r } },
    { inks, ground: null, screen: ogScreen(card), speed: 1 },
    phase * OG_DRIFT,
  )
  return buffer
}
