// The share cards' art: one 1200x630 card per page the site shares (the
// three routes and every docs section), drawn as a seamless loop through the
// house Bayer 4x4 so the build writes it twice, as a PNG (the loop's first
// frame, what every link preview can show) and as an animated GIF (what
// Discord, Slack and anything that embeds an image plays). Section cards
// drift a seeded field of three bodies across the right of the card; route
// cards roll two dithered horizons under a twinkling sky. Every motion turns
// a whole number of times per loop, so the last frame meets the first.
// Pure, node-side and import-free: crawler-files.ts writes these
// declarations' source into the renderer page (dist/og/index.html), which
// adds the type and the frames; the tests call them directly.

export const OG_W = 1200
export const OG_H = 630
/** One lattice cell: 11px of tone and a 1px seam of ground. */
export const OG_CELL = 12
/** Frames per loop and their delay in centiseconds: 3.6s at 10 fps. */
export const OG_FRAMES = 36
export const OG_DELAY = 10
export const OG_GROUND = "#05060a"
export const OG_NIGHT = "#0a0a0c"
/** The house cool ramp (the landing's SKY) and the kit's purple seed as a
 * ramp, darkest first. */
export const OG_SKY = ["#0c1730", "#1e429f", "#2f6fd0", "#7ba3ee", "#c9dbff", "#f4f8ff"]
export const OG_DUSK = ["#1b1338", "#3a2a7a", "#6a4fd0", "#966eff", "#c8afff", "#e1d2ff"]
/** The house Bayer 4x4 (the kit's gradient matrix), ranks 0 to 15. */
export const OG_BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]

export interface OgCard {
  id: string
  art: "field" | "horizon"
  title: string
  /** Under the title: a route's line, a section's address. */
  line: string
  /** The hairline tag in the top right corner (a section's family). */
  tag: string
  seed: number
  /** The field's larger, darker variant (the Discord service's toggle). */
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

/** Mulberry32, the kit's seeded generator. */
export function ogRandom(seed: number): () => number {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A #rrggbb colour as one opaque RGBA pixel of a little-endian buffer. */
export function ogPixel(hex: string): number {
  return (
    (0xff000000 |
      (parseInt(hex.slice(5, 7), 16) << 16) |
      (parseInt(hex.slice(3, 5), 16) << 8) |
      parseInt(hex.slice(1, 3), 16)) >>>
    0
  )
}

/** A tone (0 to 1) as a ramp level at a cell (0 is clear), ordered by the
 * cell's Bayer rank: the share of cells a level up is the tone's remainder. */
export function ogLevel(tone: number, levels: number, cx: number, cy: number): number {
  const v = Math.min(1, Math.max(0, tone)) * levels
  const base = Math.floor(v)
  return Math.min(levels, base + (v - base > (OG_BAYER[cy & 3][cx & 3] + 0.5) / 16 ? 1 : 0))
}

/** The section field's three bodies: placed by the seed on the right of the
 * card, each orbiting its place a whole number of turns per loop. */
export function ogBodies(seed: number, inv: boolean) {
  const R = ogRandom(seed)
  return [0, 1, 2].map((i) => ({
    x: (0.54 + R() * 0.36) * OG_W,
    y: (0.14 + R() * 0.46) * OG_H,
    r: (86 + R() * 100) * (inv ? 1.15 : 1),
    ax: 36 + R() * 44,
    ay: 22 + R() * 26,
    kx: 1 + (i % 2),
    ky: 1 + ((i + 1) % 2),
    p: R() * Math.PI * 2,
  }))
}

/** The field's tone at a point and a loop phase `t` (0 to 1), faded out
 * of the title's corner (bottom left). */
export function ogFieldTone(bodies: ReturnType<typeof ogBodies>, px: number, py: number, t: number): number {
  let v = 0
  const turn = t * Math.PI * 2
  for (const b of bodies) {
    const dx = px - (b.x + Math.sin(turn * b.kx + b.p) * b.ax)
    const dy = py - (b.y + Math.cos(turn * b.ky + b.p) * b.ay)
    const r = b.r * (1 + 0.06 * Math.sin(turn + b.p))
    v += 1.1 * Math.exp(-(dx * dx + dy * dy) / ((r * r) / 2))
  }
  const u = px / OG_W
  const w = py / OG_H
  const open = Math.min(1, Math.max(0, (u - 0.5) / 0.28, (0.4 - w) / 0.2))
  const L = Math.min(v, 1.15) * open * open * (3 - 2 * open)
  // Capped short of the top level, so a body is dithered through and
  // through, never a solid disc.
  return L < 0.22 ? 0 : Math.min(0.8, L * 0.66)
}

/** The two horizons' crests (fractions of the height) across the card at
 * loop phase `t`: the far one rolls right, the near one left. */
export function ogCrests(u: number, t: number, seed: number) {
  const p = (seed % 628) / 100
  const turn = t * Math.PI * 2
  return {
    far: 0.66 + 0.06 * Math.sin(Math.PI * 2 * 1.1 * u - turn + p) + 0.035 * Math.sin(Math.PI * 2 * 2.3 * u + 2 * turn),
    near:
      0.82 +
      0.05 * Math.sin(Math.PI * 2 * 0.8 * u + turn + p * 0.5) +
      0.03 * Math.sin(Math.PI * 2 * 1.9 * u - 2 * turn),
  }
}

/** The card's art at loop phase `t`: the ground, then every lit cell. */
export function ogArt(card: OgCard, t: number): Uint8ClampedArray {
  const px = new Uint8ClampedArray(OG_W * OG_H * 4)
  const view = new Uint32Array(px.buffer)
  view.fill(ogPixel(card.inv ? OG_NIGHT : OG_GROUND))
  const sky = OG_SKY.map(ogPixel)
  const dusk = OG_DUSK.map(ogPixel)
  const fill = (x: number, y: number, size: number, c: number) => {
    const end = Math.min(OG_W, x + size)
    for (let yy = y; yy < Math.min(OG_H, y + size); yy++) view.fill(c, yy * OG_W + x, yy * OG_W + end)
  }
  const cols = Math.ceil(OG_W / OG_CELL)
  const rows = Math.ceil(OG_H / OG_CELL)
  const bodies = ogBodies(card.seed, card.inv)
  const R = ogRandom(card.seed ^ 0x9e3779b9)
  const stars = card.art === "horizon" ? Array.from({ length: cols * rows }, () => R()) : []
  for (let cx = 0; cx < cols; cx++) {
    const u = (cx + 0.5) / cols
    const crest = ogCrests(u, t, card.seed)
    for (let cy = 0; cy < rows; cy++) {
      const x = cx * OG_CELL
      const y = cy * OG_CELL
      if (card.art === "field") {
        const level = ogLevel(ogFieldTone(bodies, x + OG_CELL / 2, y + OG_CELL / 2, t), sky.length, cx, cy)
        if (level > 0) fill(x, y, OG_CELL - 1, sky[level - 1])
        continue
      }
      const w = (cy + 0.5) / rows
      // Under a crest the tone is brightest on the crest and falls away.
      const ramp = w >= crest.near ? dusk : w >= crest.far ? sky : null
      if (ramp) {
        const depth = w - (ramp === dusk ? crest.near : crest.far)
        const level = ogLevel(0.3 + 0.7 * Math.exp(-depth / 0.09), ramp.length, cx, cy)
        if (level > 0) fill(x, y, OG_CELL - 1, ramp[level - 1])
        continue
      }
      // Above them, a sparse sky: each star a 3px point that twinkles a
      // whole number of times per loop, kept off the title's band.
      const s = stars[cx * rows + cy]
      if (s > 0.035 || (u < 0.68 && w > 0.18)) continue
      const glow = 0.5 + 0.5 * Math.sin((t * (1 + (cx % 3)) + s * 28) * Math.PI * 2)
      fill(x + 4, y + 4, 3, sky[3 + Math.min(2, Math.floor(glow * 3))])
    }
  }
  return px
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
