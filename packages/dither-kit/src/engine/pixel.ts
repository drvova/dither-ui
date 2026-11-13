// Standalone pixel primitives for the non-chart Dither Kit pieces (avatar,
// gradient). Deliberately free of the chart engine so those items install
// without `core` — only palette.ts is shared. The Bayer matrix and bloom
// presets mirror dither-paint.ts so everything reads as one texture.

import { type DitherColor, hexToRgb, isDitherColor, PALETTE, type Rgb } from "./palette"

// 4×4 ordered (Bayer) matrix, normalized to 0–1 thresholds — the same matrix
// the charts dither with.
export const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((row) => row.map((v) => (v + 0.5) / 16))

/** The print screens a surface can threshold through: the Bayer matrix, or a
 * screen a printer would use. Each is a 4x4 of the 16 ranks, so any painter
 * reading `matrix[y & 3][x & 3]` takes one; a density lights its ranks in
 * order. `line` grows one horizontal line per four rows, `diagonal` one
 * falling (top-left to bottom-right) hatch line, `dot` a clustered dot from
 * the tile's centre, `cross` the falling hatch, then the rising one, then
 * the rest in Bayer order. */
export type ScreenKind = "bayer" | "line" | "diagonal" | "dot" | "cross"
const ranks = (rows: number[][]) => rows.map((row) => row.map((v) => (v + 0.5) / 16))
export const SCREENS: Readonly<Record<ScreenKind, number[][]>> = {
  bayer: BAYER4,
  line: ranks([
    [8, 10, 9, 11],
    [0, 2, 1, 3],
    [4, 6, 5, 7],
    [12, 14, 13, 15],
  ]),
  diagonal: ranks([
    [0, 4, 12, 8],
    [10, 2, 6, 14],
    [13, 9, 1, 5],
    [7, 15, 11, 3],
  ]),
  dot: ranks([
    [12, 5, 6, 13],
    [4, 0, 1, 7],
    [11, 3, 2, 8],
    [15, 10, 9, 14],
  ]),
  cross: ranks([
    [0, 12, 8, 4],
    [14, 2, 6, 10],
    [9, 5, 1, 13],
    [7, 11, 15, 3],
  ]),
}
export const SCREEN_KINDS = Object.keys(SCREENS) as ScreenKind[]

export const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t)

/** 32-bit FNV-1a hash — turns any string seed into a stable uint32. */
export function fnv1a(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Tiny deterministic PRNG (xorshift32) — returns floats in [0, 1). */
export function xorshift32(seed: number): () => number {
  let s = seed || 0x9e3779b9
  return () => {
    s ^= s << 13
    s >>>= 0
    s ^= s >>> 17
    s ^= s << 5
    s >>>= 0
    return s / 0x100000000
  }
}

/** A named palette colour, a raw hue (0–360), or a hex string (#rrggbb). */
export type PixelColor = DitherColor | number | string

/** Hue (0–360) → an rgb fill tuned to sit alongside the chart palette. */
export function hueFill(hue: number): Rgb {
  const h = ((hue % 360) + 360) % 360
  const s = 0.85
  const l = 0.58
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x]
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

/** Resolve a {@link PixelColor} to its rgb fill. */
export function fillOf(color: PixelColor): Rgb {
  if (typeof color === "number") return hueFill(color)
  if (isDitherColor(color)) return PALETTE[color].fill
  return hexToRgb(color)
}

// Bloom — same recipe as the charts: a blurred copy of the crisp canvas,
// composited additively so the glow stays in the dither's own colour.
export type PixelBloom = "off" | "low" | "high" | "aura"
export type PixelBloomConfig = {
  blur: number
  brightness: number
  opacity: number
  saturate?: number
}
/** A preset name or a fully custom glow config. */
export type PixelBloomInput = PixelBloom | PixelBloomConfig | number

const BLOOM_PRESET: Record<Exclude<PixelBloom, "off">, PixelBloomConfig> = {
  low: { blur: 3, brightness: 1.35, opacity: 0.7, saturate: 1.4 },
  high: { blur: 5, brightness: 1.5, opacity: 0.78, saturate: 1.5 },
  aura: { blur: 15, brightness: 2.9, opacity: 0.1, saturate: 3 },
}

export type PixelBloomStyle = {
  filter: string
  opacity: number
  mixBlendMode: "plus-lighter"
  imageRendering: "auto"
}

/** Style for the bloom layer canvas. null when off. */
/** Seeded bloom — mirrors dither-paint's bloomFromSeed exactly (same PRNG,
 * same xor, same ranges) so one seed glows identically in both engines. */
function pixelBloomFromSeed(seed: number): PixelBloomConfig {
  let a = (Math.round(seed) ^ 0x9e3779b9) >>> 0
  const rand = () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    blur: 2 + rand() * 10,
    brightness: 1.2 + rand() * 1.2,
    opacity: 0.25 + rand() * 0.55,
    saturate: 1.2 + rand() * 1.6,
  }
}

/** Seeded dither matrix — mirrors dither-paint's matrixFromSeed exactly (same
 * PRNG, same xor, same BAYER baseline, same jitter ranges) so one seed
 * scatters pixels identically in both engines. */
export function pixelMatrixFromSeed(seed: number): number[][] {
  return jitterMatrix(BAYER4, seed)
}

/** A screen's matrix, seeded the way `pixelMatrixFromSeed` seeds the Bayer
 * one when there is a seed: `screenMatrix("bayer", s)` is that matrix. */
export function screenMatrix(screen: ScreenKind, seed?: number): number[][] {
  const base = SCREENS[screen] ?? BAYER4
  return seed === undefined ? base : jitterMatrix(base, seed)
}

/** Every threshold moved by the seed's own jitter, per cell. */
function jitterMatrix(base: number[][], seed: number): number[][] {
  const s = Math.round(seed)
  let a = (s ^ 0x1b873593) >>> 0
  const rand = () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const jitter = 0.02 + rand() * 0.13
  return base.map((row, y) =>
    row.map((v, x) => {
      let b = (s * 7919 + y * 17 + x * 31 + 7) >>> 0
      const r = () => {
        b |= 0
        b = (b + 0x6d2b79f5) | 0
        let t = Math.imul(b ^ (b >>> 15), 1 | b)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
      }
      return Math.max(0, Math.min(1, v + (r() - 0.5) * jitter * 2))
    }),
  )
}

export function pixelBloomStyle(bloom: PixelBloomInput): PixelBloomStyle | null {
  if (bloom === "off") return null
  const cfg =
    typeof bloom === "string" ? BLOOM_PRESET[bloom] : typeof bloom === "number" ? pixelBloomFromSeed(bloom) : bloom
  return {
    filter: `blur(${cfg.blur}px) brightness(${cfg.brightness}) saturate(${cfg.saturate ?? 1})`,
    opacity: cfg.opacity,
    mixBlendMode: "plus-lighter",
    imageRendering: "auto",
  }
}

/** Whether the OS asks for reduced motion (skip entrances). */
export function pixelPrefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false
}
