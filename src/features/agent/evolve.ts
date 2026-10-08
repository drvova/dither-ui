// Evolution: seeded variants of one artboard. The agent (or the user) is the
// author of STRUCTURE; the engine is the author of VARIATION. A generation
// is `count` deep clones of the parent, each mutated by a seeded PRNG —
// chart seeds, textures and colours; component props jittered inside their
// registry specs; screens cell by cell — then run through the same
// normalizer every untrusted document takes, so a variant can never carry a
// value the inspector could not have produced. Same parent + seed → the
// same generation, forever.
import { mulberry32 } from "@dither-kit"
import { type Artboard, normalizeArtboard } from "@/entities/artboard"
import type { ChartModel } from "@/entities/chart"
import { componentEntry, type PropSpec, type WidgetModel } from "@/entities/widget"
import { BLOOMS, STACKS, VARIANTS } from "@/shared/config"

export type EvolveOptions = {
  /** Variants to produce. Default 4. */
  count?: number
  /** Generation seed. Default: the parent's chart seed, else 1. */
  seed?: number
  /** 0–1 mutation pressure. Default 0.5. */
  strength?: number
}

const COLORS = ["green", "blue", "purple", "pink", "orange", "red", "grey"] as const
const BUTTON_VARIANTS = ["gradient", "dotted", "hatched", "solid"] as const
const DIRECTIONS = ["up", "down", "left", "right"] as const
const MIRRORS = ["auto", "horizontal", "vertical"] as const
const ALIGNS = ["start", "center", "end", "stretch"] as const

let counter = 0
const uid = () => `ab${Date.now().toString(36)}e${(counter++).toString(36)}`

type Rng = () => number

/** Mutate component props inside their registry specs. Text and list props
 * are content, not style: they never change. */
export function mutateProps(
  specs: readonly PropSpec[],
  props: Record<string, unknown>,
  rng: Rng,
  strength = 0.5,
): Record<string, unknown> {
  const out = { ...props }
  const p = (base: number) => rng() < Math.min(1, base * (0.5 + strength))
  const pick = <T>(xs: readonly T[]) => xs[Math.floor(rng() * xs.length)]
  for (const spec of specs) {
    switch (spec.kind) {
      case "select":
        if (p(0.4)) out[spec.key] = pick(spec.options)
        break
      case "boolean":
        if (p(0.2)) out[spec.key] = !(out[spec.key] ?? spec.def)
        break
      case "color":
        if (p(0.4)) out[spec.key] = pick(COLORS)
        break
      case "number": {
        if (!p(0.4)) break
        const cur = typeof out[spec.key] === "number" ? (out[spec.key] as number) : spec.def
        const range = spec.min != null && spec.max != null ? spec.max - spec.min : null
        const step = spec.step ?? (range != null ? Math.max(range / 10, Number.EPSILON) : 1)
        const dir = rng() < 0.5 ? -1 : 1
        let n = cur + dir * step * (1 + Math.floor(rng() * 3))
        if (spec.min != null) n = Math.max(spec.min, n)
        if (spec.max != null) n = Math.min(spec.max, n)
        // Keep the precision the step implies (0.1 steps never become 0.30000000000000004).
        const decimals = Math.min(6, Math.max(0, -Math.floor(Math.log10(step))))
        out[spec.key] = Number(n.toFixed(decimals))
        break
      }
      default:
        break
    }
  }
  return out
}

function mutateChart(chart: ChartModel, rng: Rng, strength: number) {
  const p = (base: number) => rng() < Math.min(1, base * (0.5 + strength))
  const pick = <T>(xs: readonly T[]) => xs[Math.floor(rng() * xs.length)]
  // The seed is the variant's genome: always new.
  chart.seed = Math.floor(rng() * 1_000_000)
  chart.effect = Math.floor(rng() * 1_000_000)
  if (typeof chart.bloom === "string" && p(0.35)) chart.bloom = pick(BLOOMS)
  if (chart.type !== "pie" && chart.type !== "radar" && p(0.2)) chart.stackType = pick(STACKS)
  if (p(0.4)) chart.cell = Math.max(1, Math.min(4, chart.cell + (rng() < 0.5 ? -1 : 1)))
  if (p(0.3)) chart.animationDuration = 500 + Math.floor(rng() * 900)
  if (p(0.2)) chart.sparkles = !chart.sparkles
  for (const s of chart.series) {
    if (p(0.4)) s.color = pick(COLORS)
    if (typeof s.variant === "string" && p(0.35)) s.variant = pick(VARIANTS)
  }
}

function mutateWidget(w: WidgetModel, rng: Rng, strength: number) {
  const p = (base: number) => rng() < Math.min(1, base * (0.5 + strength))
  const pick = <T>(xs: readonly T[]) => xs[Math.floor(rng() * xs.length)]
  switch (w.kind) {
    case "button":
      if (p(0.6)) w.color = pick(COLORS)
      if (p(0.5)) w.variant = pick(BUTTON_VARIANTS)
      if (p(0.3)) w.cell = Math.max(1, Math.min(4, w.cell + (rng() < 0.5 ? -1 : 1)))
      if (typeof w.bloom === "string" && p(0.3)) w.bloom = pick(BLOOMS)
      break
    case "avatar":
      if (p(0.3)) w.autoColor = !w.autoColor
      if (p(0.5)) w.color = pick(COLORS)
      if (p(0.5)) w.grid = pick([6, 8, 10, 12] as const)
      if (p(0.4)) w.density = Number((rng() * 0.6 - 0.3).toFixed(2))
      if (p(0.3)) w.mirror = pick(MIRRORS)
      break
    case "gradient":
      if (p(0.5)) w.from = pick(COLORS)
      if (p(0.5)) w.to = pick(COLORS)
      if (p(0.4)) w.direction = pick(DIRECTIONS)
      if (p(0.3)) w.cell = 2 + Math.floor(rng() * 5)
      if (p(0.3)) w.opacity = Number((0.3 + rng() * 0.7).toFixed(2))
      break
    case "image":
      if (p(0.5)) w.cell = 2 + Math.floor(rng() * 5)
      if (p(0.4)) w.fade = Math.floor(rng() * 41)
      break
    case "reel":
      // The cut is the author's; variants of a reel would be variants of its frames.
      break
    case "component": {
      const entry = componentEntry(w.is)
      if (entry) w.props = mutateProps(entry.props, w.props, rng, strength)
      break
    }
    case "screen":
      for (const row of w.rows) {
        if (p(0.3)) row.gap = 6 + Math.floor(rng() * 19)
        if (p(0.2)) row.align = pick(ALIGNS)
        for (const cell of row.cells) {
          const entry = componentEntry(cell.is)
          if (entry) cell.props = mutateProps(entry.props, cell.props, rng, strength)
        }
      }
      if (p(0.2)) w.gap = 8 + Math.floor(rng() * 25)
      if (p(0.2)) w.padding = 8 + Math.floor(rng() * 33)
      break
  }
}

/** A generation of variants for `parent`. Pure: nothing is placed or
 * selected; positions are left for `placeGeneration`. */
export function evolveArtboard(parent: Artboard, opts: EvolveOptions = {}): Artboard[] {
  const count = Math.max(1, Math.min(12, Math.round(opts.count ?? 4)))
  const strength = Math.max(0, Math.min(1, opts.strength ?? 0.5))
  const seed = Math.round(opts.seed ?? parent.chart?.seed ?? 1)
  const rng = mulberry32(seed)
  const out: Artboard[] = []
  for (let i = 0; i < count; i++) {
    const v = JSON.parse(JSON.stringify(parent)) as Artboard
    v.id = uid()
    v.name = `${parent.name} · v${i + 1}`
    v.groupId = null
    v.hidden = false
    v.locked = false
    if (v.widget) mutateWidget(v.widget, rng, strength)
    else mutateChart(v.chart, rng, strength)
    out.push(normalizeArtboard(v))
  }
  return out
}
