// The share cards' design: one 1200x630 card per page the site shares (the
// three routes and every docs section), in the landing's printed look. The
// ground is obsidian with one bone ink; the title is set in the display
// face; the only colour is the kit's art, a print of the kit's own poster
// (`og-art.ts` paints it with the kit's poster engine) standing on the
// right like the hero's. The build writes each card twice: a PNG (frame 0,
// what every link preview shows) and a looping GIF (what Discord and Slack
// play), the loop being the hero's own motion: the screen sliding inside
// the kit's diamond, whole turns per loop, so the last frame meets the
// first. The home card prints the hero's own composition.
// Import-free: crawler-files.ts (loaded under Node's own TypeScript) and
// the renderer page (`og-page.ts`) both read it.

export const OG_W = 1200
export const OG_H = 630
/** Frames per loop and their delay in centiseconds: 3.6s at 10 fps. */
export const OG_FRAMES = 36
export const OG_DELAY = 10

/** The card's inks, by night (the landing's own, the default) and by day
 * (the same card on bone paper, the Discord service's toggle). Each muted
 * ink keeps AA (4.5:1) on its ground. */
export const OG_INK = {
  night: { ground: "#101214", ink: "#e4e1d8", muted: "#a9a69c" },
  day: { ground: "#e4e1d8", ink: "#101214", muted: "#4d4f53" },
} as const
/** The brand mark's core. */
export const OG_EMBER = "#ff9632"
/** The print's inks: the hero print's (`landing/plate.ts` INKS, held equal
 * by the tests) by night; by day its bone ink turns obsidian, so no ink
 * prints bone on bone. */
export const OG_PRINT_INKS = {
  night: ["blue", "orange", "#e4e1d8"],
  day: ["blue", "orange", "#101214"],
} as const
/** The print: its top left, its cell in px and its size in cells, a portrait
 * sheet (about 4:5, the hero's) on the card's right, its top on the brand's
 * line and its foot on the last line of type. */
export const OG_PRINT = { x: 736, y: 64, cell: 6, cols: 66, rows: 83 } as const
/** Cells the screen slides inside the diamond per loop: whole turns of the
 * 4x4 screen, so the loop closes. */
export const OG_DRIFT = 8
/** The hero print's seed (`landing/Showcase.vue`), the home card's. */
export const OG_HERO_SEED = 5
/** The type's column: from the left margin to a gutter short of the print. */
export const OG_TEXT = { x: 64, max: 616, base: 556 } as const

export interface OgCard {
  id: string
  /** A route's card sets its title larger, on one line. */
  kind: "route" | "section"
  title: string
  /** Under the title: a route's line, a section's address. */
  line: string
  /** The print's composition and screen. */
  seed: number
  /** The day card: bone paper (the Discord service's toggle). */
  inv: boolean
}

/** A section id hashed the same way everywhere (FNV-1a). */
export function ogSeed(id: string): number {
  let h = 2166136261
  for (const ch of id) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** The seed a page's card prints when nobody re-rolls it: home prints the
 * hero's own composition, every other page its id's. */
export function ogCardSeed(id: string): number {
  return id === "home" ? OG_HERO_SEED : ogSeed(id)
}

/** `words` in lines no wider than `max`, as even as the fewest lines allow:
 * the narrowest width that keeps the greedy line count (CSS's balance). */
export function ogWrap(words: string[], measure: (text: string) => number, max: number): string[] {
  const greedy = (width: number) => {
    const lines: string[] = []
    for (const word of words) {
      const last = lines.length ? `${lines[lines.length - 1]} ${word}` : word
      if (lines.length && measure(last) <= width) lines[lines.length - 1] = last
      else lines.push(word)
    }
    return lines
  }
  const count = greedy(max).length
  let lo = 0
  let hi = max
  while (hi - lo > 1) {
    const mid = (lo + hi) / 2
    if (greedy(mid).length > count) lo = mid
    else hi = mid
  }
  return greedy(hi)
}
