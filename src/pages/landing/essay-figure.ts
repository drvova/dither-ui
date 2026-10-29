// The essay's figure: one 24x24 cell lattice that re-dithers itself into a
// new scene for every statement. Each stage is a field function painting
// the lattice through the house ordered-dither rule (`ditherTone` /
// `rankOf`, the kit's 4×4 threshold), so the figure is the engine explaining itself:
// 01 the matrix · 02 figures (bars + an avatar ring) · 03 seven seeds ·
// 04 a seeded scatter · 05 nested frames · 06 the alias arrow.
//
// The markup is static (576 rects, prerender-able); only each rect's fill
// changes between stages, and the CSS transition on `fill` is delayed by
// the cell's own Bayer rank — so the morph between scenes IS an ordered
// dither wipe. Deterministic: same stage, same colours.
import { resolveMatrix } from "@dither-kit"

/** The house 4×4 Bayer matrix (the gradient texture's), as 0–1 thresholds. */
const BAYER = resolveMatrix("gradient")

/** Ordered-dither a tone (0–1) onto a ramp listed darkest first; null is the
 * empty floor below the first colour — the kit's threshold rule, cell by cell. */
export function ditherTone(t: number, x: number, y: number, ramp: readonly string[], m = BAYER): string | null {
  const v = Math.min(1, Math.max(0, t)) * ramp.length
  const base = Math.floor(v)
  const i = base + (v - base > m[y & 3][x & 3] ? 1 : 0)
  return i > 0 ? ramp[Math.min(i, ramp.length) - 1] : null
}

/** A cell's Bayer rank (0–15): the order ordered dithering lights it in. */
export const rankOf = (x: number, y: number, m = BAYER) => Math.min(15, Math.floor(m[y & 3][x & 3] * 16))

/** The house ramps: deep-blue sky to ice, and the ember sun. */
const SKY = ["#0c1730", "#1e429f", "#2f6fd0", "#7ba3ee", "#c9dbff", "#f4f8ff"] as const
const SUN = ["#ff9632", "#ffc58a", "#fff3e4"] as const

export const FIGURE_N = 24
export const STAGE_COUNT = 6

/** The off-state fill: a faint lattice ghost, so a cleared cell still marks
 * the grid (and `fill` has a colour to transition from). */
export const OFF = "#0e1118"

// The dark-theme swatches (the landing is always-dark art) as hex pairs:
// a deep shade for the ramp's floor and the swatch itself.
const SWATCHES: ReadonlyArray<readonly [string, string]> = [
  ["#0d3a22", "#28d26e"],
  ["#102a5a", "#358ff3"],
  ["#241a55", "#966eff"],
  ["#3e1434", "#f05abe"],
  ["#4a2a0e", "#ff9632"],
  ["#4a1515", "#f04646"],
  ["#23232a", "#8c8c96"],
]

const hash = (x: number, y: number) => {
  let h = Math.imul(x * 374761393 + y * 668265263, 1274126177)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

export const STAGE_CAPTIONS = [
  "Ordered matrix",
  "Charts and avatars",
  "Seven seeds",
  "Seed 512, replayed",
  "Layout frames",
  "Alias @dither-kit",
] as const

/** The colour a stage gives cell (x, y), or null for the empty floor. */
export function stageCell(stage: number, x: number, y: number): string | null {
  const n = FIGURE_N
  switch (stage) {
    case 0: {
      // The textbook figure: a diagonal ramp through the 4x4 matrix.
      return ditherTone((x + y) / (2 * (n - 1)), x, y, SKY.slice(1, 5))
    }
    case 1: {
      // Eight bars on the chart's floor, a lit cap over a body that deepens
      // downward; an avatar ring sits in the quiet upper-left.
      const heights = [5, 8, 7, 11, 14, 12, 17, 20]
      const slot = n / heights.length
      const i = Math.floor(x / slot)
      const left = Math.round(i * slot)
      const inBar = x >= left && x < left + 2
      const top = n - heights[i]
      if (inBar && y >= top) {
        if (y === top) return SKY[4]
        const depth = (y - top) / Math.max(1, n - top)
        return ditherTone(0.75 - depth * 0.6, x, y, SKY.slice(0, 4))
      }
      const r = Math.hypot(x + 0.5 - 6, y + 0.5 - 6)
      if (r > 2.6 && r < 4.1) return ditherTone(1 - Math.abs(r - 3.35) / 0.75, x, y, [SUN[1], SUN[0]])
      return null
    }
    case 2: {
      // Seven vertical bands, one per seed hue, each a ramp from its floor.
      const band = Math.min(SWATCHES.length - 1, Math.floor((x / n) * SWATCHES.length))
      const [floor, hue] = SWATCHES[band]
      const tone = 0.95 - (y / (n - 1)) * 0.85
      return ditherTone(tone, x, y, [floor, hue])
    }
    case 3: {
      // A seeded scatter: every cell asks the hash whether it lights, and the
      // lit ones pick a sky tone — one integer, one texture, replayed.
      const seed = 512
      const h = hash(x * 7 + seed, y * 13 + seed)
      if (h > 0.46) return null
      return SKY[2 + Math.floor(hash(y + seed, x) * 3)]
    }
    case 4: {
      // Concentric frames every fourth ring, fading toward the centre.
      const ring = Math.min(x, y, n - 1 - x, n - 1 - y)
      if (ring % 4 !== 0) return null
      return ditherTone(1 - ring / 14, x, y, SKY.slice(1, 5))
    }
    default: {
      // The alias arrow: a two-cell shaft and a head, in ember; a faint
      // dotted lead-in from the left edge (the copy, before the alias).
      const cy = n / 2
      const shaft = x >= 4 && x < 15 && Math.abs(y + 0.5 - cy) < 1.01
      const head = x >= 14 && x < 21 && Math.abs(y + 0.5 - cy) < 21 - x - 0.49
      if (shaft || head) return ditherTone(0.78 + (x / n) * 0.3, x, y, [SUN[0], SUN[1]])
      if (x < 4 && Math.abs(y + 0.5 - cy) < 1.01 && x % 2 === 0) return SKY[2]
      return null
    }
  }
}

export type FigureCell = { x: number; y: number; rank: number }

/** The lattice, row-major — the static markup's cell order. */
export function figureCells(): FigureCell[] {
  const cells: FigureCell[] = []
  for (let y = 0; y < FIGURE_N; y++) for (let x = 0; x < FIGURE_N; x++) cells.push({ x, y, rank: rankOf(x, y) })
  return cells
}

/** Every cell's fill for a stage (OFF where the field is empty). */
export function stageFills(stage: number): string[] {
  const s = ((stage % STAGE_COUNT) + STAGE_COUNT) % STAGE_COUNT
  const out: string[] = []
  for (let y = 0; y < FIGURE_N; y++) for (let x = 0; x < FIGURE_N; x++) out.push(stageCell(s, x, y) ?? OFF)
  return out
}
