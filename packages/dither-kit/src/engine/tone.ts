// The dither as CSS: a 4x4 matrix holds 17 tones (none of its cells lit to
// all sixteen), so every print screen's tones are 17 tiles of four by four
// cells, which a stylesheet tiles at the cell's size in any ink and a server
// renders with no canvas. `tones.css` (generated from this module, pinned by
// `tests/tones.spec.ts`) declares each tile once as a custom property on the
// root, `--dk-t-<screen>-<level>`, and a class per tile, `dk-tone-<screen>-
// <level>`, that prints its lit cells in `--dk-tone-ink` at `--dk-cell`;
// `tonePatterns` is the same set as SVG `<pattern>`s for an SVG fill.

import { SCREEN_KINDS, SCREENS, type ScreenKind } from "./pixel"

/** A 4x4 matrix's tones: 0 (no cell lit) to 16 (every cell). */
export const TONE_LEVELS = 17

/** Sixteen cells, row by row: lit or not. */
export type ToneMask = readonly boolean[]

/** The cells a density lights through a matrix: those whose threshold it
 * passes, as every painter tests them (`density > matrix[y & 3][x & 3]`). */
export function toneMask(matrix: number[][], density: number): ToneMask {
  return matrix.flatMap((row) => row.map((threshold) => density > threshold))
}

/** A screen's tone `level`: its `level` lowest ranks lit. */
export const screenTone = (screen: ScreenKind, level: number): ToneMask => toneMask(SCREENS[screen], level / 16)

/** A mask moved `x` cells right and `y` down, wrapping as a tile does. */
export const shiftMask = (mask: ToneMask, x: number, y: number): ToneMask =>
  mask.map((_, i) => mask[(((i >> 2) - y + 4) & 3) * 4 + (((i & 3) - x + 4) & 3)])

/** A tile's lit cells as one SVG path, a run of a row at a time. */
function tilePath(mask: ToneMask): string {
  let d = ""
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 4; x++) {
      if (!mask[y * 4 + x] || (x > 0 && mask[y * 4 + x - 1])) continue
      let w = 1
      while (x + w < 4 && mask[y * 4 + x + w]) w++
      d += `M${x} ${y}h${w}v1h-${w}z`
    }
  return d
}

/** A tile as a CSS `url()`: an SVG of its lit cells, opaque, four user units
 * a side, so a mask or a background sizes it to four cells. */
export function toneTile(mask: ToneMask): string {
  const d = tilePath(mask)
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='4' height='4' shape-rendering='crispEdges'>${d ? `<path d='${d}'/>` : ""}</svg>`
  return `url("data:image/svg+xml,${svg.replace(/</g, "%3C").replace(/>/g, "%3E")}")`
}

/** Where a mask stands among the screens' tiles: the screen, its level and
 * the shift (in cells) that lays the tile on it, Bayer and no shift first;
 * null for a mask no tile makes (a seed's jitter can reorder a matrix's
 * ranks, which no shift of a tile gives). */
export type ToneMatch = { screen: ScreenKind; level: number; x: number; y: number }
export function matchTone(mask: ToneMask): ToneMatch | null {
  const lit = mask.filter(Boolean).length
  for (const screen of SCREEN_KINDS) {
    const tile = screenTone(screen, lit)
    for (let s = 0; s < 16; s++) {
      const shifted = shiftMask(tile, s & 3, s >> 2)
      if (shifted.every((v, i) => v === mask[i])) return { screen, level: lit, x: s & 3, y: s >> 2 }
    }
  }
  return null
}

/** The custom property that holds a screen's tile at a level. */
export const toneVar = (screen: ScreenKind, level: number) => `--dk-t-${screen}-${level}`
/** The class that prints a screen's tile at a level. */
export const toneClass = (screen: ScreenKind, level: number) => `dk-tone-${screen}-${level}`

/** The hatched fill's gaps: two cells of every four along the rising
 * diagonal stay unprinted (`((x + y) & 3) >= 2`). */
export const HATCH_MASK: ToneMask = Array.from({ length: 16 }, (_, i) => (((i & 3) + (i >> 2)) & 3) < 2)

/** A tile's place at the cell's size, `x`/`y` cells along. */
const at = (x: string, y: string) => `calc(var(--dk-cell, 2px) * ${x}) calc(var(--dk-cell, 2px) * ${y})`
const SIZE = "calc(var(--dk-cell, 2px) * 4)"
const TILE = `var(--dk-tone-tile) ${at("var(--dk-tone-x, 0)", "var(--dk-tone-y, 0)")} / ${SIZE} repeat`
const HATCH = `var(--dk-hatch) 0 0 / ${SIZE} repeat`
const FULL = "linear-gradient(#000 0 0)"

/** The rule that prints a tile through a mask, its layers composited with
 * `ops` (the standard keyword, then WebKit's own). */
function maskRule(selector: string, layers: string[], ops: [string, string][], ...more: string[]): string {
  const lines = [`${selector} {`, ...more, `  -webkit-mask: ${layers.join(", ")};`]
  if (ops.length) lines.push(`  -webkit-mask-composite: ${ops.map((o) => o[1]).join(", ")};`)
  lines.push(`  mask: ${layers.join(", ")};`)
  if (ops.length) lines.push(`  mask-composite: ${ops.map((o) => o[0]).join(", ")};`)
  return `${lines.join("\n")}\n}`
}

/** The stylesheet `tones.css` holds, written from the screens. */
export function toneStylesheet(): string {
  const vars: string[] = [`  --dk-hatch: ${toneTile(HATCH_MASK)};`]
  const classes: string[] = []
  const rules: string[] = []
  for (const screen of SCREEN_KINDS)
    for (let level = 0; level < TONE_LEVELS; level++) {
      vars.push(`  ${toneVar(screen, level)}: ${toneTile(screenTone(screen, level))};`)
      classes.push(`.${toneClass(screen, level)}`)
      rules.push(`.${toneClass(screen, level)} {\n  --dk-tone-tile: var(${toneVar(screen, level)});\n}`)
    }
  return [
    "/* GENERATED by `npx rs test -u packages/dither-kit/tests/tones.spec.ts` from",
    "   engine/tone.ts: never edit by hand. The 17 tones of every print screen",
    "   (SCREENS in engine/pixel.ts) as 4x4 tiles. `dk-tone-<screen>-<level>`",
    "   prints its lit cells in --dk-tone-ink (else the text colour) at",
    "   --dk-cell (2px), moved --dk-tone-x/--dk-tone-y cells; `dk-tone` prints",
    "   whatever tile --dk-tone-tile holds. `dk-tone-gaps` prints the unlit",
    "   cells instead, `dk-tone-hatch` leaves the hatched fill's gaps out. Put",
    "   them on a layer of their own: the mask hides whatever the layer holds. */",
    `:root {\n${vars.join("\n")}\n}`,
    maskRule(`.dk-tone,\n${classes.join(",\n")}`, [TILE], [], "  background-color: var(--dk-tone-ink, currentColor);"),
    ...rules,
    maskRule(".dk-tone-gaps", [TILE, FULL], [["exclude", "xor"]]),
    maskRule(".dk-tone-hatch", [HATCH, TILE], [["intersect", "source-in"]]),
    maskRule(
      ".dk-tone-gaps.dk-tone-hatch",
      [HATCH, TILE, FULL],
      [
        ["intersect", "source-in"],
        ["exclude", "xor"],
      ],
    ),
    "",
  ].join("\n")
}

/** Every screen's tones as SVG `<pattern>`s, `dk-<screen>-<level>`, a cell
 * `cell` user units a side, for `fill: url(#dk-bayer-9)`; the lit cells
 * take `--dk-tone-ink`, else the text colour. Markup for a `<defs>`. */
export function tonePatterns(cell = 2): string {
  let out = ""
  for (const screen of SCREEN_KINDS)
    for (let level = 0; level < TONE_LEVELS; level++) {
      const d = tilePath(screenTone(screen, level))
      out += `<pattern id="dk-${screen}-${level}" width="${4 * cell}" height="${4 * cell}" patternUnits="userSpaceOnUse">${
        d ? `<path transform="scale(${cell})" style="fill:var(--dk-tone-ink,currentColor)" d="${d}"/>` : ""
      }</pattern>`
    }
  return out
}
