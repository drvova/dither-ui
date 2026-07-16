// Shared ordered-dither painting primitives, used by every cartesian canvas
// (area, line, bar). Keeping the Bayer threshold loop in one place means every
// chart type reads with the exact same pixel texture.

import type { AreaVariant } from "./chart-context"
import { rgb, type Rgb, type Seed } from "./palette"
import { xorshift32 } from "./pixel"
import { blendRasterPixel, type RasterBuffer } from "./raster"

// 4×4 ordered (Bayer) matrix, normalized to 0–1 thresholds — the exact matrix
// the legacy chart dithers with.
export const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((row) => row.map((v) => (v + 0.5) / 16))

export const CELL = 2 // css px per dither cell — chunky enough to read pixelated
export const MAX_COLS = 520
export const MAX_ROWS = 200
// Opacity of the top border outline (just under solid, so it reads as a soft
// edge rather than a hard line). See the note on colour vs opacity below.
export const BORDER_ALPHA = 0.72
// Opacity of a dither "off" cell relative to an "on" cell. The scatter modulates
// between these two tiers of the *same* colour instead of leaving holes, so the
// background never shows through as stark white on a light theme.
export const OFF_TIER = 0.4

/** Fully granular dither texture — the four named variants are presets over
 * this. Every field is optional; missing fields take the gradient defaults. */
export type TextureConfig = {
  ramp?: number // 0–1: how much the fill fades toward the value line (1 = full fade)
  density?: number // 0–1: extra fill bias (1 = solid, dotted preset uses 0.12)
  gaps?: boolean // unlit cells stay empty (dotted look) instead of a faint tint
  hatch?: number // 0 = off; n ≥ 2 = diagonal stripe period (hatched preset = 4)
  offTier?: number // 0–1: alpha of unlit cells when gaps is false (default 0.4)
  edge?: number // 0–1: top border-line alpha (default 0.72)
  // Luminance character — how density maps to pixel brightness.
  alphaFloor?: number // base brightness of a lit cell (default 0.3)
  alphaRange?: number // how much density adds above the floor (default 0.7)
  intensityLift?: number // hover brightness multiplier (default 0.22)
}
export type VariantInput = AreaVariant | TextureConfig | number

const TEXTURE_PRESET: Record<AreaVariant, Required<TextureConfig>> = {
  gradient: { ramp: 1, density: 0, gaps: false, hatch: 0, offTier: OFF_TIER, edge: BORDER_ALPHA, alphaFloor: 0.3, alphaRange: 0.7, intensityLift: 0.22 },
  dotted: { ramp: 1, density: 0.12, gaps: true, hatch: 0, offTier: OFF_TIER, edge: BORDER_ALPHA, alphaFloor: 0.35, alphaRange: 0.65, intensityLift: 0.22 },
  hatched: { ramp: 1, density: 0, gaps: false, hatch: 4, offTier: OFF_TIER, edge: BORDER_ALPHA, alphaFloor: 0.3, alphaRange: 0.7, intensityLift: 0.22 },
  // density 2: outbids every threshold shift (stacked/sparse) — always lit,
  // exactly like the old hard-coded solid branch.
  solid: { ramp: 1, density: 2, gaps: false, hatch: 0, offTier: OFF_TIER, edge: BORDER_ALPHA, alphaFloor: 0.3, alphaRange: 0.7, intensityLift: 0.22 },
}

// --- seed-generative textures ------------------------------------------------
// A number variant is a seed: the same deterministic principle as the avatar —
// one integer, one texture, identical on every surface that renders it.

/** mulberry32 — tiny deterministic PRNG, good enough for texture params. */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Generate a texture from a seed — params stay inside the readable band so
 * every seed yields a usable fill, never an invisible or blown-out one. */
export function textureFromSeed(seed: number): Required<TextureConfig> {
  const rand = mulberry32(Math.round(seed))
  const gaps = rand() < 0.35
  const hatch = rand() < 0.4 ? 3 + Math.floor(rand() * 4) : 0
  return {
    ramp: 0.45 + rand() * 0.55,
    density: gaps ? 0.08 + rand() * 0.2 : rand() * 0.5,
    gaps,
    hatch,
    offTier: OFF_TIER * (0.6 + rand() * 0.9),
    edge: BORDER_ALPHA * (0.7 + rand() * 0.3),
    alphaFloor: 0.2 + rand() * 0.25,
    alphaRange: 0.5 + rand() * 0.3,
    intensityLift: 0.12 + rand() * 0.2,
  }
}

/** Seeded bloom — params stay in the usable glow band; a seed always blooms. */
export function bloomFromSeed(seed: number): Required<BloomConfig> {
  const rand = mulberry32(Math.round(seed) ^ 0x9e3779b9)
  return {
    blur: 2 + rand() * 10,
    brightness: 1.2 + rand() * 1.2,
    opacity: 0.25 + rand() * 0.55,
    saturate: 1.2 + rand() * 1.6,
    blend: "plus-lighter",
  }
}

/** Seeded easing — a cubic bezier with character but no broken monotonicity
 * (x control points stay in 0..1 as CSS requires). */
export function easingFromSeed(seed: number): BezierPoints {
  const rand = mulberry32(Math.round(seed) ^ 0x85ebca6b)
  return [0.1 + rand() * 0.7, rand() * 1.1, 0.2 + rand() * 0.7, 0.5 + rand() * 0.6]
}

/** Seeded motion — duration, delay, stagger, sparkle character, start angle. */
export function motionFromSeed(seed: number) {
  const rand = mulberry32(Math.round(seed) ^ 0xc2b2ae35)
  return {
    duration: 550 + Math.round(rand() * 1100),
    delay: Math.round(rand() * 180),
    stagger: 0.2 + rand() * 0.7,
    sparkleDensity: 0.5 + rand(),
    sparkleSpeed: 0.5 + rand(),
    startAngle: Math.round(rand() * 360),
  }
}

/** Seeded chart geometry — cartesian + polar structural params.
 * Every value stays in a readable band so no seed breaks a chart. */
export function geometryFromSeed(seed: number) {
  const rand = mulberry32(Math.round(seed) ^ 0x27d4eb2f)
  return {
    barGap: 0.15 + rand() * 0.25,
    barEdge: 0.08 + rand() * 0.2,
    glowSize: 0.08 + rand() * 0.16,
    hoverStrength: 0.7 + rand() * 0.6,
    dimOpacity: 0.2 + rand() * 0.25,
    innerRadius: rand() * 0.6,
    rings: 3 + Math.floor(rand() * 4),
    popOut: 4 + Math.floor(rand() * 6),
    rimWidth: 1 + rand() * 1.2,
    falloff: 0.3 + rand() * 0.4,
  }
}

export type SpinnerParams = {
  shape: number
  flow: number
  speed: number
  dir: 1 | -1
  arc: number
  segments: number
  spokes: number
  innerRatio: number
  taper: number
  waveCount: number
}

export const SPINNER_DEFAULT: SpinnerParams = {
  shape: 0,
  flow: 0,
  speed: 0.00064,
  dir: 1,
  arc: 0.75,
  segments: 0,
  spokes: 0,
  innerRatio: 0.5,
  taper: 0.8,
  waveCount: 3,
}

export function spinnerFromSeed(seed: number): SpinnerParams {
  const rand = xorshift32(Math.round(seed) ^ 0x2f72b4a1)
  return {
    shape: Math.floor(rand() * 3),
    flow: Math.floor(rand() * 3),
    speed: 0.0004 + rand() * 0.0009,
    dir: rand() < 0.5 ? 1 : -1,
    arc: 0.3 + rand() * 0.6,
    segments: Math.floor(rand() ** 1.4 * 13),
    spokes: Math.floor(rand() ** 2 * 7),
    innerRatio: 0.3 + rand() * 0.45,
    taper: 0.3 + rand() * 0.7,
    waveCount: 2 + Math.floor(rand() * 3),
  }
}

const SEED_VARIANTS = ["gradient", "dotted", "hatched", "solid"] as const
const SEED_DIRECTIONS = ["up", "down", "left", "right"] as const

/** Master primitive seeder — one integer, one complete personality for any
 * kit component. Components pick the fields they need; explicit props win. */
export function kitFromSeed(seed: number) {
  const rand = mulberry32(Math.round(seed) ^ 0x165667b1)
  return {
    hue: Math.floor(rand() * 360),
    variant: SEED_VARIANTS[Math.floor(rand() * 4)],
    direction: SEED_DIRECTIONS[Math.floor(rand() * 4)],
    cell: 2 + Math.floor(rand() * 3),
    opacity: 0.5 + rand() * 0.5,
    focusY: rand(),
    fade: 40 + Math.floor(rand() * 120),
  }
}

/** Seeded reveal — how the dither fill draws in. jitter=0 is a clean sweep;
 * higher jitter dissolves the edge so the fill *develops* like a photo.
 * reverse flips the sweep direction. Half of all seeds stay clean. */
export function revealFromSeed(seed: number): { reverse: boolean; jitter: number } {
  const rand = mulberry32(Math.round(seed) ^ 0x2545f491)
  return {
    reverse: rand() < 0.35,
    jitter: rand() < 0.5 ? 0 : 0.15 + rand() * 0.5,
  }
}

/** Cheap stable per-column noise in [0,1) — deterministic for (x, seed),
 * one multiply, no allocation. Used to scatter the reveal edge per frame. */
export function colNoise(x: number, seed: number): number {
  return (((x + seed) * 2654435761) >>> 0) / 4294967296
}

/** Seeded sparkle character — twinkle frequency, brightness range, star
 * burst threshold, and crosshair opacity. The personality of the live edge. */
export function sparklesFromSeed(seed: number) {
  const rand = mulberry32(Math.round(seed) ^ 0x5bd1e995)
  return {
    twinkleFreq: 0.2 + rand() * 0.4, // how fast stars wink (default 0.35)
    starBase: 0.6 + rand() * 0.25, // base brightness multiplier (default 0.7)
    starRange: 0.2 + rand() * 0.2, // brightness variance with intensity (default 0.3)
    burstThreshold: 0.8 + rand() * 0.15, // tw value above which a star bursts its cross (default 0.9)
    starCrossAlpha: 0.4 + rand() * 0.4, // brightness of the burst cross (default 0.6)
    crosshairAlpha: 0.4 + rand() * 0.3, // crosshair column opacity (default 0.55)
  }
}

/** A live-edge effect is NOT a preset — it's a point in a continuous motion
 * space. Every field blends: near-zero drift + high twinkle reads as classic
 * sparkle; strong +driftY + low twinkle becomes rain; edge-locked flow + long
 * trail becomes a comet; and the space between/beyond is infinite novel motion.
 * The same seed always lands the same point, so it stays reproducible. */
export type EdgeEffectParams = {
  driftX: number // horizontal velocity (cells per time unit)
  driftY: number // vertical velocity
  gravity: number // acceleration added to driftY over a particle's life
  twinkleAmt: number // 0–1: how much brightness oscillates
  twinkleFreq: number // oscillation speed
  trail: number // trailing pixels behind the motion vector
  spread: number // 0–1: vertical scatter within the fill band
  flow: number // 0 = ride the value line, 1 = fill the whole band
  burst: number // 0–1: cross-burst intensity at brightness peaks
  brightBase: number // baseline brightness
  speed: number // global time multiplier
}

/** A particle glyph — the pixel stamp drawn at each particle. Built
 * generatively: a lit core plus N rays at seeded angles and lengths, so the
 * shape ranges from a single dot to a plus, an x, a streak, or a many-armed
 * asterisk. Each pixel carries a relative alpha so arms fade outward. */
export type Glyph = { dx: number; dy: number; a: number }[]

export function glyphFromSeed(seed: number): Glyph {
  const rand = mulberry32(Math.round(seed) ^ 0x68e31da4)
  const out: Glyph = [{ dx: 0, dy: 0, a: 1 }] // core pixel
  const rays = Math.floor(rand() ** 1.3 * 6) // 0..5, skewed toward fewer
  if (rays === 0) return out
  const len = 1 + Math.floor(rand() * 2) // 1..2
  const angle0 = rand() * Math.PI * 2
  const symmetric = rand() < 0.7 // most glyphs are radially even
  const seen = new Set<string>(["0,0"])
  for (let r = 0; r < rays; r++) {
    const ang = symmetric
      ? angle0 + (r / rays) * Math.PI * 2
      : angle0 + rand() * Math.PI * 2
    for (let l = 1; l <= len; l++) {
      const dx = Math.round(Math.cos(ang) * l)
      const dy = Math.round(Math.sin(ang) * l)
      const k = `${dx},${dy}`
      if (seen.has(k)) continue
      seen.add(k)
      out.push({ dx, dy, a: 1 - (l / (len + 1)) * 0.55 })
    }
  }
  return out
}

/** Sample a generative edge effect from a seed — an infinite space of motions,
 * not a choice among presets. Ranges are bounded so no seed is unreadable. */
export function effectFromSeed(seed: number): EdgeEffectParams {
  const rand = mulberry32(Math.round(seed) ^ 0x7f4a7c15)
  // Bias drift toward zero (most seeds are gentle) with an occasional strong
  // current — cube keeps the middle calm and the tails lively.
  const signed = () => {
    const u = rand() * 2 - 1
    return u * u * u
  }
  return {
    driftX: signed() * 2.4,
    driftY: signed() * 2.4,
    gravity: signed() * 0.8,
    twinkleAmt: rand() ** 1.5, // skew toward less twinkle
    twinkleFreq: 0.08 + rand() * 0.5,
    trail: Math.round(rand() ** 2 * 16), // usually short, sometimes long
    spread: 0.15 + rand() * 0.85,
    flow: rand(),
    burst: rand() ** 2, // bursts are rare
    brightBase: 0.4 + rand() * 0.45,
    speed: 0.5 + rand() * 1.3,
  }
}

/** A 4×4 dither threshold matrix — same shape as BAYER, but the values can
 * be jittered per-seed so each integer produces a unique scatter pattern. */
export type DitherMatrix = number[][]

/** Generate a 4×4 dither matrix from a seed — the same ordered structure as
 * Bayer but with per-cell threshold jitter, so each seed scatters pixels
 * differently while staying recognizably dithered (not random noise).
 * The jitter amount is seed-derived: some seeds stay near-classic, others
 * lean organic. Always clamped to [0, 1). */
export function matrixFromSeed(seed: number): DitherMatrix {
  const s = Math.round(seed)
  const rand = mulberry32(s ^ 0x1b873593)
  const jitter = 0.02 + rand() * 0.13
  // Per-cell noise — stable per (seed, cell), so the same seed always paints
  // the same scatter on every surface that uses it.
  return BAYER.map((row, y) =>
    row.map((v, x) => {
      const r = mulberry32(s * 7919 + y * 17 + x * 31 + 7)
      return Math.max(0, Math.min(1, v + (r() - 0.5) * jitter * 2))
    })
  )
}

// Matrix memo — keyed alongside the texture so per-column paint loops don't
// regenerate per pixel.
let lastMatrixKey: VariantInput | string = ""
let lastMatrix: DitherMatrix = BAYER

/** Resolve the dither matrix from a variant input: numbers seed it, names and
 * configs fall back to the classic Bayer 4×4. */
export function resolveMatrix(input: VariantInput): DitherMatrix {
  if (typeof input === "string") return BAYER
  if (input !== lastMatrixKey) {
    lastMatrixKey = input
    lastMatrix = typeof input === "number" ? matrixFromSeed(input) : BAYER
  }
  return lastMatrix
}

// Single-slot memo — the paint loops resolve per column, per frame.
let lastTexKey: VariantInput | string = ""
let lastTex: Required<TextureConfig> = TEXTURE_PRESET.gradient

/** Resolve a preset name, a seed number, or a custom config to the full texture. */
export function resolveTexture(input: VariantInput): Required<TextureConfig> {
  if (typeof input === "string") return TEXTURE_PRESET[input] ?? TEXTURE_PRESET.gradient
  if (input !== lastTexKey) {
    lastTexKey = input
    lastTex =
      typeof input === "number"
        ? textureFromSeed(input)
        : { ...TEXTURE_PRESET.gradient, ...input }
  }
  return lastTex
}

export type PaintTarget = CanvasRenderingContext2D | RasterBuffer

function paintPixel(target: PaintTarget, x: number, y: number, color: Rgb, alpha: number): void {
  if ("data" in target) blendRasterPixel(target, x, y, color, alpha)
  else {
    target.fillStyle = rgb(color, 1, alpha)
    target.fillRect(x, y, 1, 1)
  }
}

export type PaintOpts = {
  variant: VariantInput
  intensity: number // 0–1 hover lift
  dim: number // selection dim multiplier (0.3 dimmed, 1 normal)
  stacked: boolean // denser + solid floor when layers stack
  sparse?: number // raise the dither threshold (thin out) — front layers
  matrix?: DitherMatrix // dither threshold pattern (defaults to BAYER)
}

// Colour vs opacity — the guiding rule for the whole engine:
//
//   Work with opacities instead of different shades of the same color. This will
//   make sure it looks good on both light and dark mode.
//
// So every pixel is the series' single `fill` colour and we vary only its alpha.
// The old lighter `line` / near-white `star` shades were dropped: a shade that
// pops on a dark background reads as a jarring bright speck on a light one, while
// the same colour at a lower opacity simply blends into whatever sits behind it.

/**
 * Fill one backing-canvas column `x` from row `top` down to `floor` with the
 * ordered-dither scatter — solid at the floor, dissolving upward so it *fades
 * out toward the value line* — then cap the top with a soft border outline in
 * the series colour. Density drives opacity (see the note above), so the fade
 * reads correctly against both light and dark backgrounds. The single source of
 * the dither look across area / line / bar.
 */
export function paintColumn(
  octx: PaintTarget,
  x: number,
  top: number,
  floor: number,
  seed: Seed,
  { variant, intensity, dim, stacked, sparse = 0, matrix }: PaintOpts
) {
  const tex = resolveTexture(variant)
  const mat = matrix ?? resolveMatrix(variant)
  const t = Math.round(top)
  const f = Math.round(floor)
  const depth = f - t
  if (depth <= 0) {
    paintPixel(octx, x, t, seed.fill, tex.edge * dim)
    return
  }
  const bias = tex.density + (stacked ? 0.2 : 0) - sparse
  for (let y = t; y < f; y++) {
    // Inverted falloff: 0 at the top line, 1 at the floor — dense at the
    // bottom, thinning as it rises toward the outline. `ramp` scales how much
    // of that fade applies (0 = flat, 1 = full fade).
    const raw = (y - t) / depth
    let density = 1 - tex.ramp * (1 - raw)
    if (stacked) density = 0.5 + 0.5 * density
    if (tex.hatch >= 2 && (((x + y) % tex.hatch) + tex.hatch) % tex.hatch >= tex.hatch / 2)
      continue
    const lit = density > mat[y & 3][x & 3] - 0.1 * intensity - bias
    // `gaps` keeps real holes for the open dotted look; otherwise unlit cells
    // drop to a faint tier of the same colour so the background never bleeds
    // through as stark white.
    if (tex.gaps && !lit) continue
    // Density → alpha (see the colour-vs-opacity note above).
    const k = (tex.alphaFloor + density * tex.alphaRange) * (1 + tex.intensityLift * intensity)
    const alpha = clamp01((lit ? k : k * tex.offTier) * dim)
    paintPixel(octx, x, y, seed.fill, alpha)
  }
  // Top border outline — the shape's edge now that the fill fades out here.
  // Kept just under full opacity, with a faint feather row beneath, so it reads
  // as a soft edge rather than a hard line floating over the fade.
  if (tex.edge > 0) {
    paintPixel(octx, x, t, seed.fill, tex.edge * dim)
    if (depth > 1) paintPixel(octx, x, t + 1, seed.fill, tex.edge * 0.5 * dim)
  }
}

/** Linear-resample a per-index fraction array to `cols` columns. */
export function resample(src: number[], cols: number): number[] {
  const out = new Array<number>(cols)
  const last = Math.max(src.length - 1, 1)
  for (let c = 0; c < cols; c++) {
    const t = (c / Math.max(cols - 1, 1)) * last
    const i = Math.floor(t)
    const f = t - i
    const a = src[i] ?? 0
    const b = src[Math.min(i + 1, src.length - 1)] ?? a
    out[c] = a + (b - a) * f
  }
  return out
}

/** Backing-canvas resolution for a plot rect — low-res, scaled up `pixelated`.
 * `cell` is the css px per dither cell: bigger = chunkier pixels. */
export function backingSize(width: number, height: number, cell: number = CELL) {
  const c = Math.max(1, cell)
  return {
    cols: Math.min(MAX_COLS, Math.max(8, Math.round(width / c))),
    rows: Math.min(MAX_ROWS, Math.max(8, Math.round(height / c))),
  }
}

// Bloom — a real "shader" glow that comes from the colours themselves: a blurred
// copy of the rendered canvas, composited additively (`plus-lighter`) so each
// hue blooms in its own colour instead of a grey wash. Lives on a second canvas
// layered over the crisp one (which stays sharp/pixelated).
export type BloomLevel = "off" | "low" | "high" | "aura"
export type BloomBlend = "plus-lighter" | "screen" | "lighten"
export type BloomConfig = {
  blur: number // px
  brightness: number // 1 = none
  opacity: number // 0–1
  /** Saturation of the glow — >1 keeps it vividly in the dither's colour
   * instead of washing toward white. */
  saturate?: number
  blend?: BloomBlend // additive by default
}
/** A preset name, a full config, or "off". */
export type BloomInput = BloomLevel | BloomConfig | number

const PRESET: Record<Exclude<BloomLevel, "off">, BloomConfig> = {
  low: { blur: 3, brightness: 1.35, opacity: 0.7, saturate: 1.4 },
  high: { blur: 5, brightness: 1.5, opacity: 0.78, saturate: 1.5 },
  aura: { blur: 15, brightness: 2.9, opacity: 0.1, saturate: 3 },
}

export type BloomStyle = {
  filter: string
  opacity: number
  mixBlendMode: BloomBlend
  imageRendering: "auto"
}

/** Style for the bloom *layer* canvas (a blurred, additive copy). null when off. */
export function bloomLayerStyle(
  input: BloomInput,
  active: boolean
): BloomStyle | null {
  if (!active || input === "off") return null
  const cfg =
    typeof input === "string"
      ? PRESET[input]
      : typeof input === "number"
        ? bloomFromSeed(input)
        : input
  return {
    filter: `blur(${cfg.blur}px) brightness(${cfg.brightness}) saturate(${cfg.saturate ?? 1})`,
    opacity: cfg.opacity,
    mixBlendMode: cfg.blend ?? "plus-lighter",
    imageRendering: "auto",
  }
}

// Easing — gentle start + soft settle so entrances don't feel linear.
export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
export const easeOutCubic = (t: number) => 1 - (1 - t) ** 3
export const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t)

/** Selectable entrance easing — one name every canvas resolves the same way. */
export type EasingName = "linear" | "ease-out" | "ease-in-out"
export const EASINGS: Record<EasingName, (t: number) => number> = {
  linear: (t) => t,
  "ease-out": easeOutCubic,
  "ease-in-out": easeInOutCubic,
}

/** An easing is a preset name or a CSS-style cubic-bezier(x1, y1, x2, y2) —
 * y outside [0,1] gives real overshoot/anticipation, like any animator tool. */
export type BezierPoints = readonly [number, number, number, number]
export type EasingInput = EasingName | BezierPoints | number

/** cubic-bezier(x1,y1,x2,y2) solver — Newton + bisection fallback, the same
 * approach browsers use for CSS timing functions. */
export function cubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): (t: number) => number {
  const ax = 3 * x1 - 3 * x2 + 1
  const bx = 3 * x2 - 6 * x1
  const cx = 3 * x1
  const ay = 3 * y1 - 3 * y2 + 1
  const by = 3 * y2 - 6 * y1
  const cy = 3 * y1
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t
  const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx
  const solve = (x: number) => {
    let t = x
    for (let i = 0; i < 8; i++) {
      const err = sampleX(t) - x
      if (Math.abs(err) < 1e-6) return t
      const d = slopeX(t)
      if (Math.abs(d) < 1e-6) break
      t -= err / d
    }
    let lo = 0
    let hi = 1
    t = x
    while (lo < hi) {
      const err = sampleX(t) - x
      if (Math.abs(err) < 1e-6) return t
      if (err > 0) hi = t
      else lo = t
      t = (lo + hi) / 2
      if (hi - lo < 1e-6) break
    }
    return t
  }
  return (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : sampleY(solve(x)))
}

// Tiny memo — canvas loops resolve the easing every frame; charts use one
// curve at a time, so a single-slot cache removes the per-frame allocation.
let lastBezierKey = ""
let lastBezierFn: (t: number) => number = EASINGS.linear

/** Resolve a preset name or bezier points to its timing function. */
export function resolveEasing(input: EasingInput): (t: number) => number {
  if (typeof input === "string") return EASINGS[input] ?? EASINGS["ease-in-out"]
  const pts = typeof input === "number" ? easingFromSeed(input) : input
  const key = pts.join(",")
  if (key !== lastBezierKey) {
    lastBezierKey = key
    lastBezierFn = cubicBezier(pts[0], pts[1], pts[2], pts[3])
  }
  return lastBezierFn
}

/** Whether the OS asks for reduced motion (snap + steady stars). */
export function prefersReducedMotion() {
  return (
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false
  )
}
