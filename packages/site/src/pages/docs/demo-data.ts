// What the docs' galleries share beside their examples (each example holds
// its own data): the months a chart's axis reads, the area fills a gallery
// offers, a small wave for the tiles, the palette's names.
import type { AreaVariant, DitherColor } from "@dither-ui/kit"

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
export const VARIANTS: AreaVariant[] = ["gradient", "dotted", "hatched", "solid"]

export const wave = Array.from({ length: 20 }, (_, i) => 5 + Math.sin(i * 0.6) * 2.2 + Math.sin(i * 1.4) * 1)
export const COLORS: DitherColor[] = ["green", "blue", "purple", "pink", "orange", "red", "grey"]
