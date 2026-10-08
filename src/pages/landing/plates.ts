// Pixel plates: the landing's figures, drawn as SVG markup by the kit's own
// ordered-dither rule. A plate is a w×h cell grid painted by a field
// function; cells are grouped by (motion group, colour) and each group's row
// runs are encoded as dashed strokes on a lattice — `M x y.5h n·p` with
// `stroke-dasharray: 1 p-1` draws every p-th cell of the run. One Bayer rank
// owns one cell per 4×4 tile (period 4), so a whole run of it costs one
// subpath instead of one per cell, and a run's length is a multiple of the
// period so the dash phase stays on the lattice whether or not the renderer
// restarts dashing per subpath. Same field in → same markup out.
import { matrixFromSeed, resolveMatrix } from "@dither-kit"

export type Cell = { color: string; group: number; twinkle?: boolean }
export type PlateLayer = { color: string; d: string }
/** `top` is the group's highest row — how far it travels when it rises. */
export type PlateGroup = { index: number; top: number; twinkle: boolean; layers: PlateLayer[] }
export type Plate = { w: number; h: number; period: number; groups: PlateGroup[] }

type Run = { y: number; x0: number; last: number; n: number }

export function buildPlate(
  w: number,
  h: number,
  period: number,
  paint: (x: number, y: number) => Cell | null,
): Plate {
  const groups = new Map<number, PlateGroup>()
  const paths = new Map<PlateGroup, Map<string, string[]>>()
  const open = new Map<string, Run>()
  const flush = (key: string, run: Run) => {
    const [g, color] = key.split("|")
    const group = groups.get(Number(g))
    if (!group) throw new Error(`plate: run for unknown group ${g}`)
    const byColor = paths.get(group) ?? new Map<string, string[]>()
    paths.set(group, byColor)
    const list = byColor.get(color) ?? []
    byColor.set(color, list)
    list.push(`M${run.x0} ${run.y}.5h${run.n * period}`)
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const cell = paint(x, y)
      if (!cell) continue
      const group = groups.get(cell.group) ?? { index: cell.group, top: y, twinkle: false, layers: [] }
      group.twinkle ||= cell.twinkle === true
      groups.set(cell.group, group)
      // Runs live per lattice phase: a seeded matrix can give one rank two
      // columns of a tile, and interleaved phases must not break each other.
      const key = `${cell.group}|${cell.color}|${x % period}`
      const run = open.get(key)
      if (run && run.y === y && x - run.last === period) {
        run.last = x
        run.n++
      } else {
        if (run) flush(key, run)
        open.set(key, { y, x0: x, last: x, n: 1 })
      }
    }
  }
  for (const [key, run] of open) flush(key, run)
  for (const [group, byColor] of paths) {
    for (const [color, d] of byColor) group.layers.push({ color, d: d.join("") })
  }
  return { w, h, period, groups: [...groups.values()].sort((a, b) => a.index - b.index) }
}

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

/** The house ramps: deep-blue sky to ice, and the ember sun. Shared by the
 * plates and the living sky so every landing figure renders from one palette. */
export const SKY = ["#0c1730", "#1e429f", "#2f6fd0", "#7ba3ee", "#c9dbff", "#f4f8ff"] as const
export const SUN = ["#ff9632", "#ffc58a", "#fff3e4"] as const

// Stable per-cell noise for star scatter (deterministic, no PRNG state).
const hash = (x: number, y: number) => {
  let h = Math.imul(x * 374761393 + y * 668265263, 1274126177)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/** Hero: a planet horizon at first light. The sun breaks the limb up-left of
 * the crest, the crescent and atmosphere fall off around the curve, the night
 * side keeps a faint dithered body, and a few stars hold the sky. Groups are
 * Bayer ranks, so the figure develops the way ordered dithering lights it. */
export function dawnPlate(w = 168, h = 46): Plate {
  const R = w * 0.95
  const cx = w * 0.6
  const cy = h * 0.36 + R
  const sunX = w * 0.36
  const sdx = (sunX - cx) / R
  const sdy = -Math.sqrt(1 - sdx * sdx)
  const sunY = cy + sdy * R
  // Light from the sun's side of the limb but mostly from BEHIND the planet:
  // only a crescent within ~nz < 0.3 of the limb turns to face it.
  const ln = Math.hypot(sdx * 0.32, sdy * 0.32, 1)
  const [lx, ly, lz] = [(sdx * 0.32) / ln, (sdy * 0.32) / ln, -1 / ln]
  return buildPlate(w, h, 4, (x, y) => {
    const px = x + 0.5
    const py = y + 0.5
    const dx = (px - cx) / R
    const dy = (py - cy) / R
    const r = Math.hypot(dx, dy)
    // How squarely this stretch of limb faces the sun (1 under it, 0 opposite).
    const facing = Math.max(0, (dx * sdx + dy * sdy) / r)
    const lit = facing ** 20
    let t: number
    if (r < 1) {
      const nz = Math.sqrt(1 - r * r)
      const lambert = Math.max(0, dx * lx + dy * ly + nz * lz)
      t = 0.05 + lambert * 2.4 + (1 - nz) ** 9 * (0.3 + 0.7 * lit)
    } else {
      t = Math.exp(-((r - 1) * R) / 1.8) * (0.12 + 0.88 * lit) * 0.85
    }
    // The sun: a tight hot core on the limb and a one-row flare along it.
    const sx = px - sunX
    const sy = py - sunY
    const glow = Math.exp(-(sx * sx + sy * sy * 1.5) / 12)
    const flare = Math.exp(-Math.abs(sy) / 0.42) * Math.exp(-Math.abs(sx) / 18)
    t += glow * 0.9 + flare * 0.65
    const group = rankOf(x, y)
    if (glow > 0.24) {
      const color = ditherTone((glow - 0.24) / 0.6, x, y, SUN)
      if (color) return { color, group }
    }
    const color = ditherTone(t, x, y, SKY)
    if (color) return { color, group }
    // Stars hold the sky over the crest only — never behind the copy.
    if (r > 1 && t < 0.02 && px > w * 0.52 && hash(x, y) < 0.007) {
      return { color: hash(y, x) < 0.3 ? SKY[4] : SKY[3], group: 16 + (x % 3), twinkle: true }
    }
    return null
  })
}

/** Charts band: the chart's own series as a dithered skyline — one slim bar
 * per row, height on the chart's 0–100 axis, a lit cap over a body that
 * deepens toward the floor. Group = month, so the bars rise in order. */
export function skylinePlate(values: readonly number[], w = 144, h = 12): Plate {
  const slot = w / values.length
  const bar = Math.max(1, Math.round(slot * 0.5))
  return buildPlate(w, h, 1, (x, y) => {
    const i = Math.floor(x / slot)
    const left = Math.round(i * slot + (slot - bar) / 2)
    if (x < left || x >= left + bar) return null
    const top = h - Math.max(1, Math.round((values[i] / 100) * h))
    if (y < top) return null
    if (y === top) return { color: SKY[4], group: i }
    const depth = (y - top) / Math.max(1, h - top)
    const color = ditherTone(0.7 - depth * 0.62, x, y, SKY.slice(0, 4))
    return color ? { color, group: i } : null
  })
}

/** Surfaces band: the textbook figure — a linear ramp through all seventeen
 * levels of the 4×4 matrix, one colour on void. Groups are Bayer ranks. */
export function rampPlate(w = 144, h = 6): Plate {
  return buildPlate(w, h, 4, (x, y) => {
    const color = ditherTone(x / (w - 1), x, y, [SKY[3]])
    return color ? { color, group: rankOf(x, y) } : null
  })
}

/** Controls band: the controls chapter's seed, made visible — the fill runs
 * from full at the left down to nothing at seed/999, and the threshold
 * matrix itself is seeded, so dragging the slider moves the edge and
 * re-scatters every pixel of the fill. */
export function seedPlate(seed: number, w = 144, h = 6): Plate {
  const m = matrixFromSeed(seed)
  const edge = (seed / 999) * w
  return buildPlate(w, h, 4, (x, y) => {
    const t = edge > 0 ? 0.92 * (1 - (x + 0.5) / edge) : 0
    const color = ditherTone(t, x, y, SKY.slice(1, 4), m)
    return color ? { color, group: rankOf(x, y, m) } : null
  })
}
