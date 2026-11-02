// The share cards' design: one 1200x630 card per page the site shares (the
// three routes and every docs section), set as the landing's hero sets
// itself: obsidian with one bone ink, the brand, the title in chrome, its
// line and the keys, and the only colour the kit's art, a print of the
// kit's own poster (`og-art.ts` paints it with the kit's poster engine)
// standing on its dithered floor on the right. The build writes each card twice: a PNG (frame 0,
// the print at rest, what every link preview shows) and a looping GIF (what
// Discord and Slack play): the kit's diamond swells over the whole print,
// turning every tile over into its negative ring by ring, holds, and
// recedes to its place, on the kit's spring, while the screen slides inside
// it in whole turns, so the last frame meets the first. The home card
// prints the hero's own composition.
// Import-free: crawler-files.ts (loaded under Node's own TypeScript) and
// the renderer page (`og-page.ts`) both read it.

export const OG_W = 1200
export const OG_H = 630
/** Frames per loop and their delay in centiseconds: 5.76s at 12.5 fps. */
export const OG_FRAMES = 72
export const OG_DELAY = 8

/** The card's inks, by night (the landing's own, the default) and by day
 * (the same card on bone paper, the Discord service's toggle). Each muted
 * ink keeps AA (4.5:1) on its ground. */
export const OG_INK = {
  night: {
    ground: "#101214",
    ink: "#e4e1d8",
    muted: "#a9a69c",
    /** A second key's filled ground, a step off the obsidian. */
    raised: "#1d2023",
    /** The chrome ramp on the title, top to foot (the site's dark chrome). */
    chrome: [
      [0, "#ffffff"],
      [0.36, "#dfe6ee"],
      [0.48, "#8e98a8"],
      [0.505, "#7d8798"],
      [0.53, "#fbfcfd"],
      [0.74, "#c2cad5"],
      [1, "#edf1f5"],
    ],
  },
  day: {
    ground: "#e4e1d8",
    ink: "#101214",
    muted: "#4d4f53",
    raised: "#d4d0c4",
    chrome: [
      [0, "#11151b"],
      [0.36, "#2d343e"],
      [0.48, "#5d6674"],
      [0.505, "#6b7482"],
      [0.53, "#0e1116"],
      [0.74, "#2a3039"],
      [1, "#3d4450"],
    ],
  },
} as const
/** The satin aluminum key, top to foot, and every key's height. */
export const OG_KEY = [
  [0, "#f4f7f8"],
  [0.38, "#dde4e8"],
  [0.52, "#d4dce1"],
  [1, "#c2cad0"],
] as const
export const OG_KEY_H = 44
/** The kit's 4x4 Bayer ranks: the order the print's floor thins in. */
export const OG_BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const
/** The floor's tone under the print's foot, thinning to none. */
export const OG_FLOOR = 0.6
/** The brand mark's core. */
export const OG_EMBER = "#ff9632"
/** The print's inks: the hero print's (`landing/plate.ts` INKS, held equal
 * by the tests) by night; by day its bone ink turns obsidian, so no ink
 * prints bone on bone. */
export const OG_PRINT_INKS = {
  night: ["blue", "orange", "#e4e1d8"],
  day: ["blue", "orange", "#101214"],
} as const
/** The print: its top left, its cell in px, its size in cells (a 4:5
 * portrait sheet, the hero's) and its floor's rows under it; it stands on
 * the card's right, its top on the brand's line. */
export const OG_PRINT = { x: 752, y: 56, cell: 6, cols: 64, rows: 80, floor: 6 } as const
/** Cells the screen slides inside the diamond per loop: whole turns of the
 * 4x4 screen, so the loop closes. */
export const OG_DRIFT = 16
/** The loop's beats, as phases: at rest, the swell, the whole print turned
 * over, the recede, at rest again (to 1). */
export const OG_BEATS = { swell: 0.28, over: 0.48, recede: 0.6, rest: 0.8 } as const
/** The hero print's seed (`landing/Showcase.vue`), the home card's. */
export const OG_HERO_SEED = 5
/** The brand's top left, the type's column (from the left margin to a
 * gutter short of the print) and its line's lead, and the title's size at
 * its largest. */
export const OG_BRAND = { x: 64, y: 56 } as const
export const OG_TEXT = { x: 64, max: 600, lead: 34 } as const
export const OG_TITLE = { size: 84 } as const

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

/** A card's line in at most `rows` lines of `max`: the most whole
 * sentences that fit, else the first sentence cut at a word with an
 * ellipsis. */
export function ogLede(text: string, measure: (text: string) => number, max: number, rows = 2): string[] {
  const fit = (t: string) => ogWrap(t.split(" ").filter(Boolean), measure, max)
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [text]
  let said = ""
  for (const sentence of sentences) {
    const next = said ? `${said} ${sentence.trim()}` : sentence.trim()
    if (fit(next).length > rows) break
    said = next
  }
  if (said) return fit(said)
  const lines = fit(text).slice(0, rows)
  const cut = lines[rows - 1].split(" ")
  while (cut.length > 1 && measure(`${cut.join(" ")}\u2026`) > max) cut.pop()
  lines[rows - 1] = `${cut.join(" ").replace(/[,;:.(]$/, "")}\u2026`
  return lines
}
