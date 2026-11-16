// The site's sprite as a file (`sprite.ts` says what it is for): every kit
// glyph as the kit writes its symbols, every tool's mark with its paths as
// its owner draws them, and the brand mark and the mascot's parts from
// their cell tables, each ink's cells merged into one path. Read by the
// `siteFiles` plugin under Node, so its imports carry their extensions.
import { iconSymbols } from "@dither-ui/kit/engine/icons.ts"
import { crc32 } from "@dither-ui/kit/engine/png.ts"
import { MARK_CELLS } from "./brand-mark.ts"
import { runPaths } from "./cells.ts"
import { type MarkId, MARKS } from "./marks.ts"
import { MASCOT_H, MASCOT_ROTOR_STEPS, MASCOT_W, type MascotCell, mascotParts } from "./mascot.ts"
import { BRAND_SYMBOL, MASCOT_SYMBOLS, markSymbol } from "./sprite.ts"

/** The ember: the one signal ink, wherever the page sets it. */
const EMBER = "fill:var(--signal,var(--swatch-orange))"

/** A cell picture as a symbol: the ink in the `<use>`'s `currentColor`,
 * the ember in the signal. */
function cellSymbol(id: string, w: number, h: number, cells: readonly { x: number; y: number; ember: boolean }[]) {
  const paths = runPaths(cells, (c) => (c.ember ? "ember" : "ink"))
    .map((p) =>
      p.paint === "ember" ? `<path style="${EMBER}" d="${p.d}"/>` : `<path fill="currentColor" d="${p.d}"/>`,
    )
    .join("")
  return `<symbol id="${id}" viewBox="0 0 ${w} ${h}">${paths}</symbol>`
}

const mascot = (id: string, cells: readonly MascotCell[]) =>
  cellSymbol(
    id,
    MASCOT_W,
    MASCOT_H,
    cells.map((c) => ({ x: c.x, y: c.y, ember: c.ink === "ember" })),
  )

function markSymbols(): string {
  return (Object.keys(MARKS) as MarkId[])
    .map((id) => {
      const mark = MARKS[id]
      const rule = "evenodd" in mark ? ' fill-rule="evenodd"' : ""
      return `<symbol id="${markSymbol(id)}" viewBox="${mark.viewBox}"${rule}>${mark.d.map((d) => `<path d="${d}"/>`).join("")}</symbol>`
    })
    .join("")
}

/** The sprite's text. */
export function spriteSvg(): string {
  const standing = mascotParts("idle")
  const rotor = Array.from({ length: MASCOT_ROTOR_STEPS }, (_, turn) =>
    mascot(MASCOT_SYMBOLS.rotor(turn), mascotParts("fly", turn).top),
  )
  return [
    `<svg xmlns="http://www.w3.org/2000/svg">`,
    iconSymbols(),
    markSymbols(),
    cellSymbol(
      BRAND_SYMBOL,
      7,
      7,
      MARK_CELLS.map((c) => ({ x: c.x, y: c.y, ember: c.core })),
    ),
    mascot(MASCOT_SYMBOLS.body, standing.body),
    mascot(MASCOT_SYMBOLS.feet, standing.feet),
    mascot(MASCOT_SYMBOLS.antennae, standing.top),
    mascot(MASCOT_SYMBOLS.wave, mascotParts("wave").top),
    ...rotor,
    `</svg>`,
  ].join("")
}

/** The sprite as the build writes it: under the build's assets, named by
 * its content, so a page caches it for good and the Studio's worker keeps
 * it with the page's other assets. */
export function spriteFile(): { path: string; svg: string } {
  const svg = spriteSvg()
  const hash = crc32(new TextEncoder().encode(svg)).toString(16).padStart(8, "0")
  return { path: `_build/assets/sprite-${hash}.svg`, svg }
}
