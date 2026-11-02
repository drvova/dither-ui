// The header's menu under lg, one table for both sites (the Svelte landing
// carries this file byte for byte): a sheet of filled bands, one per link,
// each a step of the ink toward the ground, the studio key at the foot in the
// signal. Where two bands meet, the lower climbs into the upper through the
// kit's Bayer matrix, so the sheet reads as one print's tone steps; the key
// that opens it is the same bands in miniature. The sheet arrives as the
// kit's wipe, a dithered front down the screen.
import { wipeStyle, type WipeStyle } from "@dither-kit/engine/wipe"

/** Ink share of each link band, top to bottom. The ground's own colour
 * writes on them, AA on every step in both themes (64% is the floor;
 * `tests/theme-contrast.spec.ts` holds it). */
export const BAND_INK = [100, 88, 76, 64] as const

/** A link band's fill: its step of the ink toward the ground (the last step
 * for any band past the table). */
export const bandFill = (i: number) =>
  `color-mix(in srgb, var(--foreground) ${BAND_INK[Math.min(i, BAND_INK.length - 1)]}%, var(--background))`

/** The foot band's fill: the signal, the page's one accent. */
export const STUDIO_FILL = "var(--signal, var(--swatch-orange))"

/** The seam: four dither densities, one cell of `SEAM_CELL` px each. */
export const SEAM_CELL = 3
export const SEAM_HEIGHT = SEAM_CELL * 4

/** Below this width the menu key shows (the capsule holds every link from
 * it up); the sheet closes when the window grows past it. */
export const MENU_WIDE = 1024

/** The seam's mask: the lower band's fill climbing into the upper one,
 * densest at its foot. As wide as the widest window the sheet shows in. */
export const SEAM_MASK = wipeStyle(0.5, {
  direction: "up",
  cell: SEAM_CELL,
  band: 4,
  width: MENU_WIDE,
  height: SEAM_HEIGHT,
}) as WipeStyle

/** How the sheet arrives: the kit's wipe down the screen, at one steady pace. */
export const SHEET_WIPE = { direction: "down", duration: 0.32, cell: 4, band: 10 } as const

/** A mask as an inline style, both spellings (WebKit reads the prefixed). */
export const maskCss = (m: WipeStyle | null) =>
  m
    ? (["", "-webkit-"] as const)
        .map(
          (p) =>
            `${p}mask-image:${m.image};${p}mask-size:${m.size};${p}mask-repeat:${m.repeat};${p}mask-position:${m.position}`,
        )
        .join(";")
    : ""
