// The site's one SVG sprite: the kit's glyphs, the tools' marks, the brand
// mark and the mascot's parts as `<symbol>`s in one file the build names by
// its content (`sprite-file.ts` draws it, the `siteFiles` plugin emits it
// under `_build/assets/`), so every page `<use>`s the same cached file and
// none carries a picture's paths. What lives here is what a page needs to
// point at a symbol: its id and the file's address. A part drawn into an
// image (a docs capture, a Studio frame's PNG, the player's export) cannot
// fetch the file and draws its own paths instead.
import type { MarkId } from "./marks"

/** The constant the build defines to the sprite's path under the site as
 * it names the file by its content. */
export const SPRITE_DEFINE = "__DITHER_SPRITE__"
declare const __DITHER_SPRITE__: string | undefined

/** The sprite's address: under the site's base, at the path the build
 * named it (the bare name in a spec, where no build defines it). */
export const spriteUrl = (): string =>
  `${import.meta.env.BASE_URL ?? "/"}${typeof __DITHER_SPRITE__ === "undefined" ? "sprite.svg" : __DITHER_SPRITE__}`

/** A symbol's reference, for `<use href>`. */
export const spriteRef = (id: string): string => `${spriteUrl()}#${id}`

export const markSymbol = (id: MarkId) => `mark-${id}`
export const BRAND_SYMBOL = "brand-mark"
/** The mascot's parts, each drawn a row up off the ground
 * (`mascotParts`): its body, its feet, its antennae standing or waving, and
 * its rotor at each step of a turn. */
export const MASCOT_SYMBOLS = {
  body: "mascot-body",
  feet: "mascot-feet",
  antennae: "mascot-antennae",
  wave: "mascot-antennae-wave",
  rotor: (turn: number) => `mascot-rotor-${turn}`,
} as const
