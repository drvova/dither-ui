// Standalone pixel primitives for the non-chart Dither Kit pieces (avatar,
// gradient). Deliberately free of the chart engine so those items install
// without `core` — only palette.ts is shared. The Bayer matrix and bloom
// presets mirror dither-paint.ts so everything reads as one texture.

import { type DitherColor, hexToRgb, PALETTE, type Rgb } from "./palette"

// 4×4 ordered (Bayer) matrix, normalized to 0–1 thresholds — the same matrix
// the charts dither with.
export const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((row) => row.map((v) => (v + 0.5) / 16))

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
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ]
}

/** Resolve a {@link PixelColor} to its rgb fill. */
export function fillOf(color: PixelColor): Rgb {
  if (typeof color === "number") return hueFill(color)
  if (color in PALETTE) return PALETTE[color as DitherColor].fill
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

export function pixelBloomStyle(bloom: PixelBloomInput): PixelBloomStyle | null {
  if (bloom === "off") return null
  const cfg =
    typeof bloom === "string"
      ? BLOOM_PRESET[bloom]
      : typeof bloom === "number"
        ? pixelBloomFromSeed(bloom)
        : bloom
  return {
    filter: `blur(${cfg.blur}px) brightness(${cfg.brightness}) saturate(${cfg.saturate ?? 1})`,
    opacity: cfg.opacity,
    mixBlendMode: "plus-lighter",
    imageRendering: "auto",
  }
}

/** Whether the OS asks for reduced motion (skip entrances). */
export function pixelPrefersReducedMotion(): boolean {
  return (
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false
  )
}
