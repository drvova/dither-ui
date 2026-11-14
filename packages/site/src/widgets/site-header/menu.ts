// The header's menu under lg: a sheet of filled bands, one per link,
// each a step of the ink toward the ground, the studio key at the foot in the
// signal. Where two bands meet, the lower climbs into the upper through the
// kit's Bayer matrix, so the sheet reads as one print's tone steps; the key
// that opens it is the same bands in miniature. The menu's sheet stands at
// the screen's foot under the hand (`sheet.ts`); the docs' full-screen
// sections sheet arrives as the kit's wipe, a dithered front down the screen.
import { wipeStyle, type WipeStyle } from "@dither-ui/kit/engine/wipe.ts"

/** The site's links, in order, what each band says under its name, and
 * the width the capsule shows each from (the menu shows all of them). Each
 * site supplies only the addresses, keyed by `id`. */
export const MENU_LINKS = [
  { id: "components", label: "Components", note: "Every card is the real thing, so poke it", from: "md" },
  { id: "docs", label: "Docs", note: "Props, code and a live preview for every part", from: "md" },
  { id: "agents", label: "Agents", note: "Ask for a screen and watch it land", from: "md" },
  { id: "github", label: "GitHub", note: "The source, MIT licensed", from: "lg" },
] as const

export type MenuLinkId = (typeof MENU_LINKS)[number]["id"]

/** The foot band: the studio, which wants a wide screen and says so. */
export const STUDIO_LINK = { label: "Open studio", note: "An infinite canvas, best from 1024px wide" } as const

/** The darkest step a band takes: the ink's share of its fill. The ground's
 * own colour writes on every band, AA down to this floor in both themes
 * (`tests/theme-contrast.spec.ts` holds it). */
export const BAND_FLOOR = 64

/** Band `i` of `n`'s ink share: even steps from the full ink to the floor. */
export const bandInk = (i: number, n: number) =>
  Math.round(100 - (Math.min(i, n - 1) * (100 - BAND_FLOOR)) / Math.max(1, n - 1))

/** The menu's link bands, top to bottom (100/88/76/64). */
export const BAND_INK = MENU_LINKS.map((_, i) => bandInk(i, MENU_LINKS.length))

/** A band's fill: its step of the ink toward the ground, `n` bands in all
 * (the menu's links unless told). */
export const bandFill = (i: number, n: number = MENU_LINKS.length) =>
  `color-mix(in srgb, var(--foreground) ${bandInk(i, n)}%, var(--background))`

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

/** How a full-screen sheet (the docs' sections) arrives: the kit's wipe
 * down the screen on the glide (full speed from the start, landing soft).
 * It leaves the same way played back, rolling up from the foot. */
export const SHEET_WIPE = { direction: "down", duration: 0.5, cell: 4, band: 10, easing: "glide" } as const

/** The close mark: an X on the brand diamond's 7x7 grid, as dense as the
 * diamond (each stroke two cells where it can be), its crossing the ember
 * core (`*`), so the key that shuts a sheet speaks the brand's pixel. */
const CLOSE_ROWS = ["#.....#", "##...##", ".##.##.", "..#*#..", ".##.##.", "##...##", "#.....#"]
export const CLOSE_CELLS: readonly { x: number; y: number; core?: boolean }[] = CLOSE_ROWS.flatMap((row, y) =>
  [...row].flatMap((c, x) => (c === "#" ? [{ x, y }] : c === "*" ? [{ x, y, core: true }] : [])),
)

/** A sheet's head stands where the header stood with room under its capsule
 * for the first band's seam, so the seam never bites into the capsule. */
export const SHEET_HEAD_FOOT = 8 + SEAM_HEIGHT

/** Where the menu is: shut, up, or on its way down before it shuts. */
export type MenuPhase = "shut" | "open" | "leaving"

/** The seam over a band filled `fill`: the band climbing into the one above
 * it, as an inline style whole (placed, masked, filled), so any sheet's
 * bands take it; the band is its positioned box. */
export const seamStyle = (fill: string) =>
  `${maskCss(SEAM_MASK)};position:absolute;inset-inline:0;top:-${SEAM_HEIGHT}px;height:${SEAM_HEIGHT}px;pointer-events:none;background:${fill}`

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
